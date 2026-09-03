/* =========================================================
   FINORA REGISTER.JS
   STABLE REGISTRATION VERSION
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function initRegister() {

        console.log("====================================");
        console.log("FINORA REGISTER.JS INITIALIZING");
        console.log("====================================");


        /* =================================================
           ELEMENTS
        ================================================= */

        const form =
            document.getElementById("registerForm");

        const createButton =
            document.getElementById("createButton");

        const formStatus =
            document.getElementById("formStatus");

        const fullName =
            document.getElementById("fullName");

        const phone =
            document.getElementById("phone");

        const email =
            document.getElementById("email");

        const password =
            document.getElementById("password");

        const confirmPassword =
            document.getElementById("confirmPassword");

        const referralCode =
            document.getElementById("referralCode");

        const terms =
            document.getElementById("terms");


        /* =================================================
           BACKEND
        ================================================= */

        const API_URL =
            "https://finora-platform-production.up.railway.app";

        const REGISTER_URL =
            API_URL + "/api/users/register";


        console.log(
            "FINORA REGISTER URL:",
            REGISTER_URL
        );


        /* =================================================
           REQUIRED ELEMENT CHECK
        ================================================= */

        if (!form) {

            console.error(
                "❌ FINORA: registerForm NOT FOUND."
            );

            return;
        }


        if (!createButton) {

            console.error(
                "❌ FINORA: createButton NOT FOUND."
            );

            return;
        }


        console.log(
            "✅ FINORA: Registration form found."
        );

        console.log(
            "✅ FINORA: Create button found."
        );


        /* =================================================
           STATUS
        ================================================= */

        function showStatus(message, type) {

            if (formStatus) {

                formStatus.textContent =
                    message;

                formStatus.className =
                    "form-status" +
                    (type
                        ? " " + type
                        : "");

            }

            console.log(
                "FINORA STATUS:",
                message
            );

        }


        /* =================================================
           BUTTON RESET
        ================================================= */

        function resetButton() {

            createButton.disabled =
                false;

            createButton.textContent =
                "CREATE FINORA ACCOUNT";

        }


        /* =================================================
           PASSWORD TOGGLE
        ================================================= */

        const toggleButtons =
            document.querySelectorAll(
                ".toggle-password"
            );


        toggleButtons.forEach(
            function (button) {

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

            }
        );


        /* =================================================
           PASSWORD STRENGTH
        ================================================= */

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


                    if (
                        value.length >= 6
                    ) {
                        score++;
                    }


                    if (
                        /[A-Z]/.test(value)
                    ) {
                        score++;
                    }


                    if (
                        /[0-9]/.test(value)
                    ) {
                        score++;
                    }


                    if (
                        /[^A-Za-z0-9]/.test(value)
                    ) {
                        score++;
                    }


                    bars.forEach(
                        function (bar, index) {

                            if (
                                index < score
                            ) {

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

                    } else if (
                        score === 1
                    ) {

                        strengthText.textContent =
                            "Weak";

                    } else if (
                        score === 2
                    ) {

                        strengthText.textContent =
                            "Fair";

                    } else if (
                        score === 3
                    ) {

                        strengthText.textContent =
                            "Good";

                    } else {

                        strengthText.textContent =
                            "Strong";

                    }

                }
            );

        }


        /* =================================================
           CONFIRM PASSWORD
        ================================================= */

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

                        message.textContent =
                            "";

                        message.className =
                            "field-message";

                        return;

                    }


                    if (
                        password &&
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


        /* =================================================
           REGISTRATION FUNCTION
        ================================================= */

        let registrationRunning =
            false;


        async function registerAccount(
            event
        ) {

            if (event) {

                event.preventDefault();
                event.stopPropagation();

            }


            console.log(
                "===================================="
            );

            console.log(
                "FINORA CREATE ACCOUNT CLICKED"
            );

            console.log(
                "===================================="
            );


            if (registrationRunning) {

                console.log(
                    "FINORA: Registration already running."
                );

                return;

            }


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


            /* =================================================
               VALIDATION
            ================================================= */

            /* FULL NAME */

            if (!nameValue) {

                showStatus(
                    "Please enter your full name.",
                    "error"
                );

                if (fullName) {
                    fullName.focus();
                }

                return;

            }


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


            /* PHONE */

            if (!phoneValue) {

                showStatus(
                    "Please enter your Uganda phone number.",
                    "error"
                );

                if (phone) {
                    phone.focus();
                }

                return;

            }


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


            /* EMAIL */

            if (!emailValue) {

                showStatus(
                    "Please enter your email address.",
                    "error"
                );

                if (email) {
                    email.focus();
                }

                return;

            }


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


            /* PASSWORD */

            if (!passwordValue) {

                showStatus(
                    "Please enter your password.",
                    "error"
                );

                if (password) {
                    password.focus();
                }

                return;

            }


            if (passwordValue.length < 6) {

                showStatus(
                    "Password must contain at least 6 characters.",
                    "error"
                );

                if (password) {
                    password.focus();
                }

                return;

            }


            /* CONFIRM PASSWORD */

            if (!confirmValue) {

                showStatus(
                    "Please confirm your password.",
                    "error"
                );

                if (confirmPassword) {
                    confirmPassword.focus();
                }

                return;

            }


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


            /* TERMS */

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
               VALIDATION PASSED
            ================================================= */

            registrationRunning =
                true;


            showStatus(
                "Step 1: Create Account button clicked.",
                ""
            );


            /* =================================================
               START LOADING
            ================================================= */

            createButton.disabled =
                true;

            createButton.textContent =
                "CREATING ACCOUNT...";


            showStatus(
                "Step 2: Connecting to FINORA server...",
                ""
            );


            console.log(
                "FINORA: Registration validation passed."
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
                    referralValue ||
                    null

            };


            console.log(
                "FINORA REGISTRATION REQUEST:",
                {
                    fullName:
                        nameValue,

                    phone:
                        phoneValue,

                    email:
                        emailValue,

                    referralCode:
                        referralValue ||
                        null
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

                        controller.abort();

                    },
                    20000
                );


            try {

                showStatus(
                    "Step 3: Sending registration request...",
                    ""
                );


                console.log(
                    "FINORA: POST REQUEST STARTING..."
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

                            credentials:
                                "include",

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


                console.log(
                    "FINORA: RESPONSE RECEIVED:",
                    response.status
                );


                showStatus(
                    "Step 4: FINORA server responded.",
                    ""
                );


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

                    registrationRunning =
                        false;

                    return;

                }


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

                    registrationRunning =
                        false;

                    return;

                }


                console.log(
                    "FINORA SERVER DATA:",
                    data
                );


                /* =================================================
                   SERVER ERROR
                ================================================= */

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

                    registrationRunning =
                        false;

                    return;

                }


                /* =================================================
                   SUCCESS
                ================================================= */

                showStatus(
                    "Step 5: Account created successfully!",
                    "success"
                );


                console.log(
                    "FINORA ACCOUNT CREATED SUCCESSFULLY"
                );


                /* =================================================
                   SAVE USER
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
                   SUCCESS BUTTON
                ================================================= */

                createButton.disabled =
                    true;

                createButton.textContent =
                    "ACCOUNT CREATED ✓";


                if (password) {
                    password.value = "";
                }


                if (confirmPassword) {
                    confirmPassword.value = "";
                }


                showStatus(
                    "Account created. Opening login page...",
                    "success"
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
                    "❌ FINORA REGISTRATION ERROR:",
                    error
                );


                if (
                    error &&
                    error.name ===
                    "AbortError"
                ) {

                    showStatus(
                        "FINORA server did not respond within 20 seconds.",
                        "error"
                    );

                } else {

                    showStatus(
                        "Unable to connect to FINORA server: " +
                        (
                            error &&
                            error.message
                                ? error.message
                                : "Unknown error"
                        ),
                        "error"
                    );

                }


                resetButton();

                registrationRunning =
                    false;

            }

        }


        /* =================================================
           FORM SUBMIT
        ================================================= */

        form.addEventListener(
            "submit",
            registerAccount
        );


        /* =================================================
           DIRECT BUTTON CLICK

           This guarantees that the CREATE ACCOUNT button
           also triggers registration directly.
        ================================================= */

        createButton.addEventListener(
            "click",
            function (event) {

                event.preventDefault();
                event.stopPropagation();

                registerAccount(event);

            }
        );


        /* =================================================
           READY
        ================================================= */

        console.log(
            "===================================="
        );

        console.log(
            "✅ FINORA REGISTER.JS READY"
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
            "===================================="
        );


        showStatus(
            "Ready to create your FINORA account.",
            ""
        );

    }


    /* =====================================================
       START SAFELY
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initRegister
        );

    } else {

        initRegister();

    }

})();
