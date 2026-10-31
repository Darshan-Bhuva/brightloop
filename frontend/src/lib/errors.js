import { toast } from 'sonner';
import { TOKEN_KEY } from './constants';

/**
 * Extract error message from API response envelope or Error object.
 *
 * @param {any} error
 * @returns {string}
 */
export function getErrorMessage(error) {
  if (!error) return 'An unexpected error occurred.';
  if (typeof error === 'string') return error;

  if (error.response?.data) {
    const data = error.response.data;
    if (data.message) return data.message;
    if (data.errors && typeof data.errors === 'object') {
      const firstKey = Object.keys(data.errors)[0];
      const firstVal = data.errors[firstKey];
      return Array.isArray(firstVal) ? firstVal[0] : String(firstVal);
    }
  }

  return error.message || 'An unexpected error occurred.';
}

/**
 * Handle API error according to Brightloop PLAN.md conventions:
 * - 422: Map validation errors to react-hook-form setError; toast fallback.
 * - 401: Clear auth token and redirect to /login.
 * - 403 / 409 / 500: Display toast with error message.
 *
 * @param {any} error - Axios error object
 * @param {function|null} [setError=null] - react-hook-form's setError function
 * @param {object} [options={}] - Optional configuration
 * @param {boolean} [options.redirectOn401=true]
 * @param {boolean} [options.toastOn422=false]
 * @returns {{ handled: boolean, status?: number, message: string, errors?: Record<string, string[]> }}
 */
export function handleApiError(error, setError = null, options = {}) {
  const { redirectOn401 = true, toastOn422 = false } = options;

  if (!error?.response) {
    const msg = error?.message?.includes('Network Error')
      ? 'Unable to connect to the server. Please check your network connection.'
      : (error?.message || 'Network error occurred.');
    toast.error(msg);
    return { handled: true, message: msg };
  }

  const { status, data } = error.response;
  const message = data?.message || 'A server error occurred.';
  const errors = data?.errors || null;

  switch (status) {
    case 422: {
      // Validation error: map to form fields if setError is provided
      if (typeof setError === 'function' && errors && typeof errors === 'object') {
        Object.entries(errors).forEach(([field, errMessages]) => {
          const fieldMessage = Array.isArray(errMessages) ? errMessages[0] : String(errMessages);
          setError(field, {
            type: 'server',
            message: fieldMessage,
          });
        });

        if (toastOn422) {
          toast.error(message || 'Please correct the highlighted errors.');
        }
      } else {
        // No form setError provided, toast the validation error
        const firstError = errors
          ? Object.values(errors).flat()[0]
          : null;
        toast.error(firstError || message || 'Validation failed.');
      }
      return { handled: true, status: 422, message, errors };
    }

    case 401: {
      // Unauthorized: clear token and redirect to login
      try {
        localStorage.removeItem(TOKEN_KEY);
      } catch {
        // localStorage might be unavailable
      }

      window.dispatchEvent(new Event('auth:logout'));
      toast.warning(message || 'Session expired. Please log in again.');

      if (redirectOn401 && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
        if (!publicPaths.some((p) => currentPath.startsWith(p))) {
          setTimeout(() => {
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
          }, 300);
        }
      }
      return { handled: true, status: 401, message };
    }

    case 403: {
      // Forbidden: role not allowed or account inactive
      toast.error(message || 'Access denied. You do not have permission to perform this action.');
      return { handled: true, status: 403, message };
    }

    case 409: {
      // Conflict: business rule violation or state transition failure
      toast.error(message || 'Action cannot be completed due to a conflict.');
      return { handled: true, status: 409, message };
    }

    case 404: {
      // Not found
      toast.error(message || 'Requested resource not found.');
      return { handled: true, status: 404, message };
    }

    case 500:
    default: {
      // Server error or unexpected status
      toast.error(message || 'An internal server error occurred.');
      return { handled: true, status, message };
    }
  }
}

