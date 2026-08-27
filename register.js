document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       FINORA REGISTER.JS
       COMPLETE REGISTRATION VERSION
    ===================================================== */

    console.log("====================================");
    console.log("FINORA REGISTER.JS LOADED");
    console.log("====================================");


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
    const confirmPassword =
        document.getElementById("confirmPassword");

    const referralCode =
        document.getElementById("referralCode");

    const terms =
        document.getElementById("terms");


    /* =====================================================
       FINORA BACKEND
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
       REQUIRED ELEMENT CHECK
    ===================================================== */

    if (!form) {

        console.error(
            "FINORA ERROR: registerForm NOT FOUND"
        );

        return;
    }

    if (!createButton) {

        console.error(
            "FINORA ERROR: createButton NOT FOUND"
        );

        return;
    }


    /* =====================================================
       STATUS MESSAGE
    ===================================================== */

    function showStatus(message, type) {

        if (!formStatus) {
            console.log("FINORA STATUS:", message);
            return;
        }

        formStatus.textContent = message;

        formStatus.className = "form-status";

        if (type) {
            formStatus.classList.add(type);
        }

        console.log(
            "FINORA STATUS:",
            message
        );
    }


    /* =====================================================
       RESET BUTTON
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
                        "FINORA PASSWORD TARGET NOT FOUND:",
                        targetId
                    );

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
                    /[^A-Za-z0-9]/.test(value)
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


                if (!confirmPassword.value) {

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
       FORM SUBMISSION
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
               CLEAR STATUS
            ================================================= */

            showStatus("", "");


            /* =================================================
               VALIDATE NAME
            ================================================= */

            if (nameValue.length < 2) {

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
               DISABLE BUTTON
            ================================================= */

            createButton.disabled = true;

            createButton.textContent =
                "CREATING ACCOUNT...";


            showStatus(
                "Connecting to FINORA server...",
                ""
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


            /* =================================================
               TIMEOUT
            ================================================= */

            const controller =
                new AbortController();

            const timeoutId =
                setTimeout(
                    function () {

                        console.error(
                            "FINORA: REQUEST TIMED OUT"
                        );

                        controller.abort();

                    },
                    15000
                );


            try {

                /* =============================================
                   SEND REQUEST
                ============================================= */

                showStatus(
                    "Sending registration request...",
                    ""
                );


                console.log(
                    "FINORA FETCH START"
                );

                console.log(
                    "POST:",
                    REGISTER_URL
                );


                const response =
                    await fetch(
                        REGISTER_URL,
                        {

                            method:
                                "POST",

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
                   RESPONSE RECEIVED
                ============================================= */

                console.log(
                    "FINORA FETCH FINISHED"
                );

                console.log(
                    "FINORA HTTP STATUS:",
                    response.status
                );


                showStatus(
                    "Server responded. Reading response...",
                    ""
                );


                /* =============================================
                   READ RESPONSE
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
                   PARSE JSON
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
                   SERVER REJECTED REGISTRATION
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
                   SUCCESS
                ============================================= */

                console.log(
                    "===================================="
                );

                console.log(
                    "FINORA ACCOUNT CREATED"
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

                    console.log(
                        "FINORA USER SAVED TO LOCAL STORAGE"
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


                /* =============================================
                   CLEAR PASSWORDS
                ============================================= */

                password.value = "";

                confirmPassword.value = "";


                /* =============================================
                   REDIRECT TO LOGIN
                ============================================= */

                console.log(
                    "FINORA: Redirecting to login.html"
                );


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
                        "The FINORA server did not respond within 15 seconds.",
                        "error"
                    );

                } else {

                    showStatus(
                        "Unable to connect to the FINORA server. " +
                        error.message,
                        "error"
                    );

                }


                resetButton();

            }

        }
    );


    /* =====================================================
       INITIALIZATION COMPLETE
    ===================================================== */

    console.log(
        "===================================="
    );

    console.log(
        "FINORA REGISTER.JS INITIALIZED"
    );

    console.log(
        "===================================="

    );

});
