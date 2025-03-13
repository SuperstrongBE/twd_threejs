import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { ConeGeometry } from 'three'
import { PerspectiveCamera } from '@react-three/drei'
import { useSpring, animated } from '@react-spring/three'
import { Vector3 } from 'three'

const MOVEMENT_SPEED = 0.1
const ROTATION_SPEED = 0.03
const BULLET_SPEED = 0.5
const ENEMY_SPAWN_INTERVAL = 3000

export function StarshipGame() {
  const shipRef = useRef()
  const bulletsRef = useRef([])
  const enemiesRef = useRef([])
  const [bullets, setBullets] = useState([])
  const [enemies, setEnemies] = useState([])
  const [keys, setKeys] = useState({ up: false, down: false, left: false, right: false })

  // Camera spring animation
  const [{ cameraPosition }, setCameraPosition] = useSpring(() => ({
    cameraPosition: [0, 5, 10],
    config: { mass: 1, tension: 180, friction: 12 }
  }))

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowUp') setKeys(k => ({ ...k, up: true }))
      if (e.key === 'ArrowDown') setKeys(k => ({ ...k, down: true }))
      if (e.key === 'ArrowLeft') setKeys(k => ({ ...k, left: true }))
      if (e.key === 'ArrowRight') setKeys(k => ({ ...k, right: true }))
      if (e.code === 'Space') shoot()
    }

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowUp') setKeys(k => ({ ...k, up: false }))
      if (e.key === 'ArrowDown') setKeys(k => ({ ...k, down: false }))
      if (e.key === 'ArrowLeft') setKeys(k => ({ ...k, left: false }))
      if (e.key === 'ArrowRight') setKeys(k => ({ ...k, right: false }))
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Spawn enemies
  useEffect(() => {
    const spawnEnemy = () => {
      const angle = Math.random() * Math.PI * 2
      const distance = 20
      const x = Math.cos(angle) * distance
      const z = Math.sin(angle) * distance
      
      setEnemies(prev => [...prev, {
        id: Date.now(),
        position: [x, 0, z]
      }])
    }

    const interval = setInterval(spawnEnemy, ENEMY_SPAWN_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  // Shooting mechanism
  const shoot = () => {
    if (!shipRef.current) return
    
    const shipPosition = shipRef.current.position
    const shipRotation = shipRef.current.rotation
    
    setBullets(prev => [...prev, {
      id: Date.now(),
      position: [shipPosition.x, shipPosition.y, shipPosition.z],
      rotation: [0, shipRotation.y, 0]
    }])
  }

  // Game loop
  useFrame((state, delta) => {
    if (!shipRef.current) return

    // Update ship position and rotation
    if (keys.up) shipRef.current.position.z -= MOVEMENT_SPEED
    if (keys.down) shipRef.current.position.z += MOVEMENT_SPEED
    if (keys.left) shipRef.current.rotation.y += ROTATION_SPEED
    if (keys.right) shipRef.current.rotation.y -= ROTATION_SPEED

    // Update camera position
    const targetPosition = [
      shipRef.current.position.x,
      shipRef.current.position.y + 5,
      shipRef.current.position.z + 10
    ]
    setCameraPosition({ cameraPosition: targetPosition })

    // Update bullets
    setBullets(prev => prev.map(bullet => {
      const direction = new Vector3(0, 0, -1).applyAxisAngle(new Vector3(0, 1, 0), bullet.rotation[1])
      return {
        ...bullet,
        position: [
          bullet.position[0] + direction.x * BULLET_SPEED,
          bullet.position[1],
          bullet.position[2] + direction.z * BULLET_SPEED
        ]
      }
    }).filter(bullet => {
      // Remove bullets that are too far
      return Math.abs(bullet.position[0]) < 50 && Math.abs(bullet.position[2]) < 50
    }))

    // Update enemies
    setEnemies(prev => prev.map(enemy => {
      const enemyPos = new Vector3(...enemy.position)
      const shipPos = new Vector3(shipRef.current.position.x, 0, shipRef.current.position.z)
      const direction = shipPos.sub(enemyPos).normalize()
      
      return {
        ...enemy,
        position: [
          enemy.position[0] + direction.x * 0.05,
          enemy.position[1],
          enemy.position[2] + direction.z * 0.05
        ]
      }
    }))

    // Check collisions
    const bulletRadius = 0.2
    const enemyRadius = 0.5

    bullets.forEach(bullet => {
      enemies.forEach(enemy => {
        const dx = bullet.position[0] - enemy.position[0]
        const dz = bullet.position[2] - enemy.position[2]
        const distance = Math.sqrt(dx * dx + dz * dz)

        if (distance < bulletRadius + enemyRadius) {
          setBullets(prev => prev.filter(b => b.id !== bullet.id))
          setEnemies(prev => prev.filter(e => e.id !== enemy.id))
        }
      })
    })
  })

  return (
    <>
      <animated.group position={cameraPosition}>
        <PerspectiveCamera makeDefault position={[0, 0, 0]} />
      </animated.group>

      <mesh ref={shipRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.5, 2, 8]} />
        <meshStandardMaterial color="blue" />
      </mesh>

      {/* Bullets */}
      {bullets.map(bullet => (
        <mesh
          key={bullet.id}
          position={bullet.position}
          rotation={bullet.rotation}
        >
          <sphereGeometry args={[0.2]} />
          <meshStandardMaterial color="yellow" />
        </mesh>
      ))}

      {/* Enemies */}
      {enemies.map(enemy => (
        <mesh
          key={enemy.id}
          position={enemy.position}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="red" />
        </mesh>
      ))}

      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
    </>
  )
}