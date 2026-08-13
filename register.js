document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("registerForm");

    const fullName = document.getElementById("fullName");
    const phone = document.getElementById("phone");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    const referralCode = document.getElementById("referralCode");
    const terms = document.getElementById("terms");

    const createButton = document.getElementById("createButton");
    const formStatus = document.getElementById("formStatus");

    const API_URL = "https://finora-backend-l949.onrender.com";


    /* =========================================
       PASSWORD SHOW / HIDE
    ========================================== */

    document.querySelectorAll(".toggle-password").forEach(button => {

        button.addEventListener("click", () => {

            const targetId = button.dataset.target;
            const input = document.getElementById(targetId);

            if (!input) return;

            if (input.type === "password") {

                input.type = "text";
                button.textContent = "🙈";
                button.setAttribute("aria-label", "Hide password");

            } else {

                input.type = "password";
                button.textContent = "👁";
                button.setAttribute("aria-label", "Show password");

            }

        });

    });


    /* =========================================
       MESSAGE HELPERS
    ========================================== */

    function showMessage(id, message, type = "") {

        const element = document.getElementById(id);

        if (!element) return;

        element.textContent = message;
        element.className = "field-message";

        if (type) {
            element.classList.add(type);
        }

    }


    function clearMessages() {

        [
            "nameMessage",
            "phoneMessage",
            "emailMessage",
            "passwordMessage",
            "confirmMessage",
            "referralMessage"
        ].forEach(id => {

            showMessage(id, "");

        });

        formStatus.textContent = "";
        formStatus.className = "form-status";

    }


    /* =========================================
       EMAIL VALIDATION
    ========================================== */

    function validEmail(value) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    }


    /* =========================================
       UGANDA PHONE VALIDATION
    ========================================== */

    function validUgandaPhone(value) {

        return /^07\d{8}$/.test(value);

    }


    /* =========================================
       PASSWORD STRENGTH
    ========================================== */

    function checkPasswordStrength(value) {

        const bars = document.querySelectorAll(".strength-bar");
        const strengthText = document.getElementById("strengthText");

        let score = 0;

        if (value.length >= 6) score++;
        if (/[A-Z]/.test(value)) score++;
        if (/[0-9]/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;

        bars.forEach((bar, index) => {

            bar.classList.remove("active");

            if (index < score) {
                bar.classList.add("active");
            }

        });

        if (!value) {

            strengthText.textContent = "Password strength";

        } else if (score <= 1) {

            strengthText.textContent = "Weak";

        } else if (score === 2) {

            strengthText.textContent = "Fair";

        } else if (score === 3) {

            strengthText.textContent = "Good";

        } else {

            strengthText.textContent = "Strong";

        }

    }


    password.addEventListener("input", () => {

        checkPasswordStrength(password.value);

    });


    /* =========================================
       PASSWORD MATCH
    ========================================== */

    confirmPassword.addEventListener("input", () => {

        if (!confirmPassword.value) {

            showMessage("confirmMessage", "");
            return;

        }

        if (password.value !== confirmPassword.value) {

            showMessage(
                "confirmMessage",
                "Passwords do not match.",
                "error"
            );

        } else {

            showMessage(
                "confirmMessage",
                "Passwords match.",
                "success"
            );

        }

    });


    /* =========================================
       FORM SUBMISSION
    ========================================== */

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        clearMessages();


        const nameValue = fullName.value.trim();
        const phoneValue = phone.value.trim();
        const emailValue = email.value.trim().toLowerCase();
        const passwordValue = password.value;
        const confirmValue = confirmPassword.value;
        const referralValue = referralCode.value.trim();


        /* =====================================
           VALIDATION
        ===================================== */

        if (nameValue.length < 2) {

            showMessage(
                "nameMessage",
                "Please enter your full name.",
                "error"
            );

            fullName.focus();
            return;

        }


        if (!validUgandaPhone(phoneValue)) {

            showMessage(
                "phoneMessage",
                "Enter a valid Uganda phone number, e.g. 0701234567.",
                "error"
            );

            phone.focus();
            return;

        }


        if (!validEmail(emailValue)) {

            showMessage(
                "emailMessage",
                "Please enter a valid email address.",
                "error"
            );

            email.focus();
            return;

        }


        if (passwordValue.length < 6) {

            showMessage(
                "passwordMessage",
                "Password must contain at least 6 characters.",
                "error"
            );

            password.focus();
            return;

        }


        if (passwordValue !== confirmValue) {

            showMessage(
                "confirmMessage",
                "Passwords do not match.",
                "error"
            );

            confirmPassword.focus();
            return;

        }


        if (!terms.checked) {

            formStatus.textContent =
                "Please agree to the Terms & Conditions and Privacy Policy.";

            formStatus.className = "form-status error";

            return;

        }


        /* =====================================
           DISABLE BUTTON
        ===================================== */

        createButton.disabled = true;
        createButton.textContent = "CREATING ACCOUNT...";


        try {

            /* =================================
               SEND DATA TO FINORA SERVER
            ================================= */

            const response = await fetch(
                `${API_URL}/api/register`,
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


            const data = await response.json();


            /* =================================
               SERVER ERROR
            ================================= */

            if (!response.ok || !data.success) {

                formStatus.textContent =
                    data.message ||
                    "Registration failed. Please try again.";

                formStatus.className = "form-status error";

                createButton.disabled = false;
                createButton.textContent =
                    "CREATE FINORA ACCOUNT";

                return;

            }


            /* =================================
               SUCCESS
            ================================= */

            formStatus.textContent =
                data.message ||
                "Account created successfully.";

            formStatus.className = "form-status success";


            /* =================================
               SAVE BASIC SESSION INFORMATION
            ================================= */

            if (data.user) {

                localStorage.setItem(
                    "finoraCurrentUser",
                    JSON.stringify(data.user)
                );

            }


            /* =================================
               REDIRECT
            ================================= */

            setTimeout(() => {

    window.location.href = "index.html";

}, 4000);


        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            formStatus.textContent =
                "Unable to connect to the FINORA server. Please try again.";

            formStatus.className = "form-status error";

            createButton.disabled = false;

            createButton.textContent =
                "CREATE FINORA ACCOUNT";

        }

    });

});
