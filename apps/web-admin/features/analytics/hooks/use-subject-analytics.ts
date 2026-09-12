'use client'

import { useEffect, useReducer } from 'react'
import type { SubjectAnalytics } from '@repo/validation/analytics'
import { api, ApiRequestError } from '@/lib/api-client'

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: SubjectAnalytics }
  | { status: 'error'; message: string }

type Action =
  | { type: 'FETCH' }
  | { type: 'SUCCESS'; data: SubjectAnalytics }
  | { type: 'ERROR'; message: string }

function reducer(_: State, action: Action): State {
  switch (action.type) {
    case 'FETCH': return { status: 'loading' }
    case 'SUCCESS': return { status: 'success', data: action.data }
    case 'ERROR': return { status: 'error', message: action.message }
  }
}

/**
 * Owner: Team 12 — Admin Analytics & Reports.
 * Fetches subject-level analytics from GET /api/analytics/subject/:subjectId.
 */
export function useSubjectAnalytics(subjectId: string | null) {
  const [state, dispatch] = useReducer(reducer, { status: 'idle' })

  useEffect(() => {
    if (!subjectId) return

    let cancelled = false

    async function fetch() {
      dispatch({ type: 'FETCH' })
      try {
        const data = await api.get<SubjectAnalytics>(`/api/analytics/subject/${subjectId}`)
        if (!cancelled) dispatch({ type: 'SUCCESS', data })
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiRequestError ? err.message : 'Failed to load subject analytics'
          dispatch({ type: 'ERROR', message })
        }
      }
    }

    void fetch()
    return () => { cancelled = true }
  }, [subjectId])

  return {
    data: state.status === 'success' ? state.data : null,
    loading: state.status === 'loading',
    error: state.status === 'error' ? state.message : null,
  }
}
