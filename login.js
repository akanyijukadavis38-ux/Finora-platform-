document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       FINORA LOGIN.JS
    ========================================= */

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


    /* =========================================
       FINORA BACKEND
    ========================================= */

    const API_URL =
    "https://finora-platform-production.up.railway.app";


    /* =========================================
       CHECK FORM
    ========================================= */

    if (!form) {

        console.error(
            "FINORA: loginForm was not found."
        );

        return;
    }


    if (!identifier) {

        console.error(
            "FINORA: loginIdentifier was not found."
        );

        return;
    }


    if (!password) {

        console.error(
            "FINORA: loginPassword was not found."
        );

        return;
    }


    /* =========================================
       PASSWORD SHOW / HIDE
    ========================================= */

    document
        .querySelectorAll(".toggle-password")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

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


    /* =========================================
       LOGIN SUBMISSION
    ========================================= */

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();
            event.stopPropagation();


            /* =================================
               READ VALUES
            ================================= */

            const identifierValue =
                identifier.value.trim();

            const passwordValue =
                password.value;


            /* =================================
               CLEAR OLD STATUS
            ================================= */

            if (formStatus) {

                formStatus.textContent =
                    "";

                formStatus.className =
                    "form-status";

            }


            /* =================================
               VALIDATE IDENTIFIER
            ================================= */

            if (!identifierValue) {

                showError(
                    "Please enter your phone number or email address."
                );

                identifier.focus();

                return;
            }


            /* =================================
               VALIDATE PASSWORD
            ================================= */

            if (!passwordValue) {

                showError(
                    "Please enter your password."
                );

                password.focus();

                return;
            }


            /* =================================
               PASSWORD MINIMUM
            ================================= */

            if (
                passwordValue.length < 6
            ) {

                showError(
                    "Password must be at least 6 characters."
                );

                password.focus();

                return;
            }


            /* =================================
               START LOADING
            ================================= */

            loginButton.disabled =
                true;

            loginButton.textContent =
                "LOGGING IN...";


            if (formStatus) {

                formStatus.textContent =
                    "Signing you in...";

                formStatus.className =
                    "form-status";

            }


            /* =================================
               SERVER TIMEOUT
            ================================= */

            const controller =
                new AbortController();

            const timeout =
                setTimeout(function () {

                    controller.abort();

                }, 30000);


            try {

                /* =================================
                   SEND LOGIN TO FINORA SERVER

                   IMPORTANT:
                   credentials: "include"
                   allows the browser to keep
                   and send the FINORA session
                   cookie created by server.js.
                ================================= */

                const response =
                    await fetch(
                        API_URL +
                        "/api/Users/login",
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


                clearTimeout(timeout);


                /* =================================
                   READ SERVER RESPONSE
                ================================= */

                const responseText =
                    await response.text();


                console.log(
                    "FINORA LOGIN STATUS:",
                    response.status
                );


                console.log(
                    "FINORA LOGIN RESPONSE:",
                    responseText
                );


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
                        "The FINORA server returned an invalid response."
                    );

                    resetLoginButton();

                    return;
                }


                /* =================================
                   LOGIN FAILED
                ================================= */

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


                /* =================================
                   LOGIN SUCCESS
                ================================= */

                console.log(
                    "FINORA: LOGIN SUCCESS"
                );


                console.log(
                    "FINORA: Session created successfully."
                );


                /* =================================
                   SHOW SUCCESS MESSAGE
                ================================= */

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


                /* =================================
                   REDIRECT TO DASHBOARD
                   
                   NO LOCAL STORAGE
                ================================= */

                setTimeout(function () {

                    window.location.href =
                        "dashboard.html";

                }, 1200);

            }


            /* =================================
               CONNECTION ERROR
            ================================= */

            catch (error) {

                clearTimeout(timeout);


                console.error(
                    "FINORA LOGIN ERROR:",
                    error
                );


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


    /* =========================================
       SHOW ERROR
    ========================================= */

    function showError(message) {

        if (!formStatus) {
            return;
        }

        formStatus.textContent =
            message;

        formStatus.className =
            "form-status error";

    }


    /* =========================================
       RESET LOGIN BUTTON
    ========================================= */

    function resetLoginButton() {

        loginButton.disabled =
            false;

        loginButton.textContent =
            "LOGIN TO FINORA";

    }

});
