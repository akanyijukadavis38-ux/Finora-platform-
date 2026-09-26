/* =========================================================
   FINORA ADMIN DASHBOARD
   ADMIN.JS
========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

const API_BASE = "https://finora-platform.onrender.com";

const OVERVIEW_ENDPOINT = `${API_BASE}/api/admin/overview`;

const NOTIFICATIONS_ENDPOINT = `${API_BASE}/api/notifications/admin`;

const LOGOUT_ENDPOINT = `${API_BASE}/api/admin/logout`;


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => document.querySelectorAll(selector);


/* =========================================================
   STATE
========================================================= */

let dashboardLoading = false;


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeFooterYear();

    initializeMobileNavigation();

    initializeRefreshButton();

    initializeLogout();

    initializeNavigationState();

    loadAdminOverview();

    loadNotificationCount();

});


/* =========================================================
   FOOTER YEAR
========================================================= */

function initializeFooterYear() {

    const yearElement = $("#footerYear");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function initializeMobileNavigation() {

    const menuButton = $("#mobileMenuButton");
    const sidebar = $("#adminSidebar");
    const overlay = $("#mobileSidebarOverlay");

    if (!menuButton || !sidebar || !overlay) {
        return;
    }


    menuButton.addEventListener("click", () => {

        const isOpen = sidebar.classList.contains("mobile-open");

        if (isOpen) {
            closeMobileSidebar();
        } else {
            openMobileSidebar();
        }

    });


    overlay.addEventListener("click", () => {
        closeMobileSidebar();
    });


    $$(".sidebar-link").forEach((link) => {

        link.addEventListener("click", () => {

            if (window.innerWidth <= 900) {
                closeMobileSidebar();
            }

        });

    });


    document.addEventListener("keydown", (event) => {

        if (event.key === "Escape") {
            closeMobileSidebar();
        }

    });

}


function openMobileSidebar() {

    const sidebar = $("#adminSidebar");
    const overlay = $("#mobileSidebarOverlay");
    const menuButton = $("#mobileMenuButton");

    if (!sidebar || !overlay) {
        return;
    }

    sidebar.classList.add("mobile-open");
    overlay.classList.add("active");

    if (menuButton) {
        menuButton.setAttribute("aria-expanded", "true");
    }

    document.body.style.overflow = "hidden";
}


function closeMobileSidebar() {

    const sidebar = $("#adminSidebar");
    const overlay = $("#mobileSidebarOverlay");
    const menuButton = $("#mobileMenuButton");

    if (!sidebar || !overlay) {
        return;
    }

    sidebar.classList.remove("mobile-open");
    overlay.classList.remove("active");

    if (menuButton) {
        menuButton.setAttribute("aria-expanded", "false");
    }

    document.body.style.overflow = "";
}


/* =========================================================
   REFRESH BUTTON
========================================================= */

function initializeRefreshButton() {

    const button = $("#refreshDashboard");

    if (!button) {
        return;
    }


    button.addEventListener("click", async () => {

        if (dashboardLoading) {
            return;
        }

        await loadAdminOverview();

        await loadNotificationCount();

    });

}


/* =========================================================
   LOAD ADMIN OVERVIEW
========================================================= */

async function loadAdminOverview() {

    if (dashboardLoading) {
        return;
    }

    dashboardLoading = true;

    setRefreshLoading(true);

    setDashboardLoadingState();


    try {

        const response = await fetch(OVERVIEW_ENDPOINT, {
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        });


        if (response.status === 401) {

            window.location.href = "admin-login.html";

            return;
        }


        if (response.status === 403) {

            showToast(
                "Administrator access is required.",
                "error"
            );

            return;
        }


        if (!response.ok) {

            throw new Error(
                `Overview request failed with status ${response.status}`
            );

        }


        const data = await response.json();

        renderOverview(data);

        updateLastUpdated();

        setLiveStatus(true);


    } catch (error) {

        console.error(
            "FINORA ADMIN OVERVIEW ERROR:",
            error
        );

        setLiveStatus(false);

        showOverviewError();

    } finally {

        dashboardLoading = false;

        setRefreshLoading(false);

    }

}


/* =========================================================
   OVERVIEW DATA RENDERING
========================================================= */

function renderOverview(data) {

    /*
       The renderer accepts both:

       {
           totalUsers,
           activeUsers,
           frozenUsers,
           totalDeposited,
           totalWithdrawn,
           totalInvested,
           totalEarningsCredited,
           pendingDeposits,
           pendingWithdrawals,
           recentActivity,
           system
       }

       and an optional nested structure:

       {
           users: {...},
           finance: {...},
           earnings: {...},
           pending: {...},
           recentActivity: [...],
           system: {...}
       }

       This keeps the frontend flexible while the final
       backend endpoint is being connected.
    */


    const users = data.users || {};
    const finance = data.finance || {};
    const earnings = data.earnings || {};
    const pending = data.pending || {};
    const system = data.system || {};


    const totalUsers =
        firstDefined(
            data.totalUsers,
            users.total,
            users.totalUsers
        );


    const activeUsers =
        firstDefined(
            data.activeUsers,
            users.active,
            users.activeUsers
        );


    const frozenUsers =
        firstDefined(
            data.frozenUsers,
            users.frozen,
            users.frozenUsers
        );


    const totalDeposited =
        firstDefined(
            data.totalDeposited,
            finance.totalDeposited,
            finance.deposited
        );


    const totalWithdrawn =
        firstDefined(
            data.totalWithdrawn,
            finance.totalWithdrawn,
            finance.withdrawn
        );


    const totalInvested =
        firstDefined(
            data.totalInvested,
            finance.totalInvested,
            finance.invested
        );


    const totalEarnings =
        firstDefined(
            data.totalEarningsCredited,
            earnings.total,
            earnings.totalEarningsCredited,
            earnings.credited
        );


    const pendingDeposits =
        firstDefined(
            data.pendingDeposits,
            pending.deposits,
            pending.pendingDeposits
        );


    const pendingWithdrawals =
        firstDefined(
            data.pendingWithdrawals,
            pending.withdrawals,
            pending.pendingWithdrawals
        );


    setText(
        "#totalUsers",
        formatCount(totalUsers)
    );


    setText(
        "#activeUsers",
        formatCount(activeUsers)
    );


    setText(
        "#frozenUsers",
        formatCount(frozenUsers)
    );


    setText(
        "#totalDeposited",
        formatMoney(totalDeposited)
    );


    setText(
        "#totalWithdrawn",
        formatMoney(totalWithdrawn)
    );


    setText(
        "#totalInvested",
        formatMoney(totalInvested)
    );


    setText(
        "#totalEarningsCredited",
        formatMoney(totalEarnings)
    );


    setText(
        "#pendingDepositsCount",
        formatCount(pendingDeposits)
    );


    setText(
        "#pendingWithdrawalsCount",
        formatCount(pendingWithdrawals)
    );


    renderRecentActivity(
        data.recentActivity ||
        data.activity ||
        []
    );


    renderSystemStatus(system);

}


/* =========================================================
   SAFE VALUE HELPER
========================================================= */

function firstDefined(...values) {

    for (const value of values) {

        if (
            value !== undefined &&
            value !== null
        ) {
            return value;
        }

    }

    return null;
}


/* =========================================================
   TEXT HELPER
========================================================= */

function setText(selector, value) {

    const element = $(selector);

    if (!element) {
        return;
    }

    element.textContent = value;
}


/* =========================================================
   NUMBER FORMATTING
========================================================= */

function formatCount(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }


    const number = Number(value);


    if (!Number.isFinite(number)) {
        return String(value);
    }


    return new Intl.NumberFormat("en-US").format(number);

}


