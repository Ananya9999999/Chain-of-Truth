'use client'

/**
 * Rotatable 3D anatomical viewer.
 *
 * A translucent human figure with a circulatory network inside it — warm
 * arteries, cool veins — in the style of a medical-imaging render. Drag to
 * orbit, scroll to zoom. Injury regions are marked by pulsing beacons that can
 * be clicked, and a region only appears when the case file records an
 * observation for it.
 *
 * The body is built from parametric primitives rather than a scanned mesh. That
 * is a deliberate limit, not a shortcut: this is a forensic *interface* for
 * locating and describing observations, and a photoreal anatomical model would
 * imply a medical authority the tool does not have. It is legible and honest
 * about being a schematic.
 *
 * Performance: shared geometries and materials, no shadow maps, no
 * post-processing, DPR capped, and the frame loop pauses when the tab is hidden.
 */

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

export interface AnatomyMarker {
  id: string
  label: string
  /** Position in body space. */
  position: [number, number, number]
  color: string
  status: 'confirmed' | 'hypothesis'
  summary: string
}

/* ----------------------------------------------------------------- vessels */

/**
 * Builds a tube along a path. Used for both arterial and venous trees so they
 * share one code path and one material family.
 */
function Vessel({
  points,
  color,
  radius = 0.012,
  opacity = 0.85,
}: {
  points: [number, number, number][]
  color: string
  radius?: number
  opacity?: number
}) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    )
    return new THREE.TubeGeometry(curve, Math.max(12, points.length * 6), radius, 6, false)
  }, [points, radius])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  )
}

const ARTERY = '#ff4d5e'
const VEIN = '#3fa9f5'
const ORGAN = '#4aa8e0'

/**
 * Suggested internal structures — heart, lungs, liver, ribcage, pelvis, spine.
 *
 * Deliberately low-detail: enough for the torso to read as anatomy rather than
 * an empty shell, without implying the fidelity of a medical scan. They carry
 * no case data and are never clickable.
 */
function Organs() {
  const soft = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: ORGAN,
        transparent: true,
        opacity: 0.34,
        roughness: 0.5,
        transmission: 0.3,
        depthWrite: false,
      }),
    [],
  )
  const bone = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#bfe6ff',
        transparent: true,
        opacity: 0.20,
        wireframe: true,
      }),
    [],
  )
  useEffect(() => () => { soft.dispose(); bone.dispose() }, [soft, bone])

  return (
    <group>
      {/* heart */}
      <mesh position={[-0.045, 0.44, 0.04]} scale={[1, 1.15, 0.9]}>
        <sphereGeometry args={[0.055, 16, 14]} />
        <meshBasicMaterial color="#ff3d52" transparent opacity={0.75} />
      </mesh>
      {/* lungs */}
      <mesh position={[0.075, 0.47, 0]} scale={[0.85, 1.35, 0.75]} material={soft}>
        <sphereGeometry args={[0.075, 16, 14]} />
      </mesh>
      <mesh position={[-0.085, 0.47, 0]} scale={[0.8, 1.35, 0.75]} material={soft}>
        <sphereGeometry args={[0.075, 16, 14]} />
      </mesh>
      {/* liver */}
      <mesh position={[0.06, 0.24, 0.02]} scale={[1.25, 0.7, 0.8]} material={soft}>
        <sphereGeometry args={[0.07, 14, 12]} />
      </mesh>
      {/* viscera */}
      <mesh position={[0, 0.06, 0.01]} scale={[1.15, 0.85, 0.8]} material={soft}>
        <sphereGeometry args={[0.095, 16, 14]} />
      </mesh>
      {/* spine */}
      <mesh position={[0, 0.3, -0.05]} material={bone}>
        <cylinderGeometry args={[0.018, 0.022, 0.72, 8]} />
      </mesh>
      {/* ribcage */}
      {[0.56, 0.5, 0.44, 0.38, 0.32, 0.26].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={bone}>
          <torusGeometry args={[0.145 - Math.abs(i - 2.5) * 0.012, 0.006, 6, 22, Math.PI * 1.35]} />
        </mesh>
      ))}
      {/* pelvis */}
      <mesh position={[0, -0.14, 0]} rotation={[Math.PI / 2, 0, 0]} material={bone}>
        <torusGeometry args={[0.115, 0.016, 8, 20]} />
      </mesh>
      {/* skull */}
      <mesh position={[0, 0.95, 0]} material={bone}>
        <sphereGeometry args={[0.115, 16, 14]} />
      </mesh>
    </group>
  )
}

