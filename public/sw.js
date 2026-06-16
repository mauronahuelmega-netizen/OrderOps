self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const fallbackNotification = {
    title: "OrderOps",
    body: "Push recibido en este dispositivo.",
    tag: "orderops:push-foundation",
    data: {
      url: "/admin/dashboard"
    }
  };

  let notification = fallbackNotification;

  if (event.data) {
    try {
      const payload = event.data.json();

      notification = {
        title:
          typeof payload?.title === "string" && payload.title.trim().length > 0
            ? payload.title.trim()
            : fallbackNotification.title,
        body:
          typeof payload?.body === "string" && payload.body.trim().length > 0
            ? payload.body.trim()
            : fallbackNotification.body,
        tag:
          typeof payload?.tag === "string" && payload.tag.trim().length > 0
            ? payload.tag.trim()
            : fallbackNotification.tag,
        data:
          payload?.data && typeof payload.data === "object"
            ? {
                orderId:
                  typeof payload.data.orderId === "string" ? payload.data.orderId : undefined,
                type: typeof payload.data.type === "string" ? payload.data.type : undefined,
                url:
                  typeof payload.data.url === "string" && payload.data.url.trim().length > 0
                    ? payload.data.url.trim()
                    : fallbackNotification.data.url
              }
            : fallbackNotification.data
      };
    } catch {
      notification = fallbackNotification;
    }
  }

  event.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.body,
      data: notification.data,
      tag: notification.tag
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl =
    event.notification.data &&
    typeof event.notification.data === "object" &&
    typeof event.notification.data.url === "string"
      ? event.notification.data.url
      : "/admin/dashboard";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => client.url.includes("/admin/dashboard"));

      if (existing) {
        return existing.focus();
      }

      return self.clients.openWindow(targetUrl);
    })
  );
});
