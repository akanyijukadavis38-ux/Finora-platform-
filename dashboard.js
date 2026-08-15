/* =========================================================
   FINORA DASHBOARD JAVASCRIPT
   ========================================================= */

"use strict";


/* =========================================================
   FINORA CONFIGURATION
   ========================================================= */

const FINORA_CONFIG = {

    /* Backend base URL.
       If your frontend and backend are on the same server,
       /api is enough.

       If your backend is hosted separately, set:
       window.FINORA_API_BASE = "https://your-backend-url/api";
       before this script loads.
    */

    API_BASE:
        window.FINORA_API_BASE ||
        "/api",


    /* Referral percentages shown on the dashboard */

    referralRates: {
        level1: 15,
        level2: 5,
        level3: 2
    },


    /* Banner settings */

    bannerInterval: 5000,


    /* Number of recent transactions */

    recentTransactionLimit: 5,


    /* Community/support links.
       Replace these with your real FINORA links. */

    telegramLink: "#",

    supportLink: "#"

};


/* =========================================================
   FINORA STORAGE
   ========================================================= */

const FINORA_STORAGE = {

    currentUser:
        "finoraCurrentUser",

    userId:
        "finoraUserId",

    userData:
        "finoraUserData",

    transactions:
        "finoraTransactions",

    investments:
        "finoraInvestments",

    walletBalance:
        "finoraWalletBalance",

    totalEarnings:
        "finoraTotalEarnings",

    todayEarnings:
        "finoraTodayEarnings",

    referralBonus:
        "finoraReferralBonus",

    announcements:
        "finoraAnnouncements"

};


/* =========================================================
   GLOBAL FINORA STATE
   ========================================================= */

const FINORA_STATE = {

    user: null,

    transactions: [],

    investments: [],

    currentBanner: 0,

    bannerTimer: null

};


/* =========================================================
   DOM READY
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeFINORA();

});


/* =========================================================
   INITIALIZE DASHBOARD
   ========================================================= */

async function initializeFINORA() {

    try {

        loadStoredFINORAData();

        initializeBannerCarousel();

        initializeReferralRates();

        initializeReferralSystem();

        initializeCommunityLinks();

        initializeNotificationButton();

        initializeNavigation();

        renderUserInformation();

        renderFinancialInformation();

        renderInvestmentInformation();

        renderRecentTransactions();

        await synchronizeUserWithBackend();

    } catch (error) {

        console.error(
            "FINORA dashboard initialization error:",
            error
        );

    }

}


/* =========================================================
   LOAD STORED FINORA DATA
   ========================================================= */

function loadStoredFINORAData() {

    /* Current user */

    const storedUser =
        localStorage.getItem(
            FINORA_STORAGE.userData
        );

    if (storedUser) {

        try {

            FINORA_STATE.user =
                JSON.parse(storedUser);

        } catch (error) {

            FINORA_STATE.user = null;

        }

    }


    /* Transactions */

    const storedTransactions =
        localStorage.getItem(
            FINORA_STORAGE.transactions
        );

    if (storedTransactions) {

        try {

            FINORA_STATE.transactions =
                JSON.parse(storedTransactions);

            if (!Array.isArray(
                FINORA_STATE.transactions
            )) {

                FINORA_STATE.transactions = [];

            }

        } catch (error) {

            FINORA_STATE.transactions = [];

        }

    }


    /* Investments */

    const storedInvestments =
        localStorage.getItem(
            FINORA_STORAGE.investments
        );

    if (storedInvestments) {

        try {

            FINORA_STATE.investments =
                JSON.parse(storedInvestments);

            if (!Array.isArray(
                FINORA_STATE.investments
            )) {

                FINORA_STATE.investments = [];

            }

        } catch (error) {

            FINORA_STATE.investments = [];

        }

    }

}


/* =========================================================
   SAVE FINORA USER
   ========================================================= */

function saveFINORAUser(user) {

    if (!user) return;

    FINORA_STATE.user = user;

    localStorage.setItem(
        FINORA_STORAGE.userData,
        JSON.stringify(user)
    );

}


/* =========================================================
   FORMAT UGX
   ========================================================= */

function formatUGX(amount) {

    const value =
        Number(amount) || 0;

    return (
        "UGX " +
        value.toLocaleString(
            "en-US",
            {
                maximumFractionDigits: 0
            }
        )
    );

}


/* =========================================================
   FORMAT NUMBER
   ========================================================= */

