import { defineConfig } from 'vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults']
    })
  ],
  root: './',
  publicDir: 'static',
  build: {
    outDir: 'build',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: 'scripts/[name].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
            return `assets/images/[name].[ext]`
          }
          if (ext === 'css') {
            return `styles/[name].[ext]`
          }
          return `assets/[name].[ext]`
        }
      }
    }
  },
  server: {
    port: 3000,
    open: false
  }
})
