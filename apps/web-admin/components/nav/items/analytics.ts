import type { NavItem } from '../nav-item'

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 * Visible to both ADMIN and FACULTY (no `roles` restriction).
 */
const item: NavItem = {
  id: 'analytics',
  label: 'Analytics',
  href: '/analytics',
  glyph: '◈',
  order: 20,
}

export default item
