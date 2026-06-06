# CS2100 Visualizer

## Demo Link

The app is deployed here:

[CS2100 Visualizer Demo](https://cs2100-visualizer.vercel.app/)

## 1. Project Overview

CS2100 Visualizer is an interactive web app for learning CS2100 concepts through visualization. The project focuses on making abstract computer organization topics more concrete, especially MIPS datapath execution, assembly behavior, control signals, registers, memory, and future topics such as pipeline and K-map visualization.

The project currently contains two main modules:

1. **MIPS Datapath Visualizer**
   An interactive single-cycle datapath tool where users can select supported datapath instructions, step through IF/ID/EX/MEM/WB stages, inspect control signals, observe active datapath paths, and view datapath values, registers, memory, logs, and warnings.

2. **MIPS Assembly Simulator**
   A separate assembly simulation module where users can write a small MIPS program using the currently supported instruction set, assemble it into 32-bit hex machine code, and execute it one instruction at a time while observing PC, register, and memory updates.

The project is built as a React + TypeScript + Vite application with Tailwind CSS and SVG-based datapath rendering.

## 2. Motivation

CS2100 concepts can be difficult to learn because many important ideas are abstract. Control signals, datapath routing, instruction fields, register updates, memory access, and stage-by-stage execution are usually shown as static diagrams.

A visual simulator makes these hidden state changes visible. By stepping through instructions and watching active datapath paths, control signals, logs, registers, and memory, students can connect MIPS instruction semantics to actual hardware behavior.

This project aims to help students move from memorizing datapath diagrams to understanding how instructions actually flow through hardware components.

## 3. Target Users

- CS2100 students learning MIPS, datapath design, and instruction execution.
- Students revising MIPS assembly and single-cycle datapath behavior.
- Tutors or teaching assistants who want a visual aid for explaining datapath flow.
- Students who prefer interactive exploration over static diagrams.

## 4. Level of Achievement

Target: Apollo 11.

For Milestone 1, the goal is to demonstrate a working technical proof of concept, especially for the core datapath visualizer. The current prototype already includes interactive datapath visualization, instruction stepping, editable control signals, register and memory simulation, component inspection, execution logs, warnings, and a separate assembly simulator.

To fully justify Apollo 11, the project still needs stronger software engineering practices, automated testing, user testing, clearer evaluation evidence, and UI polish in later milestones.

## 5. Core Features

### 5.1 MIPS Datapath Visualizer

The datapath page renders an SVG-based single-cycle MIPS datapath. Active datapath segments are highlighted as users step through instruction execution, making it easier to see which values move through the PC, instruction memory, register file, ALU, data memory, MUXes, and write-back paths.

Supported datapath instructions are:

`add`, `addi`, `and`, `beq`, `bne`, `lw`, `slt`, `or`, `sw`, `sub`

The datapath page also includes an Assembly mode that can load and step through assembly programs, but this mode is limited to the datapath-supported instruction subset above.

### 5.2 Step-by-step Datapath Execution

Users can step through datapath execution stages:

`IF`, `ID`, `EX`, `MEM`, `WB`

Each step updates the visible datapath paths, datapath values, logs, warnings, and machine-state tables where applicable.

This helps students understand what each stage contributes:

- `IF`: fetch instruction and compute PC + 4
- `ID`: decode instruction and read registers
- `EX`: compute ALU result and branch target
- `MEM`: access memory and update branch/PC decision
- `WB`: write result back to the register file

### 5.3 Editable Control Signals

The control-signal panel lets users inspect and edit runtime control signals. Users can override signals such as register write, memory read/write, ALU source, branch behavior, and related datapath controls, then compare the resulting active paths against the default signal behavior.

This allows students to observe how incorrect or undefined control signals affect datapath behavior.

### 5.4 Register and Memory Simulation

The simulator tracks the PC, register file, and data memory. In simulate mode, state-changing instructions update registers, memory, and PC state. Users can also edit register and memory values directly from the UI.

This makes the tool useful not only for seeing wires, but also for checking actual machine-state changes.

### 5.5 Component Inspector

Users can click datapath components to inspect current values and signal-related information. The inspector currently supports datapath elements such as:

- PC
- Instruction memory
- Instruction register
- ALU
- Register file
- Data memory
- MUXes

Each component inspector focuses on the values owned by that component, such as ALU inputs and result for the ALU, or read/write register information for the register file.

### 5.6 Execution Logs and Warnings

The datapath page includes an execution log panel. Logs describe what happens during the current stage, while warnings surface invalid or unexpected signal behavior, including undefined `X` signal behavior.

Examples of warning cases include:

- undefined control signals
- conflicting memory read/write signals
- missing write-back data
- invalid or unsupported ALU control behavior

### 5.7 MIPS Assembly Simulator

The assembly page is a separate module from the datapath visualizer. It lets users write supported MIPS assembly, assemble and load a program with labels, view each instruction's 32-bit hex machine code, and execute it one instruction at a time.

The assembly simulator supports the currently implemented 17-instruction set. It updates PC, registers, and memory after each instruction, and highlights related machine-state values: input registers/memory in blue and output registers/memory in green.

Supported assembly mnemonics are:

`add`, `addi`, `and`, `andi`, `beq`, `bne`, `j`, `lui`, `lw`, `nor`, `or`, `ori`, `slt`, `sll`, `srl`, `sw`, `sub`

## 6. Technical Proof of Concept

For Milestone 1, we reused our Liftoff poster and video as the high-level project pitch. The detailed technical proof of concept is documented here in the README.

Our current proof of concept demonstrates the core datapath visualizer workflow in the running app:

1. Users can select a supported MIPS instruction.
2. The app generates the corresponding default control signals.
3. Users can step through IF, ID, EX, MEM, and WB.
4. Active datapath wires are highlighted dynamically.
5. Register, memory, PC, datapath values, logs, and warnings update during execution.
6. Users can edit control signals and observe how changed signals affect datapath behavior.
7. Users can click datapath components such as PC, instruction memory, instruction register, ALU, register file, data memory, and MUXes to inspect current values.

This shows that the essential parts of the datapath visualizer are integrated:

`instruction representation -> control signal modeling -> staged datapath execution -> SVG visualization -> machine state updates -> logs, warnings, and inspection`

The proof of concept also includes a separate Assembly tab. That tab can parse the currently supported 17 MIPS instructions, resolve labels, show generated 32-bit hex machine code, execute one instruction at a time, and highlight related input/output registers or memory cells. This Assembly tab is tested separately from the staged datapath view because the datapath visualizer only supports its smaller datapath instruction subset.

### Manual Testing Instructions

To manually test the proof of concept:

1. Install dependencies and start the app.

```bash
npm install
npm run dev
```

2. Open the demo URL:

```txt
https://cs2100-visualizer.vercel.app/
```

3. Open the **Datapath** tab.
4. In **Instruction Setup**, select `add`.
5. Confirm that the control-signal table shows default values for the selected instruction.
6. Click **Next** repeatedly and verify that the step label changes through `IF`, `ID`, `EX`, `MEM`, and `WB`.
7. At each step, check that active datapath wires are highlighted and the **Datapath Values** table changes according to the current stage.
8. Check the **Registers** table during `ID`, `EX`, and `WB` to verify input/output highlighting and register write-back behavior.
9. Click datapath components such as the PC, instruction memory, register file, ALU, data memory, and MUXes. Confirm that the **Inspector** panel changes to the selected component.
10. Click **Previous** and **Reset** in the step controls to verify that the simulator can move backward and return to the initial step.
11. Click **Edit** in the **Control Signals** panel, change a signal such as `ALUSrc` or `RegWrite`, then step again and confirm that the highlighted paths, logs, warnings, or machine-state updates reflect the modified signal behavior.
12. Switch the datapath mode to **Simulate**, step through an instruction that writes state, and verify that PC/register/memory state updates are applied.
13. Switch the datapath mode to **Assembly**, load a small program using only datapath-supported instructions, and step through it to confirm that staged execution follows the loaded program.

Example datapath Assembly mode program:

```asm
addi $t0, $zero, 5
addi $t1, $zero, 3
add $t2, $t0, $t1
loop:
beq $t2, $zero, loop
```

14. Open the **Assembly** tab.
15. Use the default example or paste a program using the supported 17-instruction set.
16. Confirm that the assembled instruction list shows each source instruction with its generated hex machine code.
17. Click **Assemble & Load**, then click **Next Instruction** repeatedly.
18. Verify that the PC advances, registers and memory update, and related input/output cells are highlighted in the register and memory tables.
19. Test a branch or jump program with labels and confirm that the active instruction changes according to the resolved target.
20. Click **Reset** and verify that the loaded program returns to its initial machine state.

Example Assembly tab program:

```asm
lui $t0, 0x1
ori $t0, $t0, 0x234
addi $t1, $zero, 5
sll $t2, $t1, 2
sub $t3, $t2, $t1
```

Expected checks for this example:

- `lui`, `ori`, `addi`, `sll`, and `sub` assemble without errors.
- Each instruction displays a `0x........` machine-code word.
- Source registers are highlighted as inputs.
- Destination registers are highlighted as outputs.
- The register values change after each executed instruction.
- The program eventually reaches the finished state.

### Proof-of-Concept Demo

![Datapath step-by-step demo](docs/assets/datapath-demo.gif)

### Proof-of-Concept Screenshots

![Datapath overview](public/screenshots/datapath-1.png)

![Datapath stepping and control signals](public/screenshots/datapath-2.png)

## 7. Difference from Existing Tools

There are existing MIPS simulators and assembly learning tools, but our project focuses specifically on CS2100-style datapath understanding.

The main difference is that this project is not only an instruction-level simulator. It also exposes how control signals and datapath components interact during staged execution.

Key differentiators include:

- Stage-by-stage IF/ID/EX/MEM/WB datapath visualization.
- Dynamic wire highlighting based on instruction and control signals.
- Editable control signals for experimentation.
- Explicit `X` / undefined behavior when signals are invalid.
- Component inspector for PC, instruction memory, instruction register, ALU, register file, data memory, and MUXes.
- Execution logs and warnings that explain what happens during each stage.

The goal is to help students understand the hardware-level execution process, not just the final output of an assembly program.

## 8. System Architecture

The project is organized around two main feature modules:

1. **Datapath Visualizer**
2. **Assembly Simulator**

Both modules share core MIPS logic where appropriate, but they have separate UI flows.

### 8.1 Datapath Visualizer Flow

`UI -> useDatapathSimulator hook -> single-cycle simulator -> SVG/table/log output`

- UI components collect user actions such as instruction selection, mode changes, step controls, control-signal edits, register edits, memory edits, and component inspection.
- `useDatapathSimulator` coordinates UI state with simulator state, selected instruction, control signals, current step, warnings, logs, and highlighted datapath paths.
- Core single-cycle modules handle control-signal defaults, datapath execution, machine state, highlight calculation, inspector logic, and diagram path mapping.
- Outputs are rendered as the SVG datapath diagram, register table, memory table, datapath value table, inspector panel, control-signal table, execution logs, and warnings.

### 8.2 Assembly Simulator Flow

`Assembly source -> parser/assembler -> instruction-level simulator -> register/memory/output view`

- Users enter MIPS assembly in the assembly page.
- The assembler parses the supported 17-instruction set, resolves labels, and produces 32-bit machine-code words.
- The instruction-level simulator executes the program one instruction at a time.
- PC, registers, memory, generated hex code, and input/output highlights are updated after execution.

## 9. Code Structure

```txt
src/
  App.tsx
  core/
    mips/
      assembly/
      execution/
      instruction/
      single-cycle/
  features/
    assembly/
    datapath/
  components/
    layout/
    shared/
  types/
  utils/
public/
  screenshots/
```

Important files:

- `src/App.tsx` — switches between the Datapath and Assembly tabs.
- `src/features/datapath/DatapathPage.tsx` — main datapath visualizer page.
- `src/features/datapath/hooks/useDatapathSimulator.ts` — state and behavior for datapath stepping, control signals, datapath Assembly mode, and machine state.
- `src/features/datapath/components/DatapathDiagram.tsx` — SVG datapath rendering.
- `src/features/assembly/AssemblyPage.tsx` — standalone assembly simulator page.
- `src/features/assembly/useAssemblySimulator.ts` — instruction-level assembly simulation state.
- `src/core/mips/assembly/` — parsers and assemblers.
- `src/core/mips/execution/` — shared MIPS execution logic.
- `src/core/mips/instruction/` — instruction metadata, fields, and encoding.
- `src/core/mips/single-cycle/` — single-cycle datapath control, execution, diagram paths, highlights, and inspector logic.

## 10. Important Design Decisions

- **Separate datapath and assembly surfaces:** The datapath visualizer focuses on staged hardware visualization, while the Assembly tab focuses on instruction-level program execution.
- **Different instruction scopes:** The standalone Assembly tab supports all 17 currently implemented MIPS instructions, while the datapath visualizer supports only the instruction subset represented in the single-cycle datapath UI.
- **Signal-based datapath simulator:** Control signals are modeled explicitly and drive datapath behavior.
- **`X` signal behavior:** Undefined or invalid signal combinations can produce `X` values instead of being silently hidden.
- **Logical paths vs SVG paths:** SVG drawing paths are separated from logical datapath paths, so visual highlighting can change without rewriting simulator logic.
- **Explore vs Simulate modes:** Explore lets users experiment with signals without committing machine-state updates, while Simulate applies PC, register, and memory changes.
- **Component inspector:** Datapath components can be inspected independently so students can understand what each component owns and outputs.

## 11. Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- SVG
- ESLint
- Vitest
- Prettier dependency is present in `package.json`

## 12. Software Engineering Practices

Current practices:

- The repository includes configured scripts for development, production build, preview, and linting.
- ESLint configuration is present.
- Prettier is listed as a development dependency.
- Vitest is configured for automated core logic tests.
- Code is separated into core logic, feature modules, shared components, and type definitions.

Planned improvements:

- Add clearer GitHub workflow documentation.
- Use issues/milestones to track feature work.
- Add PR templates and issue templates.
- Add CI in later milestones.

## 13. Testing Strategy

The project uses Vitest for automated TypeScript tests.

Current automated tests focus on pure MIPS core logic rather than browser/UI behavior. The test suite covers:

- MIPS instruction parsing and encoding.
- Branch and jump label resolution.
- Instruction-level execution for arithmetic, memory, branch, and `$zero` behavior.
- Single-cycle datapath step behavior for IF, ID, EX, MEM, and WB.
- Datapath warning behavior for invalid or undefined control-signal cases.
- Datapath path/highlight selection for ALU input, memory, write-back, and branch paths.

Run the automated tests with:

```bash
npm test
```

Run tests in watch mode during development with:

```bash
npm run test:watch
```

Manual testing is still used for full datapath and assembly simulator workflows, including instruction stepping, hex encoding display, register updates, memory updates, inspector behavior, and SVG highlighting behavior.

Testing work that should be added later:

- Integration tests for React hooks and feature-level simulator workflows.
- UI or end-to-end tests for instruction stepping, assembly loading, register updates, memory updates, and warning display.
- User testing with CS2100 students or tutors to check whether the visualization improves understanding.

## 14. Setup Instructions

Install dependencies:

```bash
npm install
```

Run the development server:

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

Run linting:

```bash
npm run lint
```

Run automated tests:

```bash
npm test
```

Run automated tests in watch mode:

```bash
npm run test:watch
```

## 15. Development Plan

### Milestone 1 — Technical Proof of Concept

Milestone 1 focuses on proving that the core project idea is feasible.

Planned / current deliverables:

- Implement the SVG-based single-cycle datapath visualizer.
- Support instruction selection for the datapath-supported MIPS subset.
- Support IF/ID/EX/MEM/WB stepping.
- Show active datapath paths, datapath values, control signals, registers, memory, logs, and warnings.
- Add editable control signals and Explore/Simulate modes.
- Add component inspection for key datapath components.
- Add datapath Assembly mode for staged execution of datapath-supported assembly programs.
- Add a separate Assembly tab with parsing, label handling, hex machine-code output, and instruction-level execution for the supported 17-instruction set.
- Provide setup instructions, screenshots, poster, video, and project log.

### Milestone 2 — Core Reliability and K-map Visualizer

Milestone 2 focuses on improving correctness, strengthening the existing modules, and starting the next CS2100 topic module.

Planned work:

- Improve the MIPS assembly parser and supported instruction coverage.
- Connect assembly programs more tightly with datapath visualization where appropriate.
- Add automated tests for parser, instruction execution, control signals, and datapath behavior.
- Improve execution logs, warnings, and explanations.
- Improve UI polish and layout consistency.
- Start the Karnaugh-map visualizer module.
- Conduct early informal testing with CS2100 students or peers.

### Milestone 3 — Pipeline Visualization, Validation, and Polish

Milestone 3 focuses on validation, usability, and broader visualization support.

Planned work:

- Add pipeline visualization for instruction flow across cycles.
- Show pipeline stage state, hazards, stalls, forwarding, and control behavior where feasible.
- Complete or polish the Karnaugh-map visualizer.
- Improve responsive UI layout and accessibility.
- Add user testing with CS2100 students or tutors.
- Add integration or end-to-end tests for key workflows.
- Prepare final poster, video, and demo.

## 16. Future Work

- Additional MIPS instructions beyond the currently supported 17-instruction set.
- Broader staged datapath support for assembly programs beyond the current datapath subset.
- Pipeline visualization.
- Cache behavior visualization.
- Karnaugh-map tooling.
- More tutorial-style examples for common CS2100 concepts.

## 17. Project Log

See our [Project Log](https://docs.google.com/spreadsheets/d/1A2_8V8NCeS0M-E4F1fd_surIe4hl_3G42rxcGUjya_Q/edit?gid=1842178055#gid=1842178055).
