# CS2100 Visualizer

An interactive React app for learning CS2100 computer organization topics through visual simulation.

The app currently includes:

- **MIPS Datapath Visualizer** for single-cycle datapath execution, control signals, registers, memory, warnings, and component inspection.
- **MIPS Assembly Simulator** for assembling and stepping through supported MIPS programs.
- **K-map Visualizer** for building Karnaugh maps, grouping cells, checking expressions, and comparing against solver output.

## Demo

[CS2100 Visualizer Demo](https://cs2100-visualizer.vercel.app/)

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- SVG datapath rendering
- Vitest
- ESLint
- Prettier

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed by Vite, usually:

```txt
http://localhost:5173
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Run tests:

```bash
npm test
```

Run linting:

```bash
npm run lint
```

Format files:

```bash
npm run format
```

## Main Features

### MIPS Datapath Visualizer

The datapath tab renders an SVG-based single-cycle MIPS datapath. Users can step through instruction execution and watch active datapath wires, values, control signals, register state, memory state, and warnings update together.

Supported datapath instructions:

```txt
add, addi, and, beq, bne, lw, slt, or, sw, sub
```

Datapath modes:

- **Explore**: inspect the datapath and experiment with control signals without committing machine-state updates.
- **Simulate**: step through execution while applying program counter, register, and memory updates.
- **Assembly**: load a small assembly program using the datapath-supported instruction subset and execute it stage by stage.

Execution stages:

```txt
IF, ID, EX, MEM, WB
```

The visualizer includes:

- A redesigned command/status header with program counter, selected instruction/program step, warning count, current stage, and signal-edit state.
- A central datapath canvas with highlighted default and modified paths.
- Editable control signals for experimenting with incorrect or undefined signal behavior.
- Component inspection for PC, instruction memory, instruction register, ALU, register file, data memory, MUXes, sign extend, branch adder, and related datapath blocks.
- Register and data-memory panels with editable values, reset controls, expandable views, and input/output highlighting.
- Datapath values, execution log, and warning panels for explaining what happened during each stage.

### MIPS Assembly Simulator

The assembly tab is an instruction-level simulator. Users can write supported MIPS assembly, assemble it into 32-bit machine code, load the program, and execute one instruction at a time while observing program counter, register, and memory changes.

Supported assembly mnemonics:

```txt
add, addi, and, andi, beq, bne, j, lui, lw, nor, or, ori, slt, sll, srl, sw, sub
```

Assembly features:

- Label parsing and branch/jump target resolution.
- Hex machine-code output for each assembled instruction.
- Step-by-step program execution.
- Register and memory highlighting for inputs and outputs.
- Program reset after loading.

### K-map Visualizer

The K-map tab helps users practice Karnaugh-map simplification.

K-map features:

- 2-, 3-, and 4-variable K-map support.
- Manual cell editing for `0`, `1`, and don't-care `X` values.
- Minterm and don't-care input.
- Boolean-expression input.
- SOP/POS solving modes.
- Manual grouping workflow.
- Solver grouping view.
- Expression checking and feedback.
- Practice-map generation with difficulty options.

## Manual Testing

### Datapath Visualizer

1. Open the **Datapath** tab.
2. Select an instruction such as `add`.
3. Click **Next** repeatedly and verify that the step changes through `IF`, `ID`, `EX`, `MEM`, and `WB`.
4. Confirm that active datapath wires and datapath values update as the step changes.
5. Click components such as PC, register file, ALU, data memory, and MUXes. Confirm that the inspector updates.
6. Switch to **Simulate** mode and verify that the program counter, registers, and memory update when state-changing steps execute.
7. Click **Edit** in the control-signal panel, change a signal, and verify that warnings, path highlighting, or machine state reflect the modified signal.
8. Edit a register or memory value and confirm that the simulator resets execution state for the new input state.
9. Switch to **Assembly** mode, load a program using datapath-supported instructions, and step through it stage by stage.

Example datapath Assembly mode program:

```asm
addi $t0, $zero, 5
addi $t1, $zero, 3
add $t2, $t0, $t1
loop:
beq $t2, $zero, loop
```

### Assembly Simulator

1. Open the **Assembly** tab.
2. Use the default example or paste a supported program.
3. Confirm that each assembled instruction displays a `0x........` machine-code word.
4. Click **Assemble & Load**.
5. Click **Next Instruction** repeatedly.
6. Verify that the program counter advances, registers and memory update, and highlighted cells match the executed instruction.
7. Test a branch or jump with labels and confirm that the resolved target is used.
8. Click **Reset** and confirm that the loaded program returns to its initial state.

Example Assembly tab program:

```asm
lui $t0, 0x1
ori $t0, $t0, 0x234
addi $t1, $zero, 5
sll $t2, $t1, 2
sub $t3, $t2, $t1
```

### K-map Visualizer

1. Open the **Karnaugh Maps** tab.
2. Choose the variable count and SOP/POS mode.
3. Enter minterms and don't-cares, or edit cells directly.
4. Switch to grouping mode and select cells to create groups.
5. Compare manual groups with solver groups.
6. Enter a group expression and use the checker to verify coverage.
7. Generate a practice map and solve it manually.

## Screenshots and Demo Assets

![Datapath step-by-step demo](docs/assets/datapath-demo.gif)

![Datapath overview](public/screenshots/datapath-1.png)

![Datapath stepping and control signals](public/screenshots/datapath-2.png)

## Code Structure

```txt
src/
  App.tsx
  components/
    layout/
    shared/
  core/
    kmap/
    mips/
      assembly/
      execution/
      instruction/
      single-cycle/
  features/
    assembly/
    datapath/
    kmap/
    pipeline/
  types/
  utils/
public/
  screenshots/
docs/
  assets/
```

Important files:

- `src/App.tsx` - top-level app shell and tab switching.
- `src/features/datapath/DatapathPage.tsx` - main datapath visualizer UI.
- `src/features/datapath/hooks/useDatapathSimulator.ts` - datapath state, stepping, modes, control signals, and machine state.
- `src/features/datapath/components/DatapathDiagram.tsx` - datapath SVG wrapper and highlight mapping.
- `src/features/datapath/components/StaticDatapathSvg.tsx` - static SVG datapath drawing and clickable hit boxes.
- `src/features/assembly/AssemblyPage.tsx` - standalone assembly simulator UI.
- `src/features/assembly/useAssemblySimulator.ts` - instruction-level assembly simulation state.
- `src/features/kmap/KMapPage.tsx` - K-map visualizer UI.
- `src/core/mips/assembly/` - MIPS parsers and assemblers.
- `src/core/mips/execution/` - instruction-level MIPS execution logic.
- `src/core/mips/instruction/` - instruction metadata, register names, encoders, and examples.
- `src/core/mips/single-cycle/` - datapath control, execution, diagram paths, highlights, inspector logic, and machine state.
- `src/core/kmap/` - K-map model, solver, practice generator, and manual group analysis.

## Design Decisions

- **Separate learning surfaces:** Datapath, Assembly, and K-map each have a focused workflow instead of forcing every topic into one screen.
- **Datapath vs Assembly scope:** The standalone Assembly tab supports the broader implemented 17-instruction set. Datapath Assembly mode supports only instructions represented in the single-cycle datapath visualizer.
- **Explicit control signals:** Datapath behavior is driven by modeled control signals so users can see how signal changes affect execution.
- **Inspectable components:** Datapath components expose their current values through a contextual inspector.
- **Logical paths separated from SVG drawing:** Simulator path IDs are mapped onto SVG segments, making highlight behavior independent from the drawing itself.
- **Consistent UI shell:** The app uses compact bordered panels, status metrics, and dense tool layouts so the visualizers feel like study tools rather than landing pages.

## Testing Strategy

Automated tests focus on core logic and data transformations.

Current coverage includes:

- K-map model behavior, solver output, practice generation, and manual group analysis.
- MIPS instruction parsing and encoding.
- Branch and jump label resolution.
- Instruction-level execution for arithmetic, memory, branch, jump, and `$zero` behavior.
- Single-cycle datapath step behavior for IF, ID, EX, MEM, and WB.
- Datapath warnings for invalid or undefined control-signal cases.
- Datapath path/highlight selection for ALU input, memory, write-back, and branch paths.
- Datapath inspector output.

Run all tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Manual testing is still important for browser behavior such as SVG highlighting, panel layout, inspector interactions, register edits, memory edits, and full visual workflows.

## Future Work

- Broader staged datapath support for assembly programs beyond the current datapath subset.
- Pipeline visualization for instruction flow across cycles.
- Cache behavior visualization.
- More tutorial examples and guided practice flows.
- Integration or end-to-end tests for key UI workflows.
- User testing with CS2100 students and tutors.

## Project Log

See the [Project Log](https://docs.google.com/spreadsheets/d/1A2_8V8NCeS0M-E4F1fd_surIe4hl_3G42rxcGUjya_Q/edit?gid=1842178055#gid=1842178055).
