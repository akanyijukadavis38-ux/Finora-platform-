/* =========================================================
   FINORA REGISTER.JS
   Registration logic for register.html
   ========================================================= */

"use strict";

/* =========================================================
   STORAGE
   ========================================================= */

const USERS_KEY = "finoraUsers";
const CURRENT_USER_KEY = "finoraCurrentUser";


/* =========================================================
   ELEMENTS
   ========================================================= */

const registerForm = document.getElementById("registerForm");

const fullNameInput = document.getElementById("fullName");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput =
    document.getElementById("confirmPassword");
const referralInput =
    document.getElementById("referralCode");
const termsInput = document.getElementById("terms");

const createButton =
    document.getElementById("createButton");

const formStatus =
    document.getElementById("formStatus");


/* =========================================================
   STORAGE HELPERS
   ========================================================= */

function getUsers() {

    try {

        const users =
            JSON.parse(
                localStorage.getItem(USERS_KEY)
            );

        return Array.isArray(users)
            ? users
            : [];

    } catch (error) {

        return [];

    }

}


function saveUsers(users) {

    localStorage.setItem(
        USERS_KEY,
        JSON.stringify(users)
    );

}


/* =========================================================
   ACCOUNT ID
   ========================================================= */

function generateAccountId() {

    const users = getUsers();

    let accountId;

    do {

        accountId =
            "FN" +
            Math.floor(
                10000000 +
                Math.random() * 90000000
            );

    } while (
        users.some(
            user =>
                user.accountId === accountId
        )
    );

    return accountId;

}


/* =========================================================
   PHONE
   ========================================================= */

function cleanPhone(value) {

    return String(value || "")
        .replace(/\s+/g, "")
        .replace(/-/g, "");

}


function validUgandaPhone(value) {

    return /^07\d{8}$/.test(
        cleanPhone(value)
    );

}


/* =========================================================
   EMAIL
   ========================================================= */

function validEmail(value) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(String(value).trim());

}


/* =========================================================
   PASSWORD
   ========================================================= */

function validPassword(value) {

    return String(value).length >= 6;

}


/* =========================================================
   REFERRAL
   ========================================================= */

function findReferrer(code) {

    const cleanCode =
        String(code || "")
            .trim()
            .toUpperCase();

    if (!cleanCode) {
        return null;
    }

    const users = getUsers();

    return (
        users.find(
            user =>
                String(
                    user.accountId || ""
                ).toUpperCase() === cleanCode
                ||
                String(
                    user.referralCode || ""
                ).toUpperCase() === cleanCode
        ) || null
    );

}


/* =========================================================
   FORM STATUS
   ========================================================= */

function showStatus(message, type = "error") {

    if (!formStatus) return;

    formStatus.textContent = message;

    formStatus.className =
        "form-status " +
        type +
        " show";

}


function clearStatus() {

    if (!formStatus) return;

    formStatus.textContent = "";

    formStatus.className =
        "form-status";

}


/* =========================================================
   PASSWORD VISIBILITY
   ========================================================= */

document
    .querySelectorAll(".toggle-password")
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const targetId =
                    this.dataset.target;

                const input =
                    document.getElementById(
                        targetId
                    );

                if (!input) return;

                if (
                    input.type === "password"
                ) {

                    input.type = "text";

                    this.textContent = "🙈";

                } else {

                    input.type = "password";

                    this.textContent = "👁";

                }

            }
        );

    });


/* =========================================================
   REFERRAL FROM URL
   ========================================================= */

function loadReferralFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const referral =
        params.get("ref");

    if (
        referral &&
        referralInput
    ) {

        referralInput.value =
            referral.trim();

    }

}

loadReferralFromURL();


/* =========================================================
   REFERRAL VALIDATION
   ========================================================= */

function validateReferral() {

    if (!referralInput) {
        return true;
    }

    const code =
        referralInput.value.trim();

    /*
       Referral is optional.
    */

    if (!code) {
        return true;
    }

    const referrer =
        findReferrer(code);

    if (!referrer) {

        showStatus(
            "The referral code entered was not found.",
            "error"
        );

        return false;

    }

    return true;

}


/* =========================================================
   LIVE PHONE VALIDATION
   ========================================================= */

if (phoneInput) {

    phoneInput.addEventListener(
        "input",
        function () {

            this.value =
                cleanPhone(
                    this.value
                ).slice(0, 10);

        }
    );

}


