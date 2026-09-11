"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       FINORA DEPOSIT CONFIGURATION
    ========================================================= */

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


    /* =========================================================
       GET ELEMENTS
    ========================================================= */

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

    const copyCodeButton =
        document.getElementById("copyCode");

    const ussdText =
        document.getElementById("ussdText");

    const paymentReference =
        document.getElementById("paymentReference");

    const submitButton =
        document.getElementById("submitDeposit");

    const messageBox =
        document.getElementById("message");


    /* =========================================================
       BASIC ELEMENT CHECK
    ========================================================= */

    if (
        !amountInput ||
        !mtnRadio ||
        !airtelRadio ||
        !merchantBox ||
        !merchantNetwork ||
        !merchantCode ||
        !copyCodeButton ||
        !ussdText ||
        !paymentReference ||
        !submitButton ||
        !messageBox
    ) {
        console.error(
            "❌ FINORA Deposit: Required HTML elements are missing."
        );

        return;
    }


    /* =========================================================
       MESSAGE HANDLER
    ========================================================= */

    function showMessage(
        text,
        type = "error"
    ) {

        messageBox.textContent = text;

        messageBox.className =
            "message " + type;

        messageBox.style.display = "block";

        messageBox.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });
    }


    function clearMessage() {

        messageBox.textContent = "";

        messageBox.className = "message";

        messageBox.style.display = "none";
    }


    /* =========================================================
       BUTTON LOADING STATE
    ========================================================= */

    function setLoading(isLoading) {

        if (isLoading) {

            submitButton.disabled = true;

            submitButton.classList.add(
                "loading"
            );

            submitButton.innerHTML = `
                <span>Submitting...</span>
                <span class="button-arrow">⏳</span>
            `;

        } else {

            submitButton.disabled = false;

            submitButton.classList.remove(
                "loading"
            );

            submitButton.innerHTML = `
                <span>Submit Deposit</span>
                <span class="button-arrow">→</span>
            `;
        }
    }


    /* =========================================================
       GET SELECTED PAYMENT METHOD
    ========================================================= */

    function getPaymentMethod() {

        if (mtnRadio.checked) {
            return "MTN";
        }

        if (airtelRadio.checked) {
            return "Airtel";
        }

        return null;
    }


    /* =========================================================
       UPDATE PAYMENT INFORMATION
    ========================================================= */

    function updatePaymentMethod() {

        const method =
            getPaymentMethod();

        if (!method) {
            return;
        }

        const details =
            PAYMENT_DETAILS[method];

        merchantNetwork.textContent =
            details.network;

        merchantCode.textContent =
            details.merchantCode;

        ussdText.textContent =
            details.ussd;

        merchantBox.classList.add(
            "method-updated"
        );

        setTimeout(() => {
            merchantBox.classList.remove(
                "method-updated"
            );
        }, 250);


        /* Update visual selected state */

        const mtnLabel =
            document.querySelector(
                'label[for="mtn"]'
            );

        const airtelLabel =
            document.querySelector(
                'label[for="airtel"]'
            );

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
    }


    /* =========================================================
       PAYMENT METHOD EVENTS
    ========================================================= */

    mtnRadio.addEventListener(
        "change",
        () => {
            updatePaymentMethod();
        }
    );

    airtelRadio.addEventListener(
        "change",
        () => {
            updatePaymentMethod();
        }
    );


    /* =========================================================
       PAYMENT LABEL CLICK SUPPORT
    ========================================================= */

    const paymentLabels =
        document.querySelectorAll(
            ".payment-label"
        );

    paymentLabels.forEach(label => {

        label.addEventListener(
            "click",
            () => {

                const targetId =
                    label.getAttribute(
                        "for"
                    );

                const radio =
                    document.getElementById(
                        targetId
                    );

                if (!radio) {
                    return;
                }

                radio.checked = true;

                updatePaymentMethod();
            }
        );
    });


    /* =========================================================
       COPY MERCHANT CODE
    ========================================================= */

    copyCodeButton.addEventListener(
        "click",
        async () => {

            const code =
                merchantCode.textContent.trim();

            if (!code) {
                return;
            }

            try {

                if (
                    navigator.clipboard &&
                    window.isSecureContext
                ) {

                    await navigator.clipboard.writeText(
                        code
                    );

                } else {

                    const temporaryInput =
                        document.createElement(
                            "textarea"
                        );

                    temporaryInput.value = code;

                    temporaryInput.style.position =
                        "fixed";

                    temporaryInput.style.opacity =
                        "0";

                    document.body.appendChild(
                        temporaryInput
                    );

                    temporaryInput.focus();

                    temporaryInput.select();

                    document.execCommand(
                        "copy"
                    );

                    temporaryInput.remove();
                }

                const originalText =
                    copyCodeButton.textContent;

                copyCodeButton.textContent =
                    "Copied!";

                copyCodeButton.classList.add(
                    "copied"
                );

                setTimeout(() => {

                    copyCodeButton.textContent =
                        originalText;

                    copyCodeButton.classList.remove(
                        "copied"
                    );

                }, 1500);

            } catch (error) {

                console.error(
                    "❌ FINORA COPY ERROR:",
                    error
                );

                showMessage(
                    "Could not copy the merchant code. Please copy it manually.",
                    "error"
                );
            }
        }
    );


    /* =========================================================
       AMOUNT FORMATTING / VALIDATION
    ========================================================= */

    amountInput.addEventListener(
        "input",
        () => {

            clearMessage();

            let value =
                amountInput.value;

            if (value.includes("-")) {

                value =
                    value.replace(
                        /-/g,
                        ""
                    );

                amountInput.value =
                    value;
            }
        }
    );


    /* =========================================================
       REFERENCE INPUT
    ========================================================= */

    paymentReference.addEventListener(
        "input",
        () => {
            clearMessage();

            paymentReference.value =
                paymentReference.value.trimStart();
        }
    );


    /* =========================================================
       SUBMIT DEPOSIT
    ========================================================= */

    submitButton.addEventListener(
        "click",
        async () => {

            clearMessage();

            if (submitButton.disabled) {
                return;
            }


            /* ---------------------------------------------
               AMOUNT
            --------------------------------------------- */

            const amount =
                Number(
                    amountInput.value
                );

            if (
                !Number.isFinite(amount) ||
                amount <= 0
            ) {

                showMessage(
                    "Please enter a valid deposit amount.",
                    "error"
                );

                amountInput.focus();

                return;
            }


            if (amount < MIN_DEPOSIT) {

                showMessage(
                    "Minimum deposit is UGX 10,000.",
                    "error"
                );

                amountInput.focus();

                return;
            }


            /* ---------------------------------------------
               PAYMENT METHOD
            --------------------------------------------- */

            const paymentMethod =
                getPaymentMethod();

            if (!paymentMethod) {

                showMessage(
                    "Please select MTN or Airtel Mobile Money.",
                    "error"
                );

                return;
            }


            /* ---------------------------------------------
               PAYMENT REFERENCE
            --------------------------------------------- */

            const reference =
                paymentReference.value.trim();

            if (!reference) {

                showMessage(
                    "Please enter your Mobile Money transaction reference.",
                    "error"
                );

                paymentReference.focus();

                return;
            }


            if (
                reference.length < 4 ||
                reference.length > 100
            ) {

                showMessage(
                    "Please enter a valid payment reference.",
                    "error"
                );

                paymentReference.focus();

                return;
            }


            /* ---------------------------------------------
               CONFIRM USER HAS PAID
            --------------------------------------------- */

            const confirmed =
                window.confirm(
                    `Please confirm that you have completed the ${paymentMethod} Mobile Money payment using merchant code ${PAYMENT_DETAILS[paymentMethod].merchantCode}.\n\nTransaction reference: ${reference}\n\nSubmit this deposit for verification?`
                );

            if (!confirmed) {
                return;
            }


            /* ---------------------------------------------
               START REQUEST
            --------------------------------------------- */

            setLoading(true);


            try {

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
                                JSON.stringify({
                                    amount:
                                        amount,

                                    paymentMethod:
                                        paymentMethod,

                                    paymentReference:
                                        reference
                                })
                        }
                    );


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

                if (response.status === 401) {

                    showMessage(
                        "Your FINORA session has expired. Please log in again.",
                        "error"
                    );

                    setLoading(false);

                    return;
                }


                /* -----------------------------------------
                   FROZEN ACCOUNT
                ----------------------------------------- */

                if (response.status === 403) {

                    showMessage(
                        data?.message ||
                        "Your FINORA account cannot submit deposits.",
                        "error"
                    );

                    setLoading(false);

                    return;
                }


                /* -----------------------------------------
                   DUPLICATE REFERENCE
                ----------------------------------------- */

                if (response.status === 409) {

                    showMessage(
                        data?.message ||
                        "This payment reference has already been submitted.",
                        "error"
                    );

                    setLoading(false);

                    return;
                }


                /* -----------------------------------------
                   OTHER SERVER ERROR
                ----------------------------------------- */

                if (!response.ok) {

                    showMessage(
                        data?.message ||
                        "FINORA could not submit your deposit. Please try again.",
                        "error"
                    );

                    setLoading(false);

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
                        "Deposit submitted successfully. Your payment is now pending verification.",
                        "success"
                    );


                    /* Clear form */

                    amountInput.value = "";

                    paymentReference.value = "";


                    /* Keep selected payment method */


                    /*
                     IMPORTANT:
                     The wallet is NOT credited here.

                     The deposit remains pending until
                     FINORA admin verification/approval.
                    */

                    setLoading(false);

                    return;
                }


                /* -----------------------------------------
                   UNKNOWN RESPONSE
                ----------------------------------------- */

                showMessage(
                    "FINORA returned an unexpected response. Please try again.",
                    "error"
                );

                setLoading(false);

            } catch (error) {

                console.error(
                    "❌ FINORA DEPOSIT REQUEST ERROR:",
                    error
                );

                showMessage(
                    "Unable to connect to FINORA. Please check your internet connection and try again.",
                    "error"
                );

                setLoading(false);
            }
        }
    );


    /* =========================================================
       INITIAL STATE
    ========================================================= */

    updatePaymentMethod();

});
