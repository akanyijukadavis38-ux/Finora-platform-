/* =========================================================
   FINORA DASHBOARD
   dashboard.js

   ONLINE / BACKEND VERSION
   SESSION AUTHENTICATION
   NO LOCAL STORAGE

   CURRENT BACKEND CONNECTIONS:
   GET /api/users/me
   GET /api/transactions?limit=3

   IMPORTANT:
   Dashboard Recent Transactions and the full
   Transaction History page use the SAME backend
   transaction records.

   No fake transactions.
   No localStorage.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       FINORA CONFIGURATION
    ===================================================== */

    const FINORA_API =
        "https://finora-platform.onrender.com";


    const FRONTEND_URL =
        "https://finora-platform.pages.dev";


    const AUTO_SLIDE_DELAY =
        5000;


    const RESUME_DELAY =
        4500;


    /* =====================================================
       BASIC HELPERS
    ===================================================== */

    function getElement(id) {

        return document.getElementById(id);
    }


    function safeNumber(value) {

        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : 0;
    }


    function formatUGX(value) {

        const amount =
            safeNumber(value);

        return (
            "UGX " +
            amount.toLocaleString("en-UG")
        );
    }


    /* =====================================================
       UGANDA / EAST AFRICA TIME

       FINORA displays transaction times using
       Africa/Kampala (EAT / UTC+3).

       The database timestamp itself is NOT changed.
    ===================================================== */

    function formatDate(value) {

        if (!value) {
            return "";
        }


        const date =
            new Date(value);


        if (Number.isNaN(date.getTime())) {
            return "";
        }


        return new Intl.DateTimeFormat(
            "en-UG",
            {
                timeZone:
                    "Africa/Kampala",

                day:
                    "2-digit",

                month:
                    "short",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit",

                hour12:
                    true
            }
        ).format(date);
    }


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    /* =====================================================
       TEMPORARY MESSAGE
    ===================================================== */

    function showTemporaryMessage(message) {

        let messageBox =
            getElement("finoraMessageBox");


        if (!messageBox) {

            messageBox =
                document.createElement("div");


            messageBox.id =
                "finoraMessageBox";


            messageBox.style.position =
                "fixed";


            messageBox.style.left =
                "50%";


            messageBox.style.bottom =
                "95px";


            messageBox.style.transform =
                "translateX(-50%)";


            messageBox.style.zIndex =
                "99999";


            messageBox.style.padding =
                "11px 18px";


            messageBox.style.borderRadius =
                "999px";


            messageBox.style.background =
                "#171017";


            messageBox.style.color =
                "#FFFFFF";


            messageBox.style.fontSize =
                "13px";


            messageBox.style.fontWeight =
                "600";


            messageBox.style.boxShadow =
                "0 10px 30px rgba(0,0,0,.25)";


            messageBox.style.pointerEvents =
                "none";


            messageBox.style.transition =
                "opacity .25s ease";


            messageBox.style.opacity =
                "0";


            document.body.appendChild(
                messageBox
            );
        }


        messageBox.textContent =
            message;


        messageBox.style.opacity =
            "1";


        clearTimeout(
            messageBox._timer
        );


        messageBox._timer =
            setTimeout(() => {

                messageBox.style.opacity =
                    "0";

            }, 2500);
    }


    /* =====================================================
       CURRENT USER
    ===================================================== */

    let currentUser = null;


    /* =====================================================
       LOAD AUTHENTICATED USER

       Backend:
       GET /api/users/me

       IMPORTANT:
       credentials: "include"
    ===================================================== */

    async function loadCurrentUser() {

        try {

            console.log(
                "FINORA: Loading authenticated user..."
            );


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


            console.log(
                "FINORA USER STATUS:",
                response.status
            );


            if (
                response.status === 401
            ) {

                console.warn(
                    "FINORA: No authenticated session."
                );


                handleUnauthenticatedUser();


                return null;
            }


            if (
                response.status === 403
            ) {

                let frozenData = null;


                try {

                    frozenData =
                        await response.json();

                } catch (error) {

                    frozenData = null;
                }


                const message =
                    frozenData &&
                    frozenData.message
                        ? frozenData.message
                        : "Your FINORA account has been frozen.";


                console.error(
                    "FINORA:",
                    message
                );


                showTemporaryMessage(
                    message
                );


                return null;
            }


            if (!response.ok) {

                console.error(
                    "FINORA: User request failed.",
                    response.status
                );


                showTemporaryMessage(
                    "Unable to load your FINORA account."
                );


                return null;
            }


            const data =
                await response.json();


            console.log(
                "FINORA USER RESPONSE:",
                data
            );


            if (
                !data ||
                data.success !== true
            ) {

                console.warn(
                    "FINORA: Invalid authenticated-user response."
                );


                showTemporaryMessage(
                    "Unable to load your FINORA account."
                );


                return null;
            }


            const user =
                data.user;


            if (
                !user ||
                typeof user !== "object"
            ) {

                console.warn(
                    "FINORA: Backend returned no user object."
                );


                showTemporaryMessage(
                    "FINORA account information is unavailable."
                );


                return null;
            }


            currentUser =
                user;


            console.log(
                "FINORA: Authenticated user loaded.",
                currentUser
            );


            updateDashboardUser(
                currentUser
            );


            updateFinancialData(
                currentUser
            );


            updateReferralInformation(
                currentUser
            );


            updateAccountStatus(
                currentUser
            );


            return currentUser;


        } catch (error) {

            console.error(
                "❌ FINORA USER REQUEST ERROR:",
                error
            );


            showTemporaryMessage(
                "FINORA could not connect to the server."
            );


            return null;
        }
    }


    /* =====================================================
       HANDLE UNAUTHENTICATED USER
    ===================================================== */

    function handleUnauthenticatedUser() {

        showTemporaryMessage(
            "Your FINORA session has expired. Please log in again."
        );


        console.warn(
            "FINORA: No authenticated session."
        );
    }


    /* =====================================================
       UPDATE USER NAME
    ===================================================== */

    function updateDashboardUser(user) {

        const fullNameElement =
            getElement("fullName");


        if (!fullNameElement) {
            return;
        }


        if (!user) {
            return;
        }


        const name =
            user.fullName ||
            user.full_name;


        if (
            name &&
            String(name).trim()
        ) {

            fullNameElement.textContent =
                String(name).trim();

        } else {

            fullNameElement.textContent =
                "User";
        }
    }


    /* =====================================================
       UPDATE FINANCIAL DATA
    ===================================================== */

    function updateFinancialData(user) {

        if (!user) {
            return;
        }


        const walletBalance =
            safeNumber(
                user.walletBalance ??
                user.wallet_balance ??
                user.balance
            );


        const totalEarnings =
            safeNumber(
                user.totalEarnings ??
                user.total_earnings ??
                user.totalIncome
            );


        const todayEarnings =
            safeNumber(
                user.todayEarnings ??
                user.today_earnings ??
                user.dailyIncome ??
                user.daily_income
            );


        const totalInvested =
            safeNumber(
                user.totalInvested ??
                user.total_invested ??
                user.totalDeposit ??
                user.total_deposit
            );


        const referralIncome =
            safeNumber(
                user.referralIncome ??
                user.referral_income ??
                user.referralBonus ??
                user.referral_bonus
            );


        const activeInvestments =
            safeNumber(
                user.activeInvestments ??
                user.active_investments ??
                user.investmentCount ??
                user.investment_count
            );


        const walletElement =
            getElement(
                "walletBalance"
            );


        const totalEarningsElement =
            getElement(
                "totalEarnings"
            );


        const todayEarningsElement =
            getElement(
                "todayEarnings"
            );


        const totalInvestedElement =
            getElement(
                "totalInvested"
            );


        const referralBonusElement =
            getElement(
                "referralBonus"
            );


        const activeInvestmentsElement =
            getElement(
                "activeInvestments"
            );


        const dailyIncomeElement =
            getElement(
                "dailyIncome"
            );


        const overviewTotalEarningsElement =
            getElement(
                "overviewTotalEarnings"
            );


        if (walletElement) {

            walletElement.textContent =
                formatUGX(
                    walletBalance
                );
        }


        if (totalEarningsElement) {

            totalEarningsElement.textContent =
                formatUGX(
                    totalEarnings
                );
        }


        if (todayEarningsElement) {

            todayEarningsElement.textContent =
                formatUGX(
                    todayEarnings
                );
        }


        if (totalInvestedElement) {

            totalInvestedElement.textContent =
                formatUGX(
                    totalInvested
                );
        }


        if (referralBonusElement) {

            referralBonusElement.textContent =
                formatUGX(
                    referralIncome
                );
        }


        if (activeInvestmentsElement) {

            activeInvestmentsElement.textContent =
                activeInvestments.toLocaleString(
                    "en-UG"
                );
        }


        if (dailyIncomeElement) {

            dailyIncomeElement.textContent =
                formatUGX(
                    todayEarnings
                );
        }


        if (overviewTotalEarningsElement) {

            overviewTotalEarningsElement.textContent =
                formatUGX(
                    totalEarnings
                );
        }
    }


    /* =====================================================
       REFERRAL INFORMATION
    ===================================================== */

    function updateReferralInformation(user) {

        if (!user) {
            return;
        }


        const referralCode =
            user.referralCode ||
            user.referral_code ||
            "";


        if (!referralCode) {

            console.warn(
                "FINORA: User does not have a referral code."
            );


            return;
        }


        const referralLink =
            `${FRONTEND_URL}/?ref=${encodeURIComponent(
                referralCode
            )}`;


        console.log(
            "FINORA USER REFERRAL CODE:",
            referralCode
        );


        console.log(
            "FINORA USER REFERRAL LINK:",
            referralLink
        );
    }


    /* =====================================================
       ACCOUNT STATUS
    ===================================================== */

    function updateAccountStatus(user) {

        if (!user) {
            return;
        }


        console.log(
            "FINORA ACCOUNT STATUS:",
            user.status || "active"
        );
    }


    /* =====================================================
       BANNER CAROUSEL
    ===================================================== */

    function initializeBannerCarousel() {

        const bannerTrack =
            getElement(
                "bannerTrack"
            );


        if (!bannerTrack) {
            return;
        }


        const banners =
            Array.from(
                bannerTrack.children
            );


        if (!banners.length) {
            return;
        }


        const bannerIndicators =
            getElement(
                "bannerIndicators"
            );


        const dots =
            bannerIndicators
                ? Array.from(
                    bannerIndicators.querySelectorAll(
                        ".banner-dot"
                    )
                )
                : [];


        let currentSlide =
            0;


        let autoSlideTimer =
            null;


        let resumeTimer =
            null;


        let manualInteraction =
            false;


        function showSlide(
            index,
            animate = true
        ) {

            if (!banners.length) {
                return;
            }


            currentSlide =
                (
                    index +
                    banners.length
                ) %
                banners.length;


            if (!animate) {

                bannerTrack.style.transition =
                    "none";

            } else {

                bannerTrack.style.transition =
                    "";
            }


            bannerTrack.style.transform =
                `translate3d(-${
                    currentSlide * 100
                }%, 0, 0)`;


            dots.forEach(
                (
                    dot,
                    dotIndex
                ) => {

                    dot.classList.toggle(
                        "active",
                        dotIndex === currentSlide
                    );
                }
            );


            if (!animate) {

                requestAnimationFrame(
                    () => {

                        bannerTrack.style.transition =
                            "";
                    }
                );
            }
        }


        function nextSlide() {

            showSlide(
                currentSlide + 1
            );
        }


        function stopAutoSlide() {

            if (autoSlideTimer) {

                clearInterval(
                    autoSlideTimer
                );


                autoSlideTimer =
                    null;
            }
        }


        function startAutoSlide() {

            stopAutoSlide();


            autoSlideTimer =
                setInterval(
                    nextSlide,
                    AUTO_SLIDE_DELAY
                );
        }


        function temporarilyPauseAutoSlide() {

            manualInteraction =
                true;


            stopAutoSlide();


            clearTimeout(
                resumeTimer
            );


            resumeTimer =
                setTimeout(
                    () => {

                        manualInteraction =
                            false;


                        startAutoSlide();

                    },
                    RESUME_DELAY
                );
        }


        dots.forEach(
            (dot) => {

                dot.addEventListener(
                    "click",
                    () => {

                        const slide =
                            Number(
                                dot.dataset.slide
                            );


                        if (
                            Number.isInteger(
                                slide
                            )
                        ) {

                            temporarilyPauseAutoSlide();


                            showSlide(
                                slide
                            );
                        }
                    }
                );
            }
        );


        let touchStartX =
            0;


        let touchStartY =
            0;


        let touchMoved =
            false;


        bannerTrack.addEventListener(
            "touchstart",
            (event) => {

                if (
                    !event.touches.length
                ) {
                    return;
                }


                touchStartX =
                    event.touches[0].clientX;


                touchStartY =
                    event.touches[0].clientY;


                touchMoved =
                    false;


                temporarilyPauseAutoSlide();

            },
            {
                passive: true
            }
        );


        bannerTrack.addEventListener(
            "touchmove",
            (event) => {

                if (
                    !event.touches.length
                ) {
                    return;
                }


                const currentX =
                    event.touches[0].clientX;


                const currentY =
                    event.touches[0].clientY;


                const deltaX =
                    currentX -
                    touchStartX;


                const deltaY =
                    currentY -
                    touchStartY;


                if (
                    Math.abs(deltaX) >
                    Math.abs(deltaY)
                ) {

                    touchMoved =
                        true;
                }

            },
            {
                passive: true
            }
        );


        bannerTrack.addEventListener(
            "touchend",
            (event) => {

                if (!touchMoved) {
                    return;
                }


                const touch =
                    event.changedTouches[0];


                if (!touch) {
                    return;
                }


                const difference =
                    touch.clientX -
                    touchStartX;


                if (
                    Math.abs(difference) >=
                    45
                ) {

                    if (
                        difference < 0
                    ) {

                        showSlide(
                            currentSlide + 1
                        );

                    } else {

                        showSlide(
                            currentSlide - 1
                        );
                    }
                }

            },
            {
                passive: true
            }
        );


        let mouseDown =
            false;


        let mouseStartX =
            0;


        let mouseMoved =
            false;


        bannerTrack.addEventListener(
            "mousedown",
            (event) => {

                mouseDown =
                    true;


                mouseMoved =
                    false;


                mouseStartX =
                    event.clientX;


                temporarilyPauseAutoSlide();

            }
        );


        window.addEventListener(
            "mousemove",
            (event) => {

                if (!mouseDown) {
                    return;
                }


                const difference =
                    event.clientX -
                    mouseStartX;


                if (
                    Math.abs(difference) >
                    10
                ) {

                    mouseMoved =
                        true;
                }
            }
        );


        window.addEventListener(
            "mouseup",
            (event) => {

                if (!mouseDown) {
                    return;
                }


                mouseDown =
                    false;


                if (!mouseMoved) {
                    return;
                }


                const difference =
                    event.clientX -
                    mouseStartX;


                if (
                    Math.abs(difference) >=
                    45
                ) {

                    if (
                        difference < 0
                    ) {

                        showSlide(
                            currentSlide + 1
                        );

                    } else {

                        showSlide(
                            currentSlide - 1
                        );
                    }
                }
            }
        );


        bannerTrack.addEventListener(
            "mouseenter",
            () => {

                stopAutoSlide();
            }
        );


        bannerTrack.addEventListener(
            "mouseleave",
            () => {

                if (
                    !manualInteraction
                ) {

                    startAutoSlide();
                }
            }
        );


        bannerTrack.addEventListener(
            "focusin",
            () => {

                temporarilyPauseAutoSlide();
            }
        );


        showSlide(
            0,
            false
        );


        startAutoSlide();
    }


    /* =====================================================
       NOTIFICATIONS
    ===================================================== */

    function initializeNotifications() {

        const notificationButton =
            getElement(
                "notificationButton"
            );


        const notificationCount =
            getElement(
                "notificationCount"
            );


        if (!notificationButton) {
            return;
        }


        notificationButton.addEventListener(
            "click",
            () => {

                showTemporaryMessage(
                    "No new notifications."
                );


                if (notificationCount) {

                    notificationCount.style.display =
                        "none";
                }
            }
        );
    }


    /* =====================================================
       COMMUNITY
    ===================================================== */

    function initializeCommunity() {

        const communityLink =
            getElement(
                "communityLink"
            );


        if (!communityLink) {
            return;
        }


        communityLink.addEventListener(
            "click",
            () => {

                console.log(
                    "FINORA: Opening WhatsApp community."
                );
            }
        );
    }


    /* =====================================================
       MAIN BOTTOM NAVIGATION
    ===================================================== */

    function initializeNavigation() {

        const navigation =
            document.querySelector(
                ".bottom-navigation"
            );


        if (!navigation) {
            return;
        }


        const navigationItems =
            Array.from(
                navigation.querySelectorAll(
                    ".bottom-nav-item"
                )
            );


        if (!navigationItems.length) {
            return;
        }


        const currentPath =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();


        const pageMap = {

            "dashboard.html": "home",

            "": "home",

            "team.html": "team",

            "rates.html": "rates",

            "mine.html": "mine",

            "profile.html": "profile"

        };


        function setActiveNavigation(navName) {

            navigationItems.forEach(
                (item) => {

                    const isActive =
                        item.dataset.nav === navName;


                    item.classList.toggle(
                        "active",
                        isActive
                    );


                    if (isActive) {

                        item.setAttribute(
                            "aria-current",
                            "page"
                        );

                    } else {

                        item.removeAttribute(
                            "aria-current"
                        );
                    }

                }
            );
        }


        const currentNavigation =
            pageMap[currentPath];


        if (currentNavigation) {

            setActiveNavigation(
                currentNavigation
            );

        } else {

            setActiveNavigation(
                null
            );
        }


        navigationItems.forEach(
            (item) => {

                item.addEventListener(
                    "click",
                    () => {

                        const navName =
                            item.dataset.nav;


                        if (!navName) {
                            return;
                        }


                        setActiveNavigation(
                            navName
                        );

                    }
                );

            }
        );
    }


    /* =====================================================
       RECENT TRANSACTIONS

       SOURCE:
       GET /api/transactions?limit=3

       IMPORTANT:
       These are the SAME transaction records used
       by transaction-history.html.

       This means:

       Deposit submitted
       → appears here as Pending

       Investment
       → appears here as Completed

       Withdrawal requested
       → appears here as Pending

       Later approval/rejection
       → same transaction changes status

       No duplicate transaction system.
    ===================================================== */

    async function initializeRecentTransactions() {

        const container =
            getElement(
                "recentTransactions"
            );


        if (!container) {
            return;
        }


        try {

            console.log(
                "FINORA: Loading latest transactions..."
            );


            const response =
                await fetch(
                    `${FINORA_API}/api/transactions?limit=3`,
                    {
                        method: "GET",

                        credentials: "include",

                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            console.log(
                "FINORA TRANSACTION STATUS:",
                response.status
            );


            if (
                response.status === 401
            ) {

                console.warn(
                    "FINORA: Transaction session expired."
                );


                return;
            }


            if (
                response.status === 403
            ) {

                console.warn(
                    "FINORA: Transaction access denied."
                );


                return;
            }


            if (!response.ok) {

                console.error(
                    "FINORA: Transaction request failed.",
                    response.status
                );


                return;
            }


            const data =
                await response.json();


            if (
                !data ||
                data.success !== true
            ) {

                console.warn(
                    "FINORA: Invalid transaction response."
                );


                return;
            }


            const transactions =
                Array.isArray(
                    data.transactions
                )
                    ? data.transactions
                    : [];


            if (!transactions.length) {

                console.log(
                    "FINORA: No transactions found."
                );


                return;
            }


            container.innerHTML =
                transactions
                    .slice(0, 3)
                    .map(
                        (
                            transaction
                        ) =>
                            buildRecentTransaction(
                                transaction
                            )
                    )
                    .join("");


            console.log(
                "FINORA: Latest transactions displayed.",
                transactions
            );


        } catch (error) {

            console.error(
                "❌ FINORA TRANSACTION REQUEST ERROR:",
                error
            );
        }
    }


    /* =====================================================
       BUILD RECENT TRANSACTION
    ===================================================== */

    function buildRecentTransaction(transaction) {

        const type =
            String(
                transaction.type || ""
            ).toLowerCase();


        const status =
            String(
                transaction.status || "completed"
            ).toLowerCase();


        const direction =
            String(
                transaction.direction || ""
            ).toLowerCase();


        const amount =
            safeNumber(
                transaction.amount
            );


        const title =
            getTransactionTitle(
                type
            );


        const icon =
            getTransactionIcon(
                type
            );


        const statusText =
            capitalizeFirstLetter(
                status
            );


        const date =
            formatDate(
                transaction.createdAt
            );


        const amountClass =
            direction === "debit"
                ? "debit"
                : "credit";


        return `
            <div class="transaction-item">
                <div class="transaction-icon transaction-${escapeHTML(type)}">
                    ${icon}
                </div>

                <div class="transaction-main">
                    <div class="transaction-title">
                        ${escapeHTML(title)}
                    </div>

                    <div class="transaction-meta">
                        ${escapeHTML(statusText)}
                        ${date ? ` • ${escapeHTML(date)}` : ""}
                    </div>
                </div>

                <div class="transaction-amount ${amountClass}">
                    ${direction === "debit" ? "-" : "+"}
                    ${escapeHTML(formatUGX(amount))}
                </div>
            </div>
        `;
    }


    /* =====================================================
       TRANSACTION TITLE
    ===================================================== */

    function getTransactionTitle(type) {

        const titles = {

            deposit:
                "Deposit",

            investment:
                "Investment",

            withdrawal:
                "Withdrawal",

            earning:
                "Daily Earnings",

            referral:
                "Referral Commission"

        };


        return (
            titles[type] ||
            "Transaction"
        );
    }


    /* =====================================================
       TRANSACTION ICON
    ===================================================== */

    function getTransactionIcon(type) {

        const icons = {

            deposit:
                "↓",

            investment:
                "↗",

            withdrawal:
                "↑",

            earning:
                "✦",

            referral:
                "♢"

        };


        return (
            icons[type] ||
            "•"
        );
    }


    /* =====================================================
       CAPITALIZE
    ===================================================== */

    function capitalizeFirstLetter(value) {

        if (!value) {
            return "";
        }


        return (
            value.charAt(0).toUpperCase() +
            value.slice(1)
        );
    }


    /* =====================================================
       PREVENT ACCIDENTAL HASH NAVIGATION
    ===================================================== */

    function initializeEmptyLinks() {

        document
            .querySelectorAll(
                'a[href="#"]'
            )
            .forEach(
                (link) => {

                    link.addEventListener(
                        "click",
                        (event) => {

                            event.preventDefault();
                        }
                    );
                }
            );
    }


    /* =====================================================
       DASHBOARD INITIALIZATION
    ===================================================== */

    function initializeDashboard() {

        console.log(
            "================================="
        );


        console.log(
            "FINORA DASHBOARD INITIALIZING"
        );


        console.log(
            "FINORA API:",
            FINORA_API
        );


        console.log(
            "================================="
        );


        initializeBannerCarousel();


        initializeNotifications();


        initializeCommunity();


        initializeNavigation();


        initializeRecentTransactions();


        initializeEmptyLinks();


        loadCurrentUser()
            .then(
                (user) => {

                    if (user) {

                        console.log(
                            "FINORA DASHBOARD USER DATA READY"
                        );

                    }
                }
            )
            .catch(
                (error) => {

                    console.error(
                        "❌ FINORA BACKGROUND USER LOAD ERROR:",
                        error
                    );
                }
            );


        console.log(
            "FINORA DASHBOARD UI READY"
        );
    }


    /* =====================================================
       START
    ===================================================== */

    initializeDashboard();

});
