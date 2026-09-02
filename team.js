/* =========================================================
   FINORA TEAM
   team.js

   FRONTEND / SESSION VERSION

   CURRENT BACKEND CONNECTION:
   GET /api/users/me

   No fake team members.
   No fake referral income.
   No localStorage.
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* =================================================
           CONFIGURATION
        ================================================= */

        const FINORA_API =
            "https://finora-platform-production.up.railway.app";


        const FRONTEND_URL =
            "https://akanyijukadavis38-ux.github.io";


        let currentUser =
            null;


        let teamMembers =
            [];


        /* =================================================
           HELPERS
        ================================================= */

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

            return (
                "UGX " +
                safeNumber(value)
                    .toLocaleString("en-UG")
            );

        }


        /* =================================================
           TOAST
        ================================================= */

        let toastTimer =
            null;


        function showToast(message) {

            const toast =
                getElement("toast");


            if (!toast) {
                return;
            }


            toast.textContent =
                message;


            toast.classList.add(
                "show"
            );


            clearTimeout(
                toastTimer
            );


            toastTimer =
                setTimeout(
                    () => {

                        toast.classList.remove(
                            "show"
                        );

                    },
                    2300
                );

        }


        /* =================================================
           LOAD USER
        ================================================= */

        async function loadCurrentUser() {

            try {

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


                if (
                    response.status === 401
                ) {

                    showToast(
                        "Your FINORA session has expired."
                    );


                    return null;

                }


                if (!response.ok) {

                    showToast(
                        "Unable to load your FINORA account."
                    );


                    return null;

                }


                const data =
                    await response.json();


                if (
                    !data ||
                    data.success !== true ||
                    !data.user
                ) {

                    showToast(
                        "FINORA account information is unavailable."
                    );


                    return null;

                }


                currentUser =
                    data.user;


                updateReferralInformation(
                    currentUser
                );


                updateFinancialInformation(
                    currentUser
                );


                return currentUser;


            } catch (error) {

                console.error(
                    "FINORA TEAM USER ERROR:",
                    error
                );


                showToast(
                    "FINORA could not connect to the server."
                );


                return null;

            }

        }


        /* =================================================
           REFERRAL INFORMATION
        ================================================= */

        function updateReferralInformation(user) {

            const referralCode =
                user.referralCode ||
                user.referral_code ||
                "";


            const codeElement =
                getElement(
                    "referralCode"
                );


            const linkElement =
                getElement(
                    "referralLink"
                );


            if (!referralCode) {

                if (codeElement) {

                    codeElement.textContent =
                        "Not available";

                }


                if (linkElement) {

                    linkElement.textContent =
                        "Referral link unavailable";

                }


                return;

            }


            const referralLink =
                `${FRONTEND_URL}/?ref=${encodeURIComponent(
                    referralCode
                )}`;


            if (codeElement) {

                codeElement.textContent =
                    referralCode;

            }


            if (linkElement) {

                linkElement.textContent =
                    referralLink;

            }


            window.FINORA_REFERRAL_CODE =
                referralCode;


            window.FINORA_REFERRAL_LINK =
                referralLink;

        }


        /* =================================================
           FINANCIAL INFORMATION

           Only display values that actually exist
           on the authenticated user.

           We do not invent referral earnings.
        ================================================= */

        function updateFinancialInformation(user) {

            const referralIncome =
                safeNumber(
                    user.referralIncome ??
                    user.referral_income ??
                    user.referralBonus ??
                    user.referral_bonus
                );


            const totalReferralElement =
                getElement(
                    "totalReferralIncome"
                );


            if (totalReferralElement) {

                /*
                   If the backend has a referral-income
                   field, display it.

                   Otherwise show UGX 0 rather than
                   inventing a number.
                */

                totalReferralElement.textContent =
                    formatUGX(
                        referralIncome
                    );

            }


            const levelOneIncome =
                safeNumber(
                    user.levelOneIncome ??
                    user.level_one_income
                );


            const levelTwoIncome =
                safeNumber(
                    user.levelTwoIncome ??
                    user.level_two_income
                );


            const levelThreeIncome =
                safeNumber(
                    user.levelThreeIncome ??
                    user.level_three_income
                );


            const levelOneElement =
                getElement(
                    "levelOneIncome"
                );


            const levelTwoElement =
                getElement(
                    "levelTwoIncome"
                );


            const levelThreeElement =
                getElement(
                    "levelThreeIncome"
                );


            if (levelOneElement) {

                levelOneElement.textContent =
                    formatUGX(
                        levelOneIncome
                    );

            }


            if (levelTwoElement) {

                levelTwoElement.textContent =
                    formatUGX(
                        levelTwoIncome
                    );

            }


            if (levelThreeElement) {

                levelThreeElement.textContent =
                    formatUGX(
                        levelThreeIncome
                    );

            }

        }


        /* =================================================
           COPY
        ================================================= */

        async function copyText(
            text,
            successMessage
        ) {

            if (!text) {

                showToast(
                    "Nothing is available to copy yet."
                );


                return;

            }


            try {

                if (
                    navigator.clipboard &&
                    window.isSecureContext
                ) {

                    await navigator.clipboard.writeText(
                        text
                    );

                } else {

                    const textarea =
                        document.createElement(
                            "textarea"
                        );


                    textarea.value =
                        text;


                    textarea.style.position =
                        "fixed";

                    textarea.style.opacity =
                        "0";


                    document.body.appendChild(
                        textarea
                    );


                    textarea.select();


                    document.execCommand(
                        "copy"
                    );


                    textarea.remove();

                }


                showToast(
                    successMessage
                );


            } catch (error) {

                console.error(
                    "FINORA COPY ERROR:",
                    error
                );


                showToast(
                    "Could not copy. Please try again."
                );

            }

        }


        /* =================================================
           COPY CODE
        ================================================= */

        const copyCodeButton =
            getElement(
                "copyCodeButton"
            );


        if (copyCodeButton) {

            copyCodeButton.addEventListener(
                "click",
                () => {

                    const code =
                        currentUser &&
                        (
                            currentUser.referralCode ||
                            currentUser.referral_code
                        );


                    copyText(
                        code || "",
                        "Referral code copied."
                    );

                }
            );

        }


        /* =================================================
           COPY LINK BUTTONS
        ================================================= */

        const copyLinkButton =
            getElement(
                "copyLinkButton"
            );


        const copyReferralButton =
            getElement(
                "copyReferralButton"
            );


        function copyReferralLink() {

            copyText(
                window.FINORA_REFERRAL_LINK || "",
                "Referral link copied."
            );

        }


        if (copyLinkButton) {

            copyLinkButton.addEventListener(
                "click",
                copyReferralLink
            );

        }


        if (copyReferralButton) {

            copyReferralButton.addEventListener(
                "click",
                copyReferralLink
            );

        }


        /* =================================================
           SHARE
        ================================================= */

        const shareButton =
            getElement(
                "shareButton"
            );


        if (shareButton) {

            shareButton.addEventListener(
                "click",
                async () => {

                    const referralLink =
                        window.FINORA_REFERRAL_LINK;


                    if (!referralLink) {

                        showToast(
                            "Your referral link is not ready yet."
                        );


                        return;

                    }


                    const shareText =
                        "Join me on FINORA and get started with me.";


                    try {

                        if (
                            navigator.share
                        ) {

                            await navigator.share(
                                {
                                    title:
                                        "Join FINORA",

                                    text:
                                        shareText,

                                    url:
                                        referralLink
                                }
                            );


                            return;

                        }


                        await copyText(
                            referralLink,
                            "Sharing is not supported. Link copied instead."
                        );


                    } catch (error) {

                        /*
                           User cancelling the native share
                           dialog is not an error we need
                           to report.
                        */

                        if (
                            error &&
                            error.name ===
                            "AbortError"
                        ) {

                            return;

                        }


                        console.error(
                            "FINORA SHARE ERROR:",
                            error
                        );


                        showToast(
                            "Unable to open sharing."
                        );

                    }

                }
            );

        }


        /* =================================================
           TEAM DATA PLACEHOLDER

           The backend does not currently expose a team
           route in this dashboard connection.

           Therefore we do NOT create fake members.

           When the team API is created, this function
           will be connected to it.
        ================================================= */

        function initializeTeamData() {

            teamMembers =
                [];


            updateTeamSummary();


            renderTeamMembers();

        }


        /* =================================================
           TEAM SUMMARY
        ================================================= */

        function updateTeamSummary() {

            const total =
                teamMembers.length;


            const levelOne =
                teamMembers.filter(
                    member =>
                        Number(member.level) === 1
                ).length;


            const levelTwo =
                teamMembers.filter(
                    member =>
                        Number(member.level) === 2
                ).length;


            const levelThree =
                teamMembers.filter(
                    member =>
                        Number(member.level) === 3
                ).length;


            const totalElement =
                getElement(
                    "totalTeam"
                );


            const levelOneElement =
                getElement(
                    "levelOneCount"
                );


            const levelTwoElement =
                getElement(
                    "levelTwoCount"
                );


            const levelThreeElement =
                getElement(
                    "levelThreeCount"
                );


            const memberCountElement =
                getElement(
                    "memberCount"
                );


            if (totalElement) {

                totalElement.textContent =
                    total.toLocaleString(
                        "en-UG"
                    );

            }


            if (levelOneElement) {

                levelOneElement.textContent =
                    levelOne.toLocaleString(
                        "en-UG"
                    );

            }


            if (levelTwoElement) {

                levelTwoElement.textContent =
                    levelTwo.toLocaleString(
                        "en-UG"
                    );

            }


            if (levelThreeElement) {

                levelThreeElement.textContent =
                    levelThree.toLocaleString(
                        "en-UG"
                    );

            }


            if (memberCountElement) {

                memberCountElement.textContent =
                    total.toLocaleString(
                        "en-UG"
                    );

            }

        }


        /* =================================================
           RENDER TEAM MEMBERS
        ================================================= */

        function renderTeamMembers(
            selectedLevel = "all"
        ) {

            const container =
                getElement(
                    "membersContainer"
                );


            if (!container) {
                return;
            }


            const filteredMembers =
                selectedLevel === "all"
                    ? teamMembers
                    : teamMembers.filter(
                        member =>
                            String(member.level) ===
                            String(selectedLevel)
                    );


            if (!filteredMembers.length) {

                container.innerHTML = `

                    <div class="empty-members">

                        <div class="empty-icon">

                            <svg
                                viewBox="0 0 24 24"
                                aria-hidden="true">

                                <circle
                                    cx="9"
                                    cy="8"
                                    r="3.2"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.6">
                                </circle>

                                <path
                                    d="M3.5 20a5.5 5.5 0 0 1 11 0"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.6"
                                    stroke-linecap="round">
                                </path>

                                <path
                                    d="M16 11a3 3 0 1 0 0-6"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.6"
                                    stroke-linecap="round">
                                </path>

                                <path
                                    d="M16 15a5 5 0 0 1 4.5 5"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.6"
                                    stroke-linecap="round">
                                </path>

                            </svg>

                        </div>

                        <h4>
                            ${
                                selectedLevel === "all"
                                    ? "Your team is waiting"
                                    : `No Level ${selectedLevel} members yet`
                            }
                        </h4>

                        <p>
                            ${
                                selectedLevel === "all"
                                    ? "Share your referral link to start building your FINORA team."
                                    : "Members from this referral level will appear here when available."
                            }
                        </p>

                    </div>

                `;


                return;

            }


            container.innerHTML =
                filteredMembers
                    .map(
                        member =>
                            createMemberCard(
                                member
                            )
                    )
                    .join("");

        }


        /* =================================================
           MEMBER CARD
        ================================================= */

        function createMemberCard(
            member
        ) {

            const name =
                member.fullName ||
                member.full_name ||
                member.name ||
                "FINORA Member";


            const level =
                safeNumber(
                    member.level
                );


            const status =
                member.status ||
                "Active";


            return `

                <article class="member-card">

                    <div class="member-avatar">
                        ${escapeHTML(
                            name
                                .charAt(0)
                                .toUpperCase()
                        )}
                    </div>

                    <div class="member-info">

                        <strong>
                            ${escapeHTML(name)}
                        </strong>

                        <span>
                            Level ${level}
                        </span>

                    </div>

                    <span class="member-status">
                        ${escapeHTML(status)}
                    </span>

                </article>

            `;

        }


        /* =================================================
           HTML ESCAPE
        ================================================= */

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


        /* =================================================
           FILTER BUTTONS
        ================================================= */

        document
            .querySelectorAll(
                ".filter-button"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            document
                                .querySelectorAll(
                                    ".filter-button"
                                )
                                .forEach(
                                    item => {

                                        item.classList.remove(
                                            "active"
                                        );

                                    }
                                );


                            button.classList.add(
                                "active"
                            );


                            renderTeamMembers(
                                button.dataset.level ||
                                "all"
                            );

                        }
                    );

                }
            );


        /* =================================================
           NOTIFICATIONS
        ================================================= */

        const notificationButton =
            getElement(
                "notificationButton"
            );


        if (notificationButton) {

            notificationButton.addEventListener(
                "click",
                () => {

                    showToast(
                        "No new notifications."
                    );

                }
            );

        }


        /* =================================================
           BACK BUTTON
        ================================================= */

        const backButton =
            getElement(
                "backButton"
            );


        if (backButton) {

            backButton.addEventListener(
                "click",
                () => {

                    if (
                        window.history.length >
                        1
                    ) {

                        window.history.back();

                    } else {

                        window.location.href =
                            "dashboard.html";

                    }

                }
            );

        }


        /* =================================================
           BOTTOM NAVIGATION
        ================================================= */

        function initializeNavigation() {

            const navigation =
                document.querySelector(
                    ".bottom-navigation"
                );


            if (!navigation) {
                return;
            }


            const items =
                Array.from(
                    navigation.querySelectorAll(
                        ".bottom-nav-item"
                    )
                );


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


            const currentNav =
                pageMap[currentPath];


            items.forEach(
                item => {

                    const isActive =
                        item.dataset.nav ===
                        currentNav;


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
           INITIALIZE
        ================================================= */

        async function initializeTeam() {

            console.log(
                "================================="
            );


            console.log(
                "FINORA TEAM INITIALIZING"
            );


            console.log(
                "================================="
            );


            initializeNavigation();


            initializeTeamData();


            await loadCurrentUser();


            console.log(
                "FINORA TEAM READY"
            );

        }


        initializeTeam()
            .catch(
                error => {

                    console.error(
                        "FINORA TEAM INITIALIZATION ERROR:",
                        error
                    );


                    showToast(
                        "FINORA Team could not initialize."
                    );

                }
            );

    }
);