/* =========================================================
   MONEY FORMATTING
========================================================= */

function formatMoney(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "—";
    }


    const number = Number(value);


    if (!Number.isFinite(number)) {
        return String(value);
    }


    return `UGX ${new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 0
    }).format(number)}`;

}


/* =========================================================
   RECENT ACTIVITY
========================================================= */

function renderRecentActivity(activity) {

    const container = $("#recentActivityList");

    if (!container) {
        return;
    }


    if (!Array.isArray(activity) || activity.length === 0) {

        container.innerHTML = `
            <div class="activity-loading">
                <span>No recent activity available.</span>
            </div>
        `;

        return;
    }


    const items = activity.slice(0, 6);


    container.innerHTML = items.map((item) => {

        const type =
            String(
                item.type ||
                item.transactionType ||
                item.category ||
                "activity"
            ).toLowerCase();


        const title =
            escapeHTML(
                item.title ||
                item.description ||
                item.type ||
                "Platform activity"
            );


        const user =
            escapeHTML(
                item.userName ||
                item.username ||
                item.email ||
                "FINORA user"
            );


        const amount =
            item.amount !== undefined &&
            item.amount !== null
                ? formatMoney(item.amount)
                : "";


        const time =
            formatActivityTime(
                item.createdAt ||
                item.timestamp ||
                item.date
            );


        const icon =
            activityIcon(type);


        return `
            <div class="activity-item">

                <div class="activity-item-icon"
                     style="${activityIconStyle(type)}">

                    ${icon}

                </div>

                <div class="activity-item-content">

                    <strong>${title}</strong>

                    <span>
                        ${user}
                        ${time ? ` • ${time}` : ""}
                    </span>

                </div>

                ${
                    amount
                        ? `<span class="activity-item-amount">${escapeHTML(amount)}</span>`
                        : ""
                }

            </div>
        `;

    }).join("");

}


