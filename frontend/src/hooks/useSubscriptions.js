import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getSubscription,
  getSubscriptions,
  confirmSubscription,
} from '@/api/subscriptions'

/**
 * Hook to fetch a single subscription by ID
 * @param {number|string} id
 * @param {object} [options]
 */
export function useSubscription(id, options = {}) {
  return useQuery({
    queryKey: ['subscription', String(id)],
    queryFn: () => getSubscription(id),
    enabled: Boolean(id),
    ...options,
  })
}

/**
 * Hook to fetch a list of subscriptions
 * @param {object} [params]
 * @param {object} [options]
 */
export function useSubscriptions(params = {}, options = {}) {
  return useQuery({
    queryKey: ['subscriptions', params],
    queryFn: () => getSubscriptions(params),
    ...options,
  })
}

/**
 * Mutation hook for SUB-07 confirming a quotation
 * Invalidates subscription detail and list queries on success
 * Allowed for Admin, Staff, and Customer (own)
 *
 * @param {object} [options]
 */
export function useConfirmSubscription(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => confirmSubscription(id),
    onSuccess: (res, id, context) => {
      // Invalidate subscription details
      queryClient.invalidateQueries({ queryKey: ['subscription', String(id)] })
      queryClient.invalidateQueries({ queryKey: ['subscription', Number(id)] })
      // Invalidate subscription lists
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['portal-subscriptions'] })
      queryClient.invalidateQueries({ queryKey: ['portal-summary'] })

      options.onSuccess?.(res, id, context)
    },
    onError: (err, id, context) => {
      options.onError?.(err, id, context)
    },
    ...options,
  })
}
