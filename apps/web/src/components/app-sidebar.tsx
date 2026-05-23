/* oxlint-disable react-perf/jsx-no-jsx-as-prop */
'use client'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@a/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@a/ui/sidebar'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { NavSection } from '@/lib/nav'
import { NAV } from '@/lib/nav'
import ThemeToggle from './theme-toggle'

const onSection = (pathname: string, href: string): boolean =>
  href === '/' ? pathname === '/' : pathname.startsWith(href)
const Section = ({ section, pathname }: { pathname: string; section: NavSection }): React.JSX.Element => {
  const [open, setOpen] = useState(() => onSection(pathname, section.href))
  useEffect(() => {
    // eslint-disable-next-line @eslint-react/hooks-extra/no-direct-set-state-in-use-effect
    if (onSection(pathname, section.href)) setOpen(true)
  }, [pathname, section.href])
  if (section.items === undefined)
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={onSection(pathname, section.href)}
          render={<Link href={section.href} />}
          tooltip={section.title}>
          <section.icon />
          <span>{section.title}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  return (
    <Collapsible className='group/collapsible' onOpenChange={setOpen} open={open} render={<SidebarMenuItem />}>
      <CollapsibleTrigger
        render={<SidebarMenuButton isActive={onSection(pathname, section.href)} tooltip={section.title} />}>
        <section.icon />
        <span>{section.title}</span>
        <ChevronRight className='ml-auto transition-transform group-data-[open]/collapsible:rotate-90' />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {section.items.map(item => (
            <SidebarMenuSubItem key={item.href}>
              <SidebarMenuSubButton isActive={pathname === item.href} render={<Link href={item.href} />}>
                <span>{item.title}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}
const AppSidebar = (): React.JSX.Element => {
  const pathname = usePathname()
  return (
    <Sidebar collapsible='icon'>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.filter(section => section.href !== '/').map(section => (
                <Section key={section.href} pathname={pathname} section={section} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
export default AppSidebar
