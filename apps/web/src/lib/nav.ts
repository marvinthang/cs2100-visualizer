import type { LucideIcon } from 'lucide-react'
import { Cpu, House } from 'lucide-react'
const MIPS_NAMES = [
  'add',
  'addi',
  'and',
  'andi',
  'beq',
  'bne',
  'j',
  'lui',
  'lw',
  'nor',
  'or',
  'ori',
  'sll',
  'slt',
  'srl',
  'sub',
  'sw'
] as const
const DATAPATH_INSTRUCTIONS = ['add', 'addi', 'and', 'beq', 'bne', 'lw', 'or', 'slt', 'sub', 'sw'] as const
interface NavItem {
  href: string
  title: string
}
interface NavSection {
  href: string
  icon: LucideIcon
  items?: NavItem[]
  title: string
}
const NAV: NavSection[] = [
  { href: '/', icon: House, title: 'Home' },
  { href: '/mips', icon: Cpu, title: 'MIPS datapath' },
]
export { DATAPATH_INSTRUCTIONS, MIPS_NAMES, NAV }
export type { NavItem, NavSection }
