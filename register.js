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

    const API_URL =
        "https://finora-platform-production.up.railway.app";

    console.log("🔥 FINORA REGISTER.JS LOADED");
    console.log("🔥 API:", API_URL);

    if (!form) {
        console.error("❌ registerForm NOT FOUND");
        return;
    }

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        console.log("🔥 CREATE ACCOUNT CLICKED");

        const nameValue = fullName.value.trim();
        const phoneValue = phone.value.trim();
        const emailValue = email.value.trim().toLowerCase();
        const passwordValue = password.value;
        const confirmValue = confirmPassword.value;
        const referralValue = referralCode
            ? referralCode.value.trim()
            : "";

        if (nameValue.length < 2) {
            formStatus.textContent = "Please enter your full name.";
            return;
        }

        if (!/^07[0-9]{8}$/.test(phoneValue)) {
            formStatus.textContent =
                "Enter a valid Uganda phone number.";
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            formStatus.textContent =
                "Please enter a valid email address.";
            return;
        }

        if (passwordValue.length < 6) {
            formStatus.textContent =
                "Password must contain at least 6 characters.";
            return;
        }

        if (passwordValue !== confirmValue) {
            formStatus.textContent =
                "Passwords do not match.";
            return;
        }

        if (terms && !terms.checked) {
            formStatus.textContent =
                "Please agree to the Terms & Conditions and Privacy Policy.";
            return;
        }

        createButton.disabled = true;
        createButton.textContent = "CREATING ACCOUNT...";
        formStatus.textContent =
            "Connecting to FINORA server...";

        console.log("🔥 ABOUT TO FETCH REGISTER ENDPOINT");

        try {

            const response = await fetch(
                API_URL + "/api/users/register",
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
                        confirmPassword: confirmValue,
                        referralCode: referralValue || null
                    })
                }
            );

            console.log(
                "🔥 FETCH COMPLETED",
                response.status
            );

            const text = await response.text();

            console.log(
                "🔥 SERVER RESPONSE:",
                text
            );

            let data;

            try {
                data = JSON.parse(text);
            } catch (error) {

                console.error(
                    "❌ SERVER DID NOT RETURN JSON",
                    error
                );

                formStatus.textContent =
                    "Server returned an invalid response.";

                createButton.disabled = false;
                createButton.textContent =
                    "CREATE FINORA ACCOUNT";

                return;
            }

            console.log(
                "🔥 PARSED RESPONSE:",
                data
            );

            if (!response.ok || data.success !== true) {

                formStatus.textContent =
                    data.message ||
                    "Unable to create account.";

                createButton.disabled = false;
                createButton.textContent =
                    "CREATE FINORA ACCOUNT";

                return;
            }

            console.log(
                "✅ FINORA ACCOUNT CREATED",
                data.user
            );

            if (data.user) {

                localStorage.setItem(
                    "finoraCurrentUser",
                    JSON.stringify(data.user)
                );

            }

            formStatus.textContent =
                "Account created successfully! Redirecting...";

            createButton.textContent =
                "ACCOUNT CREATED ✓";

            setTimeout(function () {

                window.location.href =
                    "login.html";

            }, 1200);

        } catch (error) {

            console.error(
                "❌ FINORA REGISTER FETCH ERROR:",
                error
            );

            formStatus.textContent =
                "Unable to connect to FINORA server.";

            createButton.disabled = false;

            createButton.textContent =
                "CREATE FINORA ACCOUNT";
        }

    });

});
