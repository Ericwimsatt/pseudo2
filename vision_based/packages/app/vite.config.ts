import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

function repoLoaderPlugin(repoPath: string): Plugin {
  return {
    name: 'repo-loader',
    configureServer(server) {
      server.middlewares.use('/api/repo', (req, res) => {
        if (req.url === '/files') {
          try {
            const files = new Map<string, string>()

            function walkDir(dir: string, baseDir: string) {
              const entries = fs.readdirSync(dir, { withFileTypes: true })

              for (const entry of entries) {
                const fullPath = path.join(dir, entry.name)
                const relativePath = path.relative(baseDir, fullPath)

                if (entry.isDirectory()) {
                  if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && entry.name !== 'dist') {
                    walkDir(fullPath, baseDir)
                  }
                } else if (entry.isFile()) {
                  if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
                    const content = fs.readFileSync(fullPath, 'utf-8')
                    files.set(relativePath, content)
                  }
                }
              }
            }

            walkDir(repoPath, repoPath)

            const response = {
              root: repoPath,
              name: path.basename(repoPath),
              files: Object.fromEntries(files)
            }

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(response))
          } catch (error) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: String(error) }))
          }
        } else {
          res.statusCode = 404
          res.end('Not found')
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    repoLoaderPlugin('/Users/ericwimsatt/git/stemwise')
  ],
  server: {
    port: 3000,
    open: true
  }
})
