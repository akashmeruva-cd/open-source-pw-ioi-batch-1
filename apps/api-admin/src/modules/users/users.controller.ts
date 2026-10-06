import type { Request, Response } from 'express'
import { hashPassword } from '@repo/auth/password'
import { HttpError } from '@repo/http/http-error'
import { User, type UserDoc } from '@repo/models/user'
import type { PublicUser } from '@repo/validation/auth'
import type {
  CreateUserInput,
  ResetPasswordInput,
  UpdateUserInput,
  UserListQuery,
} from '@repo/validation/users'
import { Types, type FilterQuery } from 'mongoose'

function toPublicUser(user: UserDoc): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    batchId: user.batchId ? user.batchId.toString() : null,
    avatarUrl: user.avatarUrl,
  }
}

export async function listUsers(req: Request, res: Response) {
  const query = req.query as unknown as UserListQuery
  
  const filter: FilterQuery<UserDoc> = {}
  if (query.role) filter.role = query.role
  if (query.batchId) filter.batchId = new Types.ObjectId(query.batchId)
  if (query.isActive !== undefined) filter.isActive = query.isActive

  const skip = (query.page - 1) * query.limit

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    User.countDocuments(filter),
  ])

  res.json({
    items: users.map(toPublicUser),
    page: query.page,
    limit: query.limit,
    total,
    hasMore: skip + users.length < total,
  })
}

export async function createUser(req: Request, res: Response) {
  const input = req.body as CreateUserInput

  const existingUser = await User.findOne({ email: input.email })
  if (existingUser) {
    throw HttpError.conflict('Email is already in use')
  }

  const hashedPassword = await hashPassword(input.password)

  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash: hashedPassword,
    role: input.role,
    batchId: input.batchId ? new Types.ObjectId(input.batchId) : null,
    avatarUrl: input.avatarUrl || null,
    isActive: input.isActive ?? true,
  })

  res.status(201).json(toPublicUser(user))
}

export async function updateUser(req: Request, res: Response) {
  const { id } = req.params
  const input = req.body as UpdateUserInput

  const updateData: Partial<UserDoc> = {}
  if (input.name !== undefined) updateData.name = input.name
  if (input.email !== undefined) updateData.email = input.email
  if (input.role !== undefined) updateData.role = input.role
  if (input.batchId !== undefined) updateData.batchId = input.batchId ? new Types.ObjectId(input.batchId) : null
  if (input.avatarUrl !== undefined) updateData.avatarUrl = input.avatarUrl || null
  if (input.isActive !== undefined) updateData.isActive = input.isActive

  if (input.email) {
    const existing = await User.findOne({ email: input.email, _id: { $ne: id } })
    if (existing) {
      throw HttpError.conflict('Email is already in use')
    }
  }

  const user = await User.findByIdAndUpdate(id, { $set: updateData }, { new: true })
  
  if (!user) {
    throw HttpError.notFound('User not found')
  }

  res.json(toPublicUser(user))
}

export async function resetPassword(req: Request, res: Response) {
  const { id } = req.params
  const input = req.body as ResetPasswordInput

  const hashedPassword = await hashPassword(input.password)
  const user = await User.findByIdAndUpdate(id, { $set: { passwordHash: hashedPassword } }, { new: true })

  if (!user) {
    throw HttpError.notFound('User not found')
  }

  res.json(toPublicUser(user))
}
