'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Batch {
  _id: string
  name: string
  year: number
  program: string
  startDate: string
  endDate: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Subject {
  _id: string
  name: string
  code: string
  batchId: string
  facultyId: { _id: string; name: string; email: string } | null
  credits: number
  createdAt: string
  updatedAt: string
}

export interface Enrollment {
  _id: string
  studentId: string
  subjectId: string
  batchId: string
  createdAt: string
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

export function useBatches() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBatches = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<Batch[]>('/api/batches')
      setBatches(data)
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch batches')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchBatches() }, [fetchBatches])

  return { batches, loading, error, refetch: fetchBatches }
}

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSubjects = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<Subject[]>('/api/subjects')
      setSubjects(data)
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch subjects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchSubjects() }, [fetchSubjects])

  return { subjects, loading, error, refetch: fetchSubjects }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createBatch(data: Omit<Batch, '_id' | 'createdAt' | 'updatedAt'>) {
  return api.post<Batch>('/api/batches', data)
}

export async function updateBatch(id: string, data: Partial<Batch>) {
  return api.patch<Batch>(`/api/batches/${id}`, data)
}

export async function deleteBatch(id: string) {
  return api.delete(`/api/batches/${id}`)
}

export async function createSubject(data: {
  name: string
  code: string
  batchId: string
  facultyId?: string | null
  credits?: number
}) {
  return api.post<Subject>('/api/subjects', data)
}

export async function updateSubject(id: string, data: Partial<Subject>) {
  return api.patch<Subject>(`/api/subjects/${id}`, data)
}

export async function deleteSubject(id: string) {
  return api.delete(`/api/subjects/${id}`)
}

export async function importStudentsDryRun(batchId: string, students: { name: string; email: string }[]) {
  return api.post<{ willCreate: number; willSkip: number; skippedEmails: string[] }>(
    '/api/students/import?dryRun=true',
    { batchId, students },
  )
}

export async function importStudentsCommit(batchId: string, students: { name: string; email: string }[]) {
  return api.post<{ created: number; skipped: number; enrollmentsCreated: number }>(
    '/api/students/import',
    { batchId, students },
  )
}