function formatNumber(number) {

    return (
        Number(number) || 0
    ).toLocaleString(
        "en-US",
        {
            maximumFractionDigits: 0
        }
    );

}


/* =========================================================
   USER INFORMATION
   ========================================================= */

function renderUserInformation() {

    const userName =
        document.getElementById(
            "userName"
        );

    if (!userName) return;


    const user =
        FINORA_STATE.user;

    if (!user) {

        userName.textContent =
            "Investor";

        return;

    }


    const name =
        user.fullName ||
        user.name ||
        user.username ||
        user.userName ||
        "Investor";


    userName.textContent =
        getFirstName(name);

}


/* =========================================================
   GET FIRST NAME
   ========================================================= */

function getFirstName(name) {

    if (!name) return "Investor";

    return String(name)
        .trim()
        .split(/\s+/)[0];

}


/* =========================================================
   FINANCIAL INFORMATION
   ========================================================= */

function renderFinancialInformation() {

    const user =
        FINORA_STATE.user || {};


    const wallet =
        getFirstAvailableValue(
            user.walletBalance,
            user.balance,
            localStorage.getItem(
                FINORA_STORAGE.walletBalance
            ),
            0
        );


    const totalEarnings =
        getFirstAvailableValue(
            user.totalEarnings,
            user.cumulativeIncome,
            user.earnings,
            localStorage.getItem(
                FINORA_STORAGE.totalEarnings
            ),
            0
        );


    const todayEarnings =
        getFirstAvailableValue(
            user.todayEarnings,
            user.dailyIncome,
            localStorage.getItem(
                FINORA_STORAGE.todayEarnings
            ),
            calculateTodayEarnings(),
            0
        );


    const totalInvested =
        getFirstAvailableValue(
            user.totalInvested,
            user.totalDeposits,
            user.investedAmount,
            calculateTotalInvested(),
            0
        );


    const referralBonus =
        getFirstAvailableValue(
            user.referralBonus,
            user.referralIncome,
            0
        );


    setElementText(
        "walletBalance",
        formatUGX(wallet)
    );


    setElementText(
        "totalEarnings",
        formatUGX(totalEarnings)
    );


    setElementText(
        "todayEarnings",
        formatUGX(todayEarnings)
    );


    setElementText(
        "totalInvested",
        formatUGX(totalInvested)
    );


    setElementText(
        "referralBonus",
        formatUGX(referralBonus)
    );


    setElementText(
        "overviewTotalEarnings",
        formatUGX(totalEarnings)
    );

}


/* =========================================================
   SAFE VALUE SELECTION
   ========================================================= */

function getFirstAvailableValue(...values) {

    for (const value of values) {

        if (
            value !== null &&
            value !== undefined &&
            value !== "" &&
            !Number.isNaN(Number(value))
        ) {

            return Number(value);

        }

    }

    return 0;

}


/* =========================================================
   SET ELEMENT TEXT
   ========================================================= */

function setElementText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.textContent = value;

}


/* =========================================================
   CALCULATE TOTAL INVESTED
   ========================================================= */

function calculateTotalInvested() {

    if (
        !Array.isArray(
            FINORA_STATE.investments
        )
    ) {

        return 0;

    }


    return FINORA_STATE.investments
        .filter(
            investment =>
                investment.active !== false
        )
        .reduce(
            (total, investment) => {

                return total +
                    Number(
                        investment.amount ||
                        investment.investmentAmount ||
                        investment.depositAmount ||
                        0
                    );

            },
            0
        );

}


/* =========================================================
   COUNT ACTIVE INVESTMENTS
   ========================================================= */

function renderInvestmentInformation() {

    const activeInvestments =
        FINORA_STATE.investments.filter(
            investment =>
                investment.active !== false
        );


    setElementText(
        "activeInvestments",
        activeInvestments.length
    );


    const dailyIncome =
        calculateDailyInvestmentIncome();


    setElementText(
        "dailyIncome",
        formatUGX(dailyIncome)
    );

}


/* =========================================================
   CALCULATE DAILY INVESTMENT INCOME
   ========================================================= */

function calculateDailyInvestmentIncome() {

    return FINORA_STATE.investments
        .filter(
            investment =>
                investment.active !== false
        )
        .reduce(
            (total, investment) => {

                const dailyIncome =
                    Number(
                        investment.dailyIncome ||
                        investment.dailyEarning ||
                        0
                    );

                return total + dailyIncome;

            },
            0
        );

}


