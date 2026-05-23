import Link from 'next/link'
const Page = () => (
  <main className='flex min-h-screen flex-col items-center justify-center gap-8 p-8'>
    <h1 className='font-bold text-5xl tracking-tight'>MIPS datapath</h1>
    <p className='text-balance text-center text-lg text-muted-foreground'>
      Interactive single-cycle MIPS datapath visualizer.
    </p>
    <nav className='flex flex-wrap justify-center gap-4 [&>a]:rounded-lg [&>a]:border [&>a]:px-4 [&>a]:py-2 [&>a]:transition hover:[&>a]:bg-muted'>
      <Link href='/mips'>MIPS datapath</Link>
    </nav>
  </main>
)
export default Page
