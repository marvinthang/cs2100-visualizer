'use client'
import type { ReactNode } from 'react'
import { SidebarInset, SidebarProvider } from '@a/ui/sidebar'
import AppSidebar from './app-sidebar'

const AppShell = ({ children }: { children: ReactNode }): React.JSX.Element => (
  <SidebarProvider defaultOpen={false}>
    <AppSidebar />
    <SidebarInset>{children}</SidebarInset>
  </SidebarProvider>
)
export default AppShell
