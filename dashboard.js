/* =========================================================
   FINORA DASHBOARD
   dashboard.js

   ONLINE / BACKEND VERSION
   SESSION AUTHENTICATION
   NO LOCAL STORAGE
   NO DEPOSIT ROUTES
   NO WITHDRAWAL ROUTES
   NO INVESTMENT ROUTES
   NO TRANSACTION ROUTES

   CURRENT BACKEND CONNECTION:
   GET /api/users/me

   The dashboard only connects to the existing
   FINORA user/session system.

   Other systems will be connected later when their
   own backend routes are created.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       FINORA CONFIGURATION
    ===================================================== */

    const FINORA_API =
        "https://finora-platform-production.up.railway.app";


    const FRONTEND_URL =
        "https://akanyijukadavis38-ux.github.io";


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

       This sends the FINORA session cookie
       created by userRoutes.js.
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


            /* =============================================
               SESSION NOT FOUND
            ============================================= */

            if (
                response.status === 401
            ) {

                console.warn(
                    "FINORA: No authenticated session."
                );


                handleUnauthenticatedUser();


                return null;
            }


            /* =============================================
               FROZEN ACCOUNT
            ============================================= */

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


            /* =============================================
               OTHER SERVER ERRORS
            ============================================= */

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


            /* =============================================
               READ RESPONSE
            ============================================= */

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


            /* =============================================
               SAVE CURRENT USER IN MEMORY ONLY

               NO localStorage.
            ============================================= */

            currentUser =
                user;


            console.log(
                "FINORA: Authenticated user loaded.",
                currentUser
            );


            /* =============================================
               UPDATE DASHBOARD
            ============================================= */

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

        updateDashboardUser(
            null
        );


        /*
           We do not automatically redirect immediately.

           This makes debugging easier and prevents the
           dashboard from appearing to randomly disappear.

           The user can still see the page while the console
           clearly reports that no session exists.
        */

        showTemporaryMessage(
            "Your FINORA session has expired. Please log in again."
        );


        console.warn(
            "FINORA: Redirecting to login is disabled for now."
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

            fullNameElement.textContent =
                "Guest";

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


        /* =============================================
           WALLET
        ============================================= */

        const walletBalance =
            safeNumber(
                user.walletBalance ??
                user.wallet_balance ??
                user.balance
            );


        /* =============================================
           TOTAL EARNINGS
        ============================================= */

        const totalEarnings =
            safeNumber(
                user.totalEarnings ??
                user.total_earnings ??
                user.totalIncome
            );


        /* =============================================
           TODAY'S EARNINGS
        ============================================= */

        const todayEarnings =
            safeNumber(
                user.todayEarnings ??
                user.today_earnings ??
                user.dailyIncome ??
                user.daily_income
            );


        /* =============================================
           TOTAL INVESTED
        ============================================= */

        const totalInvested =
            safeNumber(
                user.totalInvested ??
                user.total_invested ??
                user.totalDeposit ??
                user.total_deposit
            );


        /* =============================================
           REFERRAL INCOME
        ============================================= */

        const referralIncome =
            safeNumber(
                user.referralIncome ??
                user.referral_income ??
                user.referralBonus ??
                user.referral_bonus
            );


        /* =============================================
           ACTIVE INVESTMENTS
        ============================================= */

        const activeInvestments =
            safeNumber(
                user.activeInvestments ??
                user.active_investments ??
                user.investmentCount ??
                user.investment_count
            );


        /* =============================================
           HTML ELEMENTS
        ============================================= */

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


        /* =============================================
           DISPLAY
        ============================================= */

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
       
       The current dashboard HTML does not contain a
       referral-link field, so we do not try to create
       elements that don't exist.

       This function is prepared for future dashboard
       referral components.
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


        /*
           Future referral elements can use this value.

           We intentionally do not create fake UI elements.
        */
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


        /* =============================================
           SHOW SLIDE
        ============================================= */

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


        /* =============================================
           NEXT
        ============================================= */

        function nextSlide() {

            showSlide(
                currentSlide + 1
            );
        }


        /* =============================================
           STOP AUTO SLIDE
        ============================================= */

        function stopAutoSlide() {

            if (autoSlideTimer) {

                clearInterval(
                    autoSlideTimer
                );


                autoSlideTimer =
                    null;
            }
        }


        /* =============================================
           START AUTO SLIDE
        ============================================= */

        function startAutoSlide() {

            stopAutoSlide();


            autoSlideTimer =
                setInterval(
                    nextSlide,
                    AUTO_SLIDE_DELAY
                );
        }


        /* =============================================
           TEMPORARY PAUSE
        ============================================= */

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


        /* =============================================
           DOT NAVIGATION
        ============================================= */

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


        /* =============================================
           TOUCH SWIPE
        ============================================= */

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


        /* =============================================
           DESKTOP DRAG
        ============================================= */

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


        /* =============================================
           MOUSE HOVER
        ============================================= */

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


        /* =============================================
           KEYBOARD FOCUS
        ============================================= */

        bannerTrack.addEventListener(
            "focusin",
            () => {

                temporarilyPauseAutoSlide();
            }
        );


        /* =============================================
           INITIAL SLIDE
        ============================================= */

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
            (event) => {

                const href =
                    communityLink.getAttribute(
                        "href"
                    );


                /*
                   The current HTML uses href="#".

                   We prevent navigation and tell the user
                   that the actual Telegram URL will be
                   connected later.
                */

                if (
                    !href ||
                    href === "#"
                ) {

                    event.preventDefault();


                    showTemporaryMessage(
                        "FINORA Telegram community will be connected soon."
                    );
                }
            }
        );
    }

