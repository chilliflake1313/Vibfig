import { type Edge, type Node } from 'reactflow'

export type InputNode = {
  label: string
  children?: InputNode[]
}

type GraphNodeData = {
  label: string
}

export const generateGraph = (data: InputNode): { nodes: Node<GraphNodeData>[]; edges: Edge[] } => {
  const nodes: Node<GraphNodeData>[] = []
  const edges: Edge[] = []
  let idCounter = 1

  const traverse = (node: InputNode, parentId: string | null = null) => {
    const currentId = String(idCounter++)

    nodes.push({
      id: currentId,
      data: { label: node.label },
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
