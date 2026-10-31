import { toast } from 'sonner'

/**
 * Handle API errors: maps 422 validation errors to react-hook-form `setError`,
 * and displays toast messages for 409, 403, and other unexpected errors.
 *
 * @param {Error} error Axios error object
 * @param {Function} [setError] react-hook-form setError function
 * @returns {void}
 */
export function handleApiError(error, setError) {
  const response = error?.response
  const status = response?.status
  const data = response?.data

  if (status === 422 && data?.errors && setError) {
    let unmappedErrors = []

    Object.entries(data.errors).forEach(([field, messages]) => {
      const message = Array.isArray(messages) ? messages[0] : messages
      try {
        setError(field, {
          type: 'server',
          message: message,
        })
      } catch {
        unmappedErrors.push(message)
      }
    })

    if (unmappedErrors.length > 0) {
      toast.error(unmappedErrors.join(', '))
    } else if (data.message && data.message !== 'The given data was invalid.') {
      toast.error(data.message)
    }
    return
  }

  const message = data?.message || error?.message || 'An unexpected error occurred'
  toast.error(message)
}


/**
 * Extract human-readable error message from error object.
 * @param {Error} error
 * @param {string} [defaultMessage='An unexpected error occurred']
 * @returns {string}
 */
export function getErrorMessage(error, defaultMessage = 'An unexpected error occurred') {
  return error?.response?.data?.message || error?.message || defaultMessage
}
