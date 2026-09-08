export type Path = (string | number)[]

export function getDeep<T>(obj: unknown, path: Path): T {
  let cur: unknown = obj
  for (const key of path) {
    if (cur == null) return undefined as unknown as T
    cur = (cur as Record<string | number, unknown>)[key]
  }
  return cur as T
}

export function setDeep<T>(obj: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T
  const [head, ...rest] = path
  if (Array.isArray(obj)) {
    const next = [...(obj as unknown[])] as unknown as Record<string | number, unknown>
    next[head] = setDeep((obj as unknown[])[head as number], rest, value)
    return next as unknown as T
  }
  const next = { ...(obj as Record<string, unknown>) }
  next[head as string] = setDeep((obj as Record<string, unknown>)[head as string], rest, value)
  return next as T
}