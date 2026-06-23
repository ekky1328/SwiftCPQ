import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  tenantId: string;
  isSuperAdmin: boolean;
}

function accessSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

function refreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET is not set');
  return secret;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, accessSecret(), { expiresIn: '15m' });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, refreshSecret(), { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, accessSecret()) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, refreshSecret()) as TokenPayload;
}

export interface RenderTokenPayload {
  proposalId: string;
  tenantId: string;
  scope: 'render';
}

export function signRenderToken(proposalId: string, tenantId: string): string {
  return jwt.sign({ proposalId, tenantId, scope: 'render' }, accessSecret(), { expiresIn: '5m' });
}

export function verifyRenderToken(token: string): RenderTokenPayload {
  const decoded = jwt.verify(token, accessSecret()) as RenderTokenPayload;
  if (decoded.scope !== 'render') throw new Error('Invalid token scope');
  return decoded;
}