/* =========================================================
   CALCULATE TODAY'S EARNINGS
   ========================================================= */

function calculateTodayEarnings() {

    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        today.getMonth();

    const date =
        today.getDate();


    return FINORA_STATE.transactions
        .filter(transaction => {

            const type =
                String(
                    transaction.type ||
                    transaction.category ||
                    ""
                ).toLowerCase();


            if (
                type !== "daily income" &&
                type !== "daily_income" &&
                type !== "income"
            ) {

                return false;

            }


            const transactionDate =
                new Date(
                    transaction.date ||
                    transaction.createdAt ||
                    transaction.timestamp
                );


            if (
                Number.isNaN(
                    transactionDate.getTime()
                )
            ) {

                return false;

            }


            return (
                transactionDate.getFullYear()
                === year
            ) &&
            (
                transactionDate.getMonth()
                === month
            ) &&
            (
                transactionDate.getDate()
                === date
            );

        })
        .reduce(
            (total, transaction) => {

                return total +
                    Number(
                        transaction.amount || 0
                    );

            },
            0
        );

}


/* =========================================================
   BANNER CAROUSEL
   ========================================================= */

function initializeBannerCarousel() {

    const track =
        document.getElementById(
            "bannerTrack"
        );

    const indicators =
        document.querySelectorAll(
            ".banner-dot"
        );


    if (!track) return;

    const banners =
        track.querySelectorAll(
            ".dashboard-banner"
        );


    if (!banners.length) return;


    function showBanner(index) {

        if (
            index < 0 ||
            index >= banners.length
        ) {

            index = 0;

        }


        FINORA_STATE.currentBanner =
            index;


        track.style.transform =
            `translateX(-${index * 100}%)`;


        indicators.forEach(
            (dot, dotIndex) => {

                dot.classList.toggle(
                    "active",
                    dotIndex === index
                );

            }
        );

    }


    indicators.forEach(
        dot => {

            dot.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            dot.dataset.slide
                        );

                    showBanner(index);

                    restartBannerTimer();

                }
            );

        }
    );


    function nextBanner() {

        const next =
            (
                FINORA_STATE.currentBanner + 1
            ) %
            banners.length;

        showBanner(next);

    }


    function restartBannerTimer() {

        clearInterval(
            FINORA_STATE.bannerTimer
        );

        FINORA_STATE.bannerTimer =
            setInterval(
                nextBanner,
                FINORA_CONFIG.bannerInterval
            );

    }


    showBanner(0);

    restartBannerTimer();


    /* Pause while user touches the banner */

    track.addEventListener(
        "mouseenter",
        () => {

            clearInterval(
                FINORA_STATE.bannerTimer
            );

        }
    );


    track.addEventListener(
        "mouseleave",
        () => {

            restartBannerTimer();

        }
    );


    track.addEventListener(
        "touchstart",
        () => {

            clearInterval(
                FINORA_STATE.bannerTimer
            );

        },
        {
            passive: true
        }
    );


    track.addEventListener(
        "touchend",
        () => {

            restartBannerTimer();

        },
        {
            passive: true
        }
    );

}


/* =========================================================
   REFERRAL RATES
   ========================================================= */

function initializeReferralRates() {

    setElementText(
        "levelOneRate",
        FINORA_CONFIG.referralRates.level1 + "%"
    );


    setElementText(
        "levelTwoRate",
        FINORA_CONFIG.referralRates.level2 + "%"
    );


    setElementText(
        "levelThreeRate",
        FINORA_CONFIG.referralRates.level3 + "%"
    );

}


/* =========================================================
   REFERRAL SYSTEM
   ========================================================= */

function initializeReferralSystem() {

    const user =
        FINORA_STATE.user || {};


    const referralCode =
        user.referralCode ||
        user.myReferralCode ||
        user.code ||
        "";


    if (!referralCode) {

        setElementValue(
            "referralLink",
            ""
        );

        return;

    }


    const referralLink =
        buildReferralLink(
            referralCode
        );


    setElementValue(
        "referralLink",
        referralLink
    );


    const copyButton =
        document.getElementById(
            "copyReferralButton"
        );


    const mainCopyButton =
        document.getElementById(
            "copyReferralMain"
        );


    if (copyButton) {

        copyButton.addEventListener(
            "click",
            () => {

                copyReferralLink(
                    referralLink,
                    copyButton
                );

            }
        );

    }


    if (mainCopyButton) {

        mainCopyButton.addEventListener(
            "click",
            () => {

                copyReferralLink(
                    referralLink,
                    mainCopyButton
                );

            }
        );

    }

}


