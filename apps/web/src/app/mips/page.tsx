import MipsLanding from '@/features/datapath/mips-landing'
import { DATAPATH_INSTRUCTIONS } from '@/lib/nav'

const Page = (): React.JSX.Element => <MipsLanding base='/mips' names={DATAPATH_INSTRUCTIONS} />
export default Page
