/**
 * Mockable API Caller
 * Switches between real backend API and mock fixtures based on VITE_USE_MOCK.
 * Source of truth: docs/PLAN.md (Section 1 & Module M0)
 */

export function isMockEnabled() {
  return import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_USE_MOCK === true;
}

/**
 * Wrap an API call with mock capability.
 * When VITE_USE_MOCK=true, returns mockCall result after optional simulated delay.
 * Otherwise, invokes and returns realCall().
 *
 * @template T
 * @param {() => Promise<T>} realCall - Function performing the real Axios request
 * @param {(() => Promise<T>|T) | T} mockCall - Function or data returning section 6 fixture envelope
 * @param {number} [delayMs=150] - Simulated network latency in milliseconds
 * @returns {Promise<T>}
 */
export async function mockable(realCall, mockCall, delayMs = 150) {
  if (isMockEnabled()) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    if (typeof mockCall === 'function') {
      return await mockCall();
    }
    return mockCall;
  }

  return await realCall();
}

/**
 * Helper to build standard API success envelope for mock responses.
 *
 * @template T
 * @param {T} data
 * @param {{ current_page: number, last_page: number, per_page: number, total: number } | null} [meta=null]
 * @param {string} [message='OK']
 * @returns {{ success: true, message: string, data: T, meta: any }}
 */
export function mockSuccessEnvelope(data, meta = null, message = 'OK') {
  return {
    success: true,
    message,
    data,
    meta,
  };
}

/**
 * Helper to build standard pagination meta for mocks.
 *
 * @param {number} [currentPage=1]
 * @param {number} [lastPage=1]
 * @param {number} [perPage=15]
 * @param {number} [total=0]
 */
export function mockPaginationMeta(currentPage = 1, lastPage = 1, perPage = 15, total = 0) {
  return {
    current_page: currentPage,
    last_page: lastPage,
    per_page: perPage,
    total,
  };
}

