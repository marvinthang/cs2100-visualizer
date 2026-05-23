/* eslint-disable @typescript-eslint/require-await */
import { notFound } from 'next/navigation'
import type { View } from '@/features/datapath/use-view-mode'
import FocusSandbox from '@/features/datapath/focus/focus-sandbox'
import { MIPS_NAMES } from '@/lib/nav'

const REF: readonly View[] = ['ref']
const generateStaticParams = async () => MIPS_NAMES.map(name => ({ name }))
const Page = async ({ params }: { params: Promise<{ name: string }> }) => {
  const { name } = await params
  if (!(MIPS_NAMES as readonly string[]).includes(name)) notFound()
  return (
    <main aria-label={`mips-${name}`}>
      <FocusSandbox base='/mips' name={name} views={REF} />
    </main>
  )
}
export { generateStaticParams }
export default Page
