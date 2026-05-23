'use client'
import type { Step } from '@/features/datapath/generated/stepTraces'
import type { View } from '@/features/datapath/use-view-mode'
import type { ControlSignals } from '@/features/mips/types'
import RefDatapath2D from '@/features/datapath/ref-demo/ref-datapath-2d'
const DatapathCanvas = ({
  mounted,
  control,
  step,
  word
}: {
  control: ControlSignals
  mounted: boolean
  onSelect: (id: string) => void
  selected: string | undefined
  step: Step
  values: Record<string, string>
  view: View
  word: number
}): React.JSX.Element => {
  if (!mounted) return <div className='size-full' data-testid='datapath-canvas' />
  return <RefDatapath2D control={control} step={step} word={word} />
}
export default DatapathCanvas
