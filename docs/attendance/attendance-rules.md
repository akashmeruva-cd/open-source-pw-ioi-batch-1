# Attendance Rules

> **Agreement Owner:** Team 06 — Attendance
> **Participating Teams:** Team 06 — Attendance, Team 09 — Student Profile, Team 12 — Admin Analytics, Team 13 — AI Assistant
> **Status:** Finalized

## 1. Overview

This document defines the attendance statuses, business rules, status transitions, and permissions used by the Student Attendance Portal.

For attendance weights and percentage calculation, refer to [`attendance-percentage.md`](./attendance-percentage.md).

---

## 2. Attendance Statuses

The attendance system supports four statuses:

| Status    | Meaning                                                                                      |
| --------- | -------------------------------------------------------------------------------------------- |
| `PRESENT` | Student attended the class normally.                                                         |
| `LATE`    | Student attended the class but arrived after the allowed grace period.                       |
| `ABSENT`  | Student did not attend the class.                                                            |
| `EXCUSED` | Student's absence or late attendance was officially approved by an authorized faculty/admin. |

---

## 3. PRESENT Rule

A student is marked `PRESENT` when they attend the class within the allowed attendance period.

```text
Class starts
     │
     ▼
Student attends within allowed time
     │
     ▼
  PRESENT
```

`PRESENT` receives full attendance credit.

See [`attendance-percentage.md`](./attendance-percentage.md) for the calculation.

---

## 4. LATE Rule

A student is marked `LATE` when they attend the class but arrive after the allowed grace period.

```text
Class starts
     │
     ▼
Allowed grace period
     │
     ├── Within grace period ──► PRESENT
     │
     └── After grace period ───► LATE
```

`LATE` receives partial attendance credit.

The agreed attendance weight is:

```text
LATE → 0.5
```

---

## 5. ABSENT Rule

A student is marked `ABSENT` when they do not attend the scheduled class and do not have an approved excuse.

```text
Student does not attend
          │
          ▼
       ABSENT
```

`ABSENT` receives no attendance credit.

```text
ABSENT → 0.0
```

---

## 6. EXCUSED Rule

Students cannot directly mark themselves as `EXCUSED`.

If a student has a valid reason for being absent or late, they can submit an excuse request.

The request must be reviewed and approved by an authorized faculty/admin.

### Excuse Workflow

```text
Student
   │
   │ Submit excuse request
   ▼
Faculty/Admin
   │
   ├── Approve ──► EXCUSED
   │
   └── Reject ───► Original status remains
```

### Valid Status Transition

```text
ABSENT → Excuse Request → Approved → EXCUSED

LATE → Excuse Request → Approved → EXCUSED
```

If the request is rejected, the original attendance status remains unchanged.

---

## 7. EXCUSED Effect

An `EXCUSED` session is excluded from the attendance percentage calculation.

Therefore:

* It does not increase attendance.
* It does not decrease attendance.
* It is removed from the attendance denominator.

See [`attendance-percentage.md`](./attendance-percentage.md) for the exact calculation.

---

## 8. Attendance Status Changes

The following status transition is allowed through the approved excuse workflow:

```text
ABSENT ──────────────► EXCUSED
LATE ────────────────► EXCUSED
```

Students cannot directly change their status.

---

## 9. Student Permissions

Students can:

* View overall attendance percentage.
* View subject-wise attendance.
* View attendance history.
* View late records.
* Submit excuse requests.
* View excuse request status.

Students cannot directly modify:

```text
PRESENT
LATE
ABSENT
EXCUSED
```

---

## 10. Faculty/Admin Permissions

Authorized faculty/admin users can:

* Record attendance.
* Update attendance records according to their permissions.
* Review excuse requests.
* Approve excuse requests.
* Reject excuse requests.
* Assign `EXCUSED` after approval.

---

## 11. Status Summary

| Status    | Student Can Set Directly? | Faculty/Admin Can Set? | Percentage Effect |
| --------- | :-----------------------: | :--------------------: | ----------------- |
| `PRESENT` |             No            |           Yes          | Full credit       |
| `LATE`    |             No            |           Yes          | Half credit       |
| `ABSENT`  |             No            |           Yes          | No credit         |
| `EXCUSED` |             No            |   Yes, after approval  | Excluded          |

---

## 12. Related Documentation

* [`attendance-percentage.md`](./attendance-percentage.md) — Attendance weights, percentage formula, rounding, threshold, edge cases, and implementation reference.
