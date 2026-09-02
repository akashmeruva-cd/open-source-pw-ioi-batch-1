import type { NavItem } from '../nav-item'
import dashboard from './dashboard'
import notes from './notes'

/**
 * APPEND-ONLY REGISTRY — the sidebar equivalent of `api-student/src/modules.ts`.
 *
 * One file per nav entry in this folder, one alphabetical line below. When your
 * feature's first screen lands, add your file and uncomment your line — do not
 * add links to routes that do not exist yet, a dead nav item reads as a bug.
 */
const items: NavItem[] = [
  dashboard,
  notes,
  // announcements,  → Team 08
  // assignments,    → Team 05
  // assistant,      → Team 13
  // attendance,     → Team 06
  // materials,      → Team 04
  // timetable,      → Team 07
]

export const navItems = items.sort((a, b) => a.order - b.order)
