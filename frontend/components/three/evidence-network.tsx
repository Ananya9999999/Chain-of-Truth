'use client'

/**
 * The 3D "digital evidence network".
 *
 * Floating nodes joined by thin lines, with light pulses travelling along the
 * connections — a literal picture of the product: discrete pieces of evidence,
 * the relationships between them, and signal moving through.
 *
 * Performance is the binding constraint, not visual ambition. This scene:
 *   - uses ONE instanced mesh for every node (a single draw call),
 *   - builds the line set once into a single BufferGeometry,
 *   - caps device pixel ratio and drops node count on small screens,
 *   - pauses entirely when the tab is hidden,
 *   - disposes its geometries and materials on unmount.
 *
 * It is a background. It must never compete with the text in front of it, so
 * opacity stays low and motion stays slow.
 */

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

interface NodeSpec {
  position: THREE.Vector3
  scale: number
  phase: number
}

interface PulseSpec {
  from: number
  to: number
  offset: number
  speed: number
}

/** Deterministic RNG so the layout is identical on every load and on the server. */
function makeRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function buildNetwork(count: number, radius: number) {
  const rand = makeRandom(20260902)
  const nodes: NodeSpec[] = []

  for (let i = 0; i < count; i++) {
    // Fibonacci-ish shell distribution, then jittered inward so the cloud has
    // depth rather than sitting on a hollow sphere.
    const theta = Math.acos(1 - 2 * ((i + 0.5) / count))
    const phi = Math.PI * (1 + Math.sqrt(5)) * i
    const r = radius * (0.45 + rand() * 0.55)
    nodes.push({
      position: new THREE.Vector3(
        r * Math.sin(theta) * Math.cos(phi),
        r * Math.sin(theta) * Math.sin(phi) * 0.6,
        r * Math.cos(theta),
      ),
      scale: 0.5 + rand() * 0.9,
      phase: rand() * Math.PI * 2,
    })
  }

  // Connect each node to its nearest few neighbours. Proximity-based edges read
  // as a network; random pairs read as noise.
  const edges: [number, number][] = []
  const seen = new Set<string>()
  for (let i = 0; i < nodes.length; i++) {
    const distances = nodes
      .map((n, j) => ({ j, d: nodes[i].position.distanceTo(n.position) }))
      .filter((e) => e.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
    for (const { j } of distances) {
      const key = i < j ? `${i}-${j}` : `${j}-${i}`
      if (seen.has(key)) continue
      seen.add(key)
      edges.push([i, j])
    }
  }

  const pulses: PulseSpec[] = edges.slice(0, 14).map((e, i) => ({
    from: e[0],
    to: e[1],
    offset: (i / 14) % 1,
    speed: 0.09 + (i % 5) * 0.025,
  }))

  return { nodes, edges, pulses }
}

function Network({ nodeCount, reduced }: { nodeCount: number; reduced: boolean }) {
  const group = useRef<THREE.Group>(null)
  const instances = useRef<THREE.InstancedMesh>(null)
  const pulseRef = useRef<THREE.InstancedMesh>(null)
  const { pointer } = useThree()

  const { nodes, edges, pulses } = useMemo(
    () => buildNetwork(nodeCount, 7),
    [nodeCount],
  )

  const lineGeometry = useMemo(() => {
    const positions = new Float32Array(edges.length * 6)
    edges.forEach(([a, b], i) => {
      positions.set(
        [
          nodes[a].position.x, nodes[a].position.y, nodes[a].position.z,
          nodes[b].position.x, nodes[b].position.y, nodes[b].position.z,
        ],
        i * 6,
      )
    })
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [edges, nodes])

  // Three does not dispose geometry created in a memo; do it explicitly.
  useEffect(() => () => lineGeometry.dispose(), [lineGeometry])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime

    if (group.current) {
      // Slow drift plus a gentle parallax lean toward the pointer.
      group.current.rotation.y = t * 0.035
      group.current.rotation.x = Math.sin(t * 0.12) * 0.06
      if (!reduced) {
        group.current.position.x += (pointer.x * 0.6 - group.current.position.x) * 0.03
        group.current.position.y += (pointer.y * 0.35 - group.current.position.y) * 0.03
      }
    }

    if (instances.current) {
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        // Breathing scale makes the nodes read as live rather than static dots.
        const pulse = 1 + Math.sin(t * 0.9 + n.phase) * 0.22
        dummy.position.copy(n.position)
        dummy.scale.setScalar(n.scale * 0.07 * pulse)
        dummy.updateMatrix()
        instances.current.setMatrixAt(i, dummy.matrix)
      }
      instances.current.instanceMatrix.needsUpdate = true
    }

    if (pulseRef.current) {
      pulses.forEach((p, i) => {
        const progress = (t * p.speed + p.offset) % 1
        dummy.position.lerpVectors(
          nodes[p.from].position,
          nodes[p.to].position,
          progress,
        )
        // Fade in and out at the ends so pulses do not pop at the nodes.
        const fade = Math.sin(progress * Math.PI)
        dummy.scale.setScalar(0.055 * fade)
        dummy.updateMatrix()
        pulseRef.current!.setMatrixAt(i, dummy.matrix)
      })
      pulseRef.current.instanceMatrix.needsUpdate = true
    }
  })

  return (
    <group ref={group}>
      <lineSegments geometry={lineGeometry}>
        <lineBasicMaterial
          color="#1d6f7d"
          transparent
          opacity={0.34}
          depthWrite={false}
        />
      </lineSegments>

      <instancedMesh ref={instances} args={[undefined, undefined, nodes.length]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color="#5fe8ff" transparent opacity={0.7} />
      </instancedMesh>

      <instancedMesh ref={pulseRef} args={[undefined, undefined, pulses.length]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#c3f5ff" transparent opacity={0.95} />
      </instancedMesh>
    </group>
  )
}

/** Pauses rendering while the tab is hidden — no work for an unseen canvas. */
function VisibilityGate() {
  const { invalidate, setFrameloop } = useThree()
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        setFrameloop('never')
      } else {
        setFrameloop('always')
        invalidate()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [invalidate, setFrameloop])
  return null
}

export function EvidenceNetwork({
  intensity = 1,
  reduced = false,
}: {
  /** 1 for the landing hero, lower behind dense dashboard content. */
  intensity?: number
  reduced?: boolean
}) {
  const [nodeCount, setNodeCount] = useState(46)

  useEffect(() => {
    // Fewer nodes on small screens: the effect still reads, the phone survives.
    const narrow = window.matchMedia('(max-width: 768px)').matches
    const weak = (navigator.hardwareConcurrency ?? 8) <= 4
    setNodeCount(narrow || weak ? 24 : 46)
  }, [])

  return (
    <Canvas
      camera={{ position: [0, 0, 16], fov: 52 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ opacity: 0.55 * intensity }}
      frameloop={reduced ? 'demand' : 'always'}
    >
      <VisibilityGate />
      <ambientLight intensity={0.6} />
      <Network nodeCount={nodeCount} reduced={reduced} />
      <fog attach="fog" args={['#05070a', 12, 30]} />
    </Canvas>
  )
}
