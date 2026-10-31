import { z } from 'zod'

export const passwordValidation = z
  .string()
  .min(9, 'Password must be at least 9 characters long')
  .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least 1 special character')

export function checkPasswordCriteria(password = '') {
  return {
    minLength: password.length >= 9,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  }
}

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z
  .object({
    name: z.string().min(1, 'Full name is required').max(255),
    email: z.string().email('Please enter a valid email address').max(255),
    password: passwordValidation,
    password_confirmation: z.string().min(1, 'Please confirm your password'),
    phone: z.string().max(30).optional().or(z.literal('')),
    company_name: z.string().max(255).optional().or(z.literal('')),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').min(1, 'Email is required'),
})

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    email: z.string().email('Please enter a valid email address'),
    password: passwordValidation,
    password_confirmation: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  phone: z.string().max(30).optional().nullable().or(z.literal('')),
  company_name: z.string().max(255).optional().nullable().or(z.literal('')),
  address_line: z.string().max(255).optional().nullable().or(z.literal('')),
  city: z.string().max(100).optional().nullable().or(z.literal('')),
  state: z.string().max(100).optional().nullable().or(z.literal('')),
  country: z.string().max(100).optional().nullable().or(z.literal('')),
  postal_code: z.string().max(20).optional().nullable().or(z.literal('')),
})

export const createStaffSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    email: z.string().email('Please enter a valid email address').max(255),
    role: z.literal('staff'),
    password: passwordValidation,
    password_confirmation: z.string().min(1, 'Please confirm password'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Passwords do not match',
    path: ['password_confirmation'],
  })

export const updateUserSchema = z.object({
  name: z.string().max(255).optional(),
  is_active: z.boolean().optional(),
  password: z
    .string()
    .optional()
    .refine(
      (val) => !val || (val.length >= 9 && /[A-Z]/.test(val) && /[a-z]/.test(val) && /[^A-Za-z0-9]/.test(val)),
      {
        message: 'Password must be 9+ chars, with uppercase, lowercase, and a symbol',
      }
    ),
})

export const customerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Please enter a valid email address').max(255),
  phone: z.string().max(30).optional().nullable().or(z.literal('')),
  company_name: z.string().max(255).optional().nullable().or(z.literal('')),
  address_line: z.string().max(255).optional().nullable().or(z.literal('')),
  city: z.string().max(100).optional().nullable().or(z.literal('')),
  state: z.string().max(100).optional().nullable().or(z.literal('')),
  country: z.string().max(100).optional().nullable().or(z.literal('')),
  postal_code: z.string().max(20).optional().nullable().or(z.literal('')),
})


// -------------------------------------------------------------
// Module M4: Quotation Templates & Subscriptions Validation
// -------------------------------------------------------------

export const quotationTemplateLineSchema = z.object({
  product_id: z.coerce.number().min(1, 'Product is required'),
  variant_id: z.coerce.number().optional().nullable().or(z.literal('')),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
})

export const quotationTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(255),
  validity_days: z.coerce.number().min(1, 'Validity must be at least 1 day').max(365, 'Validity cannot exceed 365 days'),
  plan_id: z.coerce.number().min(1, 'Plan is required'),
  notes: z.string().optional().nullable().or(z.literal('')),
  lines: z.array(quotationTemplateLineSchema).min(1, 'At least one product line is required'),
})

export const subscriptionLineSchema = z.object({
  product_id: z.coerce.number().min(1, 'Product is required'),
  variant_id: z.coerce.number().optional().nullable().or(z.literal('')),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
})

export const subscriptionSchema = z
  .object({
    customer_id: z.coerce.number().min(1, 'Customer is required'),
    plan_id: z.coerce.number().optional().nullable().or(z.literal('')),
    quotation_template_id: z.coerce.number().optional().nullable().or(z.literal('')),
    payment_term_id: z.coerce.number().min(1, 'Payment term is required'),
    start_date: z.string().min(1, 'Start date is required'),
    expiry_date: z.string().min(1, 'Expiry date is required'),
    notes: z.string().optional().nullable().or(z.literal('')),
    lines: z.array(subscriptionLineSchema).optional(),
  })
  .refine(
    (data) => {
      // plan_id is required unless quotation_template_id is provided
      if (!data.quotation_template_id && (!data.plan_id || Number(data.plan_id) <= 0)) {
        return false
      }
      return true
    },
    {
      message: 'Plan is required when no quotation template is selected',
      path: ['plan_id'],
    }
  )
  .refine(
    (data) => {
      if (data.start_date && data.expiry_date) {
        return data.expiry_date > data.start_date
      }
      return true
    },
    {
      message: 'Expiry date must be after start date',
      path: ['expiry_date'],
    }
  )

export const subscriptionCloseSchema = z.object({
  reason: z.string().max(255, 'Reason cannot exceed 255 characters').optional().or(z.literal('')),
})

export const subscriptionRenewSchema = z.object({
  new_expiry_date: z.string().min(1, 'New expiry date is required'),
})

export const subscriptionDiscountSchema = z.object({
  discount_id: z.coerce.number().min(1, 'Discount is required'),
})
