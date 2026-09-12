'use client'

import { useEffect, useReducer } from 'react'
import type { AtRiskResponse } from '@repo/validation/analytics'
import { api, ApiRequestError } from '@/lib/api-client'

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: AtRiskResponse }
  | { status: 'error'; message: string }

type Action =
  | { type: 'FETCH' }
  | { type: 'SUCCESS'; data: AtRiskResponse }
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
 * Fetches the at-risk student list from GET /api/analytics/at-risk.
 */
export function useAtRisk(batchId: string | null, threshold = 75) {
  const [state, dispatch] = useReducer(reducer, { status: 'idle' })

  useEffect(() => {
    if (!batchId) return

    let cancelled = false

    async function fetch() {
      dispatch({ type: 'FETCH' })
      try {
        const data = await api.get<AtRiskResponse>(
          `/api/analytics/at-risk?batchId=${encodeURIComponent(batchId!)}&threshold=${threshold}`,
        )
        if (!cancelled) dispatch({ type: 'SUCCESS', data })
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof ApiRequestError ? err.message : 'Failed to load at-risk data'
          dispatch({ type: 'ERROR', message })
        }
      }
    }

    void fetch()
    return () => { cancelled = true }
  }, [batchId, threshold])

  return {
    data: state.status === 'success' ? state.data : null,
    loading: state.status === 'loading',
    error: state.status === 'error' ? state.message : null,
  }
}
