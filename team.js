/* =========================================================
   FINORA TEAM PAGE
   ========================================================= */

const API_BASE =
    "https://cashnova-backend-89lg.onrender.com/api";


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

const teamCountElement =
    document.getElementById("teamCount");

const teamCountLabel =
    document.getElementById("teamCountLabel");

const referralIncomeElement =
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
   USER ID
   ========================================================= */

const userId =
    localStorage.getItem("cashnovaUserId");


/* =========================================================
   HELPERS
   ========================================================= */

function formatMoney(amount) {

    const number =
        Number(amount) || 0;

    return (
        "UGX " +
        number.toLocaleString("en-UG")
    );
}


function showError(message) {

    if (!teamError) return;

    teamError.textContent = message;

    teamError.style.display = "block";
}


function hideError() {

    if (!teamError) return;

    teamError.style.display = "none";
}


/* =========================================================
   COPY FUNCTION
   ========================================================= */

async function copyText(text, button, defaultText) {

    if (!text) return;

    try {

        await navigator.clipboard.writeText(text);

        button.textContent = "Copied";

        setTimeout(() => {

            button.textContent = defaultText;

        }, 1500);

    } catch (error) {

        const textarea =
            document.createElement("textarea");

        textarea.value = text;

        document.body.appendChild(textarea);

        textarea.select();

        document.execCommand("copy");

        textarea.remove();

        button.textContent = "Copied";

        setTimeout(() => {

            button.textContent = defaultText;

        }, 1500);
    }
}


/* =========================================================
   COPY REFERRAL CODE
   ========================================================= */

copyReferralButton.addEventListener(
    "click",
    () => {

        const code =
            referralCodeElement.textContent.trim();

        if (
            !code ||
            code === "Loading..." ||
            code === "Unavailable"
        ) {
            return;
        }

        copyText(
            code,
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

        const link =
            referralLinkElement.textContent.trim();

        if (
            !link ||
            link === "Loading..." ||
            link === "Unavailable"
        ) {
            return;
        }

        copyText(
            link,
            copyReferralLinkButton,
            "Copy Link"
        );
    }
);


/* =========================================================
   LOAD USER
   ========================================================= */

async function loadTeamData() {

    hideError();


    if (!userId) {

        showError(
            "Your account session could not be found. Please log in again."
        );

        teamLoading.style.display = "none";

        return;
    }


    try {

        /*
         * Load logged-in user
         */

        const userResponse =
            await fetch(
                `${API_BASE}/users/${userId}`
            );


        if (!userResponse.ok) {

            throw new Error(
                "Unable to load your account."
            );
        }


        const user =
            await userResponse.json();


        /*
         * Referral code
         */

        const referralCode =
            user.myReferralCode ||
            user.referralCode ||
            "";


        if (referralCode) {

            referralCodeElement.textContent =
                referralCode;

        } else {

            referralCodeElement.textContent =
                "Unavailable";
        }


        /*
         * Referral link
         *
         * The link points to register.html
         * and passes the referral code.
         */

        if (referralCode) {

            const registerUrl =
                new URL(
                    "register.html",
                    window.location.href
                );

            registerUrl.searchParams.set(
                "ref",
                referralCode
            );

            referralLinkElement.textContent =
                registerUrl.href;

        } else {

            referralLinkElement.textContent =
                "Unavailable";
        }


        /*
         * Referral income
         */

        const referralIncome =
            Number(
                user.referralIncome || 0
            );

        referralIncomeElement.textContent =
            formatMoney(referralIncome);


        /*
         * Load team members
         */

        await loadTeamMembers(
            referralCode
        );


    } catch (error) {

        console.error(
            "Team page error:",
            error
        );

        teamLoading.style.display =
            "none";

        showError(
            error.message ||
            "Something went wrong while loading your team."
        );
    }
}


/* =========================================================
   LOAD TEAM MEMBERS
   ========================================================= */

async function loadTeamMembers(
    referralCode
) {

    teamLoading.style.display =
        "block";

    teamList.style.display =
        "none";

    teamEmpty.style.display =
        "none";


    /*
     * If the referral code does not exist,
     * there cannot be a team to search.
     */

    if (!referralCode) {

        showEmptyTeam();

        return;
    }


    try {

        /*
         * Ask backend for users referred
         * by this user's referral code.
         *
         * This endpoint must exist in userRoutes:
         *
         * GET /api/users/referrals/:referralCode
         */

        const response =
            await fetch(
                `${API_BASE}/users/referrals/${encodeURIComponent(referralCode)}`
            );


        if (!response.ok) {

            /*
             * Do not show fake team members.
             * If the endpoint is not yet available,
             * show the empty state instead.
             */

            if (response.status === 404) {

                showEmptyTeam();

                return;
            }

            throw new Error(
                "Unable to load team members."
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


        renderTeamMembers(members);


    } catch (error) {

        console.error(
            "Team members error:",
            error
        );

        /*
         * Do not replace the whole page
         * with an error for an empty team.
         */

        showEmptyTeam();
    }
}


/* =========================================================
   RENDER TEAM MEMBERS
   ========================================================= */

function renderTeamMembers(
    members
) {

    teamLoading.style.display =
        "none";


    const count =
        members.length;


    teamCountElement.textContent =
        count;


    teamCountLabel.textContent =
        count === 1
            ? "1 member"
            : `${count} members`;


    if (count === 0) {

        showEmptyTeam();

        return;
    }


    teamEmpty.style.display =
        "none";

    teamList.style.display =
        "flex";


    teamList.innerHTML = "";


    members.forEach(
        (member) => {

            const item =
                document.createElement("div");

            item.className =
                "team-member";


            /*
             * Member name
             */

            const name =
                member.fullName ||
                member.username ||
                "FINORA Member";


            /*
             * First letter avatar
             */

            const firstLetter =
                name
                    .trim()
                    .charAt(0)
                    .toUpperCase() || "F";


            /*
             * Account activation
             */

            const activated =
                member.accountActivated === true;


            const status =
                activated
                    ? "Active"
                    : "Not activated";


            /*
             * Create member card
             */

            item.innerHTML = `

                <div class="member-avatar">
                    ${escapeHtml(firstLetter)}
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


            teamList.appendChild(item);
        }
    );
}


/* =========================================================
   EMPTY TEAM
   ========================================================= */

function showEmptyTeam() {

    teamLoading.style.display =
        "none";

    teamList.style.display =
        "none";

    teamEmpty.style.display =
        "block";


    teamCountElement.textContent =
        "0";

    teamCountLabel.textContent =
        "0 members";
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadTeamData();

    }
);
