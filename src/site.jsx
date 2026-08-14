const hero = document.querySelector('.current-hero')
const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (entry.isIntersecting) entry.target.classList.add('in-view')
}), { threshold: .15 })

document.querySelectorAll('.reveal').forEach((item) => observer.observe(item))

async function enhanceCurrent() {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const smallScreen = matchMedia('(max-width: 719px)').matches
  if (reducedMotion || smallScreen) {
    hero.classList.add('current-static')
    return
  }

  try {
    const [{ createRoot }, { Canvas }, React, { default: CurrentExperience }] = await Promise.all([
      import('react-dom/client'),
      import('@react-three/fiber'),
      import('react'),
      import('./CurrentExperience.jsx'),
    ])

    createRoot(document.getElementById('current-canvas')).render(
      React.createElement(Canvas, {
        camera: { position: [0, 3.3, 6.8], fov: 46 },
        dpr: [1, 1.6],
        gl: { antialias: true, alpha: true, powerPreference: 'high-performance' },
        onCreated: ({ gl }) => {
          gl.setClearColor(0x061a34, 0)
          hero.classList.add('current-ready')
        },
      }, React.createElement(CurrentExperience))
    )
  } catch (error) {
    console.warn('Living current enhancement unavailable:', error)
    hero.classList.add('current-static')
  }
}

enhanceCurrent()
