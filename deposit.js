/* =========================================================
   FINORA — DEPOSIT JAVASCRIPT
   ========================================================= */

"use strict";


/* =========================================================
   PAYMENT DETAILS
========================================================= */

const PAYMENT_DETAILS = {

    MTN: {
        network: "MTN MOBILE MONEY",
        code: "52200475",
        ussd:
            "Dial *165*3# on your MTN line, select the merchant payment option, and enter merchant code 52200475."
    },

    Airtel: {
        network: "AIRTEL MONEY",
        code: "7157334",
        ussd:
            "Dial *185*9# on your Airtel line, select the merchant payment option, and enter merchant code 7157334."
    }

};


/* =========================================================
   DOM ELEMENTS
========================================================= */

const amountInput =
    document.getElementById("amount");

const mtnRadio =
    document.getElementById("mtn");

const airtelRadio =
    document.getElementById("airtel");

const merchantNetwork =
    document.getElementById("merchantNetwork");

const merchantCode =
    document.getElementById("merchantCode");

const ussdText =
    document.getElementById("ussdText");

const copyCode =
    document.getElementById("copyCode");

const paymentReference =
    document.getElementById("paymentReference");

const submitDeposit =
    document.getElementById("submitDeposit");

const message =
    document.getElementById("message");

const page =
    document.querySelector(".page");


/* =========================================================
   PAGE LOADING PROTECTION
========================================================= */

if (page) {
    page.classList.add("loading");

    window.addEventListener("load", () => {
        page.classList.remove("loading");
    });
}


/* =========================================================
   MESSAGE HANDLER
========================================================= */

function showMessage(text, type = "error") {

    if (!message) return;

    message.textContent = text;

    message.className = "message show " + type;

}


function clearMessage() {

    if (!message) return;

    message.textContent = "";

    message.className = "message";

}


/* =========================================================
   GET SELECTED PAYMENT METHOD
========================================================= */

function getSelectedPaymentMethod() {

    if (airtelRadio && airtelRadio.checked) {
        return "Airtel";
    }

    return "MTN";
}


/* =========================================================
   UPDATE PAYMENT DETAILS
========================================================= */

function updatePaymentDetails() {

    const method =
        getSelectedPaymentMethod();

    const details =
        PAYMENT_DETAILS[method];

    if (!details) return;


    if (merchantNetwork) {

        merchantNetwork.textContent =
            details.network;

    }


    if (merchantCode) {

        merchantCode.textContent =
            details.code;

    }


    if (ussdText) {

        ussdText.textContent =
            details.ussd;

    }


    clearMessage();

}


/* =========================================================
   PAYMENT METHOD EVENTS
========================================================= */

if (mtnRadio) {

    mtnRadio.addEventListener(
        "change",
        updatePaymentDetails
    );

}


if (airtelRadio) {

    airtelRadio.addEventListener(
        "change",
        updatePaymentDetails
    );

}


/* =========================================================
   COPY MERCHANT CODE
========================================================= */

if (copyCode) {

    copyCode.addEventListener(
        "click",
        async () => {

            const code =
                merchantCode
                    ? merchantCode.textContent.trim()
                    : "";

            if (!code) {

                showMessage(
                    "Merchant code is unavailable.",
                    "error"
                );

                return;
            }


            try {

                await navigator.clipboard.writeText(code);

                const originalText =
                    copyCode.textContent;

                copyCode.textContent =
                    "Copied";

                copyCode.setAttribute(
                    "aria-label",
                    "Merchant code copied"
                );


                setTimeout(() => {

                    copyCode.textContent =
                        originalText;

                    copyCode.setAttribute(
                        "aria-label",
                        "Copy merchant code"
                    );

                }, 1600);


            } catch (error) {

                /*
                 * Fallback for browsers where
                 * Clipboard API is unavailable.
                 */

                try {

                    const tempInput =
                        document.createElement("input");

                    tempInput.value = code;

                    document.body.appendChild(
                        tempInput
                    );

                    tempInput.select();

                    document.execCommand("copy");

                    tempInput.remove();


                    const originalText =
                        copyCode.textContent;

                    copyCode.textContent =
                        "Copied";


                    setTimeout(() => {

                        copyCode.textContent =
                            originalText;

                    }, 1600);


                } catch (fallbackError) {

                    showMessage(
                        "Unable to copy the merchant code. Please copy it manually.",
                        "error"
                    );

                }

            }

        }
    );

}


/* =========================================================
   AMOUNT VALIDATION
========================================================= */

function getDepositAmount() {

    if (!amountInput) return 0;

    const value =
        Number(amountInput.value);

    if (!Number.isFinite(value)) {
        return 0;
    }

    return value;

}


function validateDepositAmount() {

    const amount =
        getDepositAmount();


    if (!amount) {

        showMessage(
            "Please enter your deposit amount.",
            "error"
        );

        return false;

    }


    if (amount < 10000) {

        showMessage(
            "The minimum deposit amount is UGX 10,000.",
            "error"
        );

        return false;

    }


    if (!Number.isInteger(amount)) {

        showMessage(
            "Please enter a valid whole-number amount.",
            "error"
        );

        return false;

    }


    return true;

}


/* =========================================================
   TRANSACTION REFERENCE VALIDATION
========================================================= */

function validateReference() {

    if (!paymentReference) {
        return false;
    }


    const reference =
        paymentReference.value.trim();


    if (!reference) {

        showMessage(
            "Please enter your Mobile Money transaction reference.",
            "error"
        );

        paymentReference.focus();

        return false;

    }


    if (reference.length < 4) {

        showMessage(
            "Please enter a valid Mobile Money transaction reference.",
            "error"
        );

        paymentReference.focus();

        return false;

    }


    return true;

}


/* =========================================================
   AMOUNT INPUT
========================================================= */

if (amountInput) {

    amountInput.addEventListener(
        "input",
        () => {

            clearMessage();

        }
    );

}


/* =========================================================
   REFERENCE INPUT
========================================================= */

if (paymentReference) {

    paymentReference.addEventListener(
        "input",
        () => {

            clearMessage();

        }
    );

}


/* =========================================================
   SUBMIT DEPOSIT
========================================================= */

if (submitDeposit) {

    submitDeposit.addEventListener(
        "click",
        async () => {

            clearMessage();


            /* ---------------------------------------------
               VALIDATE AMOUNT
            --------------------------------------------- */

            if (!validateDepositAmount()) {
                return;
            }


            /* ---------------------------------------------
               VALIDATE REFERENCE
            --------------------------------------------- */

            if (!validateReference()) {
                return;
            }


            const amount =
                getDepositAmount();

            const paymentMethod =
                getSelectedPaymentMethod();

            const reference =
                paymentReference.value.trim();


            /* ---------------------------------------------
               CURRENT PAYMENT DETAILS
            --------------------------------------------- */

            const payment =
                PAYMENT_DETAILS[paymentMethod];


            if (!payment) {

                showMessage(
                    "Please select a valid payment method.",
                    "error"
                );

                return;

            }


            /* ---------------------------------------------
               IMPORTANT
               
               Backend submission will be connected
               after the exact FINORA deposit endpoint
               is confirmed.
            --------------------------------------------- */

            showMessage(
                "Your deposit details are ready. Payment verification will be connected to the FINORA backend.",
                "success"
            );


            console.log(
                "FINORA deposit prepared:",
                {
                    amount: amount,
                    paymentMethod: paymentMethod,
                    merchantCode: payment.code,
                    paymentReference: reference
                }
            );

        }
    );

}


/* =========================================================
   INITIAL PAYMENT STATE
========================================================= */

updatePaymentDetails();
