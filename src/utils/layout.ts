import { type Node } from 'reactflow'

type LNode = Node & {
  level: number
  parentId?: string | null
}

export const layoutHybrid = (nodes: LNode[]): Node[] => {
  const root = nodes.find((n) => n.level === 0)
  if (!root) return []

  const modules = nodes.filter((n) => n.level === 1)
  const childrenMap: Record<string, LNode[]> = {}

  nodes.forEach((n) => {
    if (n.parentId) {
      if (!childrenMap[n.parentId]) childrenMap[n.parentId] = []
      childrenMap[n.parentId].push(n)
    }
  })

  const center = { x: 500, y: 300 }
  const spacingX = 220
  const spacingY = 180

  const result: Node[] = []

  // ROOT - center
  result.push({
    ...root,
    position: center,
  })

  // MODULES - flower pattern (strict)
  const perRow = Math.ceil(modules.length / 2)

  modules.forEach((mod, i) => {
    const row = i < perRow ? -1 : 1
    const col = i % perRow

    const x = center.x - ((perRow - 1) * spacingX) / 2 + col * spacingX
    const y = center.y + row * spacingY

    const modNode = { ...mod, position: { x, y } }
    result.push(modNode)

    // TASKS - strict under module
    const children = childrenMap[mod.id] || []
    const totalWidth = (children.length - 1) * 120

    children.forEach((child, j) => {
      const cx = x - totalWidth / 2 + j * 120
      const cy = y + (row === -1 ? -120 : 120)

      result.push({
        ...child,
        position: { x: cx, y: cy },
      })
    })
  })

  return result
}
