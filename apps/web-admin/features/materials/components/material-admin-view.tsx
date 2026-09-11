'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/card'
import { EmptyState } from '@repo/ui/empty-state'
import { Input } from '@repo/ui/input'
import { Skeleton } from '@repo/ui/skeleton'
import type { MaterialType } from '@repo/validation/enums'
import type { Material } from '@repo/validation/materials'
import {
  createMaterial,
  deleteMaterial,
  fetchAdminMaterials,
  requestUploadTicket,
} from '../api'

export function MaterialAdminView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [type, setType] = useState<MaterialType>('PDF')
  const [externalUrl, setExternalUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const loadMaterials = () => {
    setLoading(true)
    fetchAdminMaterials({ search: searchQuery.trim() || undefined })
      .then((res) => setMaterials(res.items))
      .catch((err) => setErrorMessage(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadMaterials()
  }, [searchQuery])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !subjectId) {
      setErrorMessage('Title and Subject ID are required.')
      return
    }

    setIsUploading(true)
    setErrorMessage('')

    try {
      let fileMeta = null

      if (selectedFile) {
        // Step 1: Request upload ticket
        const ticket = await requestUploadTicket(selectedFile.name, selectedFile.type)

        // Step 2: Upload file directly
        if (ticket.method === 'POST') {
          const formData = new FormData()
          Object.entries(ticket.fields).forEach(([k, v]) => formData.append(k, v))
          formData.append('file', selectedFile)
          await fetch(ticket.uploadUrl, { method: 'POST', body: formData })
        } else {
          await fetch(ticket.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': selectedFile.type },
            body: selectedFile,
          })
        }

        const extension = selectedFile.name.split('.').pop() || ''
        fileMeta = {
          key: ticket.key,
          url: ticket.uploadUrl,
          bytes: selectedFile.size,
          format: extension,
        }
      }

      // Step 3: Create material record
      await createMaterial({
        subjectId,
        title,
        description: description || undefined,
        type,
        externalUrl: externalUrl || undefined,
        file: fileMeta,
      })

      setShowAddModal(false)
      setTitle('')
      setDescription('')
      setSubjectId('')
      setExternalUrl('')
      setSelectedFile(null)
      loadMaterials()
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to upload material')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return
    try {
      await deleteMaterial(id)
      loadMaterials()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete material')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-80">
          <Input
            label="Search"
            type="search"
            placeholder="Search class materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowAddModal(true)}>+ Upload Material</Button>
      </div>

      {/* Material Table / List */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-5 w-1/3" />
            </Card>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <EmptyState
          title="No materials uploaded"
          description="Upload lecture slides, notes, or reference links for students."
        />
      ) : (
        <Card className="overflow-hidden border border-line">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-surface-2 text-xs font-semibold text-fg-muted uppercase">
              <tr>
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Subject ID</th>
                <th className="p-3.5">Uploaded</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-fg">
              {materials.map((m) => (
                <tr key={m.id} className="hover:bg-surface-2/50 transition-colors">
                  <td className="p-3.5 font-medium">
                    <div>{m.title}</div>
                    {m.description && (
                      <div className="text-xs text-fg-muted line-clamp-1">{m.description}</div>
                    )}
                  </td>
                  <td className="p-3.5">
                    <Badge tone={m.type === 'PDF' ? 'danger' : 'info'}>{m.type}</Badge>
                  </td>
                  <td className="p-3.5 text-xs text-fg-muted font-mono">{m.subjectId.slice(0, 8)}...</td>
                  <td className="p-3.5 text-xs text-fg-muted">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3.5 text-right space-x-2">
                    <Button variant="danger" size="sm" onClick={() => handleDelete(m.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Upload / Create Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-lg font-semibold text-fg">Upload Class Material</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}>
                ✕
              </Button>
            </div>

            {errorMessage && (
              <div className="rounded-lg bg-danger/10 p-3 text-xs text-danger border border-danger/30">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Title *"
                required
                placeholder="e.g. Week 1 - Data Structures Slides"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />

              <Input
                label="Subject ID (UUID) *"
                required
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-fg mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as MaterialType)}
                    className="w-full rounded-lg border border-line bg-surface p-2 text-sm text-fg"
                  >
                    <option value="PDF">PDF</option>
                    <option value="PPT">PPT</option>
                    <option value="DOC">DOC</option>
                    <option value="VIDEO">VIDEO</option>
                    <option value="LINK">LINK</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <Input
                  label="External Link (Optional)"
                  placeholder="https://..."
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-fg mb-1">Upload File (PDF/PPT/DOC/ZIP)</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                  className="w-full text-xs text-fg file:mr-3 file:rounded-lg file:border-0 file:bg-surface-3 file:px-3 file:py-2 file:text-xs file:font-medium text-fg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-fg mb-1">Description</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-line bg-surface p-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-brand/40"
                  placeholder="Brief summary of the material..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <Button type="button" variant="ghost" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Save & Publish'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