/* =========================================================
   BUILD REFERRAL LINK
   ========================================================= */

function buildReferralLink(
    referralCode
) {

    const currentURL =
        window.location.href
            .split("?")[0]
            .split("#")[0];


    const basePath =
        currentURL.substring(
            0,
            currentURL.lastIndexOf("/") + 1
        );


    return (
        basePath +
        "register.html?ref=" +
        encodeURIComponent(
            referralCode
        )
    );

}


/* =========================================================
   SET INPUT VALUE
   ========================================================= */

function setElementValue(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.value = value;

}


/* =========================================================
   COPY REFERRAL LINK
   ========================================================= */

async function copyReferralLink(
    link,
    button
) {

    if (!link) {

        showButtonMessage(
            button,
            "NO LINK"
        );

        return;

    }


    try {

        await navigator.clipboard.writeText(
            link
        );

        showButtonMessage(
            button,
            "COPIED"
        );

    } catch (error) {

        /* Fallback for older browsers */

        const input =
            document.getElementById(
                "referralLink"
            );


        if (input) {

            input.focus();

            input.select();

            input.setSelectionRange(
                0,
                input.value.length
            );


            try {

                document.execCommand(
                    "copy"
                );

                showButtonMessage(
                    button,
                    "COPIED"
                );

                return;

            } catch (copyError) {

                console.error(
                    "FINORA copy failed:",
                    copyError
                );

            }

        }


        showButtonMessage(
            button,
            "COPY FAILED"
        );

    }

}


/* =========================================================
   BUTTON MESSAGE
   ========================================================= */

function showButtonMessage(
    button,
    message
) {

    if (!button) return;


    const originalHTML =
        button.innerHTML;


    button.innerHTML =
        `<span>${message}</span>`;


    setTimeout(
        () => {

            button.innerHTML =
                originalHTML;

        },
        1500
    );

}


/* =========================================================
   COMMUNITY LINKS
   ========================================================= */

function initializeCommunityLinks() {

    const communityLink =
        document.getElementById(
            "communityLink"
        );


    const supportLink =
        document.getElementById(
            "supportLink"
        );


    if (communityLink) {

        communityLink.href =
            FINORA_CONFIG.telegramLink;

    }


    if (supportLink) {

        supportLink.href =
            FINORA_CONFIG.supportLink;

    }

}


/* =========================================================
   NOTIFICATIONS
   ========================================================= */

function initializeNotificationButton() {

    const button =
        document.getElementById(
            "notificationButton"
        );


    const count =
        document.getElementById(
            "notificationCount"
        );


    if (!button) return;


    button.addEventListener(
        "click",
        () => {

            showFINORANotifications();

        }
    );


    updateNotificationCount(
        count
    );

}


/* =========================================================
   NOTIFICATION COUNT
   ========================================================= */

function updateNotificationCount(
    element
) {

    if (!element) return;


    const announcements =
        getFINORAAnnouncements();


    const unreadCount =
        announcements.filter(
            announcement =>
                announcement.read !== true
        ).length;


    if (unreadCount > 0) {

        element.textContent =
            unreadCount > 99
                ? "99+"
                : String(unreadCount);

        element.style.display =
            "flex";

    } else {

        element.textContent =
            "";

        element.style.display =
            "none";

    }

}


/* =========================================================
   GET ANNOUNCEMENTS
   ========================================================= */

function getFINORAAnnouncements() {

    const stored =
        localStorage.getItem(
            FINORA_STORAGE.announcements
        );


    if (!stored) return [];


    try {

        const announcements =
            JSON.parse(stored);


        return Array.isArray(
            announcements
        )
            ? announcements
            : [];

    } catch (error) {

        return [];

    }

}


/* =========================================================
   SHOW NOTIFICATIONS
   ========================================================= */

function showFINORANotifications() {

    const announcements =
        getFINORAAnnouncements();


    if (!announcements.length) {

        showFINORAToast(
            "No new notifications."
        );

        return;

    }


    const unread =
        announcements.filter(
            announcement =>
                announcement.read !== true
        );


    if (!unread.length) {

        showFINORAToast(
            "You have no new notifications."
        );

        return;

    }


    const latest =
        unread[0];


    const title =
        latest.title ||
        "FINORA Announcement";


    const message =
        latest.message ||
        "You have a new FINORA update.";


    showFINORAToast(
        title + ": " + message
    );


    /* Mark notifications as read */

    const updated =
        announcements.map(
            announcement => ({
                ...announcement,
                read: true
            })
        );


    localStorage.setItem(
        FINORA_STORAGE.announcements,
        JSON.stringify(updated)
    );


    updateNotificationCount(
        document.getElementById(
            "notificationCount"
        )
    );

}


