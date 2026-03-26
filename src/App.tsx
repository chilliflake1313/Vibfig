import { useEffect, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type DefaultEdgeOptions,
  type Edge,
  type Node,
} from 'reactflow'
import 'reactflow/dist/style.css'
import CustomNode from './components/CustomNode'
import { generateGraph } from './utils/generateGraph'
import { getLayoutedElements } from './utils/elkLayout'

type CustomNodeData = {
  label: string
  onChange: (id: string, label: string) => void
  onResize: (id: string, size: { width: number; height: number }) => void
}

const nodeTypes = {
  custom: CustomNode,
}

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: {
    type: MarkerType.ArrowClosed,
  },
  style: {
    strokeWidth: 1.8,
  },
}

const withEdgeDefaults = (inputEdges: Edge[]): Edge[] =>
  inputEdges.map((edge, index) => ({
    ...edge,
    id: edge.id || `e-${edge.source}-${edge.target}-${index}`,
    type: 'smoothstep',
    markerEnd: edge.markerEnd ?? defaultEdgeOptions.markerEnd,
    style: edge.style ?? defaultEdgeOptions.style,
  }))

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNodeData>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [input, setInput] = useState('Idea')
  const [selectedNode, setSelectedNode] = useState<Node<CustomNodeData> | null>(null)

  const updateNodeLabel = (id: string, label: string) => {
    setNodes((nds) =>
      nds.map((node) => (node.id === id ? { ...node, data: { ...node.data, label } } : node)),
    )

    setSelectedNode((current) => {
      if (!current || current.id !== id) return current
      return { ...current, data: { ...current.data, label } }
    })
  }

  const updateNodeSize = (id: string, size: { width: number; height: number }) => {
    setNodes((nds) =>
      nds.map((node) => (node.id === id ? { ...node, width: size.width, height: size.height } : node)),
    )
  }

  const generate = async (label: string) => {
    const rawData = {
      label,
      children: [
        { label: 'Module A', children: [{ label: 'Task 1' }, { label: 'Task 2' }] },
        { label: 'Module B', children: [{ label: 'Task 3' }, { label: 'Task 4' }] },
        { label: 'Module C', children: [{ label: 'Task 5' }, { label: 'Task 6' }] },
      ],
    }

    const { nodes: generatedNodes, edges: generatedEdges } = generateGraph(rawData)
    if (import.meta.env.DEV) {
      console.debug('Generated graph:', {
        nodeCount: generatedNodes.length,
        edgeCount: generatedEdges.length,
      })
    }

    const typedNodes = generatedNodes.map((node) => ({
      ...node,
      type: 'custom',
      data: {
        ...node.data,
        onChange: updateNodeLabel,
        onResize: updateNodeSize,
      },
    }))

    const { nodes: layoutedNodes, edges: layoutedEdges } = await getLayoutedElements(
      typedNodes,
      generatedEdges,
    )

    setNodes(layoutedNodes)
    setEdges(withEdgeDefaults(layoutedEdges))
    setSelectedNode(null)
  }

  useEffect(() => {
    void generate('Idea')
  }, [])

  const onConnect = (params: Connection) => {
    if (!params.source || !params.target) return

    const [newEdge] = withEdgeDefaults([
      {
        ...params,
        id: `e-${params.source}-${params.target}-${Date.now()}`,
      } as Edge,
    ])

    setEdges((eds) => addEdge(newEdge, eds))
  }

  const addNode = () => {
    if (!selectedNode) return

    const newNode: Node = {
      id: Date.now().toString(),
      type: 'custom',
      data: {
        label: 'New Node',
        onChange: updateNodeLabel,
        onResize: updateNodeSize,
      },
      position: {
        x: selectedNode.position.x + 200,
        y: selectedNode.position.y,
      },
    }

    setNodes((nds) => [...nds, newNode])

    const [newEdge] = withEdgeDefaults([
      {
        id: `e-${selectedNode.id}-${newNode.id}`,
        source: selectedNode.id,
        target: newNode.id,
      } as Edge,
    ])
    setEdges((eds) => [...eds, newEdge])
  }

  const deleteNode = () => {
    if (!selectedNode) return

    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id))
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id),
    )
    setSelectedNode(null)
  }

  const handleGenerate = () => {
    if (!input.trim()) return
    void generate(input.trim())
  }

  return (
    <div className="w-screen h-screen relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => setSelectedNode(node as Node<CustomNodeData>)}
        onPaneClick={() => setSelectedNode(null)}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        nodesDraggable={true}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background />
        <Controls />
      </ReactFlow>

      <div className="absolute top-4 left-4 bg-white shadow p-2 rounded flex gap-2 z-10">
        <button
          onClick={addNode}
          disabled={!selectedNode}
          className="px-3 py-1 bg-black text-white rounded disabled:opacity-50"
        >
          Add
        </button>
        <button
          onClick={deleteNode}
          disabled={!selectedNode}
          className="px-3 py-1 bg-red-600 text-white rounded disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder="Enter idea..."
          className="px-4 py-2 border border-gray-300 rounded shadow-sm w-72 bg-white"
        />
        <button
          onClick={handleGenerate}
          className="px-6 py-2 bg-black text-white rounded shadow hover:bg-gray-800 transition"
        >
          Generate
        </button>
      </div>
    </div>
  )
}

export default App
