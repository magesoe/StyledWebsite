import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const LUME = new THREE.Color('#c6ff4a')
const BRASS = '#b08d57'
const clamp = THREE.MathUtils.clamp
const smooth = (value, from, to) => THREE.MathUtils.smoothstep(value, from, to)

function makeGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')
  const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(228,255,165,1)')
  gradient.addColorStop(.13, 'rgba(198,255,74,.92)')
  gradient.addColorStop(.42, 'rgba(198,255,74,.24)')
  gradient.addColorStop(1, 'rgba(198,255,74,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function makeDateTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 160
  const context = canvas.getContext('2d')
  context.fillStyle = '#e8ece8'
  context.fillRect(0, 0, 128, 160)
  context.fillStyle = '#12161a'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = '600 76px monospace'
  context.fillText('18', 64, 84)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function makeDialTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const context = canvas.getContext('2d')
  context.clearRect(0, 0, 1024, 1024)
  context.textAlign = 'center'
  context.fillStyle = 'rgba(235,241,245,.92)'
  context.font = '600 54px Arial'
  context.letterSpacing = '14px'
  context.fillText('MERIDIAN', 512, 383)
  context.fillStyle = 'rgba(205,215,222,.52)'
  context.font = '24px monospace'
  context.letterSpacing = '6px'
  context.fillText('AUTOMATIC · 300 M', 512, 430)
  context.fillStyle = BRASS
  context.font = '22px monospace'
  context.letterSpacing = '5px'
  context.fillText('M—01', 512, 674)
  context.strokeStyle = 'rgba(255,255,255,.18)'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(442, 706)
  context.lineTo(582, 706)
  context.stroke()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function ProceduralEnvironment() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    pmrem.compileEquirectangularShader()
    const environment = pmrem.fromScene(new RoomEnvironment(), .035).texture
    scene.environment = environment
    return () => {
      scene.environment = null
      environment.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
}

function ReadySignal({ host }) {
  const sent = useRef(false)
  useFrame(() => {
    if (sent.current) return
    sent.current = true
    requestAnimationFrame(() => {
      host.classList.add('ready')
      const stage = host.closest('.hero-stage')
      stage?.classList.remove('canvas-loading')
      stage?.classList.add('canvas-ready')
      dispatchEvent(new CustomEvent('meridian:ready'))
    })
  })
  return null
}

function CausticField({ progressRef }) {
  const material = useRef()
  useFrame((state) => {
    if (!material.current) return
    material.current.uniforms.uTime.value = state.clock.elapsedTime
    material.current.uniforms.uDive.value = smooth(progressRef.current, .55, .92)
  })
  return (
    <mesh position={[0, 0, -3.2]} scale={[15, 9, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={material}
        depthWrite={false}
        uniforms={{ uTime: { value: 0 }, uDive: { value: 0 } }}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform float uTime;
          uniform float uDive;
          void main() {
            vec2 uv = vUv * vec2(1.5, 1.0);
            float a = sin(uv.x * 28.0 + sin(uv.y * 11.0 - uTime * .7) * 3.2 + uTime);
            float b = sin(uv.y * 31.0 + sin(uv.x * 9.0 + uTime * .5) * 3.8 - uTime * .8);
            float lines = pow(max(0.0, (a + b) * .5), 7.0);
            float radial = 1.0 - smoothstep(.05, .85, distance(vUv, vec2(.5)));
            vec3 base = mix(vec3(.025, .035, .045), vec3(.004, .014, .011), uDive);
            vec3 caustic = vec3(.32, .88, .62) * lines * radial * uDive * .72;
            gl_FragColor = vec4(base + caustic, 1.0);
          }
        `}
      />
    </mesh>
  )
}

function SuspendedParticles({ progressRef, glowTexture }) {
  const points = useRef()
  const material = useRef()
  const positions = useMemo(() => {
    const values = new Float32Array(270)
    for (let index = 0; index < values.length; index += 3) {
      const seed = index / 3
      values[index] = Math.sin(seed * 91.7) * 5.4
      values[index + 1] = Math.cos(seed * 47.3) * 3.2
      values[index + 2] = -1 + Math.sin(seed * 17.1) * 2.5
    }
    return values
  }, [])
  useFrame((state, delta) => {
    if (!points.current || !material.current) return
    points.current.rotation.z += delta * .012
    points.current.position.y = Math.sin(state.clock.elapsedTime * .22) * .12
    material.current.opacity = smooth(progressRef.current, .62, .9) * .68
  })
  return (
    <points ref={points}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial ref={material} map={glowTexture} color="#83d8c8" size={.12} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

function BezelTicks() {
  const mesh = useRef()
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D()
    for (let index = 0; index < 60; index += 1) {
      const angle = (index / 60) * Math.PI * 2
      const radius = 1.49
      dummy.position.set(Math.sin(angle) * radius, Math.cos(angle) * radius, .01)
      dummy.rotation.z = -angle
      dummy.scale.set(index % 5 === 0 ? 1.8 : .72, index % 5 === 0 ? 1.4 : .78, 1)
      dummy.updateMatrix()
      mesh.current.setMatrixAt(index, dummy.matrix)
    }
    mesh.current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={mesh} args={[null, null, 60]}>
      <boxGeometry args={[.018, .13, .026]} />
      <meshStandardMaterial color="#b7c0c7" metalness={.72} roughness={.28} />
    </instancedMesh>
  )
}

function WatchAssembly({ progressRef, pointerRef, glowTexture }) {
  const root = useRef()
  const strap = useRef()
  const caseGroup = useRef()
  const bezel = useRef()
  const dial = useRef()
  const dialPrint = useRef()
  const indicesGroup = useRef()
  const hands = useRef()
  const handGlow = useRef()
  const crystal = useRef()
  const crown = useRef()
  const indexGlow = useRef()
  const steelMaterial = useRef()
  const bezelMaterial = useRef()
  const dialMaterial = useRef()
  const glassMaterial = useRef()
  const lumeMaterials = useRef([])
  const brassMaterial = useRef()
  const dialTexture = useMemo(makeDialTexture, [])
  const dateTexture = useMemo(makeDateTexture, [])

  const indices = useMemo(() => Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * Math.PI * 2
    return {
      index,
      angle,
      x: Math.sin(angle) * 1.15,
      y: Math.cos(angle) * 1.15,
      major: index % 3 === 0,
    }
  }), [])
  const glowPositions = useMemo(() => new Float32Array(indices.flatMap(({ x, y }) => [x, y, .1])), [indices])

  useEffect(() => () => {
    dialTexture.dispose()
    dateTexture.dispose()
  }, [dialTexture, dateTexture])

  useFrame((state, delta) => {
    const progress = progressRef.current
    const expose = smooth(progress, .16, .42)
    const seal = smooth(progress, .48, .71)
    const exploded = expose * (1 - seal)
    const dark = smooth(progress, .65, .9)
    const pointer = pointerRef.current
    const ease = 1 - Math.exp(-delta * 5)

    root.current.rotation.y = THREE.MathUtils.lerp(root.current.rotation.y, -.18 + pointer.x + exploded * .34 + Math.sin(state.clock.elapsedTime * .22) * .035, ease)
    root.current.rotation.x = THREE.MathUtils.lerp(root.current.rotation.x, -.08 + pointer.y - exploded * .11, ease)
    root.current.rotation.z = THREE.MathUtils.lerp(root.current.rotation.z, -.12 + progress * .16, ease)
    root.current.position.y = Math.sin(state.clock.elapsedTime * .55) * .055
    root.current.scale.setScalar(1.0 - exploded * .16 + smooth(progress, .68, 1) * .04)

    strap.current.position.set(exploded * 1.62, exploded * .34, -.58 - exploded * .5)
    caseGroup.current.position.set(exploded * .84, exploded * .17, exploded * .05)
    dial.current.position.set(exploded * .33, 0, .19 + exploded * .12)
    dialPrint.current.position.set(exploded * .33, 0, .295 + exploded * .24)
    indicesGroup.current.position.set(-exploded * .08, -exploded * .08, .34 + exploded * .5)
    hands.current.position.set(-exploded * .42, -exploded * .18, .41 + exploded * .82)
    handGlow.current.position.set(-exploded * .42, -exploded * .18, .43 + exploded * .84)
    bezel.current.position.set(-exploded * .88, -exploded * .3, .18 + exploded * 1.12)
    bezel.current.rotation.z = exploded * .28 + dark * .16
    crystal.current.position.set(-exploded * 1.56, -exploded * .45, .52 + exploded * 1.75)
    crown.current.position.set(1.82 + exploded * 1.66, exploded * .17, -.02 + exploded * .05)

    steelMaterial.current.roughness = .14 + dark * .28
    bezelMaterial.current.roughness = .17 + dark * .25
    dialMaterial.current.color.setRGB(.025 + dark * .002, .035 + dark * .006, .045 + dark * .002)
    glassMaterial.current.opacity = .3 - dark * .11
    brassMaterial.current.emissiveIntensity = .12 + dark * .42
    lumeMaterials.current.forEach((material) => {
      if (material) material.emissiveIntensity = .18 + dark * 18
    })
    indexGlow.current.material.opacity = dark * .95
    handGlow.current.visible = dark > .01
    handGlow.current.children.forEach((mesh) => { mesh.material.opacity = dark * .68 })
  })

  return (
    <group ref={root} rotation={[-.08, -.18, -.12]} scale={1.08}>
      <group ref={strap} position={[0, 0, -.58]}>
        <mesh position={[0, 2.35, -.05]}>
          <boxGeometry args={[1.12, 2.7, .24]} />
          <meshPhysicalMaterial color="#0e1115" metalness={.42} roughness={.62} clearcoat={.35} clearcoatRoughness={.42} />
        </mesh>
        <mesh position={[0, -2.35, -.05]}>
          <boxGeometry args={[1.12, 2.7, .24]} />
          <meshPhysicalMaterial color="#0e1115" metalness={.42} roughness={.62} clearcoat={.35} clearcoatRoughness={.42} />
        </mesh>
        {[[-.98, 1.57], [.98, 1.57], [-.98, -1.57], [.98, -1.57]].map(([x, y]) => (
          <mesh key={`${x}-${y}`} position={[x, y, .12]} rotation={[0, 0, x > 0 ? -.12 : .12]}>
            <boxGeometry args={[.58, .8, .36]} />
            <meshStandardMaterial color="#343a42" metalness={.96} roughness={.18} />
          </mesh>
        ))}
      </group>

      <group ref={caseGroup}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.73, 1.73, .5, 96]} />
          <meshPhysicalMaterial ref={steelMaterial} color="#8e969e" metalness={1} roughness={.14} clearcoat={.35} clearcoatRoughness={.12} />
        </mesh>
        <mesh position={[0, 0, .1]}>
          <torusGeometry args={[1.62, .08, 18, 128]} />
          <meshStandardMaterial color="#d4d9dd" metalness={1} roughness={.1} />
        </mesh>
      </group>

      <group ref={bezel} position={[0, 0, .18]}>
        <mesh>
          <torusGeometry args={[1.48, .19, 28, 128]} />
          <meshPhysicalMaterial ref={bezelMaterial} color="#151a20" metalness={.94} roughness={.17} clearcoat={.55} clearcoatRoughness={.08} />
        </mesh>
        <BezelTicks />
        <mesh position={[0, 1.48, .05]} rotation={[0, 0, Math.PI]}>
          <coneGeometry args={[.09, .19, 3]} />
          <meshStandardMaterial color="#9bac62" emissive={LUME} emissiveIntensity={.12} />
        </mesh>
      </group>

      <mesh ref={dial} position={[0, 0, .19]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.34, 1.34, .15, 96]} />
        <meshPhysicalMaterial ref={dialMaterial} color="#071016" metalness={.38} roughness={.35} clearcoat={.5} clearcoatRoughness={.18} />
      </mesh>
      <mesh ref={dialPrint} position={[0, 0, .295]}>
        <circleGeometry args={[1.31, 96]} />
        <meshBasicMaterial map={dialTexture} transparent depthWrite={false} />
      </mesh>

      <group ref={indicesGroup} position={[0, 0, .34]}>
        {indices.map(({ index, angle, x, y, major }) => (
          <mesh key={index} position={[x, y, 0]} rotation={[0, 0, -angle]}>
            {index === 0
              ? <coneGeometry args={[.13, .34, 3]} />
              : <boxGeometry args={[major ? .15 : .075, major ? .34 : .21, .08]} />}
            <meshStandardMaterial
              ref={(material) => { lumeMaterials.current[index] = material }}
              color="#9bac62"
              emissive={LUME}
              emissiveIntensity={.18}
            />
          </mesh>
        ))}
        <points ref={indexGlow}>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[glowPositions, 3]} /></bufferGeometry>
          <pointsMaterial map={glowTexture} color={LUME} size={.62} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </points>
        <group position={[0, -.7, .055]} rotation={[0, 0, -.1]}>
          <mesh><boxGeometry args={[.29, .37, .055]} /><meshStandardMaterial color="#d9ddd9" roughness={.7} /></mesh>
          <mesh position={[0, 0, .032]}><planeGeometry args={[.25, .32]} /><meshBasicMaterial map={dateTexture} /></mesh>
        </group>
      </group>

      <group ref={hands} position={[0, 0, .41]}>
        <mesh rotation={[0, 0, -.66]} position={[0, .35, 0]}>
          <boxGeometry args={[.13, 1.08, .075]} />
          <meshStandardMaterial ref={(material) => { lumeMaterials.current[12] = material }} color="#9bac62" emissive={LUME} emissiveIntensity={.18} />
        </mesh>
        <mesh rotation={[0, 0, 1.12]} position={[0, .47, .015]}>
          <boxGeometry args={[.105, 1.38, .068]} />
          <meshStandardMaterial ref={(material) => { lumeMaterials.current[13] = material }} color="#9bac62" emissive={LUME} emissiveIntensity={.18} />
        </mesh>
        <mesh rotation={[0, 0, 2.45]} position={[0, .51, .035]}>
          <boxGeometry args={[.025, 1.3, .027]} />
          <meshStandardMaterial color="#f2a65a" emissive="#f2a65a" emissiveIntensity={.5} />
        </mesh>
        <mesh position={[0, 0, .05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[.11, .11, .08, 32]} />
          <meshStandardMaterial ref={brassMaterial} color={BRASS} emissive={BRASS} emissiveIntensity={.12} metalness={.9} roughness={.2} />
        </mesh>
      </group>

      <group ref={handGlow} visible={false} position={[0, 0, .43]} scale={1.05}>
        <mesh rotation={[0, 0, -.66]} position={[0, .35, 0]}>
          <boxGeometry args={[.22, 1.18, .02]} />
          <meshBasicMaterial color={LUME} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
        <mesh rotation={[0, 0, 1.12]} position={[0, .47, .01]}>
          <boxGeometry args={[.19, 1.5, .02]} />
          <meshBasicMaterial color={LUME} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      </group>

      <mesh ref={crystal} position={[0, 0, .52]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[1.42, 1.42, .1, 96]} />
        <meshPhysicalMaterial ref={glassMaterial} color="#6f8793" metalness={0} roughness={.04} transmission={0} ior={1.48} transparent opacity={.13} depthWrite={false} clearcoat={1} clearcoatRoughness={.03} />
      </mesh>

      <group ref={crown} position={[1.9, 0, -.02]} rotation={[0, 0, Math.PI / 2]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[.29, .29, .43, 48]} />
          <meshPhysicalMaterial color="#848c94" metalness={1} roughness={.18} clearcoat={.35} />
        </mesh>
        {[-.16, -.08, 0, .08, .16].map((offset) => (
          <mesh key={offset} position={[0, offset, .26]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[.235, .011, 8, 32]} />
            <meshStandardMaterial color="#111419" metalness={.8} roughness={.3} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Scene({ progressRef, pointerRef, host }) {
  const keyLight = useRef()
  const edgeLight = useRef()
  const cameraTarget = useRef(new THREE.Vector3())
  const glowTexture = useMemo(makeGlowTexture, [])
  const { camera } = useThree()

  useEffect(() => () => glowTexture.dispose(), [glowTexture])

  useFrame((state, delta) => {
    const progress = progressRef.current
    const expose = smooth(progress, .16, .42)
    const seal = smooth(progress, .48, .71)
    const exploded = expose * (1 - seal)
    const dark = smooth(progress, .65, .9)
    const ease = 1 - Math.exp(-delta * 4)
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, ease)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, .05 + exploded * .28, ease)
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, 7.55 - progress * .92 + exploded * .38, ease)
    cameraTarget.current.set(0, 0, exploded * .35)
    camera.lookAt(cameraTarget.current)
    keyLight.current.intensity = 18 * (1 - dark) + 1.2
    edgeLight.current.intensity = 10 * (1 - dark) + dark * 2.5
  })

  return (
    <>
      <ReadySignal host={host} />
      <ProceduralEnvironment />
      <CausticField progressRef={progressRef} />
      <ambientLight intensity={.12} color="#9bb5c5" />
      <spotLight ref={keyLight} position={[-4.5, 5.2, 7]} angle={.38} penumbra={1} intensity={19} color="#edf7ff" />
      <spotLight ref={edgeLight} position={[5, -1, 4]} angle={.5} penumbra={1} intensity={10} color="#8ebed2" />
      <pointLight position={[-3, -3, 1]} intensity={3} color={BRASS} distance={8} />
      <WatchAssembly progressRef={progressRef} pointerRef={pointerRef} glowTexture={glowTexture} />
      <SuspendedParticles progressRef={progressRef} glowTexture={glowTexture} />
      <mesh position={[0, -3.35, -1.25]} rotation={[-Math.PI / 2, 0, 0]} scale={[4.8, 2.3, 1]}>
        <circleGeometry args={[1, 64]} />
        <meshBasicMaterial color="#000000" transparent opacity={.5} depthWrite={false} />
      </mesh>
    </>
  )
}

function WatchExperience({ host }) {
  const progressRef = useRef(Number(host.closest('.hero-stage')?.dataset.progress) || 0)
  const pointerRef = useRef({ x: 0, y: 0 })
  const [active, setActive] = useState(true)

  useEffect(() => {
    const onProgress = (event) => { progressRef.current = event.detail }
    const onVisibility = () => setActive(!document.hidden && host.dataset.visible !== 'false')
    const onPointerMove = (event) => {
      const rect = host.getBoundingClientRect()
      pointerRef.current.x = clamp(((event.clientX - rect.left) / rect.width - .5) * .5, -.28, .28)
      pointerRef.current.y = clamp(-((event.clientY - rect.top) / rect.height - .5) * .28, -.16, .16)
    }
    const onPointerLeave = () => { pointerRef.current.x = 0; pointerRef.current.y = 0 }
    const observer = new IntersectionObserver(([entry]) => {
      host.dataset.visible = String(entry.isIntersecting)
      onVisibility()
    }, { threshold: .01 })
    observer.observe(host)
    addEventListener('meridian:progress', onProgress)
    host.addEventListener('pointermove', onPointerMove, { passive: true })
    host.addEventListener('pointerleave', onPointerLeave, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      observer.disconnect()
      removeEventListener('meridian:progress', onProgress)
      host.removeEventListener('pointermove', onPointerMove)
      host.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [host])

  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, .05, 7.55], fov: 34, near: .1, far: 50 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      performance={{ min: .55 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.14
        gl.outputColorSpace = THREE.SRGBColorSpace
      }}
    >
      <Scene progressRef={progressRef} pointerRef={pointerRef} host={host} />
    </Canvas>
  )
}

export function mountWatch(host) {
  createRoot(host).render(<WatchExperience host={host} />)
}
