import { useEffect, useRef, useState } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'

type CustomNodeData = {
  label: string
  onChange?: (id: string, label: string) => void
  onResize?: (id: string, size: { width: number; height: number }) => void
}

export default function CustomNode({ id, data, selected }: NodeProps<CustomNodeData>) {
  const [edit, setEdit] = useState(false)
  const [value, setValue] = useState(data.label)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setValue(data.label)
  }, [data.label])

  useEffect(() => {
    if (!ref.current) return

    const rect = ref.current.getBoundingClientRect()
    data.onResize?.(id, {
      width: Math.max(rect.width, 140),
      height: Math.max(rect.height, 40),
    })
  }, [data.label, id, data])

  const handleBlur = () => {
    data.onChange?.(id, value.trim() || data.label)
    setEdit(false)
  }

  return (
    <div
      ref={ref}
      onDoubleClick={() => setEdit(true)}
      className={`bg-white border rounded px-3 py-2 shadow min-w-[140px] max-w-[220px] whitespace-pre-wrap break-words ${selected ? 'border-black' : 'border-gray-300'}`}
    >
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
        value
      )}

      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
