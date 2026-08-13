import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function FlowSurface({ offset = 0, opacity = .3, solid = false }) {
  const mesh = useRef()
  const base = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(13, 9, 96, 68)
    const values = Float32Array.from(geometry.attributes.position.array)
    geometry.dispose()
    return values
  }, [])

  useFrame(({ clock, pointer }) => {
    const positions = mesh.current.geometry.attributes.position
    const time = clock.elapsedTime * .3 + offset

    for (let index = 0; index < positions.count; index += 1) {
      const x = base[index * 3]
      const y = base[index * 3 + 1]
      const radius = Math.sqrt(x * x + y * y)
      const wave = Math.sin(x * 1.1 + time * 2.15) * .2
        + Math.cos(y * 1.45 - time * 1.35) * .14
        + Math.sin(radius * 1.75 - time) * .08
      positions.setZ(index, wave + pointer.x * x * .015 + pointer.y * y * .012)
    }

    positions.needsUpdate = true
    mesh.current.rotation.z = Math.sin(time * .18) * .02
  })

  return (
    <mesh ref={mesh} rotation={[-Math.PI * .5 + .31, 0, -.08]} position={[0, -.4, offset * .04]}>
      <planeGeometry args={[13, 9, 96, 68]} />
      <meshStandardMaterial
        color={solid ? '#087cb7' : '#48e2ee'}
        emissive={solid ? '#03294a' : '#078bc9'}
        emissiveIntensity={solid ? .55 : 1.8}
        transparent
        opacity={opacity}
        wireframe={!solid}
        side={THREE.DoubleSide}
        depthWrite={solid}
        roughness={.35}
      />
    </mesh>
  )
}

function LightNodes() {
  const group = useRef()
  const points = useMemo(() => [
    [-3.5, .35, .5], [-1.4, .05, 1.05], [.2, .42, .7], [1.8, .18, .45], [3.4, -.1, .9],
  ], [])

  useFrame(({ clock }) => {
    group.current.rotation.y = Math.sin(clock.elapsedTime * .17) * .08
    group.current.position.y = Math.sin(clock.elapsedTime * .42) * .04
  })

  return (
    <group ref={group} position={[0, .2, 0]}>
      {points.map((position, index) => (
        <mesh key={position.join('-')} position={position}>
          <sphereGeometry args={[index === 2 ? .075 : .042, 18, 18]} />
          <meshBasicMaterial color={index === 2 ? '#ffffff' : '#57eff2'} />
        </mesh>
      ))}
      {points.slice(0, -1).map((point, index) => {
        const curve = new THREE.LineCurve3(new THREE.Vector3(...point), new THREE.Vector3(...points[index + 1]))
        return (
          <mesh key={`line-${index}`}>
            <tubeGeometry args={[curve, 20, .007, 8, false]} />
            <meshBasicMaterial color="#57eff2" transparent opacity={.36} />
          </mesh>
        )
      })}
    </group>
  )
}

export default function CurrentExperience() {
  const rig = useRef()

  useFrame(({ clock, pointer, camera }) => {
    rig.current.rotation.y = THREE.MathUtils.lerp(rig.current.rotation.y, pointer.x * .11, .035)
    rig.current.rotation.x = THREE.MathUtils.lerp(rig.current.rotation.x, pointer.y * -.05, .035)
    rig.current.position.y = Math.sin(clock.elapsedTime * .25) * .07
    camera.lookAt(0, 0, 0)
  })

  return (
    <>
      <fog attach="fog" args={['#061a34', 6, 13]} />
      <ambientLight intensity={.7} color="#8feaf0" />
      <directionalLight position={[-4, 6, 4]} intensity={2.1} color="#d9ffff" />
      <pointLight position={[3, 1, 2]} intensity={14} distance={8} color="#009fe3" />
      <group ref={rig}>
        <FlowSurface offset={0} opacity={.16} solid />
        <FlowSurface offset={1.7} opacity={.3} />
        <LightNodes />
      </group>
    </>
  )
}
