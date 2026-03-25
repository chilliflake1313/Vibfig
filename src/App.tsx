import { Background, Controls } from 'reactflow'
import ReactFlow from 'reactflow'
import 'reactflow/dist/style.css'

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow nodes={[]} edges={[]}>
        <Background gap={24} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  )
}

export default App
