document.addEventListener("DOMContentLoaded", function () {

    /* =========================================================
       FINORA DEPOSIT PAGE
    ========================================================= */

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
       FINORA PAYMENT INFORMATION
    ========================================================= */

    const paymentDetails = {

        MTN: {
            merchantCode: "52200475",

            ussd:
                "Dial *165*3# on your MTN line, select the merchant payment option, and enter merchant code 52200475."
        },

        Airtel: {
            merchantCode: "7157334",

            ussd:
                "Dial *185*9# on your Airtel line and follow the payment instructions using merchant code 7157334."
        }

    };


    let selectedMethod = "MTN";

    let submitting = false;


    /* =========================================================
       MESSAGE
    ========================================================= */

    function showMessage(text, type) {

        if (!messageBox) {
            return;
        }

        messageBox.textContent = text;

        messageBox.style.display = "block";

        messageBox.classList.remove(
            "success",
            "error",
            "info"
        );

        messageBox.classList.add(
            type || "info"
        );
    }


    function clearMessage() {

        if (!messageBox) {
            return;
        }

        messageBox.textContent = "";

        messageBox.style.display = "none";

        messageBox.classList.remove(
            "success",
            "error",
            "info"
        );
    }


    /* =========================================================
       SELECT PAYMENT METHOD
    ========================================================= */

    function selectPaymentMethod(method) {

        if (
            !paymentDetails[method]
        ) {
            return;
        }

        selectedMethod = method;


        const details =
            paymentDetails[method];


        /* -----------------------------------------
           MERCHANT NETWORK
        ----------------------------------------- */

        if (merchantNetwork) {

            merchantNetwork.textContent =
                method;
        }


        /* -----------------------------------------
           MERCHANT CODE
        ----------------------------------------- */

        if (merchantCode) {

            merchantCode.textContent =
                details.merchantCode;
        }


        /* -----------------------------------------
           USSD INSTRUCTION
        ----------------------------------------- */

        if (ussdText) {

            ussdText.textContent =
                details.ussd;
        }


        /* -----------------------------------------
           ACTIVE MTN CARD
        ----------------------------------------- */

        if (mtnOption) {

            mtnOption.classList.toggle(
                "selected",
                method === "MTN"
            );
        }


        /* -----------------------------------------
           ACTIVE AIRTEL CARD
        ----------------------------------------- */

        if (airtelOption) {

            airtelOption.classList.toggle(
                "selected",
                method === "Airtel"
            );
        }


        /* -----------------------------------------
           ACCESSIBILITY STATE
        ----------------------------------------- */

        if (mtnOption) {

            mtnOption.setAttribute(
                "aria-checked",
                method === "MTN"
                    ? "true"
                    : "false"
            );
        }


        if (airtelOption) {

            airtelOption.setAttribute(
                "aria-checked",
                method === "Airtel"
                    ? "true"
                    : "false"
            );
        }


        clearMessage();
    }


    /* =========================================================
       MTN BUTTON
    ========================================================= */

    if (mtnOption) {

        mtnOption.addEventListener(
            "click",
            function () {

                selectPaymentMethod(
                    "MTN"
                );

            }
        );
    }


    /* =========================================================
       AIRTEL BUTTON
    ========================================================= */

    if (airtelOption) {

        airtelOption.addEventListener(
            "click",
            function () {

                selectPaymentMethod(
                    "Airtel"
                );

            }
        );
    }


    /* =========================================================
       COPY MERCHANT CODE
    ========================================================= */

    if (copyCodeButton) {

        copyCodeButton.addEventListener(
            "click",
            async function () {

                const code =
                    paymentDetails[
                        selectedMethod
                    ].merchantCode;


                try {

                    if (
                        navigator.clipboard &&
                        navigator.clipboard.writeText
                    ) {

                        await navigator.clipboard.writeText(
                            code
                        );

                    } else {

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
                    }


                    showMessage(
                        `${selectedMethod} merchant code ${code} copied successfully.`,
                        "success"
                    );


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
    }


    /* =========================================================
       SUBMIT DEPOSIT
    ========================================================= */

    if (submitButton) {

        submitButton.addEventListener(
            "click",
            async function (event) {

                event.preventDefault();


                if (submitting) {
                    return;
                }


                clearMessage();


                /* -----------------------------------------
                   AMOUNT
                ----------------------------------------- */

                const amount =
                    Number(
                        amountInput
                            ? amountInput.value.trim()
                            : 0
                    );


                /* -----------------------------------------
                   PAYMENT REFERENCE
                ----------------------------------------- */

                const reference =
                    paymentReference
                        ? paymentReference.value.trim()
                        : "";


                /* -----------------------------------------
                   AMOUNT VALIDATION
                ----------------------------------------- */

                if (
                    !Number.isFinite(amount)
                ) {

                    showMessage(
                        "Please enter a valid deposit amount.",
                        "error"
                    );

                    if (amountInput) {
                        amountInput.focus();
                    }

                    return;
                }


                if (
                    amount < 10000
                ) {

                    showMessage(
                        "Minimum deposit is UGX 10,000.",
                        "error"
                    );

                    if (amountInput) {
                        amountInput.focus();
                    }

                    return;
                }


                if (
                    !Number.isInteger(amount)
                ) {

                    showMessage(
                        "Please enter a whole UGX amount.",
                        "error"
                    );

                    if (amountInput) {
                        amountInput.focus();
                    }

                    return;
                }


                /* -----------------------------------------
                   PAYMENT REFERENCE VALIDATION
                ----------------------------------------- */

                if (
                    !reference
                ) {

                    showMessage(
                        "Please enter your Mobile Money transaction reference.",
                        "error"
                    );

                    if (paymentReference) {
                        paymentReference.focus();
                    }

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

                    if (paymentReference) {
                        paymentReference.focus();
                    }

                    return;
                }


                /* -----------------------------------------
                   START SUBMISSION
                ----------------------------------------- */

                submitting = true;

                submitButton.disabled = true;

                submitButton.setAttribute(
                    "aria-busy",
                    "true"
                );


                const originalButtonText =
                    submitButton.textContent;


                submitButton.textContent =
                    "Submitting...";


                try {

                    /* =====================================
                       REAL FINORA BACKEND
                    ===================================== */

                    const response =
                        await fetch(
                            "https://finora-platform-production.up.railway.app/api/deposits",
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
                                            selectedMethod,

                                        paymentReference:
                                            reference
                                    })
                            }
                        );


                    let data = null;


                    try {

                        data =
                            await response.json();

                    } catch (error) {

                        data = null;
                    }


                    /* -------------------------------------
                       BACKEND REJECTED REQUEST
                    ------------------------------------- */

                    if (
                        !response.ok
                    ) {

                        throw new Error(
                            data &&
                            data.message
                                ? data.message
                                : "FINORA could not submit your deposit."
                        );
                    }


                    /* -------------------------------------
                       REAL SUCCESS
                    ------------------------------------- */

                    showMessage(
                        data &&
                        data.message
                            ? data.message
                            : "Deposit submitted successfully and is pending verification.",
                        "success"
                    );


                    /* -------------------------------------
                       CLEAR REFERENCE AFTER SUCCESS
                    ------------------------------------- */

                    if (paymentReference) {

                        paymentReference.value =
                            "";
                    }


                } catch (error) {

                    console.error(
                        "❌ FINORA DEPOSIT ERROR:",
                        error
                    );


                    showMessage(
                        error.message ||
                        "FINORA could not submit your deposit. Please try again.",
                        "error"
                    );


                } finally {

                    submitting = false;

                    submitButton.disabled =
                        false;

                    submitButton.removeAttribute(
                        "aria-busy"
                    );

                    submitButton.textContent =
                        originalButtonText;
                }

            }
        );
    }


    /* =========================================================
       INITIAL STATE
    ========================================================= */

    selectPaymentMethod(
        "MTN"
    );

});
