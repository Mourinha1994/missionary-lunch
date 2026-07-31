import { api } from './client'

type Id = string

export interface CrudPaths {
  list: string
  create: string
  getOne: (id: Id) => string
  update: (id: Id) => string
  remove: (id: Id) => string
}

interface CreateCrudApiOptions {
  basePath: string
  paths?: Partial<CrudPaths>
}

export function createCrudApi<TEntity, TCreate, TUpdate = Partial<TEntity>>(
  options: CreateCrudApiOptions,
) {
  const normalizedBasePath = options.basePath.startsWith('/')
    ? options.basePath
    : `/${options.basePath}`

  const paths: CrudPaths = {
    list: normalizedBasePath,
    create: normalizedBasePath,
    getOne: (id) => `${normalizedBasePath}/${id}`,
    update: (id) => `${normalizedBasePath}/${id}`,
    remove: (id) => `${normalizedBasePath}/${id}`,
    ...options.paths,
  }

  return {
    getAll: (onlyActive = true) =>
      api
        .get<TEntity[]>(paths.list, { params: { onlyActive } })
        .then((response) => response.data),
    getOne: (id: Id) =>
      api.get<TEntity>(paths.getOne(id)).then((response) => response.data),
    create: (data: TCreate) =>
      api
        .post<TEntity>(paths.create, data)
        .then((response) => response.data),
    update: (id: Id, data: TUpdate) =>
      api
        .patch<TEntity>(paths.update(id), data)
        .then((response) => response.data),
    remove: (id: Id) =>
      api.delete(paths.remove(id)).then((response) => response.data),
  }
}
