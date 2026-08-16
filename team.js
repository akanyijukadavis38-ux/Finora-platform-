/* =========================================================
   FINORA TEAM
   SERVER-SESSION VERSION
   NO LOCALSTORAGE
   ========================================================= */

const API_BASE =
    "https://cashnova-backend-89lg.onrender.com/api";


/* =========================================================
   ELEMENTS
   ========================================================= */

const referralCode =
    document.getElementById("referralCode");

const referralLink =
    document.getElementById("referralLink");

const copyReferralButton =
    document.getElementById("copyReferralButton");

const copyReferralLinkButton =
    document.getElementById("copyReferralLinkButton");

const teamCount =
    document.getElementById("teamCount");

const teamCountLabel =
    document.getElementById("teamCountLabel");

const referralIncome =
    document.getElementById("referralIncome");

const teamLoading =
    document.getElementById("teamLoading");

const teamList =
    document.getElementById("teamList");

const teamEmpty =
    document.getElementById("teamEmpty");

const teamError =
    document.getElementById("teamError");


/* =========================================================
   FORMAT MONEY
   ========================================================= */

function formatMoney(value) {

    const amount =
        Number(value) || 0;

    return (
        "UGX " +
        amount.toLocaleString("en-UG")
    );
}


/* =========================================================
   ERROR
   ========================================================= */

function showError(message) {

    teamError.textContent =
        message;

    teamError.style.display =
        "block";
}


/* =========================================================
   COPY
   ========================================================= */

async function copyValue(
    value,
    button,
    originalText
) {

    if (!value) {
        return;
    }

    try {

        await navigator.clipboard.writeText(value);

    } catch (error) {

        const textarea =
            document.createElement("textarea");

        textarea.value =
            value;

        document.body.appendChild(
            textarea
        );

        textarea.select();

        document.execCommand("copy");

        textarea.remove();
    }


    button.textContent =
        "Copied";


    setTimeout(() => {

        button.textContent =
            originalText;

    }, 1500);
}


/* =========================================================
   COPY REFERRAL CODE
   ========================================================= */

copyReferralButton.addEventListener(
    "click",
    () => {

        const value =
            referralCode.textContent.trim();

        if (
            !value ||
            value === "Loading..." ||
            value === "Unavailable"
        ) {
            return;
        }

        copyValue(
            value,
            copyReferralButton,
            "Copy"
        );
    }
);


/* =========================================================
   COPY REFERRAL LINK
   ========================================================= */

copyReferralLinkButton.addEventListener(
    "click",
    () => {

        const value =
            referralLink.textContent.trim();

        if (
            !value ||
            value === "Loading..." ||
            value === "Unavailable"
        ) {
            return;
        }

        copyValue(
            value,
            copyReferralLinkButton,
            "Copy Link"
        );
    }
);


/* =========================================================
   LOAD CURRENT USER
   ========================================================= */

async function loadCurrentUser() {

    const response =
        await fetch(
            `${API_BASE}/users/me`,
            {
                method: "GET",

                credentials: "include",

                headers: {
                    "Accept":
                        "application/json"
                }
            }
        );


    if (response.status === 401) {

        throw new Error(
            "Your FINORA session has expired. Please log in again."
        );
    }


    if (!response.ok) {

        throw new Error(
            "Unable to load your FINORA account."
        );
    }


    return await response.json();
}


/* =========================================================
   LOAD TEAM
   ========================================================= */

async function loadTeam(
    user
) {

    const code =
        user.myReferralCode ||
        user.referralCode;


    if (!code) {

        referralCode.textContent =
            "Unavailable";

        referralLink.textContent =
            "Unavailable";

        renderTeam([]);

        return;
    }


    referralCode.textContent =
        code;


    /*
     * Referral link points to the real
     * FINORA registration page.
     */

    const registrationUrl =
        new URL(
            "register.html",
            window.location.href
        );


    registrationUrl.searchParams.set(
        "ref",
        code
    );


    referralLink.textContent =
        registrationUrl.href;


    referralIncome.textContent =
        formatMoney(
            user.referralIncome
        );


    const response =
        await fetch(
            `${API_BASE}/users/referrals/${encodeURIComponent(code)}`,
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

        if (response.status === 404) {

            renderTeam([]);

            return;
        }


        throw new Error(
            "Unable to load your team members."
        );
    }


    const data =
        await response.json();


    const members =
        Array.isArray(data)
            ? data
            : (
                Array.isArray(data.users)
                    ? data.users
                    : (
                        Array.isArray(data.referrals)
                            ? data.referrals
                            : []
                    )
            );


    renderTeam(members);
}


/* =========================================================
   RENDER TEAM
   ========================================================= */

function renderTeam(
    members
) {

    teamLoading.style.display =
        "none";


    const count =
        members.length;


    teamCount.textContent =
        count;


    teamCountLabel.textContent =
        count === 1
            ? "1 member"
            : `${count} members`;


    teamList.innerHTML =
        "";


    if (count === 0) {

        teamList.style.display =
            "none";

        teamEmpty.style.display =
            "block";

        return;
    }


    teamEmpty.style.display =
        "none";

    teamList.style.display =
        "flex";


    members.forEach(
        member => {

            const name =
                member.fullName ||
                member.username ||
                "FINORA Member";


            const firstLetter =
                name
                    .trim()
                    .charAt(0)
                    .toUpperCase();


            const active =
                member.accountActivated === true;


            const status =
                active
                    ? "Active"
                    : "Not activated";


            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "team-member";


            item.innerHTML = `

                <div class="member-avatar">
                    ${escapeHtml(firstLetter || "F")}
                </div>

                <div class="member-info">

                    <div class="member-name">
                        ${escapeHtml(name)}
                    </div>

                    <div class="member-details">
                        ${status}
                    </div>

                </div>

            `;


            teamList.appendChild(
                item
            );
        }
    );
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   START
   ========================================================= */

async function startTeamPage() {

    try {

        const user =
            await loadCurrentUser();


        await loadTeam(
            user
        );


    } catch (error) {

        console.error(
            "FINORA Team Error:",
            error
        );


        teamLoading.style.display =
            "none";


        showError(
            error.message
        );
    }
}


document.addEventListener(
    "DOMContentLoaded",
    startTeamPage
);
