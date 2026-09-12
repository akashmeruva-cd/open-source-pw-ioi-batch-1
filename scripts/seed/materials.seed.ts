import { getDb } from '@repo/models/db'
import { materials } from '@repo/models/schema'
import type { CoreSeed } from './core.seed'

/**
 * Owner: Team 04 — Class Materials.
 */

const TOPICS: Record<string, string[]> = {
  CS201: ['Arrays and complexity', 'Linked lists', 'Trees and traversal', 'Hashing'],
  CS202: ['ER modelling', 'Normalization', 'SQL joins', 'Transactions and ACID'],
  CS203: ['Processes and threads', 'Scheduling', 'Deadlock', 'Virtual memory'],
  CS204: ['OSI and TCP/IP', 'Routing', 'TCP congestion control', 'DNS and HTTP'],
  CS205: ['HTML and CSS', 'JavaScript basics', 'React components', 'REST APIs'],
  MA201: ['Sets and relations', 'Combinatorics', 'Graph theory', 'Boolean algebra'],
}

export async function seedMaterials(core: CoreSeed) {
  const db = getDb()

  const values = core.subjects.flatMap((subject, subjectIndex) => {
    const topics = TOPICS[subject.code] ?? ['Week 1', 'Week 2', 'Week 3', 'Week 4']

    return topics.map((topic, i) => {
      const session = core.sessions.find(
        (s) => s.subjectId === subject.id && s.title.endsWith(`Week ${i + 1}`),
      )
      const isPdf = i % 2 === 1

      return {
        subjectId: subject.id,
        sessionId: session?.id ?? null,
        title: `${topic}`,
        description: `${subject.name} — week ${i + 1} class material.`,
        type: isPdf ? ('PDF' as const) : ('PPT' as const),
        file: {
          key: `materials/${subject.code.toLowerCase()}-w${i + 1}.${isPdf ? 'pdf' : 'pptx'}`,
          url: `https://example-supabase-project.supabase.co/storage/v1/object/public/uploads/materials/${subject.code.toLowerCase()}-w${i + 1}.${isPdf ? 'pdf' : 'pptx'}`,
          bytes: 400_000 + subjectIndex * 25_000 + i * 60_000,
          format: isPdf ? 'pdf' : 'pptx',
        },
        externalUrl: null,
        uploadedBy: subject.facultyId ?? core.admin.id,
      }
    })
  })

  return db.insert(materials).values(values).returning()
}
