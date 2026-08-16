/* =========================================================
   FINORA — TEAM / REFERRAL SYSTEM
   Backend: Render
   Referral Rates:
   Level 1 = 15%
   Level 2 = 5%
   Level 3 = 2%
========================================================= */

"use strict";


/* =========================================================
   CONFIGURATION
========================================================= */

const API_BASE_URL =
    "https://cashnova-backend-89lg.onrender.com";


const LEVEL_1_RATE = 0.15;
const LEVEL_2_RATE = 0.05;
const LEVEL_3_RATE = 0.02;


const RATES = {
    level1: LEVEL_1_RATE,
    level2: LEVEL_2_RATE,
    level3: LEVEL_3_RATE
};


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   USER
========================================================= */

function getCurrentUserId() {

    const userId =
        localStorage.getItem("cashnovaUserId");

    if (!userId) {
        return null;
    }

    return userId;
}


/* =========================================================
   FORMAT UGX
========================================================= */

function formatUGX(amount) {

    const value = Number(amount) || 0;

    return (
        "UGX " +
        value.toLocaleString("en-UG", {
            maximumFractionDigits: 0
        })
    );
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   ERROR
========================================================= */

function showError(message) {

    const error = $("teamError");

    if (!error) {
        return;
    }

    error.textContent = message;

    error.style.display = "block";
}


function hideError() {

    const error = $("teamError");

    if (!error) {
        return;
    }

    error.textContent = "";

    error.style.display = "none";
}


/* =========================================================
   API REQUEST
========================================================= */

async function apiRequest(endpoint, options = {}) {

    const response = await fetch(
        API_BASE_URL + endpoint,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",

                ...(options.headers || {})
            }
        }
    );


    let data = null;

    try {
        data = await response.json();
    } catch (error) {
        data = null;
    }


    if (!response.ok) {

        throw new Error(
            data?.message ||
            data?.error ||
            "Unable to load team information."
        );
    }


    return data;
}


/* =========================================================
   REFERRAL CODE
========================================================= */

function getReferralCode(user) {

    return (
        user?.myReferralCode ||
        user?.referralCode ||
        user?.referral_code ||
        ""
    );
}


/* =========================================================
   REFERRAL LINK
========================================================= */

function buildReferralLink(code) {

    if (!code) {
        return "";
    }


    /*
       The registration page is expected to read
       ?ref=XXXXXXXX from the URL.
    */

    const baseURL =
        window.location.origin +
        window.location.pathname
            .split("/")
            .slice(0, -1)
            .join("/");


    return (
        baseURL +
        "/register.html?ref=" +
        encodeURIComponent(code)
    );
}


/* =========================================================
   COPY TEXT
========================================================= */

async function copyText(text, button, originalText) {

    if (!text) {
        return;
    }


    try {

        await navigator.clipboard.writeText(text);

        if (button) {

            button.textContent = "Copied";

            setTimeout(() => {
                button.textContent = originalText;
            }, 1500);
        }

    } catch (error) {

        /*
           Fallback for browsers where clipboard API
           is unavailable.
        */

        const textarea =
            document.createElement("textarea");

        textarea.value = text;

        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";

        document.body.appendChild(textarea);

        textarea.select();

        try {
            document.execCommand("copy");
        } catch (e) {}

        textarea.remove();


        if (button) {

            button.textContent = "Copied";

            setTimeout(() => {
                button.textContent = originalText;
            }, 1500);
        }
    }
}


/* =========================================================
   SET REFERRAL INFORMATION
========================================================= */

function renderReferral(user) {

    const code =
        getReferralCode(user);


    const codeElement =
        $("referralCode");


    const linkElement =
        $("referralLink");


    if (codeElement) {

        codeElement.textContent =
            code || "Not available";
    }


    const referralLink =
        buildReferralLink(code);


    if (linkElement) {

        linkElement.textContent =
            referralLink || "Referral link unavailable";
    }


    const copyCodeButton =
        $("copyReferralButton");


    if (copyCodeButton) {

        copyCodeButton.onclick = () => {

            copyText(
                code,
                copyCodeButton,
                "Copy"
            );
        };
    }


    const copyLinkButton =
        $("copyReferralLinkButton");


    if (copyLinkButton) {

        copyLinkButton.onclick = () => {

            copyText(
                referralLink,
                copyLinkButton,
                "Copy Link"
            );
        };
    }
}


