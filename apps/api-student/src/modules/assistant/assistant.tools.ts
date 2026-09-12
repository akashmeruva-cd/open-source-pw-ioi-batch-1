import type { AiTool } from '@repo/services/ai'
import { listUpcomingAssignmentsForStudent } from './assistant.service'

/**
 * Owner: Team 13 — AI Assistant.
 *
 * A tool plus the executor that runs it. The caller's id is bound as a closure
 * argument by the request handler, so it is invisible to the model — and no
 * schema in this file may ever contain a `studentId` parameter.
 */
export interface AssistantTool {
  definition: AiTool
  execute: (input: Record<string, unknown>) => Promise<string>
}

/**
 * Build the tools the chat loop offers for one caller.
 *
 * `studentId` comes from `currentUser(req).sub` in the controller — it is never
 * read from the model's arguments.
 */
export function buildTools({ studentId }: { studentId: string }): AssistantTool[] {
  return [
    {
      definition: {
        name: 'list_upcoming_assignments',
        description:
          'List assignments due within a number of days (default 7) for the student’s enrolled ' +
          'subjects, excluding ones already submitted. Use this to answer “what’s due this week?”.',
        inputSchema: {
          type: 'object',
          properties: {
            days: {
              type: 'number',
              description: 'How many days ahead to look. Defaults to 7.',
            },
          },
          required: [],
        },
      },
      execute: async (input) => {
        const items = await listUpcomingAssignmentsForStudent(studentId, input.days)
        if (items.length === 0) return 'No upcoming assignments due in this period.'
        return [
          `Upcoming assignments (${items.length}):`,
          ...items.map(
            (a) => `- ${a.title} (subject ${a.subjectId}), due ${a.dueAt}, max marks ${a.maxMarks}`,
          ),
        ].join('\n')
      },
    },
  ]
}
