document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       FINORA REGISTER.JS
       FINAL DEBUG + REGISTRATION VERSION
    ===================================================== */

    console.log("FINORA REGISTER.JS LOADED");


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const form = document.getElementById("registerForm");
    const createButton = document.getElementById("createButton");
    const formStatus = document.getElementById("formStatus");

    const fullName = document.getElementById("fullName");
    const phone = document.getElementById("phone");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    const referralCode = document.getElementById("referralCode");
    const terms = document.getElementById("terms");


    /* =====================================================
       RAILWAY BACKEND
    ===================================================== */

    const API_URL =
        "https://finora-platform-production.up.railway.app";


    const REGISTER_URL =
        API_URL + "/api/users/register";


    console.log(
        "FINORA REGISTER URL:",
        REGISTER_URL
    );


    /* =====================================================
       BASIC ELEMENT CHECK
    ===================================================== */

    if (!form) {

        console.error(
            "FINORA ERROR: registerForm not found."
        );

        return;
    }

    if (!createButton) {

        console.error(
            "FINORA ERROR: createButton not found."
        );

        return;
    }


    /* =====================================================
       HELPER: SHOW STATUS
    ===================================================== */

    function showStatus(message, type) {

        if (!formStatus) {
            return;
        }

        formStatus.textContent = message;

        formStatus.className =
            "form-status" +
            (type ? " " + type : "");

        console.log(
            "FINORA STATUS:",
            message
        );
    }


    /* =====================================================
       HELPER: RESET BUTTON
    ===================================================== */

    function resetButton() {

        createButton.disabled = false;

        createButton.textContent =
            "CREATE FINORA ACCOUNT";
    }


    /* =====================================================
       PASSWORD SHOW / HIDE
    ===================================================== */

    const toggleButtons =
        document.querySelectorAll(
            ".toggle-password"
        );


    console.log(
        "FINORA PASSWORD TOGGLES FOUND:",
        toggleButtons.length
    );


    toggleButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                const targetId =
                    button.getAttribute(
                        "data-target"
                    );

                const target =
                    document.getElementById(
                        targetId
                    );

                if (!target) {

                    console.error(
                        "FINORA: Password target not found:",
                        targetId
                    );

                    return;
                }


                if (
                    target.type ===
                    "password"
                ) {

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
       PASSWORD STRENGTH
    ===================================================== */

    if (password) {

        password.addEventListener(
            "input",
            function () {

                const value =
                    password.value;

                const bars =
                    document.querySelectorAll(
                        ".strength-bar"
                    );

                const strengthText =
                    document.getElementById(
                        "strengthText"
                    );

                let score = 0;


                if (value.length >= 6) {
                    score++;
                }

                if (/[A-Z]/.test(value)) {
                    score++;
                }

                if (/[0-9]/.test(value)) {
                    score++;
                }

                if (
                    /[^A-Za-z0-9]/.test(
                        value
                    )
                ) {
                    score++;
                }


                bars.forEach(
                    function (bar, index) {

                        if (index < score) {

                            bar.classList.add(
                                "active"
                            );

                        } else {

                            bar.classList.remove(
                                "active"
                            );

                        }

                    }
                );


                if (!strengthText) {
                    return;
                }


                if (!value) {

                    strengthText.textContent =
                        "Password strength";

                } else if (score === 1) {

                    strengthText.textContent =
                        "Weak";

                } else if (score === 2) {

                    strengthText.textContent =
                        "Fair";

                } else if (score === 3) {

                    strengthText.textContent =
                        "Good";

                } else {

                    strengthText.textContent =
                        "Strong";

                }

            }
        );

    }


    /* =====================================================
       CONFIRM PASSWORD
    ===================================================== */

    if (confirmPassword) {

        confirmPassword.addEventListener(
            "input",
            function () {

                const message =
                    document.getElementById(
                        "confirmMessage"
                    );

                if (!message) {
                    return;
                }


                if (
                    !confirmPassword.value
                ) {

                    message.textContent = "";

                    message.className =
                        "field-message";

                    return;
                }


                if (
                    password.value !==
                    confirmPassword.value
                ) {

                    message.textContent =
                        "Passwords do not match.";

                    message.className =
                        "field-message error";

                } else {

                    message.textContent =
                        "Passwords match.";

                    message.className =
                        "field-message success";

                }

            }
        );

    }


    /* =====================================================
       FORM SUBMIT
    ===================================================== */

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();
            event.stopPropagation();


            console.log(
                "===================================="
            );

            console.log(
                "FINORA REGISTRATION STARTED"
            );

            console.log(
                "===================================="
            );


            /* =================================================
               READ VALUES
            ================================================= */

            const nameValue =
                fullName.value.trim();

            const phoneValue =
                phone.value.trim();

            const emailValue =
                email.value
                    .trim()
                    .toLowerCase();

            const passwordValue =
                password.value;

            const confirmValue =
                confirmPassword.value;

            const referralValue =
                referralCode
                    ? referralCode.value.trim()
                    : "";


            /* =================================================
               CLEAR OLD STATUS
            ================================================= */

            showStatus("", "");


            /* =================================================
               VALIDATE NAME
            ================================================= */

            if (
                nameValue.length < 2
            ) {

                showStatus(
                    "Please enter your full name.",
                    "error"
                );

                fullName.focus();

                return;
            }


            /* =================================================
               VALIDATE PHONE
            ================================================= */

            if (
                !/^07[0-9]{8}$/.test(
                    phoneValue
                )
            ) {

                showStatus(
                    "Enter a valid Uganda phone number, e.g. 0701234567.",
                    "error"
                );

                phone.focus();

                return;
            }


            /* =================================================
               VALIDATE EMAIL
            ================================================= */

            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    emailValue
                )
            ) {

                showStatus(
                    "Please enter a valid email address.",
                    "error"
                );

                email.focus();

                return;
            }


            /* =================================================
               VALIDATE PASSWORD
            ================================================= */

            if (
                passwordValue.length < 6
            ) {

                showStatus(
                    "Password must contain at least 6 characters.",
                    "error"
                );

                password.focus();

                return;
            }


            /* =================================================
               CONFIRM PASSWORD
            ================================================= */

            if (
                passwordValue !==
                confirmValue
            ) {

                showStatus(
                    "Passwords do not match.",
                    "error"
                );

                confirmPassword.focus();

                return;
            }


            /* =================================================
               TERMS
            ================================================= */

            if (
                terms &&
                !terms.checked
            ) {

                showStatus(
                    "Please agree to the Terms & Conditions and Privacy Policy.",
                    "error"
                );

                return;
            }


            /* =================================================
               START LOADING
            ================================================= */

            createButton.disabled = true;

            createButton.textContent =
                "CREATING ACCOUNT...";


            showStatus(
                "Connecting to FINORA server...",
                ""
            );


            console.log(
                "FINORA: Preparing request..."
            );


            /* =================================================
               REQUEST TIMEOUT
            ================================================= */

            const controller =
                new AbortController();

            const timeoutId =
                setTimeout(
                    function () {

                        console.error(
                            "FINORA: REQUEST TIMEOUT"
                        );

                        controller.abort();

                    },
                    15000
                );


            /* =================================================
               REQUEST BODY
            ================================================= */

            const requestBody = {

                fullName:
                    nameValue,

                phone:
                    phoneValue,

                email:
                    emailValue,

                password:
                    passwordValue,

                confirmPassword:
                    confirmValue,

                referralCode:
                    referralValue || null

            };


            console.log(
                "FINORA REQUEST BODY:",
                {
                    fullName: nameValue,
                    phone: phoneValue,
                    email: emailValue,
                    referralCode:
                        referralValue || null
                }
            );


            try {

                /* =============================================
                   STEP 1 — SEND REQUEST
                ============================================= */

                showStatus(
                    "Sending registration request...",
                    ""
                );


                console.log(
                    "FINORA: FETCH START"
                );

                console.log(
                    "URL:",
                    REGISTER_URL
                );


                const response =
                    await fetch(
                        REGISTER_URL,
                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Accept":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    requestBody
                                ),

                            signal:
                                controller.signal

                        }
                    );


                clearTimeout(
                    timeoutId
                );


                /* =============================================
                   STEP 2 — RESPONSE RECEIVED
                ============================================= */

                console.log(
                    "FINORA: FETCH FINISHED"
                );

                console.log(
                    "FINORA HTTP STATUS:",
                    response.status
                );


                showStatus(
                    "FINORA server responded. Reading response...",
                    ""
                );


                /* =============================================
                   STEP 3 — READ RESPONSE
                ============================================= */

                const responseText =
                    await response.text();


                console.log(
                    "FINORA RAW RESPONSE:",
                    responseText
                );


                if (!responseText) {

                    showStatus(
                        "FINORA server returned an empty response.",
                        "error"
                    );

                    resetButton();

                    return;
                }


                /* =============================================
                   STEP 4 — PARSE JSON
                ============================================= */

                let data;

                try {

                    data =
                        JSON.parse(
                            responseText
                        );

                } catch (jsonError) {

                    console.error(
                        "FINORA JSON PARSE ERROR:",
                        jsonError
                    );

                    showStatus(
                        "FINORA returned an invalid server response.",
                        "error"
                    );

                    resetButton();

                    return;
                }


                console.log(
                    "FINORA PARSED RESPONSE:",
                    data
                );


                /* =============================================
                   STEP 5 — SERVER ERROR
                ============================================= */

                if (
                    !response.ok ||
                    data.success !== true
                ) {

                    showStatus(
                        data.message ||
                        "Unable to create your FINORA account.",
                        "error"
                    );

                    resetButton();

                    return;
                }


                /* =============================================
                   STEP 6 — SUCCESS
                ============================================= */

                console.log(
                    "===================================="
                );

                console.log(
                    "FINORA ACCOUNT CREATED SUCCESSFULLY"
                );

                console.log(
                    data.user
                );

                console.log(
                    "===================================="
                );


                /* =============================================
                   SAVE USER
                ============================================= */

                if (data.user) {

                    localStorage.setItem(
                        "finoraCurrentUser",
                        JSON.stringify(
                            data.user
                        )
                    );

                }


                /* =============================================
                   SUCCESS MESSAGE
                ============================================= */

                showStatus(
                    "Account created successfully! Redirecting to login...",
                    "success"
                );


                createButton.disabled = true;

                createButton.textContent =
                    "ACCOUNT CREATED ✓";


                password.value = "";

                confirmPassword.value = "";


                /* =============================================
                   LOGIN REDIRECT
                ============================================= */

                setTimeout(
                    function () {

                        window.location.href =
                            "login.html";

                    },
                    1200
                );

            } catch (error) {

                clearTimeout(
                    timeoutId
                );


                console.error(
                    "===================================="
                );

                console.error(
                    "FINORA REGISTRATION ERROR"
                );

                console.error(
                    error
                );

                console.error(
                    "===================================="
                );


                /* =============================================
                   TIMEOUT
                ============================================= */

                if (
                    error.name ===
                    "AbortError"
                ) {

                    showStatus(
                        "FINORA server did not respond within 15 seconds. The registration request is hanging.",
                        "error"
                    );

                } else {

                    showStatus(
                        "Unable to connect to the FINORA server: " +
                        error.message,
                        "error"
                    );

                }


                resetButton();

            }

        }
    );


    /* =====================================================
       FINAL INITIALIZATION MESSAGE
    ===================================================== */

    console.log(
        "FINORA REGISTER.JS INITIALIZED SUCCESSFULLY"
    );

});
