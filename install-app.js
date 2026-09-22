/* =====================================================
   FINORA INSTALL APP
   ===================================================== */

(function () {

    "use strict";

    const DISMISS_KEY =
        "finora_install_dismissed_at";

    const DISMISS_DURATION =
        24 * 60 * 60 * 1000;

    let deferredInstallPrompt = null;


    /* =================================================
       CHECK IF FINORA IS ALREADY INSTALLED
    ================================================= */

    function isAppInstalled() {

        return (
            window.matchMedia(
                "(display-mode: standalone)"
            ).matches ||

            window.navigator.standalone === true ||

            document.referrer.startsWith(
                "android-app://"
            )
        );

    }


    /* =================================================
       CHECK 24-HOUR DISMISSAL
    ================================================= */

    function wasDismissedRecently() {

        const dismissedAt =
            localStorage.getItem(
                DISMISS_KEY
            );

        if (!dismissedAt) {
            return false;
        }

        const dismissedTime =
            Number(dismissedAt);

        if (
            !Number.isFinite(
                dismissedTime
            )
        ) {

            localStorage.removeItem(
                DISMISS_KEY
            );

            return false;
        }

        const elapsed =
            Date.now() -
            dismissedTime;

        if (
            elapsed <
            DISMISS_DURATION
        ) {

            return true;
        }

        localStorage.removeItem(
            DISMISS_KEY
        );

        return false;

    }


    /* =================================================
       CREATE INSTALL POPUP
    ================================================= */

    function createInstallPopup() {

        if (
            document.getElementById(
                "finoraInstallPopup"
            )
        ) {
            return;
        }


        const popup =
            document.createElement(
                "div"
            );

        popup.id =
            "finoraInstallPopup";

        popup.innerHTML = `

            <div class="finora-install-card">

                <button
                    type="button"
                    class="finora-install-close"
                    id="finoraInstallClose"
                    aria-label="Close"
                >
                    ×
                </button>


                <div class="finora-install-icon">

                    <span>
                        FIN
                    </span><strong>
                        ORA
                    </strong>

                </div>


                <div class="finora-install-content">

                    <div class="finora-install-title">
                        Install FINORA App
                    </div>

                    <div class="finora-install-text">
                        Quick access to your FINORA account
                    </div>

                </div>


                <button
                    type="button"
                    class="finora-install-button"
                    id="finoraInstallButton"
                >
                    INSTALL
                </button>

            </div>

        `;


        document.body.appendChild(
            popup
        );


        requestAnimationFrame(
            function () {

                popup.classList.add(
                    "show"
                );

            }
        );


        const closeButton =
            document.getElementById(
                "finoraInstallClose"
            );

        const installButton =
            document.getElementById(
                "finoraInstallButton"
            );


        /* =================================================
           CLOSE — HIDE FOR 24 HOURS
        ================================================= */

        closeButton.addEventListener(
            "click",
            function () {

                localStorage.setItem(
                    DISMISS_KEY,
                    String(Date.now())
                );

                removeInstallPopup();

            }
        );


        /* =================================================
           INSTALL
        ================================================= */

        installButton.addEventListener(
            "click",
            async function () {

                if (
                    !deferredInstallPrompt
                ) {

                    /*
                       Android may not have supplied
                       the installation prompt yet.
                    */

                    return;

                }


                deferredInstallPrompt.prompt();


                const choice =
                    await deferredInstallPrompt
                        .userChoice;


                if (
                    choice.outcome ===
                    "accepted"
                ) {

                    deferredInstallPrompt =
                        null;

                    removeInstallPopup();

                }

            }
        );

    }


    /* =================================================
       REMOVE POPUP
    ================================================= */

    function removeInstallPopup() {

        const popup =
            document.getElementById(
                "finoraInstallPopup"
            );

        if (!popup) {
            return;
        }


        popup.classList.remove(
            "show"
        );


        setTimeout(
            function () {

                popup.remove();

            },
            250
        );

    }


    /* =================================================
       BROWSER INSTALL EVENT
    ================================================= */

    window.addEventListener(
        "beforeinstallprompt",
        function (event) {

            event.preventDefault();

            deferredInstallPrompt =
                event;


            if (
                isAppInstalled() ||
                wasDismissedRecently()
            ) {
                return;
            }


            /*
               Don't show immediately.
               Give the FINORA front page time
               to load normally first.
            */

            setTimeout(
                function () {

                    if (
                        !isAppInstalled() &&
                        !wasDismissedRecently() &&
                        deferredInstallPrompt
                    ) {

                        createInstallPopup();

                    }

                },
                5000
            );

        }
    );


    /* =================================================
       APP INSTALLED
    ================================================= */

    window.addEventListener(
        "appinstalled",
        function () {

            deferredInstallPrompt =
                null;

            removeInstallPopup();

        }
    );


    /* =================================================
       INITIAL CHECK
    ================================================= */

    window.addEventListener(
        "load",
        function () {

            if (
                isAppInstalled()
            ) {

                return;
            }

        }
    );

})();
