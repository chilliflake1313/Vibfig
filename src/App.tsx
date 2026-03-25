import { useState } from 'react'
import ReactFlow, { type Edge, type Node } from 'reactflow'
import 'reactflow/dist/style.css'

type LayoutNode = Node & { level: number; parentId?: string }
type GraphItem = { label: string; children?: GraphItem[] }

let id = 1

const generateGraph = (
  node: GraphItem,
  parentId: string | null = null,
  level = 0,
  nodes: LayoutNode[] = [],
  edges: Edge[] = [],
): { nodes: LayoutNode[]; edges: Edge[] } => {
  const currentId = String(id++)

  nodes.push({
    id: currentId,
    data: { label: node.label },
    position: { x: 0, y: 0 },
    level,
    parentId: parentId ?? undefined,
  })

  if (parentId) {
    edges.push({
      id: `e${parentId}-${currentId}`,
      source: parentId,
      target: currentId,
    })
  }

  if (node.children) {
    node.children.forEach((child) => {
      generateGraph(child, currentId, level + 1, nodes, edges)
    })
  }

  return { nodes, edges }
}

const layoutTree = (nodes: LayoutNode[]): LayoutNode[] => {
  const levelMap: Record<number, LayoutNode[]> = {}
  const parentMap: Record<string, LayoutNode[]> = {}

  nodes.forEach((node) => {
    if (!levelMap[node.level]) levelMap[node.level] = []
    levelMap[node.level].push(node)

    if (node.parentId) {
      if (!parentMap[node.parentId]) parentMap[node.parentId] = []
      parentMap[node.parentId].push(node)
    }
  })

  const newNodes: LayoutNode[] = []
  const positionedById: Record<string, LayoutNode> = {}

  const root = nodes.find((n) => n.level === 0)
  if (root) {
    const positionedRoot = {
      ...root,
      position: { x: 400, y: 80 },
    }

    newNodes.push(positionedRoot)
    positionedById[positionedRoot.id] = positionedRoot
  }

  const levels = Object.keys(levelMap).map(Number)
  const maxLevel = levels.length ? Math.max(...levels) : 0

  for (let level = 1; level <= maxLevel; level++) {
    const nodesAtLevel = levelMap[level] || []
    const groupMap: Record<string, LayoutNode[]> = {}

    nodesAtLevel.forEach((node) => {
      const key = node.parentId || '__rootless__'
      if (!groupMap[key]) groupMap[key] = []
      groupMap[key].push(node)
    })

    Object.entries(groupMap).forEach(([parentId, children]) => {
      if (parentId === '__rootless__') {
        children.forEach((child, index) => {
          const positioned = {
            ...child,
            position: { x: 220 + index * 180, y: 80 + level * 160 },
          }

          newNodes.push(positioned)
          positionedById[positioned.id] = positioned
        })
        return
      }

      const parent = positionedById[parentId]
      if (!parent) return

      const totalWidth = (children.length - 1) * 140

      children.forEach((child, index) => {
        const positioned = {
          ...child,
          position: {
            x: parent.position.x - totalWidth / 2 + index * 140,
            y: parent.position.y + 150,
          },
        }

        newNodes.push(positioned)
        positionedById[positioned.id] = positioned
      })
    })
  }

  return newNodes
}

function App() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [input, setInput] = useState('')

  const handleSubmit = () => {
    if (!input) return

    const data: GraphItem = {
      label: input,
      children: [
        {
          label: 'Auth',
          children: [{ label: 'Task 1' }, { label: 'Task 2' }],
        },
        {
          label: 'Database',
          children: [{ label: 'Task 3' }, { label: 'Task 4' }],
        },
      ],
    }

    id = 1
    const graph = generateGraph(data)
    const layouted = layoutTree(graph.nodes)

    setNodes(layouted)
    setEdges(graph.edges)
    setInput('')
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <ReactFlow nodes={nodes} edges={edges} />

      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: '8px',
          zIndex: 10,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter idea..."
          style={{
            padding: '8px 12px',
            border: '1px solid #d4d4d8',
            borderRadius: '8px',
            minWidth: '220px',
          }}
        />
        <button
          onClick={handleSubmit}
          style={{
            padding: '8px 12px',
            border: 'none',
            borderRadius: '8px',
            background: '#111827',
            color: '#ffffff',
            cursor: 'pointer',
          }}
        >
          Generate
        </button>
      </div>
    </div>
  )
}

export default App