/* =========================================================
   FINORA TOAST
   ========================================================= */

function showFINORAToast(
    message
) {

    const existing =
        document.querySelector(
            ".finora-toast"
        );


    if (existing) {

        existing.remove();

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        "finora-toast";


    toast.textContent =
        message;


    Object.assign(
        toast.style,
        {
            position: "fixed",
            left: "50%",
            bottom: "90px",
            transform: "translateX(-50%)",
            zIndex: "99999",
            maxWidth: "90%",
            padding: "12px 18px",
            borderRadius: "12px",
            background: "#171019",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,.12)",
            boxShadow: "0 12px 35px rgba(0,0,0,.35)",
            fontSize: "13px",
            lineHeight: "1.45",
            textAlign: "center"
        }
    );


    document.body.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.remove();

        },
        3500
    );

}


/* =========================================================
   RECENT TRANSACTIONS
   ========================================================= */

function renderRecentTransactions() {

    const container =
        document.getElementById(
            "recentTransactions"
        );


    if (!container) return;


    const transactions =
        [...FINORA_STATE.transactions]
            .sort(
                (a, b) => {

                    return (
                        getTransactionTime(b) -
                        getTransactionTime(a)
                    );

                }
            )
            .slice(
                0,
                FINORA_CONFIG.recentTransactionLimit
            );


    if (!transactions.length) {

        renderEmptyTransactions(
            container
        );

        return;

    }


    container.innerHTML =
        "";


    transactions.forEach(
        transaction => {

            container.appendChild(
                createTransactionElement(
                    transaction
                )
            );

        }
    );

}


/* =========================================================
   TRANSACTION TIME
   ========================================================= */

function getTransactionTime(
    transaction
) {

    const value =
        transaction.createdAt ||
        transaction.date ||
        transaction.timestamp ||
        0;


    const time =
        new Date(value).getTime();


    return Number.isNaN(time)
        ? 0
        : time;

}


/* =========================================================
   EMPTY TRANSACTIONS
   ========================================================= */

function renderEmptyTransactions(
    container
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

}


/* =========================================================
   CREATE TRANSACTION ELEMENT
   ========================================================= */

function createTransactionElement(
    transaction
) {

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
        Number(
            transaction.amount || 0
        );


    const positive =
        isPositiveTransaction(
            type
        );


    const sign =
        positive
            ? "+"
            : "-";


    const formattedAmount =
        sign +
        " " +
        formatUGX(
            Math.abs(amount)
        );


    const date =
        formatTransactionDate(
            transaction
        );


    item.innerHTML = `

        <div class="transaction-main">

            <div class="transaction-icon">

                ${getTransactionIcon(type)}

            </div>

            <div class="transaction-details">

                <strong>
                    ${escapeHTML(
                        formatTransactionType(type)
                    )}
                </strong>

                <small>
                    ${escapeHTML(date)}
                </small>

            </div>

        </div>

        <div
            class="transaction-amount
            ${positive
                ? "transaction-positive"
                : "transaction-negative"}">

            ${escapeHTML(
                formattedAmount
            )}

        </div>

    `;


    return item;

}


/* =========================================================
   POSITIVE TRANSACTION TYPES
   ========================================================= */

function isPositiveTransaction(
    type
) {

    const normalized =
        String(type)
            .toLowerCase()
            .replace(/[_-]/g, " ");


    return (
        normalized.includes("deposit") ||
        normalized.includes("income") ||
        normalized.includes("bonus") ||
        normalized.includes("referral") ||
        normalized.includes("earning")
    );

}


/* =========================================================
   TRANSACTION TYPE
   ========================================================= */

function formatTransactionType(
    type
) {

    return String(type)
        .replace(/[_-]/g, " ")
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );

}


/* =========================================================
   TRANSACTION DATE
   ========================================================= */

