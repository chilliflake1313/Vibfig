import { useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  MarkerType,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type DefaultEdgeOptions,
  type Edge,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
  type ReactFlowInstance,
} from 'reactflow'
import 'reactflow/dist/style.css'
import CustomEdge from './components/CustomEdge'
import CustomNode from './components/CustomNode'
import { generateGraph } from './utils/generateGraph'
import { getLayoutedElements } from './utils/elkLayout'

type TextFormatType = 'bold' | 'italic' | 'underline'
type NodeTextStyle = {
  bold: boolean
  italic: boolean
  underline: boolean
  font: string
  size: number
  fill: string
  border: string
}

type CustomNodeData = {
  label: string
  style?: NodeTextStyle
  onChange: (id: string, label: string) => void
  onResize: (id: string, size: { width: number; height: number }) => void
  onAddFromHandle?: (id: string, direction: NodeDirection) => void
  onActivateHandles?: (id: string | null) => void
  onOpenContextMenu?: (nodeId: string, x: number, y: number) => void
  activeEditorId?: string | null
  onToggleFormat?: (id: string, type: TextFormatType) => void
  onSetFont?: (id: string, font: string) => void
  onSetSize?: (id: string, size: number) => void
  activeColorId?: string | null
  onSetFill?: (id: string, fill: string) => void
  onSetBorder?: (id: string, border: string) => void
  activeNodeId?: string | null
  isLocked?: boolean
}

type NodeDirection = 'top' | 'right' | 'bottom' | 'left'
type EdgeStyleType = 'solid' | 'dashed' | 'dotted'

type CustomEdgeData = {
  styleType?: EdgeStyleType
  activeEdgeId?: string | null
  onOpenStyleMenu?: (edgeId: string) => void
  onChangeStyle?: (edgeId: string, styleType: EdgeStyleType) => void
}

const oppositeDirection: Record<NodeDirection, NodeDirection> = {
  top: 'bottom',
  right: 'left',
  bottom: 'top',
  left: 'right',
}

type GraphSnapshot = {
  nodes: Node<CustomNodeData>[]
  edges: Edge[]
}

type NodeMenuState = {
  x: number
  y: number
  nodeId: string
} | null

const defaultNodeTextStyle: NodeTextStyle = {
  bold: false,
  italic: false,
  underline: false,
  font: 'Inter',
  size: 14,
  fill: '#18181b',
  border: '#3f3f46',
}

const nodeTypes = {
  custom: CustomNode,
}

const edgeTypes = {
  custom: CustomEdge,
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
    type: 'custom',
    markerEnd: edge.markerEnd ?? defaultEdgeOptions.markerEnd,
    style: edge.style ?? defaultEdgeOptions.style,
    data: {
      ...(edge.data ?? {}),
      styleType: ((edge.data as CustomEdgeData | undefined)?.styleType ?? 'solid') as EdgeStyleType,
    },
  }))

const cloneGraph = (nodes: Node<CustomNodeData>[], edges: Edge[]): GraphSnapshot => ({
  nodes: nodes.map((node) => ({
    ...node,
    position: { ...node.position },
    data: {
      ...node.data,
      ...(node.data.style ? { style: { ...node.data.style } } : {}),
    },
    ...(node.positionAbsolute ? { positionAbsolute: { ...node.positionAbsolute } } : {}),
  })),
  edges: edges.map((edge) => ({ ...edge })),
})

type CanvasControlsProps = {
  canUndo: boolean
  canRedo: boolean
  isLocked: boolean
  onUndo: () => void
  onRedo: () => void
  onToggleLock: () => void
}

