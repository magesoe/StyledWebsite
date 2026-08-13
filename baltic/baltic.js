import '/src/shared.css'

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('in-view'))
}, { threshold: .14 })
document.querySelectorAll('.reveal').forEach((item) => observer.observe(item))
