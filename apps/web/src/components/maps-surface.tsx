import type { ReactNode } from 'react'
import { cn } from '@a/ui'

const PANEL = 'rounded-xl border bg-background/80 shadow-lg backdrop-blur-md'
const MapsSurface = ({
  label,
  info,
  children
}: {
  children: ReactNode
  info?: ReactNode
  label: string
}): React.JSX.Element => (
  <div className='absolute inset-0'>
    <div className='size-full'>{children}</div>
    <h1 className={cn('absolute top-4 left-4 px-3 py-1.5 font-mono text-sm', PANEL)}>{label}</h1>
    {info === undefined ? undefined : (
      <div className={cn('absolute top-4 right-4 flex max-w-80 flex-col gap-1 p-3 font-mono text-xs', PANEL)}>{info}</div>
    )}
  </div>
)
export default MapsSurface
export { PANEL }