/* =====================================================
   MAIN BOTTOM NAVIGATION

   MAIN NAVIGATION:
   HOME
   TEAM
   RATES
   MINE
   PROFILE

   Behavior:
   - Only ONE item can be active.
   - Active item gets the complete active state.
   - Previous item immediately loses the active state.
   - Navigation pages use normal HTML navigation.
   - Secondary pages such as Deposit, Withdraw,
     Reinvestment/Investment, Records and Support
     are NOT part of this active navigation.
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


    /* =================================================
       DETERMINE CURRENT PAGE
    ================================================= */

    const currentPath =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    /* =================================================
       PAGE → NAVIGATION MAP
    ================================================= */

    const pageMap = {

        "dashboard.html": "home",

        "": "home",

        "team.html": "team",

        "rates.html": "rates",

        "mine.html": "mine",

        "profile.html": "profile"

    };


    /* =================================================
       SET ACTIVE NAVIGATION
    ================================================= */

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


    /* =================================================
       INITIAL ACTIVE STATE

       This makes the correct button active when a
       page loads directly.

       Example:

       team.html
       → Team active

       rates.html
       → Rates active

       profile.html
       → Profile active
    ================================================= */

    const currentNavigation =
        pageMap[currentPath];


    if (currentNavigation) {

        setActiveNavigation(
            currentNavigation
        );

    } else {

        /*
           Secondary pages are NOT assigned a main
           navigation active state.

           Examples:

           deposit.html
           withdraw.html
           investment.html
           my-investments.html
           transaction-history.html
           support.html
        */

        setActiveNavigation(
            null
        );
    }


    /* =================================================
       NAVIGATION CLICK

       Immediately move the complete active state
       to the button that was tapped.

       The browser is still allowed to navigate
       normally through the HTML href.
    ================================================= */

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

       IMPORTANT:

       There is currently NO transaction API in the backend.

       Therefore we intentionally DO NOT call:

       /api/transactions/user

       because that route does not exist yet.

       The HTML's existing:
       "No recent transactions"

       message remains visible until the transaction
       system is built.
    ===================================================== */

    function initializeRecentTransactions() {

        const container =
            getElement(
                "recentTransactions"
            );


        if (!container) {
            return;
        }


        /*
           Keep the HTML empty state.

           No fake transactions.
           No localStorage.
           No nonexistent API.
        */

        console.log(
            "FINORA: Transaction system not connected yet."
        );
    }


    /* =====================================================
       PREVENT ACCIDENTAL HASH NAVIGATION
       
       Only affects links whose href is exactly "#".
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

   IMPORTANT:
   The dashboard UI initializes immediately.

   The authenticated-user request runs in the
   background and does NOT block the page.

   No fake data.
   No localStorage.
   No loading-state replacement.
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


    /* =============================================
       UI SYSTEMS START IMMEDIATELY
    ============================================= */

    initializeBannerCarousel();


    initializeNotifications();


    initializeCommunity();


    initializeNavigation();


    initializeRecentTransactions();


    initializeEmptyLinks();


    /* =============================================
       AUTHENTICATED USER

       IMPORTANT:
       DO NOT await this.

       The backend request runs silently
       in the background while the dashboard
       is already usable.
    ============================================= */

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
