/**
 * Reusable pagination helpers.
 * Every list endpoint uses these — no ad-hoc LIMIT/OFFSET.
 */
import { z } from 'zod'

export const PaginationSchema = z.object({
  page:     z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(200).default(50),
})
export type Pagination = z.infer<typeof PaginationSchema>

export type PageResult<T> = {
  items: T[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

export function paginate<T>(items: T[], total: number, page: number, perPage: number): PageResult<T> {
  return { items, total, page, per_page: perPage, has_more: page * perPage < total }
}

export function toOffset(page: number, perPage: number) {
  return { limit: perPage, offset: (page - 1) * perPage }
}
