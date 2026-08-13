document.addEventListener("DOMContentLoaded", function () {

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

    const API_URL = "https://finora-backend-l949.onrender.com";


    /* =========================================
       PASSWORD SHOW / HIDE
    ========================================= */

    document.querySelectorAll(".toggle-password").forEach(function (button) {

        button.addEventListener("click", function () {

            const target = document.getElementById(
                button.dataset.target
            );

            if (!target) return;

            if (target.type === "password") {

                target.type = "text";
                button.textContent = "🙈";

            } else {

                target.type = "password";
                button.textContent = "👁";

            }

        });

    });


    /* =========================================
       PASSWORD STRENGTH
    ========================================= */

    password.addEventListener("input", function () {

        const value = password.value;

        const bars =
            document.querySelectorAll(".strength-bar");

        const strengthText =
            document.getElementById("strengthText");

        let score = 0;

        if (value.length >= 6) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;

        bars.forEach(function (bar, index) {

            if (index < score) {
                bar.classList.add("active");
            } else {
                bar.classList.remove("active");
            }

        });

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

    });


    /* =========================================
       PASSWORD MATCH
    ========================================= */

    confirmPassword.addEventListener("input", function () {

        const message =
            document.getElementById("confirmMessage");

        if (!confirmPassword.value) {

            message.textContent = "";
            message.className = "field-message";

            return;

        }

        if (password.value !== confirmPassword.value) {

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

    });


    /* =========================================
       REGISTRATION
    ========================================= */

    form.addEventListener("submit", async function (event) {

        event.preventDefault();
        event.stopPropagation();


        /* -----------------------------------------
           READ FORM
        ----------------------------------------- */

        const nameValue =
            fullName.value.trim();

        const phoneValue =
            phone.value.trim();

        const emailValue =
            email.value.trim().toLowerCase();

        const passwordValue =
            password.value;

        const confirmValue =
            confirmPassword.value;

        const referralValue =
            referralCode.value.trim();


        /* -----------------------------------------
           CLEAR OLD MESSAGE
        ----------------------------------------- */

        formStatus.textContent = "";
        formStatus.className = "form-status";


        /* -----------------------------------------
           VALIDATE NAME
        ----------------------------------------- */

        if (nameValue.length < 2) {

            formStatus.textContent =
                "Please enter your full name.";

            formStatus.className =
                "form-status error";

            return;

        }


        /* -----------------------------------------
           VALIDATE PHONE
        ----------------------------------------- */

        if (!/^07[0-9]{8}$/.test(phoneValue)) {

            formStatus.textContent =
                "Enter a valid Uganda phone number, e.g. 0701234567.";

            formStatus.className =
                "form-status error";

            return;

        }


        /* -----------------------------------------
           VALIDATE EMAIL
        ----------------------------------------- */

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {

            formStatus.textContent =
                "Please enter a valid email address.";

            formStatus.className =
                "form-status error";

            return;

        }


        /* -----------------------------------------
           VALIDATE PASSWORD
        ----------------------------------------- */

        if (passwordValue.length < 6) {

            formStatus.textContent =
                "Password must contain at least 6 characters.";

            formStatus.className =
                "form-status error";

            return;

        }


        /* -----------------------------------------
           CONFIRM PASSWORD
        ----------------------------------------- */

        if (passwordValue !== confirmValue) {

            formStatus.textContent =
                "Passwords do not match.";

            formStatus.className =
                "form-status error";

            return;

        }


        /* -----------------------------------------
           TERMS
        ----------------------------------------- */

        if (!terms.checked) {

            formStatus.textContent =
                "Please agree to the Terms & Conditions and Privacy Policy.";

            formStatus.className =
                "form-status error";

            return;

        }


        /* =========================================
           START REGISTRATION
        ========================================= */

        createButton.disabled = true;

        createButton.textContent =
            "CREATING ACCOUNT...";

        formStatus.textContent =
            "Creating your FINORA account...";

        formStatus.className =
            "form-status";


        try {

            /* -------------------------------------
               SEND TO FINORA BACKEND
            ------------------------------------- */

            const response = await fetch(
                API_URL + "/api/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json"
                    },

                    body: JSON.stringify({

                        fullName: nameValue,

                        phone: phoneValue,

                        email: emailValue,

                        password: passwordValue,

                        referralCode:
                            referralValue || null

                    })
                }
            );


            /* -------------------------------------
               READ RESPONSE SAFELY
            ------------------------------------- */

            const responseText =
                await response.text();

            console.log(
                "FINORA REGISTER RESPONSE:",
                response.status,
                responseText
            );


            let data = null;

            try {

                data =
                    JSON.parse(responseText);

            } catch (parseError) {

                console.error(
                    "FINORA RESPONSE JSON ERROR:",
                    parseError
                );

                formStatus.textContent =
                    "The FINORA server returned an invalid response.";

                formStatus.className =
                    "form-status error";

                createButton.disabled = false;

                createButton.textContent =
                    "CREATE FINORA ACCOUNT";

                return;

            }


            /* =====================================
               REGISTRATION FAILED
            ===================================== */

            if (!response.ok || data.success !== true) {

                formStatus.textContent =
                    data.message ||
                    "Unable to create your FINORA account.";

                formStatus.className =
                    "form-status error";

                createButton.disabled = false;

                createButton.textContent =
                    "CREATE FINORA ACCOUNT";

                return;

            }


            /* =====================================
               ACCOUNT CREATED
            ===================================== */

            if (data.user) {

                localStorage.setItem(
                    "finoraCurrentUser",
                    JSON.stringify(data.user)
                );

            }


            /* -------------------------------------
               SHOW SUCCESS
            ------------------------------------- */

            formStatus.textContent =
                data.message ||
                "Account created successfully!";

            formStatus.className =
                "form-status success";


            createButton.disabled = true;

            createButton.textContent =
                "ACCOUNT CREATED ✓";


            /* -------------------------------------
               CLEAR PASSWORDS ONLY
            ------------------------------------- */

            password.value = "";
            confirmPassword.value = "";


            console.log(
                "FINORA ACCOUNT CREATED SUCCESSFULLY:",
                data.user
            );


        } catch (error) {

            console.error(
                "FINORA REGISTRATION ERROR:",
                error
            );

            formStatus.textContent =
                "Unable to connect to the FINORA server. Please try again.";

            formStatus.className =
                "form-status error";

            createButton.disabled = false;

            createButton.textContent =
                "CREATE FINORA ACCOUNT";

        }

    });

});
