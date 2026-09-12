import type { NavItem } from '../nav-item'
import dashboard from './dashboard'

import profile from './profile'

/**
 * APPEND-ONLY REGISTRY — the sidebar equivalent of `api-student/src/modules.ts`.
 *
 * One file per nav entry in this folder, one alphabetical line below. When your
 * feature's first screen lands, add your file and uncomment your line — do not
 * add links to routes that do not exist yet, a dead nav item reads as a bug.
 */
const items: NavItem[] = [
  dashboard,
  profile,
]

export const navItems = items.sort((a, b) => a.order - b.order)
