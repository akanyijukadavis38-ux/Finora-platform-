const CACHE_NAME = "finora-app-v1";

const APP_SHELL = [
    "/index.html",
    "/manifest.json"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames =>
            Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {

                if (
                    response &&
                    response.status === 200 &&
                    response.type === "basic"
                ) {
                    const responseClone =
                        response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(
                                event.request,
                                responseClone
                            );
                        });
                }

                return response;
            })
            .catch(() =>
                caches.match(event.request)
            )
    );
});


// =========================================
// FINORA DEVICE PUSH NOTIFICATIONS
// =========================================

self.addEventListener("push", event => {

    let data = {};

    try {
        data = event.data
            ? event.data.json()
            : {};
    } catch (error) {
        data = {
            title: "FINORA",
            body: event.data
                ? event.data.text()
                : "You have a new FINORA notification."
        };
    }

    const title =
        data.title || "FINORA";

    const options = {

        body:
            data.body ||
            "You have a new FINORA notification.",

        icon:
            data.icon ||
            "/finora-icon.png",

        badge:
            data.badge ||
            "/finora-icon.png",

        data: {
            url:
                data.url ||
                "/dashboard.html"
        },

        tag:
            data.tag ||
            "finora-notification",

        renotify: true,

        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification(
            title,
            options
        )
    );
});


// =========================================
// FINORA NOTIFICATION CLICK
// =========================================

self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();

        const targetUrl =
            event.notification.data &&
            event.notification.data.url
                ? event.notification.data.url
                : "/dashboard.html";

        event.waitUntil(

            clients.matchAll({
                type: "window",
                includeUncontrolled: true
            }).then(clientList => {

                for (const client of clientList) {

                    if ("focus" in client) {

                        client.navigate(targetUrl);

                        return client.focus();
                    }
                }

                if (clients.openWindow) {
                    return clients.openWindow(
                        targetUrl
                    );
                }

            })

        );
    }
);
