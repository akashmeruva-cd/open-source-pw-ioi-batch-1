'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/card'
import { EmptyState } from '@repo/ui/empty-state'
import { Input } from '@repo/ui/input'
import { Skeleton } from '@repo/ui/skeleton'
import type { Material } from '@repo/validation/materials'
import { fetchMaterials } from '../api'

const MATERIAL_TYPES = ['ALL', 'PDF', 'PPT', 'DOC', 'VIDEO', 'LINK', 'OTHER'] as const

function formatBytes(bytes?: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MaterialList({ subjectId }: { subjectId?: string }) {
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null)
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; items: Material[] }
  >({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })

    const typeFilter = selectedType === 'ALL' ? undefined : selectedType
    fetchMaterials({
      subjectId,
      type: typeFilter,
      search: searchQuery.trim() || undefined,
    })
      .then((res) => {
        if (!cancelled) {
          setState({ status: 'ready', items: res.items })
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            status: 'error',
            message: err instanceof Error ? err.message : 'Failed to load materials',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [subjectId, selectedType, searchQuery])

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:w-72">
          <Input
            label="Search"
            type="search"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-6 md:pt-0">
          {MATERIAL_TYPES.map((type) => {
            const isSelected = selectedType === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-brand text-white shadow-sm'
                    : 'bg-surface-2 text-fg-muted hover:bg-surface-3'
                }`}
              >
                {type}
              </button>
            )
          })}
        </div>
      </div>

      {/* Loading Skeletons */}
      {state.status === 'loading' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-8 w-full mt-4" />
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {state.status === 'error' && (
        <EmptyState
          title="Could not load materials"
          description={state.message}
        />
      )}

      {/* Empty State */}
      {state.status === 'ready' && state.items.length === 0 && (
        <EmptyState
          title="No class materials found"
          description={
            searchQuery
              ? `No materials matched "${searchQuery}".`
              : 'Your faculty has not uploaded any materials for this subject yet.'
          }
        />
      )}

      {/* Material Grid */}
      {state.status === 'ready' && state.items.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {state.items.map((m) => {
            const targetUrl = m.file?.url ?? m.externalUrl ?? '#'
            const isPdf = m.type === 'PDF' || m.file?.format === 'pdf'

            return (
              <Card
                key={m.id}
                className="group relative flex flex-col justify-between p-5 transition-all hover:border-brand/40 hover:shadow-md"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <Badge tone={m.type === 'PDF' ? 'danger' : m.type === 'LINK' ? 'info' : 'neutral'}>
                      {m.type}
                    </Badge>
                    {m.file?.bytes && (
                      <span className="text-xs text-fg-muted">
                        {formatBytes(m.file.bytes)}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-fg line-clamp-2 group-hover:text-brand transition-colors">
                    {m.title}
                  </h3>

                  {m.description && (
                    <p className="text-xs text-fg-muted line-clamp-3">
                      {m.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-line flex items-center gap-2">
                  {isPdf && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPreviewMaterial(m)}
                    >
                      Preview
                    </Button>
                  )}
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1"
                  >
                    <Button variant={isPdf ? 'secondary' : 'primary'} size="sm" className="w-full">
                      {m.externalUrl ? 'Open Link ↗' : 'Download'}
                    </Button>
                  </a>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* PDF Inline Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl rounded-2xl bg-surface p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-lg font-semibold text-fg">
                  {previewMaterial.title}
                </h3>
                <p className="text-xs text-fg-muted">
                  {previewMaterial.description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMaterial(null)}
              >
                ✕ Close
              </Button>
            </div>

            <div className="flex-1 min-h-[60vh] bg-surface-2 rounded-xl overflow-hidden">
              <iframe
                src={previewMaterial.file?.url ?? previewMaterial.externalUrl ?? ''}
                className="w-full h-full border-0"
                title={previewMaterial.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
