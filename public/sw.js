// Minimal service worker for admin Web Push notifications only.
// Deliberately does NOT intercept fetch/cache anything - registered with
// scope "/admin/" so it never touches the public site.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "The Puppy Plugs", body: event.data.text() };
  }

  const title = payload.title || "The Puppy Plugs";
  const options = {
    body: payload.body || "",
    icon: "/logo-icon.png",
    badge: "/logo-icon.png",
    tag: payload.tag || "puppy-plugs-notification",
    data: { url: payload.url || "/admin" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/admin";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes(targetUrl) && "focus" in client) {
          return client.focus();
        }
      }
      for (const client of clientsList) {
        if ("focus" in client && "navigate" in client) {
          return client.focus().then(() => client.navigate(targetUrl));
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
