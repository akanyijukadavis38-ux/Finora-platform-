/* =========================================================
   FINORA TEAM
   team.js

   Uses the current FINORA backend session.

   IMPORTANT:
   - No MongoDB
   - No localStorage user ID
   - No CashNova backend
   - No username
   - Uses Express session
   ========================================================= */


/* =========================================================
   FINORA BACKEND
========================================================= */

const FINORA_API =
    "https://finora-backend-l949.onrender.com/api";


/* =========================================================
   ELEMENTS
========================================================= */

const referralCodeElement =
    document.getElementById("referralCode");

const referralIncomeElement =
    document.getElementById("referralIncome");

const teamCountElement =
    document.getElementById("teamCount");

const teamCountLabel =
    document.getElementById("teamCountLabel");

const teamLoading =
    document.getElementById("teamLoading");

const teamList =
    document.getElementById("teamList");

const teamEmpty =
    document.getElementById("teamEmpty");

const teamError =
    document.getElementById("teamError");

const copyReferralButton =
    document.getElementById("copyReferralButton");


/* =========================================================
   SAFE TEXT
========================================================= */

function safeText(
    value,
    fallback = "—"
) {

    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {

        return fallback;

    }

    return String(value).trim();

}


/* =========================================================
   FORMAT MONEY
========================================================= */

