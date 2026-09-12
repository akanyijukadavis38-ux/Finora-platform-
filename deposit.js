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

    const pageLoader =
        document.getElementById("pageLoader");

    const depositPage =
        document.getElementById("depositPage");

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
       ELEMENT CHECK
    ========================================================= */

    if (
        !depositPage ||
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
            "FINORA Deposit: Required elements are missing."
        );

        return;
    }


    /* =========================================================
       PAGE LOADING PROTECTION
    ========================================================= */

    requestAnimationFrame(() => {

        setTimeout(() => {

            if (pageLoader) {

                pageLoader.classList.add(
                    "hidden"
                );

            }

        }, 350);

    });


    /* =========================================================
       MESSAGE SYSTEM
    ========================================================= */

    function showMessage(
        text,
        type = "error"
    ) {

        messageBox.textContent = text;

        messageBox.className =
            "message show " + type;

        window.setTimeout(() => {

            if (
                messageBox.classList.contains(
                    "show"
                )
            ) {

                messageBox.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest"
                });

            }

        }, 50);
    }


    function clearMessage() {

        messageBox.textContent = "";

        messageBox.className =
            "message";
    }


    /* =========================================================
       SUBMIT BUTTON STATE
    ========================================================= */

    function setLoading(isLoading) {

        if (isLoading) {

            submitButton.disabled = true;

            submitButton.innerHTML = `
                <span class="submit-text">
                    Submitting...
                </span>

                <span class="submit-arrow">
                    ⏳
                </span>
            `;

        } else {

            submitButton.disabled = false;

            submitButton.innerHTML = `
                <span class="submit-text">
                    Submit Deposit
                </span>

                <span class="submit-arrow">
                    →
                </span>
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
       UPDATE PAYMENT DETAILS
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


        /*
         * Small visual refresh when
         * switching payment networks.
         */

        merchantBox.animate(
            [
                {
                    opacity: 0.72,
                    transform: "translateY(2px)"
                },
                {
                    opacity: 1,
                    transform: "translateY(0)"
                }
            ],
            {
                duration: 220,
                easing: "ease-out"
            }
        );
    }


    /* =========================================================
       PAYMENT METHOD EVENTS
    ========================================================= */

    mtnRadio.addEventListener(
        "change",
        () => {

            clearMessage();

            updatePaymentMethod();
        }
    );


    airtelRadio.addEventListener(
        "change",
        () => {

            clearMessage();

            updatePaymentMethod();
        }
    );


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

            const originalHTML =
                copyCodeButton.innerHTML;

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

                    temporaryInput.value =
                        code;

                    temporaryInput.setAttribute(
                        "readonly",
                        ""
                    );

                    temporaryInput.style.position =
                        "fixed";

                    temporaryInput.style.top =
                        "-9999px";

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


                copyCodeButton.innerHTML = `
                    <span>
                        ✓
                    </span>

                    <span>
                        Copied
                    </span>
                `;

                copyCodeButton.classList.add(
                    "copied"
                );


                window.setTimeout(() => {

                    copyCodeButton.innerHTML =
                        originalHTML;

                    copyCodeButton.classList.remove(
                        "copied"
                    );

                }, 1600);

            } catch (error) {

                console.error(
                    "FINORA COPY ERROR:",
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
       AMOUNT INPUT
    ========================================================= */

    amountInput.addEventListener(
        "input",
        () => {

            clearMessage();

            /*
             * Prevent negative values.
             */

            if (
                Number(amountInput.value) < 0
            ) {

                amountInput.value = "";
            }
        }
    );


    /* =========================================================
       TRANSACTION REFERENCE
    ========================================================= */

    paymentReference.addEventListener(
        "input",
        () => {

            clearMessage();

            /*
             * Remove accidental leading spaces.
             */

            paymentReference.value =
                paymentReference.value.replace(
                    /^\s+/,
                    ""
                );
        }
    );


    /* =========================================================
       ENTER KEY SUPPORT
    ========================================================= */

    paymentReference.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !submitButton.disabled
            ) {

                event.preventDefault();

                submitButton.click();
            }
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
               TRANSACTION REFERENCE
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
               PAYMENT CONFIRMATION
            --------------------------------------------- */

            const confirmed =
                window.confirm(
                    `Confirm that you have completed the ${paymentMethod} Mobile Money payment using merchant code ${PAYMENT_DETAILS[paymentMethod].merchantCode}.\n\nTransaction reference: ${reference}\n\nSubmit this deposit for verification?`
                );

            if (!confirmed) {
                return;
            }


            /* ---------------------------------------------
               LOADING
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


                /* -----------------------------------------
                   READ SERVER RESPONSE
                ----------------------------------------- */

                let data = null;

                try {

                    data =
                        await response.json();

                } catch (error) {

                    data = null;
                }


                /* -----------------------------------------
                   SESSION EXPIRED
                ----------------------------------------- */

                if (
                    response.status === 401
                ) {

                    showMessage(
                        data?.message ||
                        "Your FINORA session has expired. Please log in again.",
                        "error"
                    );

                    setLoading(false);

                    return;
                }


                /* -----------------------------------------
                   ACCOUNT FROZEN
                ----------------------------------------- */

                if (
                    response.status === 403
                ) {

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

                if (
                    response.status === 409
                ) {

                    showMessage(
                        data?.message ||
                        "This payment reference has already been submitted.",
                        "error"
                    );

                    setLoading(false);

                    return;
                }


                /* -----------------------------------------
                   VALIDATION / SERVER ERROR
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


                    /*
                     * Clear entered values after
                     * successful submission.
                     */

                    amountInput.value = "";

                    paymentReference.value = "";


                    /*
                     * IMPORTANT:
                     *
                     * The frontend does NOT credit
                     * the user's wallet.
                     *
                     * The backend deposit remains
                     * "pending" until administrator
                     * verification and approval.
                     */

                    setLoading(false);

                    return;
                }


                /* -----------------------------------------
                   UNEXPECTED RESPONSE
                ----------------------------------------- */

                showMessage(
                    "FINORA returned an unexpected response. Please try again.",
                    "error"
                );

                setLoading(false);

            } catch (error) {

                console.error(
                    "FINORA DEPOSIT REQUEST ERROR:",
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
       INITIALIZE PAYMENT METHOD
    ========================================================= */

    updatePaymentMethod();

});
