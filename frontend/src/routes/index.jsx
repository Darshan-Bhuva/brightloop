import React from 'react'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

// Layouts & Guards
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/routes/ProtectedRoute'
import RoleRoute from '@/routes/RoleRoute'

// Public Auth Pages
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'
import Profile from '@/pages/auth/Profile'

// Admin / Staff Pages
import DashboardPage from '@/pages/dashboard/DashboardPage'
import UsersList from '@/pages/users/UsersList'
import CustomersList from '@/pages/customers/CustomersList'
import CustomerDetail from '@/pages/customers/CustomerDetail'
import ProductsList from '@/pages/catalog/ProductsList'
import ProductForm from '@/pages/catalog/ProductForm'
import PlansList from '@/pages/catalog/PlansList'
import PlanForm from '@/pages/catalog/PlanForm'
import DiscountsList from '@/pages/catalog/DiscountsList'
import DiscountForm from '@/pages/catalog/DiscountForm'
import TaxesPage from '@/pages/settings/TaxesPage'
import PaymentTermsPage from '@/pages/settings/PaymentTermsPage'
import QuotationTemplatesList from '@/pages/quotations/QuotationTemplatesList'
import SubscriptionsList from '@/pages/subscriptions/SubscriptionsList'
import SubscriptionForm from '@/pages/subscriptions/SubscriptionForm'
import SubscriptionDetail from '@/pages/subscriptions/SubscriptionDetail'
import BillingPage from '@/pages/billing/BillingPage'
import InvoicesList from '@/pages/invoices/InvoicesList'
import InvoiceDetail from '@/pages/invoices/InvoiceDetail'
import InvoicePrint from '@/pages/invoices/InvoicePrint'
import PaymentsList from '@/pages/payments/PaymentsList'

// Customer Portal Pages
import PortalHome from '@/pages/portal/PortalHome'
import PortalSubscriptions from '@/pages/portal/PortalSubscriptions'
import PortalSubscriptionDetail from '@/pages/portal/PortalSubscriptionDetail'
import PortalInvoices from '@/pages/portal/PortalInvoices'
import PortalInvoiceDetail from '@/pages/portal/PortalInvoiceDetail'
import PortalPayments from '@/pages/portal/PortalPayments'

// Fallback & Errors
import NotFound from '@/pages/common/NotFound'

function IndexRedirect() {
  const { isAuthenticated, role, isLoading } = useAuth()
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role === 'customer') return <Navigate to="/portal" replace />
  return <Navigate to="/dashboard" replace />
}

export const router = createBrowserRouter([
  // Public Routes
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },

  // Standalone Print Route (authenticated)
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/invoices/:id/print', element: <InvoicePrint /> },
    ],
  },

  // Protected App Shell Routes
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // Root Redirect
          { path: '/', element: <IndexRedirect /> },

          // Shared profile route
          { path: '/profile', element: <Profile /> },

          // Admin Only Routes
          {
            element: <RoleRoute allowedRoles={['admin']} />,
            children: [
              { path: '/users', element: <UsersList /> },
              { path: '/products/new', element: <ProductForm /> },
              { path: '/products/:id/edit', element: <ProductForm /> },
              { path: '/plans/new', element: <PlanForm /> },
              { path: '/plans/:id/edit', element: <PlanForm /> },
              { path: '/discounts/new', element: <DiscountForm /> },
              { path: '/discounts/:id/edit', element: <DiscountForm /> },
            ],
          },

          // Admin & Staff Routes
          {
            element: <RoleRoute allowedRoles={['admin', 'staff']} />,
            children: [
              { path: '/dashboard', element: <DashboardPage /> },
              { path: '/customers', element: <CustomersList /> },
              { path: '/customers/:id', element: <CustomerDetail /> },
              { path: '/products', element: <ProductsList /> },
              { path: '/plans', element: <PlansList /> },
              { path: '/discounts', element: <DiscountsList /> },
              { path: '/settings/taxes', element: <TaxesPage /> },
              { path: '/settings/payment-terms', element: <PaymentTermsPage /> },
              { path: '/quotation-templates', element: <QuotationTemplatesList /> },
              { path: '/subscriptions', element: <SubscriptionsList /> },
              { path: '/subscriptions/new', element: <SubscriptionForm /> },
              { path: '/subscriptions/:id/edit', element: <SubscriptionForm /> },
              { path: '/subscriptions/:id', element: <SubscriptionDetail /> },
              { path: '/billing', element: <BillingPage /> },
              { path: '/invoices', element: <InvoicesList /> },
              { path: '/invoices/:id', element: <InvoiceDetail /> },
              { path: '/payments', element: <PaymentsList /> },
            ],
          },

          // Customer Portal Routes
          {
            element: <RoleRoute allowedRoles={['customer']} />,
            children: [
              { path: '/portal', element: <PortalHome /> },
              { path: '/portal/subscriptions', element: <PortalSubscriptions /> },
              { path: '/portal/subscriptions/:id', element: <PortalSubscriptionDetail /> },
              { path: '/portal/invoices', element: <PortalInvoices /> },
              { path: '/portal/invoices/:id', element: <PortalInvoiceDetail /> },
              { path: '/portal/payments', element: <PortalPayments /> },
            ],
          },

          // 404 inside layout
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
])

export default function AppRouter() {
  return <RouterProvider router={router} />
}

