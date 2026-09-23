/* =========================================================
   FINORA DEVICE PUSH NOTIFICATIONS
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       FINORA SETTINGS
       ===================================================== */

    const BACKEND_URL =
        "https://finora-platform.onrender.com";

    const VAPID_PUBLIC_KEY =
        "BLYcBF40Imam1lyAXX88IeJ6C6I7IZ5HblNNNF1pBI4QBAC05s1_yK40Dmcz4v3aLBt5uQvAbG7yVBCHboZzjGw";


    /* =====================================================
       CONVERT VAPID KEY
    ===================================================== */

    function urlBase64ToUint8Array(base64String) {

        const padding =
            "=".repeat(
                (4 - base64String.length % 4) % 4
            );

        const base64 =
            (
                base64String +
                padding
            )
                .replace(/-/g, "+")
                .replace(/_/g, "/");

        const rawData =
            window.atob(base64);

        const outputArray =
            new Uint8Array(
                rawData.length
            );

        for (
            let i = 0;
            i < rawData.length;
            ++i
        ) {

            outputArray[i] =
                rawData.charCodeAt(i);

        }

        return outputArray;
    }


    /* =====================================================
       REGISTER SERVICE WORKER
    ===================================================== */

    async function registerServiceWorker() {

        if (
            !("serviceWorker" in navigator)
        ) {

            console.warn(
                "FINORA: Service workers are not supported."
            );

            return null;
        }


        try {

            const registration =
                await navigator.serviceWorker.register(
                    "/service-worker.js"
                );


            await navigator.serviceWorker.ready;


            console.log(
                "FINORA: Service worker ready."
            );


            return registration;

        } catch (error) {

            console.error(
                "FINORA: Service worker registration failed:",
                error
            );

            return null;
        }

    }


    /* =====================================================
       ENABLE PUSH NOTIFICATIONS
    ===================================================== */

    async function enablePushNotifications() {

        if (
            !("Notification" in window)
        ) {

            console.warn(
                "FINORA: Browser notifications are not supported."
            );

            return;
        }


        if (
            !("PushManager" in window)
        ) {

            console.warn(
                "FINORA: Push notifications are not supported."
            );

            return;
        }


        const permission =
            await Notification.requestPermission();


        if (
            permission !== "granted"
        ) {

            console.log(
                "FINORA: Notification permission was not granted."
            );

            return;
        }


        const registration =
            await registerServiceWorker();


        if (!registration) {
            return;
        }


        try {

            let subscription =
                await registration.pushManager
                    .getSubscription();


            if (!subscription) {

                subscription =
                    await registration.pushManager.subscribe({

                        userVisibleOnly:
                            true,

                        applicationServerKey:
                            urlBase64ToUint8Array(
                                VAPID_PUBLIC_KEY
                            )

                    });

            }


            const response =
                await fetch(
                    BACKEND_URL +
                    "/api/push/subscribe",
                    {

                        method:
                            "POST",

                        credentials:
                            "include",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"

                        },

                        body:
                            JSON.stringify(
                                subscription
                            )

                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    result.message ||
                    "FINORA could not save the push subscription."
                );

            }


            console.log(
                "FINORA: Device push notifications enabled.",
                result
            );


        } catch (error) {

            console.error(
                "FINORA: Push notification setup failed:",
                error
            );

        }

    }


    /* =====================================================
       START AFTER PAGE LOAD
    ===================================================== */

    window.addEventListener(
        "load",
        function () {

            enablePushNotifications();

        }
    );


})();
