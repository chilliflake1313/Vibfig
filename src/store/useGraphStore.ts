import { create } from 'zustand'
import { type Edge, type Node } from 'reactflow'

type GraphState = {
  nodes: Node[]
  edges: Edge[]
  setGraph: (nodes: Node[], edges: Edge[]) => void
  clear: () => void
}

export const useGraphStore = create<GraphState>((set) => ({
  nodes: [],
  edges: [],
  setGraph: (nodes, edges) => set({ nodes, edges }),
  clear: () => set({ nodes: [], edges: [] }),
}))
