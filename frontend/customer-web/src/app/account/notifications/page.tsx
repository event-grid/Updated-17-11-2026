"use client";

import Link from "next/link";

import { useNotificationMutations, useNotifications, useSignedIn } from "@/features/shopping/hooks";
import { SignInPrompt } from "@/features/shopping/components/SignInPrompt";
import { formatDateTime } from "@/lib/format";

export default function NotificationsPage() {
  const { session } = useSignedIn();
  const notifications = useNotifications();
  const { markRead, markAllRead } = useNotificationMutations();

  if (session.status === "loading") return <div aria-hidden="true" className="skeleton h-96 rounded-xl" />;
  if (session.status === "signed-out") return <SignInPrompt what="your notifications" />;

  const data = notifications.data;
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl text-ink">Notifications</h1>
        {data && data.unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-sm font-semibold text-terracotta hover:text-terracotta-600"
          >
            Mark all as read
          </button>
        )}
      </div>
      {notifications.isLoading ? (
        <div aria-hidden="true" className="skeleton h-48 rounded-xl" />
      ) : notifications.isError ? (
        <p role="alert" className="text-terracotta-600">We could not load your notifications. Please refresh.</p>
      ) : data!.items.length === 0 ? (
        <p className="text-ink-soft">No notifications yet. Booking updates will appear here.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {data!.items.map((n) => (
            <li
              key={n.id}
              className={`flex flex-col gap-1 rounded-xl p-5 ring-1 transition-colors ${n.read ? "bg-white ring-line" : "bg-tile-peach/40 ring-terracotta/30"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-ink">
                  {!n.read && <span aria-label="Unread" className="mr-2 inline-block size-2 rounded-full bg-terracotta align-middle" />}
                  {n.title}
                </p>
                <time className="shrink-0 text-xs text-ink-soft">{formatDateTime(n.createdAt)}</time>
              </div>
              <p className="text-sm text-ink-soft">{n.body}</p>
              <div className="mt-1 flex gap-4 text-sm">
                {n.actionPath && (
                  <Link href={n.actionPath} onClick={() => !n.read && markRead.mutate(n.id)} className="font-semibold text-terracotta">
                    View →
                  </Link>
                )}
                {!n.read && (
                  <button type="button" onClick={() => markRead.mutate(n.id)} className="text-ink-soft hover:text-ink">
                    Mark as read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
