import '/src/shared.css'

const root = document.documentElement
const depthOutput = document.querySelector('[data-depth]')
const zoneOutput = document.querySelector('[data-zone]')
const nav = document.querySelector('.nav')
const zones = [...document.querySelectorAll('.zone')]
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
let scrollTicking = false

const padDepth = (value) => `${String(Math.round(value)).padStart(5, '0')} M`

function updateScrollState() {
  const scrollMax = Math.max(document.documentElement.scrollHeight - innerHeight, 1)
  const progress = Math.min(1, Math.max(0, scrollY / scrollMax))
  const easedDepth = 10911 * (1 - Math.pow(1 - progress, 1.35))
  root.style.setProperty('--depth-progress', progress.toFixed(4))
  depthOutput.textContent = padDepth(easedDepth)
  nav.classList.toggle('scrolled', scrollY > 40)

  const marker = innerHeight * .47
  let current = zones[0]
  for (const zone of zones) {
    if (zone.getBoundingClientRect().top <= marker) current = zone
  }
  zoneOutput.textContent = current.dataset.zoneName
  scrollTicking = false
}

addEventListener('scroll', () => {
  if (!scrollTicking) {
    scrollTicking = true
    requestAnimationFrame(updateScrollState)
  }
}, { passive: true })
updateScrollState()

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view')
      revealObserver.unobserve(entry.target)
    }
  })
}, { threshold: .14, rootMargin: '0px 0px -5% 0px' })

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element))

if (!reduceMotion && matchMedia('(pointer: fine)').matches) {
  addEventListener('pointermove', (event) => {
    root.style.setProperty('--mx', ((event.clientX / innerWidth) - .5).toFixed(3))
    root.style.setProperty('--my', ((event.clientY / innerHeight) - .5).toFixed(3))
  }, { passive: true })
}

const dialog = document.querySelector('.trailer-dialog')
document.querySelectorAll('[data-open-trailer]').forEach((button) => {
  button.addEventListener('click', () => dialog.showModal())
})
document.querySelector('[data-close-trailer]').addEventListener('click', () => dialog.close())
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close()
})

const form = document.querySelector('.signup')
form.addEventListener('submit', (event) => {
  event.preventDefault()
  const email = form.elements.email
  const message = form.querySelector('.form-message')
  if (!email.validity.valid) {
    message.textContent = 'Enter a valid email to join the expedition log.'
    email.focus()
    return
  }
  message.textContent = `Transmission received. Updates will be sent to ${email.value}.`
  form.reset()
})
