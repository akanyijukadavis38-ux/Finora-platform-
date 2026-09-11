/* =========================================================
   FINORA DEPOSIT PAGE
   Frontend Controller

   Backend:
   POST /api/deposits

   Deposit flow:
   User selects payment method
        ↓
   User enters amount
        ↓
   User completes Mobile Money payment
        ↓
   User enters transaction reference
        ↓
   FINORA submits deposit
        ↓
   Backend creates PENDING deposit
        ↓
   Admin verifies payment
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const API_BASE_URL =
        "https://finora-platform-production.up.railway.app";

    const MIN_DEPOSIT = 10000;


    const PAYMENT_DETAILS = {

        MTN: {
            merchantCode: "52200475",

            ussd:
                "*165*3#",

            instruction:
                "Dial *165*3# on your MTN line, select the merchant payment option, and enter merchant code 52200475."
        },

        Airtel: {
            merchantCode: "7157334",

            ussd:
                "*185*9#",

            instruction:
                "Dial *185*9# on your Airtel line, select the merchant payment option, and enter merchant code 7157334."
        }

    };


    /* =====================================================
       GET ELEMENTS
    ===================================================== */

    const amountInput =
        document.getElementById("amount");

    const mtnOption =
        document.getElementById("mtn");

    const airtelOption =
        document.getElementById("airtel");

    const merchantBox =
        document.getElementById("merchantBox");

    const merchantNetwork =
        document.getElementById("merchantNetwork");

    const merchantCode =
        document.getElementById("merchantCode");

    const ussdText =
        document.getElementById("ussdText");

    const copyCodeButton =
        document.getElementById("copyCode");

    const paymentReferenceInput =
        document.getElementById("paymentReference");

    const submitButton =
        document.getElementById("submitDeposit");

    const messageBox =
        document.getElementById("message");


    /* =====================================================
       BASIC ELEMENT CHECK
    ===================================================== */

    if (!amountInput) {
        console.error(
            "FINORA: #amount was not found."
        );
    }

    if (!mtnOption) {
        console.error(
            "FINORA: #mtn was not found."
        );
    }

    if (!airtelOption) {
        console.error(
            "FINORA: #airtel was not found."
        );
    }

    if (!submitButton) {
        console.error(
            "FINORA: #submitDeposit was not found."
        );
    }


    /* =====================================================
       CURRENT PAYMENT METHOD
    ===================================================== */

    let selectedPaymentMethod = "MTN";


    /* =====================================================
       MESSAGE HELPER
    ===================================================== */

    function showMessage(
        text,
        type = "info"
    ) {

        if (!messageBox) {
            return;
        }

        messageBox.textContent = text;

        messageBox.classList.remove(
            "success",
            "error",
            "info",
            "warning",
            "show"
        );

        messageBox.classList.add(
            type,
            "show"
        );

    }


    function clearMessage() {

        if (!messageBox) {
            return;
        }

        messageBox.textContent = "";

        messageBox.classList.remove(
            "success",
            "error",
            "info",
            "warning",
            "show"
        );

    }


    /* =====================================================
       UPDATE PAYMENT INFORMATION
    ===================================================== */

    function updatePaymentMethod(method) {

        if (
            !PAYMENT_DETAILS[method]
        ) {
            return;
        }

        selectedPaymentMethod =
            method;


        const details =
            PAYMENT_DETAILS[method];


        /* ---------------------------------------------
           UPDATE SELECTED STATE
        --------------------------------------------- */

        if (mtnOption) {

            mtnOption.classList.toggle(
                "selected",
                method === "MTN"
            );

            mtnOption.setAttribute(
                "aria-checked",
                method === "MTN"
                    ? "true"
                    : "false"
            );
        }


        if (airtelOption) {

            airtelOption.classList.toggle(
                "selected",
                method === "Airtel"
            );

            airtelOption.setAttribute(
                "aria-checked",
                method === "Airtel"
                    ? "true"
                    : "false"
            );
        }


        /* ---------------------------------------------
           UPDATE MERCHANT NETWORK
        --------------------------------------------- */

        if (merchantNetwork) {

            merchantNetwork.textContent =
                method;
        }


        /* ---------------------------------------------
           UPDATE MERCHANT CODE
        --------------------------------------------- */

        if (merchantCode) {

            merchantCode.textContent =
                details.merchantCode;
        }


        /* ---------------------------------------------
           UPDATE USSD
        --------------------------------------------- */

        if (ussdText) {

            ussdText.textContent =
                details.instruction;
        }


        /* ---------------------------------------------
           UPDATE ACCESSIBILITY
        --------------------------------------------- */

        if (merchantBox) {

            merchantBox.setAttribute(
                "data-network",
                method
            );
        }


        /* ---------------------------------------------
           CLEAR OLD MESSAGE
        --------------------------------------------- */

        clearMessage();

    }


    /* =====================================================
       PAYMENT METHOD CLICK EVENTS
    ===================================================== */

    if (mtnOption) {

        mtnOption.addEventListener(
            "click",
            () => {

                updatePaymentMethod(
                    "MTN"
                );

            }
        );


        mtnOption.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    updatePaymentMethod(
                        "MTN"
                    );
                }

            }
        );

    }


    if (airtelOption) {

        airtelOption.addEventListener(
            "click",
            () => {

                updatePaymentMethod(
                    "Airtel"
                );

            }
        );


        airtelOption.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {

                    event.preventDefault();

                    updatePaymentMethod(
                        "Airtel"
                    );
                }

            }
        );

    }


    /* =====================================================
       COPY MERCHANT CODE
    ===================================================== */

    if (copyCodeButton) {

        copyCodeButton.addEventListener(
            "click",
            async () => {

                const code =
                    PAYMENT_DETAILS[
                        selectedPaymentMethod
                    ].merchantCode;


                try {

                    await navigator.clipboard.writeText(
                        code
                    );

                    showMessage(
                        `${selectedPaymentMethod} merchant code copied.`,
                        "success"
                    );


                    const originalText =
                        copyCodeButton.textContent;


                    copyCodeButton.textContent =
                        "Copied";


                    setTimeout(() => {

                        copyCodeButton.textContent =
                            originalText;

                    }, 1800);


                } catch (error) {

                    /* ---------------------------------
                       FALLBACK FOR OLDER BROWSERS
                    --------------------------------- */

                    try {

                        const temporaryInput =
                            document.createElement(
                                "input"
                            );

                        temporaryInput.value =
                            code;

                        document.body.appendChild(
                            temporaryInput
                        );

                        temporaryInput.select();

                        document.execCommand(
                            "copy"
                        );

                        temporaryInput.remove();


                        showMessage(
                            `${selectedPaymentMethod} merchant code copied.`,
                            "success"
                        );

                    } catch (fallbackError) {

                        showMessage(
                            "Could not copy the merchant code. Please copy it manually.",
                            "error"
                        );

                    }

                }

            }
        );

    }


    /* =====================================================
       AMOUNT INPUT
    ===================================================== */

    if (amountInput) {

        amountInput.addEventListener(
            "input",
            () => {

                clearMessage();

                /* Prevent negative values */

                if (
                    Number(amountInput.value) < 0
                ) {

                    amountInput.value = "";
                }

            }
        );

    }


    /* =====================================================
       PAYMENT REFERENCE INPUT
    ===================================================== */

    if (paymentReferenceInput) {

        paymentReferenceInput.addEventListener(
            "input",
            () => {

                clearMessage();

            }
        );

    }


    /* =====================================================
       FORM SUBMISSION
    ===================================================== */

    async function submitDeposit() {

        if (!amountInput) {
            return;
        }

        if (!paymentReferenceInput) {
            return;
        }

        if (!submitButton) {
            return;
        }


        /* ---------------------------------------------
           READ VALUES
        --------------------------------------------- */

        const rawAmount =
            amountInput.value.trim();

        const amount =
            Number(rawAmount);

        const paymentReference =
            paymentReferenceInput.value.trim();


        /* ---------------------------------------------
           VALIDATE AMOUNT
        --------------------------------------------- */

        if (!rawAmount) {

            showMessage(
                "Please enter the amount you want to deposit.",
                "error"
            );

            amountInput.focus();

            return;
        }


        if (
            !Number.isFinite(amount)
        ) {

            showMessage(
                "Please enter a valid deposit amount.",
                "error"
            );

            amountInput.focus();

            return;
        }


        if (
            !Number.isInteger(amount)
        ) {

            showMessage(
                "Deposit amount must be a whole number.",
                "error"
            );

            amountInput.focus();

            return;
        }


        if (
            amount < MIN_DEPOSIT
        ) {

            showMessage(
                "Minimum deposit is UGX 10,000.",
                "error"
            );

            amountInput.focus();

            return;
        }


        /* ---------------------------------------------
           VALIDATE PAYMENT METHOD
        --------------------------------------------- */

        if (
            !PAYMENT_DETAILS[
                selectedPaymentMethod
            ]
        ) {

            showMessage(
                "Please select MTN or Airtel Mobile Money.",
                "error"
            );

            return;
        }


        /* ---------------------------------------------
           VALIDATE TRANSACTION REFERENCE
        --------------------------------------------- */

        if (
            !paymentReference
        ) {

            showMessage(
                "Please enter your Mobile Money transaction reference.",
                "error"
            );

            paymentReferenceInput.focus();

            return;
        }


        if (
            paymentReference.length < 4
        ) {

            showMessage(
                "Your transaction reference is too short.",
                "error"
            );

            paymentReferenceInput.focus();

            return;
        }


        if (
            paymentReference.length > 100
        ) {

            showMessage(
                "Your transaction reference is too long.",
                "error"
            );

            paymentReferenceInput.focus();

            return;
        }


        /* ---------------------------------------------
           DISABLE BUTTON
        --------------------------------------------- */

        const originalButtonText =
            submitButton.textContent;


        submitButton.disabled =
            true;

        submitButton.textContent =
            "Submitting...";


        showMessage(
            "Submitting your deposit for verification...",
            "info"
        );


        try {

            /* -----------------------------------------
               SEND TO FINORA BACKEND
            ----------------------------------------- */

            const response =
                await fetch(
                    `${API_BASE_URL}/api/deposits`,
                    {

                        method:
                            "POST",

                        credentials:
                            "include",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Accept":
                                "application/json"
                        },

                        body:
                            JSON.stringify({

                                amount:
                                    amount,

                                paymentMethod:
                                    selectedPaymentMethod,

                                paymentReference:
                                    paymentReference
                            })
                    }
                );


            /* -----------------------------------------
               READ SERVER RESPONSE
            ----------------------------------------- */

            let data = null;

            try {

                data =
                    await response.json();

            } catch (jsonError) {

                data = null;
            }


            /* -----------------------------------------
               AUTHENTICATION ERROR
            ----------------------------------------- */

            if (
                response.status === 401
            ) {

                showMessage(
                    "Your FINORA session has expired. Please log in again.",
                    "error"
                );

                return;
            }


            /* -----------------------------------------
               FROZEN ACCOUNT
            ----------------------------------------- */

            if (
                response.status === 403
            ) {

                showMessage(
                    data?.message ||
                    "Your FINORA account cannot submit deposits.",
                    "error"
                );

                return;
            }


            /* -----------------------------------------
               DUPLICATE REFERENCE
            ----------------------------------------- */

            if (
                response.status === 409
            ) {

                showMessage(
                    data?.message ||
                    "This payment reference has already been submitted.",
                    "error"
                );

                paymentReferenceInput.focus();

                return;
            }


            /* -----------------------------------------
               OTHER SERVER ERROR
            ----------------------------------------- */

            if (
                !response.ok
            ) {

                showMessage(
                    data?.message ||
                    "FINORA could not submit your deposit. Please try again.",
                    "error"
                );

                return;
            }


            /* -----------------------------------------
               SUCCESS
            ----------------------------------------- */

            if (
                data &&
                data.success
            ) {

                showMessage(
                    "Deposit submitted successfully. Your payment is now pending verification.",
                    "success"
                );


                /* -------------------------------------
                   CLEAR INPUTS
                ------------------------------------- */

                amountInput.value =
                    "";

                paymentReferenceInput.value =
                    "";


                /* -------------------------------------
                   KEEP PAYMENT METHOD SELECTED
                ------------------------------------- */

                updatePaymentMethod(
                    selectedPaymentMethod
                );


                /*
                   Do not redirect automatically.

                   The user should be able to see that
                   the deposit was submitted successfully.
                */

            } else {

                showMessage(
                    data?.message ||
                    "FINORA could not submit your deposit.",
                    "error"
                );

            }

        } catch (error) {

            console.error(
                "❌ FINORA DEPOSIT SUBMISSION ERROR:",
                error
            );


            showMessage(
                "Unable to connect to FINORA. Please check your internet connection and try again.",
                "error"
            );

        } finally {

            /* -----------------------------------------
               RESTORE BUTTON
            ----------------------------------------- */

            submitButton.disabled =
                false;

            submitButton.textContent =
                originalButtonText;

        }

    }


    /* =====================================================
       SUBMIT BUTTON EVENT
    ===================================================== */

    if (submitButton) {

        submitButton.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                submitDeposit();

            }
        );

    }


    /* =====================================================
       ENTER KEY SUPPORT
    ===================================================== */

    if (amountInput) {

        amountInput.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    submitDeposit();

                }

            }
        );

    }


    if (paymentReferenceInput) {

        paymentReferenceInput.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter"
                ) {

                    event.preventDefault();

                    submitDeposit();

                }

            }
        );

    }


    /* =====================================================
       INITIALIZE MTN
    ===================================================== */

    updatePaymentMethod(
        "MTN"
    );


    console.log(
        "✅ FINORA deposit.js loaded successfully."
    );

});