/* =========================================================
   MEMBER NORMALIZATION
========================================================= */

function normalizeMember(member) {

    return {

        id:
            member?._id ||
            member?.id ||
            member?.userId ||
            "",


        phone:
            member?.phone ||
            member?.username ||
            member?.accountNumber ||
            "Member",


        deposit:
            Number(
                member?.totalDeposits ??
                member?.totalDeposit ??
                member?.deposit ??
                member?.amount ??
                0
            ),


        active:
            Boolean(
                member?.accountActivated ??
                member?.active ??
                member?.isActive ??
                false
            ),


        commission:
            Number(
                member?.commission ??
                member?.referralIncome ??
                member?.referralCommission ??
                0
            )
    };
}


/* =========================================================
   COMMISSION CALCULATION
========================================================= */

function calculateCommission(deposit, level) {

    const amount =
        Number(deposit) || 0;


    if (level === 1) {
        return amount * RATES.level1;
    }


    if (level === 2) {
        return amount * RATES.level2;
    }


    if (level === 3) {
        return amount * RATES.level3;
    }


    return 0;
}


/* =========================================================
   MEMBER ROW
========================================================= */

function createMemberRow(member, level) {

    const normalized =
        normalizeMember(member);


    /*
       If the backend already provides a commission,
       use it.

       Otherwise calculate it from the member deposit.
    */

    let commission =
        normalized.commission;


    if (!commission && normalized.deposit > 0) {

        commission =
            calculateCommission(
                normalized.deposit,
                level
            );
    }


    const row =
        document.createElement("div");


    row.className =
        "member-row";


    row.innerHTML = `

        <div class="member-phone">
            ${escapeHTML(normalized.phone)}
        </div>


        <div class="member-deposit">
            ${formatUGX(normalized.deposit)}
        </div>


        <div class="member-status ${
            normalized.active
                ? "active"
                : "inactive"
        }">
            ${
                normalized.active
                    ? "Active"
                    : "Inactive"
            }
        </div>


        <div class="member-commission">
            ${formatUGX(commission)}
        </div>

    `;


    return row;
}


/* =========================================================
   RENDER LEVEL
========================================================= */

function renderLevel(level, members) {

    const list =
        $(`level${level}List`);


    if (!list) {
        return;
    }


    list.innerHTML = "";


    if (!Array.isArray(members) ||
        members.length === 0) {

        return;
    }


    members.forEach(member => {

        list.appendChild(
            createMemberRow(
                member,
                level
            )
        );
    });
}


/* =========================================================
   LEVEL STATISTICS
========================================================= */

function calculateLevelStats(members, level) {

    const list =
        Array.isArray(members)
            ? members
            : [];


    let totalDeposit = 0;

    let totalCommission = 0;


    list.forEach(member => {

        const normalized =
            normalizeMember(member);


        totalDeposit +=
            normalized.deposit;


        let commission =
            normalized.commission;


        if (!commission &&
            normalized.deposit > 0) {

            commission =
                calculateCommission(
                    normalized.deposit,
                    level
                );
        }


        totalCommission +=
            commission;
    });


    return {

        members: list.length,

        deposit:
            totalDeposit,

        commission:
            totalCommission
    };
}


/* =========================================================
   UPDATE LEVEL STATISTICS
========================================================= */

function updateLevelStatistics(level, members) {

    const stats =
        calculateLevelStats(
            members,
            level
        );


    const membersElement =
        $(`level${level}Members`);


    const depositElement =
        $(`level${level}Deposit`);


    const commissionElement =
        $(`level${level}Commission`);


    if (membersElement) {

        membersElement.textContent =
            stats.members;
    }


    if (depositElement) {

        depositElement.textContent =
            formatUGX(stats.deposit);
    }


    if (commissionElement) {

        commissionElement.textContent =
            formatUGX(stats.commission);
    }


    return stats;
}


/* =========================================================
   UPDATE SUMMARY
========================================================= */

