export interface PushSubscriptionRow {
  id: string;
  admin_user_id: string;
  endpoint: string;
  p256dh: string;
  auth_key: string;
  device_label: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

export interface AdminNotificationPreferencesRow {
  admin_user_id: string;
  notify_reservation_requests: boolean;
  notify_puppy_finder_requests: boolean;
  notify_contact_messages: boolean;
  notify_puppy_inquiries: boolean;
  notify_puppy_finder_selections: boolean;
  created_at: string;
  updated_at: string;
}

export type NotificationEventType =
  | "reservation_request"
  | "puppy_finder_request"
  | "contact_message"
  | "puppy_inquiry"
  | "puppy_finder_selection";

export const NOTIFICATION_PREFERENCE_KEY: Record<
  NotificationEventType,
  keyof Pick<
    AdminNotificationPreferencesRow,
    | "notify_reservation_requests"
    | "notify_puppy_finder_requests"
    | "notify_contact_messages"
    | "notify_puppy_inquiries"
    | "notify_puppy_finder_selections"
  >
> = {
  reservation_request: "notify_reservation_requests",
  puppy_finder_request: "notify_puppy_finder_requests",
  contact_message: "notify_contact_messages",
  puppy_inquiry: "notify_puppy_inquiries",
  puppy_finder_selection: "notify_puppy_finder_selections",
};

export interface PushNotificationPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}
