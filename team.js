/* =========================================================
   FINORA — TEAM / REFERRAL SYSTEM
   Backend: Render
   No MongoDB references
   No localStorage
   No CashNova references

   Referral rates:
   Level 1 = 15%
   Level 2 = 5%
   Level 3 = 2%
========================================================= */

"use strict";


/* =========================================================
   FINORA REFERRAL RATES
========================================================= */

const REFERRAL_RATES = {
    level1: 0.15,
    level2: 0.05,
    level3: 0.02
};


/* =========================================================
   API CONFIGURATION
========================================================= */

const API_BASE = "";


/* =========================================================
   API HELPER
========================================================= */

async function apiRequest(endpoint, options = {}) {

    const response = await fetch(
        API_BASE + endpoint,
        {
            method: options.method || "GET",

            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {})
            },

            credentials: "include",

            body: options.body
                ? JSON.stringify(options.body)
                : undefined
        }
    );


    let data = null;

    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }


    if (!response.ok) {

        const message =
            data?.message ||
            data?.error ||
            `Request failed (${response.status})`;

        throw new Error(message);
    }


    return data;
}


/* =========================================================
   ELEMENTS
========================================================= */

const referralCodeElement =
    document.getElementById("referralCode");

const referralLinkElement =
    document.getElementById("referralLink");

const copyReferralButton =
    document.getElementById("copyReferralButton");

const copyReferralLinkButton =
    document.getElementById("copyReferralLinkButton");

const totalMembersElement =
    document.getElementById("totalMembers");

const totalReferralIncomeElement =
    document.getElementById("totalReferralIncome");

const memberCountLabel =
    document.getElementById("memberCountLabel");

const teamLoading =
    document.getElementById("teamLoading");

const teamEmpty =
    document.getElementById("teamEmpty");

const teamMembersContainer =
    document.getElementById("teamMembersContainer");

const teamError =
    document.getElementById("teamError");


/* =========================================================
   FORMATTING
========================================================= */

