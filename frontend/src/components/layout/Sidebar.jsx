import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Repeat,
  FileText,
  CalendarClock,
  FileSpreadsheet,
  CreditCard,
  Package,
  Layers,
  Percent,
  Receipt,
  Clock,
  ShieldCheck,
  Home,
  User,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Badge } from '@/components/ui/badge'
import Logo from '@/components/common/Logo'
import { cn } from '@/lib/utils'

export default function Sidebar({ className, onNavClick }) {
  const { role } = useAuth()
  const location = useLocation()

  // State for collapsible sub-menus
  const [catalogOpen, setCatalogOpen] = useState(() => {
    return ['/products', '/plans', '/discounts'].some((path) =>
      location.pathname.startsWith(path)
    )
  })

  const [settingsOpen, setSettingsOpen] = useState(() => {
    return ['/settings'].some((path) => location.pathname.startsWith(path))
  })

  const navItemClass = ({ isActive }) =>
    cn(
      'flex items-center gap-3 rounded-sm px-3.5 py-2.5 text-sm font-sans font-medium transition-colors border',
      isActive
        ? 'bg-black text-white border-black font-semibold dark:bg-white dark:text-black dark:border-white'
        : 'border-transparent text-foreground hover:bg-muted hover:text-foreground'
    )

  const subNavItemClass = ({ isActive }) =>
    cn(
      'flex items-center gap-2.5 rounded-sm px-3 py-1.5 font-mono text-xs transition-colors border',
      isActive
        ? 'bg-black text-white border-black font-semibold dark:bg-white dark:text-black dark:border-white'
        : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'
    )

  return (
    <aside
      className={cn(
        'flex h-full w-64 flex-col border-r border-border bg-card text-card-foreground',
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo size="default" subtitle="Subscription Suite" />
      </div>

      {/* Navigation items */}
      <nav className="flex-1 space-y-3 overflow-y-auto p-4">
        {role === 'customer' ? (
          // Customer Menu
          <div className="space-y-1">
            <div className="px-3 pb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Customer Portal
            </div>

            <NavLink to="/portal" end className={navItemClass} onClick={onNavClick}>
              <Home className="h-4 w-4" />
              <span>Home</span>
            </NavLink>

            <NavLink to="/portal/subscriptions" className={navItemClass} onClick={onNavClick}>
              <Repeat className="h-4 w-4" />
              <span>My Subscriptions</span>
            </NavLink>

            <NavLink to="/portal/invoices" className={navItemClass} onClick={onNavClick}>
              <Receipt className="h-4 w-4" />
              <span>My Invoices</span>
            </NavLink>

            <NavLink to="/portal/payments" className={navItemClass} onClick={onNavClick}>
              <CreditCard className="h-4 w-4" />
              <span>My Payments</span>
            </NavLink>

            <NavLink to="/profile" className={navItemClass} onClick={onNavClick}>
              <User className="h-4 w-4" />
              <span>Profile</span>
            </NavLink>
          </div>
        ) : (
          // Admin / Staff Menu
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="px-3 pb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Operations
              </div>

              <NavLink to="/dashboard" className={navItemClass} onClick={onNavClick}>
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink to="/customers" className={navItemClass} onClick={onNavClick}>
                <Users className="h-4 w-4" />
                <span>Customers</span>
              </NavLink>

              <NavLink to="/subscriptions" className={navItemClass} onClick={onNavClick}>
                <Repeat className="h-4 w-4" />
                <span>Subscriptions</span>
              </NavLink>

              <NavLink to="/quotation-templates" className={navItemClass} onClick={onNavClick}>
                <FileText className="h-4 w-4" />
                <span>Quotation Templates</span>
              </NavLink>
            </div>

            <div className="space-y-1 pt-1">
              <div className="px-3 pb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Finance
              </div>

              <NavLink to="/billing" className={navItemClass} onClick={onNavClick}>
                <CalendarClock className="h-4 w-4" />
                <span>Billing Run</span>
              </NavLink>

              <NavLink to="/invoices" className={navItemClass} onClick={onNavClick}>
                <FileSpreadsheet className="h-4 w-4" />
                <span>Invoices</span>
              </NavLink>

              <NavLink to="/payments" className={navItemClass} onClick={onNavClick}>
                <CreditCard className="h-4 w-4" />
                <span>Payments</span>
              </NavLink>
            </div>

            <div className="space-y-1 pt-1">
              <div className="px-3 pb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Catalog & Config
              </div>

              {/* Catalog Group */}
              <div>
                <button
                  type="button"
                  onClick={() => setCatalogOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-sm px-3.5 py-2 text-sm font-sans font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4" />
                    <span>Catalog</span>
                  </div>
                  {catalogOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                  )}
                </button>

                {catalogOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2.5">
                    <NavLink to="/products" className={subNavItemClass} onClick={onNavClick}>
                      <Package className="h-3.5 w-3.5" />
                      <span>Products</span>
                    </NavLink>
                    <NavLink to="/plans" className={subNavItemClass} onClick={onNavClick}>
                      <Layers className="h-3.5 w-3.5" />
                      <span>Plans</span>
                    </NavLink>
                    <NavLink to="/discounts" className={subNavItemClass} onClick={onNavClick}>
                      <Percent className="h-3.5 w-3.5" />
                      <span>Discounts</span>
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Settings Group */}
              <div>
                <button
                  type="button"
                  onClick={() => setSettingsOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-sm px-3.5 py-2 text-sm font-sans font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <Receipt className="h-4 w-4" />
                    <span>Settings</span>
                  </div>
                  {settingsOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 opacity-70" />
                  )}
                </button>

                {settingsOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l border-border pl-2.5">
                    <NavLink to="/settings/taxes" className={subNavItemClass} onClick={onNavClick}>
                      <Receipt className="h-3.5 w-3.5" />
                      <span>Taxes</span>
                    </NavLink>
                    <NavLink
                      to="/settings/payment-terms"
                      className={subNavItemClass}
                      onClick={onNavClick}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span>Payment Terms</span>
                    </NavLink>
                  </div>
                )}
              </div>

              {/* Users (admin only) */}
              {role === 'admin' && (
                <div className="pt-2">
                  <NavLink to="/users" className={navItemClass} onClick={onNavClick}>
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span className="flex-1">Users</span>
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">
                      ADMIN
                    </Badge>
                  </NavLink>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-border p-4">
        <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
          <span>ROLE</span>
          <Badge variant={role === 'admin' ? 'destructive' : 'default'} className="text-[10px]">
            {role || 'GUEST'}
          </Badge>
        </div>
      </div>
    </aside>
  )
}
