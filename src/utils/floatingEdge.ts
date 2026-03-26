import { Position, type XYPosition } from 'reactflow'

type FloatingNode = {
  position: XYPosition
  positionAbsolute?: XYPosition
  width?: number
  height?: number
}

const center = (node: FloatingNode) => {
  const base = node.positionAbsolute ?? node.position
  const width = node.width ?? 0
  const height = node.height ?? 0

  return {
    x: base.x + width / 2,
    y: base.y + height / 2,
  }
}

export const getEdgeParams = (source: FloatingNode, target: FloatingNode) => {
  const sourceCenter = center(source)
  const targetCenter = center(target)

  return {
    sx: sourceCenter.x,
    sy: sourceCenter.y,
    tx: targetCenter.x,
    ty: targetCenter.y,
    sourcePos: Position.Right,
    targetPos: Position.Left,
  }
}
