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
        const bars = document.querySelectorAll(".strength-bar");
        const strengthText = document.getElementById("strengthText");

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
            strengthText.textContent = "Password strength";
        } else if (score === 1) {
            strengthText.textContent = "Weak";
        } else if (score === 2) {
            strengthText.textContent = "Fair";
        } else if (score === 3) {
            strengthText.textContent = "Good";
        } else {
            strengthText.textContent = "Strong";
        }

    });


    /* =========================================
       PASSWORD MATCH
    ========================================= */

    confirmPassword.addEventListener("input", function () {

        const message = document.getElementById("confirmMessage");

        if (!confirmPassword.value) {

            message.textContent = "";
            return;

        }

        if (password.value !== confirmPassword.value) {

            message.textContent = "Passwords do not match.";
            message.className = "field-message error";

        } else {

            message.textContent = "Passwords match.";
            message.className = "field-message success";

        }

    });


    /* =========================================
       REGISTRATION
    ========================================= */

    form.addEventListener("submit", async function (event) {

        /*
         * VERY IMPORTANT:
         * Stop the browser from submitting/reloading
         * the HTML page.
         */

        event.preventDefault();
        event.stopPropagation();
alert("SUBMIT HANDLER IS WORKING");
        console.log("FINORA REGISTER FORM SUBMITTED");


        /* -----------------------------------------
           READ FORM
        ----------------------------------------- */

        const nameValue = fullName.value.trim();
        const phoneValue = phone.value.trim();
        const emailValue = email.value.trim().toLowerCase();
        const passwordValue = password.value;
        const confirmValue = confirmPassword.value;
        const referralValue = referralCode.value.trim();


        /* -----------------------------------------
           CLEAR STATUS
        ----------------------------------------- */

        formStatus.textContent = "";
        formStatus.className = "form-status";


        /* -----------------------------------------
           VALIDATION
        ----------------------------------------- */

        if (nameValue.length < 2) {

            formStatus.textContent =
                "Please enter your full name.";

            formStatus.className =
                "form-status error";

            return;

        }


        if (!/^07[0-9]{8}$/.test(phoneValue)) {

            formStatus.textContent =
                "Enter a valid Uganda phone number, e.g. 0701234567.";

            formStatus.className =
                "form-status error";

            return;

        }


        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {

            formStatus.textContent =
                "Please enter a valid email address.";

            formStatus.className =
                "form-status error";

            return;

        }


        if (passwordValue.length < 6) {

            formStatus.textContent =
                "Password must contain at least 6 characters.";

            formStatus.className =
                "form-status error";

            return;

        }


        if (passwordValue !== confirmValue) {

            formStatus.textContent =
                "Passwords do not match.";

            formStatus.className =
                "form-status error";

            return;

        }


        if (!terms.checked) {

            formStatus.textContent =
                "Please agree to the Terms & Conditions and Privacy Policy.";

            formStatus.className =
                "form-status error";

            return;

        }


        /* -----------------------------------------
           SHOW LOADING
        ----------------------------------------- */

        createButton.disabled = true;

        createButton.textContent =
            "CREATING ACCOUNT...";

        formStatus.textContent =
            "Creating your FINORA account...";

        formStatus.className =
            "form-status";


        try {

            console.log(
                "Sending registration request to:",
                API_URL + "/api/register"
            );


            /* -----------------------------------------
               SEND REQUEST
            ----------------------------------------- */

            const response = await fetch(
                API_URL + "/api/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        fullName: nameValue,
                        phone: phoneValue,
                        email: emailValue,
                        password: passwordValue,
                        referralCode: referralValue || null

                    })
                }
            );


            console.log(
                "FINORA RESPONSE STATUS:",
                response.status
            );


            /* -----------------------------------------
               GET RESPONSE
            ----------------------------------------- */

            const data = await response.json();


            console.log(
                "FINORA RESPONSE DATA:",
                data
            );


            /* -----------------------------------------
               SERVER ERROR
            ----------------------------------------- */

            if (!response.ok || !data.success) {

                formStatus.textContent =
                    data.message ||
                    "Registration failed.";

                formStatus.className =
                    "form-status error";

                createButton.disabled = false;

                createButton.textContent =
                    "CREATE FINORA ACCOUNT";

                return;

            }


            /* -----------------------------------------
               SUCCESS
            ----------------------------------------- */

            formStatus.textContent =
                "ACCOUNT CREATED SUCCESSFULLY!";

            formStatus.className =
                "form-status success";


            /* -----------------------------------------
               SAVE USER
            ----------------------------------------- */

            if (data.user) {

                localStorage.setItem(
                    "finoraCurrentUser",
                    JSON.stringify(data.user)
                );

            }


            /* -----------------------------------------
               KEEP USER ON REGISTER PAGE
            ----------------------------------------- */

            createButton.disabled = true;

            createButton.textContent =
                "ACCOUNT CREATED ✓";


            console.log(
                "FINORA ACCOUNT CREATED SUCCESSFULLY"
            );

        } catch (error) {

            console.error(
                "FINORA REGISTRATION ERROR:",
                error
            );


            formStatus.textContent =
                "Registration failed: " + error.message;

            formStatus.className =
                "form-status error";


            createButton.disabled = false;

            createButton.textContent =
                "CREATE FINORA ACCOUNT";

        }

    });

});
