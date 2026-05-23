import type { View } from '@/features/datapath/use-view-mode'
import AssemblyView from '@/features/datapath/assembly-view'

const REF: readonly View[] = ['ref']
const Page = (): React.JSX.Element => <AssemblyView base='/mips' views={REF} />
export default Page
