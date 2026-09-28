import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import Sitemap from 'vite-plugin-sitemap'
import { catalogProducts } from './src/data/catalogData.js'
import { articles } from './src/data/blogArticles.js'

const DEV_API_ROUTES = ['send-inquiry', 'metal-prices']

const DEV_API_ENV_KEYS = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_SECURE',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_FROM',
  'INQUIRY_TO',
  'METALS_DEV_API_KEY',
  'METAL_PRICES_TTL_MINUTES',
]

/**
 * Serves the /api serverless functions during `npm run dev`, so the contact
 * form and the price feed behave locally the same way they do on Vercel.
 */
function devApiRoutes(env: Record<string, string>): Plugin {
  return {
    name: 'dev-api-routes',
    configureServer(server: ViteDevServer) {
      for (const key of DEV_API_ENV_KEYS) {
        if (env[key] && !process.env[key]) process.env[key] = env[key]
      }

      for (const route of DEV_API_ROUTES) {
        server.middlewares.use(`/api/${route}`, async (req, res, next) => {
          if (!req.url || (req.url !== '/' && !req.url.startsWith('/?'))) return next()
          try {
            const mod = await server.ssrLoadModule(`/api/${route}.ts`)
            await mod.default(req, res)
          } catch (error) {
            server.ssrFixStacktrace(error as Error)
            console.error(`[dev-api] /api/${route} crashed:`, error)
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: `/api/${route} failed. See the dev server logs.` }))
          }
        })
      }
    },
  }
}

const staticRoutes = [
  '/',
  '/about',
  '/products',
  '/catalog',
  '/contact',
  '/services',
  '/infrastructure',
  '/quality',
  '/blog',
  '/careers',
  '/faq',
  '/services/laser-cutting',
  '/services/forging',
  '/services/weld-inspection',
  '/quality-policy',
  '/certifications',
]

const dynamicRoutes = [
  ...staticRoutes,
  ...catalogProducts.map((p: any) => `/product-detail?id=${encodeURIComponent(p.id)}`),
  ...articles.map((a: any) => `/blog/${a.slug}`),
]

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      devApiRoutes(env),
      Sitemap({
        hostname: 'https://jyotimetal.co.in',
        dynamicRoutes,
        exclude: ['/library/*'],
      }),
    ],
  }
})
