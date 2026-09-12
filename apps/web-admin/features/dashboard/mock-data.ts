export type DashboardSession = {
  id: string
  title: string
  type: string
  startTime: string
  endTime: string
  location: string
  faculty: string
  timeLabel: string
  isNow: boolean
}

export type DashboardActivity = {
  id: string
  title: string
  description: string
  time: string
  type: 'import' | 'subject' | 'enrollment' | 'faculty'
}

export type AttendanceItem = {
  day: string
  percentage: number
}

export type DashboardBatch = {
  id: string
  name: string
  initial: string
  status: 'Active' | 'Upcoming'
  program: string
  year: string
  students: number
  subjects: number
  faculty: number
  sessions: number
}

export const mockBatches: DashboardBatch[] = [
  {
    id: 'bca-2026',
    name: 'BCA 2026',
    initial: 'B',
    status: 'Active',
    program: 'Bachelor of Computer Applications',
    year: '2026–27',
    students: 40,
    subjects: 6,
    faculty: 6,
    sessions: 4,
  },
  {
    id: 'mca-2025',
    name: 'MCA 2025',
    initial: 'M',
    status: 'Upcoming',
    program: 'Master of Computer Applications',
    year: '2025–26',
    students: 28,
    subjects: 8,
    faculty: 5,
    sessions: 2,
  },
]

export const mockSessions: DashboardSession[] = [
  {
    id: 'session-1',
    title: 'Java Programming',
    type: 'Lecture',
    startTime: '9:00 AM',
    endTime: '10:00 AM',
    location: 'Lab 101',
    faculty: 'Rahul Sharma',
    timeLabel: 'NOW',
    isNow: true,
  },
  {
    id: 'session-2',
    title: 'Database Management',
    type: 'Lecture',
    startTime: '10:30 AM',
    endTime: '11:30 AM',
    location: 'Room 202',
    faculty: 'Priya Singh',
    timeLabel: '10:30',
    isNow: false,
  },
  {
    id: 'session-3',
    title: 'Python Programming',
    type: 'Lab',
    startTime: '12:00 PM',
    endTime: '1:00 PM',
    location: 'Lab 103',
    faculty: 'Arjun Mehta',
    timeLabel: '12:00',
    isNow: false,
  },
  {
    id: 'session-4',
    title: 'Computer Networks',
    type: 'Lecture',
    startTime: '3:00 PM',
    endTime: '4:00 PM',
    location: 'Room 105',
    faculty: 'Neha Verma',
    timeLabel: '3:00',
    isNow: false,
  },
]

export const mockActivities: DashboardActivity[] = [
  {
    id: 'activity-1',
    title: 'Student import completed',
    description: '38 students added to BCA 2026',
    time: '10 minutes ago',
    type: 'import',
  },
  {
    id: 'activity-2',
    title: 'New subject created',
    description: 'Python Programming (CS105)',
    time: '1 hour ago',
    type: 'subject',
  },
  {
    id: 'activity-3',
    title: 'Student enrolled',
    description: 'Priya Patel joined BCA 2026',
    time: '2 hours ago',
    type: 'enrollment',
  },
  {
    id: 'activity-4',
    title: 'Faculty member added',
    description: 'Dr. Amit Shah',
    time: 'Yesterday',
    type: 'faculty',
  },
]

export const mockAttendance: AttendanceItem[] = [
  {
    day: 'Mon',
    percentage: 82,
  },
  {
    day: 'Tue',
    percentage: 88,
  },
  {
    day: 'Wed',
    percentage: 84,
  },
  {
    day: 'Thu',
    percentage: 92,
  },
  {
    day: 'Fri',
    percentage: 90,
  },
  {
    day: 'Sat',
    percentage: 96,
  },
  {
    day: 'Today',
    percentage: 98,
  },
]