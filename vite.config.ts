// Vite: збірка в плаский dist/ (без підпапок) — зручно завантажувати на GitHub з iPhone.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, renameSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const STATIC = [
  'sw.js',
  'manifest.webmanifest',
  'personal.json',
  'icon.svg',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
]

export default defineConfig({
  base: './',
  publicDir: false,
  plugins: [
    react(),
    {
      name: 'murlove-flat-output',
      apply: 'build',
      closeBundle() {
        const out = resolve(root, 'dist')
        const dev = resolve(out, 'dev.html')
        if (existsSync(dev)) renameSync(dev, resolve(out, 'index.html'))
        for (const f of STATIC) copyFileSync(resolve(root, f), resolve(out, f))
      },
    },
  ],
  server: { open: '/dev.html' },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: '',
    target: 'safari16',
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      input: resolve(root, 'dev.html'),
      output: {
        entryFileNames: 'app.js',
        chunkFileNames: 'app-[name].js',
        assetFileNames: 'app[extname]',
      },
    },
  },
})
