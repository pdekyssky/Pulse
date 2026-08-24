export const DEFAULT_PAGE_SIZE = 6

export function getTotalPages(totalItems: number, pageSize: number): number {
  return totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
  const offset = (page - 1) * pageSize
  return items.slice(offset, offset + pageSize)
}
