/* =========================================================
   FINORA TEAM
   team.js

   ONLINE / BACKEND VERSION
   SESSION AUTHENTICATION
   NO LOCAL STORAGE
   NO FAKE TEAM DATA

   BACKEND:
   GET /api/users/me
   GET /api/users/team

   COMMISSION LEVELS:
   Level 1 = 15%
   Level 2 = 5%
   Level 3 = 2%

   LEVEL CARD ACTION:
   Tapping L1 / L2 / L3 selects that level,
   activates the matching filter,
   and scrolls to Team Members.
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const FINORA_API =
            "https://finora-platform-production.up.railway.app";

        const FRONTEND_URL =
            window.location.origin;


        /* =====================================================
           HELPERS
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
            return (
                "UGX " +
                safeNumber(value).toLocaleString("en-UG")
            );
        }


        let toastTimer = null;


        function showToast(message) {

            const toast =
                getElement("toast");

            if (!toast) return;

            toast.textContent =
                message;

            toast.classList.add("show");

            clearTimeout(toastTimer);

            toastTimer =
                setTimeout(
                    () => {
                        toast.classList.remove("show");
                    },
                    2500
                );
        }


        /* =====================================================
           STATE
        ===================================================== */

        let currentUser = null;

        let teamMembers = [];

        let currentFilter = "all";


        /* =====================================================
           LOAD CURRENT USER
        ===================================================== */

        async function loadCurrentUser() {

            try {

                console.log(
                    "FINORA TEAM: Loading authenticated user..."
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
                    "FINORA TEAM USER STATUS:",
                    response.status
                );


                if (response.status === 401) {

                    console.warn(
                        "FINORA TEAM: No authenticated session."
                    );

                    updateReferralInformation(null);

                    updateFinancialInformation(null);

                    return null;
                }


                if (response.status === 403) {

                    let frozenData =
                        null;

                    try {

                        frozenData =
                            await response.json();

                    } catch (error) {

                        frozenData =
                            null;
                    }


                    const message =
                        frozenData &&
                        frozenData.message
                            ? frozenData.message
                            : "Your FINORA account has been frozen.";


                    showToast(message);

                    return null;
                }


                if (!response.ok) {

                    console.error(
                        "FINORA TEAM: User request failed.",
                        response.status
                    );

                    showToast(
                        "Unable to load your FINORA account."
                    );

                    return null;
                }


                const data =
                    await response.json();


                console.log(
                    "FINORA TEAM USER RESPONSE:",
                    data
                );


                if (
                    !data ||
                    data.success !== true
                ) {

                    console.warn(
                        "FINORA TEAM: Invalid user response."
                    );

                    showToast(
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
                        "FINORA TEAM: No user object returned."
                    );

                    showToast(
                        "FINORA account information is unavailable."
                    );

                    return null;
                }


                currentUser =
                    user;


                updateReferralInformation(
                    currentUser
                );


                updateFinancialInformation(
                    currentUser
                );


                updateTeamSummary();


                return currentUser;

            } catch (error) {

                console.error(
                    "❌ FINORA TEAM USER REQUEST ERROR:",
                    error
                );

                showToast(
                    "FINORA could not connect to the server."
                );

                return null;
            }
        }


        /* =====================================================
           LOAD REAL TEAM MEMBERS
        ===================================================== */

        async function loadTeamMembers() {

            try {

                console.log(
                    "FINORA TEAM: Loading real team members..."
                );


                const response =
                    await fetch(
                        `${FINORA_API}/api/users/team`,
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
                    "FINORA TEAM MEMBERS STATUS:",
                    response.status
                );


                if (response.status === 401) {

                    console.warn(
                        "FINORA TEAM: Team request requires authentication."
                    );

                    teamMembers = [];

                    updateTeamSummary();

                    renderTeamMembers();

                    return false;
                }


                if (response.status === 403) {

                    let frozenData =
                        null;

                    try {

                        frozenData =
                            await response.json();

                    } catch (error) {

                        frozenData =
                            null;
                    }


                    const message =
                        frozenData &&
                        frozenData.message
                            ? frozenData.message
                            : "Your FINORA account has been frozen.";


                    showToast(message);

                    teamMembers = [];

                    updateTeamSummary();

                    renderTeamMembers();

                    return false;
                }


                if (!response.ok) {

                    console.error(
                        "FINORA TEAM: Team request failed.",
                        response.status
                    );

                    showToast(
                        "Unable to load your team members."
                    );

                    teamMembers = [];

                    updateTeamSummary();

                    renderTeamMembers();

                    return false;
                }


                const data =
                    await response.json();


                console.log(
                    "FINORA TEAM MEMBERS RESPONSE:",
                    data
                );


                if (
                    !data ||
                    data.success !== true
                ) {

                    console.warn(
                        "FINORA TEAM: Invalid team response."
                    );

                    teamMembers = [];

                    updateTeamSummary();

                    renderTeamMembers();

                    return false;
                }


                const backendMembers =
                    Array.isArray(data.members)
                        ? data.members
                        : (
                            Array.isArray(data.team)
                                ? data.team
                                : []
                        );


                teamMembers =
                    backendMembers.map(
                        member => ({

                            ...member,

                            name:
                                member.name ||
                                member.fullName ||
                                member.full_name ||
                                "FINORA Member",

                            fullName:
                                member.fullName ||
                                member.full_name ||
                                member.name ||
                                "FINORA Member",

                            level:
                                member.level,

                            status:
                                member.status ||
                                "active",

                            createdAt:
                                member.createdAt
                        })
                    );


                console.log(
                    "FINORA TEAM: REAL MEMBERS LOADED:",
                    teamMembers
                );


                updateTeamSummary();

                renderTeamMembers();


                return true;

            } catch (error) {

                console.error(
                    "❌ FINORA TEAM MEMBERS REQUEST ERROR:",
                    error
                );

                showToast(
                    "FINORA could not load your team."
                );

                teamMembers = [];

                updateTeamSummary();

                renderTeamMembers();

                return false;
            }
        }


        /* =====================================================
           REFERRAL INFORMATION
        ===================================================== */

        function updateReferralInformation(user) {

            const codeElement =
                getElement("referralCode");

            const linkElement =
                getElement("referralLink");


            if (!user) {

                if (codeElement)
                    codeElement.textContent =
                        "—";

                if (linkElement)
                    linkElement.textContent =
                        "—";

                return;
            }


            const referralCode =
                user.referralCode ||
                user.referral_code ||
                "";


            if (!referralCode) {

                if (codeElement)
                    codeElement.textContent =
                        "—";

                if (linkElement)
                    linkElement.textContent =
                        "Referral code unavailable";


                console.warn(
                    "FINORA TEAM: User has no referral code."
                );

                return;
            }


            const referralLink =
                `${FRONTEND_URL}/?ref=${encodeURIComponent(referralCode)}`;


            if (codeElement)
                codeElement.textContent =
                    referralCode;


            if (linkElement) {

                linkElement.textContent =
                    referralLink;

                linkElement.title =
                    referralLink;
            }


            window.FINORA_REFERRAL_CODE =
                referralCode;

            window.FINORA_REFERRAL_LINK =
                referralLink;


            console.log(
                "FINORA TEAM REFERRAL CODE:",
                referralCode
            );


            console.log(
                "FINORA TEAM REFERRAL LINK:",
                referralLink
            );
        }


        /* =====================================================
           FINANCIAL INFORMATION
        ===================================================== */

        function updateFinancialInformation(user) {

            const levelOneIncomeElement =
                getElement("levelOneIncome");

            const levelTwoIncomeElement =
                getElement("levelTwoIncome");

            const levelThreeIncomeElement =
                getElement("levelThreeIncome");

            const totalReferralIncomeElement =
                getElement("totalReferralIncome");


            if (!user) {

                if (levelOneIncomeElement)
                    levelOneIncomeElement.textContent =
                        formatUGX(0);

                if (levelTwoIncomeElement)
                    levelTwoIncomeElement.textContent =
                        formatUGX(0);

                if (levelThreeIncomeElement)
                    levelThreeIncomeElement.textContent =
                        formatUGX(0);

                if (totalReferralIncomeElement)
                    totalReferralIncomeElement.textContent =
                        formatUGX(0);

                return;
            }


            const levelOneIncome =
                safeNumber(
                    user.levelOneReferralIncome ??
                    user.level_one_referral_income ??
                    user.referralLevelOneIncome ??
                    user.referral_level_one_income
                );


            const levelTwoIncome =
                safeNumber(
                    user.levelTwoReferralIncome ??
                    user.level_two_referral_income ??
                    user.referralLevelTwoIncome ??
                    user.referral_level_two_income
                );


            const levelThreeIncome =
                safeNumber(
                    user.levelThreeReferralIncome ??
                    user.level_three_referral_income ??
                    user.referralLevelThreeIncome ??
                    user.referral_level_three_income
                );


            const totalReferralIncome =
                safeNumber(
                    user.referralIncome ??
                    user.referral_income ??
                    user.referralBonus ??
                    user.referral_bonus
                );


            if (levelOneIncomeElement)
                levelOneIncomeElement.textContent =
                    formatUGX(levelOneIncome);


            if (levelTwoIncomeElement)
                levelTwoIncomeElement.textContent =
                    formatUGX(levelTwoIncome);


            if (levelThreeIncomeElement)
                levelThreeIncomeElement.textContent =
                    formatUGX(levelThreeIncome);


            if (totalReferralIncomeElement)
                totalReferralIncomeElement.textContent =
                    formatUGX(totalReferralIncome);
        }


        /* =====================================================
           TEAM SUMMARY
        ===================================================== */

        function updateTeamSummary() {

            const totalTeamElement =
                getElement("totalTeam");

            const levelOneElement =
                getElement("levelOneCount");

            const levelTwoElement =
                getElement("levelTwoCount");

            const levelThreeElement =
                getElement("levelThreeCount");


            const levelOneCount =
                teamMembers.filter(
                    member =>
                        String(member.level) === "1"
                ).length;


            const levelTwoCount =
                teamMembers.filter(
                    member =>
                        String(member.level) === "2"
                ).length;


            const levelThreeCount =
                teamMembers.filter(
                    member =>
                        String(member.level) === "3"
                ).length;


            const total =
                teamMembers.length;


            if (totalTeamElement)
                totalTeamElement.textContent =
                    total.toLocaleString("en-UG");


            if (levelOneElement)
                levelOneElement.textContent =
                    levelOneCount.toLocaleString("en-UG");


            if (levelTwoElement)
                levelTwoElement.textContent =
                    levelTwoCount.toLocaleString("en-UG");


            if (levelThreeElement)
                levelThreeElement.textContent =
                    levelThreeCount.toLocaleString("en-UG");
        }


        /* =====================================================
           RENDER TEAM MEMBERS
        ===================================================== */

        function renderTeamMembers() {

            const container =
                getElement("membersContainer");

            const countElement =
                getElement("memberCount");


            if (!container)
                return;


            let filteredMembers =
                teamMembers;


            if (currentFilter !== "all") {

                filteredMembers =
                    teamMembers.filter(
                        member =>
                            String(member.level) ===
                            currentFilter
                    );
            }


            if (countElement) {

                countElement.textContent =
                    `${filteredMembers.length} ${
                        filteredMembers.length === 1
                            ? "member"
                            : "members"
                    }`;
            }


            if (!filteredMembers.length) {

                const levelMessage =
                    currentFilter === "all"
                        ? "No team members yet"
                        : `No Level ${currentFilter} members yet`;


                const levelDescription =
                    currentFilter === "all"
                        ? "Share your referral link to start building your team."
                        : `You do not have any Level ${currentFilter} referrals yet.`;


                container.innerHTML = `
                    <div class="empty-members">

                        <div class="empty-icon">

                            <svg
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true">

                                <circle
                                    cx="9"
                                    cy="8"
                                    r="3"
                                    stroke="currentColor"
                                    stroke-width="1.7"/>

                                <path
                                    d="M3 20C3 16.686 5.686 14 9 14C12.314 14 15 16.686 15 20"
                                    stroke="currentColor"
                                    stroke-width="1.7"
                                    stroke-linecap="round"/>

                                <path
                                    d="M17 14V20"
                                    stroke="currentColor"
                                    stroke-width="1.7"
                                    stroke-linecap="round"/>

                                <path
                                    d="M14 17H20"
                                    stroke="currentColor"
                                    stroke-width="1.7"
                                    stroke-linecap="round"/>

                            </svg>

                        </div>

                        <strong>
                            ${levelMessage}
                        </strong>

                        <p>
                            ${levelDescription}
                        </p>

                    </div>
                `;

                return;
            }


            container.innerHTML =
                filteredMembers
                    .map(
                        member =>
                            createMemberCard(member)
                    )
                    .join("");
        }


        /* =====================================================
           CREATE MEMBER CARD
        ===================================================== */

        function createMemberCard(member) {

            const name =
                escapeHTML(
                    member.name ||
                    member.fullName ||
                    member.full_name ||
                    "FINORA Member"
                );


            const level =
                escapeHTML(
                    String(
                        member.level ||
                        1
                    )
                );


            const status =
                escapeHTML(
                    member.status ||
                    "Active"
                );


            const initial =
                escapeHTML(
                    (
                        member.name ||
                        member.fullName ||
                        member.full_name ||
                        "F"
                    )
                        .trim()
                        .charAt(0)
                        .toUpperCase()
                );


            return `
                <article class="member-card">

                    <div class="member-avatar">
                        ${initial}
                    </div>

                    <div class="member-info">

                        <strong>
                            ${name}
                        </strong>

                        <span>
                            Level ${level}
                        </span>

                    </div>

                    <div class="member-status">
                        ${status}
                    </div>

                </article>
            `;
        }


        /* =====================================================
           ESCAPE HTML
        ===================================================== */

        function escapeHTML(value) {

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


        /* =====================================================
           COPY
        ===================================================== */

        async function copyText(text) {

            if (!text)
                return false;


            if (
                navigator.clipboard &&
                window.isSecureContext
            ) {

                try {

                    await navigator.clipboard.writeText(
                        text
                    );

                    return true;

                } catch (error) {

                    console.warn(
                        "FINORA: Clipboard API failed.",
                        error
                    );
                }
            }


            try {

                const textarea =
                    document.createElement(
                        "textarea"
                    );


                textarea.value =
                    text;

                textarea.style.position =
                    "fixed";

                textarea.style.left =
                    "-9999px";

                textarea.style.top =
                    "-9999px";


                document.body.appendChild(
                    textarea
                );


                textarea.focus();

                textarea.select();


                const successful =
                    document.execCommand(
                        "copy"
                    );


                textarea.remove();


                return successful;

            } catch (error) {

                console.error(
                    "FINORA: Copy failed.",
                    error
                );

                return false;
            }
        }


        /* =====================================================
           GET REFERRAL LINK
        ===================================================== */

        function getReferralLink() {

            if (
                window.FINORA_REFERRAL_LINK
            ) {

                return window.FINORA_REFERRAL_LINK;
            }


            if (currentUser) {

                const referralCode =
                    currentUser.referralCode ||
                    currentUser.referral_code ||
                    "";


                if (referralCode) {

                    return (
                        `${FRONTEND_URL}/?ref=` +
                        encodeURIComponent(
                            referralCode
                        )
                    );
                }
            }


            return "";
        }


        /* =====================================================
           COPY REFERRAL CODE
        ===================================================== */

        function initializeCopyCode() {

            const button =
                getElement(
                    "copyCodeButton"
                );


            if (!button)
                return;


            button.addEventListener(
                "click",
                async () => {

                    const code =
                        currentUser &&
                        (
                            currentUser.referralCode ||
                            currentUser.referral_code ||
                            ""
                        );


                    if (!code) {

                        showToast(
                            "Your referral code is not available yet."
                        );

                        return;
                    }


                    const copied =
                        await copyText(
                            String(code)
                        );


                    if (copied) {

                        showToast(
                            "Referral code copied."
                        );

                    } else {

                        showToast(
                            "Unable to copy referral code."
                        );
                    }
                }
            );
        }


        /* =====================================================
           COPY REFERRAL LINK
        ===================================================== */

        function initializeCopyLink() {

            const button =
                getElement(
                    "copyLinkButton"
                );


            if (!button)
                return;


            button.addEventListener(
                "click",
                async () => {

                    const link =
                        getReferralLink();


                    if (!link) {

                        showToast(
                            "Your referral link is not available yet."
                        );

                        return;
                    }


                    const copied =
                        await copyText(
                            link
                        );


                    if (copied) {

                        showToast(
                            "Referral link copied."
                        );

                    } else {

                        showToast(
                            "Unable to copy referral link."
                        );
                    }
                }
            );
        }


        /* =====================================================
           COPY REFERRAL BUTTON
        ===================================================== */

        function initializeReferralCopyButton() {

            const button =
                getElement(
                    "copyReferralButton"
                );


            if (!button)
                return;


            button.addEventListener(
                "click",
                async () => {

                    const link =
                        getReferralLink();


                    if (!link) {

                        showToast(
                            "Your referral link is not available yet."
                        );

                        return;
                    }


                    const copied =
                        await copyText(
                            link
                        );


                    if (copied) {

                        showToast(
                            "Referral link copied."
                        );

                    } else {

                        showToast(
                            "Unable to copy referral link."
                        );
                    }
                }
            );
        }


        /* =====================================================
           SHARE
        ===================================================== */

        function initializeShare() {

            const button =
                getElement(
                    "shareButton"
                );


            if (!button)
                return;


            button.addEventListener(
                "click",
                async () => {

                    const link =
                        getReferralLink();


                    if (!link) {

                        showToast(
                            "Your referral link is not available yet."
                        );

                        return;
                    }


                    const shareData = {

                        title:
                            "Join FINORA",

                        text:
                            "Join me on FINORA and grow together.",

                        url:
                            link
                    };


                    if (navigator.share) {

                        try {

                            await navigator.share(
                                shareData
                            );

                            return;

                        } catch (error) {

                            if (
                                error &&
                                error.name ===
                                "AbortError"
                            ) {

                                return;
                            }


                            console.warn(
                                "FINORA: Native share failed.",
                                error
                            );
                        }
                    }


                    const copied =
                        await copyText(
                            link
                        );


                    if (copied) {

                        showToast(
                            "Referral link copied. You can now share it."
                        );

                    } else {

                        showToast(
                            "Unable to share referral link."
                        );
                    }
                }
            );
        }


        /* =====================================================
           FILTERS
        ===================================================== */

        function initializeFilters() {

            const buttons =
                Array.from(
                    document.querySelectorAll(
                        ".filter-button"
                    )
                );


            if (!buttons.length)
                return;


            buttons.forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const level =
                                button.dataset.level ||
                                "all";


                            currentFilter =
                                level;


                            buttons.forEach(
                                item => {

                                    item.classList.toggle(
                                        "active",
                                        item === button
                                    );
                                }
                            );


                            renderTeamMembers();
                        }
                    );
                }
            );
        }


        /* =====================================================
           COMMISSION LEVEL CARDS
        ===================================================== */

        function initializeLevelCards() {

            const levelCards =
                Array.from(
                    document.querySelectorAll(
                        ".level-card"
                    )
                );


            if (!levelCards.length)
                return;


            levelCards.forEach(
                card => {

                    let level =
                        "";


                    if (
                        card.classList.contains(
                            "level-one"
                        )
                    ) {

                        level =
                            "1";

                    } else if (
                        card.classList.contains(
                            "level-two"
                        )
                    ) {

                        level =
                            "2";

                    } else if (
                        card.classList.contains(
                            "level-three"
                        )
                    ) {

                        level =
                            "3";
                    }


                    if (!level)
                        return;


                    card.setAttribute(
                        "role",
                        "button"
                    );


                    card.setAttribute(
                        "tabindex",
                        "0"
                    );


                    card.setAttribute(
                        "aria-label",
                        `View Level ${level} team members`
                    );


                    function openLevel() {

                        currentFilter =
                            level;


                        const filterButtons =
                            Array.from(
                                document.querySelectorAll(
                                    ".filter-button"
                                )
                            );


                        filterButtons.forEach(
                            button => {

                                button.classList.toggle(
                                    "active",
                                    button.dataset.level ===
                                    level
                                );
                            }
                        );


                        renderTeamMembers();


                        const membersSection =
                            document
                                .getElementById(
                                    "membersContainer"
                                );


                        if (membersSection) {

                            membersSection.scrollIntoView(
                                {
                                    behavior:
                                        "smooth",

                                    block:
                                        "start"
                                }
                            );
                        }
                    }


                    card.addEventListener(
                        "click",
                        openLevel
                    );


                    card.addEventListener(
                        "keydown",
                        event => {

                            if (
                                event.key ===
                                "Enter" ||
                                event.key ===
                                " "
                            ) {

                                event.preventDefault();

                                openLevel();
                            }
                        }
                    );
                }
            );
        }


        /* =====================================================
           NOTIFICATIONS
        ===================================================== */

        function initializeNotifications() {

            const button =
                getElement(
                    "notificationButton"
                );


            if (!button)
                return;


            button.addEventListener(
                "click",
                () => {

                    showToast(
                        "No new notifications."
                    );
                }
            );
        }


        /* =====================================================
           BACK BUTTON
        ===================================================== */

        function initializeBackButton() {

            const button =
                getElement(
                    "backButton"
                );


            if (!button)
                return;


            button.addEventListener(
                "click",
                () => {

                    window.location.href =
                        "dashboard.html";
                }
            );
        }


        /* =====================================================
           BOTTOM NAVIGATION
        ===================================================== */

        function initializeNavigation() {

            const navigation =
                document.querySelector(
                    ".bottom-navigation"
                );


            if (!navigation)
                return;


            const items =
                Array.from(
                    navigation.querySelectorAll(
                        ".bottom-nav-item"
                    )
                );


            if (!items.length)
                return;


            const currentPath =
                window.location.pathname
                    .split("/")
                    .pop()
                    .toLowerCase();


            const pageMap = {

                "dashboard.html":
                    "home",

                "":
                    "home",

                "team.html":
                    "team",

                "rates.html":
                    "rates",

                "mine.html":
                    "mine",

                "profile.html":
                    "profile"
            };


            function setActiveNavigation(
                navName
            ) {

                items.forEach(
                    item => {

                        const active =
                            Boolean(
                                navName &&
                                item.dataset.nav ===
                                navName
                            );


                        item.classList.toggle(
                            "active",
                            active
                        );


                        if (active) {

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


            items.forEach(
                item => {

                    item.addEventListener(
                        "click",
                        () => {

                            const navName =
                                item.dataset.nav;


                            if (!navName)
                                return;


                            setActiveNavigation(
                                navName
                            );
                        }
                    );
                }
            );
        }


        /* =====================================================
           INITIAL TEAM DATA
        ===================================================== */

        function initializeTeamData() {

            teamMembers = [];

            updateTeamSummary();

            renderTeamMembers();
        }


        /* =====================================================
           INITIALIZE TEAM
        ===================================================== */

        async function initializeTeam() {

            console.log(
                "================================="
            );

            console.log(
                "FINORA TEAM INITIALIZING"
            );

            console.log(
                "FINORA API:",
                FINORA_API
            );

            console.log(
                "================================="
            );


            initializeNavigation();

            initializeBackButton();

            initializeNotifications();

            initializeCopyCode();

            initializeCopyLink();

            initializeReferralCopyButton();

            initializeShare();

            initializeFilters();

            initializeLevelCards();

            initializeTeamData();


            const authenticatedUser =
                await loadCurrentUser();


            if (authenticatedUser) {

                await loadTeamMembers();
            }


            console.log(
                "================================="
            );

            console.log(
                "FINORA TEAM READY"
            );

            console.log(
                "================================="
            );
        }


        /* =====================================================
           START
        ===================================================== */

        initializeTeam()
            .catch(
                error => {

                    console.error(
                        "❌ FINORA TEAM INITIALIZATION ERROR:",
                        error
                    );


                    showToast(
                        "FINORA Team page could not initialize."
                    );
                }
            );
    }
);
