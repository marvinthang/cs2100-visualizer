'use client'
import type { ControlSignals } from '@/features/mips/types'
import { COMPONENTS } from '@/features/datapath/generated/topology'

const noop = (): undefined => undefined
const DatapathA11yProxies = ({
  name,
  control,
  activeComponents,
  selected,
  onSelect = noop
}: {
  activeComponents: readonly string[]
  control: ControlSignals
  name: string
  onSelect?: (id: string) => void
  selected?: string
}) => {
  const activeSet = new Set(activeComponents)
  return (
    <section aria-label={`MIPS datapath for ${name}`} className='sr-only'>
      <p aria-atomic='true' aria-live='polite'>
        {`Datapath for ${name}. ${activeComponents.length} components active.`}
      </p>
      <ul aria-label='datapath components'>
        {COMPONENTS.map(c => (
          <li key={c.id}>
            <button
              aria-label={`${c.id} ${activeSet.has(c.id) ? 'active' : 'inactive'}. ${c.role}.`}
              aria-pressed={selected === c.id}
              onClick={() => onSelect(c.id)}
              type='button'>
              {c.id}
            </button>
          </li>
        ))}
      </ul>
      <dl aria-label='control signals'>
        {(Object.keys(control) as (keyof ControlSignals)[]).map(k => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{control[k]}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
export default DatapathA11yProxies
