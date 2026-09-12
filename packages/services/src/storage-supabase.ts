import { randomUUID } from 'node:crypto'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { slugifyFilename, type StorageDriver, type UploadTicket } from './storage'

/**
 * LOCKED FILE — Team 01 (Core Platform) + a maintainer review.
 *
 * Signed direct-to-Supabase Storage uploads. The browser sends the file straight to
 * Supabase Storage; the bytes never pass through our API.
 */

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set. Set Supabase credentials or use STORAGE_DRIVER=local.`)
  }
  return value
}

export function createSupabaseStorage(): StorageDriver {
  const url = required('SUPABASE_URL')
  const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY')
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'uploads'

  const supabase: SupabaseClient = createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return {
    name: 'supabase',

    async createUploadTicket({ folder, filename }) {
      const fileId = `${randomUUID()}-${slugifyFilename(filename)}`
      const key = `${folder}/${fileId}`

      const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(key)

      if (error || !data?.signedUrl) {
        throw new Error(`Failed to create Supabase upload ticket: ${error?.message}`)
      }

      const ticket: UploadTicket = {
        method: 'PUT',
        uploadUrl: data.signedUrl,
        fields: {},
        key,
      }
      return ticket
    },

    urlFor(key) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(key)
      return data.publicUrl
    },

    async remove(key) {
      const { error } = await supabase.storage.from(bucket).remove([key])
      if (error) {
        throw new Error(`Supabase storage delete failed: ${error.message}`)
      }
    },
  }
}
