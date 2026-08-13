import '/src/shared.css'

const heroScroll = document.querySelector('[data-hero-scroll]')
const heroStage = heroScroll.querySelector('.hero-stage')
const nav = document.querySelector('.nav')
const depthReadout = document.querySelector('[data-depth-readout]')
const phaseLabel = document.querySelector('[data-phase-label]')
const sequenceWord = document.querySelector('[data-sequence-word]')
let scrollTicking = false
let lastProgress = -1

function setSequenceState(progress) {
  const exploded = progress >= .17 && progress < .62
  const sealing = progress >= .48 && progress < .73
  const dark = progress >= .68
  heroStage.classList.toggle('is-exploded', exploded)
  heroStage.classList.toggle('is-sealing', sealing)
  heroStage.classList.toggle('lights-out', dark)

  if (dark) {
    phaseLabel.textContent = 'Lume survival mode'
    sequenceWord.textContent = '300M / DARK'
  } else if (sealing) {
    phaseLabel.textContent = 'Pressure seal engaged'
    sequenceWord.textContent = 'SEALED'
  } else if (exploded) {
    phaseLabel.textContent = 'Construction exposed'
    sequenceWord.textContent = 'EXPLODED'
  } else {
    phaseLabel.textContent = 'Studio calibration'
    sequenceWord.textContent = 'ASSEMBLED'
  }
}

function updateHero() {
  const rect = heroScroll.getBoundingClientRect()
  const range = heroScroll.offsetHeight - innerHeight
  const progress = Math.min(1, Math.max(0, -rect.top / Math.max(range, 1)))
  const depth = Math.round(300 * Math.pow(progress, 1.28))

  heroStage.dataset.progress = progress.toFixed(4)
  document.documentElement.style.setProperty('--reveal-progress', progress.toFixed(4))
  document.documentElement.style.setProperty('--depth-progress', (depth / 300).toFixed(4))
  depthReadout.innerHTML = `${String(depth).padStart(3, '0')}<small>M</small>`
  nav.classList.toggle('scrolled', scrollY > innerHeight * .72)
  setSequenceState(progress)

  if (Math.abs(progress - lastProgress) > .001) {
    dispatchEvent(new CustomEvent('meridian:progress', { detail: progress }))
    lastProgress = progress
  }
  scrollTicking = false
}

addEventListener('scroll', () => {
  if (!scrollTicking) {
    scrollTicking = true
    requestAnimationFrame(updateHero)
  }
}, { passive: true })
addEventListener('resize', updateHero, { passive: true })
updateHero()

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view')
      revealObserver.unobserve(entry.target)
    }
  })
}, { threshold: .13, rootMargin: '0px 0px -5% 0px' })
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element))

const canvasHost = document.getElementById('watch-canvas')
const shouldSkipWebGL = (
  matchMedia('(prefers-reduced-motion: reduce)').matches
  || innerWidth < 720
  || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)
)

if (shouldSkipWebGL) {
  heroStage.classList.remove('canvas-loading')
  heroStage.classList.add('canvas-static')
} else {
  const mount = async () => {
    try {
      const { mountWatch } = await import('./WatchExperience.jsx')
      mountWatch(canvasHost)
      updateHero()
    } catch (error) {
      heroStage.classList.remove('canvas-loading')
      heroStage.classList.add('canvas-static')
      console.warn('WebGL enhancement unavailable; retaining poster.', error)
    }
  }

  // The poster is already preloaded. Start fetching 3D immediately after its first paint,
  // rather than waiting for an unpredictable idle callback.
  requestAnimationFrame(() => requestAnimationFrame(mount))
  // Never let enhancement status compete with the product. The poster remains the
  // complete experience while a slower GPU continues warming in the background.
  setTimeout(() => heroStage.classList.remove('canvas-loading'), 1600)
}

addEventListener('meridian:ready', () => {
  lastProgress = -1
  heroStage.classList.remove('canvas-loading')
  heroStage.classList.add('canvas-ready')
  updateHero()
}, { once: true })

document.querySelector('[data-reserve]').addEventListener('click', () => {
  document.querySelector('.reserve-status').textContent = 'Reservation flow intentionally omitted from this interface demo.'
})
