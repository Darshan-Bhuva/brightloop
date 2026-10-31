import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Search,
  Plus,
  MoreVertical,
  Edit2,
  RefreshCw,
  Power,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getUsers, createStaff, updateUser } from '@/api/users'
import { createStaffSchema, updateUserSchema } from '@/lib/validation'
import { handleApiError } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import PasswordChecklist from '@/components/common/PasswordChecklist'

export default function UsersList() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 15 })
  const [isLoading, setIsLoading] = useState(true)

  // Filters & Sorting state
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(1)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState(null)

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = {
        page,
        per_page: 15,
        sort: sortField,
        direction: sortDir,
      }
      if (search.trim()) params.search = search.trim()
      if (roleFilter !== 'all') params.role = roleFilter
      if (activeFilter !== 'all') params.is_active = activeFilter === 'true'

      const response = await getUsers(params)
      setUsers(response.data || [])
      if (response.meta) {
        setMeta(response.meta)
      }
    } catch (err) {
      handleApiError(err)
    } finally {
      setIsLoading(false)
    }
  }, [page, search, roleFilter, activeFilter, sortField, sortDir])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Create Staff Form
  const {
    register: registerStaff,
    handleSubmit: handleStaffSubmit,
    watch: watchStaff,
    reset: resetStaff,
    setError: setStaffError,
    formState: { errors: staffErrors, isSubmitting: isStaffSubmitting },
  } = useForm({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'staff',
      password: '',
      password_confirmation: '',
    },
    mode: 'onChange',
  })

  const staffPassword = watchStaff('password', '')

  const onStaffSubmit = async (data) => {
    try {
      await createStaff({
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        role: 'staff',
        password: data.password,
        password_confirmation: data.password_confirmation,
      })
      toast.success(`Staff user "${data.name}" created successfully.`)
      setCreateDialogOpen(false)
      resetStaff()
      fetchUsers()
    } catch (err) {
      handleApiError(err, setStaffError)
    }
  }

  // Edit User Form
  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    setValue: setEditValue,
    setError: setEditError,
    formState: { errors: editErrors, isSubmitting: isEditSubmitting },
  } = useForm({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      name: '',
      is_active: true,
      password: '',
    },
  })

  const openEditDialog = (u) => {
    setUserToEdit(u)
    setEditValue('name', u.name)
    setEditValue('is_active', u.is_active)
    setEditValue('password', '')
    setEditDialogOpen(true)
  }

  const onEditSubmit = async (data) => {
    if (!userToEdit) return
    try {
      const payload = {}
      if (data.name?.trim()) payload.name = data.name.trim()
      if (data.is_active !== undefined) payload.is_active = data.is_active
      if (data.password?.trim()) payload.password = data.password.trim()

      await updateUser(userToEdit.id, payload)
      toast.success(`User "${userToEdit.name}" updated successfully.`)
      setEditDialogOpen(false)
      setUserToEdit(null)
      fetchUsers()
    } catch (err) {
      handleApiError(err, setEditError)
    }
  }

  // Toggle active status
  const handleToggleActive = async (u) => {
    try {
      await updateUser(u.id, { is_active: !u.is_active })
      toast.success(
        u.is_active
          ? `User "${u.name}" has been deactivated.`
          : `User "${u.name}" has been activated.`
      )
      fetchUsers()
    } catch (err) {
      handleApiError(err)
    }
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">ADMIN</Badge>
      case 'staff':
        return <Badge variant="default">STAFF</Badge>
      case 'customer':
        return <Badge variant="secondary">CUSTOMER</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between border-b border-border pb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="outline" className="text-[10px]">
              USR-01..04
            </Badge>
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Security & Access Control
            </span>
          </div>
          <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground uppercase">
            User Management
          </h1>
          <p className="font-sans text-sm text-muted-foreground mt-1">
            Maintain system accounts, staff provisioning, and role credentials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={() => {
              resetStaff()
              setCreateDialogOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            ADD STAFF
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border-border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9 h-10 text-xs"
            />
          </div>

          {/* Role Filter */}
          <Select
            value={roleFilter}
            onValueChange={(val) => {
              setRoleFilter(val)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-10 text-xs font-mono">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL ROLES</SelectItem>
              <SelectItem value="admin">ADMIN</SelectItem>
              <SelectItem value="staff">STAFF</SelectItem>
              <SelectItem value="customer">CUSTOMER</SelectItem>
            </SelectContent>
          </Select>

          {/* Active Status Filter */}
          <Select
            value={activeFilter}
            onValueChange={(val) => {
              setActiveFilter(val)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-10 text-xs font-mono">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ALL STATUSES</SelectItem>
              <SelectItem value="true">ACTIVE ONLY</SelectItem>
              <SelectItem value="false">DEACTIVATED ONLY</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort By */}
          <Select
            value={`${sortField}-${sortDir}`}
            onValueChange={(val) => {
              const [field, dir] = val.split('-')
              setSortField(field)
              setSortDir(dir)
              setPage(1)
            }}
          >
            <SelectTrigger className="h-10 text-xs font-mono">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at-desc">NEWEST FIRST</SelectItem>
              <SelectItem value="created_at-asc">OLDEST FIRST</SelectItem>
              <SelectItem value="name-asc">NAME (A-Z)</SelectItem>
              <SelectItem value="name-desc">NAME (Z-A)</SelectItem>
              <SelectItem value="email-asc">EMAIL (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="border-border p-2">
        <CardHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="font-sans text-lg font-bold uppercase tracking-tight">
                System Users
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                {meta.total} USERS
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUsers}
              className="h-8 text-xs font-mono"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              REFRESH
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-2">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  User
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Role
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Created
                </TableHead>
                <TableHead className="text-right font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-sm font-mono text-muted-foreground">
                    LOADING USERS...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-sm font-mono text-muted-foreground">
                    NO USERS FOUND MATCHING CRITERIA
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const isSelf = currentUser?.id === u.id
                  return (
                    <TableRow key={u.id} className="border-b border-border/60 hover:bg-muted/50">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-sans font-semibold text-sm text-foreground flex items-center gap-2">
                            {u.name}
                            {isSelf && (
                              <span className="font-mono text-[10px] text-primary border border-primary/30 px-1 py-0 rounded-none uppercase">
                                YOU
                              </span>
                            )}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {u.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell>
                        {u.is_active ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs text-foreground font-medium">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            ACTIVE
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                            <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                            DEACTIVATED
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-sm shadow-none">
                            <DropdownMenuItem
                              onClick={() => openEditDialog(u)}
                              className="cursor-pointer font-sans text-xs"
                            >
                              <Edit2 className="mr-2 h-3.5 w-3.5" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(u)}
                              disabled={isSelf}
                              className={`cursor-pointer font-sans text-xs ${
                                u.is_active
                                  ? 'text-destructive focus:text-destructive'
                                  : 'text-foreground'
                              }`}
                            >
                              <Power className="mr-2 h-3.5 w-3.5" />
                              {u.is_active ? 'Deactivate Account' : 'Activate Account'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {meta.total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground mt-4 gap-3">
              <div className="font-mono text-[11px]">
                PAGE <span className="text-foreground font-semibold">{meta.current_page}</span> OF{' '}
                <span className="text-foreground font-semibold">{meta.last_page}</span> ({meta.total} TOTAL)
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-8 text-xs font-mono"
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  PREV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.last_page}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 text-xs font-mono"
                >
                  NEXT
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Staff Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md rounded-sm border-border">
          <DialogHeader>
            <DialogTitle className="font-sans text-lg font-bold uppercase tracking-tight">
              Provision Staff Account
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Create an administrative staff user with access to customer orders and billing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleStaffSubmit(onStaffSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="staff_name" className="font-mono text-xs uppercase tracking-wide">
                Staff Name <span className="text-primary">*</span>
              </Label>
              <Input
                id="staff_name"
                placeholder="Jane Smith"
                {...registerStaff('name')}
              />
              {staffErrors.name && (
                <p className="font-mono text-xs text-destructive mt-1">
                  {staffErrors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staff_email" className="font-mono text-xs uppercase tracking-wide">
                Email Address <span className="text-primary">*</span>
              </Label>
              <Input
                id="staff_email"
                type="email"
                placeholder="staff@brightloop.test"
                {...registerStaff('email')}
              />
              {staffErrors.email && (
                <p className="font-mono text-xs text-destructive mt-1">
                  {staffErrors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staff_password" className="font-mono text-xs uppercase tracking-wide">
                Initial Password <span className="text-primary">*</span>
              </Label>
              <Input
                id="staff_password"
                type="password"
                placeholder="•••••••••"
                {...registerStaff('password')}
              />
              {staffErrors.password && (
                <p className="font-mono text-xs text-destructive mt-1">
                  {staffErrors.password.message}
                </p>
              )}
            </div>

            <PasswordChecklist password={staffPassword} />

            <div className="space-y-1.5">
              <Label htmlFor="staff_password_confirmation" className="font-mono text-xs uppercase tracking-wide">
                Confirm Password <span className="text-primary">*</span>
              </Label>
              <Input
                id="staff_password_confirmation"
                type="password"
                placeholder="•••••••••"
                {...registerStaff('password_confirmation')}
              />
              {staffErrors.password_confirmation && (
                <p className="font-mono text-xs text-destructive mt-1">
                  {staffErrors.password_confirmation.message}
                </p>
              )}
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateDialogOpen(false)}
              >
                CANCEL
              </Button>
              <Button type="submit" size="sm" disabled={isStaffSubmitting}>
                {isStaffSubmitting ? 'CREATING...' : 'CREATE STAFF'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md rounded-sm border-border">
          <DialogHeader>
            <DialogTitle className="font-sans text-lg font-bold uppercase tracking-tight">
              Edit User Account
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update user details or reassign active account status.
            </DialogDescription>
          </DialogHeader>

          {userToEdit && (
            <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit_email" className="font-mono text-xs uppercase tracking-wide">
                  Email Address
                </Label>
                <Input
                  id="edit_email"
                  value={userToEdit.email}
                  disabled
                  className="bg-muted font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_name" className="font-mono text-xs uppercase tracking-wide">
                  Full Name
                </Label>
                <Input id="edit_name" {...registerEdit('name')} />
                {editErrors.name && (
                  <p className="font-mono text-xs text-destructive mt-1">
                    {editErrors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_password" className="font-mono text-xs uppercase tracking-wide">
                  Reset Password (optional)
                </Label>
                <Input
                  id="edit_password"
                  type="password"
                  placeholder="Leave empty to keep current password"
                  {...registerEdit('password')}
                />
                {editErrors.password && (
                  <p className="font-mono text-xs text-destructive mt-1">
                    {editErrors.password.message}
                  </p>
                )}
              </div>

              <DialogFooter className="pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditDialogOpen(false)}
                >
                  CANCEL
                </Button>
                <Button type="submit" size="sm" disabled={isEditSubmitting}>
                  {isEditSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
