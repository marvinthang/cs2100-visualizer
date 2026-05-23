/** biome-ignore-all lint/correctness/useUniqueElementIds: vendored ref svg */
/** biome-ignore-all lint/a11y/noSvgWithoutTitle: vendored ref svg */
/** biome-ignore-all lint/a11y/useSemanticElements: vendored ref svg */
/* oxlint-disable unicorn/no-abusive-eslint-disable */
/* eslint-disable */
'use client'
import type {
  ControlSignalId,
  DatapathInspectID,
  DatapathSegment,
  DatapathValueId,
  EncodedInstruction,
  RuntimeControlSignals
} from '@/features/datapath/ref-demo/ref-types'
function InspectPathHitBox({
  id,
  d,
  x,
  y,
  width,
  height,
  onInspect
}: {
  id: DatapathInspectID
  d?: string
  x?: number
  y?: number
  width?: number
  height?: number
  onInspect: (id: DatapathInspectID, el?: SVGGraphicsElement | null) => void
}) {
  if (d !== undefined) {
    return (
      <path
        d={d}
        fill='transparent'
        className='cursor-pointer [outline:none]'
        role='button'
        tabIndex={0}
        onClick={e => onInspect(id, e.currentTarget)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            onInspect(id)
          }
        }}
      />
    )
  }
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill='transparent'
      className='cursor-pointer'
      role='button'
      tabIndex={0}
      onClick={e => onInspect(id, e.currentTarget)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          onInspect(id)
        }
      }}
    />
  )
}
const aluShapePath = 'M545 333V280L620 313.5V403.5L545 439V375L560.5 355L545 333Z'
const add4ShapePath = 'M294.5 72V50L350.5 67.5V97L294.5 116V89.5L301.5 81.5L294.5 72Z'
const branchAdderShapePath = 'M597 125V103L653 120.5V150L597 169V142.5L604 134.5L597 125Z'
const leftShift2ShapePath =
  'M444.5 127.75C463.902 127.75 481.433 130.707 494.087 135.464C500.417 137.843 505.487 140.658 508.962 143.746C512.437 146.834 514.25 150.132 514.25 153.5C514.25 156.868 512.437 160.166 508.962 163.254C505.487 166.342 500.417 169.157 494.087 171.536C481.433 176.293 463.902 179.25 444.5 179.25C425.098 179.25 407.567 176.293 394.913 171.536C388.583 169.157 383.513 166.342 380.038 163.254C376.563 160.166 374.75 156.868 374.75 153.5C374.75 150.132 376.563 146.834 380.038 143.746C383.513 140.658 388.583 137.843 394.913 135.464C407.567 130.707 425.098 127.75 444.5 127.75Z'
const signExtendShapePath =
  'M352 500.75C367.654 500.75 381.79 503.757 391.984 508.586C402.235 513.442 408.25 520.003 408.25 527C408.25 533.997 402.235 540.558 391.984 545.414C381.79 550.243 367.654 553.25 352 553.25C336.346 553.25 322.21 550.243 312.016 545.414C301.765 540.558 295.75 533.997 295.75 527C295.75 520.003 301.765 513.442 312.016 508.586C322.21 503.757 336.346 500.75 352 500.75Z'
