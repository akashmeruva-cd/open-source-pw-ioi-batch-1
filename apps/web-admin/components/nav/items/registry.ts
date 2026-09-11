import type { NavItem } from '../nav-item'
import overview from './overview'
import batches from './batches'
import subjects from './subjects'

/**
 * APPEND-ONLY REGISTRY — one file per nav entry in this folder, one alphabetical
 * line below. Uncomment your line when your feature's first screen lands.
 */
const items: NavItem[] = [
  overview,
  // analytics,     → Team 12
  // announcements, → Team 08
  // assignments,   → Team 05
  // attendance,    → Team 06
  batches,
  // materials,     → Team 04
  subjects,
  // timetable,     → Team 07
  // users,         → Team 11 (roles: ['ADMIN'])
]

export const navItems = items.sort((a, b) => a.order - b.order)
