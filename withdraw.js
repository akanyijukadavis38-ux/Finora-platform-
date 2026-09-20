document.addEventListener("DOMContentLoaded", () => {

    const pageLoader = document.getElementById("pageLoader");
    const message = document.getElementById("message");

    const walletBalance = document.getElementById("walletBalance");

    const amountInput = document.getElementById("amount");

    const registeredNumber =
        document.getElementById("registeredNumber");

    const mobileNetwork =
        document.getElementById("mobileNetwork");

    const submitWithdraw =
        document.getElementById("submitWithdraw");

    const summaryAmount =
        document.getElementById("summaryAmount");

    const summaryFee =
        document.getElementById("summaryFee");

    const summaryReceive =
        document.getElementById("summaryReceive");

    const transactionHistory =
        document.getElementById("transactionHistory");


    const MIN_WITHDRAWAL = 4000;
    const WITHDRAWAL_RATE = 0.15;


    let currentBalance = 0;


    /* =====================================================
       HELPERS
    ====================================================== */

    function formatUGX(amount) {

        const value = Number(amount) || 0;

        return "UGX " + value.toLocaleString("en-UG", {
            maximumFractionDigits: 0
        });
    }


    function showMessage(text, type = "error") {

        if (!message) return;

        message.textContent = text;

        message.className = "message show";

        if (type === "success") {
            message.classList.add("success");
        }

        if (type === "info") {
            message.classList.add("info");
        }

        message.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }


    function clearMessage() {

        if (!message) return;

        message.textContent = "";
        message.className = "message";
    }


    function hideLoader() {

        if (!pageLoader) return;

        pageLoader.classList.add("hidden");

        setTimeout(() => {
            pageLoader.style.display = "none";
        }, 400);
    }


    /* =====================================================
       MOBILE NETWORK DETECTION
    ====================================================== */

    function detectNetwork(phone) {

        if (!phone) {
            return "Mobile Money";
        }

        let number = String(phone).replace(/\D/g, "");

        if (number.startsWith("256")) {
            number = "0" + number.substring(3);
        }

        if (!number.startsWith("0") && number.length === 9) {
            number = "0" + number;
        }

        const prefix = number.substring(0, 4);

        const mtnPrefixes = [
            "0770", "0771", "0772", "0773", "0774",
            "0775", "0776", "0777", "0778", "0779",
            "0780", "0781", "0782", "0783", "0784",
            "0785", "0786", "0787", "0788", "0789"
        ];

        const airtelPrefixes = [
            "0700", "0701", "0702", "0703", "0704",
            "0705", "0706", "0707", "0708", "0709",
            "0750", "0751", "0752", "0753", "0754",
            "0755", "0756", "0757", "0758", "0759"
        ];

        if (mtnPrefixes.includes(prefix)) {
            return "MTN Mobile Money";
        }

        if (airtelPrefixes.includes(prefix)) {
            return "Airtel Money";
        }

        return "Mobile Money";
    }


    function formatPhone(phone) {

        if (!phone) {
            return "Not available";
        }

        let number = String(phone).replace(/\D/g, "");

        if (number.startsWith("256")) {
            number = "0" + number.substring(3);
        }

        if (number.length === 10 && number.startsWith("0")) {
            return (
                number.substring(0, 4) +
                " " +
                number.substring(4, 7) +
                " " +
                number.substring(7)
            );
        }

        return phone;
    }


    /* =====================================================
       EXTRACT USER PHONE
    ====================================================== */

    function getUserPhone(user) {

        if (!user || typeof user !== "object") {
            return null;
        }

        return (
            user.phone ||
            user.phoneNumber ||
            user.mobile ||
            user.mobileNumber ||
            user.telephone ||
            user.contact
        );
    }


    /* =====================================================
       LOAD CURRENT USER
    ====================================================== */

    async function loadUser() {

        try {

            const response = await fetch(
                "https://finora-platform.onrender.com/api/users/me",
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


            if (!response.ok) {

                if (response.status === 401) {
                    window.location.href = "login.html";
                    return null;
                }

                throw new Error(
                    "Unable to load your account."
                );
            }


            const data = await response.json();


            const user =
                data.user ||
                data.data ||
                data;


            if (!user) {
                throw new Error(
                    "Account information was not returned."
                );
            }


            /* ---------------------------------------------
               WALLET BALANCE
            --------------------------------------------- */

            currentBalance = Number(
                user.balance ??
                user.walletBalance ??
                0
            );


            walletBalance.textContent =
                formatUGX(currentBalance)
                    .replace("UGX ", "");


            /* ---------------------------------------------
               REGISTERED PHONE
            --------------------------------------------- */

            const phone = getUserPhone(user);


            if (!phone) {

                registeredNumber.textContent =
                    "Not available";

                mobileNetwork.textContent =
                    "Mobile Money";

                return user;
            }


            registeredNumber.textContent =
                formatPhone(phone);


            mobileNetwork.textContent =
                detectNetwork(phone);


            return user;

        } catch (error) {

            console.error(
                "FINORA user loading error:",
                error
            );

            walletBalance.textContent = "—";

            registeredNumber.textContent =
                "Unable to load";

            mobileNetwork.textContent =
                "Mobile Money";

            showMessage(
                "We could not load your account information. Please refresh and try again."
            );

            return null;
        }
    }


    /* =====================================================
       WITHDRAWAL SUMMARY
    ====================================================== */

    function updateSummary() {

        const amount =
            Number(amountInput.value) || 0;


        if (amount <= 0) {

            summaryAmount.textContent =
                "UGX 0";

            summaryFee.textContent =
                "UGX 0";

            summaryReceive.textContent =
                "UGX 0";

            return;
        }


        const fee =
            amount * WITHDRAWAL_RATE;


        const receive =
            amount - fee;


        summaryAmount.textContent =
            formatUGX(amount);

        summaryFee.textContent =
            formatUGX(fee);

        summaryReceive.textContent =
            formatUGX(receive);
    }


    /* =====================================================
       AMOUNT INPUT
    ====================================================== */

    amountInput.addEventListener(
        "input",
        () => {

            clearMessage();

            updateSummary();
        }
    );


    /* =====================================================
       TRANSACTION TYPE
    ====================================================== */

    function transactionLabel(transaction) {

        const type =
            String(
                transaction.type ||
                transaction.transactionType ||
                ""
            ).toLowerCase();


        if (
            type.includes("withdraw")
        ) {
            return "Withdrawal";
        }

        if (
            type.includes("deposit")
        ) {
            return "Deposit";
        }

        if (
            type.includes("invest")
        ) {
            return "Investment";
        }

        if (
            type.includes("earning") ||
            type.includes("return") ||
            type.includes("profit")
        ) {
            return "Earning";
        }

        if (
            type.includes("referral")
        ) {
            return "Referral";
        }

        return (
            transaction.description ||
            "Transaction"
        );
    }


    function transactionAmount(transaction) {

        return Number(
            transaction.amount ??
            transaction.value ??
            0
        );
    }


    function transactionStatus(transaction) {

        return String(
            transaction.status ||
            "completed"
        ).toLowerCase();
    }


    function transactionDate(transaction) {

        const rawDate =
            transaction.createdAt ||
            transaction.date ||
            transaction.created_at ||
            transaction.timestamp;


        if (!rawDate) {
            return "";
        }


        const date =
            new Date(rawDate);


        if (Number.isNaN(date.getTime())) {
            return "";
        }


        return date.toLocaleDateString(
            "en-UG",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );
    }


    /* =====================================================
       TRANSACTION HISTORY
    ====================================================== */

    function renderTransactions(transactions) {

        if (!transactionHistory) {
            return;
        }


        if (
            !Array.isArray(transactions) ||
            transactions.length === 0
        ) {

            transactionHistory.innerHTML = `
                <div class="history-loading">
                    <span>
                        No transactions yet.
                    </span>
                </div>
            `;

            return;
        }


        transactionHistory.innerHTML =
            transactions
                .slice(0, 8)
                .map(transaction => {

                    const label =
                        transactionLabel(transaction);

                    const amount =
                        transactionAmount(transaction);

                    const status =
                        transactionStatus(transaction);

                    const date =
                        transactionDate(transaction);


                    const isWithdrawal =
                        label.toLowerCase()
                            .includes("withdraw");


                    const amountClass =
                        isWithdrawal
                            ? "transaction-negative"
                            : "transaction-positive";


                    return `
                        <div class="transaction-item">

                            <div class="transaction-icon">
                                ${isWithdrawal ? "↓" : "↑"}
                            </div>

                            <div class="transaction-info">

                                <strong>
                                    ${escapeHTML(label)}
                                </strong>

                                <span>
                                    ${escapeHTML(date)}
                                </span>

                            </div>

                            <div class="transaction-right">

                                <strong class="${amountClass}">
                                    ${formatUGX(amount)}
                                </strong>

                                <span class="transaction-status-text">
                                    ${escapeHTML(status)}
                                </span>

                            </div>

                        </div>
                    `;

                })
                .join("");
    }


    async function loadTransactions() {

        try {

            const response = await fetch(
                "https://finora-platform.onrender.com/api/transactions",
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


            if (!response.ok) {

                if (response.status === 401) {
                    window.location.href = "login.html";
                    return;
                }

                throw new Error(
                    "Unable to load transactions."
                );
            }


            const data =
                await response.json();


            const transactions =
                Array.isArray(data)
                    ? data
                    : (
                        data.transactions ||
                        data.data ||
                        []
                    );


            renderTransactions(transactions);

        } catch (error) {

            console.error(
                "FINORA transaction history error:",
                error
            );


            transactionHistory.innerHTML = `
                <div class="history-loading">
                    <span>
                        Transaction history could not be loaded.
                    </span>
                </div>
            `;
        }
    }


    /* =====================================================
       HTML ESCAPING
    ====================================================== */

    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       WITHDRAW BUTTON
    ====================================================== */

    submitWithdraw.addEventListener(
        "click",
        async () => {

            clearMessage();


            const amount =
                Number(amountInput.value) || 0;


            /* ---------------------------------------------
               BASIC VALIDATION
            --------------------------------------------- */

            if (amount < MIN_WITHDRAWAL) {

                showMessage(
                    "The minimum withdrawal amount is UGX 4,000."
                );

                amountInput.focus();

                return;
            }


            if (amount > currentBalance) {

                showMessage(
                    "The withdrawal amount cannot exceed your available wallet balance."
                );

                amountInput.focus();

                return;
            }


            const phone =
                registeredNumber.textContent;


            if (
                !phone ||
                phone === "Loading..." ||
                phone === "Not available" ||
                phone === "Unable to load"
            ) {

                showMessage(
                    "Your registered Mobile Money number could not be verified. Please refresh your account and try again."
                );

                return;
            }


            /*
             * The actual withdrawal API will be connected
             * after the existing backend withdrawal route
             * has been verified.
             *
             * We deliberately do not invent an endpoint here.
             */


            showMessage(
                "Your withdrawal form is ready. The secure withdrawal service will be connected after the backend withdrawal route is added.",
                "info"
            );
        }
    );


    /* =====================================================
       INITIAL LOAD
    ====================================================== */

    async function initializePage() {

        try {

            await Promise.all([
                loadUser(),
                loadTransactions()
            ]);

        } finally {

            hideLoader();
        }
    }


    initializePage();

});