/** Circulatory paths, mirrored left/right where anatomy is symmetric. */
const VESSEL_PATHS: { points: [number, number, number][]; color: string; r?: number }[] = [
  // aorta / spine trunk
  { points: [[0, 0.72, 0], [0, 0.45, 0.02], [0, 0.1, 0.02], [0, -0.15, 0]], color: ARTERY, r: 0.018 },
  { points: [[0.03, 0.72, 0], [0.03, 0.45, -0.02], [0.03, 0.1, -0.02], [0.03, -0.15, 0]], color: VEIN, r: 0.016 },
  // neck / head
  { points: [[0, 0.62, 0.02], [0.03, 0.82, 0.03], [0.03, 0.95, 0.02]], color: ARTERY },
  { points: [[0, 0.62, -0.02], [-0.03, 0.82, -0.02], [-0.03, 0.95, -0.01]], color: VEIN },
  // arms
  { points: [[0.09, 0.55, 0], [0.24, 0.5, 0], [0.3, 0.2, 0], [0.32, -0.05, 0]], color: ARTERY },
  { points: [[0.12, 0.54, -0.02], [0.26, 0.48, -0.02], [0.32, 0.18, -0.02], [0.34, -0.06, 0]], color: VEIN },
  { points: [[-0.09, 0.55, 0], [-0.24, 0.5, 0], [-0.3, 0.2, 0], [-0.32, -0.05, 0]], color: ARTERY },
  { points: [[-0.12, 0.54, -0.02], [-0.26, 0.48, -0.02], [-0.32, 0.18, -0.02], [-0.34, -0.06, 0]], color: VEIN },
  // legs
  { points: [[0.06, -0.15, 0], [0.1, -0.5, 0], [0.11, -0.95, 0], [0.11, -1.25, 0]], color: ARTERY },
  { points: [[0.09, -0.16, -0.02], [0.13, -0.5, -0.02], [0.14, -0.95, -0.02], [0.14, -1.25, 0]], color: VEIN },
  { points: [[-0.06, -0.15, 0], [-0.1, -0.5, 0], [-0.11, -0.95, 0], [-0.11, -1.25, 0]], color: ARTERY },
  { points: [[-0.09, -0.16, -0.02], [-0.13, -0.5, -0.02], [-0.14, -0.95, -0.02], [-0.14, -1.25, 0]], color: VEIN },
  // ribcage arcs
  { points: [[0, 0.42, 0.05], [0.16, 0.38, 0.02], [0.19, 0.28, -0.02]], color: ARTERY, r: 0.008 },
  { points: [[0, 0.42, 0.05], [-0.16, 0.38, 0.02], [-0.19, 0.28, -0.02]], color: ARTERY, r: 0.008 },
  { points: [[0, 0.28, 0.05], [0.17, 0.24, 0.02], [0.2, 0.13, -0.02]], color: VEIN, r: 0.008 },
  { points: [[0, 0.28, 0.05], [-0.17, 0.24, 0.02], [-0.2, 0.13, -0.02]], color: VEIN, r: 0.008 },
]

/* -------------------------------------------------------------------- body */

const BODY_COLOR = '#2b8fd6'

function Body() {
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: BODY_COLOR,
        transparent: true,
        opacity: 0.22,
        roughness: 0.35,
        metalness: 0.05,
        transmission: 0.55,
        thickness: 0.6,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [],
  )
  const rim = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#7fd4ff',
        transparent: true,
        opacity: 0.16,
        wireframe: true,
      }),
    [],
  )

  useEffect(
    () => () => {
      material.dispose()
      rim.dispose()
    },
    [material, rim],
  )

  const parts: { geo: THREE.BufferGeometry; pos: [number, number, number]; rot?: [number, number, number] }[] =
    useMemo(
      () => [
        { geo: new THREE.SphereGeometry(0.15, 24, 20), pos: [0, 0.95, 0] },
        { geo: new THREE.CylinderGeometry(0.055, 0.07, 0.12, 16), pos: [0, 0.79, 0] },
        // torso: capsule-ish, tapered
        { geo: new THREE.CapsuleGeometry(0.19, 0.34, 8, 20), pos: [0, 0.42, 0] },
        { geo: new THREE.CapsuleGeometry(0.16, 0.2, 8, 20), pos: [0, 0.06, 0] },
        // shoulders
        { geo: new THREE.SphereGeometry(0.085, 16, 14), pos: [0.21, 0.58, 0] },
        { geo: new THREE.SphereGeometry(0.085, 16, 14), pos: [-0.21, 0.58, 0] },
        // arms
        { geo: new THREE.CapsuleGeometry(0.055, 0.3, 6, 14), pos: [0.28, 0.34, 0], rot: [0, 0, 0.12] },
        { geo: new THREE.CapsuleGeometry(0.05, 0.3, 6, 14), pos: [0.32, -0.02, 0], rot: [0, 0, 0.06] },
        { geo: new THREE.CapsuleGeometry(0.055, 0.3, 6, 14), pos: [-0.28, 0.34, 0], rot: [0, 0, -0.12] },
        { geo: new THREE.CapsuleGeometry(0.05, 0.3, 6, 14), pos: [-0.32, -0.02, 0], rot: [0, 0, -0.06] },
        // hands
        { geo: new THREE.SphereGeometry(0.06, 12, 10), pos: [0.34, -0.22, 0] },
        { geo: new THREE.SphereGeometry(0.06, 12, 10), pos: [-0.34, -0.22, 0] },
        // hips
        { geo: new THREE.CapsuleGeometry(0.155, 0.08, 8, 16), pos: [0, -0.12, 0] },
        // legs
        { geo: new THREE.CapsuleGeometry(0.075, 0.36, 6, 14), pos: [0.1, -0.45, 0] },
        { geo: new THREE.CapsuleGeometry(0.062, 0.36, 6, 14), pos: [0.11, -0.9, 0] },
        { geo: new THREE.CapsuleGeometry(0.075, 0.36, 6, 14), pos: [-0.1, -0.45, 0] },
        { geo: new THREE.CapsuleGeometry(0.062, 0.36, 6, 14), pos: [-0.11, -0.9, 0] },
        // feet
        { geo: new THREE.BoxGeometry(0.1, 0.05, 0.2), pos: [0.11, -1.3, 0.05] },
        { geo: new THREE.BoxGeometry(0.1, 0.05, 0.2), pos: [-0.11, -1.3, 0.05] },
      ],
      [],
    )

  useEffect(() => () => parts.forEach((p) => p.geo.dispose()), [parts])

  return (
    <group>
      {parts.map((p, i) => (
        <group key={i} position={p.pos} rotation={p.rot ?? [0, 0, 0]}>
          <mesh geometry={p.geo} material={material} />
          <mesh geometry={p.geo} material={rim} scale={1.01} />
        </group>
      ))}
    </group>
  )
}

