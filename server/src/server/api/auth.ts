import crypto from 'crypto';
import express from 'express';
import {
  discovery,
  buildAuthorizationUrl,
  authorizationCodeGrant,
  randomState,
  randomNonce,
  type Configuration,
} from 'openid-client';

import db from '../../database/db';
import { verifyPassword } from '../helpers/passwords';
import { signAccessToken, signRefreshToken, verifyRefreshToken, TokenPayload } from '../helpers/jwt';
import { setAuthCookies, clearAuthCookies } from '../helpers/cookies';
import { requireAuth } from '../middlewares';

// Lazily-built OIDC config — only initialised when Entra env vars are present
let entraConfigPromise: Promise<Configuration> | null = null;

async function buildEntraConfig(): Promise<Configuration> {
  const { ENTRA_CLIENT_ID, ENTRA_CLIENT_SECRET, ENTRA_TENANT_ID } = process.env;
  if (!ENTRA_CLIENT_ID || !ENTRA_CLIENT_SECRET || !ENTRA_TENANT_ID) {
    throw new Error('Entra environment variables are not configured');
  }
  return discovery(
    new URL(`https://login.microsoftonline.com/${ENTRA_TENANT_ID}/v2.0`),
    ENTRA_CLIENT_ID,
    ENTRA_CLIENT_SECRET,
  );
}

function getEntraConfig(): Promise<Configuration> {
  if (!entraConfigPromise) {
    entraConfigPromise = buildEntraConfig();
  }
  return entraConfigPromise;
}

const authRouter = express.Router();

const OIDC_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const, // lax required for redirect-back flows
  secure: process.env.NODE_ENV === 'production',
  maxAge: 10 * 60 * 1000, // 10 minutes — just long enough for the OIDC round-trip
  path: '/',
};

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * GET /api/v1/auth/config
 * Returns which auth methods are enabled. Public endpoint used by the frontend login page.
 */
authRouter.get('/config', (_req, res) => {
  res.json({
    local: true,
    entra: !!(process.env.ENTRA_CLIENT_ID && process.env.ENTRA_CLIENT_SECRET && process.env.ENTRA_TENANT_ID),
  });
});

/**
 * POST /api/v1/auth/login
 * Local username/password login. Sets httpOnly access_token and refresh_token cookies.
 */
