/* =========================================================
   FINORA INVEST — FRONTEND JAVASCRIPT
   ========================================================= */

const FINORA_API =
    "https://finora-platform.onrender.com";


/* =========================================================
   FINORA INVEST SETTINGS
   ========================================================= */

const MIN_INVESTMENT = 10000;
const DAILY_RATE = 10;
const INVESTMENT_DURATION = 20;


/* =========================================================
   PAGE STATE
   ========================================================= */

let currentUser = null;
let walletBalance = 0;
let investmentSubmitting = false;


/* =========================================================
   ELEMENT HELPER
   ========================================================= */

function getElement(id) {

    return document.getElementById(id);

}


/* =========================================================
   MONEY FORMAT
   ========================================================= */

function formatMoney(amount) {

    const value = Number(amount) || 0;

    return "UGX " + value.toLocaleString("en-UG");

}


/* =========================================================
   NUMBER FORMAT
   ========================================================= */

function numberValue(value) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;

}


/* =========================================================
   BACK BUTTON
   ========================================================= */

function setupBackButton() {

    const button =
        getElement("backButton");

    if (!button) return;

    button.addEventListener(
        "click",
        function () {

            if (window.history.length > 1) {

                window.history.back();

            } else {

                window.location.href =
                    "dashboard.html";

            }

        }
    );

}


/* =========================================================
   MESSAGE
   ========================================================= */

function showMessage(
    message,
    type = ""
) {

    const element =
        getElement("investmentMessage");

    if (!element) return;

    element.textContent =
        message || "";

    element.className =
        "investment-message";

    if (type) {

        element.classList.add(type);

    }

}


/* =========================================================
   AMOUNT ERROR
   ========================================================= */

function showAmountError(message) {

    const element =
        getElement("amountError");

    if (!element) return;

    element.textContent =
        message || "";

}


/* =========================================================
   CLEAR ERRORS
   ========================================================= */

function clearErrors() {

    showAmountError("");

    showMessage("");

}


/* =========================================================
   LOAD CURRENT USER
   ========================================================= */

