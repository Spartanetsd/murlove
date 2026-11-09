// Точка входу «МурLove»
import { createRoot } from 'react-dom/client'
import App from './App'
import { applyPersonal, type PersonalFile } from './content'
import './styles.css'

async function loadPersonal() {
  try {
    const ctl = new AbortController()
    const t = setTimeout(() => ctl.abort(), 1500)
    const r = await fetch('./personal.json', { cache: 'no-cache', signal: ctl.signal })
    clearTimeout(t)
    if (r.ok) applyPersonal((await r.json()) as PersonalFile)
  } catch {
    /* файлу немає або він з помилкою — беремо тексти за замовчуванням */
  }
}

loadPersonal().finally(() => {
  const root = document.getElementById('root')
  if (root) createRoot(root).render(<App />)
  document.getElementById('boot')?.remove()
})

// Service worker: на GitHub Pages (https) завжди; локально — лише з ?sw для перевірки офлайну.
const allowSW = location.protocol === 'https:' || new URLSearchParams(location.search).has('sw')
if ('serviceWorker' in navigator && allowSW) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {})
  })
}