export default function StaticDatapathSvg({
  bits,
  signals,
  wireStroke,
  wireStrokeWidth,
  wireFill,
  wireArrow,
  signalFill,
  muxFill,
  valueFill,
  selectedInspectId,
  viewBox = '0 0 900 600',
  onInspect
}: {
  bits: EncodedInstruction
  signals: RuntimeControlSignals
  viewBox?: string
  wireStroke: (id: DatapathSegment) => string
  wireStrokeWidth: (id: DatapathSegment) => number
  wireFill: (id: DatapathSegment) => string
  wireArrow: (id: DatapathSegment) => string
  signalFill: (signal: ControlSignalId) => string
  muxFill: (signal: ControlSignalId) => string
  valueFill: (id: DatapathValueId) => string
  selectedInspectId: DatapathInspectID | null
  onInspect: (id: DatapathInspectID, el?: SVGGraphicsElement | null) => void
}) {
  return (
    <svg
      width='100%'
      height='100%'
      viewBox={viewBox}
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className='size-full bg-white'>
      <defs>
        <marker
          id='arrow-yellow'
          markerWidth={10}
          markerHeight={10}
          refX={10}
          refY={5}
          orient='auto'
          markerUnits='userSpaceOnUse'>
          <path d='M0,0 L0,10 L10,5 z' fill='#facc15' />
        </marker>
        <marker
          id='arrow-black'
          markerWidth={10}
          markerHeight={10}
          refX={7}
          refY={5}
          orient='auto'
          markerUnits='userSpaceOnUse'>
          <path d='M0,0 L0,10 L10,5 z' fill='black' />
        </marker>
        <marker
          id='arrow-red'
          markerWidth={10}
          markerHeight={10}
          refX={7}
          refY={5}
          orient='auto'
          markerUnits='userSpaceOnUse'>
          <path d='M0,0 L0,10 L10,5 z' fill='#FF0000' />
        </marker>
      </defs>
      <rect width={900} height={600} fill='white' />
      <path
        d='M51.5 107.5H20.5V355H50.5'
        stroke={wireStroke('IM_TO_IR')}
        strokeWidth={wireStrokeWidth('IM_TO_IR')}
        markerEnd={wireArrow('IM_TO_IR')}
      />
      <path
        d={add4ShapePath}
        fill={selectedInspectId === 'ADD4' ? '#eff6ff' : 'white'}
        stroke={selectedInspectId === 'ADD4' ? '#2563eb' : 'black'}
        strokeWidth={1.5}
      />
      <path
        d='M350.5 80.5H447.5'
        stroke={wireStroke('ADD4_TO_ADD4_JUNCTION')}
        strokeWidth={wireStrokeWidth('ADD4_TO_ADD4_JUNCTION')}
      />
      <text
        fill={valueFill('ADD4')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={16}
        fontStyle='italic'
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={306} y={85.3182}>
          {'Add'}
        </tspan>
      </text>
      <InspectPathHitBox id='ADD4' d={add4ShapePath} onInspect={onInspect} />
      <path
        d={branchAdderShapePath}
        fill={selectedInspectId === 'BRANCH_ADDER' ? '#eff6ff' : 'white'}
        stroke={selectedInspectId === 'BRANCH_ADDER' ? '#2563eb' : 'black'}
        strokeWidth={1.5}
      />
      <text
        fill={valueFill('BRANCH_ADDER')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={16}
        fontStyle='italic'
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={608.5} y={138.318}>
          {'Add'}
        </tspan>
      </text>
      <InspectPathHitBox id='BRANCH_ADDER' d={branchAdderShapePath} onInspect={onInspect} />
      <rect
        x={192.65}
        y={43.65}
        width={44.7}
        height={74.7}
        fill={selectedInspectId === 'PC' ? '#eff6ff' : '#D9D9D9'}
        stroke={selectedInspectId === 'PC' ? '#2563eb' : 'black'}
        strokeWidth={1.3}
      />
      <text
        fill={valueFill('PC')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={17}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={202} y={84.6818}>
          {'PC'}
        </tspan>
      </text>
      <InspectPathHitBox id='PC' x={192.65} y={43.65} width={44.7} height={74.7} onInspect={onInspect} />
      <rect
        x={50.65}
        y={38.65}
        width={114.7}
        height={125.7}
        fill={selectedInspectId === 'INSTRUCTION_MEMORY' ? '#eff6ff' : '#E7E4B9'}
        stroke={selectedInspectId === 'INSTRUCTION_MEMORY' ? '#2563eb' : 'black'}
        strokeWidth={1.3}
      />
      <text
        fill={valueFill('IM_ADDRESS')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={101.26} y={158.455}>
          {'Address'}
        </tspan>
      </text>
      <text
        fill={valueFill('IM_INSTRUCTION')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={58.2461} y={111.455}>
          {'Instruction'}
        </tspan>
      </text>
      <text
        fill='#FF0000'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={16}
        fontStyle='italic'
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={65.5625} y={58.3182}>
          {'Instruction\n'}
        </tspan>
        <tspan x={76.0938} y={77.3182}>
          {'Memory'}
        </tspan>
      </text>
      <InspectPathHitBox id='INSTRUCTION_MEMORY' x={50.65} y={38.65} width={114.7} height={125.7} onInspect={onInspect} />
      <rect
        x={302.65}
        y={268.65}
        width={110.7}
        height={164.7}
        fill={selectedInspectId === 'REGISTER_FILE' ? '#eff6ff' : '#FFFFCB'}
        stroke={selectedInspectId === 'REGISTER_FILE' ? '#2563eb' : 'black'}
        strokeWidth={1.3}
      />
      <text
        fill={valueFill('RF_WD')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={307.272} y={426.455}>
          {'WD'}
        </tspan>
      </text>
      <text
        fill={valueFill('RF_RD2')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={378.397} y={401.455}>
          {'RD2'}
        </tspan>
      </text>
      <text
        fill={valueFill('RF_WR')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={307.307} y={379.455}>
          {'WR'}
        </tspan>
      </text>
      <text
        fill={valueFill('RF_RR1')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={308.487} y={297.455}>
          {'RR1'}
        </tspan>
      </text>
      <rect
        x={662.65}
        y={357.65}
        width={115.7}
        height={149.7}
        fill={selectedInspectId === 'DATA_MEMORY' ? '#eff6ff' : '#E1FEC4'}
        stroke={selectedInspectId === 'DATA_MEMORY' ? '#2563eb' : 'black'}
        strokeWidth={1.3}
      />
      <text
        fill={valueFill('DM_WRITE_DATA')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={667} y={486.455}>
          {'Write\n'}
        </tspan>
        <tspan x={667} y={504.455}>
          {'Data'}
        </tspan>
      </text>
      <text
        fill={valueFill('DM_ADDRESS')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={664.521} y={390.455}>
          {'Address'}
        </tspan>
      </text>
      <path
        d='M545 333V280L620 313.5V403.5L545 439V375L560.5 355L545 333Z'
        fill={selectedInspectId === 'ALU' ? '#eff6ff' : 'white'}
        stroke={selectedInspectId === 'ALU' ? '#2563eb' : 'black'}
        strokeWidth={1.3}
      />
      <text
        fill={valueFill('ALU_RESULT')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={586.326} y={381.455}>
          {'ALU\n'}
        </tspan>
        <tspan x={574.607} y={399.455}>
          {'result'}
        </tspan>
      </text>
      <text
        fill={valueFill('ALU_ZERO')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={586.363} y={333.455}>
          {'is0?'}
        </tspan>
      </text>
      <text
        fill='#FF383C'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={16}
        fontStyle='italic'
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={333.125} y={355.318}>
          {'Register\n'}
        </tspan>
        <tspan x={352.172} y={374.318}>
          {'File'}
        </tspan>
      </text>
      <InspectPathHitBox id='REGISTER_FILE' x={302.65} y={268.65} width={110.7} height={164.7} onInspect={onInspect} />
      <text
        fill='#FF0000'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={16}
        fontStyle='italic'
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={704.289} y={423.318}>
          {'Data\n'}
        </tspan>
        <tspan x={690.094} y={442.318}>
          {'Memory'}
        </tspan>
      </text>
      <InspectPathHitBox id='DATA_MEMORY' x={662.65} y={357.65} width={115.7} height={149.7} onInspect={onInspect} />
      <text
        fill='#FF0000'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={16}
        fontStyle='italic'
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={569.141} y={356.318}>
          {'ALU'}
        </tspan>
      </text>
      <InspectPathHitBox id='ALU' d={aluShapePath} onInspect={onInspect} />
      <path d='M237 59H247' stroke={wireStroke('PC_TO_PC_JUNCTION')} strokeWidth={wireStrokeWidth('PC_TO_PC_JUNCTION')} />
      <path
        d='M247 59V153H165'
        stroke={wireStroke('PC_JUNCTION_TO_IM')}
        strokeWidth={wireStrokeWidth('PC_JUNCTION_TO_IM')}
        strokeLinecap='square'
        markerEnd={wireArrow('PC_JUNCTION_TO_IM')}
      />
      <path
        d='M247 59H293'
        stroke={wireStroke('PC_JUNCTION_TO_ADD4')}
        strokeWidth={wireStrokeWidth('PC_JUNCTION_TO_ADD4')}
        strokeLinecap='square'
        markerEnd={wireArrow('PC_JUNCTION_TO_ADD4')}
      />
      <path
        d='M250.314 58.4328C250.314 60.3658 248.747 61.9328 246.814 61.9328C244.881 61.9328 243.314 60.3658 243.314 58.4328C243.314 56.4998 244.881 54.9328 246.814 54.9328C248.747 54.9328 250.314 56.4998 250.314 58.4328Z'
        fill={wireFill('PC_JUNCTION')}
      />
      <path
        d='M95.5 178H125.5V252.5V317V380.5V444.5V508V582.5H95L95.0921 508L95.1706 444.5L95.2497 380.5L95.3282 317L95.4079 252.5L95.5 178Z'
        fill={selectedInspectId === 'INSTRUCTION_REGISTER' ? '#eff6ff' : 'white'}
      />
      <path
        d='M95.4079 252.5L95.5 178H125.5V252.5M95.4079 252.5H125.5M125.5 508V582.5H95L95.0921 508L95.1706 444.5L95.2497 380.5L95.3282 317L95.4079 252.5M125.5 252.5V317M95.3282 317H125.5M125.5 317V380.5M95.2497 380.5H125.5M125.5 380.5V444.5M95.1706 444.5H125.5M125.5 444.5V508M95.0921 508H125.5'
        stroke={selectedInspectId === 'INSTRUCTION_REGISTER' ? '#2563eb' : 'black'}
        strokeWidth={2.3}
      />
      <text
        transform='matrix(0 1 -1 0 91 454)'
        fill='#093EB0'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={0.001_953_12} y={14.4545}>
          {'shamt\n'}
        </tspan>
        <tspan x={3.510_25} y={32.4545}>
          {'10 : 6'}
        </tspan>
      </text>
      <text
        transform='matrix(0 1 -1 0 91 388)'
        fill='#FF383C'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={16.3535} y={14.4545}>
          {'rd\n'}
        </tspan>
        <tspan x={2.452_15} y={32.4545}>
          {'15 : 11'}
        </tspan>
      </text>
      <text
        transform='matrix(0 1 -1 0 119 323)'
        fill='#008700'
        style={{
          whiteSpace: 'pre'
        }}
        textAnchor='middle'
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={0.182_129 + 26} y={14.4545}>
          {bits.rt.bin}
        </tspan>
      </text>
      <text
        transform='matrix(0 1 -1 0 91 260)'
        fill='#008700'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={16.7197} y={14.4545}>
          {'rs\n'}
        </tspan>
        <tspan x={0.342_773} y={32.4545}>
          {'25 : 21'}
        </tspan>
      </text>
      <path
        d='M126 349L173.5 340.5'
        stroke={wireStroke('IR_RT_TO_RT_JUNCTION')}
        strokeWidth={wireStrokeWidth('IR_RT_TO_RT_JUNCTION')}
      />
      <path
        d={leftShift2ShapePath}
        fill={selectedInspectId === 'LEFT_SHIFT_2' ? '#eff6ff' : '#F1F1F1'}
        stroke={selectedInspectId === 'LEFT_SHIFT_2' ? '#2563eb' : 'black'}
        strokeWidth={1.5}
      />
      <text
        fill={valueFill('LEFT_SHIFT_2')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={17}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={406.275} y={149.682}>
          {'Left Shift\n'}
        </tspan>
        <tspan x={424.138} y={170.682}>
          {'2-bit'}
        </tspan>
      </text>
      <InspectPathHitBox id='LEFT_SHIFT_2' d={leftShift2ShapePath} onInspect={onInspect} />
      <path
        d={signExtendShapePath}
        fill={selectedInspectId === 'SIGN_EXTEND' ? '#eff6ff' : '#F1F1F1'}
        stroke={selectedInspectId === 'SIGN_EXTEND' ? '#2563eb' : 'black'}
        strokeWidth={1.5}
      />
      <text
        fill={valueFill('SIGN_EXTEND')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={17}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={332.948} y={522.682}>
          {'Sign\n'}
        </tspan>
        <tspan x={322.389} y={543.682}>
          {'Extend'}
        </tspan>
      </text>
      <InspectPathHitBox id='SIGN_EXTEND' d={signExtendShapePath} onInspect={onInspect} />
      <rect
        x={695}
        y={66}
        width={27}
        height={90}
        rx={4}
        fill={selectedInspectId === 'PCSRC_MUX' ? '#eff6ff' : '#F1F1F1'}
        stroke={selectedInspectId === 'PCSRC_MUX' ? '#2563eb' : 'black'}
        strokeWidth={2}
      />
      <text
        fill={muxFill('PCSrc')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={19}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={700.307} y={94.4091}>
          {'M\n'}
        </tspan>
        <tspan x={702.07} y={117.409}>
          {'U\n'}
        </tspan>
        <tspan x={702.209} y={140.409}>
          {'X'}
        </tspan>
      </text>
      <InspectPathHitBox id='PCSRC_MUX' x={695} y={66} width={27} height={90} onInspect={onInspect} />
      <path d='M709 157L709 183' stroke='#2C1AF4' strokeWidth={1.5} />
      <rect
        x={822}
        y={450}
        width={27}
        height={90}
        rx={4}
        fill={selectedInspectId === 'MEMTOREG_MUX' ? '#eff6ff' : '#F1F1F1'}
        stroke={selectedInspectId === 'MEMTOREG_MUX' ? '#2563eb' : 'black'}
        strokeWidth={2}
      />
      <text
        fill={muxFill('MemToReg')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={19}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={827.307} y={478.409}>
          {'M\n'}
        </tspan>
        <tspan x={829.07} y={501.409}>
          {'U\n'}
        </tspan>
        <tspan x={829.209} y={524.409}>
          {'X'}
        </tspan>
      </text>
      <InspectPathHitBox id='MEMTOREG_MUX' x={822} y={450} width={27} height={90} onInspect={onInspect} />
      <path d='M836 432.5L836 450' stroke='#2C1AF4' strokeWidth={1.5} />
      <rect
        x={485}
        y={381}
        width={27}
        height={90}
        rx={4}
        fill={selectedInspectId === 'ALUSRC_MUX' ? '#eff6ff' : '#F1F1F1'}
        stroke={selectedInspectId === 'ALUSRC_MUX' ? '#2563eb' : 'black'}
        strokeWidth={2}
      />
      <text
        fill={muxFill('ALUSrc')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={19}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={490.307} y={409.409}>
          {'M\n'}
        </tspan>
        <tspan x={492.07} y={432.409}>
          {'U\n'}
        </tspan>
        <tspan x={492.209} y={455.409}>
          {'X'}
        </tspan>
      </text>
      <InspectPathHitBox id='ALUSRC_MUX' x={485} y={381} width={27} height={90} onInspect={onInspect} />
      <path d='M499 366L499 380' stroke='#2C1AF4' strokeWidth={1.5} />
      <rect
        x={218}
        y={365}
        width={27}
        height={90}
        rx={4}
        fill={selectedInspectId === 'REGDST_MUX' ? '#eff6ff' : '#F1F1F1'}
        stroke={selectedInspectId === 'REGDST_MUX' ? '#2563eb' : 'black'}
        strokeWidth={2}
      />
      <text
        fill={muxFill('RegDst')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={19}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={223.307} y={393.409}>
          {'M\n'}
        </tspan>
        <tspan x={225.07} y={416.409}>
          {'U\n'}
        </tspan>
        <tspan x={225.209} y={439.409}>
          {'X'}
        </tspan>
      </text>
      <InspectPathHitBox id='REGDST_MUX' x={218} y={365} width={27} height={90} onInspect={onInspect} />
      <path d='M232 456L232 471' stroke='#2C1AF4' strokeWidth={1.5} />
      <path
        d='M269 104H294.5'
        stroke={wireStroke('CONST4_TO_ADD4')}
        strokeWidth={wireStrokeWidth('CONST4_TO_ADD4')}
        markerEnd={wireArrow('CONST4_TO_ADD4')}
      />
      <path
        d='M448 81V115H597'
        stroke={wireStroke('ADD4_JUNCTION_TO_BRANCH_ADDER0')}
        strokeWidth={wireStrokeWidth('ADD4_JUNCTION_TO_BRANCH_ADDER0')}
        markerEnd={wireArrow('ADD4_JUNCTION_TO_BRANCH_ADDER0')}
      />
      <path
        d='M448 80.25H694.5'
        stroke={wireStroke('ADD4_JUNCTION_TO_PCSRC_MUX0')}
        strokeWidth={wireStrokeWidth('ADD4_JUNCTION_TO_PCSRC_MUX0')}
        markerEnd={wireArrow('ADD4_JUNCTION_TO_PCSRC_MUX0')}
      />
      <path
        d='M653 133H694.5'
        stroke={wireStroke('BRANCH_ADDER_TO_PCSRC_MUX1')}
        strokeWidth={wireStrokeWidth('BRANCH_ADDER_TO_PCSRC_MUX1')}
        markerEnd={wireArrow('BRANCH_ADDER_TO_PCSRC_MUX1')}
      />
      <path
        d='M515 154H597'
        stroke={wireStroke('LEFT_SHIFT_2_TO_BRANCH_ADDER1')}
        strokeWidth={wireStrokeWidth('LEFT_SHIFT_2_TO_BRANCH_ADDER1')}
        markerEnd={wireArrow('LEFT_SHIFT_2_TO_BRANCH_ADDER1')}
      />
      <path
        d='M722.5 111H744V21H215V43.5'
        stroke={wireStroke('PCSRC_MUX_TO_PC')}
        strokeWidth={wireStrokeWidth('PCSRC_MUX_TO_PC')}
        markerEnd={wireArrow('PCSRC_MUX_TO_PC')}
      />
      <path
        d='M450.804 80.7098C450.804 82.6428 449.237 84.2098 447.304 84.2098C445.371 84.2098 443.804 82.6428 443.804 80.7098C443.804 78.7768 445.371 77.2098 447.304 77.2098C449.237 77.2098 450.804 78.7768 450.804 80.7098Z'
        fill={wireFill('ADD4_JUNCTION')}
      />
      <path
        d='M126 285.5L249 291L302.5 292.5'
        stroke={wireStroke('IR_RS_TO_RF_RR1')}
        strokeWidth={wireStrokeWidth('IR_RS_TO_RF_RR1')}
        markerEnd={wireArrow('IR_RS_TO_RF_RR1')}
      />
      <path
        d='M174 341L249.5 328.5L302.5 330'
        stroke={wireStroke('RT_JUNCTION_TO_RF_RR2')}
        strokeWidth={wireStrokeWidth('RT_JUNCTION_TO_RF_RR2')}
        markerEnd={wireArrow('RT_JUNCTION_TO_RF_RR2')}
      />
      <path
        d='M173.5 341V397.5H218'
        stroke={wireStroke('RT_JUNCTION_TO_REGDST_MUX0')}
        strokeWidth={wireStrokeWidth('RT_JUNCTION_TO_REGDST_MUX0')}
      />
      <path
        d='M177 340.5C177 342.433 175.433 344 173.5 344C171.567 344 170 342.433 170 340.5C170 338.567 171.567 337 173.5 337C175.433 337 177 338.567 177 340.5Z'
        fill={wireFill('RT_JUNCTION')}
      />
      <path
        d='M126 420H218'
        stroke={wireStroke('IR_RD_TO_REGDST_MUX1')}
        strokeWidth={wireStrokeWidth('IR_RD_TO_REGDST_MUX1')}
      />
      <path
        d='M245.5 410L256.5 373.5H303'
        stroke={wireStroke('REGDST_MUX_TO_RF_WR')}
        strokeWidth={wireStrokeWidth('REGDST_MUX_TO_RF_WR')}
        markerEnd={wireArrow('REGDST_MUX_TO_RF_WR')}
      />
      <path
        d='M125.5 531H296.5'
        stroke={wireStroke('IR_IMM_TO_SIGN_EXTEND')}
        strokeWidth={wireStrokeWidth('IR_IMM_TO_SIGN_EXTEND')}
      />
      <path
        d='M413.5 298.5H545'
        stroke={wireStroke('RF_RD1_TO_ALU1')}
        strokeWidth={wireStrokeWidth('RF_RD1_TO_ALU1')}
        markerEnd={wireArrow('RF_RD1_TO_ALU1')}
      />
      <path
        d='M413.5 396H462.5'
        stroke={wireStroke('RF_RD2_TO_RD2_JUNCTION')}
        strokeWidth={wireStrokeWidth('RF_RD2_TO_RD2_JUNCTION')}
      />
      <path
        d='M463 396.5H485.5'
        stroke={wireStroke('RD2_JUNCTION_TO_ALUSRC_MUX0')}
        strokeWidth={wireStrokeWidth('RD2_JUNCTION_TO_ALUSRC_MUX0')}
      />
      <path
        d='M512.5 426H545'
        stroke={wireStroke('ALUSRC_MUX_TO_ALU2')}
        strokeWidth={wireStrokeWidth('ALUSRC_MUX_TO_ALU2')}
        markerEnd={wireArrow('ALUSRC_MUX_TO_ALU2')}
      />
      <path
        d='M620.5 385H635.5'
        stroke={wireStroke('ALU_TO_ALU_JUNCTION')}
        strokeWidth={wireStrokeWidth('ALU_TO_ALU_JUNCTION')}
      />
      <path
        d='M637 385H662.5'
        stroke={wireStroke('ALU_JUNCTION_TO_DM_ADDR')}
        strokeWidth={wireStrokeWidth('ALU_JUNCTION_TO_DM_ADDR')}
        markerEnd={wireArrow('ALU_JUNCTION_TO_DM_ADDR')}
      />
      <path
        d='M778.5 471H821.5'
        stroke={wireStroke('DM_RD_TO_MEMTOREG_MUX1')}
        strokeWidth={wireStrokeWidth('DM_RD_TO_MEMTOREG_MUX1')}
        markerEnd={wireArrow('DM_RD_TO_MEMTOREG_MUX1')}
      />
      <path d='M357 433.5V452.5' stroke='#2C1AF4' strokeWidth={1.5} />
      <path d='M721 508V537' stroke='#2C1AF4' strokeWidth={1.5} />
      <path d='M721 357V335' stroke='#2C1AF4' strokeWidth={1.5} />
      <path
        d='M409 527H447V456'
        stroke={wireStroke('SIGN_EXTEND_TO_SE_JUNCTION')}
        strokeWidth={wireStrokeWidth('SIGN_EXTEND_TO_SE_JUNCTION')}
      />
      <path
        d='M447 456H485'
        stroke={wireStroke('SE_JUNCTION_TO_ALUSRC_MUX1')}
        strokeWidth={wireStrokeWidth('SE_JUNCTION_TO_ALUSRC_MUX1')}
      />
      <path d='M590.5 269V300.5' stroke='#2C1AF4' strokeWidth={1.5} />
      <path d='M578.5 284.5L601 291.5' stroke='#2C1AF4' strokeWidth={1.2} />
      <path d='M57.5 178.5H50V575.5H57.5' stroke={wireStroke('IM_TO_IR')} strokeWidth={wireStrokeWidth('IM_TO_IR')} />
      <text
        transform='matrix(0 1 -1 0 91 187)'
        fill='#833A83'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={0.402_344} y={14.4545}>
          {'opcode\n'}
        </tspan>
        <tspan x={4.005_86} y={32.4545}>
          {'31 : 26'}
        </tspan>
      </text>
      <text
        transform='matrix(0 1 -1 0 119 183)'
        fill='#833A83'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        textAnchor='middle'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={0.018_554_7 + 32} y={14.4545}>
          {bits.opcode.bin}
        </tspan>
      </text>
      <text
        transform='matrix(0 1 -1 0 119 451)'
        fill='#093EB0'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        textAnchor='middle'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={0.182_129 + 25} y={14.4545}>
          {bits.shamt.bin}
        </tspan>
      </text>
      <text
        transform='matrix(0 1 -1 0 91 527)'
        fill='#093EB0'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={0.458_984} y={14.4545}>
          {'funct\n'}
        </tspan>
        <tspan x={4.296_88} y={32.4545}>
          {'5 : 0'}
        </tspan>
      </text>
      <text
        transform='matrix(0 1 -1 0 119 514)'
        fill='#093EB0'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        textAnchor='middle'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={0.018_554_7 + 31} y={14.4545}>
          {bits.funct.bin}
        </tspan>
      </text>
      <text
        transform='matrix(0 1 -1 0 119 381)'
        fill='#FF383C'
        style={{
          whiteSpace: 'pre'
        }}
        textAnchor='middle'
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={5.182_13 + 26} y={14.4545}>
          {bits.rd.bin}
        </tspan>
      </text>
      <text
        transform='matrix(0 1 -1 0 90 324)'
        fill='#008700'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={18.311} y={14.4545}>
          {'rt\n'}
        </tspan>
        <tspan x={0.286_133} y={32.4545}>
          {'20 : 16'}
        </tspan>
      </text>
      <text
        transform='matrix(0 1 -1 0 91 260)'
        fill='#008700'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={16.7197} y={14.4545}>
          {'rs\n'}
        </tspan>
        <tspan x={0.342_773} y={32.4545}>
          {'25 : 21'}
        </tspan>
      </text>
      <text
        transform='matrix(0 1 -1 0 119 259)'
        fill='#008700'
        style={{
          whiteSpace: 'pre'
        }}
        textAnchor='middle'
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={0.182_129 + 25} y={14.4545}>
          {bits.rs.bin}
        </tspan>
      </text>
      <InspectPathHitBox id='INSTRUCTION_REGISTER' x={95} y={178} width={31} height={405} onInspect={onInspect} />
      <text
        fill={signalFill('RegDst')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={17}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={190.277} y={488.682}>
          RegDst={signals.RegDst}
        </tspan>
      </text>
      <text
        fill={signalFill('RegWrite')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={17}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={310.393} y={469.682}>
          RegWrite={signals.RegWrite}
        </tspan>
      </text>
      <text
        fill={signalFill('MemRead')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={17}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={670.471} y={553.682}>
          MemRead={signals.MemRead}
        </tspan>
      </text>
      <text
        fill={signalFill('MemWrite')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={17}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={670.176} y={330.682}>
          MemWrite={signals.MemWrite}
        </tspan>
      </text>
      <text
        fill='#2C1AF4'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={17}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={547.034} y={264.682}>
          {'ALUcontrol'}
        </tspan>
      </text>
      <text
        fill={signalFill('ALUSrc')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={17}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={460.297} y={361.682}>
          ALUSrc={signals.ALUSrc}
        </tspan>
      </text>
      <text
        fill={signalFill('MemToReg')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={17}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={781.099} y={427.682}>
          MemToReg={signals.MemToReg}
        </tspan>
      </text>
      <text
        fill='#2C1AF4'
        style={{
          whiteSpace: 'pre'
        }}
        textAnchor='middle'
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={17}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={708.284} y={199.682}>
          {`PCSrc${signals.PCSrc === undefined ? '' : `=${signals.PCSrc}`}`}
        </tspan>
      </text>
      <text
        fill='#008700'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={17}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={252.239} y={110.682}>
          {'4'}
        </tspan>
      </text>
      <path d='M280 284.5L271 300' stroke='black' strokeWidth={1.2} />
      <path d='M280.5 322L271 337.5' stroke='black' strokeWidth={1.2} />
      <path d='M280 365L271 380.5' stroke='black' strokeWidth={1.2} />
      <text
        fill='black'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={269.166} y={286.455}>
          {'5'}
        </tspan>
      </text>
      <text
        fill='black'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={266.166} y={327.455}>
          {'5'}
        </tspan>
      </text>
      <text
        fill='black'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={266.166} y={371.455}>
          {'5'}
        </tspan>
      </text>
      <text
        fill='#2C1AF4'
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={568.417} y={279.455}>
          {'4'}
        </tspan>
      </text>
      <text
        fill={valueFill('RF_RR2')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={307.432} y={335.455}>
          {'RR2'}
        </tspan>
      </text>
      <text
        fill={valueFill('RF_RD1')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={380.452} y={304.455}>
          {'RD1'}
        </tspan>
      </text>
      <text
        fill={valueFill('DM_READ_DATA')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={738.086} y={467.455}>
          {'Read\n'}
        </tspan>
        <tspan x={740.854} y={485.455}>
          {'Data'}
        </tspan>
      </text>
      <text
        fill={valueFill('IR_RS')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={132.094} y={279.455}>
          {'Inst [25:21]'}
        </tspan>
      </text>
      <text
        fill={valueFill('IR_RD')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={132.312} y={436.455}>
          {'Inst [15:11]'}
        </tspan>
      </text>
      <text
        transform='translate(128.058 325.204) rotate(-7)'
        fill={valueFill('IR_RT')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={0.980_469} y={14.4545}>
          {'Inst [20:16]'}
        </tspan>
      </text>
      <text
        fill={valueFill('IR_IMMEDIATE')}
        style={{
          whiteSpace: 'pre'
        }}
        xmlSpace='preserve'
        fontFamily='Inter'
        fontSize={15}
        fontWeight='bold'
        letterSpacing='0em'>
        <tspan x={132.663} y={527.455}>
          {'Inst [15:0]'}
        </tspan>
      </text>
      <path
        d='M282 536C290 536 290 526 282 526'
        stroke={wireStroke('MEMTOREG_MUX_JUMP')}
        strokeWidth={wireStrokeWidth('MEMTOREG_MUX_JUMP')}
      />
      <path
        d='M282 526.5V422C282 421.448 282.448 421 283 421H302.5'
        stroke={wireStroke('MEMTOREG_MUX_JUMP_TO_RF_WD')}
        strokeWidth={wireStrokeWidth('MEMTOREG_MUX_JUMP_TO_RF_WD')}
        markerEnd={wireArrow('MEMTOREG_MUX_JUMP_TO_RF_WD')}
      />
      <path
        d='M282 535.5V575C282 575.552 282.448 576 283 576H870C870.552 576 871 575.552 871 575V494C871 493.448 870.552 493 870 493H849'
        stroke={wireStroke('MEMTOREG_MUX_TO_MEMTOREG_MUX_JUMP')}
        strokeWidth={wireStrokeWidth('MEMTOREG_MUX_TO_MEMTOREG_MUX_JUMP')}
      />
      <path
        d='M462 461C470 461 470 451 462 451'
        stroke={wireStroke('RD2_JUMP')}
        strokeWidth={wireStrokeWidth('RD2_JUMP')}
      />
      <path
        d='M462.5 396.5V451.5'
        stroke={wireStroke('RD2_JUNCTION_TO_RD2_JUMP')}
        strokeWidth={wireStrokeWidth('RD2_JUNCTION_TO_RD2_JUMP')}
      />
      <path
        d='M462.5 460.5V492C462.5 492.552 462.948 493 463.5 493H662.5'
        stroke={wireStroke('RD2_JUMP_TO_DM_WD')}
        strokeWidth={wireStrokeWidth('RD2_JUMP_TO_DM_WD')}
        markerEnd={wireArrow('RD2_JUMP_TO_DM_WD')}
      />
      <path
        d='M466 395.5C466 397.433 464.433 399 462.5 399C460.567 399 459 397.433 459 395.5C459 393.567 460.567 392 462.5 392C464.433 392 466 393.567 466 395.5Z'
        fill={wireFill('RD2_JUNCTION')}
      />
      <path
        d='M446.5 401C454.5 401 454.5 391 446.5 391'
        stroke={wireStroke('SE_JUMP1')}
        strokeWidth={wireStrokeWidth('SE_JUMP1')}
      />
      <path
        d='M447 304C455 304 455 294 447 294'
        stroke={wireStroke('SE_JUMP2')}
        strokeWidth={wireStrokeWidth('SE_JUMP2')}
      />
      <path
        d='M447 455.5V400.5'
        stroke={wireStroke('SE_JUNCTION_TO_SE_JUMP1')}
        strokeWidth={wireStrokeWidth('SE_JUNCTION_TO_SE_JUMP1')}
      />
      <path
        d='M447 391.5V303.5'
        stroke={wireStroke('SE_JUMP1_TO_SE_JUMP2')}
        strokeWidth={wireStrokeWidth('SE_JUMP1_TO_SE_JUMP2')}
      />
      <path
        d='M447 294.5V179'
        stroke={wireStroke('SE_JUMP2_TO_LEFT_SHIFT_2')}
        strokeWidth={wireStrokeWidth('SE_JUMP2_TO_LEFT_SHIFT_2')}
      />
      <path
        d='M450 455.5C450 457.433 448.433 459 446.5 459C444.567 459 443 457.433 443 455.5C443 453.567 444.567 452 446.5 452C448.433 452 450 453.567 450 455.5Z'
        fill={wireFill('SE_JUNCTION')}
      />
      <path
        d='M635 498C643 498 643 488 635 488'
        stroke={wireStroke('ALU_JUMP')}
        strokeWidth={wireStrokeWidth('ALU_JUMP')}
      />
      <path
        d='M635.5 385.5V488.5'
        stroke={wireStroke('ALU_JUNCTION_ALU_JUMP')}
        strokeWidth={wireStrokeWidth('ALU_JUNCTION_ALU_JUMP')}
      />
      <path
        d='M635.5 497.5V522C635.5 522.552 635.948 523 636.5 523H822'
        stroke={wireStroke('ALU_JUMP_TO_MEMTOREG_MUX0')}
        strokeWidth={wireStrokeWidth('ALU_JUMP_TO_MEMTOREG_MUX0')}
        markerEnd={wireArrow('ALU_JUMP_TO_MEMTOREG_MUX0')}
      />
      <path
        d='M639 385.5C639 387.433 637.433 389 635.5 389C633.567 389 632 387.433 632 385.5C632 383.567 633.567 382 635.5 382C637.433 382 639 383.567 639 385.5Z'
        fill={wireFill('ALU_JUNCTION')}
      />
    </svg>
  )
}
