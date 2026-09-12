'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api-client'
export type CreateBatchInput = {
  name: string
  year: number
  program: string
  startDate: string
  endDate: string | null
  isActive?: boolean
}
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
  facultyId: {
    _id: string
    name: string
    email: string
  } | null
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

export function useBatches() {
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await api.get<Batch[]>('/api/batches')
      setBatches(data)
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch batches',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await api.get<Batch[]>('/api/batches')

        if (cancelled) return

        setBatches(data)
        setError(null)
      } catch (err: unknown) {
        if (cancelled) return

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch batches',
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return {
    batches,
    loading,
    error,
    refetch,
  }
}

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await api.get<Subject[]>('/api/subjects')
      setSubjects(data)
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to fetch subjects',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const data = await api.get<Subject[]>('/api/subjects')

        if (cancelled) return

        setSubjects(data)
        setError(null)
      } catch (err: unknown) {
        if (cancelled) return

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch subjects',
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return {
    subjects,
    loading,
    error,
    refetch,
  }
}
export async function createBatch(
  data: CreateBatchInput,
) {
  return api.post<Batch>('/api/batches', data)
}
export async function updateBatch(
  id: string,
  data: Partial<Batch>,
) {
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

export async function updateSubject(
  id: string,
  data: Partial<Subject>,
) {
  return api.patch<Subject>(`/api/subjects/${id}`, data)
}

export async function deleteSubject(id: string) {
  return api.delete(`/api/subjects/${id}`)
}

export async function importStudentsDryRun(
  batchId: string,
  students: { name: string; email: string }[],
) {
  return api.post<{
    willCreate: number
    willSkip: number
    skippedEmails: string[]
  }>('/api/students/import?dryRun=true', {
    batchId,
    students,
  })
}

export async function importStudentsCommit(
  batchId: string,
  students: { name: string; email: string }[],
) {
  return api.post<{
    created: number
    skipped: number
    enrollmentsCreated: number
  }>('/api/students/import', {
    batchId,
    students,
  })
}
