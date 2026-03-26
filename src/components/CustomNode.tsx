import { useEffect, useState } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'

type CustomNodeData = {
  label: string
  onChange?: (id: string, label: string) => void
}

export default function CustomNode({ id, data, selected }: NodeProps<CustomNodeData>) {
  const [edit, setEdit] = useState(false)
  const [value, setValue] = useState(data.label)

  useEffect(() => {
    setValue(data.label)
  }, [data.label])

  const handleBlur = () => {
    data.onChange?.(id, value.trim() || data.label)
    setEdit(false)
  }

  return (
    <div
      onDoubleClick={() => setEdit(true)}
      className={`bg-white border rounded px-3 py-2 shadow min-w-[120px] ${selected ? 'border-black' : 'border-gray-300'}`}
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