async function loadCurrentUser() {

    try {

        const response =
            await fetch(
                `${FINORA_API}/api/users/me`,
                {
                    method: "GET",

                    credentials: "include",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (
            response.status === 401
        ) {

            window.location.href =
                "login.html";

            return false;

        }


        if (
            response.status === 403
        ) {

            const data =
                await response.json()
                    .catch(() => ({}));


            showMessage(
                data.message ||
                "Your FINORA account is not available.",
                "error"
            );

            return false;

        }


        if (!response.ok) {

            throw new Error(
                `Account request failed: ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            !data ||
            data.success === false
        ) {

            throw new Error(
                data.message ||
                "FINORA could not load your account."
            );

        }


        currentUser =
            data.user || data;


        updateUserInformation(
            currentUser
        );


        return true;

    } catch (error) {

        console.error(
            "❌ FINORA ACCOUNT LOAD ERROR:",
            error
        );


        showMessage(
            "FINORA could not load your account. Please try again.",
            "error"
        );


        return false;

    }

}


/* =========================================================
   UPDATE USER INFORMATION
   ========================================================= */

function updateUserInformation(user) {

    const nameElement =
        getElement("investorName");


    const phoneElement =
        getElement("investorPhone");


    const balanceElement =
        getElement("walletBalance");


    const name =
        user.fullName ??
        user.full_name ??
        "";


    const phone =
        user.phone ??
        "";


    walletBalance =
        numberValue(
            user.balance ??
            user.walletBalance ??
            user.wallet_balance
        );


    if (nameElement) {

        nameElement.textContent =
            name || "FINORA User";

    }


    if (phoneElement) {

        phoneElement.textContent =
            phone || "Phone number unavailable";

    }


    if (balanceElement) {

        balanceElement.textContent =
            formatMoney(walletBalance);

    }


    updateCalculation();

}


/* =========================================================
   GET INVESTMENT AMOUNT
   ========================================================= */

function getInvestmentAmount() {

    const input =
        getElement("investmentAmount");

    if (!input) return 0;

    return numberValue(
        input.value
    );

}


/* =========================================================
   UPDATE LIVE CALCULATIONS
   ========================================================= */

function updateCalculation() {

    const amount =
        getInvestmentAmount();


    const dailyEarnings =
        amount *
        (DAILY_RATE / 100);


    const totalEarnings =
        dailyEarnings *
        INVESTMENT_DURATION;


    const totalAfterInvestment =
        amount +
        totalEarnings;


    const walletAfterInvestment =
        walletBalance -
        amount;


    const dailyElement =
        getElement("dailyEarnings");


    const totalElement =
        getElement("totalEarnings");


    const finalElement =
        getElement("totalAfterInvestment");


    const walletAfterElement =
        getElement("walletAfterInvestment");


    const walletStatus =
        getElement("walletAfterStatus");


    if (dailyElement) {

        dailyElement.textContent =
            formatMoney(dailyEarnings);

    }


    if (totalElement) {

        totalElement.textContent =
            formatMoney(totalEarnings);

    }


    if (finalElement) {

        finalElement.textContent =
            formatMoney(totalAfterInvestment);

    }


    if (walletAfterElement) {

        if (amount > walletBalance) {

            walletAfterElement.textContent =
                "Insufficient balance";

        } else {

            walletAfterElement.textContent =
                formatMoney(
                    Math.max(
                        0,
                        walletAfterInvestment
                    )
                );

        }

    }


    if (walletStatus) {

        if (amount <= 0) {

            walletStatus.textContent =
                "Ready";

            walletStatus.classList.remove(
                "warning",
                "success"
            );

        } else if (
            amount > walletBalance
        ) {

            walletStatus.textContent =
                "Insufficient balance";

            walletStatus.classList.remove(
                "success"
            );

            walletStatus.classList.add(
                "warning"
            );

        } else {

            walletStatus.textContent =
                "Ready to invest";

            walletStatus.classList.remove(
                "warning"
            );

            walletStatus.classList.add(
                "success"
            );

        }

    }

}


/* =========================================================
   VALIDATE INVESTMENT
   ========================================================= */

function validateInvestmentAmount() {

    const amount =
        getInvestmentAmount();


    clearErrors();


    if (!Number.isFinite(amount)) {

        showAmountError(
            "Please enter a valid investment amount."
        );

        return false;

    }


    if (amount <= 0) {

        showAmountError(
            "Please enter an investment amount."
        );

        return false;

    }


    if (amount < MIN_INVESTMENT) {

        showAmountError(
            "Minimum investment is UGX 10,000."
        );

        return false;

    }


    if (amount > walletBalance) {

        showAmountError(
            "Insufficient wallet balance."
        );

        return false;

    }


    return true;

}


/* =========================================================
   SET BUTTON LOADING
   ========================================================= */

function setButtonLoading(isLoading) {

    const button =
        getElement("investNowButton");


    const loader =
        getElement("buttonLoader");


    if (!button) return;


    if (isLoading) {

        button.disabled =
            true;

        button.classList.add(
            "loading"
        );

        if (loader) {

            loader.setAttribute(
                "aria-hidden",
                "false"
            );

        }

    } else {

        button.disabled =
            false;

        button.classList.remove(
            "loading"
        );

        if (loader) {

            loader.setAttribute(
                "aria-hidden",
                "true"
            );

        }

    }

}


/* =========================================================
   CREATE INVESTMENT
   ========================================================= */

async function createInvestment() {

    if (investmentSubmitting) {

        return;

    }


    const valid =
        validateInvestmentAmount();


    if (!valid) {

        return;

    }


    const amount =
        getInvestmentAmount();


    investmentSubmitting =
        true;


    setButtonLoading(
        true
    );


    showMessage(
        "Creating your investment securely...",
        "loading"
    );


    try {

        const response =
            await fetch(
                `${FINORA_API}/api/investments`,
                {
                    method: "POST",

                    credentials: "include",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            amount:
                                amount
                        })
                }
            );


        const data =
            await response.json()
                .catch(() => ({}));


        if (
            response.status === 401
        ) {

            window.location.href =
                "login.html";

            return;

        }


        if (
            response.status === 403
        ) {

            showMessage(
                data.message ||
                "Your FINORA account is not available.",
                "error"
            );

            return;

        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                "FINORA could not create your investment."
            );

        }


        if (
            data.success !== true
        ) {

            throw new Error(
                data.message ||
                "Investment could not be created."
            );

        }


        /* -----------------------------------------
           UPDATE LOCAL WALLET
        ----------------------------------------- */

        if (
            data.walletBalance !== undefined
        ) {

            walletBalance =
                numberValue(
                    data.walletBalance
                );

        } else {

            walletBalance -=
                amount;

        }


        const balanceElement =
            getElement("walletBalance");


        if (balanceElement) {

            balanceElement.textContent =
                formatMoney(
                    walletBalance
                );

        }


        /* -----------------------------------------
           CLEAR INPUT
        ----------------------------------------- */

        const input =
            getElement("investmentAmount");


        if (input) {

            input.value = "";

        }


        updateCalculation();


        /* -----------------------------------------
           SUCCESS MESSAGE
        ----------------------------------------- */

        showMessage(
            "Investment created successfully.",
            "success"
        );


        /* -----------------------------------------
           SHOW UPDATED BUTTON STATE
        ----------------------------------------- */

        const button =
            getElement("investNowButton");


        if (button) {

            button.classList.add(
                "success"
            );

        }


        /*
         * The backend has already created:
         *
         * 1. Investment record
         * 2. Investment transaction record
         *
         * Mine and Transaction History will
         * retrieve the same records from the backend.
         */


        /* -----------------------------------------
           DELAY THEN OPEN MINE
        ----------------------------------------- */

        setTimeout(
            function () {

                window.location.href =
                    "mine.html";

            },
            1200
        );

    } catch (error) {

        console.error(
            "❌ FINORA INVESTMENT ERROR:",
            error
        );


        showMessage(
            error.message ||
            "FINORA could not create your investment. Please try again.",
            "error"
        );

    } finally {

        investmentSubmitting =
            false;

        setButtonLoading(
            false
        );

    }

}


/* =========================================================
   INPUT EVENTS
   ========================================================= */

function setupInvestmentInput() {

    const input =
        getElement("investmentAmount");


    if (!input) return;


    input.addEventListener(
        "input",
        function () {

            clearErrors();

            updateCalculation();

        }
    );


    input.addEventListener(
        "blur",
        function () {

            const amount =
                getInvestmentAmount();


            if (
                amount > 0 &&
                amount < MIN_INVESTMENT
            ) {

                showAmountError(
                    "Minimum investment is UGX 10,000."
                );

            } else if (
                amount > walletBalance
            ) {

                showAmountError(
                    "Insufficient wallet balance."
                );

            }

        }
    );


    input.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                createInvestment();

            }

        }
    );

}


/* =========================================================
   INVEST BUTTON
   ========================================================= */

function setupInvestButton() {

    const button =
        getElement("investNowButton");


    if (!button) return;


    button.addEventListener(
        "click",
        createInvestment
    );

}


/* =========================================================
   INITIAL PAGE SETUP
   ========================================================= */

async function initializeInvestPage() {

    setupBackButton();

    setupInvestmentInput();

    setupInvestButton();

    updateCalculation();

    await loadCurrentUser();

}


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeInvestPage
);
