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
           FIELD MESSAGES
        ================================================= */

        const nameMessage =
            document.getElementById("nameMessage");

        const phoneMessage =
            document.getElementById("phoneMessage");

        const emailMessage =
            document.getElementById("emailMessage");

        const confirmMessage =
            document.getElementById("confirmMessage");

        const referralMessage =
            document.getElementById("referralMessage");


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
           FIELD ERROR HELPERS
        ================================================= */

        function clearFieldMessage(
            input,
            messageElement
        ) {

            if (input) {

                input.classList.remove(
                    "error"
                );

                input.removeAttribute(
                    "aria-invalid"
                );

            }

            if (messageElement) {

                messageElement.textContent =
                    "";

                messageElement.className =
                    "field-message";

            }

        }


        function showFieldError(
            input,
            messageElement,
            message
        ) {

            if (input) {

                input.classList.add(
                    "error"
                );

                input.setAttribute(
                    "aria-invalid",
                    "true"
                );

            }

            if (messageElement) {

                messageElement.textContent =
                    message;

                messageElement.className =
                    "field-message error";

            }

        }


        function showFieldSuccess(
            input,
            messageElement,
            message
        ) {

            if (input) {

                input.classList.remove(
                    "error"
                );

                input.removeAttribute(
                    "aria-invalid"
                );

            }

            if (messageElement) {

                messageElement.textContent =
                    message;

                messageElement.className =
                    "field-message success";

            }

        }


        function focusField(input) {

            if (!input) {
                return;
            }

            try {

                input.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            } catch (scrollError) {

                console.error(
                    "FINORA SCROLL ERROR:",
                    scrollError
                );

            }

            setTimeout(
                function () {

                    input.focus();

                },
                250
            );

        }


        function clearAllValidationMessages() {

            clearFieldMessage(
                fullName,
                nameMessage
            );

            clearFieldMessage(
                phone,
                phoneMessage
            );

            clearFieldMessage(
                email,
                emailMessage
            );

            clearFieldMessage(
                password,
                null
            );

            clearFieldMessage(
                confirmPassword,
                confirmMessage
            );

            if (referralMessage) {

                referralMessage.textContent =
                    "";

                referralMessage.className =
                    "field-message";

            }

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


                    /* =====================================
                       PASSWORD ERROR CLEARING
                    ===================================== */

                    if (
                        value &&
                        value.length >= 6
                    ) {

                        password.classList.remove(
                            "error"
                        );

                        password.removeAttribute(
                            "aria-invalid"
                        );

                    }

                    if (
                        confirmPassword &&
                        confirmPassword.value
                    ) {

                        if (
                            value ===
                            confirmPassword.value
                        ) {

                            showFieldSuccess(
                                confirmPassword,
                                confirmMessage,
                                "Passwords match."
                            );

                        } else {

                            showFieldError(
                                confirmPassword,
                                confirmMessage,
                                "Passwords do not match."
                            );

                        }

                    }

                }
            );

        }


        /* =================================================
           LIVE FULL NAME VALIDATION
        ================================================= */

        if (fullName) {

            fullName.addEventListener(
                "input",
                function () {

                    const value =
                        fullName.value.trim();


                    if (!value) {

                        clearFieldMessage(
                            fullName,
                            nameMessage
                        );

                        return;

                    }


                    if (value.length < 2) {

                        showFieldError(
                            fullName,
                            nameMessage,
                            "Please enter your full name."
                        );

                        return;

                    }


                    showFieldSuccess(
                        fullName,
                        nameMessage,
                        "Full name looks good."
                    );

                }
            );

        }


        /* =================================================
           LIVE PHONE VALIDATION
        ================================================= */

        if (phone) {

            phone.addEventListener(
                "input",
                function () {

                    const value =
                        phone.value.trim();


                    if (!value) {

                        clearFieldMessage(
                            phone,
                            phoneMessage
                        );

                        return;

                    }


                    if (
                        !/^07[0-9]{8}$/.test(
                            value
                        )
                    ) {

                        showFieldError(
                            phone,
                            phoneMessage,
                            "Enter a valid Uganda phone number, e.g. 0701234567."
                        );

                        return;

                    }


                    showFieldSuccess(
                        phone,
                        phoneMessage,
                        "Phone number looks good."
                    );

                }
            );

        }


        /* =================================================
           LIVE EMAIL VALIDATION
        ================================================= */

        if (email) {

            email.addEventListener(
                "input",
                function () {

                    const value =
                        email.value.trim().toLowerCase();


                    if (!value) {

                        clearFieldMessage(
                            email,
                            emailMessage
                        );

                        return;

                    }


                    if (
                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                            value
                        )
                    ) {

                        showFieldError(
                            email,
                            emailMessage,
                            "Please enter a valid email address."
                        );

                        return;

                    }


                    showFieldSuccess(
                        email,
                        emailMessage,
                        "Email address looks good."
                    );

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

                    const value =
                        confirmPassword.value;


                    if (!value) {

                        clearFieldMessage(
                            confirmPassword,
                            confirmMessage
                        );

                        return;

                    }


                    if (
                        password &&
                        password.value !== value
                    ) {

                        showFieldError(
                            confirmPassword,
                            confirmMessage,
                            "Passwords do not match."
                        );

                    } else {

                        showFieldSuccess(
                            confirmPassword,
                            confirmMessage,
                            "Passwords match."
                        );

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
               CLEAR GENERAL STATUS
            ================================================= */

            showStatus(
                "",
                ""
            );


            /* =================================================
               FULL NAME
            ================================================= */

            if (!nameValue) {

                showFieldError(
                    fullName,
                    nameMessage,
                    "Please enter your full name."
                );

                showStatus(
                    "Please correct the highlighted field.",
                    "error"
                );

                focusField(fullName);

                return;

            }


            if (nameValue.length < 2) {

                showFieldError(
                    fullName,
                    nameMessage,
                    "Please enter your full name using at least 2 characters."
                );

                showStatus(
                    "Please correct the highlighted field.",
                    "error"
                );

                focusField(fullName);

                return;

            }


            showFieldSuccess(
                fullName,
                nameMessage,
                "Full name looks good."
            );


            /* =================================================
               PHONE
            ================================================= */

            if (!phoneValue) {

                showFieldError(
                    phone,
                    phoneMessage,
                    "Please enter your Uganda phone number."
                );

                showStatus(
                    "Please correct the highlighted field.",
                    "error"
                );

                focusField(phone);

                return;

            }


            if (
                !/^07[0-9]{8}$/.test(
                    phoneValue
                )
            ) {

                showFieldError(
                    phone,
                    phoneMessage,
                    "Enter a valid Uganda phone number, e.g. 0701234567."
                );

                showStatus(
                    "Please correct the highlighted field.",
                    "error"
                );

                focusField(phone);

                return;

            }


            showFieldSuccess(
                phone,
                phoneMessage,
                "Phone number looks good."
            );


            /* =================================================
               EMAIL
            ================================================= */

            if (!emailValue) {

                showFieldError(
                    email,
                    emailMessage,
                    "Please enter your email address."
                );

                showStatus(
                    "Please correct the highlighted field.",
                    "error"
                );

                focusField(email);

                return;

            }


            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    emailValue
                )
            ) {

                showFieldError(
                    email,
                    emailMessage,
                    "Please enter a valid email address."
                );

                showStatus(
                    "Please correct the highlighted field.",
                    "error"
                );

                focusField(email);

                return;

            }


            showFieldSuccess(
                email,
                emailMessage,
                "Email address looks good."
            );


            /* =================================================
               PASSWORD
            ================================================= */

            if (!passwordValue) {

                password.classList.add(
                    "error"
                );

                password.setAttribute(
                    "aria-invalid",
                    "true"
                );

                showStatus(
                    "Please enter your password.",
                    "error"
                );

                focusField(password);

                return;

            }


            if (passwordValue.length < 6) {

                password.classList.add(
                    "error"
                );

                password.setAttribute(
                    "aria-invalid",
                    "true"
                );

                showStatus(
                    "Password must contain at least 6 characters.",
                    "error"
                );

                focusField(password);

                return;

            }


            password.classList.remove(
                "error"
            );

            password.removeAttribute(
                "aria-invalid"
            );


            /* =================================================
               CONFIRM PASSWORD
            ================================================= */

            if (!confirmValue) {

                showFieldError(
                    confirmPassword,
                    confirmMessage,
                    "Please confirm your password."
                );

                showStatus(
                    "Please correct the highlighted field.",
                    "error"
                );

                focusField(confirmPassword);

                return;

            }


            if (
                passwordValue !==
                confirmValue
            ) {

                showFieldError(
                    confirmPassword,
                    confirmMessage,
                    "Passwords do not match. Please enter the same password."
                );

                showStatus(
                    "Please correct the highlighted field.",
                    "error"
                );

                focusField(confirmPassword);

                return;

            }


            showFieldSuccess(
                confirmPassword,
                confirmMessage,
                "Passwords match."
            );


            /* =================================================
               TERMS
            ================================================= */

            if (
                terms &&
                !terms.checked
            ) {

                showStatus(
                    "Please agree to the Terms & Conditions and Privacy Policy before creating your account.",
                    "error"
                );

                try {

                    terms.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });

                } catch (scrollError) {

                    console.error(
                        "FINORA TERMS SCROLL ERROR:",
                        scrollError
                    );

                }

                setTimeout(
                    function () {

                        terms.focus();

                    },
                    250
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
