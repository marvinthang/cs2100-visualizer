import type { NextConfig } from 'next'
import createMDX from '@next/mdx'

const config: NextConfig = {
  pageExtensions: ['ts', 'tsx', 'mdx'],
  reactStrictMode: false
}
const withMDX = createMDX({ options: { rehypePlugins: [], remarkPlugins: [] } })
export default withMDX(config)
