document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       FINORA LOGIN.JS
       SESSION-AWARE VERSION
    ===================================================== */

    const form =
        document.getElementById("loginForm");

    const loginButton =
        document.getElementById("loginButton");

    const formStatus =
        document.getElementById("formStatus");

    const identifier =
        document.getElementById("loginIdentifier");

    const password =
        document.getElementById("loginPassword");


    /* =====================================================
       FINORA BACKEND
    ===================================================== */

    const API_URL =
        "https://finora-platform-production.up.railway.app";

    const LOGIN_URL =
        API_URL + "/api/users/login";


    console.log("====================================");
    console.log("FINORA LOGIN.JS LOADED");
    console.log("FINORA LOGIN URL:", LOGIN_URL);
    console.log("====================================");


    /* =====================================================
       BASIC ELEMENT CHECK
    ===================================================== */

    if (!form) {
        console.error(
            "FINORA ERROR: loginForm was not found."
        );
        return;
    }

    if (!loginButton) {
        console.error(
            "FINORA ERROR: loginButton was not found."
        );
        return;
    }

    if (!identifier) {
        console.error(
            "FINORA ERROR: loginIdentifier was not found."
        );
        return;
    }

    if (!password) {
        console.error(
            "FINORA ERROR: loginPassword was not found."
        );
        return;
    }


    /* =====================================================
       PASSWORD SHOW / HIDE
    ===================================================== */

    document
        .querySelectorAll(".toggle-password")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    const targetId =
                        button.getAttribute(
                            "data-target"
                        );

                    const target =
                        document.getElementById(
                            targetId
                        );

                    if (!target) {
                        return;
                    }

                    if (
                        target.type ===
                        "password"
                    ) {

                        target.type =
                            "text";

                        button.textContent =
                            "🙈";

                        button.setAttribute(
                            "aria-label",
                            "Hide password"
                        );

                    } else {

                        target.type =
                            "password";

                        button.textContent =
                            "👁";

                        button.setAttribute(
                            "aria-label",
                            "Show password"
                        );
                    }
                }
            );

        });


    /* =====================================================
       LOGIN FORM
    ===================================================== */

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();
            event.stopPropagation();


            /* =================================================
               READ VALUES
            ================================================= */

            const identifierValue =
                identifier.value.trim();

            const passwordValue =
                password.value;


            /* =================================================
               CLEAR OLD STATUS
            ================================================= */

            if (formStatus) {

                formStatus.textContent =
                    "";

                formStatus.className =
                    "form-status";
            }


            /* =================================================
               VALIDATE IDENTIFIER
            ================================================= */

            if (!identifierValue) {

                showError(
                    "Please enter your phone number or email address."
                );

                identifier.focus();

                return;
            }


            /* =================================================
               VALIDATE PASSWORD
            ================================================= */

            if (!passwordValue) {

                showError(
                    "Please enter your password."
                );

                password.focus();

                return;
            }


            if (
                passwordValue.length < 6
            ) {

                showError(
                    "Password must be at least 6 characters."
                );

                password.focus();

                return;
            }


            /* =================================================
               START LOGIN
            ================================================= */

            loginButton.disabled =
                true;

            loginButton.textContent =
                "LOGGING IN...";


            if (formStatus) {

                formStatus.textContent =
                    "Connecting to FINORA...";

                formStatus.className =
                    "form-status";
            }


            /* =================================================
               TIMEOUT
            ================================================= */

            const controller =
                new AbortController();

            const timeoutId =
                setTimeout(
                    function () {

                        controller.abort();

                    },
                    30000
                );


            try {

                console.log(
                    "FINORA: Sending login request..."
                );

                console.log(
                    "FINORA LOGIN URL:",
                    LOGIN_URL
                );


                /* =================================================
                   LOGIN REQUEST

                   IMPORTANT:
                   credentials: "include"

                   This allows the browser to receive
                   and send the FINORA session cookie.
                ================================================= */

                const response =
                    await fetch(
                        LOGIN_URL,
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            credentials:
                                "include",

                            body:
                                JSON.stringify({

                                    identifier:
                                        identifierValue,

                                    password:
                                        passwordValue

                                }),

                            signal:
                                controller.signal
                        }
                    );


                clearTimeout(
                    timeoutId
                );


                console.log(
                    "FINORA LOGIN HTTP STATUS:",
                    response.status
                );


                /* =================================================
                   READ SERVER RESPONSE
                ================================================= */

                const responseText =
                    await response.text();


                console.log(
                    "FINORA LOGIN RAW RESPONSE:",
                    responseText
                );


                /* =================================================
                   EMPTY RESPONSE
                ================================================= */

                if (!responseText) {

                    showError(
                        "FINORA server returned an empty response."
                    );

                    resetLoginButton();

                    return;
                }


                /* =================================================
                   PARSE JSON
                ================================================= */

                let data;

                try {

                    data =
                        JSON.parse(
                            responseText
                        );

                } catch (jsonError) {

                    console.error(
                        "FINORA LOGIN JSON ERROR:",
                        jsonError
                    );

                    showError(
                        "FINORA server returned an invalid response."
                    );

                    resetLoginButton();

                    return;
                }


                console.log(
                    "FINORA LOGIN DATA:",
                    data
                );


                /* =================================================
                   LOGIN FAILED
                ================================================= */

                if (
                    !response.ok ||
                    data.success !== true
                ) {

                    showError(
                        data.message ||
                        "Invalid login details."
                    );

                    resetLoginButton();

                    return;
                }


                /* =================================================
                   LOGIN SUCCESS
                ================================================= */

                console.log(
                    "===================================="
                );

                console.log(
                    "FINORA LOGIN SUCCESS"
                );

                console.log(
                    "Authenticated user:",
                    data.user
                );

                console.log(
                    "===================================="
                );


                /* =================================================
                   SAVE CURRENT USER

                   This is only for dashboard compatibility.
                   The real authentication is the server session.
                ================================================= */

                if (data.user) {

                    try {

                        localStorage.setItem(
                            "finoraCurrentUser",
                            JSON.stringify(
                                data.user
                            )
                        );

                    } catch (storageError) {

                        console.error(
                            "FINORA LOCAL STORAGE ERROR:",
                            storageError
                        );
                    }
                }


                /* =================================================
                   SUCCESS MESSAGE
                ================================================= */

                if (formStatus) {

                    formStatus.textContent =
                        "Login successful. Opening your dashboard...";

                    formStatus.className =
                        "form-status success";
                }


                loginButton.disabled =
                    true;

                loginButton.textContent =
                    "LOGIN SUCCESSFUL ✓";


                /* =================================================
                   DASHBOARD REDIRECT
                ================================================= */

                setTimeout(
                    function () {

                        window.location.href =
                            "dashboard.html";

                    },
                    1000
                );

            } catch (error) {

                clearTimeout(
                    timeoutId
                );


                console.error(
                    "===================================="
                );

                console.error(
                    "FINORA LOGIN CONNECTION ERROR"
                );

                console.error(
                    error
                );

                console.error(
                    "===================================="
                );


                /* =================================================
                   TIMEOUT
                ================================================= */

                if (
                    error.name ===
                    "AbortError"
                ) {

                    showError(
                        "The FINORA server took too long to respond. Please try again."
                    );

                } else {

                    showError(
                        "Unable to connect to the FINORA server. Please try again."
                    );
                }


                resetLoginButton();
            }
        }
    );


    /* =====================================================
       SHOW ERROR
    ===================================================== */

    function showError(message) {

        if (!formStatus) {
            return;
        }

        formStatus.textContent =
            message;

        formStatus.className =
            "form-status error";
    }


    /* =====================================================
       RESET LOGIN BUTTON
    ===================================================== */

    function resetLoginButton() {

        loginButton.disabled =
            false;

        loginButton.textContent =
            "LOGIN TO FINORA";
    }


    /* =====================================================
       READY
    ===================================================== */

    console.log(
        "FINORA LOGIN.JS READY"
    );

});
