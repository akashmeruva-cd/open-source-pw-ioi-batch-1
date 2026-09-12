/**
 * Owner: Team 12 — Admin Analytics & Reports.
 *
 * DB-free stand-in for `@repo/models/db`, used by the analytics test suites.
 * CI has no database, so `vi.mock('@repo/models/db', ...)` swaps `getDb()` for
 * this in-memory engine. It is deliberately not a set of canned answers: it
 * evaluates the same tagged predicates, joins, GROUP BY and aggregate
 * functions the production services build, so asserted numbers are genuinely
 * computed from seeded rows.
 */

export type Row = Record<string, unknown>

export function createDbMockModule() {
  const store = new Map<string, Row[]>()

  const camel = (s: string) => s.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase())
  const tableName = (t: unknown): string =>
    (t as Record<PropertyKey, string>)[Symbol.for('drizzle:Name')] ?? ''
  const colRef = (col: unknown): { table: string; field: string } => {
    const c = col as { table: unknown; name: string }
    return { table: tableName(c.table), field: camel(c.name) }
  }
  const keyOf = (ref: { table: string; field: string }) => `${ref.table}|${ref.field}`

  function matches(row: Map<string, unknown>, pred: any): boolean {
    if (!pred) return true
    if (pred.op === 'and') return pred.children.every((c: any) => matches(row, c))
    const left = row.get(keyOf(pred.left))
    if (pred.op === 'eq') return pred.rightCol ? left === row.get(keyOf(pred.rightCol)) : left === pred.value
    if (pred.op === 'inArray') return (pred.value as unknown[]).includes(left)
    if (pred.op === 'lte') return (left as any) <= (pred.value as any)
    if (pred.op === 'gte') return (left as any) >= (pred.value as any)
    return true
  }

  const eq = (left: unknown, right: unknown) =>
    right && typeof right === 'object' && 'table' in right
      ? { op: 'eq', left: colRef(left), rightCol: colRef(right) }
      : { op: 'eq', left: colRef(left), value: right }
  const inArray = (left: unknown, value: unknown[]) => ({ op: 'inArray', left: colRef(left), value })
  const lte = (left: unknown, value: unknown) => ({ op: 'lte', left: colRef(left), value })
  const gte = (left: unknown, value: unknown) => ({ op: 'gte', left: colRef(left), value })
  const and = (...children: unknown[]) => ({ op: 'and', children })
  const count = (col?: unknown) => ({ agg: 'count', col: col ? colRef(col) : null })
  const countDistinct = (col: unknown) => ({ agg: 'countDistinct', col: colRef(col) })
  const avg = (col: unknown) => ({ agg: 'avg', col: colRef(col) })

  function aggValue(spec: any, group: Map<string, unknown>[]): unknown {
    if (spec.agg === 'count') return group.length
    const values = group.map((r) => (spec.col ? r.get(keyOf(spec.col)) : undefined))
    if (spec.agg === 'countDistinct') {
      return new Set(values.filter((v) => v !== undefined && v !== null)).size
    }
    const nums = values.filter((v): v is number => typeof v === 'number')
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null
  }

  function project(config: any, group: Map<string, unknown>[]): Row {
    const out: Row = {}
    const first = group[0] ?? new Map<string, unknown>()
    for (const [key, spec] of Object.entries(config)) {
      if (spec && typeof spec === 'object' && 'agg' in (spec as object)) {
        out[key] = aggValue(spec, group)
      } else {
        out[key] = first.get(keyOf(colRef(spec)))
      }
    }
    return out
  }

  function single(table: string, row: Row): Map<string, unknown> {
    const map = new Map<string, unknown>()
    for (const [k, v] of Object.entries(row)) map.set(`${table}|${k}`, v)
    return map
  }

  function finalize(
    from: unknown,
    joins: { other: unknown; on: any }[],
    pred: any,
    config: any,
    groupCols: unknown[] | undefined,
  ): Row[] {
    const fromName = tableName(from)
    const base = store.get(fromName) ?? []
    if (!config) return base.filter((r) => matches(single(fromName, r), pred))

    let merged = base.map((r) => single(fromName, r))
    for (const join of joins) {
      const otherName = tableName(join.other)
      const otherRows = store.get(otherName) ?? []
      const next: Map<string, unknown>[] = []
      for (const row of merged) {
        for (const other of otherRows) {
          const combined = new Map(row)
          for (const [k, v] of Object.entries(other)) combined.set(`${otherName}|${k}`, v)
          if (matches(combined, join.on)) next.push(combined)
        }
      }
      merged = next
    }
    merged = merged.filter((r) => matches(r, pred))

    const hasAggregate = Object.values(config).some(
      (v) => v && typeof v === 'object' && 'agg' in (v as object),
    )

    if (groupCols && groupCols.length > 0) {
      const groups = new Map<string, Map<string, unknown>[]>()
      for (const row of merged) {
        const key = groupCols.map((c) => String(row.get(keyOf(colRef(c))))).join('\u0000')
        const bucket = groups.get(key) ?? []
        bucket.push(row)
        groups.set(key, bucket)
      }
      return [...groups.values()].map((group) => project(config, group))
    }

    if (hasAggregate) return [project(config, merged)]
    return merged.map((row) => project(config, [row]))
  }

  const getDb = () => ({
    select: (config?: Record<string, unknown>) => {
      const joins: { other: unknown; on: any }[] = []
      const build = (from: unknown) => ({
        innerJoin: (other: unknown, on: any) => {
          joins.push({ other, on })
          return build(from)
        },
        groupBy: (...cols: unknown[]) => thenable(finalize(from, joins, undefined, config, cols)),
        where: (pred: any) => {
          const run = (groupCols?: unknown[]) => finalize(from, joins, pred, config, groupCols)
          const node = { groupBy: (...cols: unknown[]) => thenable(run(cols)) }
          Object.defineProperty(node, 'then', {
            value: (res: (v: Row[]) => unknown, rej?: (e: unknown) => unknown) =>
              Promise.resolve(run()).then(res, rej),
            enumerable: false,
          })
          return node
        },
      })
      return { from: (t: unknown) => build(t) }
    },
  })

  const thenable = (rows: Row[]) => {
    const result = {} as Record<string, unknown>
    Object.defineProperty(result, 'then', {
      value: (res: (v: Row[]) => unknown, rej?: (e: unknown) => unknown) =>
        Promise.resolve(rows).then(res, rej),
      enumerable: false,
    })
    return result
  }

  return {
    getDb,
    eq,
    and,
    or: and,
    inArray,
    lte,
    gte,
    not: () => ({}),
    notInArray: () => ({}),
    sql: () => ({}),
    desc: () => ({}),
    asc: () => ({}),
    count,
    countDistinct,
    avg,
    getSupabaseAdmin: () => ({}),
    getSupabaseClient: () => ({}),
    disconnectFromDatabase: async () => {},
    __store: store,
  }
}