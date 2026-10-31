import { toast } from 'sonner'

/**
 * Handle API errors: maps 422 validation errors to react-hook-form `setError`,
 * and displays toast messages for 409, 403, and all validation/server errors.
 *
 * @param {Error} error Axios error object
 * @param {Function} [setError] react-hook-form setError function
 * @returns {void}
 */
export function handleApiError(error, setError) {
  const response = error?.response
  const status = response?.status
  const data = response?.data

  // Handle 422 Unprocessable Content (Laravel validation errors)
  if (status === 422 && data?.errors) {
    const errorMessages = []

    Object.entries(data.errors).forEach(([field, messages]) => {
      const messageList = Array.isArray(messages) ? messages : [messages]
      const firstMessage = messageList[0] || 'Invalid field'
      errorMessages.push(firstMessage)

      if (setError) {
        try {
          setError(field, {
            type: 'server',
            message: firstMessage,
          })
          // Also set root error for nested array fields like 'lines'
          if (field === 'lines') {
            setError('lines.root', {
              type: 'server',
              message: firstMessage,
            })
          }
        } catch {
          // Ignore react-hook-form internal field path errors
        }
      }
    })

    // ALWAYS show the specific validation error message on UI via toast
    if (errorMessages.length > 0) {
      const primaryMessage = errorMessages[0]
      const secondaryMessage = errorMessages.length > 1 ? errorMessages.slice(1).join('\n') : undefined
      toast.error(primaryMessage, {
        description: secondaryMessage,
        duration: 5000,
      })
    } else {
      toast.error(data.message || 'The given data was invalid.', { duration: 5000 })
    }
    return
  }

  // Handle 409 Conflict
  if (status === 409) {
    toast.error(data?.message || 'Conflict: Action cannot be performed in the current state.')
    return
  }

  // Handle 403 Forbidden
  if (status === 403) {
    toast.error(data?.message || 'Permission denied: You do not have access to perform this action.')
    return
  }

  // Handle 404 Not Found
  if (status === 404) {
    toast.error(data?.message || 'The requested resource was not found.')
    return
  }

  const message = data?.message || error?.message || 'An unexpected error occurred'
  toast.error(message, { duration: 5000 })
}
