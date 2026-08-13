import './shared.css'

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('in-view')
  })
}, { threshold: 0.18 })

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element))

if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  window.addEventListener('pointermove', (event) => {
    document.documentElement.style.setProperty('--mx', ((event.clientX / innerWidth) - .5).toFixed(3))
    document.documentElement.style.setProperty('--my', ((event.clientY / innerHeight) - .5).toFixed(3))
  }, { passive: true })
}
