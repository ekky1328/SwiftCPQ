<template>
  <nav class="swift-sidenav">
    <div class="swift-sidenav__brand">
      <span class="bolt"><Icon name="bolt" /></span>
      <span>SwiftCPQ</span>
      <span class="ver">v0.0.1</span>
    </div>

    <div class="swift-sidenav__section">Workspace</div>
    <RouterLink
      v-for="link in workspaceLinks"
      :key="link.to"
      :to="link.to"
      class="swift-sidenav__link"
      :class="{ active: isActive(link) }"
    >
      <Icon :name="link.icon" />
      <span>{{ link.label }}</span>
      <span v-if="link.kbd" class="kbd">{{ link.kbd }}</span>
    </RouterLink>

    <template v-if="adminLinks.length">
      <div class="swift-sidenav__section">Admin</div>
      <RouterLink
        v-for="link in adminLinks"
        :key="link.to"
        :to="link.to"
        class="swift-sidenav__link"
        :class="{ active: isActive(link) }"
      >
        <Icon :name="link.icon" />
        <span>{{ link.label }}</span>
      </RouterLink>
    </template>

    <div class="swift-sidenav__footer">
      <div class="swift-sidenav__avatar">{{ initials }}</div>
      <div style="display: flex; flex-direction: column; line-height: 1.2; min-width: 0; flex: 1;">
        <span style="font-size: 12px; color: var(--text-1); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ displayName }}</span>
        <span style="font-size: 10px; color: var(--text-3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{{ subline }}</span>
      </div>
      <button
        class="swift-btn swift-btn--ghost swift-btn--icon"
        :title="mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="setMode(mode === 'dark' ? 'light' : 'dark')"
        style="font-size: 13px"
      >{{ mode === 'dark' ? '☀' : '☽' }}</button>
      <button
        class="swift-btn swift-btn--ghost swift-btn--icon"
        v-tooltip.top="'Sign out'"
        @click="auth.logout()"
      >
        <Icon name="signOut" />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../composables/useTheme';
import Icon from './Icon.vue';

interface Link {
  to: string;
  label: string;
  icon: string;
  kbd?: string;
  match?: (path: string) => boolean;
}

const auth = useAuthStore();
const route = useRoute();
const { mode, setMode } = useTheme();

const workspaceLinks = computed<Link[]>(() => {
  const links: Link[] = [
    { to: '/', label: 'Proposals', icon: 'home', kbd: 'G P', match: (p) => p === '/' || p.startsWith('/proposals') },
    { to: '/catalogue', label: 'Catalogue', icon: 'catalogue', kbd: 'G C' },
    { to: '/customers', label: 'Customers', icon: 'customers', kbd: 'G U' },
  ];
  if (auth.hasPermission?.('supplier.manage')) {
    links.push({ to: '/suppliers', label: 'Suppliers', icon: 'suppliers', kbd: 'G S' });
  }
  return links;
});

const adminLinks = computed<Link[]>(() => {
  const links: Link[] = [];
  if (auth.hasPermission?.('users.manage')) links.push({ to: '/users', label: 'Users', icon: 'users' });
  if (auth.hasPermission?.('roles.manage')) links.push({ to: '/roles', label: 'Roles', icon: 'roles' });
  if (auth.hasPermission?.('system.manage')) links.push({ to: '/settings', label: 'Settings', icon: 'settings' });
  if (auth.authMethods?.multiTenant && auth.user?.isSuperAdmin) {
    links.push({ to: '/admin/tenants', label: 'Tenants', icon: 'tenants', match: (p) => p.startsWith('/admin/tenants') });
  }
  return links;
});

function isActive(link: Link) {
  if (link.match) return link.match(route.path);
  return route.path === link.to || route.path.startsWith(link.to + '/');
}

const displayName = computed(() => {
  const u = auth.user;
  if (!u) return '';
  return `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.username || 'User';
});

const initials = computed(() => {
  const u = auth.user;
  if (!u) return '–';
  const a = (u.firstName?.[0] ?? '').toUpperCase();
  const b = (u.lastName?.[0] ?? '').toUpperCase();
  return (a + b) || (u.username?.[0] ?? '?').toUpperCase();
});

const subline = computed(() => auth.user?.username ?? '');
</script>