function updateSummary(level1, level2, level3) {

    const totalMembers =
        level1.length +
        level2.length +
        level3.length;


    const totalCommission =
        calculateLevelStats(level1, 1).commission +
        calculateLevelStats(level2, 2).commission +
        calculateLevelStats(level3, 3).commission;


    const membersElement =
        $("totalMembers");


    const incomeElement =
        $("totalReferralIncome");


    const memberLabel =
        $("memberCountLabel");


    if (membersElement) {

        membersElement.textContent =
            totalMembers;
    }


    if (incomeElement) {

        incomeElement.textContent =
            formatUGX(totalCommission);
    }


    if (memberLabel) {

        memberLabel.textContent =
            totalMembers +
            (
                totalMembers === 1
                    ? " member"
                    : " members"
            );
    }
}


/* =========================================================
   SHOW TEAM
========================================================= */

function showTeamContainer() {

    const loading =
        $("teamLoading");


    const empty =
        $("teamEmpty");


    const container =
        $("teamMembersContainer");


    if (loading) {
        loading.style.display = "none";
    }


    if (container) {
        container.style.display = "block";
    }


    if (empty) {
        empty.style.display = "none";
    }
}


/* =========================================================
   SHOW EMPTY TEAM
========================================================= */

function showEmptyTeam() {

    const loading =
        $("teamLoading");


    const empty =
        $("teamEmpty");


    const container =
        $("teamMembersContainer");


    if (loading) {
        loading.style.display = "none";
    }


    if (container) {
        container.style.display = "block";
    }


    if (empty) {
        empty.style.display = "block";
    }
}


/* =========================================================
   LOAD USER
========================================================= */

async function loadCurrentUser(userId) {

    return await apiRequest(
        `/api/users/${encodeURIComponent(userId)}`
    );
}


/* =========================================================
   LOAD TEAM
========================================================= */

async function loadTeam(userId) {

    /*
       The Render backend should return the user's
       three referral levels from this endpoint.
    */

    return await apiRequest(
        `/api/users/${encodeURIComponent(userId)}/team`
    );
}


/* =========================================================
   EXTRACT TEAM DATA
========================================================= */

function extractTeamData(data) {

    /*
       Supports either:

       {
          level1: [],
          level2: [],
          level3: []
       }

       or:

       {
          team: {
             level1: [],
             level2: [],
             level3: []
          }
       }
    */

    const source =
        data?.team || data || {};


    return {

        level1:
            Array.isArray(source.level1)
                ? source.level1
                : [],


        level2:
            Array.isArray(source.level2)
                ? source.level2
                : [],


        level3:
            Array.isArray(source.level3)
                ? source.level3
                : []
    };
}


/* =========================================================
   MAIN LOAD FUNCTION
========================================================= */

async function loadTeamPage() {

    hideError();


    const userId =
        getCurrentUserId();


    if (!userId) {

        showError(
            "Your account session could not be found. Please log in again."
        );


        const loading =
            $("teamLoading");


        if (loading) {
            loading.style.display = "none";
        }


        return;
    }


    try {

        /*
           Load logged-in user.
        */

        const user =
            await loadCurrentUser(userId);


        renderReferral(user);


        /*
           Load actual team.
        */

        const teamResponse =
            await loadTeam(userId);


        const team =
            extractTeamData(
                teamResponse
            );


        /*
           Render members.
        */

        renderLevel(
            1,
            team.level1
        );


        renderLevel(
            2,
            team.level2
        );


        renderLevel(
            3,
            team.level3
        );


        /*
           Update statistics.
        */

        updateLevelStatistics(
            1,
            team.level1
        );


        updateLevelStatistics(
            2,
            team.level2
        );


        updateLevelStatistics(
            3,
            team.level3
        );


        updateSummary(
            team.level1,
            team.level2,
            team.level3
        );


        const totalMembers =
            team.level1.length +
            team.level2.length +
            team.level3.length;


        if (totalMembers === 0) {

            showEmptyTeam();

        } else {

            showTeamContainer();
        }

    } catch (error) {

        console.error(
            "FINORA Team Error:",
            error
        );


        showError(
            error.message ||
            "Unable to load your team."
        );


        const loading =
            $("teamLoading");


        if (loading) {
            loading.style.display = "none";
        }
    }
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadTeamPage();

    }
);
