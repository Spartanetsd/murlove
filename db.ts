// Локальне сховище фото та голосових (IndexedDB). Нічого не передається на сервер.

export interface Photo {
  id: string
  blob: Blob
  w: number
  h: number
  created: number
}

export interface Voice {
  id: string
  blob: Blob
  mime: string
  duration: number
  created: number
  title: string
}

const DB_NAME = 'murlove'
const VERSION = 1
let dbp: Promise<IDBDatabase> | null = null

function open(): Promise<IDBDatabase> {
  if (dbp) return dbp
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('voices')) db.createObjectStore('voices', { keyPath: 'id' })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => {
      dbp = null
      reject(req.error)
    }
  })
  return dbp
}

function tx<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode)
        const req = fn(t.objectStore(store))
        t.oncomplete = () => resolve(req.result)
        t.onerror = () => reject(t.error || req.error)
        t.onabort = () => reject(t.error || new Error('Транзакцію перервано'))
      }),
  )
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

// ---------- Фото ----------
export async function listPhotos(): Promise<Photo[]> {
  const all = await tx<Photo[]>('photos', 'readonly', (s) => s.getAll() as IDBRequest<Photo[]>)
  return all.sort((a, b) => b.created - a.created)
}

export async function addPhoto(file: File): Promise<Photo> {
  const { blob, w, h } = await shrink(file)
  const photo: Photo = { id: uid(), blob, w, h, created: Date.now() }
  await tx('photos', 'readwrite', (s) => s.put(photo))
  return photo
}

export function deletePhoto(id: string) {
  return tx('photos', 'readwrite', (s) => s.delete(id))
}

/** Зменшує фото до 1600 px — так у телефоні поміститься набагато більше спогадів. */
async function shrink(file: File): Promise<{ blob: Blob; w: number; h: number }> {
  const MAX = 1600
  let source: CanvasImageSource | null = null
  let w = 0
  let h = 0
  try {
    const bmp = await createImageBitmap(file)
    source = bmp
    w = bmp.width
    h = bmp.height
  } catch {
    try {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.src = url
      await img.decode()
      source = img
      w = img.naturalWidth
      h = img.naturalHeight
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      return { blob: file, w: 1, h: 1 }
    }
  }
  const k = Math.min(1, MAX / Math.max(w, h))
  const cw = Math.max(1, Math.round(w * k))
  const ch = Math.max(1, Math.round(h * k))
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const g = canvas.getContext('2d')
  if (!g || !source) return { blob: file, w, h }
  g.drawImage(source, 0, 0, cw, ch)
  const blob: Blob | null = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.86))
  return { blob: blob || file, w: cw, h: ch }
}

// ---------- Голосові ----------
export async function listVoices(): Promise<Voice[]> {
  const all = await tx<Voice[]>('voices', 'readonly', (s) => s.getAll() as IDBRequest<Voice[]>)
  return all.sort((a, b) => b.created - a.created)
}

export async function addVoice(blob: Blob, mime: string, duration: number, title: string): Promise<Voice> {
  const v: Voice = { id: uid(), blob, mime, duration, created: Date.now(), title }
  await tx('voices', 'readwrite', (s) => s.put(v))
  return v
}

export function deleteVoice(id: string) {
  return tx('voices', 'readwrite', (s) => s.delete(id))
}
