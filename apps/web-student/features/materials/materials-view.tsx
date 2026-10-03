'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/card'
import { EmptyState } from '@repo/ui/empty-state'
import { Input } from '@repo/ui/input'
import { Skeleton } from '@repo/ui/skeleton'
import type { MaterialType } from '@repo/validation/enums'
import { api } from '@/lib/api-client'

/** Owner: Team 04 — Class Materials. */

interface MaterialItem {
  _id: string
  title: string
  description: string | null
  type: MaterialType
  cloudinary: {
    publicId: string
    url: string
    bytes: number
    format: string
  } | null
  externalUrl: string | null
  createdAt: string
  subjectId: {
    _id: string
    name: string
    code: string
  }
  uploadedBy: {
    _id: string
    name: string
    role: string
  }
}

const TYPE_TONES: Record<MaterialType, 'info' | 'warning' | 'neutral' | 'success' | 'danger'> = {
  PDF: 'danger',
  PPT: 'warning',
  DOC: 'info',
  VIDEO: 'success',
  LINK: 'neutral',
  OTHER: 'neutral',
}

export function MaterialsView() {
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL')
  const [subjects, setSubjects] = useState<{ id: string; code: string; name: string }[]>([])

  useEffect(() => {
    fetchMaterials()
  }, [selectedType, selectedSubject])

  async function fetchMaterials() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedSubject !== 'ALL') params.set('subjectId', selectedSubject)
      if (selectedType !== 'ALL') params.set('type', selectedType)

      const path = `/api/materials?${params.toString()}`
      const res = await api.get<{ items: MaterialItem[] }>(path)
      setMaterials(res.items ?? [])

      // Extract unique subjects for filter tabs
      const uniqueSubs = new Map<string, { id: string; code: string; name: string }>()
      res.items?.forEach((item) => {
        if (item.subjectId && item.subjectId._id) {
          uniqueSubs.set(item.subjectId._id, {
            id: item.subjectId._id,
            code: item.subjectId.code,
            name: item.subjectId.name,
          })
        }
      })
      if (uniqueSubs.size > 0 && subjects.length === 0) {
        setSubjects(Array.from(uniqueSubs.values()))
      }
    } catch {
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      fetchMaterials()
      return
    }
    setLoading(true)
    try {
      const params = new URLSearchParams({ q: searchQuery })
      if (selectedSubject !== 'ALL') params.set('subjectId', selectedSubject)
      const res = await api.get<{ items: MaterialItem[] }>(`/api/materials/search?${params.toString()}`)
      setMaterials(res.items ?? [])
    } catch {
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }

  function formatBytes(bytes: number) {
    if (!bytes) return ''
    const kb = bytes / 1024
    if (kb < 1024) return `${Math.round(kb)} KB`
    return `${(kb / 1024).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Class Materials</h1>
          <p className="text-sm text-fg-muted">
            Access slides, lecture notes, documents and resources for your subjects.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 items-end gap-2 max-w-md">
          <Input
            label="Search"
            placeholder="Search slides, topics, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} variant="secondary">
            Search
          </Button>
        </div>

        {/* Type Filter Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {['ALL', 'PPT', 'PDF', 'DOC', 'VIDEO', 'LINK', 'OTHER'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedType === type
                  ? 'bg-brand text-brand-fg'
                  : 'bg-surface-2 text-fg-muted hover:bg-surface-3'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Subject Tabs if subjects exist */}
      {subjects.length > 0 && (
        <div className="flex border-b border-line gap-4 text-sm font-medium">
          <button
            onClick={() => setSelectedSubject('ALL')}
            className={`pb-2.5 border-b-2 transition-colors ${
              selectedSubject === 'ALL'
                ? 'border-brand text-fg font-semibold'
                : 'border-transparent text-fg-muted hover:text-fg'
            }`}
          >
            All Subjects
          </button>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubject(sub.id)}
              className={`pb-2.5 border-b-2 transition-colors ${
                selectedSubject === sub.id
                  ? 'border-brand text-fg font-semibold'
                  : 'border-transparent text-fg-muted hover:text-fg'
              }`}
            >
              {sub.code} — {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
      ) : materials.length === 0 ? (
        <EmptyState
          title="No materials found"
          description="Try changing your search query or selecting a different subject/type filter."
          action={
            <Button
              onClick={() => {
                setSearchQuery('')
                setSelectedType('ALL')
                setSelectedSubject('ALL')
              }}
              variant="secondary"
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials.map((item) => {
            const url = item.cloudinary?.url || item.externalUrl || '#'
            return (
              <Card key={item._id} className="flex flex-col justify-between p-5 hover:border-brand/40 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge tone={TYPE_TONES[item.type]}>{item.type}</Badge>
                    <span className="text-xs font-semibold text-fg-muted">
                      {item.subjectId?.code ?? 'Subject'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-fg text-base leading-snug">{item.title}</h3>
                  {item.description && (
                    <p className="text-xs text-fg-muted line-clamp-2">{item.description}</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs text-fg-muted">
                  <span>
                    Uploaded by {item.uploadedBy?.name ?? 'Faculty'}
                    {item.cloudinary?.bytes ? ` • ${formatBytes(item.cloudinary.bytes)}` : ''}
                  </span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                  >
                    View / Download →
                  </a>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
