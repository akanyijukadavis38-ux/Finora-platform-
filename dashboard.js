/* =========================================================
   FINORA DASHBOARD
   dashboard.js
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       FINORA CONFIGURATION
       ===================================================== */

    const FINORA_API = "https://finora-backend-l949.onrender.com";

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

    function formatUGX(value) {

        const amount = Number(value) || 0;

        return "UGX " + amount.toLocaleString("en-UG");
    }


    function getElement(id) {
        return document.getElementById(id);
    }


    function safeNumber(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }


    /* =====================================================
       CURRENT USER
       ===================================================== */

    let currentUser = null;


    /*
       The FINORA login page should store the returned user
       object after successful login.

       Expected storage:

       finoraUser
    */

    function getStoredUser() {

        try {

            const stored = localStorage.getItem("finoraUser");

            if (!stored) {
                return null;
            }

            return JSON.parse(stored);

        } catch (error) {

            console.error(
                "FINORA: Unable to read stored user.",
                error
            );

            return null;
        }
    }


    function saveUser(user) {

        try {

            localStorage.setItem(
                "finoraUser",
                JSON.stringify(user)
            );

        } catch (error) {

            console.error(
                "FINORA: Unable to save user.",
                error
            );
        }
    }


    /* =====================================================
       LOAD USER FROM FINORA BACKEND
       ===================================================== */

    async function loadCurrentUser() {

        currentUser = getStoredUser();


        /*
           If the login page already supplied the complete
           user object, display it immediately.
        */

        if (currentUser) {

            updateDashboardUser(currentUser);

        }


        /*
           The stored user must contain an ID for the
           dashboard to request fresh account information.
        */

        if (!currentUser || !currentUser.id) {

            console.warn(
                "FINORA: No authenticated FINORA user was found."
            );

            return;
        }


        try {

            /*
               This endpoint assumes the backend provides
               GET /api/users/:id for the authenticated user.
            */

            const response = await fetch(
                `${FINORA_API}/api/users/${encodeURIComponent(currentUser.id)}`,
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


            if (!response.ok) {

                console.warn(
                    "FINORA: Could not refresh user data.",
                    response.status
                );

                return;
            }


            const data = await response.json();


            /*
               Some APIs return:

               { user: {...} }

               while others return the user directly.
            */

            const freshUser = data.user || data;


            if (
                freshUser &&
                typeof freshUser === "object"
            ) {

                currentUser = {
                    ...currentUser,
                    ...freshUser
                };

                saveUser(currentUser);

                updateDashboardUser(currentUser);
            }


        } catch (error) {

            console.error(
                "FINORA: User data request failed.",
                error
            );
        }
    }


    /* =====================================================
       UPDATE USER NAME
       ===================================================== */

    function updateDashboardUser(user) {

        const userName = getElement("userName");

        if (!userName || !user) {
            return;
        }


        const name =
            user.full_name ||
            user.fullName ||
            user.name ||
            user.username ||
            user.phone ||
            "Investor";


        userName.textContent = name;
    }


    /* =====================================================
       WALLET / FINANCIAL INFORMATION
       ===================================================== */

    function updateFinancialData(user) {

        if (!user) {
            return;
        }


        const walletBalance =
            safeNumber(
                user.wallet_balance ??
                user.walletBalance ??
                user.balance
            );


        const totalEarnings =
            safeNumber(
                user.total_earnings ??
                user.totalEarnings ??
                user.cumulative_income ??
                user.cumulativeIncome
            );


        const todayEarnings =
            safeNumber(
                user.today_earnings ??
                user.todayEarnings ??
                user.daily_income ??
                user.dailyIncome
            );


        const totalInvested =
            safeNumber(
                user.total_invested ??
                user.totalInvested ??
                user.total_deposits ??
                user.totalDeposits
            );


        const referralBonus =
            safeNumber(
                user.referral_bonus ??
                user.referralBonus ??
                user.referral_income ??
                user.referralIncome
            );


        const activeInvestments =
            safeNumber(
                user.active_investments ??
                user.activeInvestments ??
                user.investment_count ??
                user.investmentCount
            );


        const walletElement = getElement("walletBalance");
        const totalEarningsElement = getElement("totalEarnings");
        const todayEarningsElement = getElement("todayEarnings");
        const totalInvestedElement = getElement("totalInvested");
        const referralBonusElement = getElement("referralBonus");
        const activeInvestmentsElement = getElement("activeInvestments");
        const dailyIncomeElement = getElement("dailyIncome");
        const overviewTotalEarningsElement =
            getElement("overviewTotalEarnings");


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
                activeInvestments.toLocaleString("en-UG");
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


        let referralCode = "";


        if (currentUser) {

            referralCode =
                currentUser.referral_code ||
                currentUser.referralCode ||
                currentUser.my_referral_code ||
                currentUser.myReferralCode ||
                "";
        }


        if (!referralCode) {

            referralLink.value = "";

            return;
        }


        const baseURL =
            window.location.origin +
            window.location.pathname
                .replace("dashboard.html", "");


        referralLink.value =
            baseURL +
            "register.html?ref=" +
            encodeURIComponent(referralCode);
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

            /*
               Fallback for browsers where Clipboard API
               is unavailable.
            */

            input.focus();
            input.select();

            try {

                document.execCommand("copy");

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
        getElement("copyReferralButton");


    const copyReferralMain =
        getElement("copyReferralMain");


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
            document.getElementById(
                "finoraMessageBox"
            );


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
        getElement("bannerIndicators");


    if (bannerTrack) {

        const banners =
            Array.from(
                bannerTrack.children
            );


        const dots =
            bannerIndicators
                ? Array.from(
                    bannerIndicators.querySelectorAll(
                        ".banner-dot"
                    )
                )
                : [];


        let currentSlide = 0;

        let autoSlideTimer = null;

        let resumeTimer = null;

        let manualInteraction = false;


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


            if (!animate) {

                bannerTrack.style.transition =
                    "none";

            } else {

                bannerTrack.style.transition =
                    "";
            }


            bannerTrack.style.transform =
                `translate3d(-${currentSlide * 100}%, 0, 0)`;


            dots.forEach((dot, dotIndex) => {

                dot.classList.toggle(
                    "active",
                    dotIndex === currentSlide
                );

            });


            if (!animate) {

                requestAnimationFrame(() => {

                    bannerTrack.style.transition =
                        "";

                });
            }
        }


        function nextSlide() {

            showSlide(
                currentSlide + 1
            );
        }


        function stopAutoSlide() {

            clearInterval(
                autoSlideTimer
            );

            autoSlideTimer = null;
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

            manualInteraction = true;

            stopAutoSlide();

            clearTimeout(
                resumeTimer
            );


            resumeTimer =
                setTimeout(() => {

                    manualInteraction =
                        false;

                    startAutoSlide();

                }, RESUME_DELAY);
        }


        function manualSlide(index) {

            temporarilyPauseAutoSlide();

            showSlide(index);
        }


        /*
           Indicator buttons
        */

        dots.forEach((dot) => {

            dot.addEventListener(
                "click",
                () => {

                    const slide =
                        Number(
                            dot.dataset.slide
                        );


                    if (
                        Number.isInteger(slide)
                    ) {

                        manualSlide(slide);
                    }
                }
            );
        });


        /*
           Touch/swipe support
        */

        let touchStartX = 0;

        let touchStartY = 0;

        let touchMoved = false;


        bannerTrack.addEventListener(
            "touchstart",
            (event) => {

                if (!event.touches.length) {
                    return;
                }


                touchStartX =
                    event.touches[0].clientX;

                touchStartY =
                    event.touches[0].clientY;

                touchMoved = false;

                temporarilyPauseAutoSlide();

            },
            { passive: true }
        );


        bannerTrack.addEventListener(
            "touchmove",
            (event) => {

                if (!event.touches.length) {
                    return;
                }


                const currentX =
                    event.touches[0].clientX;

                const currentY =
                    event.touches[0].clientY;


                const deltaX =
                    currentX - touchStartX;

                const deltaY =
                    currentY - touchStartY;


                if (
                    Math.abs(deltaX) >
                    Math.abs(deltaY)
                ) {

                    touchMoved = true;
                }

            },
            { passive: true }
        );


        bannerTrack.addEventListener(
            "touchend",
            (event) => {

                if (!touchMoved) {
                    return;
                }


                const touch =
                    event.changedTouches[0];


                const endX =
                    touch.clientX;


                const difference =
                    endX - touchStartX;


                const minimumSwipe =
                    45;


                if (
                    Math.abs(difference) >=
                    minimumSwipe
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
            { passive: true }
        );


        /*
           Desktop mouse dragging
        */

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
                    Math.abs(difference) >= 45
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


        /*
           Pause when pointer is over the banner.
           This gives the user complete control while
           reading the banner.
        */

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


        /*
           If the user focuses/interacts with the banner,
           don't fight their interaction.
        */

        bannerTrack.addEventListener(
            "focusin",
            () => {

                temporarilyPauseAutoSlide();

            }
        );


        /*
           Start automatically.
        */

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
        getElement("notificationButton");


    const notificationCount =
        getElement("notificationCount");


    if (notificationButton) {

        notificationButton.addEventListener(
            "click",
            () => {

                /*
                   Notification page/panel can be connected
                   when the FINORA notification destination
                   exists.
                */

                showTemporaryMessage(
                    "No new notification details available."
                );


                if (notificationCount) {

                    notificationCount.style.display =
                        "none";
                }
            }
        );
    }


    /* =====================================================
       COMMUNITY LINK
       ===================================================== */

    const communityLink =
        getElement("communityLink");


    if (communityLink) {

        communityLink.addEventListener(
            "click",
            (event) => {

                event.preventDefault();


                /*
                   Replace the URL when the official FINORA
                   Telegram community URL is configured.
                */

                showTemporaryMessage(
                    "FINORA community link is not configured yet."
                );
            }
        );
    }


    /* =====================================================
       SUPPORT LINK
       ===================================================== */

    const supportLink =
        getElement("supportLink");


    if (supportLink) {

        supportLink.addEventListener(
            "click",
            (event) => {

                event.preventDefault();


                /*
                   Replace with the actual FINORA support
                   destination when it exists.
                */

                showTemporaryMessage(
                    "FINORA support link is not configured yet."
                );
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
            getElement("recentTransactions");


        if (!container) {
            return;
        }


        if (
            !Array.isArray(transactions) ||
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
                .sort((a, b) => {

                    const dateA =
                        new Date(
                            a.created_at ||
                            a.createdAt ||
                            a.date ||
                            0
                        );

                    const dateB =
                        new Date(
                            b.created_at ||
                            b.createdAt ||
                            b.date ||
                            0
                        );


                    return dateB - dateA;

                })
                .slice(0, 5);


        container.innerHTML = "";


        recent.forEach((transaction) => {

            const item =
                document.createElement("div");


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
                transaction.created_at ||
                transaction.createdAt ||
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
                        ${escapeHTML(formattedDate)}
                    </small>

                </div>

                <strong class="transaction-amount">
                    ${formatUGX(amount)}
                </strong>

            `;


            container.appendChild(item);
        });
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
       LOAD TRANSACTIONS
       ===================================================== */

    async function loadRecentTransactions() {

        if (!currentUser || !currentUser.id) {
            return;
        }


        try {

            const response =
                await fetch(
                    `${FINORA_API}/api/transactions/user/${encodeURIComponent(currentUser.id)}`,
                    {
                        method: "GET",
                        headers: {
                            "Accept": "application/json"
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
       PREVENT EMPTY # LINKS FROM JUMPING
       ===================================================== */

    document
        .querySelectorAll('a[href="#"]')
        .forEach((link) => {

            link.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();
                }
            );
        });


    /* =====================================================
       INITIALIZE DASHBOARD
       ===================================================== */

    setupReferralProgram();


    if (currentUser) {

        updateDashboardUser(
            currentUser
        );

        updateFinancialData(
            currentUser
        );
    }


    loadCurrentUser()
        .then(() => {

            setupReferralProgram();

            updateFinancialData(
                currentUser
            );

            return loadRecentTransactions();

        })
        .catch((error) => {

            console.error(
                "FINORA: Dashboard initialization error.",
                error
            );
        });

});
