'use client'

import { useState, useRef } from 'react'
import { Button } from '@repo/ui/button'
import { Badge } from '@repo/ui/badge'
import { Modal } from './modal'
import { importStudentsDryRun, importStudentsCommit, type Batch } from './api'

interface ParsedRow {
  name: string
  email: string
}

interface ParseError {
  row: number
  message: string
}

function parseCsv(text: string): { rows: ParsedRow[]; errors: ParseError[] } {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return { rows: [], errors: [{ row: 1, message: 'CSV must have a header row and at least one data row' }] }

  const header = lines[0]!.toLowerCase().split(',').map((h) => h.trim())
  const nameIdx = header.indexOf('name')
  const emailIdx = header.indexOf('email')

  if (nameIdx === -1 || emailIdx === -1) {
    return { rows: [], errors: [{ row: 1, message: 'CSV must have "name" and "email" columns' }] }
  }

  const rows: ParsedRow[] = []
  const errors: ParseError[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]!.split(',').map((c) => c.trim())
    const name = cols[nameIdx] ?? ''
    const email = cols[emailIdx] ?? ''

    if (!name) {
      errors.push({ row: i + 1, message: 'Missing name' })
      continue
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ row: i + 1, message: `Invalid email: "${email}"` })
      continue
    }

    rows.push({ name, email })
  }

  return { rows, errors }
}

export function CsvImportModal({
  open,
  onClose,
  onSuccess,
  batches,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  batches: Batch[]
}) {
  const [batchId, setBatchId] = useState(batches[0]?._id ?? '')
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [parseErrors, setParseErrors] = useState<ParseError[]>([])
  const [preview, setPreview] = useState<{ willCreate: number; willSkip: number; skippedEmails: string[] } | null>(null)
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; enrollmentsCreated: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setError(null)
    setPreview(null)

    const reader = new FileReader()
    reader.onload = async () => {
      const text = reader.result as string
      const { rows, errors } = parseCsv(text)
      setParsedRows(rows)
      setParseErrors(errors)

      if (rows.length === 0) {
        setError('No valid rows found in CSV.')
        return
      }

      // Dry run
      setLoading(true)
      try {
        const result = await importStudentsDryRun(batchId, rows)
        setPreview(result)
        setStep('preview')
      } catch (err: unknown) {
  setError(
    err instanceof Error
      ? err.message
      : 'Failed to validate CSV',
  )
} finally {
        setLoading(false)
      }
    }
    reader.readAsText(file)
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await importStudentsCommit(batchId, parsedRows)
      setImportResult(result)
      setStep('done')
      onSuccess()
    } catch (err: unknown) {
  setError(
    err instanceof Error
      ? err.message
      : 'Import failed',
  )
} finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setStep('upload')
    setFileName(null)
    setParsedRows([])
    setParseErrors([])
    setPreview(null)
    setImportResult(null)
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <Modal open={open} onClose={() => { reset(); onClose() }} title="Import Students from CSV">
      <div className="space-y-4">
        {/* Batch selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg">Target Batch</label>
          <select
            value={batchId}
            onChange={(e) => { setBatchId(e.target.value); reset() }}
            className="h-10 rounded-lg border border-line bg-surface px-3 text-sm text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
          >
            {batches.map((b) => (
              <option key={b._id} value={b._id}>{b.name} ({b.year})</option>
            ))}
          </select>
        </div>

        {/* Step: Upload */}
        {step === 'upload' && (
          <>
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-line px-6 py-10 text-center transition-colors hover:border-brand/40">
              <p className="text-sm text-fg-muted mb-3">
                Upload a CSV file with <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs font-mono text-brand">name</code> and{' '}
                <code className="rounded bg-surface-2 px-1.5 py-0.5 text-xs font-mono text-brand">email</code> columns
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="text-sm text-fg-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:cursor-pointer hover:file:bg-brand-strong file:transition-colors"
              />
              {fileName && <p className="mt-2 text-xs text-fg-subtle">Selected: {fileName}</p>}
            </div>

            {parseErrors.length > 0 && (
              <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 space-y-1">
                <p className="text-sm font-medium text-danger">Parse errors ({parseErrors.length})</p>
                <ul className="max-h-32 overflow-y-auto space-y-0.5">
                  {parseErrors.map((err) => (
                    <li key={err.row} className="text-xs text-danger">
                      Row {err.row}: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Step: Preview */}
        {step === 'preview' && preview && (
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-surface-2 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-fg">Import Preview</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Badge tone="success">{preview.willCreate}</Badge>
                  <span className="text-sm text-fg-muted">will be created</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="warning">{preview.willSkip}</Badge>
                  <span className="text-sm text-fg-muted">will be skipped</span>
                </div>
              </div>
              {preview.skippedEmails.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-fg-muted mb-1">Skipped (duplicate emails):</p>
                  <div className="flex flex-wrap gap-1">
                    {preview.skippedEmails.map((email) => (
                      <span key={email} className="rounded bg-warning/10 px-2 py-0.5 text-xs text-warning">{email}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {parseErrors.length > 0 && (
              <div className="rounded-lg border border-danger/30 bg-danger/5 p-3">
                <p className="text-xs text-danger">{parseErrors.length} row(s) had parse errors and were excluded from the preview above.</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={reset}>Back</Button>
              <Button onClick={handleConfirm} loading={loading}>
                Confirm Import ({preview.willCreate} students)
              </Button>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === 'done' && importResult && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
              <span className="text-2xl">✓</span>
            </div>
            <div>
              <p className="text-base font-semibold text-fg">Import Complete</p>
              <p className="mt-1 text-sm text-fg-muted">
                {importResult.created} students created · {importResult.skipped} skipped · {importResult.enrollmentsCreated} enrollments
              </p>
            </div>
            <Button variant="secondary" onClick={() => { reset(); onClose() }}>Close</Button>
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        {loading && step === 'upload' && (
          <div className="flex items-center gap-2 text-sm text-fg-muted">
            <span className="size-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            Validating…
          </div>
        )}
      </div>
    </Modal>
  )
}
