export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot === -1 ? '' : filename.slice(lastDot + 1)
}

export function getBasename(path: string): string {
  const parts = path.split('/')
  return parts[parts.length - 1]
}

export function getDirname(path: string): string {
  const parts = path.split('/')
  parts.pop()
  return parts.join('/')
}

export function joinPath(...parts: string[]): string {
  return parts.filter(Boolean).join('/')
}

export function normalizePath(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/')
}

export function isAbsolutePath(path: string): boolean {
  return path.startsWith('/')
}

export function relativePath(from: string, to: string): string {
  const fromParts = normalizePath(from).split('/')
  const toParts = normalizePath(to).split('/')

  let commonLength = 0
  for (let i = 0; i < Math.min(fromParts.length, toParts.length); i++) {
    if (fromParts[i] === toParts[i]) {
      commonLength++
    } else {
      break
    }
  }

  const upCount = fromParts.length - commonLength
  const ups = Array(upCount).fill('..')
  const downs = toParts.slice(commonLength)

  return [...ups, ...downs].join('/')
}
