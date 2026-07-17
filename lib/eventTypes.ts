export interface EventRow {
  id: string;
  slug: string;
  status: "draft" | "published" | "unpublished";

  show_at: string;
  countdown_starts_at: string;
  show_timezone: string;
  countdown_start_mode: "immediate" | "custom";

  featured_image_url: string | null;

  scheduled_headline: string;
  scheduled_message: string;
  scheduled_helper_message: string;

  countdown_headline: string;
  countdown_helper_message: string;

  live_headline: string;
  live_message: string;

  private_waiting_message: string;
  private_live_message: string;

  live_show_link: string | null;
  timer_completion_behavior: string;

  event_title: string | null;
  banner_image_url: string | null;
  banner_visible: boolean;
  countdown_visible: boolean;
  registration_link: string | null;

  created_at: string;
  updated_at: string;
}
