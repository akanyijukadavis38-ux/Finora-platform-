/* =========================================================
   FINORA DEPOSIT PAGE
   deposit.js

   MATCHED DIRECTLY TO:
   deposit.html

   BACKEND:
   https://finora-platform-production.up.railway.app/api/deposits
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    "use strict";


    /* =====================================================
       CONFIGURATION
    ===================================================== */

    const API_URL =
        "https://finora-platform-production.up.railway.app/api/deposits";

    const MIN_DEPOSIT = 10000;


    const PAYMENT_DETAILS = {

        MTN: {
            network: "MTN MOBILE MONEY",
            merchantCode: "52200475",
            ussd:
                "Dial *165*3# on your MTN line, select the merchant payment option, and enter merchant code 52200475."
        },

        Airtel: {
            network: "AIRTEL MONEY",
            merchantCode: "7157334",
            ussd:
                "Dial *185*9# on your Airtel line, select the merchant payment option, and enter merchant code 7157334."
        }

    };


    /* =====================================================
       GET HTML ELEMENTS
    ===================================================== */

    const amountInput =
        document.getElementById("amount");

    const mtnRadio =
        document.getElementById("mtn");

    const airtelRadio =
        document.getElementById("airtel");

    const merchantBox =
        document.getElementById("merchantBox");

    const merchantNetwork =
        document.getElementById("merchantNetwork");

    const merchantCode =
        document.getElementById("merchantCode");

    const copyButton =
        document.getElementById("copyCode");

    const ussdText =
        document.getElementById("ussdText");

    const paymentReference =
        document.getElementById("paymentReference");

    const submitButton =
        document.getElementById("submitDeposit");

    const messageBox =
        document.getElementById("message");


    /* =====================================================
       CHECK REQUIRED ELEMENTS
    ===================================================== */

    const missingElements = [];

    if (!amountInput) {
        missingElements.push("#amount");
    }

    if (!mtnRadio) {
        missingElements.push("#mtn");
    }

    if (!airtelRadio) {
        missingElements.push("#airtel");
    }

    if (!merchantNetwork) {
        missingElements.push("#merchantNetwork");
    }

    if (!merchantCode) {
        missingElements.push("#merchantCode");
    }

    if (!ussdText) {
        missingElements.push("#ussdText");
    }

    if (!copyButton) {
        missingElements.push("#copyCode");
    }

    if (!paymentReference) {
        missingElements.push("#paymentReference");
    }

    if (!submitButton) {
        missingElements.push("#submitDeposit");
    }

    if (!messageBox) {
        missingElements.push("#message");
    }


    if (missingElements.length > 0) {

        console.error(
            "❌ FINORA deposit.js: Missing HTML elements:",
            missingElements
        );

        return;
    }


    /* =====================================================
       CURRENT PAYMENT METHOD
    ===================================================== */

    let selectedPaymentMethod = "MTN";


    /* =====================================================
       MESSAGE FUNCTION
    ===================================================== */

    function showMessage(text, type) {

        messageBox.textContent = text;

        /*
           Explicitly make the message visible.
           This prevents the message from depending
           entirely on CSS.
        */

        messageBox.style.display = "block";
        messageBox.style.visibility = "visible";
        messageBox.style.opacity = "1";

        messageBox.classList.remove(
            "success",
            "error",
            "info",
            "warning"
        );

        messageBox.classList.add(
            type || "info"
        );

    }


    function clearMessage() {

        messageBox.textContent = "";

        messageBox.classList.remove(
            "success",
            "error",
            "info",
            "warning"
        );

    }


    /* =====================================================
       GET VISIBLE PAYMENT CARD
    ===================================================== */

    function getPaymentLabel(radio) {

        if (!radio) {
            return null;
        }

        /*
           Your HTML is:

           <div class="payment-option">
               <input ...>
               <label ...>
           </div>

           Therefore we get the label from the
           radio button's parent.
        */

        const option =
            radio.closest(".payment-option");

        if (!option) {
            return null;
        }

        return option.querySelector(
            ".payment-label"
        );

    }


    /* =====================================================
       UPDATE PAYMENT DISPLAY
    ===================================================== */

    function updatePaymentMethod(method) {

        const details =
            PAYMENT_DETAILS[method];

        if (!details) {
            return;
        }


        selectedPaymentMethod =
            method;


        /* ---------------------------------------------
           MAKE THE CORRECT RADIO ACTIVE
        --------------------------------------------- */

        if (method === "MTN") {

            mtnRadio.checked = true;
            airtelRadio.checked = false;

        } else {

            mtnRadio.checked = false;
            airtelRadio.checked = true;

        }


        /* ---------------------------------------------
           GET VISIBLE CARDS
        --------------------------------------------- */

        const mtnLabel =
            getPaymentLabel(mtnRadio);

        const airtelLabel =
            getPaymentLabel(airtelRadio);


        /* ---------------------------------------------
           UPDATE VISUAL SELECTED STATE
        --------------------------------------------- */

        if (mtnLabel) {

            mtnLabel.classList.toggle(
                "selected",
                method === "MTN"
            );

        }


        if (airtelLabel) {

            airtelLabel.classList.toggle(
                "selected",
                method === "Airtel"
            );

        }


        /* ---------------------------------------------
           UPDATE MERCHANT INFORMATION
        --------------------------------------------- */

        merchantNetwork.textContent =
            details.network;

        merchantCode.textContent =
            details.merchantCode;

        ussdText.textContent =
            details.ussd;


        /* ---------------------------------------------
           UPDATE DATA ATTRIBUTE
        --------------------------------------------- */

        if (merchantBox) {

            merchantBox.dataset.network =
                method;

        }


        /* ---------------------------------------------
           RESET COPY BUTTON
        --------------------------------------------- */

        copyButton.textContent =
            "Copy";

        copyButton.disabled =
            false;

    }


    /* =====================================================
       MTN RADIO
    ===================================================== */

    mtnRadio.addEventListener(
        "change",
        function () {

            if (this.checked) {

                updatePaymentMethod(
                    "MTN"
                );

                clearMessage();

            }

        }
    );


    /* =====================================================
       AIRTEL RADIO
    ===================================================== */

    airtelRadio.addEventListener(
        "change",
        function () {

            if (this.checked) {

                updatePaymentMethod(
                    "Airtel"
                );

                clearMessage();

            }

        }
    );


    /* =====================================================
       ALSO ALLOW CLICKING THE WHOLE PAYMENT CARD
    ===================================================== */

    const mtnLabel =
        getPaymentLabel(mtnRadio);

    const airtelLabel =
        getPaymentLabel(airtelRadio);


    if (mtnLabel) {

        mtnLabel.addEventListener(
            "click",
            function () {

                /*
                   The label automatically checks the
                   radio because it has for="mtn".
                */

                setTimeout(function () {

                    updatePaymentMethod(
                        "MTN"
                    );

                    clearMessage();

                }, 0);

            }
        );

    }


    if (airtelLabel) {

        airtelLabel.addEventListener(
            "click",
            function () {

                setTimeout(function () {

                    updatePaymentMethod(
                        "Airtel"
                    );

                    clearMessage();

                }, 0);

            }
        );

    }


    /* =====================================================
       COPY MERCHANT CODE
    ===================================================== */

    copyButton.addEventListener(
        "click",
        async function (event) {

            event.preventDefault();

            const code =
                merchantCode.textContent.trim();


            if (!code) {

                showMessage(
                    "There is no merchant code to copy.",
                    "error"
                );

                return;
            }


            /* -----------------------------------------
               TRY MODERN CLIPBOARD
            ----------------------------------------- */

            try {

                if (
                    navigator.clipboard &&
                    window.isSecureContext
                ) {

                    await navigator.clipboard.writeText(
                        code
                    );

                } else {

                    throw new Error(
                        "Clipboard API unavailable"
                    );

                }


                copyButton.textContent =
                    "Copied";

                copyButton.disabled =
                    true;


                showMessage(
                    `${selectedPaymentMethod} merchant code copied successfully.`,
                    "success"
                );


                setTimeout(function () {

                    copyButton.textContent =
                        "Copy";

                    copyButton.disabled =
                        false;

                }, 1800);


                return;

            } catch (clipboardError) {

                console.warn(
                    "FINORA clipboard API unavailable. Using fallback.",
                    clipboardError
                );

            }


            /* -----------------------------------------
               FALLBACK COPY METHOD
            ----------------------------------------- */

            try {

                const temporaryInput =
                    document.createElement("input");

                temporaryInput.value =
                    code;

                temporaryInput.style.position =
                    "fixed";

                temporaryInput.style.left =
                    "-9999px";

                document.body.appendChild(
                    temporaryInput
                );

                temporaryInput.focus();

                temporaryInput.select();

                const copied =
                    document.execCommand(
                        "copy"
                    );

                temporaryInput.remove();


                if (!copied) {

                    throw new Error(
                        "Copy command failed"
                    );

                }


                copyButton.textContent =
                    "Copied";

                copyButton.disabled =
                    true;


                showMessage(
                    `${selectedPaymentMethod} merchant code copied successfully.`,
                    "success"
                );


                setTimeout(function () {

                    copyButton.textContent =
                        "Copy";

                    copyButton.disabled =
                        false;

                }, 1800);


            } catch (copyError) {

                console.error(
                    "❌ FINORA COPY ERROR:",
                    copyError
                );


                showMessage(
                    `Please copy the merchant code manually: ${code}`,
                    "error"
                );

            }

        }
    );


    /* =====================================================
       AMOUNT INPUT
    ===================================================== */

    amountInput.addEventListener(
        "input",
        function () {

            clearMessage();

            if (
                Number(this.value) < 0
            ) {

                this.value = "";

            }

        }
    );


    /* =====================================================
       TRANSACTION REFERENCE INPUT
    ===================================================== */

    paymentReference.addEventListener(
        "input",
        function () {

            clearMessage();

        }
    );


    /* =====================================================
       VALIDATE DEPOSIT
    ===================================================== */

    function validateDeposit() {

        const rawAmount =
            amountInput.value.trim();

        const amount =
            Number(rawAmount);

        const reference =
            paymentReference.value.trim();


        /* ---------------------------------------------
           AMOUNT REQUIRED
        --------------------------------------------- */

        if (!rawAmount) {

            showMessage(
                "Please enter your deposit amount.",
                "error"
            );

            amountInput.focus();

            return null;
        }


        /* ---------------------------------------------
           VALID NUMBER
        --------------------------------------------- */

        if (
            !Number.isFinite(amount)
        ) {

            showMessage(
                "Please enter a valid deposit amount.",
                "error"
            );

            amountInput.focus();

            return null;
        }


        /* ---------------------------------------------
           WHOLE NUMBER
        --------------------------------------------- */

        if (
            !Number.isInteger(amount)
        ) {

            showMessage(
                "Deposit amount must be a whole number.",
                "error"
            );

            amountInput.focus();

            return null;
        }


        /* ---------------------------------------------
           MINIMUM
        --------------------------------------------- */

        if (
            amount < MIN_DEPOSIT
        ) {

            showMessage(
                "Minimum deposit is UGX 10,000.",
                "error"
            );

            amountInput.focus();

            return null;
        }


        /* ---------------------------------------------
           PAYMENT METHOD
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

            return null;
        }


        /* ---------------------------------------------
           REFERENCE REQUIRED
        --------------------------------------------- */

        if (!reference) {

            showMessage(
                "Please enter your Mobile Money transaction reference.",
                "error"
            );

            paymentReference.focus();

            return null;
        }


        /* ---------------------------------------------
           REFERENCE LENGTH
        --------------------------------------------- */

        if (
            reference.length < 4
        ) {

            showMessage(
                "The transaction reference must contain at least 4 characters.",
                "error"
            );

            paymentReference.focus();

            return null;
        }


        if (
            reference.length > 100
        ) {

            showMessage(
                "The transaction reference is too long.",
                "error"
            );

            paymentReference.focus();

            return null;
        }


        return {
            amount: amount,
            paymentMethod:
                selectedPaymentMethod,
            paymentReference:
                reference
        };

    }


    /* =====================================================
       SUBMIT DEPOSIT
    ===================================================== */

    async function submitDeposit() {

        const deposit =
            validateDeposit();


        if (!deposit) {
            return;
        }


        /* ---------------------------------------------
           SAVE ORIGINAL BUTTON
        --------------------------------------------- */

        const originalHTML =
            submitButton.innerHTML;


        /* ---------------------------------------------
           DISABLE SUBMIT
        --------------------------------------------- */

        submitButton.disabled =
            true;

        submitButton.innerHTML =
            "<span>Submitting...</span><span class=\"button-arrow\">⏳</span>";


        showMessage(
            "Submitting your deposit...",
            "info"
        );


        try {

            console.log(
                "FINORA deposit submission:",
                deposit
            );


            /* -----------------------------------------
               SEND TO BACKEND
            ----------------------------------------- */

            const response =
                await fetch(
                    API_URL,
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
                            JSON.stringify(
                                deposit
                            )
                    }
                );


            /* -----------------------------------------
               READ RESPONSE
            ----------------------------------------- */

            let data = null;

            try {

                data =
                    await response.json();

            } catch (jsonError) {

                console.warn(
                    "FINORA: Server response was not JSON.",
                    jsonError
                );

            }


            console.log(
                "FINORA deposit response:",
                response.status,
                data
            );


            /* -----------------------------------------
               NOT LOGGED IN
            ----------------------------------------- */

            if (
                response.status === 401
            ) {

                showMessage(
                    data?.message ||
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

                paymentReference.focus();

                return;
            }


            /* -----------------------------------------
               VALIDATION ERROR
            ----------------------------------------- */

            if (
                response.status === 400
            ) {

                showMessage(
                    data?.message ||
                    "Please check your deposit information.",
                    "error"
                );

                return;
            }


            /* -----------------------------------------
               SERVER ERROR
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
                data.success === true
            ) {

                showMessage(
                    "Deposit submitted successfully. Your deposit is now pending verification.",
                    "success"
                );


                /* -------------------------------------
                   CLEAR FORM
                ------------------------------------- */

                amountInput.value =
                    "";

                paymentReference.value =
                    "";


                console.log(
                    "✅ FINORA deposit created:",
                    data.deposit
                );


            } else {

                showMessage(
                    data?.message ||
                    "FINORA could not submit your deposit.",
                    "error"
                );

            }


        } catch (error) {

            console.error(
                "❌ FINORA DEPOSIT ERROR:",
                error
            );


            /*
               This normally means:
               - Internet problem
               - Backend unavailable
               - CORS problem
               - Railway service unavailable
            */

            showMessage(
                "FINORA could not connect to the server. Please check your internet connection and try again.",
                "error"
            );


        } finally {

            /* -----------------------------------------
               RESTORE BUTTON
            ----------------------------------------- */

            submitButton.disabled =
                false;

            submitButton.innerHTML =
                originalHTML;

        }

    }


    /* =====================================================
       SUBMIT BUTTON
    ===================================================== */

    submitButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            submitDeposit();

        }
    );


    /* =====================================================
       ENTER KEY
    ===================================================== */

    amountInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                submitDeposit();

            }

        }
    );


    paymentReference.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                submitDeposit();

            }

        }
    );


    /* =====================================================
       INITIAL STATE
    ===================================================== */

    updatePaymentMethod(
        "MTN"
    );


    console.log(
        "======================================"
    );

    console.log(
        "✅ FINORA DEPOSIT JS READY"
    );

    console.log(
        "💰 MTN CODE: 52200475"
    );

    console.log(
        "💰 AIRTEL CODE: 7157334"
    );

    console.log(
        "💵 MINIMUM: UGX 10,000"
    );

    console.log(
        "🌐 API:",
        API_URL
    );

    console.log(
        "======================================"

    );

});
