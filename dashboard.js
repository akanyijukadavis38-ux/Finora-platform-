/* =========================================================
   FINORA DASHBOARD
   dashboard.js
   ONLINE / BACKEND VERSION
   SESSION AUTHENTICATION
   NO LOCAL STORAGE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       FINORA CONFIGURATION
    ===================================================== */

    const FINORA_API =
        "https://finora-backend-l949.onrender.com";

    const REFERRAL_LEVELS = {
        levelOne: 15,
        levelTwo: 5,
        levelThree: 2
    };

    const AUTO_SLIDE_DELAY = 5000;
    const RESUME_DELAY = 4500;


    /* =====================================================
       BASIC HELPERS
    ===================================================== */

    function getElement(id) {
        return document.getElementById(id);
    }


    function safeNumber(value) {

        const number = Number(value);

        return Number.isFinite(number)
            ? number
            : 0;
    }


    function formatUGX(value) {

        const amount =
            safeNumber(value);

        return "UGX " +
            amount.toLocaleString("en-UG");
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
       CURRENT USER
    ===================================================== */

    let currentUser = null;


    /* =====================================================
       LOAD AUTHENTICATED USER
       
       IMPORTANT:
       server.js provides:
       
       GET /api/me
       
       NOT:
       
       /api/users/me
    ===================================================== */

    async function loadCurrentUser() {

        try {

            const response =
                await fetch(
                    `${FINORA_API}/api/me`,
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


            if (!response.ok) {

                if (
                    response.status === 401
                ) {

                    console.warn(
                        "FINORA: No authenticated session found."
                    );

                } else {

                    console.warn(
                        "FINORA: Unable to load authenticated user.",
                        response.status
                    );
                }

                return null;
            }


            const data =
                await response.json();


            console.log(
                "FINORA USER RESPONSE:",
                data
            );


            const user =
                data.user ||
                data.data ||
                data;


            if (
                !user ||
                typeof user !== "object"
            ) {

                console.warn(
                    "FINORA: Backend returned invalid user data."
                );

                return null;
            }


            currentUser = user;


            /* =============================================
               UPDATE DASHBOARD
            ============================================= */

            updateDashboardUser(
                currentUser
            );


            updateFinancialData(
                currentUser
            );


            setupReferralProgram();


            return currentUser;


        } catch (error) {

            console.error(
                "FINORA: User request failed.",
                error
            );

            return null;
        }
    }


    /* =====================================================
       UPDATE USER FULL NAME
    ===================================================== */

    function updateDashboardUser(user) {

        const userName =
            getElement("userName");


        if (!userName) {
            return;
        }


        if (!user) {

            userName.textContent =
                "Unable to load name";

            return;
        }


        /*
           PostgreSQL server returns:

           full_name

           We also support fullName/name
           in case the backend response changes.
        */

        const name =
            user.full_name ||
            user.fullName ||
            user.name;


        if (
            name &&
            String(name).trim()
        ) {

            userName.textContent =
                String(name).trim();

        } else {

            /*
               DO NOT SHOW "Investor".
               The actual registered name
               must come from the backend.
            */

            userName.textContent =
                "Unable to load name";
        }
    }


    /* =====================================================
       WALLET / FINANCIAL INFORMATION
    ===================================================== */

    function updateFinancialData(user) {

        if (!user) {
            return;
        }


        /* =============================================
           WALLET BALANCE
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
                user.cumulativeIncome ??
                user.cumulative_income
            );


        /* =============================================
           TODAY EARNINGS
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
                user.totalDeposits ??
                user.total_deposits
            );


        /* =============================================
           REFERRAL BONUS
        ============================================= */

        const referralBonus =
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
           ELEMENTS
        ============================================= */

        const walletElement =
            getElement("walletBalance");


        const totalEarningsElement =
            getElement("totalEarnings");


        const todayEarningsElement =
            getElement("todayEarnings");


        const totalInvestedElement =
            getElement("totalInvested");


        const referralBonusElement =
            getElement("referralBonus");


        const activeInvestmentsElement =
            getElement("activeInvestments");


        const dailyIncomeElement =
            getElement("dailyIncome");


        const overviewTotalEarningsElement =
            getElement(
                "overviewTotalEarnings"
            );


        /* =============================================
           DISPLAY VALUES
        ============================================= */

        if (walletElement) {

            walletElement.textContent =
                formatUGX(walletBalance);
        }


        if (totalEarningsElement) {

            totalEarningsElement.textContent =
                formatUGX(totalEarnings);
        }


        if (todayEarningsElement) {

            todayEarningsElement.textContent =
                formatUGX(todayEarnings);
        }


        if (totalInvestedElement) {

            totalInvestedElement.textContent =
                formatUGX(totalInvested);
        }


        if (referralBonusElement) {

            referralBonusElement.textContent =
                formatUGX(referralBonus);
        }


        if (activeInvestmentsElement) {

            activeInvestmentsElement.textContent =
                activeInvestments.toLocaleString(
                    "en-UG"
                );
        }


        if (dailyIncomeElement) {

            dailyIncomeElement.textContent =
                formatUGX(todayEarnings);
        }


        if (overviewTotalEarningsElement) {

            overviewTotalEarningsElement.textContent =
                formatUGX(totalEarnings);
        }
    }


    /* =====================================================
       REFERRAL PROGRAM
    ===================================================== */

    function setupReferralProgram() {

        const levelOneRate =
            getElement("levelOneRate");


        const levelTwoRate =
            getElement("levelTwoRate");


        const levelThreeRate =
            getElement("levelThreeRate");


        if (levelOneRate) {

            levelOneRate.textContent =
                REFERRAL_LEVELS.levelOne + "%";
        }


        if (levelTwoRate) {

            levelTwoRate.textContent =
                REFERRAL_LEVELS.levelTwo + "%";
        }


        if (levelThreeRate) {

            levelThreeRate.textContent =
                REFERRAL_LEVELS.levelThree + "%";
        }


        const referralLink =
            getElement("referralLink");


        if (!referralLink) {
            return;
        }


        if (!currentUser) {

            referralLink.value = "";

            return;
        }


        const referralCode =
            currentUser.referral_code ||
            currentUser.referralCode ||
            currentUser.myReferralCode ||
            currentUser.my_referral_code ||
            "";


        if (!referralCode) {

            referralLink.value = "";

            return;
        }


        /* =================================================
           ONLY CHANGE:
           CLEAN REFERRAL URL

           NO register.html
           NO index.html
        ================================================= */

        const baseURL =
            window.location.origin + "/";


        referralLink.value =
            baseURL +
            "?ref=" +
            encodeURIComponent(
                referralCode
            );
    }


    /* =====================================================
       COPY REFERRAL LINK
    ===================================================== */

    async function copyReferralLink() {

        const input =
            getElement("referralLink");


        if (!input || !input.value) {

            showTemporaryMessage(
                "Referral link is not available yet."
            );

            return;
        }


        try {

            await navigator.clipboard.writeText(
                input.value
            );


            showTemporaryMessage(
                "Referral link copied."
            );


        } catch (error) {

            input.focus();

            input.select();


            try {

                document.execCommand(
                    "copy"
                );


                showTemporaryMessage(
                    "Referral link copied."
                );


            } catch (copyError) {

                showTemporaryMessage(
                    "Unable to copy referral link."
                );
            }
        }
    }


    const copyReferralButton =
        getElement(
            "copyReferralButton"
        );


    const copyReferralMain =
        getElement(
            "copyReferralMain"
        );


    if (copyReferralButton) {

        copyReferralButton.addEventListener(
            "click",
            copyReferralLink
        );
    }


    if (copyReferralMain) {

        copyReferralMain.addEventListener(
            "click",
            copyReferralLink
        );
    }


    /* =====================================================
       TEMPORARY MESSAGE
    ===================================================== */

    function showTemporaryMessage(message) {

        let messageBox =
            getElement(
                "finoraMessageBox"
            );


        if (!messageBox) {

            messageBox =
                document.createElement(
                    "div"
                );


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
       BANNER CAROUSEL
    ===================================================== */

    const bannerTrack =
        getElement("bannerTrack");


    const bannerIndicators =
        getElement(
            "bannerIndicators"
        );


    if (bannerTrack) {

        const banners =
            Array.from(
                bannerTrack.children
            );


        const dots =
            bannerIndicators
                ? Array.from(
                    bannerIndicators
                        .querySelectorAll(
                            ".banner-dot"
                        )
                )
                : [];


        let currentSlide = 0;

        let autoSlideTimer = null;

        let resumeTimer = null;

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
                (index + banners.length) %
                banners.length;


            bannerTrack.style.transition =
                animate
                    ? ""
                    : "none";


            bannerTrack.style.transform =
                `translate3d(-${currentSlide * 100}%, 0, 0)`;


            dots.forEach(
                (dot, dotIndex) => {

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

                autoSlideTimer = null;
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


        function manualSlide(index) {

            temporarilyPauseAutoSlide();

            showSlide(index);
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

                            manualSlide(
                                slide
                            );
                        }
                    }
                );
            }
        );


        /* =================================================
           TOUCH SWIPE
        ================================================= */

        let touchStartX = 0;

        let touchStartY = 0;

        let touchMoved = false;


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


                touchMoved = false;


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

                    touchMoved = true;
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

                    if (difference < 0) {

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


        /* =================================================
           DESKTOP DRAG
        ================================================= */

        let mouseDown = false;

        let mouseStartX = 0;

        let mouseMoved = false;


        bannerTrack.addEventListener(
            "mousedown",
            (event) => {

                mouseDown = true;

                mouseMoved = false;

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

                    mouseMoved = true;
                }
            }
        );


        window.addEventListener(
            "mouseup",
            (event) => {

                if (!mouseDown) {
                    return;
                }


                mouseDown = false;


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

                    if (difference < 0) {

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


        /* =================================================
           POINTER HOVER
        ================================================= */

        bannerTrack.addEventListener(
            "mouseenter",
            () => {

                stopAutoSlide();
            }
        );


        bannerTrack.addEventListener(
            "mouseleave",
            () => {

                if (!manualInteraction) {

                    startAutoSlide();
                }
            }
        );


        /* =================================================
           FOCUS
        ================================================= */

        bannerTrack.addEventListener(
            "focusin",
            () => {

                temporarilyPauseAutoSlide();
            }
        );


        /* =================================================
           START CAROUSEL
        ================================================= */

        showSlide(
            0,
            false
        );


        startAutoSlide();
    }


    /* =====================================================
       NOTIFICATIONS
    ===================================================== */

    const notificationButton =
        getElement(
            "notificationButton"
        );


    const notificationCount =
        getElement(
            "notificationCount"
        );


    if (notificationButton) {

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

    const communityLink =
        getElement(
            "communityLink"
        );


    if (communityLink) {

        communityLink.addEventListener(
            "click",
            (event) => {

                if (
                    !communityLink.href ||
                    communityLink.getAttribute(
                        "href"
                    ) === "#"
                ) {

                    event.preventDefault();

                    showTemporaryMessage(
                        "FINORA community link is not configured yet."
                    );
                }
            }
        );
    }


    /* =====================================================
       SUPPORT
    ===================================================== */

    const supportLink =
        getElement(
            "supportLink"
        );


    if (supportLink) {

        supportLink.addEventListener(
            "click",
            (event) => {

                if (
                    !supportLink.href ||
                    supportLink.getAttribute(
                        "href"
                    ) === "#"
                ) {

                    event.preventDefault();

                    showTemporaryMessage(
                        "FINORA support link is not configured yet."
                    );
                }
            }
        );
    }


    /* =====================================================
       RECENT TRANSACTIONS
    ===================================================== */

    function updateRecentTransactions(
        transactions
    ) {

        const container =
            getElement(
                "recentTransactions"
            );


        if (!container) {
            return;
        }


        if (
            !Array.isArray(
                transactions
            ) ||
            transactions.length === 0
        ) {

            container.innerHTML = `

                <div class="empty-transactions">

                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">

                        <rect
                            x="5"
                            y="3"
                            width="14"
                            height="18"
                            rx="2"
                            stroke="currentColor"
                            stroke-width="1.7"/>

                        <path
                            d="M9 8H15"
                            stroke="currentColor"
                            stroke-width="1.7"
                            stroke-linecap="round"/>

                        <path
                            d="M9 12H15"
                            stroke="currentColor"
                            stroke-width="1.7"
                            stroke-linecap="round"/>

                        <path
                            d="M9 16H13"
                            stroke="currentColor"
                            stroke-width="1.7"
                            stroke-linecap="round"/>

                    </svg>

                    <p>
                        No recent transactions
                    </p>

                </div>

            `;

            return;
        }


        const recent =
            transactions
                .slice()
                .sort(
                    (a, b) => {

                        const dateA =
                            new Date(
                                a.createdAt ||
                                a.created_at ||
                                a.date ||
                                0
                            );


                        const dateB =
                            new Date(
                                b.createdAt ||
                                b.created_at ||
                                b.date ||
                                0
                            );


                        return dateB - dateA;
                    }
                )
                .slice(0, 5);


        container.innerHTML = "";


        recent.forEach(
            (transaction) => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "transaction-item";


                const type =
                    transaction.type ||
                    transaction.category ||
                    "Transaction";


                const amount =
                    safeNumber(
                        transaction.amount
                    );


                const date =
                    transaction.createdAt ||
                    transaction.created_at ||
                    transaction.date;


                const formattedDate =
                    date
                        ? new Date(date)
                            .toLocaleDateString(
                                "en-UG",
                                {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                }
                            )
                        : "";


                item.innerHTML = `

                    <div class="transaction-info">

                        <strong>
                            ${escapeHTML(type)}
                        </strong>

                        <small>
                            ${escapeHTML(
                                formattedDate
                            )}
                        </small>

                    </div>

                    <strong class="transaction-amount">
                        ${formatUGX(amount)}
                    </strong>

                `;


                container.appendChild(
                    item
                );
            }
        );
    }


    /* =====================================================
       LOAD TRANSACTIONS FROM BACKEND
    ===================================================== */

    async function loadRecentTransactions() {

        if (!currentUser) {
            return;
        }


        try {

            const response =
                await fetch(
                    `${FINORA_API}/api/transactions/user`,
                    {
                        method: "GET",

                        credentials: "include",

                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            if (!response.ok) {

                console.warn(
                    "FINORA: Transaction request failed.",
                    response.status
                );

                return;
            }


            const data =
                await response.json();


            const transactions =
                Array.isArray(data)
                    ? data
                    : (
                        data.transactions ||
                        data.records ||
                        data.data ||
                        []
                    );


            updateRecentTransactions(
                transactions
            );


        } catch (error) {

            console.error(
                "FINORA: Unable to load transactions.",
                error
            );
        }
    }


    /* =====================================================
       EMPTY HASH LINKS
    ===================================================== */

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


    /* =====================================================
       DASHBOARD INITIALIZATION
    ===================================================== */

    setupReferralProgram();


    loadCurrentUser()
        .then(
            async (user) => {

                if (!user) {

                    console.warn(
                        "FINORA: Dashboard has no authenticated user."
                    );

                    return;
                }


                updateDashboardUser(
                    user
                );


                updateFinancialData(
                    user
                );


                setupReferralProgram();


                await loadRecentTransactions();
            }
        )
        .catch(
            (error) => {

                console.error(
                    "FINORA: Dashboard initialization error.",
                    error
                );
            }
        );

});
