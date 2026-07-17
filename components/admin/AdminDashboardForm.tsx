"use client";

import { useState, useTransition } from "react";
import AdminSectionCard from "./AdminSectionCard";
import DateTimeField from "./DateTimeField";
import TimezoneSelect from "./TimezoneSelect";
import ImageUploader from "./ImageUploader";
import MessageEditor from "./MessageEditor";
import LiveLinkField from "./LiveLinkField";
import PreviewButtons from "./PreviewButtons";
import PublishControls from "./PublishControls";
import PublicLinkDisplay from "./PublicLinkDisplay";
import type { EventRow } from "../../lib/eventTypes";
import { localToUtcIso, utcToLocalParts } from "../../lib/zonedTime";
import {
  saveEventDraft,
  setEventStatus,
  uploadFeaturedImage,
  removeFeaturedImage,
} from "../../app/admin/actions";

interface AdminDashboardFormProps {
  initialEvent: EventRow;
}

export default function AdminDashboardForm({ initialEvent }: AdminDashboardFormProps) {
  const [event, setEvent] = useState(initialEvent);
  const [isPending, startTransition] = useTransition();
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const showLocal = utcToLocalParts(event.show_at, event.show_timezone);
  const countdownLocal = utcToLocalParts(event.countdown_starts_at, event.show_timezone);

  function update<K extends keyof EventRow>(key: K, value: EventRow[K]) {
    setEvent((prev) => ({ ...prev, [key]: value }));
    setSavedMessage(null);
  }

  function updateShowDate(dateStr: string) {
    const iso = localToUtcIso(dateStr, showLocal.time, event.show_timezone);
    update("show_at", iso);
  }

  function updateShowTime(timeStr: string) {
    const iso = localToUtcIso(showLocal.date, timeStr, event.show_timezone);
    update("show_at", iso);
  }

  function updateCountdownDate(dateStr: string) {
    const iso = localToUtcIso(dateStr, countdownLocal.time, event.show_timezone);
    update("countdown_starts_at", iso);
  }

  function updateCountdownTime(timeStr: string) {
    const iso = localToUtcIso(countdownLocal.date, timeStr, event.show_timezone);
    update("countdown_starts_at", iso);
  }

  function updateTimezone(tz: string) {
    // Re-derive both timestamps using the *same* local wall-clock values
    // but the new zone, so the displayed date/time doesn't silently shift.
    const newShowAt = localToUtcIso(showLocal.date, showLocal.time, tz);
    const newCountdownAt = localToUtcIso(countdownLocal.date, countdownLocal.time, tz);
    setEvent((prev) => ({
      ...prev,
      show_timezone: tz,
      show_at: newShowAt,
      countdown_starts_at: newCountdownAt,
    }));
  }

  function handleSaveDraft() {
    startTransition(async () => {
      await saveEventDraft(event.id, event);
      setSavedMessage("Saved.");
    });
  }

  function handlePublish() {
    startTransition(async () => {
      await saveEventDraft(event.id, event);
      await setEventStatus(event.id, "published");
      setEvent((prev) => ({ ...prev, status: "published" }));
      setSavedMessage("Published.");
    });
  }

  function handleUnpublish() {
    startTransition(async () => {
      await setEventStatus(event.id, "unpublished");
      setEvent((prev) => ({ ...prev, status: "unpublished" }));
      setSavedMessage("Unpublished.");
    });
  }

  async function handleImageUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const publicUrl = await uploadFeaturedImage(event.id, formData);
    setEvent((prev) => ({ ...prev, featured_image_url: publicUrl }));
  }

  async function handleImageRemove() {
    await removeFeaturedImage(event.id);
    setEvent((prev) => ({ ...prev, featured_image_url: null }));
  }

  return (
    <div>
      <AdminSectionCard title="Public link">
        <PublicLinkDisplay slug={event.slug} />
      </AdminSectionCard>

      <AdminSectionCard title="Live show date and time">
        <DateTimeField
          label="Show date and time"
          dateValue={showLocal.date}
          timeValue={showLocal.time}
          onDateChange={updateShowDate}
          onTimeChange={updateShowTime}
        />
        <TimezoneSelect value={event.show_timezone} onChange={updateTimezone} />
      </AdminSectionCard>

      <AdminSectionCard title="Countdown page start">
        <div className="admin-radio-row">
          <input
            type="radio"
            name="countdown-start"
            checked={event.countdown_start_mode === "immediate"}
            onChange={() => update("countdown_start_mode", "immediate")}
          />
          <span>Start immediately</span>
        </div>
        <div className="admin-radio-row">
          <input
            type="radio"
            name="countdown-start"
            checked={event.countdown_start_mode === "custom"}
            onChange={() => update("countdown_start_mode", "custom")}
          />
          <span>Custom start date and time</span>
        </div>
        {event.countdown_start_mode === "custom" && (
          <DateTimeField
            label="Countdown page start"
            dateValue={countdownLocal.date}
            timeValue={countdownLocal.time}
            onDateChange={updateCountdownDate}
            onTimeChange={updateCountdownTime}
          />
        )}
      </AdminSectionCard>

      <AdminSectionCard title="Featured image">
        <ImageUploader
          currentUrl={event.featured_image_url}
          onUpload={handleImageUpload}
          onRemove={handleImageRemove}
        />
      </AdminSectionCard>

      <AdminSectionCard title="Headline and messages">
        <MessageEditor
          label="Scheduled headline"
          value={event.scheduled_headline}
          onChange={(v) => update("scheduled_headline", v)}
        />
        <MessageEditor
          label="Scheduled message"
          value={event.scheduled_message}
          onChange={(v) => update("scheduled_message", v)}
        />
        <MessageEditor
          label="Scheduled helper message"
          value={event.scheduled_helper_message}
          onChange={(v) => update("scheduled_helper_message", v)}
        />
        <MessageEditor
          label="Countdown headline"
          value={event.countdown_headline}
          onChange={(v) => update("countdown_headline", v)}
        />
        <MessageEditor
          label="Countdown helper message"
          value={event.countdown_helper_message}
          onChange={(v) => update("countdown_helper_message", v)}
          multiline
        />
        <MessageEditor
          label="Live headline"
          value={event.live_headline}
          onChange={(v) => update("live_headline", v)}
        />
        <MessageEditor
          label="Live supporting message"
          value={event.live_message}
          onChange={(v) => update("live_message", v)}
        />
        <MessageEditor
          label="Private waiting-room message"
          value={event.private_waiting_message}
          onChange={(v) => update("private_waiting_message", v)}
        />
        <MessageEditor
          label="Private live-show message"
          value={event.private_live_message}
          onChange={(v) => update("private_live_message", v)}
        />
      </AdminSectionCard>

      <AdminSectionCard title="Live show link">
        <LiveLinkField
          value={event.live_show_link ?? ""}
          onChange={(v) => update("live_show_link", v)}
        />
      </AdminSectionCard>

      <AdminSectionCard title="Preview">
        <PreviewButtons slug={event.slug} />
      </AdminSectionCard>

      {savedMessage && (
        <p className="admin-hint" style={{ marginBottom: "10px", fontWeight: 700 }}>
          {savedMessage}
        </p>
      )}

      <PublishControls
        status={event.status}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        busy={isPending}
      />
    </div>
  );
}
