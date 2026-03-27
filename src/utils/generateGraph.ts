import { type Edge, type Node } from 'reactflow'

export type InputNode = {
  label: string
  children?: InputNode[]
}

export type GraphNodeData = {
  label: string
  style?: {
    bold: boolean
    italic: boolean
    underline: boolean
    font: string
    size: number
    fill: string
    border: string
  }
  onChange?: (id: string, label: string) => void
  onResize?: (id: string, size: { width: number; height: number }) => void
  onAddFromHandle?: (id: string, direction: 'top' | 'right' | 'bottom' | 'left') => void
  onActivateHandles?: (id: string | null) => void
  activeNodeId?: string | null
  isLocked?: boolean
}

export const generateGraph = (
  data: InputNode,
  callbacks?: Omit<GraphNodeData, 'label'>,
): { nodes: Node<GraphNodeData>[]; edges: Edge[] } => {
  const nodes: Node<GraphNodeData>[] = []
  const edges: Edge[] = []
  let idCounter = 1

  const traverse = (node: InputNode, parentId: string | null = null) => {
    const currentId = String(idCounter++)

    nodes.push({
      id: currentId,
      data: {
        label: node.label,
        style: {
          bold: false,
          italic: false,
          underline: false,
          font: 'Inter',
          size: 14,
          fill: '#18181b',
          border: '#3f3f46',
        },
        ...callbacks,
      },
      position: { x: 0, y: 0 },
    })

    if (parentId) {
      edges.push({
        id: `e${parentId}-${currentId}`,
        source: parentId,
        target: currentId,
        type: 'smoothstep',
      })
    }

    node.children?.forEach((child) => {
      traverse(child, currentId)
    })
  }

  traverse(data)

  return { nodes, edges }
}
