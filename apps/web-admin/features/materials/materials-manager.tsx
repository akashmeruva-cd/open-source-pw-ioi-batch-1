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
}

export function MaterialsManager() {
  const [materials, setMaterials] = useState<MaterialItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<MaterialType>('PDF')
  const [subjectId, setSubjectId] = useState('')
  const [externalUrl, setExternalUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMaterials()
  }, [])

  async function fetchMaterials() {
    setLoading(true)
    try {
      // In web-admin, materials can be fetched or managed
      const res = await api.get<{ items: MaterialItem[] }>('/api/materials')
      setMaterials(res.items ?? [])
    } catch {
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateMaterial(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !subjectId.trim()) {
      setError('Title and Subject ID are required.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      await api.post('/api/materials', {
        subjectId,
        title,
        description: description || null,
        type,
        externalUrl: externalUrl || null,
      })

      setTitle('')
      setDescription('')
      setExternalUrl('')
      setShowUploadForm(false)
      fetchMaterials()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create material.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this material?')) return
    try {
      await api.delete(`/api/materials/${id}`)
      fetchMaterials()
    } catch (err: any) {
      alert(err?.message ?? 'Failed to delete material.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg">Materials Management</h1>
          <p className="text-sm text-fg-muted">Upload and manage class slides, docs, and resources.</p>
        </div>
        <Button onClick={() => setShowUploadForm(!showUploadForm)}>
          {showUploadForm ? 'Cancel' : '+ Add Material'}
        </Button>
      </div>

      {showUploadForm && (
        <Card className="p-5 border-brand/50">
          <form onSubmit={handleCreateMaterial} className="space-y-4">
            <h2 className="text-lg font-semibold text-fg">Upload Class Material</h2>
            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Material Title"
                placeholder="e.g. Arrays and Vectors Slides"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <Input
                label="Subject ObjectId"
                placeholder="MongoDB ObjectId of subject"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
              />
            </div>

            <Input
              label="Description (Optional)"
              placeholder="Brief description of the material..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-fg block mb-1.5">Material Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as MaterialType)}
                  className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg"
                >
                  <option value="PPT">PPT / PPTX</option>
                  <option value="PDF">PDF</option>
                  <option value="DOC">DOC / DOCX</option>
                  <option value="VIDEO">VIDEO</option>
                  <option value="LINK">LINK</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <Input
                label="External URL (Optional)"
                placeholder="https://..."
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowUploadForm(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={uploading}>
                Save Material
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : materials.length === 0 ? (
        <EmptyState
          title="No materials uploaded yet"
          description="Click '+ Add Material' above to attach lecture slides or documents to a subject."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials.map((item) => (
            <Card key={item._id} className="p-5 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge tone="info">{item.type}</Badge>
                  <span className="text-xs font-mono text-fg-muted">{item._id}</span>
                </div>
                <h3 className="font-semibold text-fg">{item.title}</h3>
                {item.description && <p className="text-xs text-fg-muted">{item.description}</p>}
              </div>

              <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
                <span className="text-xs text-fg-muted">Created {new Date(item.createdAt).toLocaleDateString()}</span>
                <Button variant="danger" size="sm" onClick={() => handleDelete(item._id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
