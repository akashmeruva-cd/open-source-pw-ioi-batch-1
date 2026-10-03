import { HttpError } from '@repo/http/http-error'
import { Material } from '@repo/models/material'
import { getStorage } from '@repo/services/storage'
import type { CreateMaterialInput, UpdateMaterialInput } from '@repo/validation/materials'

/** Owner: Team 04 — Class Materials. */

export async function createUploadSignature(filename: string, folder = 'materials') {
  const storage = getStorage()
  const ticket = await storage.createUploadTicket({ folder, filename })

  // Ensure CLOUDINARY_API_SECRET is never exposed in response
  return { ticket }
}

export async function createMaterial(input: CreateMaterialInput, userId: string) {
  const material = await Material.create({
    subjectId: input.subjectId,
    sessionId: input.sessionId ?? null,
    title: input.title,
    description: input.description ?? null,
    type: input.type,
    cloudinary: input.cloudinary ?? null,
    externalUrl: input.externalUrl ?? null,
    uploadedBy: userId,
  })

  return material.toObject()
}

export async function updateMaterial(id: string, input: UpdateMaterialInput) {
  const material = await Material.findById(id)
  if (!material) {
    throw HttpError.notFound('Material not found')
  }

  if (input.title !== undefined) material.title = input.title
  if (input.description !== undefined) material.description = input.description
  if (input.type !== undefined) material.type = input.type
  if (input.sessionId !== undefined) material.sessionId = input.sessionId as any
  if (input.externalUrl !== undefined) material.externalUrl = input.externalUrl
  if (input.cloudinary !== undefined) material.cloudinary = input.cloudinary as any

  await material.save()
  return material.toObject()
}

export async function deleteMaterial(id: string) {
  const material = await Material.findById(id)
  if (!material) {
    throw HttpError.notFound('Material not found')
  }

  if (material.cloudinary?.publicId) {
    try {
      const storage = getStorage()
      await storage.remove(material.cloudinary.publicId)
    } catch {
      // Ignore storage deletion error if already missing
    }
  }

  await material.deleteOne()
  return { success: true }
}
