import type { CreateNoteInput, UpdateNoteInput } from '@repo/validation/notes'
import { api } from '@/lib/api-client'

export interface StudentNote {
  id: string
  subjectId?: string | null
  sessionId?: string | null
  title: string
  body: string
  pinned: boolean
  createdAt?: string
  updatedAt?: string
}

type NotesResponse = StudentNote[] | { notes: StudentNote[] }

function unwrapNotes(response: NotesResponse): StudentNote[] {
  return Array.isArray(response) ? response : response.notes
}

export async function listNotes(): Promise<StudentNote[]> {
  const response = await api.get<NotesResponse>('/api/notes')
  return unwrapNotes(response)
}

export async function createNote(input: CreateNoteInput): Promise<StudentNote> {
  return api.post<StudentNote>('/api/notes', input)
}

export async function updateNote(id: string, input: UpdateNoteInput): Promise<StudentNote> {
  return api.patch<StudentNote>(`/api/notes/${id}`, input)
}

export async function deleteNote(id: string): Promise<void> {
  await api.delete(`/api/notes/${id}`)
}
