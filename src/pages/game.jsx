import dynamic from 'next/dynamic'
import { Canvas } from '@react-three/fiber'
import { Loader } from '@react-three/drei'

const StarshipGame = dynamic(() => import('@/components/game/StarshipGame').then((mod) => mod.StarshipGame), {
  ssr: false,
})

export default function GamePage() {
  return (
    <>
      <Canvas>
        <StarshipGame />
      </Canvas>
      <Loader />
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        color: 'white',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '10px',
        borderRadius: '5px'
      }}>
        <h3>Controls:</h3>
        <p>Arrow Keys: Move ship</p>
        <p>Space: Shoot</p>
      </div>
    </>
  )
}