/* =========================================================
   ACTIVITY ICON
========================================================= */

function activityIcon(type) {

    if (
        type.includes("deposit") ||
        type.includes("credit")
    ) {

        return `
            <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 3v14"/>
                <path d="m7 8 5-5 5 5"/>
                <path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/>
            </svg>
        `;

    }


    if (
        type.includes("withdraw")
    ) {

        return `
            <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 21V7"/>
                <path d="m17 16-5 5-5-5"/>
                <path d="M5 11V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5"/>
            </svg>
        `;

    }


    if (
        type.includes("investment") ||
        type.includes("invest")
    ) {

        return `
            <svg viewBox="0 0 24 24" fill="none">
                <path d="M4 19V5"/>
                <path d="M4 19h16"/>
                <path d="m7 15 4-4 3 2 5-6"/>
                <path d="M15 7h4v4"/>
            </svg>
        `;

    }


    if (
        type.includes("referral")
    ) {

        return `
            <svg viewBox="0 0 24 24" fill="none">
                <circle cx="9" cy="8" r="3"/>
                <path d="M3 20a6 6 0 0 1 12 0"/>
                <path d="M17 5v6"/>
                <path d="M14 8h6"/>
            </svg>
        `;

    }


    return `
        <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8"/>
            <path d="M12 8v4l3 2"/>
        </svg>
    `;

}


/* =========================================================
   ACTIVITY ICON STYLE
========================================================= */

function activityIconStyle(type) {

    if (
        type.includes("withdraw")
    ) {

        return `
            color:#ffd76a;
            background:rgba(245,166,35,0.06);
            border:1px solid rgba(245,166,35,0.10);
        `;

    }


    if (
        type.includes("investment") ||
        type.includes("invest")
    ) {

        return `
            color:#ff72ff;
            background:rgba(234,60,255,0.06);
            border:1px solid rgba(234,60,255,0.10);
        `;

    }


    if (
        type.includes("credit") ||
        type.includes("earning")
    ) {

        return `
            color:#3ee98a;
            background:rgba(62,233,138,0.055);
            border:1px solid rgba(62,233,138,0.09);
        `;

    }


    return `
        color:#ff72ff;
        background:rgba(234,60,255,0.06);
        border:1px solid rgba(234,60,255,0.10);
    `;

}


/* =========================================================
   ACTIVITY TIME
========================================================= */

