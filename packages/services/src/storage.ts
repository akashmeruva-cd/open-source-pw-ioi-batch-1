/**
 * LOCKED FILE — Team 01 (Core Platform).
 *
 * File storage, behind one interface with two drivers:
 *
 *   STORAGE_DRIVER=local        writes to `.local-uploads/` and serves the files
 *                               back from this API. The default — no account,
 *                               no keys, nothing to sign up for.
 *   STORAGE_DRIVER=supabase     signed direct-to-Supabase Storage uploads. What the
 *                               deployed environments use.
 *
 * Teams 04, 05 and 09 write against this interface and never learn which driver
 * is running.
 */

export interface UploadTicket {
  /** How the browser should send the file. */
  method: 'POST' | 'PUT'
  uploadUrl: string
  /** Form fields that must accompany a POST upload. Empty for PUT. */
  fields: Record<string, string>
  /** The key to store on the model once the upload succeeds. */
  key: string
}

export interface StorageDriver {
  readonly name: 'local' | 'supabase'
  /**
   * Produces everything the browser needs to upload one file. The API never
   * receives the bytes itself — that is true of both drivers.
   */
  createUploadTicket(opts: { folder: string; filename: string }): Promise<UploadTicket>
  /** Public URL for a stored key. */
  urlFor(key: string): string
  remove(key: string): Promise<void>
}

let cached: StorageDriver | null = null

export function getStorage(): StorageDriver {
  if (cached) return cached

  const driver = process.env.STORAGE_DRIVER || 'local'

  if (driver === 'supabase') {
    const { createSupabaseStorage } =
      require('./storage-supabase') as typeof import('./storage-supabase')
    cached = createSupabaseStorage()
  } else if (driver === 'local') {
    const { createLocalStorage } = require('./storage-local') as typeof import('./storage-local')
    cached = createLocalStorage()
  } else {
    throw new Error(`Unknown STORAGE_DRIVER "${driver}" — expected "local" or "supabase".`)
  }

  return cached
}

/** Tests reset the memoised driver between cases. */
export function resetStorage() {
  cached = null
}

/** Turns a filename into something safe to use as a storage key segment. */
export function slugifyFilename(filename: string): string {
  const cleaned = filename
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return cleaned || 'file'
}