authRouter.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' });
      return;
    }

    const user = await db('user')
      .where('username', username)
      .where('auth_provider', 'LOCAL')
      .first();

    if (!user || !(await verifyPassword(password, user.password_hash))) {
      res.status(401).json({ message: 'Invalid username or password' });
      return;
    }

    if (!user.is_active) {
      res.status(403).json({ message: 'Account is inactive' });
      return;
    }

    const payload: TokenPayload = {
      userId: user.id,
      tenantId: user.tenant_id,
      isSuperAdmin: user.is_super_admin,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db('user_refresh_token').insert({
      user_id: user.id,
      tenant_id: user.tenant_id,
      token_hash: hashToken(refreshToken),
      expires_at: expiresAt,
    });

    setAuthCookies(res, accessToken, refreshToken);
    res.json({ message: 'Login successful' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/logout
 * Deletes the refresh token from DB and clears cookies.
 */
authRouter.post('/logout', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      await db('user_refresh_token')
        .where('token_hash', hashToken(refreshToken))
        .delete();
    }

    clearAuthCookies(res);
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/refresh
 * Validates the refresh token cookie and issues a new access token (+ rotated refresh token).
 */
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      res.status(401).json({ message: 'No refresh token' });
      return;
    }

    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      clearAuthCookies(res);
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    const tokenHash = hashToken(refreshToken);
    const stored = await db('user_refresh_token')
      .where('token_hash', tokenHash)
      .where('expires_at', '>', new Date())
      .first();

    if (!stored) {
      clearAuthCookies(res);
      res.status(401).json({ message: 'Refresh token revoked or expired' });
      return;
    }

    // Rotate: delete old, issue new
    await db('user_refresh_token').where('token_hash', tokenHash).delete();

    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db('user_refresh_token').insert({
      user_id: stored.user_id,
      tenant_id: stored.tenant_id,
      token_hash: hashToken(newRefreshToken),
      expires_at: expiresAt,
    });

    setAuthCookies(res, newAccessToken, newRefreshToken);
    res.json({ message: 'Token refreshed' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated user's profile.
 */
authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await db('user')
      .where('id', req.user!.userId)
      .where('is_active', true)
      .first();

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      username: user.username,
      title: user.title,
      isActive: user.is_active,
      isSuperAdmin: user.is_super_admin,
      authProvider: user.auth_provider,
      tenantId: user.tenant_id,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/auth/entra/redirect
 * Starts the Entra OIDC flow. Stores state/nonce in short-lived cookies and redirects to Microsoft.
 */
authRouter.get('/entra/redirect', async (_req, res, next) => {
  try {
    const config = await getEntraConfig();
    const redirectUri = process.env.ENTRA_REDIRECT_URI!;

    const state = randomState();
    const nonce = randomNonce();

    res.cookie('entra_state', state, OIDC_COOKIE_OPTS);
    res.cookie('entra_nonce', nonce, OIDC_COOKIE_OPTS);

    const authUrl = buildAuthorizationUrl(config, {
      redirect_uri: redirectUri,
      scope: 'openid profile email',
      state,
      nonce,
    });

    res.redirect(authUrl.href);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/auth/entra/callback
 * Handles the Entra OIDC callback, upserts the user, and sets auth cookies.
 */
authRouter.get('/entra/callback', async (req, res, next) => {
  try {
    const config = await getEntraConfig();
    const redirectUri = process.env.ENTRA_REDIRECT_URI!;

    const expectedState = req.cookies?.entra_state;
    const expectedNonce = req.cookies?.entra_nonce;

    res.clearCookie('entra_state');
    res.clearCookie('entra_nonce');

    if (!expectedState || !expectedNonce) {
      res.status(400).json({ message: 'Missing OIDC state or nonce' });
      return;
    }

    const callbackUrl = new URL(
      `${redirectUri}?${new URLSearchParams(req.query as Record<string, string>).toString()}`
    );

    const tokens = await authorizationCodeGrant(config, callbackUrl, {
      expectedState,
      expectedNonce,
    });

    const claims = tokens.claims();
    if (!claims) {
      res.status(400).json({ message: 'No claims in token' });
      return;
    }

    const externalId = claims.sub;
    const email = claims.email as string | undefined;
    const name = (claims.name as string | undefined) || '';
    const [firstName, ...rest] = name.split(' ');
    const lastName = rest.join(' ') || 'User';

    // Look up active tenant (Entra users belong to the active tenant)
    const tenant = await db('tenant').where('status', 'ACTIVE').first();
    if (!tenant) {
      res.status(500).json({ message: 'No active tenant found' });
      return;
    }

    // Upsert user by external_id
    let user = await db('user').where('external_id', externalId).first();

    if (!user) {
      const [newUser] = await db('user').insert({
        title: '',
        first_name: firstName || 'User',
        last_name: lastName,
        username: email || externalId,
        password_hash: '',
        auth_provider: 'ENTRA',
        external_id: externalId,
        tenant_id: tenant.id,
        is_active: true,
        is_super_admin: false,
      }).returning('*');
      user = newUser;
    }

    if (!user.is_active) {
      res.status(403).send('Account is inactive');
      return;
    }

    const payload: TokenPayload = {
      userId: user.id,
      tenantId: user.tenant_id,
      isSuperAdmin: user.is_super_admin,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db('user_refresh_token').insert({
      user_id: user.id,
      tenant_id: user.tenant_id,
      token_hash: hashToken(refreshToken),
      expires_at: expiresAt,
    });

    setAuthCookies(res, accessToken, refreshToken);
    res.redirect('/');
  } catch (err) {
    next(err);
  }
});

export default authRouter;
