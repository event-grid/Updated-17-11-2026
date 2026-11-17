"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useSession } from "@/features/auth/session-store";
import { callBrowserApi, favouritesApi, notificationsApi, sessionApi, shoppingApi } from "@/lib/api/client";
import type { Cart, CartItemRequest, CartItemUpdate } from "@/lib/api/generated/customer";

/**
 * Server state of the signed-in customer (TanStack Query). Every query is disabled while signed out, so visitors
 * never call the customer API. Mutations update or invalidate the affected queries.
 */
export const keys = {
  cart: ["cart"] as const,
  favourites: ["favourites"] as const,
  bookings: ["bookings"] as const,
  booking: (reference: string) => ["bookings", reference] as const,
  notifications: ["notifications"] as const,
  me: ["me"] as const,
};

export function useSignedIn() {
  const session = useSession();
  return { session, signedIn: session.status === "signed-in" };
}

export function useCart() {
  const { signedIn } = useSignedIn();
  return useQuery({ queryKey: keys.cart, queryFn: () => callBrowserApi(() => shoppingApi.getCart()), enabled: signedIn });
}

export function useCartMutations() {
  const client = useQueryClient();
  const onSuccess = (cart: Cart) => client.setQueryData(keys.cart, cart);
  return {
    add: useMutation({
      mutationFn: (item: CartItemRequest) => callBrowserApi(() => shoppingApi.addCartItem({ cartItemRequest: item })),
      onSuccess,
    }),
    update: useMutation({
      mutationFn: ({ itemId, update }: { itemId: string; update: CartItemUpdate }) =>
        callBrowserApi(() => shoppingApi.updateCartItem({ itemId, cartItemUpdate: update })),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (itemId: string) => callBrowserApi(() => shoppingApi.removeCartItem({ itemId })),
      onSuccess,
    }),
  };
}

export function useFavourites() {
  const { signedIn } = useSignedIn();
  return useQuery({
    queryKey: keys.favourites,
    queryFn: () => callBrowserApi(() => favouritesApi.listFavourites()),
    enabled: signedIn,
  });
}

export function useToggleFavourite() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ type, slug, saved }: { type: "venue" | "listing"; slug: string; saved: boolean }) =>
      callBrowserApi(() =>
        saved ? favouritesApi.removeFavourite({ type, slug }) : favouritesApi.addFavourite({ type, slug }),
      ),
    onSettled: () => client.invalidateQueries({ queryKey: keys.favourites }),
  });
}

export function useBookings() {
  const { signedIn } = useSignedIn();
  return useQuery({ queryKey: keys.bookings, queryFn: () => callBrowserApi(() => shoppingApi.listBookings()), enabled: signedIn });
}

export function useBooking(reference: string) {
  const { signedIn } = useSignedIn();
  return useQuery({
    queryKey: keys.booking(reference),
    queryFn: () => callBrowserApi(() => shoppingApi.getBooking({ reference })),
    enabled: signedIn,
  });
}

export function useNotifications() {
  const { signedIn } = useSignedIn();
  return useQuery({
    queryKey: keys.notifications,
    queryFn: () => callBrowserApi(() => notificationsApi.listNotifications()),
    enabled: signedIn,
    refetchInterval: 60_000,
  });
}

export function useNotificationMutations() {
  const client = useQueryClient();
  const onSettled = () => client.invalidateQueries({ queryKey: keys.notifications });
  return {
    markRead: useMutation({
      mutationFn: (id: string) => callBrowserApi(() => notificationsApi.markNotificationRead({ id })),
      onSettled,
    }),
    markAllRead: useMutation({
      mutationFn: () => callBrowserApi(() => notificationsApi.markAllNotificationsRead()),
      onSettled,
    }),
  };
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (displayName: string) =>
      callBrowserApi(() => sessionApi.updateMe({ profileUpdate: { displayName } })),
  });
}

/** Step 1 of adding or changing the email address: send a one-time code to it. */
export function useRequestEmailCode() {
  return useMutation({
    mutationFn: (email: string) =>
      callBrowserApi(() => sessionApi.requestEmailCode({ emailCodeRequest: { email } })),
  });
}

/** Step 2: confirm the code. The address is saved on the account only now. */
export function useVerifyEmail() {
  return useMutation({
    mutationFn: (input: { challengeId: string; code: string }) =>
      callBrowserApi(() => sessionApi.verifyEmail({ emailVerification: input })),
  });
}