function formatActivityTime(value) {

    if (!value) {
        return "";
    }


    const date = new Date(value);


    if (Number.isNaN(date.getTime())) {
        return "";
    }


    return date.toLocaleString(
        "en-UG",
        {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}


/* =========================================================
   SYSTEM STATUS
========================================================= */

function renderSystemStatus(system) {

    if (!system || typeof system !== "object") {
        return;
    }


    updateSystemItem(
        "server",
        system.server
    );


    updateSystemItem(
        "database",
        system.database
    );


    updateSystemItem(
        "auth",
        system.authentication ||
        system.auth
    );


    updateSystemItem(
        "maintenance",
        system.maintenance
    );

}


/* =========================================================
   SYSTEM STATUS ITEM
========================================================= */

function updateSystemItem(type, value) {

    if (
        value === undefined ||
        value === null
    ) {
        return;
    }


    let status = value;


    if (
        typeof value === "object"
    ) {

        status =
            value.status ||
            value.state ||
            value.message ||
            "Unknown";

    }


    const normalized =
        String(status).toLowerCase();


    let label = "Unknown";
    let className = "checking";


    if (
        normalized.includes("online") ||
        normalized.includes("connected") ||
        normalized.includes("healthy") ||
        normalized === "ok" ||
        normalized === "active"
    ) {

        label = "Online";
        className = "online";

    } else if (
        normalized.includes("maintenance") ||
        normalized.includes("warning") ||
        normalized.includes("pending")
    ) {

        label = "Warning";
        className = "warning";

    } else if (
        normalized.includes("offline") ||
        normalized.includes("error") ||
        normalized.includes("failed")
    ) {

        label = "Offline";
        className = "offline";

    } else {

        label = String(status);

    }


    const textMap = {
        server: "#serverStatusText",
        database: "#databaseStatusText",
        auth: "#authStatusText",
        maintenance: "#maintenanceStatusText"
    };


    const pillMap = {
        server: "#serverStatusPill",
        database: "#databaseStatusPill",
        auth: "#authStatusPill",
        maintenance: "#maintenanceStatusPill"
    };


    const textElement =
        $(textMap[type]);


    const pillElement =
        $(pillMap[type]);


    if (textElement) {

        textElement.textContent =
            String(status);

    }


    if (pillElement) {

        pillElement.textContent =
            label;

        pillElement.className =
            `status-pill ${className}`;

    }

}


/* =========================================================
   DASHBOARD LOADING STATE
========================================================= */

function setDashboardLoadingState() {

    const fields = [
        "#totalUsers",
        "#activeUsers",
        "#frozenUsers",
        "#totalDeposited",
        "#totalWithdrawn",
        "#totalInvested",
        "#totalEarningsCredited",
        "#pendingDepositsCount",
        "#pendingWithdrawalsCount"
    ];


    fields.forEach((selector) => {

        const element = $(selector);

        if (!element) {
            return;
        }

        element.classList.add("data-loading");

    });

}


/* =========================================================
   OVERVIEW ERROR
========================================================= */

function showOverviewError() {

    const fields = [
        "#totalUsers",
        "#activeUsers",
        "#frozenUsers",
        "#totalDeposited",
        "#totalWithdrawn",
        "#totalInvested",
        "#totalEarningsCredited",
        "#pendingDepositsCount",
        "#pendingWithdrawalsCount"
    ];


    fields.forEach((selector) => {

        const element = $(selector);

        if (!element) {
            return;
        }

        element.classList.remove("data-loading");

        element.textContent = "—";

    });


    const activity =
        $("#recentActivityList");


    if (activity) {

        activity.innerHTML = `
            <div class="activity-loading">
                <span>
                    Live activity could not be loaded.
                </span>
            </div>
        `;

    }


    setText(
        "#lastUpdatedText",
        "Connection unavailable"
    );

}


/* =========================================================
   REFRESH STATE
========================================================= */

function setRefreshLoading(isLoading) {

    const button =
        $("#refreshDashboard");


    if (!button) {
        return;
    }


    if (isLoading) {

        button.classList.add("loading");

        button.setAttribute(
            "aria-busy",
            "true"
        );

        button.disabled = true;

    } else {

        button.classList.remove("loading");

        button.removeAttribute(
            "aria-busy"
        );

        button.disabled = false;

    }

}


/* =========================================================
   LAST UPDATED
========================================================= */

function updateLastUpdated() {

    const element =
        $("#lastUpdatedText");


    if (!element) {
        return;
    }


    const now =
        new Date();


    element.textContent =
        now.toLocaleTimeString(
            "en-UG",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

}


/* =========================================================
   LIVE HEADER STATUS
========================================================= */

function setLiveStatus(isLive) {

    const status =
        $("#headerLiveStatus");


    if (!status) {
        return;
    }


    const dot =
        status.querySelector(".live-dot");


    const text =
        status.querySelector("span:last-child");


    if (isLive) {

        status.style.color = "#b9f7d1";
        status.style.background = "rgba(62,233,138,0.055)";
        status.style.borderColor = "rgba(62,233,138,0.11)";

        if (dot) {
            dot.style.background = "#3ee98a";
        }

        if (text) {
            text.textContent = "Live";
        }

    } else {

        status.style.color = "#ffd486";
        status.style.background = "rgba(255,191,75,0.055)";
        status.style.borderColor = "rgba(255,191,75,0.11)";

        if (dot) {
            dot.style.background = "#ffbf4b";
        }

        if (text) {
            text.textContent = "Connection issue";
        }

    }

}


/* =========================================================
   NOTIFICATION COUNT
========================================================= */

async function loadNotificationCount() {

    try {

        const response =
            await fetch(
                NOTIFICATIONS_ENDPOINT,
                {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


        if (response.status === 401) {
            return;
        }


        if (!response.ok) {
            return;
        }


        const data =
            await response.json();


        const count =
            Number(
                data.unreadCount ??
                data.unread ??
                0
            );


        const badge =
            $("#headerNotificationBadge");


        if (!badge) {
            return;
        }


        if (count > 0) {

            badge.hidden = false;

            badge.textContent =
                count > 99
                    ? "99+"
                    : String(count);

        } else {

            badge.hidden = true;

        }


    } catch (error) {

        console.warn(
            "FINORA notification count unavailable:",
            error
        );

    }

}


/* =========================================================
   LOGOUT
========================================================= */

function initializeLogout() {

    const sidebarLogout =
        $("#sidebarLogout");


    if (!sidebarLogout) {
        return;
    }


    sidebarLogout.addEventListener(
        "click",
        handleLogout
    );

}


async function handleLogout() {

    const confirmed =
        window.confirm(
            "Are you sure you want to log out of the FINORA Admin Control Center?"
        );


    if (!confirmed) {
        return;
    }


    const button =
        $("#sidebarLogout");


    if (button) {
        button.disabled = true;
    }


    try {

        const response =
            await fetch(
                LOGOUT_ENDPOINT,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


        /*
           Even if the session has already expired,
           the administrator should still be returned
           to the login page.
        */

        if (
            response.ok ||
            response.status === 401 ||
            response.status === 403
        ) {

            window.location.href =
                "admin-login.html";

            return;
        }


        throw new Error(
            `Logout failed with status ${response.status}`
        );


    } catch (error) {

        console.error(
            "FINORA ADMIN LOGOUT ERROR:",
            error
        );


        /*
           Do not leave the administrator trapped
           inside the dashboard if the server is unavailable.
        */

        window.location.href =
            "admin-login.html";

    }

}


/* =========================================================
   NAVIGATION STATE
========================================================= */

function initializeNavigationState() {

    const currentPath =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    $$(".sidebar-link").forEach((link) => {

        const href =
            link.getAttribute("href") || "";


        const linkPath =
            href
                .split("?")[0]
                .split("#")[0]
                .toLowerCase();


        if (
            linkPath === currentPath
        ) {

            link.classList.add("active");

        } else {

            link.classList.remove("active");

        }

    });


    $$(".mobile-nav-link").forEach((link) => {

        const href =
            link.getAttribute("href") || "";


        const linkPath =
            href
                .split("?")[0]
                .split("#")[0]
                .toLowerCase();


        if (
            linkPath === currentPath
        ) {

            link.classList.add("active");

        } else {

            link.classList.remove("active");

        }

    });

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message, type = "success") {

    const container =
        $("#adminToastContainer");


    if (!container) {
        return;
    }


    const toast =
        document.createElement("div");


    toast.className =
        `admin-toast ${type}`;


    toast.textContent =
        message;


    container.appendChild(toast);


    window.setTimeout(() => {

        toast.style.opacity = "0";
        toast.style.transform =
            "translateY(8px)";

        window.setTimeout(() => {

            toast.remove();

        }, 220);

    }, 3500);

}


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* =========================================================
   WINDOW RESIZE
========================================================= */

window.addEventListener("resize", () => {

    if (window.innerWidth > 900) {
        closeMobileSidebar();
    }

});
