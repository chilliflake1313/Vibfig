import type { MouseEvent } from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from 'reactflow'

type EdgeStyleType = 'solid' | 'dashed' | 'dotted'

type CustomEdgeData = {
  styleType?: EdgeStyleType
  activeEdgeId?: string | null
  onOpenStyleMenu?: (edgeId: string) => void
  onChangeStyle?: (edgeId: string, styleType: EdgeStyleType) => void
}

const getEdgeStyle = (type: EdgeStyleType | undefined) => {
  switch (type) {
    case 'dashed':
      return { strokeDasharray: '6 4' }
    case 'dotted':
      return { strokeDasharray: '2 4' }
    default:
      return {}
  }
}

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps<CustomEdgeData>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  const styleType = data?.styleType ?? 'solid'
  const showMenu = data?.activeEdgeId === id
  const style = getEdgeStyle(styleType)

  const openMenu = (event: MouseEvent<SVGPathElement>) => {
    event.preventDefault()
    event.stopPropagation()
    data?.onOpenStyleMenu?.(id)
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: '#6b7280', strokeWidth: 1.8, ...style }}
      />

      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={14}
        className="cursor-pointer"
        onContextMenu={openMenu}
      />

      <EdgeLabelRenderer>
        {showMenu && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="rounded-md border border-zinc-700 bg-zinc-900 p-1 text-xs text-white shadow"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                data?.onChangeStyle?.(id, 'solid')
              }}
              className="block w-full rounded px-2 py-1 text-left hover:bg-zinc-800"
            >
              Solid
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                data?.onChangeStyle?.(id, 'dashed')
              }}
              className="block w-full rounded px-2 py-1 text-left hover:bg-zinc-800"
            >
              Dashed
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                data?.onChangeStyle?.(id, 'dotted')
              }}
              className="block w-full rounded px-2 py-1 text-left hover:bg-zinc-800"
            >
              Dotted
            </button>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  )
}