/* ----------------------------------------------------------------- markers */

function Marker({
  marker,
  selected,
  onSelect,
}: {
  marker: AnatomyMarker
  selected: boolean
  onSelect: () => void
}) {
  const ring = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (!ring.current) return
    // A slow expanding pulse draws the eye without becoming a strobe.
    const t = (state.clock.elapsedTime * 0.6) % 1
    const s = 1 + t * 2.4
    ring.current.scale.setScalar(s)
    const mat = ring.current.material as THREE.MeshBasicMaterial
    mat.opacity = (1 - t) * (selected ? 0.85 : 0.5)
  })

  return (
    <group position={marker.position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[selected || hovered ? 0.05 : 0.038, 16, 14]} />
        <meshBasicMaterial color={marker.color} />
      </mesh>

      <mesh ref={ring} rotation={[0, 0, 0]}>
        <ringGeometry args={[0.05, 0.062, 28]} />
        <meshBasicMaterial color={marker.color} transparent side={THREE.DoubleSide} />
      </mesh>

      {(selected || hovered) && (
        <Html center distanceFactor={2.6} position={[0, 0.12, 0]}>
          <div className="pointer-events-none w-52 rounded-lg border border-border bg-background/95 p-2.5 text-left shadow-xl backdrop-blur">
            <p
              className="font-mono text-[10px] font-bold tracking-wider uppercase"
              style={{ color: marker.color }}
            >
              {marker.label}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-foreground/85">
              {marker.summary}
            </p>
            <p className="mt-1 font-mono text-[9px] text-muted-foreground">
              {marker.status === 'confirmed'
                ? 'HUMAN-CONFIRMED'
                : 'AI HYPOTHESIS — requires review'}
            </p>
          </div>
        </Html>
      )}
    </group>
  )
}

/* ------------------------------------------------------------------- scene */

function Rig({ autoRotate }: { autoRotate: boolean }) {
  const { scene } = useThree()
  useFrame((state, delta) => {
    if (!autoRotate) return
    scene.rotation.y += delta * 0.12
  })
  return null
}

function VisibilityGate() {
  const { setFrameloop, invalidate } = useThree()
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) setFrameloop('never')
      else {
        setFrameloop('always')
        invalidate()
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [setFrameloop, invalidate])
  return null
}

export function AnatomyScene({
  markers,
  selectedId,
  onSelect,
  autoRotate = false,
  dark = true,
}: {
  markers: AnatomyMarker[]
  selectedId?: string | null
  onSelect: (id: string) => void
  autoRotate?: boolean
  dark?: boolean
}) {
  return (
    <Canvas
      camera={{ position: [0, 0.1, 3.1], fov: 42 }}
      dpr={[1, 1.6]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <VisibilityGate />
      <color attach="background" args={[dark ? '#060a12' : '#e9eef4']} />

      <ambientLight intensity={dark ? 0.55 : 0.9} />
      <directionalLight position={[2, 3, 4]} intensity={1.1} />
      <pointLight position={[-3, 1, 2]} intensity={0.8} color="#4fc3f7" />
      <pointLight position={[0, -1, 3]} intensity={0.5} color="#ff6b7a" />

      <group position={[0, 0.15, 0]}>
        <Body />
        <Organs />
        {VESSEL_PATHS.map((v, i) => (
          <Vessel key={i} points={v.points} color={v.color} radius={v.r} />
        ))}
        {markers.map((m) => (
          <Marker
            key={m.id}
            marker={m}
            selected={selectedId === m.id}
            onSelect={() => onSelect(m.id)}
          />
        ))}
      </group>

      <Rig autoRotate={autoRotate} />
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={1.8}
        maxDistance={5.5}
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.85}
        makeDefault
      />
    </Canvas>
  )
}
