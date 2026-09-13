"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       CONFIGURATION
    ====================================================== */

    const API_URL =
        "https://finora-platform-production.up.railway.app/api/deposits";

    const MIN_DEPOSIT = 10000;


    const PAYMENT_DETAILS = {

        MTN: {
            network: "MTN MOBILE MONEY",
            merchantCode: "52200475",
            ussd: "*165*3#"
        },

        Airtel: {
            network: "AIRTEL MONEY",
            merchantCode: "7157334",
            ussd: "*185*9#"
        }

    };


    /* =====================================================
       DOM ELEMENTS
    ====================================================== */

    const loader =
        document.getElementById("pageLoader");

    const amountInput =
        document.getElementById("amount");

    const referenceInput =
        document.getElementById("paymentReference");

    const mtnRadio =
        document.getElementById("mtn");

    const airtelRadio =
        document.getElementById("airtel");

    const merchantNetwork =
        document.getElementById("merchantNetwork");

    const mtnDetails =
        document.getElementById("mtnDetails");

    const airtelDetails =
        document.getElementById("airtelDetails");

    const submitButton =
        document.getElementById("submitDeposit");

    const message =
        document.getElementById("message");

    const copyMtnCode =
        document.getElementById("copyMtnCode");

    const copyAirtelCode =
        document.getElementById("copyAirtelCode");


    /* =====================================================
       LOADER
    ====================================================== */

    function hideLoader() {

        if (!loader) {
            return;
        }

        loader.classList.add("hidden");

        setTimeout(() => {

            loader.style.display = "none";

        }, 450);
    }


    setTimeout(hideLoader, 1200);


    /* =====================================================
       REQUIRED ELEMENT CHECK
    ====================================================== */

    const requiredElements = [

        amountInput,
        referenceInput,
        mtnRadio,
        airtelRadio,
        merchantNetwork,
        mtnDetails,
        airtelDetails,
        submitButton,
        message

    ];


    if (requiredElements.some(element => !element)) {

        console.error(
            "FINORA Deposit: Required page element is missing."
        );

        hideLoader();

        return;
    }


    /* =====================================================
       MESSAGE SYSTEM
    ====================================================== */

    function clearMessage() {

        message.textContent = "";
        message.className = "message";

    }


    function showMessage(text, type = "error") {

        message.textContent = text;

        message.className =
            `message show ${type}`;

        message.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

    }


    /* =====================================================
       LOADING STATE
    ====================================================== */

    function setLoading(isLoading) {

        if (isLoading) {

            submitButton.classList.add("loading");

            submitButton.disabled = true;

            submitButton.querySelector(".submit-text").textContent =
                "Submitting...";

            submitButton.querySelector(".submit-arrow").textContent =
                "…";

        } else {

            submitButton.classList.remove("loading");

            submitButton.disabled = false;

            submitButton.querySelector(".submit-text").textContent =
                "Submit Deposit";

            submitButton.querySelector(".submit-arrow").textContent =
                "→";
        }

    }


    /* =====================================================
       PAYMENT METHOD
    ====================================================== */

    function getPaymentMethod() {

        if (mtnRadio.checked) {
            return "MTN";
        }

        if (airtelRadio.checked) {
            return "Airtel";
        }

        return null;
    }


    function updatePaymentMethod() {

        const method = getPaymentMethod();

        if (!method) {
            return;
        }

        const details =
            PAYMENT_DETAILS[method];


        merchantNetwork.textContent =
            details.network;


        mtnDetails.hidden =
            method !== "MTN";


        airtelDetails.hidden =
            method !== "Airtel";


        clearMessage();
    }


    mtnRadio.addEventListener(
        "change",
        updatePaymentMethod
    );


    airtelRadio.addEventListener(
        "change",
        updatePaymentMethod
    );


    updatePaymentMethod();


    /* =====================================================
       COPY MERCHANT CODE
    ====================================================== */

    async function copyMerchantCode(button) {

        if (!button) {
            return;
        }

        const value =
            button.dataset.copy;

        if (!value) {
            return;
        }


        const originalHTML =
            button.innerHTML;


        try {

            if (
                navigator.clipboard &&
                window.isSecureContext
            ) {

                await navigator.clipboard.writeText(value);

            } else {

                const temporaryInput =
                    document.createElement("textarea");

                temporaryInput.value = value;

                temporaryInput.style.position = "fixed";
                temporaryInput.style.opacity = "0";

                document.body.appendChild(
                    temporaryInput
                );

                temporaryInput.focus();
                temporaryInput.select();

                document.execCommand("copy");

                temporaryInput.remove();
            }


            button.innerHTML =
                '<span class="copy-icon">✓</span><span>Copied</span>';


            setTimeout(() => {

                button.innerHTML =
                    originalHTML;

            }, 1600);


        } catch (error) {

            console.error(
                "FINORA Deposit: Copy failed.",
                error
            );

            showMessage(
                "Unable to copy the merchant code. Please copy it manually.",
                "error"
            );
        }

    }


    if (copyMtnCode) {

        copyMtnCode.addEventListener(
            "click",
            () => copyMerchantCode(copyMtnCode)
        );

    }


    if (copyAirtelCode) {

        copyAirtelCode.addEventListener(
            "click",
            () => copyMerchantCode(copyAirtelCode)
        );

    }


    /* =====================================================
       AMOUNT VALIDATION
    ====================================================== */

    function getAmount() {

        const raw =
            String(amountInput.value || "").trim();

        if (!raw) {
            return null;
        }

        const amount =
            Number(raw);

        if (!Number.isFinite(amount)) {
            return null;
        }

        return amount;
    }


    /* =====================================================
       REFERENCE VALIDATION
    ====================================================== */

    function getReference() {

        return String(
            referenceInput.value || ""
        ).trim();

    }


    /* =====================================================
       SUBMIT DEPOSIT
    ====================================================== */

    async function submitDeposit() {

        clearMessage();


        const amount =
            getAmount();

        const paymentMethod =
            getPaymentMethod();

        const paymentReference =
            getReference();


        /* Amount */

        if (amount === null) {

            showMessage(
                "Please enter your deposit amount."
            );

            amountInput.focus();

            return;
        }


        if (amount < MIN_DEPOSIT) {

            showMessage(
                `Minimum deposit is UGX ${MIN_DEPOSIT.toLocaleString()}.`
            );

            amountInput.focus();

            return;
        }


        if (!Number.isInteger(amount)) {

            showMessage(
                "Please enter a valid whole-number amount."
            );

            amountInput.focus();

            return;
        }


        /* Payment method */

        if (!paymentMethod) {

            showMessage(
                "Please choose a payment method."
            );

            return;
        }


        /* Transaction reference */

        if (!paymentReference) {

            showMessage(
                "Please enter your Mobile Money transaction reference."
            );

            referenceInput.focus();

            return;
        }


        if (
            paymentReference.length < 4 ||
            paymentReference.length > 100
        ) {

            showMessage(
                "Please enter a valid transaction reference."
            );

            referenceInput.focus();

            return;
        }


        /* Confirmation */

        const confirmed =
            window.confirm(
                `Confirm your UGX ${amount.toLocaleString()} deposit using ${paymentMethod} Mobile Money.`
            );


        if (!confirmed) {
            return;
        }


        setLoading(true);


        try {

            const response =
                await fetch(API_URL, {

                    method: "POST",

                    credentials: "include",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        amount,
                        paymentMethod,
                        paymentReference

                    })

                });


            let data = null;


            try {

                data =
                    await response.json();

            } catch {

                data = null;

            }


            /* =================================================
               AUTHENTICATION
            ================================================== */

            if (response.status === 401) {

                showMessage(
                    "Your session has expired. Please log in again."
                );

                setTimeout(() => {

                    window.location.href =
                        "login.html";

                }, 1600);

                return;
            }


            /* =================================================
               FORBIDDEN
            ================================================== */

            if (response.status === 403) {

                showMessage(
                    data?.message ||
                    "You are not authorized to make this deposit."
                );

                return;
            }


            /* =================================================
               DUPLICATE
            ================================================== */

            if (response.status === 409) {

                showMessage(
                    data?.message ||
                    "This transaction reference has already been submitted."
                );

                referenceInput.focus();

                return;
            }


            /* =================================================
               OTHER SERVER ERRORS
            ================================================== */

            if (!response.ok) {

                showMessage(
                    data?.message ||
                    "Unable to submit your deposit right now. Please try again."
                );

                return;
            }


            /* =================================================
               SUCCESS
            ================================================== */

            const successful =
                data &&
                (
                    data.success === true ||
                    data.deposit ||
                    data.message
                );


            if (successful) {

                showMessage(
                    data.message ||
                    "Deposit submitted successfully.",
                    "success"
                );


                amountInput.value = "";

                referenceInput.value = "";


                /*
                 * Do not automatically credit the wallet here.
                 * The backend keeps the deposit pending until
                 * the authorized FINORA deposit workflow completes.
                 */


                return;
            }


            /* =================================================
               UNEXPECTED RESPONSE
            ================================================== */

            showMessage(
                "The deposit response was not recognized. Please try again."
            );


        } catch (error) {

            console.error(
                "FINORA DEPOSIT REQUEST ERROR:",
                error
            );


            showMessage(
                "Unable to connect to FINORA right now. Please check your connection and try again."
            );

        } finally {

            setLoading(false);

        }

    }


    /* =====================================================
       SUBMIT BUTTON
    ====================================================== */

    submitButton.addEventListener(
        "click",
        submitDeposit
    );


    /* =====================================================
       ENTER KEY
    ====================================================== */

    amountInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                submitDeposit();

            }

        }
    );


    referenceInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                event.preventDefault();

                submitDeposit();

            }

        }
    );


    /* =====================================================
       AMOUNT FORMATTING SUPPORT
    ====================================================== */

    amountInput.addEventListener(
        "input",
        () => {

            clearMessage();

        }
    );


    referenceInput.addEventListener(
        "input",
        () => {

            clearMessage();

        }
    );


    /* =====================================================
       INITIALIZATION COMPLETE
    ====================================================== */

    hideLoader();

});
