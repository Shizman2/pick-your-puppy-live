"use client";

import { useEffect, useState } from "react";
import {
  subscribeToPush,
  unsubscribeFromPush,
  updateNotificationPreferences,
  sendTestNotification,
} from "../../../app/admin/settings/actions";
import type { AdminNotificationPreferencesRow, PushSubscriptionRow } from "../../../lib/pushTypes";

type SupportState = "checking" | "unsupported" | "needs-home-screen" | "ready";
type PermissionState = "default" | "granted" | "denied";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function isIos(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function getDeviceLabel(): string {
  const ua = navigator.userAgent;
  let platform = "Device";
  if (/iPhone/.test(ua)) platform = "iPhone";
  else if (/iPad/.test(ua)) platform = "iPad";
  else if (/Android/.test(ua)) platform = "Android";
  else if (/Macintosh/.test(ua)) platform = "Mac";
  else if (/Windows/.test(ua)) platform = "Windows";
  else if (/Linux/.test(ua)) platform = "Linux";

  let browser = "Browser";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/OPR\//.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "Safari";

  return `${platform} / ${browser}`;
}

const PREFERENCE_TOGGLES: {
  key: keyof Pick<
    AdminNotificationPreferencesRow,
    "notify_reservation_requests" | "notify_puppy_finder_requests" | "notify_contact_messages" | "notify_puppy_inquiries"
  >;
  label: string;
}[] = [
  { key: "notify_reservation_requests", label: "Reservation Requests" },
  { key: "notify_puppy_finder_requests", label: "Puppy Finder Requests" },
  { key: "notify_contact_messages", label: "Contact Messages" },
  { key: "notify_puppy_inquiries", label: "Puppy Inquiries" },
];

const DEFAULT_PREFS = {
  notify_reservation_requests: true,
  notify_puppy_finder_requests: true,
  notify_contact_messages: true,
  notify_puppy_inquiries: true,
};

export default function NotificationSettingsClient({
  subscriptions,
  preferences,
}: {
  subscriptions: PushSubscriptionRow[];
  preferences: AdminNotificationPreferencesRow | null;
}) {
  const [support, setSupport] = useState<SupportState>("checking");
  const [permission, setPermission] = useState<PermissionState>("default");
  const [thisDeviceEndpoint, setThisDeviceEndpoint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [prefs, setPrefs] = useState(preferences || DEFAULT_PREFS);

  useEffect(() => {
    async function detect() {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setSupport("unsupported");
        return;
      }
      if (isIos() && !isStandalone()) {
        setSupport("needs-home-screen");
        return;
      }
      setPermission(Notification.permission as PermissionState);
      setSupport("ready");

      try {
        const registration = await navigator.serviceWorker.getRegistration("/admin/");
        const existing = await registration?.pushManager.getSubscription();
        if (existing) setThisDeviceEndpoint(existing.endpoint);
      } catch {
        // Nothing registered yet - fine, "Enable" will register it.
      }
    }
    detect();
  }, []);

  const thisDeviceRow = thisDeviceEndpoint ? subscriptions.find((s) => s.endpoint === thisDeviceEndpoint) : null;

  async function handleEnable() {
    setError(null);
    setBusy(true);
    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setError("Push notifications aren't configured on the server yet (missing VAPID public key).");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/admin/" });
      await navigator.serviceWorker.ready;

      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult as PermissionState);
      if (permissionResult !== "granted") {
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        setError("Couldn't complete the push subscription. Please try again.");
        return;
      }

      const result = await subscribeToPush({
        endpoint: json.endpoint,
        p256dh: json.keys.p256dh,
        authKey: json.keys.auth,
        deviceLabel: getDeviceLabel(),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setThisDeviceEndpoint(json.endpoint);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong enabling notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisableThisDevice() {
    if (!thisDeviceRow) return;
    setBusy(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/admin/");
      const existing = await registration?.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const result = await unsubscribeFromPush(thisDeviceRow.id);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setThisDeviceEndpoint(null);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't disable notifications on this device.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveDevice(id: string) {
    if (!confirm("Remove this device? It will stop receiving push notifications.")) return;
    const result = await unsubscribeFromPush(id);
    if (!result.success) {
      setError(result.error);
      return;
    }
    window.location.reload();
  }

  async function handleTogglePref(key: (typeof PREFERENCE_TOGGLES)[number]["key"]) {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    await updateNotificationPreferences({ [key]: next[key] });
  }

  async function handleTestNotification() {
    setTestStatus("sending");
    const result = await sendTestNotification();
    setTestStatus(result.success ? "sent" : "error");
    if (!result.success) setError(result.error);
    setTimeout(() => setTestStatus("idle"), 3000);
  }

  const isEnabledOnThisDevice = support === "ready" && permission === "granted" && !!thisDeviceRow;

  return (
    <div className="profile-card">
      <h2 className="admin-card__title">Push Notifications</h2>
      <p className="admin-hint" style={{ marginBottom: 16 }}>
        Get an instant alert when a customer submits a reservation request, Puppy Finder request, contact message,
        or puppy inquiry - without refreshing the dashboard.
      </p>

      {error && <div className="settings-error">{error}</div>}

      {support === "checking" && <p className="admin-hint">Checking this device...</p>}

      {support === "unsupported" && (
        <div className="settings-status settings-status--warn">Not supported on this browser/device.</div>
      )}

      {support === "needs-home-screen" && (
        <div className="settings-status settings-status--warn">
          Add ThePuppyPlugs Admin to your Home Screen to enable notifications on this device. Tap the Share icon in
          Safari, then &quot;Add to Home Screen&quot;, then open the app from your Home Screen and come back here.
        </div>
      )}

      {support === "ready" && permission === "denied" && (
        <div className="settings-status settings-status--warn">
          Notifications Denied - permission was blocked in this browser. Re-enable it from your browser&apos;s site
          settings for this page, then reload.
        </div>
      )}

      {support === "ready" && permission !== "denied" && (
        <>
          <div className={`settings-status ${isEnabledOnThisDevice ? "settings-status--on" : "settings-status--off"}`}>
            {isEnabledOnThisDevice ? "Notifications Enabled" : "Notifications Disabled"} (this device)
          </div>

          {!isEnabledOnThisDevice ? (
            <button type="button" className="admin-btn admin-btn--primary" onClick={handleEnable} disabled={busy}>
              {busy ? "Enabling..." : "Enable Push Notifications"}
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={handleTestNotification}
                disabled={testStatus === "sending"}
              >
                {testStatus === "sending" ? "Sending..." : testStatus === "sent" ? "Sent!" : "Send Test Notification"}
              </button>
              <button type="button" className="admin-btn admin-btn--danger" onClick={handleDisableThisDevice} disabled={busy}>
                Disable on This Device
              </button>
            </div>
          )}
        </>
      )}

      <h3 className="admin-card__title" style={{ fontSize: 14, marginTop: 24, marginBottom: 10 }}>
        Notify Me About
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {PREFERENCE_TOGGLES.map((toggle) => (
          <label key={toggle.key} className="settings-checkbox-row">
            <input type="checkbox" checked={Boolean(prefs[toggle.key])} onChange={() => handleTogglePref(toggle.key)} />
            {toggle.label}
          </label>
        ))}
      </div>

      <h3 className="admin-card__title" style={{ fontSize: 14, marginTop: 24, marginBottom: 10 }}>
        Notification Devices
      </h3>
      {subscriptions.length === 0 ? (
        <p className="admin-hint">No devices registered yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {subscriptions.map((sub) => (
            <div key={sub.id} className="settings-device-row">
              <span>
                {sub.device_label || "Unknown device"}
                {sub.endpoint === thisDeviceEndpoint && <span className="settings-device-tag">This device</span>}
              </span>
              <button type="button" className="admin-btn admin-btn--danger" onClick={() => handleRemoveDevice(sub.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
