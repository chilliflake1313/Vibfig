import { useEffect, useRef, useState } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'

type NodeDirection = 'top' | 'right' | 'bottom' | 'left'
type TextFormatType = 'bold' | 'italic' | 'underline'

type NodeTextStyle = {
  bold: boolean
  italic: boolean
  underline: boolean
  font: string
  size: number
}

type CustomNodeData = {
  label: string
  style?: NodeTextStyle
  onChange?: (id: string, label: string) => void
  onResize?: (id: string, size: { width: number; height: number }) => void
  onAddFromHandle?: (id: string, direction: NodeDirection) => void
  onActivateHandles?: (id: string | null) => void
  onOpenContextMenu?: (nodeId: string, x: number, y: number) => void
  activeEditorId?: string | null
  onToggleFormat?: (id: string, type: TextFormatType) => void
  onSetFont?: (id: string, font: string) => void
  onSetSize?: (id: string, size: number) => void
  activeNodeId?: string | null
  isLocked?: boolean
}

const positionMap: Record<NodeDirection, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
}

const styleMap: Record<NodeDirection, string> = {
  top: '-top-[6px] left-1/2 -translate-x-1/2',
  right: '-right-[6px] top-1/2 -translate-y-1/2',
  bottom: '-bottom-[6px] left-1/2 -translate-x-1/2',
  left: '-left-[6px] top-1/2 -translate-y-1/2',
}

export default function CustomNode({ id, data, selected }: NodeProps<CustomNodeData>) {
  const { label, onResize } = data
  const [edit, setEdit] = useState(false)
  const [value, setValue] = useState(label)
  const ref = useRef<HTMLDivElement>(null)
  const textStyle = data.style ?? {
    bold: false,
    italic: false,
    underline: false,
    font: 'Inter',
    size: 14,
  }

  useEffect(() => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    onResize?.(id, {
      width: Math.max(rect.width, 140),
      height: Math.max(rect.height, 40),
    })
  }, [id, label, onResize])

  const handleBlur = () => {
    data.onChange?.(id, value.trim() || label)
    setEdit(false)
  }

  const showDots = data.activeNodeId === id
  const showEditor = data.activeEditorId === id

  return (
    <div
      ref={ref}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
        if (data.isLocked) return
        data.onOpenContextMenu?.(id, e.clientX, e.clientY)
      }}
      onClick={(e) => {
        e.stopPropagation()
        data.onActivateHandles?.(id)
      }}
      onDoubleClick={() => {
        setValue(label)
        setEdit(true)
      }}
      className={`relative bg-white border rounded px-3 py-2 shadow min-w-[140px] max-w-[220px] whitespace-pre-wrap break-words ${selected ? 'border-black' : 'border-gray-300'}`}
    >
      {showEditor && (
        <div className="absolute -top-11 left-1/2 z-30 flex -translate-x-1/2 gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-white shadow">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              data.onToggleFormat?.(id, 'bold')
            }}
            className="rounded px-1.5 py-0.5 hover:bg-zinc-800"
          >
            B
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              data.onToggleFormat?.(id, 'italic')
            }}
            className="rounded px-1.5 py-0.5 hover:bg-zinc-800"
          >
            I
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              data.onToggleFormat?.(id, 'underline')
            }}
            className="rounded px-1.5 py-0.5 hover:bg-zinc-800"
          >
            U
          </button>
          <select
            value={textStyle.font}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => data.onSetFont?.(id, e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-800 px-1 text-xs"
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="monospace">Mono</option>
          </select>
          <select
            value={String(textStyle.size)}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => data.onSetSize?.(id, Number(e.target.value))}
            className="rounded border border-zinc-700 bg-zinc-800 px-1 text-xs"
          >
            <option value="12">12</option>
            <option value="14">14</option>
            <option value="18">18</option>
          </select>
        </div>
      )}

      {edit ? (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.currentTarget.blur()
            }
          }}
          autoFocus
          className="w-full outline-none"
        />
      ) : (
        <span
          style={{
            fontWeight: textStyle.bold ? 'bold' : 'normal',
            fontStyle: textStyle.italic ? 'italic' : 'normal',
            textDecoration: textStyle.underline ? 'underline' : 'none',
            fontFamily: textStyle.font,
            fontSize: `${textStyle.size}px`,
          }}
        >
          {label}
        </span>
      )}

      {(['top', 'right', 'bottom', 'left'] as NodeDirection[]).map((direction) => (
        <Handle
          key={`target-${direction}`}
          id={`target-${direction}`}
          type="target"
          position={positionMap[direction]}
          className="!h-0 !w-0 !border-0 !bg-transparent !opacity-0"
        />
      ))}

      {(['top', 'right', 'bottom', 'left'] as NodeDirection[]).map((direction) => (
        <Handle
          key={`source-${direction}`}
          id={`source-${direction}`}
          type="source"
          position={positionMap[direction]}
          onClick={(e) => {
            e.stopPropagation()
            if (!showDots || data.isLocked) return
            data.onAddFromHandle?.(id, direction)
          }}
          className={`${styleMap[direction]} !h-3 !w-3 !rounded-full !border-2 !border-white !bg-blue-500 !shadow transition ${
            showDots ? '!opacity-100' : '!opacity-0 !pointer-events-none'
          }`}
          title={`Create node ${direction} or drag to connect`}
        />
      ))}
    </div>
  )
}
