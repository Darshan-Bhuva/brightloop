import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, LogOut, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Logo from '@/components/common/Logo'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Topbar({ onMobileMenuClick }) {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout(true)
    navigate('/login')
  }

  const getRoleBadge = (r) => {
    switch (r) {
      case 'admin':
        return <Badge variant="destructive">{r}</Badge>
      case 'staff':
        return <Badge variant="default">{r}</Badge>
      case 'customer':
        return <Badge variant="secondary">{r}</Badge>
      default:
        return <Badge variant="outline">{r || 'guest'}</Badge>
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-white px-4 sm:px-8 dark:bg-card">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <Button
          variant="outline"
          size="icon"
          className="md:hidden h-9 w-9"
          onClick={onMobileMenuClick}
        >
          <Menu className="h-4 w-4" />
          <span className="sr-only">Toggle Menu</span>
        </Button>

        {/* Brand logo on mobile */}
        <div className="md:hidden">
          <Logo size="sm" showWordmark={true} subtitle="" />
        </div>
      </div>

      {/* Right side items: User details & profile dropdown */}
      <div className="flex items-center gap-4">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-3 rounded-sm border border-border px-3 py-1.5 hover:bg-muted transition-colors focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-black text-white dark:bg-white dark:text-black font-mono font-bold text-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden text-left sm:block">
                  <div className="font-sans text-xs font-semibold leading-tight text-foreground">
                    {user.name}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {user.email}
                  </div>
                </div>
                <div className="hidden sm:block ml-1">
                  {getRoleBadge(role)}
                </div>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-56 rounded-sm border-border shadow-none" align="end" forceMount>
              <DropdownMenuLabel className="font-normal p-3">
                <div className="flex flex-col space-y-1.5">
                  <p className="font-sans text-sm font-semibold text-foreground leading-none">{user.name}</p>
                  <p className="font-mono text-xs text-muted-foreground leading-none">
                    {user.email}
                  </p>
                  <div className="pt-1.5">
                    {getRoleBadge(role)}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center cursor-pointer font-sans text-sm p-2.5">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive font-mono text-xs font-semibold p-2.5"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>SIGN OUT</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link to="/login">SIGN IN</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/register">REGISTER</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
