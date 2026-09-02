'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CreateNoteInput, UpdateNoteInput } from '@repo/validation/notes'
import { ApiRequestError } from '@/lib/api-client'
import { createNote, deleteNote, listNotes, updateNote, type StudentNote } from '../api'

type FormState = {
  title: string
  body: string
  subjectId: string
  sessionId: string
}

const emptyForm: FormState = {
  title: '',
  body: '',
  subjectId: '',
  sessionId: '',
}

function toForm(note: StudentNote): FormState {
  return {
    title: note.title,
    body: note.body,
    subjectId: note.subjectId ?? '',
    sessionId: note.sessionId ?? '',
  }
}

function errorMessage(error: unknown) {
  return error instanceof ApiRequestError ? error.message : 'Something went wrong. Please try again.'
}

export default function NotesPage() {
  const [notes, setNotes] = useState<StudentNote[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  async function loadNotes() {
    setLoading(true)
    setError(null)
    try {
      setNotes(await listNotes())
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadNotes()
  }, [])

  const subjects = useMemo(
    () =>
      Array.from(new Set(notes.map((note) => note.subjectId).filter(Boolean) as string[])).sort(),
    [notes],
  )

  const visibleNotes = useMemo(() => {
    const query = search.trim().toLowerCase()

    return [...notes]
      .filter((note) => subjectFilter === 'all' || note.subjectId === subjectFilter)
      .filter(
        (note) =>
          !query ||
          note.title.toLowerCase().includes(query) ||
          note.body.toLowerCase().includes(query),
      )
      .sort((a, b) => Number(b.pinned) - Number(a.pinned))
  }, [notes, search, subjectFilter])

  function startCreate() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
  }

  function startEdit(note: StudentNote) {
    setEditingId(note.id)
    setForm(toForm(note))
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  async function saveNote(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (!form.title.trim()) {
        setError('Title is required.')
        return
      }

      if (editingId) {
        const input: UpdateNoteInput = {
          title: form.title.trim(),
          body: form.body,
          subjectId: form.subjectId || null,
          sessionId: form.sessionId || null,
        }
        const updated = await updateNote(editingId, input)
        setNotes((current) => current.map((note) => (note.id === editingId ? updated : note)))
      } else {
        const input: CreateNoteInput = {
          title: form.title.trim(),
          body: form.body,
          subjectId: form.subjectId || null,
          sessionId: form.sessionId || null,
          pinned: false,
        }
        const created = await createNote(input)
        setNotes((current) => [created, ...current])
      }

      cancelEdit()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function togglePin(note: StudentNote) {
    setError(null)
    try {
      const updated = await updateNote(note.id, { pinned: !note.pinned })
      setNotes((current) => current.map((item) => (item.id === note.id ? updated : item)))
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  async function removeNote(note: StudentNote) {
    if (!window.confirm(`Delete "${note.title}"?`)) return

    setError(null)
    try {
      await deleteNote(note.id)
      setNotes((current) => current.filter((item) => item.id !== note.id))
      if (editingId === note.id) cancelEdit()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-brand">Personal workspace</p>
          <h1 className="text-2xl font-semibold text-fg">My Notes</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Capture class notes, pin important ones, and find them quickly.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + New note
        </button>
      </div>

      {error ? (
        <div role="alert" className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <form onSubmit={saveNote} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-fg">{editingId ? 'Edit note' : 'Create a note'}</h2>
            <p className="text-sm text-fg-muted">
              {editingId ? 'Update the note and save your changes.' : 'Start with a title and your note body.'}
            </p>
          </div>
          {editingId ? (
            <button type="button" onClick={cancelEdit} className="text-sm text-fg-muted hover:text-fg">
              Cancel
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-fg">
            Title
            <input
              value={form.title}
              onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
              maxLength={200}
              required
              className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              placeholder="e.g. DBMS Normalization"
            />
          </label>

          <label className="text-sm font-medium text-fg">
            Subject ID
            <input
              value={form.subjectId}
              onChange={(e) => setForm((current) => ({ ...current, subjectId: e.target.value }))}
              className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
              placeholder="Optional"
            />
          </label>
        </div>

        <label className="mt-4 block text-sm font-medium text-fg">
          Note
          <textarea
            value={form.body}
            onChange={(e) => setForm((current) => ({ ...current, body: e.target.value }))}
            rows={7}
            className="mt-1.5 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            placeholder="Write your notes here..."
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-fg">
          Session ID
          <input
            value={form.sessionId}
            onChange={(e) => setForm((current) => ({ ...current, sessionId: e.target.value }))}
            className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            placeholder="Optional"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Saving...' : editingId ? 'Save changes' : 'Create note'}
        </button>
      </form>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
          placeholder="Search notes..."
          aria-label="Search notes"
        />
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
          aria-label="Filter notes by subject"
        >
          <option value="all">All subjects</option>
          {subjects.map((subjectId) => (
            <option key={subjectId} value={subjectId}>
              {subjectId}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-44 animate-pulse rounded-xl border border-line bg-surface-2" />
          ))}
        </div>
      ) : visibleNotes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-12 text-center">
          <h2 className="font-semibold text-fg">{notes.length ? 'No matching notes' : 'No notes yet'}</h2>
          <p className="mt-1 text-sm text-fg-muted">
            {notes.length ? 'Try a different search or subject filter.' : 'Create your first note above.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleNotes.map((note) => (
            <article key={note.id} className="rounded-xl border border-line bg-surface p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-semibold text-fg">{note.title}</h2>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-fg-muted">
                    {note.pinned ? <span className="rounded-full bg-brand/10 px-2 py-0.5 text-brand">Pinned</span> : null}
                    {note.subjectId ? (
                      <span className="rounded-full bg-surface-2 px-2 py-0.5">Subject: {note.subjectId}</span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void togglePin(note)}
                  aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
                  className="rounded-lg px-2 py-1 text-lg hover:bg-surface-2"
                >
                  {note.pinned ? '★' : '☆'}
                </button>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-fg-muted">{note.body || 'No content.'}</p>

              <div className="mt-5 flex gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => startEdit(note)}
                  className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-fg hover:bg-surface-2"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void removeNote(note)}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger/5"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
