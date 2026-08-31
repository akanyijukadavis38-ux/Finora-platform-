document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       FINORA LOGIN.JS
       FINAL RAILWAY + VERCEL VERSION
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
       BASIC CHECK
    ===================================================== */

    if (!form) {
        console.error("FINORA: loginForm not found.");
        return;
    }

    if (!loginButton) {
        console.error("FINORA: loginButton not found.");
        return;
    }

    if (!identifier) {
        console.error("FINORA: loginIdentifier not found.");
        return;
    }

    if (!password) {
        console.error("FINORA: loginPassword not found.");
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
                        button.getAttribute("data-target");

                    const target =
                        document.getElementById(targetId);

                    if (!target) {
                        return;
                    }

                    if (target.type === "password") {

                        target.type = "text";

                        button.textContent = "🙈";

                        button.setAttribute(
                            "aria-label",
                            "Hide password"
                        );

                    } else {

                        target.type = "password";

                        button.textContent = "👁";

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
               CLEAR STATUS
            ================================================= */

            if (formStatus) {

                formStatus.textContent = "";

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


            if (passwordValue.length < 6) {

                showError(
                    "Password must be at least 6 characters."
                );

                password.focus();

                return;
            }


            /* =================================================
               LOADING
            ================================================= */

            loginButton.disabled = true;

            loginButton.textContent =
                "LOGGING IN...";


            showStatus(
                "Connecting to FINORA...",
                ""
            );


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

                   credentials: include
                   Required for FINORA session cookies.
                ================================================= */

                const response =
                    await fetch(
                        LOGIN_URL,
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"
                            },

                            credentials: "include",

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


                clearTimeout(timeoutId);


                console.log(
                    "FINORA HTTP STATUS:",
                    response.status
                );


                /* =================================================
                   READ RESPONSE
                ================================================= */

                const responseText =
                    await response.text();


                console.log(
                    "FINORA RAW RESPONSE:",
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
                        "FINORA JSON ERROR:",
                        jsonError
                    );

                    showError(
                        "FINORA returned an invalid server response."
                    );

                    resetLoginButton();

                    return;
                }


                console.log(
                    "FINORA SERVER DATA:",
                    data
                );


                /* =================================================
                   SERVER REJECTED LOGIN
                ================================================= */

                if (!response.ok) {

                    showError(
                        data.message ||
                        "Login failed. Please check your details."
                    );

                    resetLoginButton();

                    return;
                }


                /* =================================================
                   SUCCESS CHECK
                ================================================= */

                if (data.success !== true) {

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
                    "USER:",
                    data.user
                );

                console.log(
                    "===================================="
                );


                /* =================================================
                   SAVE USER FOR DASHBOARD COMPATIBILITY
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
                            "FINORA STORAGE ERROR:",
                            storageError
                        );
                    }
                }


                /* =================================================
                   SUCCESS MESSAGE
                ================================================= */

                showStatus(
                    "Login successful. Opening your dashboard...",
                    "success"
                );


                loginButton.disabled = true;

                loginButton.textContent =
                    "LOGIN SUCCESSFUL ✓";


                /* =================================================
                   DASHBOARD
                ================================================= */

                setTimeout(
                    function () {

                        window.location.href =
                            "dashboard.html";

                    },
                    1000
                );

            }


            /* =====================================================
               CONNECTION / CORS / NETWORK ERROR
            ===================================================== */

            catch (error) {

                clearTimeout(timeoutId);


                console.error(
                    "===================================="
                );

                console.error(
                    "FINORA LOGIN FETCH ERROR"
                );

                console.error(
                    "ERROR NAME:",
                    error.name
                );

                console.error(
                    "ERROR MESSAGE:",
                    error.message
                );

                console.error(
                    "===================================="
                );


                /* =================================================
                   TIMEOUT
                ================================================= */

                if (
                    error.name === "AbortError"
                ) {

                    showError(
                        "FINORA server took too long to respond. Please try again."
                    );

                }


                /* =================================================
                   CORS / NETWORK
                ================================================= */

                else {

                    showError(
                        "FINORA could not connect to the login service. Please check the backend connection."
                    );

                }


                resetLoginButton();
            }

        }
    );


    /* =====================================================
       SHOW STATUS
    ===================================================== */

    function showStatus(message, type) {

        if (!formStatus) {
            return;
        }

        formStatus.textContent =
            message;

        formStatus.className =
            "form-status";

        if (type) {

            formStatus.classList.add(
                type
            );
        }
    }


    /* =====================================================
       SHOW ERROR
    ===================================================== */

    function showError(message) {

        showStatus(
            message,
            "error"
        );
    }


    /* =====================================================
       RESET BUTTON
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
