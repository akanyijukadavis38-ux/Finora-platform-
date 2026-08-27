document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       FINORA REGISTER.JS
       COMPLETE DEBUG REGISTRATION VERSION
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
       BASIC CHECK
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

        formStatus.className =
            "form-status" +
            (type ? " " + type : "");

        console.log(
            "FINORA STATUS:",
            message
        );
    }


    /* =====================================================
       BUTTON RESET
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
        document.querySelectorAll(".toggle-password");

    console.log(
        "FINORA PASSWORD BUTTONS:",
        toggleButtons.length
    );


    toggleButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                const targetId =
                    button.getAttribute("data-target");

                const target =
                    document.getElementById(targetId);

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

                const value = password.value;

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


            console.log("====================================");
            console.log("FINORA CREATE ACCOUNT BUTTON CLICKED");
            console.log("====================================");


            showStatus(
                "Step 1: Create Account button clicked.",
                ""
            );


            /* =================================================
               READ VALUES
            ================================================= */

            const nameValue =
                fullName
                    ? fullName.value.trim()
                    : "";

            const phoneValue =
                phone
                    ? phone.value.trim()
                    : "";

            const emailValue =
                email
                    ? email.value.trim().toLowerCase()
                    : "";

            const passwordValue =
                password
                    ? password.value
                    : "";

            const confirmValue =
                confirmPassword
                    ? confirmPassword.value
                    : "";

            const referralValue =
                referralCode
                    ? referralCode.value.trim()
                    : "";


            console.log(
                "FINORA FORM VALUES READ"
            );


            /* =================================================
               VALIDATE NAME
            ================================================= */

            if (nameValue.length < 2) {

                showStatus(
                    "Please enter your full name.",
                    "error"
                );

                if (fullName) {
                    fullName.focus();
                }

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

                if (phone) {
                    phone.focus();
                }

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

                if (email) {
                    email.focus();
                }

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

                if (password) {
                    password.focus();
                }

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

                if (confirmPassword) {
                    confirmPassword.focus();
                }

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
               START REQUEST
            ================================================= */

            createButton.disabled = true;

            createButton.textContent =
                "CREATING ACCOUNT...";


            showStatus(
                "Step 2: Connecting to FINORA server...",
                ""
            );


            console.log(
                "FINORA STEP 2: CONNECTING"
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
                            "FINORA REQUEST TIMED OUT"
                        );

                        controller.abort();

                    },
                    20000
                );


            try {

                /* =============================================
                   SEND POST REQUEST
                ============================================= */

                showStatus(
                    "Step 3: Sending registration request...",
                    ""
                );


                console.log(
                    "FINORA STEP 3: FETCH START"
                );

                console.log(
                    "POST:",
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
                   RESPONSE RECEIVED
                ============================================= */

                console.log(
                    "FINORA STEP 4: RESPONSE RECEIVED"
                );

                console.log(
                    "HTTP STATUS:",
                    response.status
                );


                showStatus(
                    "Step 4: FINORA server responded.",
                    ""
                );


                /* =============================================
                   READ RESPONSE
                ============================================= */

                const responseText =
                    await response.text();


                console.log(
                    "FINORA RAW SERVER RESPONSE:",
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
                        "FINORA JSON ERROR:",
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
                    "FINORA PARSED DATA:",
                    data
                );


                /* =============================================
                   SERVER REJECTED REQUEST
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


                showStatus(
                    "Step 5: Account created successfully!",
                    "success"
                );


                /* =============================================
                   SAVE USER
                ============================================= */

                if (data.user) {

                    try {

                        localStorage.setItem(
                            "finoraCurrentUser",
                            JSON.stringify(
                                data.user
                            )
                        );

                        console.log(
                            "FINORA USER SAVED TO LOCAL STORAGE"
                        );

                    } catch (storageError) {

                        console.error(
                            "FINORA LOCAL STORAGE ERROR:",
                            storageError
                        );

                    }

                }


                /* =============================================
                   SUCCESS BUTTON
                ============================================= */

                createButton.disabled = true;

                createButton.textContent =
                    "ACCOUNT CREATED ✓";


                if (password) {
                    password.value = "";
                }

                if (confirmPassword) {
                    confirmPassword.value = "";
                }


                /* =============================================
                   LOGIN REDIRECT
                ============================================= */

                showStatus(
                    "Step 6: Account created. Opening login page...",
                    "success"
                );


                console.log(
                    "FINORA: REDIRECTING TO login.html"
                );


                setTimeout(
                    function () {

                        window.location.href =
                            "login.html";

                    },
                    1500
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


                if (
                    error.name ===
                    "AbortError"
                ) {

                    showStatus(
                        "FINORA server did not respond within 20 seconds. The registration request is hanging.",
                        "error"
                    );

                } else {

                    showStatus(
                        "Unable to connect to FINORA server: " +
                        error.message,
                        "error"
                    );

                }


                resetButton();

            }

        }
    );


    /* =====================================================
       READY
    ===================================================== */

    console.log(
        "===================================="
    );

    console.log(
        "FINORA REGISTER.JS READY"
    );

    console.log(
        "Form:",
        !!form
    );

    console.log(
        "Create Button:",
        !!createButton
    );

    console.log(
        "Password Toggles:",
        toggleButtons.length
    );

    console.log(
        "===================================="

    );

});
