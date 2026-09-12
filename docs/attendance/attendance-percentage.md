# Attendance Percentage Formula

> **Agreement Owner:** Team 06 — Attendance
> **Participating Teams:** Team 06 — Attendance, Team 09 — Student Profile, Team 12 — Admin Analytics, Team 13 — AI Assistant
> **Status:** Finalized

## 1. Overview

This document defines the official attendance percentage calculation used across the Student Attendance Portal.

All teams consuming attendance data should use the rules and formula defined here to ensure consistent attendance calculations across the Student Portal, Faculty/Admin Analytics, and AI Assistant.

For attendance status definitions and business rules, refer to [`attendance-rule.md`](./attendance-rule.md).

---

## 2. Attendance Weights

Each attendance status has a corresponding attendance value:

| Status    | Weight | Included in Denominator? |
| --------- | -----: | :----------------------: |
| `PRESENT` |  `1.0` |            Yes           |
| `LATE`    |  `0.5` |            Yes           |
| `ABSENT`  |  `0.0` |            Yes           |
| `EXCUSED` |  `0.0` |            No            |

### EXCUSED Sessions

`EXCUSED` sessions are excluded from the attendance calculation.

Therefore, an `EXCUSED` session:

* Does not increase attendance.
* Does not decrease attendance.
* Is removed from the denominator.

---

## 3. Attendance Percentage Formula

The official formula is:

$$
\text{Attendance Percentage}=\frac{\text{PRESENT} + (0.5 \times \text{LATE})}{\text{PRESENT} + \text{LATE} + \text{ABSENT}}\times 100
$$

Alternatively:

$$
\text{Attendance Percentage}=\frac{\text{PRESENT} + (0.5 \times \text{LATE})}{\text{Total Sessions} - \text{EXCUSED}}\times 100
$$

Both formulas produce the same result.

---

## 4. Calculation Example

Consider a student with:

| Status    |  Count |
| --------- | -----: |
| `PRESENT` |      6 |
| `LATE`    |      2 |
| `ABSENT`  |      1 |
| `EXCUSED` |      1 |
| **Total** | **10** |

### Step 1 — Calculate Attendance Score

```text
(6 × 1.0) + (2 × 0.5)
= 6 + 1
= 7
```

### Step 2 — Calculate Effective Sessions

```text
10 - 1 EXCUSED
= 9
```

### Step 3 — Calculate Attendance Percentage

```text
(7 / 9) × 100
= 77.777...
= 77.8%
```

**Final Attendance: 77.8%**

---

## 5. Edge Cases

### 5.1 Zero Effective Sessions

If there are no non-excused sessions:

```text
PRESENT = 0
LATE    = 0
ABSENT  = 0
EXCUSED > 0
```

The attendance percentage defaults to:

```text
100.0%
```

This prevents division by zero.

---

## 6. Rounding & Precision

The attendance percentage must be rounded to **one decimal place**.

Examples:

```text
87.54%      → 87.5%
77.777...%  → 77.8%
70.00%      → 70.0%
33.333...%  → 33.3%
```

### TypeScript

```ts
Math.round(rawPercentage * 10) / 10
```

### PostgreSQL

```sql
ROUND(raw_percentage, 1)
```

The API should return the rounded value consistently so that different clients display the same percentage.

---

## 7. Low Attendance Threshold

The attendance warning threshold is:

```text
Attendance < 75.0%
```

If the calculated attendance is strictly below `75.0%`, the system should mark the student with:

```text
ATTENDANCE_LOW
```

### Examples

| Attendance | Warning |
| ---------: | :-----: |
|    `75.0%` |    No   |
|    `74.9%` |   Yes   |
|    `70.0%` |   Yes   |
|    `80.0%` |    No   |

The `ATTENDANCE_LOW` flag may be consumed by:

* Student Portal
* Faculty/Admin Analytics
* AI Assistant

---

## 8. Reference Implementation

The following TypeScript helper represents the agreed attendance percentage calculation:

```ts
export interface AttendanceCount {
  present: number
  late: number
  absent: number
  excused: number
}

export function calculateAttendancePercentage(
  counts: AttendanceCount
): number {
  const effectiveTotal =
    counts.present +
    counts.late +
    counts.absent

  // No non-excused sessions
  if (effectiveTotal === 0) {
    return 100.0
  }

  const attendedScore =
    counts.present +
    counts.late * 0.5

  const rawPercentage =
    (attendedScore / effectiveTotal) * 100

  return Math.round(rawPercentage * 10) / 10
}
```

### Example

```ts
calculateAttendancePercentage({
  present: 6,
  late: 2,
  absent: 1,
  excused: 1,
})
```

Returns:

```text
77.8
```

---

## 9. Seed Data Baseline

The following seed data is used as a reference test case:

```text
Student: student04@college.edu

Total Sessions: 30
PRESENT: 10
LATE: 0
ABSENT: 20
EXCUSED: 0
```

Calculation:

```text
(10 + (0 × 0.5)) / 30 × 100
= 33.333...
= 33.3%
```

Expected result:

```text
33.3%
```

This value should be preserved as the reference result for integration and testing.

---

## 10. Implementation Contract

All teams integrating with the attendance system should follow:

```text
PRESENT → 1.0
LATE    → 0.5
ABSENT  → 0.0
EXCUSED → excluded
```

### Formula

```text
                   PRESENT + (LATE × 0.5)
Attendance % = ─────────────────────────────── × 100
                PRESENT + LATE + ABSENT
```

### Threshold

```text
Attendance < 75.0% → ATTENDANCE_LOW
```

### Rounding

```text
1 decimal place
```

### Zero Effective Sessions

```text
→ 100.0%
```

---

## 11. Related Documentation

* [`attendance-rule.md`](./attendance-rule.md) — Attendance statuses, LATE/EXCUSED rules, status transitions, workflow, and permissions.