function formatMoney(value) {

    const amount =
        Number(value);

    if (
        !Number.isFinite(amount)
    ) {

        return "UGX 0";

    }


    return (
        "UGX " +
        amount.toLocaleString(
            "en-UG",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        )
    );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(value) {

    if (!value) {

        return "—";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "—";

    }


    return date.toLocaleDateString(
        "en-UG",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   GET MEMBER INITIAL
========================================================= */

function getInitial(
    fullName
) {

    const name =
        safeText(
            fullName,
            "U"
        );


    return name
        .charAt(0)
        .toUpperCase();

}


/* =========================================================
   DISPLAY TEAM
========================================================= */

function displayTeam(
    data
) {

    if (!data) {

        return;

    }


    const referralCode =
        safeText(
            data.referralCode
        );


    const team =
        Array.isArray(
            data.team
        )
            ? data.team
            : [];


    const totalIncome =
        Number(
            data.totalReferralIncome
        ) || 0;


    /* =====================================================
       REFERRAL CODE
    ===================================================== */

    if (referralCodeElement) {

        referralCodeElement.textContent =
            referralCode;

    }


    /* =====================================================
       REFERRAL INCOME
    ===================================================== */

    if (referralIncomeElement) {

        referralIncomeElement.textContent =
            formatMoney(
                totalIncome
            );

    }


    /* =====================================================
       TEAM COUNT
    ===================================================== */

    if (teamCountElement) {

        teamCountElement.textContent =
            team.length;

    }


    if (teamCountLabel) {

        teamCountLabel.textContent =
            team.length === 1
                ? "1 member"
                : `${team.length} members`;

    }


    /* =====================================================
       HIDE LOADING
    ===================================================== */

    if (teamLoading) {

        teamLoading.style.display =
            "none";

    }


    /* =====================================================
       EMPTY TEAM
    ===================================================== */

    if (
        team.length === 0
    ) {

        if (teamList) {

            teamList.style.display =
                "none";

            teamList.innerHTML =
                "";

        }


        if (teamEmpty) {

            teamEmpty.style.display =
                "block";

        }


        return;

    }


    /* =====================================================
       SHOW TEAM
    ===================================================== */

    if (teamEmpty) {

        teamEmpty.style.display =
            "none";

    }


    if (!teamList) {

        return;

    }


    teamList.innerHTML =
        "";


    team.forEach(
        function (member) {

            const fullName =
                safeText(
                    member.full_name ||
                    member.fullName,
                    "Investor"
                );


            const phone =
                safeText(
                    member.phone
                );


            const accountNumber =
                safeText(
                    member.account_number ||
                    member.accountNumber
                );


            const createdAt =
                formatDate(
                    member.created_at ||
                    member.createdAt
                );


            const memberElement =
                document.createElement(
                    "div"
                );


            memberElement.className =
                "team-member";


            memberElement.innerHTML = `

                <div class="member-avatar">
                    ${getInitial(fullName)}
                </div>

                <div class="member-info">

                    <div class="member-name">
                        ${escapeHtml(fullName)}
                    </div>

                    <div class="member-details">
                        ${escapeHtml(phone)}
                        •
                        ${escapeHtml(accountNumber)}
                        •
                        Joined ${escapeHtml(createdAt)}
                    </div>

                </div>

            `;


            teamList.appendChild(
                memberElement
            );

        }
    );


    teamList.style.display =
        "flex";

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(
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
   SHOW ERROR
========================================================= */

function showTeamError(
    message
) {

    if (!teamError) {

        return;

    }


    teamError.textContent =
        safeText(
            message,
            "Unable to load your team."
        );


    teamError.style.display =
        "block";


    if (teamLoading) {

        teamLoading.style.display =
            "none";

    }

}


/* =========================================================
   LOAD CURRENT TEAM
========================================================= */

async function loadTeam() {

    try {

        /* =================================================
           RESET DISPLAY
        ================================================= */

        if (teamError) {

            teamError.style.display =
                "none";

        }


        if (teamLoading) {

            teamLoading.style.display =
                "block";

        }


        if (teamList) {

            teamList.style.display =
                "none";

        }


        if (teamEmpty) {

            teamEmpty.style.display =
                "none";

        }


        /* =================================================
           REQUEST CURRENT SESSION TEAM
        ================================================= */

        const response =
            await fetch(
                `${FINORA_API}/team`,
                {
                    method: "GET",

                    credentials: "include",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        /* =================================================
           NOT LOGGED IN
        ================================================= */

        if (
            response.status === 401
        ) {

            console.warn(
                "FINORA: No active login session."
            );


            window.location.href =
                "login.html";

            return;

        }


        /* =================================================
           SERVER ERROR
        ================================================= */

        if (!response.ok) {

            throw new Error(
                `Team request failed: ${response.status}`
            );

        }


        /* =================================================
           READ RESPONSE
        ================================================= */

        const data =
            await response.json();


        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                data &&
                data.message
                    ? data.message
                    : "FINORA returned an invalid team response."
            );

        }


        /* =================================================
           DISPLAY TEAM
        ================================================= */

        displayTeam(
            data
        );

    }

    catch (error) {

        console.error(
            "FINORA TEAM ERROR:",
            error
        );


        showTeamError(
            error.message
        );

    }

}


/* =========================================================
   COPY REFERRAL CODE
========================================================= */

async function copyReferralCode() {

    if (!referralCodeElement) {

        return;

    }


    const code =
        referralCodeElement.textContent.trim();


    if (
        !code ||
        code === "Loading..."
    ) {

        return;

    }


    try {

        await navigator.clipboard.writeText(
            code
        );


        if (copyReferralButton) {

            const originalText =
                copyReferralButton.textContent;


            copyReferralButton.textContent =
                "Copied!";


            setTimeout(
                function () {

                    copyReferralButton.textContent =
                        originalText;

                },
                1500
            );

        }

    }

    catch (error) {

        console.error(
            "FINORA COPY REFERRAL ERROR:",
            error
        );


        /*
         * Fallback for browsers where
         * navigator.clipboard is unavailable.
         */

        const temporaryInput =
            document.createElement(
                "textarea"
            );


        temporaryInput.value =
            code;


        document.body.appendChild(
            temporaryInput
        );


        temporaryInput.select();


        try {

            document.execCommand(
                "copy"
            );


            if (copyReferralButton) {

                const originalText =
                    copyReferralButton.textContent;


                copyReferralButton.textContent =
                    "Copied!";


                setTimeout(
                    function () {

                        copyReferralButton.textContent =
                            originalText;

                    },
                    1500
                );

            }

        }

        catch (fallbackError) {

            console.error(
                "FINORA COPY FALLBACK ERROR:",
                fallbackError
            );

        }


        temporaryInput.remove();

    }

}


/* =========================================================
   COPY BUTTON
========================================================= */

if (copyReferralButton) {

    copyReferralButton.addEventListener(
        "click",
        copyReferralCode
    );

}


/* =========================================================
   START TEAM
========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        loadTeam
    );

} else {

    loadTeam();

}
