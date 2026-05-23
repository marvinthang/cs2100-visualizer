import { Inter, JetBrains_Mono } from 'next/font/google'

const sans = Inter({ display: 'optional', preload: true, subsets: ['latin'], variable: '--font-sans' })
const mono = JetBrains_Mono({ display: 'optional', preload: true, subsets: ['latin'], variable: '--font-mono' })
export { mono, sans }