/* =========================================================
   SUBMIT REGISTRATION
   ========================================================= */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            clearStatus();


            /* -----------------------------------------
               GET VALUES
               ----------------------------------------- */

            const fullName =
                fullNameInput.value.trim();

            const phone =
                cleanPhone(
                    phoneInput.value
                );

            const email =
                emailInput.value
                    .trim()
                    .toLowerCase();

            const password =
                passwordInput.value;

            const confirmPassword =
                confirmPasswordInput.value;

            const referralCode =
                referralInput
                    ? referralInput.value.trim()
                    : "";


            /* -----------------------------------------
               NAME
               ----------------------------------------- */

            if (fullName.length < 2) {

                showStatus(
                    "Please enter your full name.",
                    "error"
                );

                fullNameInput.focus();

                return;

            }


            /* -----------------------------------------
               PHONE
               ----------------------------------------- */

            if (!validUgandaPhone(phone)) {

                showStatus(
                    "Enter a valid Ugandan phone number starting with 07.",
                    "error"
                );

                phoneInput.focus();

                return;

            }


            /* -----------------------------------------
               EMAIL
               ----------------------------------------- */

            if (!validEmail(email)) {

                showStatus(
                    "Please enter a valid email address.",
                    "error"
                );

                emailInput.focus();

                return;

            }


            /* -----------------------------------------
               PASSWORD
               ----------------------------------------- */

            if (!validPassword(password)) {

                showStatus(
                    "Password must contain at least 6 characters.",
                    "error"
                );

                passwordInput.focus();

                return;

            }


            /* -----------------------------------------
               CONFIRM PASSWORD
               ----------------------------------------- */

            if (
                password !==
                confirmPassword
            ) {

                showStatus(
                    "Passwords do not match.",
                    "error"
                );

                confirmPasswordInput.focus();

                return;

            }


            /* -----------------------------------------
               REFERRAL
               ----------------------------------------- */

            if (!validateReferral()) {

                referralInput.focus();

                return;

            }


            /* -----------------------------------------
               TERMS
               ----------------------------------------- */

            if (
                termsInput &&
                !termsInput.checked
            ) {

                showStatus(
                    "Please agree to the Terms & Conditions and Privacy Policy.",
                    "error"
                );

                termsInput.focus();

                return;

            }


            /* -----------------------------------------
               GET EXISTING USERS
               ----------------------------------------- */

            const users =
                getUsers();


            /* -----------------------------------------
               DUPLICATE PHONE
               ----------------------------------------- */

            const phoneExists =
                users.some(
                    user =>
                        cleanPhone(
                            user.phone
                        ) === phone
                );

            if (phoneExists) {

                showStatus(
                    "An account with this phone number already exists.",
                    "error"
                );

                phoneInput.focus();

                return;

            }


            /* -----------------------------------------
               DUPLICATE EMAIL
               ----------------------------------------- */

            const emailExists =
                users.some(
                    user =>
                        String(
                            user.email || ""
                        ).toLowerCase() ===
                        email
                );

            if (emailExists) {

                showStatus(
                    "An account with this email address already exists.",
                    "error"
                );

                emailInput.focus();

                return;

            }


            /* -----------------------------------------
               ACCOUNT ID
               ----------------------------------------- */

            const accountId =
                generateAccountId();


            /* -----------------------------------------
               USER REFERRAL CODE
               ----------------------------------------- */

            const userReferralCode =
                accountId;


            /* -----------------------------------------
               REFERRER
               ----------------------------------------- */

            const referrer =
                referralCode
                    ? findReferrer(
                        referralCode
                    )
                    : null;


            /* -----------------------------------------
               CREATE USER
               ----------------------------------------- */

            const newUser = {

                accountId:
                    accountId,

                fullName:
                    fullName,

                name:
                    fullName,

                phone:
                    phone,

                email:
                    email,

                password:
                    password,

                referralCode:
                    userReferralCode,

                referredBy:
                    referrer
                        ? referrer.accountId
                        : null,

                referralLevel:
                    referrer
                        ? 1
                        : 0,

                walletBalance:
                    0,

                cumulativeIncome:
                    0,

                totalDeposit:
                    0,

                totalWithdrawal:
                    0,

                registrationBonus:
                    0,

                loginBonus:
                    0,

                dailyLoginBonus:
                    0,

                status:
                    "active",

                registrationDate:
                    new Date().toISOString(),

                purchasedProducts:
                    [],

                transactions:
                    [],

                referralEarnings:
                    0

            };


            /* -----------------------------------------
               SAVE USER
               ----------------------------------------- */

            users.push(newUser);

            saveUsers(users);


            /* -----------------------------------------
               CURRENT USER
               ----------------------------------------- */

            localStorage.setItem(
                CURRENT_USER_KEY,
                JSON.stringify({
                    accountId:
                        newUser.accountId,

                    fullName:
                        newUser.fullName,

                    phone:
                        newUser.phone,

                    email:
                        newUser.email
                })
            );


            /* -----------------------------------------
               SUCCESS
               ----------------------------------------- */

            createButton.disabled = true;

            createButton.textContent =
                "ACCOUNT CREATED ✓";

            showStatus(
                "Account created successfully. Redirecting to login...",
                "success"
            );


            /* -----------------------------------------
               REDIRECT
               ----------------------------------------- */

            setTimeout(
                function () {

                    window.location.href =
                        "login.html";

                },
                1200
            );

        }
    );

}
