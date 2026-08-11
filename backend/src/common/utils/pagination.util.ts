export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export async function paginate<T>(
  page: number,
  pageSize: number,
  findMany: (skip: number, take: number) => Promise<T[]>,
  count: () => Promise<number>,
): Promise<PaginatedResult<T>> {
  const [data, total] = await Promise.all([
    findMany((page - 1) * pageSize, pageSize),
    count(),
  ]);
  return { data, total, page, pageSize };
}
