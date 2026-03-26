import ELK from 'elkjs/lib/elk.bundled.js'
import { Position, type Edge, type Node } from 'reactflow'

type ElkNodeLike = {
  id: string
  x?: number
  y?: number
}

const elk = new ELK()

const elkOptions: Record<string, string> = {
  'elk.algorithm': 'layered',
  'elk.direction': 'RIGHT',
  'elk.spacing.nodeNode': '80',
  'elk.layered.spacing.nodeNodeBetweenLayers': '150',
  'elk.edgeRouting': 'ORTHOGONAL',
}

export const getLayoutedElements = async <TData>(
  nodes: Node<TData>[],
  edges: Edge[],
): Promise<{ nodes: Node<TData>[]; edges: Edge[] }> => {
  const graph = {
    id: 'root',
    layoutOptions: elkOptions,
    children: nodes.map((node) => ({
      id: node.id,
      width: 180,
      height: 60,
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  }

  const layoutedGraph = await elk.layout(graph)
  const positions = new Map(
    (layoutedGraph.children ?? []).map((node: ElkNodeLike) => [
      node.id,
      {
        x: node.x ?? 0,
        y: node.y ?? 0,
      },
    ]),
  )

  const layoutedNodes = nodes.map((node) => {
    const position = positions.get(node.id) ?? { x: 0, y: 0 }

    return {
      ...node,
      position,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }
  })

  return { nodes: layoutedNodes, edges }
}