function CanvasControls({
  canUndo,
  canRedo,
  isLocked,
  onUndo,
  onRedo,
  onToggleLock,
}: CanvasControlsProps) {
  const { zoomIn, zoomOut } = useReactFlow()

  return (
    <div className="absolute right-4 bottom-4 z-20 flex flex-col gap-2 rounded-xl border border-gray-200 bg-white/95 p-2 shadow-lg">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="h-9 w-24 rounded bg-black text-sm text-white disabled:opacity-40"
      >
        Undo
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className="h-9 w-24 rounded bg-black text-sm text-white disabled:opacity-40"
      >
        Redo
      </button>
      <button onClick={() => zoomIn()} className="h-9 w-24 rounded border border-gray-300 bg-gray-100 text-sm">
        Zoom In
      </button>
      <button onClick={() => zoomOut()} className="h-9 w-24 rounded border border-gray-300 bg-gray-100 text-sm">
        Zoom Out
      </button>
      <button
        onClick={onToggleLock}
        className={`h-9 w-24 rounded text-sm text-white ${isLocked ? 'bg-green-600' : 'bg-amber-600'}`}
      >
        {isLocked ? 'Unlock' : 'Lock'}
      </button>
    </div>
  )
}

function App() {
  const [nodes, setNodes] = useState<Node<CustomNodeData>[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [input, setInput] = useState('Idea')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null)
  const [nodeMenu, setNodeMenu] = useState<NodeMenuState>(null)
  const [activeEditorId, setActiveEditorId] = useState<string | null>(null)
  const [activeColorId, setActiveColorId] = useState<string | null>(null)
  const [activeEdgeId, setActiveEdgeId] = useState<string | null>(null)
  const [isLocked, setIsLocked] = useState(false)
  const [undoStack, setUndoStack] = useState<GraphSnapshot[]>([])
  const [redoStack, setRedoStack] = useState<GraphSnapshot[]>([])

  const nodesRef = useRef<Node<CustomNodeData>[]>([])
  const edgesRef = useRef<Edge[]>([])
  const isLockedRef = useRef(false)
  const reactFlowRef = useRef<ReactFlowInstance<Node<CustomNodeData>, Edge> | null>(null)
  const createNewNodeRef = useRef<() => void>(() => {})

  useEffect(() => {
    nodesRef.current = nodes
  }, [nodes])

  useEffect(() => {
    edgesRef.current = edges
  }, [edges])

  useEffect(() => {
    isLockedRef.current = isLocked
  }, [isLocked])

  const selectedNode = selectedNodeId
    ? nodes.find((node) => node.id === selectedNodeId) ?? null
    : null

  const commitGraph = (
    nextNodes: Node<CustomNodeData>[],
    nextEdges: Edge[],
    options: { recordHistory?: boolean; clearRedo?: boolean } = {},
  ) => {
    const { recordHistory = true, clearRedo = true } = options

    if (recordHistory) {
      const currentSnapshot = cloneGraph(nodesRef.current, edgesRef.current)
      setUndoStack((prev) => [...prev, currentSnapshot])

      if (clearRedo) {
        setRedoStack([])
      }
    }

    nodesRef.current = nextNodes
    edgesRef.current = nextEdges
    setNodes(nextNodes)
    setEdges(nextEdges)
  }

  const onNodesChange: OnNodesChange = (changes) => {
    const nextNodes = applyNodeChanges(changes, nodesRef.current) as Node<CustomNodeData>[]
    commitGraph(nextNodes, edgesRef.current)
  }

  const onEdgesChange: OnEdgesChange = (changes) => {
    const nextEdges = applyEdgeChanges(changes, edgesRef.current)
    commitGraph(nodesRef.current, nextEdges)
  }

  const updateNodeLabel = (id: string, label: string) => {
    const nextNodes = nodesRef.current.map((node) =>
      node.id === id ? { ...node, data: { ...node.data, label } } : node,
    )

    commitGraph(nextNodes, edgesRef.current)
  }

  const updateNodeSize = (id: string, size: { width: number; height: number }) => {
    const nextNodes = nodesRef.current.map((node) =>
      node.id === id ? { ...node, width: size.width, height: size.height } : node,
    )

    commitGraph(nextNodes, edgesRef.current)
  }

  const updateNodeTextStyle = (id: string, changes: Partial<NodeTextStyle>) => {
    const nextNodes = nodesRef.current.map((node) => {
      if (node.id !== id) return node

      const currentStyle = node.data.style ?? defaultNodeTextStyle
      return {
        ...node,
        data: {
          ...node.data,
          style: {
            ...currentStyle,
            ...changes,
          },
        },
      }
    })

    commitGraph(nextNodes, edgesRef.current)
  }

  const toggleTextFormat = (id: string, type: TextFormatType) => {
    const node = nodesRef.current.find((n) => n.id === id)
    if (!node) return

    const currentStyle = node.data.style ?? defaultNodeTextStyle
    updateNodeTextStyle(id, { [type]: !currentStyle[type] })
  }

  const setNodeFont = (id: string, font: string) => {
    updateNodeTextStyle(id, { font })
  }

  const setNodeSize = (id: string, size: number) => {
    updateNodeTextStyle(id, { size })
  }

  const openNodeContextMenu = (nodeId: string, x: number, y: number) => {
    if (isLockedRef.current) return
    setSelectedNodeId(nodeId)
    setActiveNodeId(nodeId)
    setNodeMenu({ nodeId, x, y })
  }

  const toggleEditor = (nodeId: string) => {
    setActiveEditorId((current) => (current === nodeId ? null : nodeId))
    setActiveColorId(null)
    setNodeMenu(null)
  }

  const toggleColor = (nodeId: string) => {
    setActiveColorId((current) => (current === nodeId ? null : nodeId))
    setActiveEditorId(null)
    setNodeMenu(null)
  }

  const setNodeFill = (id: string, fill: string) => {
    updateNodeTextStyle(id, { fill })
  }

  const setNodeBorder = (id: string, border: string) => {
    updateNodeTextStyle(id, { border })
  }

  const updateEdgeStyle = (edgeId: string, styleType: EdgeStyleType) => {
    const nextEdges = edgesRef.current.map((edge) =>
      edge.id === edgeId
        ? { ...edge, data: { ...(edge.data ?? {}), styleType } }
        : edge,
    )

    commitGraph(nodesRef.current, nextEdges)
    setActiveEdgeId(null)
  }

  const addNodeFromHandle = (id: string, direction: NodeDirection) => {
    if (isLockedRef.current) return

    const baseNode = nodesRef.current.find((node) => node.id === id)
    if (!baseNode) return

    const offsets: Record<NodeDirection, { x: number; y: number }> = {
      top: { x: 0, y: -180 },
      right: { x: 220, y: 0 },
      bottom: { x: 0, y: 180 },
      left: { x: -220, y: 0 },
    }

    const newNodeId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const newNode: Node<CustomNodeData> = {
      id: newNodeId,
      type: 'custom',
      data: {
        label: 'New Node',
        style: { ...defaultNodeTextStyle },
        onChange: updateNodeLabel,
        onResize: updateNodeSize,
        onAddFromHandle: addNodeFromHandle,
      },
      position: {
        x: baseNode.position.x + offsets[direction].x,
        y: baseNode.position.y + offsets[direction].y,
      },
    }

    const newEdges: Edge[] = [
      {
        id: `e-${baseNode.id}-${newNodeId}`,
        source: baseNode.id,
        target: newNodeId,
        sourceHandle: `source-${direction}`,
        targetHandle: `target-${oppositeDirection[direction]}`,
      } as Edge,
    ]

    const nextNodes = [...nodesRef.current, newNode]
    const nextEdges = newEdges.length
      ? [...edgesRef.current, ...withEdgeDefaults(newEdges)]
      : edgesRef.current

    commitGraph(nextNodes, nextEdges)
    setSelectedNodeId(newNodeId)
    setActiveNodeId(newNodeId)
    setNodeMenu(null)
    setActiveEditorId(null)
    setActiveColorId(null)
    setActiveEdgeId(null)
  }

  const generate = async () => {
    if (!input.trim()) return

    try {
      const response = await fetch('http://localhost:5000/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea: input.trim() }),
      })

      if (!response.ok) throw new Error((await response.json()).error || 'Failed to generate')

      const data = await response.json()
      const { nodes: generatedNodes, edges: generatedEdges } = generateGraph(data, {
        onChange: updateNodeLabel,
        onResize: updateNodeSize,
        onAddFromHandle: addNodeFromHandle,
      })

      const typedNodes = generatedNodes.map((n) => ({
        ...n,
        type: 'custom' as const,
      })) as Node<CustomNodeData>[]

      const { nodes: layoutedNodes, edges: layoutedEdges } = await getLayoutedElements(
        typedNodes,
        generatedEdges,
      )

      commitGraph(layoutedNodes, withEdgeDefaults(layoutedEdges))
      setSelectedNodeId(null)
      setNodeMenu(null)
      setActiveEditorId(null)
      setActiveColorId(null)
      setActiveEdgeId(null)
    } catch (error) {
      alert(`Generate failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  useEffect(() => {
    // Don't generate on mount - wait for user input
  }, [])

  const onConnect = (params: Connection) => {
    if (isLocked) return
    if (!params.source || !params.target) return

    const [newEdge] = withEdgeDefaults([
      {
        ...params,
        id: `e-${params.source}-${params.target}-${Date.now()}`,
      } as Edge,
    ])

    const nextEdges = addEdge(newEdge, edgesRef.current)
    commitGraph(nodesRef.current, nextEdges)
    setNodeMenu(null)
    setActiveEditorId(null)
    setActiveColorId(null)
    setActiveEdgeId(null)
  }

  const createNewNode = () => {
    if (isLockedRef.current) return

    const fallbackPosition = {
      x: 120 + nodesRef.current.length * 30,
      y: 120 + nodesRef.current.length * 20,
    }

    const viewportCenter = reactFlowRef.current?.screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    })

    const position = viewportCenter ?? fallbackPosition

    const newNode: Node<CustomNodeData> = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type: 'custom',
      data: {
        label: 'New Node',
        style: { ...defaultNodeTextStyle },
        onChange: updateNodeLabel,
        onResize: updateNodeSize,
        onAddFromHandle: addNodeFromHandle,
      },
      position,
    }

    commitGraph([...nodesRef.current, newNode], edgesRef.current)
    setSelectedNodeId(newNode.id)
    setActiveNodeId(newNode.id)
    setNodeMenu(null)
    setActiveEditorId(null)
    setActiveColorId(null)
    setActiveEdgeId(null)
  }

  useEffect(() => {
    createNewNodeRef.current = createNewNode
  })

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat) return
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (event.key.toLowerCase() !== 'n') return

      const target = event.target as HTMLElement | null
      if (target) {
        const tag = target.tagName.toLowerCase()
        const isTypingTarget =
          target.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select'

        if (isTypingTarget) return
      }

      event.preventDefault()
      createNewNodeRef.current()
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const deleteNode = () => {
    if (!selectedNode || isLocked) return

    const nextNodes = nodesRef.current.filter((node) => node.id !== selectedNode.id)
    const nextEdges = edgesRef.current.filter(
      (edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id,
    )

    commitGraph(nextNodes, nextEdges)
    setSelectedNodeId(null)
    setActiveNodeId(null)
    setNodeMenu(null)
    setActiveEditorId(null)
    setActiveColorId(null)
    setActiveEdgeId(null)
  }

  const undo = () => {
    const previous = undoStack[undoStack.length - 1]
    if (!previous) return

    const currentSnapshot = cloneGraph(nodesRef.current, edgesRef.current)
    setUndoStack((prev) => prev.slice(0, -1))
    setRedoStack((prev) => [...prev, currentSnapshot])
    commitGraph(previous.nodes, previous.edges, { recordHistory: false, clearRedo: false })
  }

  const redo = () => {
    const next = redoStack[redoStack.length - 1]
    if (!next) return

    const currentSnapshot = cloneGraph(nodesRef.current, edgesRef.current)
    setRedoStack((prev) => prev.slice(0, -1))
    setUndoStack((prev) => [...prev, currentSnapshot])
    commitGraph(next.nodes, next.edges, { recordHistory: false, clearRedo: false })
  }

  const handleGenerate = () => {
    void generate()
  }

  const nodesForCanvas = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      style: node.data.style ?? { ...defaultNodeTextStyle },
      onAddFromHandle: addNodeFromHandle,
      onActivateHandles: setActiveNodeId,
      onOpenContextMenu: openNodeContextMenu,
      activeEditorId,
      onToggleFormat: toggleTextFormat,
      onSetFont: setNodeFont,
      onSetSize: setNodeSize,
      activeColorId,
      onSetFill: setNodeFill,
      onSetBorder: setNodeBorder,
      activeNodeId,
      isLocked,
    },
  }))

  const edgesForCanvas = edges.map((edge) => ({
    ...edge,
    type: 'custom',
    data: {
      ...(edge.data ?? {}),
      styleType: ((edge.data as CustomEdgeData | undefined)?.styleType ?? 'solid') as EdgeStyleType,
      activeEdgeId,
      onOpenStyleMenu: setActiveEdgeId,
      onChangeStyle: updateEdgeStyle,
    },
  }))

  return (
    <div className="relative h-screen w-screen">
      <ReactFlow
        nodes={nodesForCanvas}
        edges={edgesForCanvas}
        onInit={(instance) => {
          reactFlowRef.current = instance
        }}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => {
          setSelectedNodeId(node.id)
          setActiveNodeId(node.id)
          setNodeMenu(null)
          setActiveEditorId(null)
          setActiveColorId(null)
          setActiveEdgeId(null)
        }}
        onPaneClick={() => {
          setSelectedNodeId(null)
          setActiveNodeId(null)
          setNodeMenu(null)
          setActiveEditorId(null)
          setActiveColorId(null)
          setActiveEdgeId(null)
        }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        nodesDraggable={!isLocked}
        nodesConnectable={!isLocked}
        elementsSelectable={!isLocked}
        nodesFocusable={!isLocked}
        edgesFocusable={!isLocked}
        fitView
        fitViewOptions={{ padding: 0.2 }}
      >
        <Background />
        <CanvasControls
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          isLocked={isLocked}
          onUndo={undo}
          onRedo={redo}
          onToggleLock={() => setIsLocked((value) => !value)}
        />
      </ReactFlow>

      {nodeMenu && (
        <div
          style={{ top: nodeMenu.y, left: nodeMenu.x }}
          className="absolute z-50 rounded-md border border-zinc-700 bg-zinc-900 p-1 text-xs text-white shadow"
        >
          <button
            type="button"
            onClick={() => toggleEditor(nodeMenu.nodeId)}
            className="rounded px-2 py-1 hover:bg-zinc-800"
          >
            A
          </button>
          <button
            type="button"
            onClick={() => toggleColor(nodeMenu.nodeId)}
            className="rounded px-2 py-1 hover:bg-zinc-800"
          >
            C
          </button>
        </div>
      )}

      <div className="absolute left-4 top-4 z-10 flex gap-2 rounded bg-white p-2 shadow">
        <button
          onClick={createNewNode}
          disabled={isLocked}
          className="rounded bg-black px-3 py-1 text-white disabled:opacity-50"
        >
          New
        </button>
        <button
          onClick={deleteNode}
          disabled={!selectedNode || isLocked}
          className="rounded bg-red-600 px-3 py-1 text-white disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      <div className="absolute left-1/2 top-4 z-10 flex -translate-x-1/2 gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder="Enter idea..."
          className="w-72 rounded border border-gray-300 bg-white px-4 py-2 shadow-sm"
        />
        <button
          onClick={handleGenerate}
          className="rounded bg-black px-6 py-2 text-white shadow transition hover:bg-gray-800"
        >
          Generate
        </button>
      </div>
    </div>
  )
}

export default App