function formatTransactionDate(
    transaction
) {

    const raw =
        transaction.createdAt ||
        transaction.date ||
        transaction.timestamp;


    if (!raw) {

        return "Recent";

    }


    const date =
        new Date(raw);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Recent";

    }


    return date.toLocaleString(
        "en-UG",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =========================================================
   TRANSACTION ICON
   ========================================================= */

function getTransactionIcon(
    type
) {

    const normalized =
        String(type)
            .toLowerCase();


    if (
        normalized.includes(
            "deposit"
        )
    ) {

        return "↓";

    }


    if (
        normalized.includes(
            "withdraw"
        )
    ) {

        return "↑";

    }


    if (
        normalized.includes(
            "referral"
        )
    ) {

        return "👥";

    }


    if (
        normalized.includes(
            "income"
        ) ||
        normalized.includes(
            "earning"
        )
    ) {

        return "↗";

    }


    if (
        normalized.includes(
            "bonus"
        )
    ) {

        return "★";

    }


    return "•";

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function initializeNavigation() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    document
        .querySelectorAll(
            ".bottom-nav-item"
        )
        .forEach(
            item => {

                const href =
                    item.getAttribute(
                        "href"
                    );


                if (!href) return;


                const target =
                    href
                        .split("/")
                        .pop()
                        .toLowerCase();


                item.classList.toggle(
                    "active",
                    target === currentPage
                );

            }
        );

}


/* =========================================================
   BACKEND SYNCHRONIZATION
   ========================================================= */

async function synchronizeUserWithBackend() {

    const userId =
        localStorage.getItem(
            FINORA_STORAGE.userId
        );


    if (!userId) {

        return;

    }


    try {

        const response =
            await fetch(
                FINORA_CONFIG.API_BASE +
                "/users/" +
                encodeURIComponent(
                    userId
                ),
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            console.warn(
                "FINORA user synchronization returned:",
                response.status
            );

            return;

        }


        const user =
            await response.json();


        const serverUser =
            user.user ||
            user.data ||
            user;


        if (!serverUser) return;


        saveFINORAUser(
            serverUser
        );


        synchronizeInvestmentsFromUser(
            serverUser
        );


        renderUserInformation();

        renderFinancialInformation();

        renderInvestmentInformation();

        initializeReferralSystem();


    } catch (error) {

        /*
         Backend unavailable:
         the dashboard continues using locally
         stored FINORA information.
        */

        console.warn(
            "FINORA backend unavailable. Using stored dashboard data."
        );

    }

}


/* =========================================================
   SYNCHRONIZE INVESTMENTS
   ========================================================= */

function synchronizeInvestmentsFromUser(
    user
) {

    if (
        !Array.isArray(
            user.purchasedProducts
        )
    ) {

        return;

    }


    FINORA_STATE.investments =
        user.purchasedProducts;


    localStorage.setItem(
        FINORA_STORAGE.investments,
        JSON.stringify(
            FINORA_STATE.investments
        )
    );

}


/* =========================================================
   PUBLIC FINORA DATA FUNCTIONS
   ========================================================= */

/*
   These functions can also be used by other FINORA
   JavaScript files when they need to update dashboard data.
*/


window.FINORA = {

    getUser() {

        return FINORA_STATE.user;

    },


    setUser(user) {

        saveFINORAUser(user);

        renderUserInformation();

        renderFinancialInformation();

        initializeReferralSystem();

    },


    getTransactions() {

        return FINORA_STATE.transactions;

    },


    setTransactions(
        transactions
    ) {

        if (
            !Array.isArray(
                transactions
            )
        ) {

            return;

        }


        FINORA_STATE.transactions =
            transactions;


        localStorage.setItem(
            FINORA_STORAGE.transactions,
            JSON.stringify(
                transactions
            )
        );


        renderRecentTransactions();

        renderFinancialInformation();

    },


    getInvestments() {

        return FINORA_STATE.investments;

    },


    setInvestments(
        investments
    ) {

        if (
            !Array.isArray(
                investments
            )
        ) {

            return;

        }


        FINORA_STATE.investments =
            investments;


        localStorage.setItem(
            FINORA_STORAGE.investments,
            JSON.stringify(
                investments
            )
        );


        renderInvestmentInformation();

        renderFinancialInformation();

    },


    refresh() {

        loadStoredFINORAData();

        renderUserInformation();

        renderFinancialInformation();

        renderInvestmentInformation();

        renderRecentTransactions();

        initializeReferralSystem();

        synchronizeUserWithBackend();

    }

};


/* =========================================================
   FINORA DASHBOARD READY
   ========================================================= */

console.log(
    "FINORA Dashboard JavaScript loaded successfully."
);
