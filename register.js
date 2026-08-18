document.addEventListener("DOMContentLoaded", function () {

    /* =========================================
       FINORA REGISTER.JS
    ========================================= */

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

    /* =========================================
       FINORA RAILWAY BACKEND
    ========================================= */

    const API_URL =
        "https://finora-platform-production.up.railway.app";


    /* =========================================
       CHECK FORM
    ========================================= */

    if (!form) {

        console.error(
            "FINORA: registerForm was not found."
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
       PASSWORD STRENGTH
    ========================================= */

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
                    function (
                        bar,
                        index
                    ) {

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


    /* =========================================
       PASSWORD MATCH
    ========================================= */

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


    /* =========================================
       FORM SUBMISSION
    ========================================= */

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();
            event.stopPropagation();


            console.log(
                "FINORA: Registration form submitted."
            );


            /* =====================================
               READ FORM VALUES
            ===================================== */

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
                referralCode.value.trim();


            /* =====================================
               CLEAR STATUS
            ===================================== */

            formStatus.textContent =
                "";

            formStatus.className =
                "form-status";


            /* =====================================
               VALIDATE NAME
            ===================================== */

            if (
                nameValue.length < 2
            ) {

                formStatus.textContent =
                    "Please enter your full name.";

                formStatus.className =
                    "form-status error";

                fullName.focus();

                return;
            }


            /* =====================================
               VALIDATE UGANDA PHONE
            ===================================== */

            if (
                !/^07[0-9]{8}$/.test(
                    phoneValue
                )
            ) {

                formStatus.textContent =
                    "Enter a valid Uganda phone number, e.g. 0701234567.";

                formStatus.className =
                    "form-status error";

                phone.focus();

                return;
            }


            /* =====================================
               VALIDATE EMAIL
            ===================================== */

            if (
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                    emailValue
                )
            ) {

                formStatus.textContent =
                    "Please enter a valid email address.";

                formStatus.className =
                    "form-status error";

                email.focus();

                return;
            }


            /* =====================================
               VALIDATE PASSWORD
            ===================================== */

            if (
                passwordValue.length < 6
            ) {

                formStatus.textContent =
                    "Password must contain at least 6 characters.";

                formStatus.className =
                    "form-status error";

                password.focus();

                return;
            }


            /* =====================================
               CONFIRM PASSWORD
            ===================================== */

            if (
                passwordValue !==
                confirmValue
            ) {

                formStatus.textContent =
                    "Passwords do not match.";

                formStatus.className =
                    "form-status error";

                confirmPassword.focus();

                return;
            }


            /* =====================================
               TERMS
            ===================================== */

            if (
                terms &&
                !terms.checked
            ) {

                formStatus.textContent =
                    "Please agree to the Terms & Conditions and Privacy Policy.";

                formStatus.className =
                    "form-status error";

                return;
            }


            /* =====================================
               START LOADING
            ===================================== */

            createButton.disabled =
                true;

            createButton.textContent =
                "CREATING ACCOUNT...";

            formStatus.textContent =
                "Creating your FINORA account...";

            formStatus.className =
                "form-status";


            console.log(
                "FINORA: Sending registration request..."
            );


            /* =====================================
               TIMEOUT CONTROLLER
            ===================================== */

            const controller =
                new AbortController();

            const timeout =
                setTimeout(
                    function () {

                        controller.abort();

                    },
                    30000
                );


            try {

                /* =================================
                   SEND TO USER ROUTES
                   
                   app.js:
                   /api/users

                   userRoutes.js:
                   /register

                   FINAL:
                   /api/users/register
                ================================= */

                const response =
                    await fetch(
                        API_URL +
                        "/api/users/register",
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
                                JSON.stringify({

                                    fullName:
                                        nameValue,

                                    phone:
                                        phoneValue,

                                    email:
                                        emailValue,

                                    password:
                                        passwordValue,

                                    /* IMPORTANT:
                                       This was missing
                                       before.
                                    */

                                    confirmPassword:
                                        confirmValue,

                                    referralCode:
                                        referralValue ||
                                        null

                                }),

                            signal:
                                controller.signal

                        }
                    );


                clearTimeout(
                    timeout
                );


                console.log(
                    "FINORA SERVER STATUS:",
                    response.status
                );


                /* =================================
                   READ SERVER RESPONSE
                ================================= */

                const responseText =
                    await response.text();


                console.log(
                    "FINORA SERVER RESPONSE:",
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
                        "FINORA JSON ERROR:",
                        jsonError
                    );


                    formStatus.textContent =
                        "The FINORA server returned an invalid response.";

                    formStatus.className =
                        "form-status error";


                    createButton.disabled =
                        false;

                    createButton.textContent =
                        "CREATE FINORA ACCOUNT";

                    return;
                }


                /* =================================
                   REGISTRATION FAILED
                ================================= */

                if (
                    !response.ok ||
                    data.success !== true
                ) {

                    formStatus.textContent =
                        data.message ||
                        "Unable to create your FINORA account.";

                    formStatus.className =
                        "form-status error";


                    createButton.disabled =
                        false;

                    createButton.textContent =
                        "CREATE FINORA ACCOUNT";

                    return;
                }


                /* =================================
                   REGISTRATION SUCCESS
                ================================= */

                console.log(
                    "FINORA: ACCOUNT CREATED",
                    data.user
                );


                /* =================================
                   SAVE USER
                ================================= */

                if (data.user) {

                    localStorage.setItem(
                        "finoraCurrentUser",
                        JSON.stringify(
                            data.user
                        )
                    );

                }


                /* =================================
                   SUCCESS MESSAGE
                ================================= */

                formStatus.textContent =
                    "Account created successfully! Redirecting to login...";

                formStatus.className =
                    "form-status success";


                createButton.disabled =
                    true;

                createButton.textContent =
                    "ACCOUNT CREATED ✓";


                /* =================================
                   CLEAR PASSWORDS
                ================================= */

                password.value =
                    "";

                confirmPassword.value =
                    "";


                /* =================================
                   REDIRECT TO LOGIN
                ================================= */

                setTimeout(
                    function () {

                        window.location.href =
                            "login.html";

                    },
                    1200
                );

            } catch (error) {

                clearTimeout(
                    timeout
                );


                console.error(
                    "FINORA REGISTRATION ERROR:",
                    error
                );


                /* =================================
                   TIMEOUT
                ================================= */

                if (
                    error.name ===
                    "AbortError"
                ) {

                    formStatus.textContent =
                        "The FINORA server took too long to respond. Please try again.";

                } else {

                    formStatus.textContent =
                        "Unable to connect to the FINORA server. Please try again.";

                }


                formStatus.className =
                    "form-status error";


                createButton.disabled =
                    false;

                createButton.textContent =
                    "CREATE FINORA ACCOUNT";

            }

        }
    );

});
