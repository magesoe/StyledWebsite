import '/src/shared.css'

const root = document.documentElement
const chapters = [...document.querySelectorAll('.chapter')]
const current = document.querySelector('[data-current]')
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
let ticking = false

function update() {
  const max = Math.max(document.documentElement.scrollHeight - innerHeight, 1)
  root.style.setProperty('--page-progress', Math.min(1, scrollY / max).toFixed(4))
  let active = chapters[0]
  chapters.forEach((chapter) => {
    if (chapter.getBoundingClientRect().top < innerHeight * .55) active = chapter
  })
  current.textContent = active.dataset.chapter
  ticking = false
}
addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true } }, { passive: true })
update()

const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
  if (entry.isIntersecting) entry.target.classList.add('in-view')
}), { threshold: .16 })
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))

if (!reduceMotion) addEventListener('pointermove', (event) => {
  root.style.setProperty('--mx', ((event.clientX / innerWidth) - .5).toFixed(3))
  root.style.setProperty('--my', ((event.clientY / innerHeight) - .5).toFixed(3))
}, { passive: true })

const dialog = document.querySelector('.manifesto')
document.querySelector('[data-open-manifesto]').addEventListener('click', () => dialog.showModal())
document.querySelector('[data-close-manifesto]').addEventListener('click', () => dialog.close())
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close() })

document.querySelector('.join-form').addEventListener('submit', (event) => {
  event.preventDefault()
  const input = event.currentTarget.querySelector('input')
  const status = event.currentTarget.querySelector('.form-status')
  if (!input.validity.valid) { status.textContent = 'Please enter a valid email address.'; input.focus(); return }
  status.textContent = 'You are part of the current. Thank you.'
  event.currentTarget.reset()
})