function formatMoney(value) {

    const amount = Number(value) || 0;

    return "UGX " +
        amount.toLocaleString("en-UG", {
            maximumFractionDigits: 0
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


/* =========================================================
   ERROR HANDLING
========================================================= */

function showError(message) {

    if (!teamError) return;

    teamError.textContent = message;
    teamError.style.display = "block";
}


function hideError() {

    if (!teamError) return;

    teamError.textContent = "";
    teamError.style.display = "none";
}


/* =========================================================
   LOADING STATE
========================================================= */

function showLoading() {

    if (teamLoading) {
        teamLoading.style.display = "block";
    }

    if (teamEmpty) {
        teamEmpty.style.display = "none";
    }

    if (teamMembersContainer) {
        teamMembersContainer.style.display = "none";
    }
}


function showEmpty() {

    if (teamLoading) {
        teamLoading.style.display = "none";
    }

    if (teamEmpty) {
        teamEmpty.style.display = "block";
    }

    if (teamMembersContainer) {
        teamMembersContainer.style.display = "none";
    }
}


function showMembers() {

    if (teamLoading) {
        teamLoading.style.display = "none";
    }

    if (teamEmpty) {
        teamEmpty.style.display = "none";
    }

    if (teamMembersContainer) {
        teamMembersContainer.style.display = "block";
    }
}


/* =========================================================
   NORMALIZE TEAM DATA
========================================================= */

function normalizeTeamResponse(data) {

    /*
       Allows the backend response to be either:

       {
           user: {...},
           team: {...}
       }

       or

       {
           data: {
               user: {...},
               team: {...}
           }
       }

       or directly:

       {
           referralCode: "...",
           levels: [...]
       }
    */

    if (data?.data) {
        return data.data;
    }

    return data || {};
}


/* =========================================================
   GET LEVEL DATA
========================================================= */

function getLevelData(teamData, levelNumber) {

    const levels = teamData?.levels;

    if (Array.isArray(levels)) {

        return (
            levels.find(
                level =>
                    Number(
                        level.level ??
                        level.levelNumber
                    ) === levelNumber
            ) || {}
        );
    }


    return (
        teamData?.[`level${levelNumber}`] ||
        {}
    );
}


/* =========================================================
   GET MEMBERS
========================================================= */

function getMembers(levelData) {

    if (Array.isArray(levelData)) {
        return levelData;
    }

    if (Array.isArray(levelData?.members)) {
        return levelData.members;
    }

    return [];
}


/* =========================================================
   GET MEMBER DEPOSIT
========================================================= */

function getMemberDeposit(member) {

    return Number(
        member?.deposit ??
        member?.totalDeposit ??
        member?.totalDeposits ??
        member?.amountDeposited ??
        member?.balance ??
        0
    );
}


/* =========================================================
   GET MEMBER STATUS
========================================================= */

function getMemberStatus(member) {

    const active =
        member?.active ??
        member?.accountActivated ??
        member?.isActive ??
        member?.status === "active";


    return active ? "Active" : "Inactive";
}


/* =========================================================
   GET MEMBER DISPLAY NAME
========================================================= */

function getMemberName(member) {

    return (
        member?.phone ||
        member?.phoneNumber ||
        member?.username ||
        member?.fullName ||
        member?.name ||
        "Member"
    );
}


/* =========================================================
   CALCULATE COMMISSION
========================================================= */

function calculateCommission(
    deposit,
    rate
) {

    return Number(deposit || 0) *
        Number(rate || 0);
}


/* =========================================================
   RENDER MEMBER
========================================================= */

function renderMember(
    member,
    levelNumber
) {

    const deposit =
        getMemberDeposit(member);


    const rate =
        REFERRAL_RATES[`level${levelNumber}`];


    /*
       If the backend already provides the actual
       commission, use it.

       Otherwise calculate it from the member deposit.
    */

    const commission =
        member?.commission !== undefined
            ? Number(member.commission) || 0
            : calculateCommission(
                deposit,
                rate
            );


    const status =
        getMemberStatus(member);


    const statusClass =
        status === "Active"
            ? "active"
            : "inactive";


    const name =
        escapeHTML(
            getMemberName(member)
        );


    return `
        <div class="member-row">

            <div class="member-phone">
                ${name}
            </div>

            <div class="member-deposit">
                ${formatMoney(deposit)}
            </div>

            <div class="member-status ${statusClass}">
                ${status}
            </div>

            <div class="member-commission">
                ${formatMoney(commission)}
            </div>

        </div>
    `;
}


/* =========================================================
   RENDER LEVEL
========================================================= */

function renderLevel(
    levelNumber,
    members
) {

    const list =
        document.getElementById(
            `level${levelNumber}List`
        );


    if (!list) return;


    if (!members.length) {

        list.innerHTML = `
            <div
                style="
                    padding:12px;
                    text-align:center;
                    color:rgba(255,255,255,0.35);
                    font-size:10px;
                "
            >
                No members in this level.
            </div>
        `;

        return;
    }


    list.innerHTML =
        members
            .map(
                member =>
                    renderMember(
                        member,
                        levelNumber
                    )
            )
            .join("");
}


/* =========================================================
   RENDER STATISTICS
========================================================= */

function renderLevelStatistics(
    levelNumber,
    levelData,
    members
) {

    const memberCount =
        members.length;


    const depositFromMembers =
        members.reduce(
            (total, member) =>
                total +
                getMemberDeposit(member),
            0
        );


    const backendDeposit =
        Number(
            levelData?.deposit ??
            levelData?.totalDeposit ??
            levelData?.deposits ??
            0
        );


    const deposit =
        backendDeposit ||
        depositFromMembers;


    const backendCommission =
        Number(
            levelData?.commission ??
            levelData?.totalCommission ??
            levelData?.income ??
            0
        );


    const commission =
        backendCommission ||
        calculateCommission(
            deposit,
            REFERRAL_RATES[
                `level${levelNumber}`
            ]
        );


    const membersElement =
        document.getElementById(
            `level${levelNumber}Members`
        );

    const depositElement =
        document.getElementById(
            `level${levelNumber}Deposit`
        );

    const commissionElement =
        document.getElementById(
            `level${levelNumber}Commission`
        );


    if (membersElement) {
        membersElement.textContent =
            memberCount;
    }


    if (depositElement) {
        depositElement.textContent =
            formatMoney(deposit);
    }


    if (commissionElement) {
        commissionElement.textContent =
            formatMoney(commission);
    }
}


/* =========================================================
   RENDER COMPLETE TEAM
========================================================= */

function renderTeam(data) {

    const teamData =
        normalizeTeamResponse(data);


    /* -----------------------------------------
       REFERRAL CODE
    ----------------------------------------- */

    const referralCode =
        teamData?.referralCode ||
        teamData?.myReferralCode ||
        teamData?.user?.referralCode ||
        teamData?.user?.myReferralCode ||
        "";


    if (referralCodeElement) {

        referralCodeElement.textContent =
            referralCode || "Unavailable";
    }


    /* -----------------------------------------
       REFERRAL LINK
    ----------------------------------------- */

    let referralLink =
        teamData?.referralLink ||
        teamData?.user?.referralLink ||
        "";


    if (!referralLink && referralCode) {

        /*
           ONLY CHANGE:
           The referral link now points to the
           FINORA first/root page.

           It does NOT expose:
           index.html
           register.html
           or any other HTML filename.
        */

        referralLink =
            `${window.location.origin}/?ref=${encodeURIComponent(referralCode)}`;
    }


    if (referralLinkElement) {

        referralLinkElement.textContent =
            referralLink || "Unavailable";
    }


    /* -----------------------------------------
       LEVELS
    ----------------------------------------- */

    const level1 =
        getLevelData(teamData, 1);

    const level2 =
        getLevelData(teamData, 2);

    const level3 =
        getLevelData(teamData, 3);


    const level1Members =
        getMembers(level1);

    const level2Members =
        getMembers(level2);

    const level3Members =
        getMembers(level3);


    renderLevelStatistics(
        1,
        level1,
        level1Members
    );

    renderLevelStatistics(
        2,
        level2,
        level2Members
    );

    renderLevelStatistics(
        3,
        level3,
        level3Members
    );


    renderLevel(
        1,
        level1Members
    );

    renderLevel(
        2,
        level2Members
    );

    renderLevel(
        3,
        level3Members
    );


    /* -----------------------------------------
       TOTAL MEMBERS
    ----------------------------------------- */

    const totalMembers =
        Number(
            teamData?.totalMembers ??
            teamData?.memberCount ??
            (
                level1Members.length +
                level2Members.length +
                level3Members.length
            )
        );


    if (totalMembersElement) {

        totalMembersElement.textContent =
            totalMembers;
    }


    if (memberCountLabel) {

        memberCountLabel.textContent =
            `${totalMembers} ${
                totalMembers === 1
                    ? "member"
                    : "members"
            }`;
    }


    /* -----------------------------------------
       TOTAL REFERRAL INCOME
    ----------------------------------------- */

    let totalIncome =
        Number(
            teamData?.totalReferralIncome ??
            teamData?.referralIncome ??
            teamData?.totalCommission ??
            teamData?.user?.referralIncome ??
            0
        );


    if (!totalIncome) {

        totalIncome =
            calculateCommission(
                Number(
                    level1?.deposit ??
                    level1?.totalDeposit ??
                    0
                ),
                REFERRAL_RATES.level1
            ) +

            calculateCommission(
                Number(
                    level2?.deposit ??
                    level2?.totalDeposit ??
                    0
                ),
                REFERRAL_RATES.level2
            ) +

            calculateCommission(
                Number(
                    level3?.deposit ??
                    level3?.totalDeposit ??
                    0
                ),
                REFERRAL_RATES.level3
            );
    }


    if (totalReferralIncomeElement) {

        totalReferralIncomeElement.textContent =
            formatMoney(totalIncome);
    }


    /* -----------------------------------------
       DISPLAY
    ----------------------------------------- */

    const hasMembers =
        totalMembers > 0;


    if (hasMembers) {
        showMembers();
    } else {
        showEmpty();
    }
}


/* =========================================================
   LOAD TEAM FROM FINORA RENDER BACKEND
========================================================= */

async function loadTeam() {

    showLoading();
    hideError();


    try {

        /*
           Server-side session authentication.

           No localStorage.
           No MongoDB code.
           No CashNova code.
        */

        const data =
            await apiRequest(
                "/api/team"
            );


        renderTeam(data);


    } catch (error) {

        console.error(
            "FINORA Team Error:",
            error
        );


        showLoading();


        showError(
            error.message ||
            "Unable to load your team. Please log in again."
        );
    }
}


/* =========================================================
   COPY REFERRAL CODE
========================================================= */

if (copyReferralButton) {

    copyReferralButton.addEventListener(
        "click",
        async function () {

            const code =
                referralCodeElement?.textContent?.trim();


            if (
                !code ||
                code === "Loading..." ||
                code === "Unavailable"
            ) {
                return;
            }


            try {

                await navigator.clipboard.writeText(
                    code
                );


                const original =
                    copyReferralButton.textContent;


                copyReferralButton.textContent =
                    "Copied";


                setTimeout(() => {

                    copyReferralButton.textContent =
                        original;

                }, 1500);


            } catch (error) {

                console.error(
                    "Copy failed:",
                    error
                );
            }
        }
    );
}


/* =========================================================
   COPY REFERRAL LINK
========================================================= */

if (copyReferralLinkButton) {

    copyReferralLinkButton.addEventListener(
        "click",
        async function () {

            const link =
                referralLinkElement?.textContent?.trim();


            if (
                !link ||
                link === "Loading referral link..." ||
                link === "Unavailable"
            ) {
                return;
            }


            try {

                await navigator.clipboard.writeText(
                    link
                );


                const original =
                    copyReferralLinkButton.textContent;


                copyReferralLinkButton.textContent =
                    "Copied";


                setTimeout(() => {

                    copyReferralLinkButton.textContent =
                        original;

                }, 1500);


            } catch (error) {

                console.error(
                    "Copy link failed:",
                    error
                );
            }
        }
    );
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadTeam();

    }
);
