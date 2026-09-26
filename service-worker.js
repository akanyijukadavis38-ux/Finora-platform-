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

            title:
                "FINORA",

            body:
                event.data
                    ? event.data.text()
                    : "You have a new FINORA notification."

        };

    }


    const title =
        data.title ||
        "FINORA";


    /*
     * IMPORTANT:
     *
     * Every notification gets its own unique tag.
     *
     * The server sends notificationId from the
     * MongoDB notification record.
     *
     * This prevents:
     *
     * Deposit submitted
     * Deposit approved
     * Referral earned
     *
     * from replacing one another.
     */

    const notificationTag =
        data.notificationId
            ? `finora-${data.notificationId}`
            : (
                data.tag ||
                `finora-${Date.now()}`
            );


    const options = {

        // Short description shown below the title
        body:
            data.body ||
            "You have a new FINORA notification.",


        // FINORA application icon
        icon:
            data.icon ||
            "/finora-icon.png",


        // FINORA small Android notification badge
        badge:
            data.badge ||
            "/finora-badge.png",


        /*
         * UNIQUE NOTIFICATION TAG
         *
         * Each notification gets its own identity.
         */
        tag:
            notificationTag,


        /*
         * Alert again when a new notification
         * is displayed.
         */
        renotify:
            true,


        // Normal Android-style notification behaviour
        requireInteraction:
            false,


        // Information used when notification is opened
        data: {

            url:
                data.url ||
                "/dashboard.html",

            notificationId:
                data.notificationId ||
                null

        },


        // Notification action buttons
        actions: [

            {

                action:
                    "mark-read",

                title:
                    "Mark as read"

            }

        ]

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

        const notification =
            event.notification;

        const action =
            event.action;

        const targetUrl =
            notification.data &&
            notification.data.url
                ? notification.data.url
                : "/dashboard.html";


        // -----------------------------------------
        // MARK AS READ
        // -----------------------------------------

        if (
            action ===
            "mark-read"
        ) {

            notification.close();

            return;
        }


        // -----------------------------------------
        // NORMAL NOTIFICATION TAP
        // -----------------------------------------

        notification.close();

        event.waitUntil(

            clients.matchAll({

                type:
                    "window",

                includeUncontrolled:
                    true

            })

            .then(clientList => {

                for (
                    const client
                    of clientList
                ) {

                    if (
                        "navigate" in client &&
                        "focus" in client
                    ) {

                        return client
                            .navigate(targetUrl)
                            .then(() =>
                                client.focus()
                            );

                    }

                }


                if (
                    clients.openWindow
                ) {

                    return clients.openWindow(
                        targetUrl
                    );

                }

            })

        );

    }
);
