/** biome-ignore-all lint/style/noProcessEnv: Next metadata route runs in Next runtime */
/** biome-ignore-all lint/style/useExportsLast: Next route segment config (dynamic) must be a direct inline export */
/* oxlint-disable import/exports-last */
import type { MetadataRoute } from 'next'
import process from 'node:process'
export const dynamic = 'force-dynamic'
const sitemap = (): MetadataRoute.Sitemap => {
  const base = process.env.SITE_URL
  if (!base) throw new Error('SITE_URL is required for sitemap generation')
  const routes = ['', '/mips']
  return routes.map(r => ({ changeFrequency: 'weekly' as const, priority: 0.8, url: `${base}${r}` }))
}
export default sitemap
