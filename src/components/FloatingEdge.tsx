import { BaseEdge, getBezierPath, type EdgeProps } from 'reactflow'
import { getEdgeParams } from '../utils/floatingEdge'

type FloatingNode = {
  position: { x: number; y: number }
  positionAbsolute?: { x: number; y: number }
  width?: number
  height?: number
}

type FloatingEdgeProps = Pick<EdgeProps, 'id' | 'markerEnd'> & {
  sourceNode?: FloatingNode
  targetNode?: FloatingNode
}

export default function FloatingEdge({
  id,
  sourceNode,
  targetNode,
  markerEnd,
}: FloatingEdgeProps) {
  if (!sourceNode || !targetNode) return null

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode)

  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
  })

  return <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} />
}
