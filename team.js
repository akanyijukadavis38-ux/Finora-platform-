/* =========================================================
   FINORA TEAM
   team.js

   Uses the current FINORA backend session.

   IMPORTANT:
   - No localStorage user ID
   - No username
   - No CashNova
   - No MongoDB
   - No extra navigation
   - Uses /api/team
========================================================= */


/* =========================================================
   FINORA BACKEND
========================================================= */

const FINORA_API =
    "https://finora-backend-l949.onrender.com/api";


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

function formatMoney(
    value
) {

    const amount =
        Number(value || 0);

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
   REFERRAL LINK
========================================================= */

function createReferralLink(
    code
) {

    if (
        !code ||
        code === "—"
    ) {

        return "—";

    }


    /*
     * The referral link points to FINORA
     * registration and carries the user's
     * referral code.
     */

    const baseUrl =
        window.location.origin;


    return (
        baseUrl +
        "/register.html?ref=" +
        encodeURIComponent(code)
    );

}


/* =========================================================
   SHOW ERROR
========================================================= */

function showError(
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

}


/* =========================================================
   HIDE ERROR
========================================================= */

function hideError() {

    if (!teamError) {
        return;
    }


    teamError.textContent =
        "";


    teamError.style.display =
        "none";

}


/* =========================================================
   COPY TEXT
========================================================= */

async function copyText(
    text,
    button,
    defaultText
) {

    if (
        !text ||
        text === "—" ||
        text === "Loading..."
    ) {

        return;

    }


    try {

        await navigator.clipboard.writeText(
            text
        );


        if (button) {

            button.textContent =
                "Copied";


            setTimeout(
                function () {

                    button.textContent =
                        defaultText;

                },
                1500
            );

        }

    }

    catch (error) {

        console.error(
            "FINORA COPY ERROR:",
            error
        );


        /*
         * Fallback for browsers where
         * navigator.clipboard is unavailable.
         */

        try {

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


            textarea.focus();

            textarea.select();


            document.execCommand(
                "copy"
            );


            document.body.removeChild(
                textarea
            );


            if (button) {

                button.textContent =
                    "Copied";


                setTimeout(
                    function () {

                        button.textContent =
                            defaultText;

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

    }

}


/* =========================================================
   DISPLAY REFERRAL INFORMATION
========================================================= */

function displayReferral(
    code
) {

    const cleanCode =
        safeText(
            code,
            "—"
        );


    /* -----------------------------------------
       REFERRAL CODE
    ----------------------------------------- */

    if (referralCode) {

        referralCode.textContent =
            cleanCode;

    }


    /* -----------------------------------------
       REFERRAL LINK
    ----------------------------------------- */

    const link =
        createReferralLink(
            cleanCode
        );


    if (referralLink) {

        referralLink.textContent =
            link;

    }

}


/* =========================================================
   DISPLAY TEAM MEMBERS
========================================================= */

function displayTeam(
    team
) {

    if (!Array.isArray(team)) {

        team = [];

    }


    const count =
        team.length;


    /* -----------------------------------------
       TEAM COUNT
    ----------------------------------------- */

    if (teamCount) {

        teamCount.textContent =
            String(count);

    }


    if (teamCountLabel) {

        teamCountLabel.textContent =
            count === 1
                ? "1 member"
                : `${count} members`;

    }


    /* -----------------------------------------
       HIDE LOADING
    ----------------------------------------- */

    if (teamLoading) {

        teamLoading.style.display =
            "none";

    }


    /* -----------------------------------------
       EMPTY TEAM
    ----------------------------------------- */

    if (count === 0) {

        if (teamList) {

            teamList.innerHTML =
                "";

            teamList.style.display =
                "none";

        }


        if (teamEmpty) {

            teamEmpty.style.display =
                "block";

        }


        return;

    }


    /* -----------------------------------------
       SHOW TEAM
    ----------------------------------------- */

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

            const name =
                safeText(
                    member.full_name ||
                    member.fullName,
                    "FINORA Member"
                );


            const phone =
                safeText(
                    member.phone,
                    "—"
                );


            const accountNumber =
                safeText(
                    member.account_number ||
                    member.accountNumber,
                    "—"
                );


            const createdAt =
                member.created_at ||
                member.createdAt;


            let joinedDate =
                "—";


            if (createdAt) {

                const date =
                    new Date(
                        createdAt
                    );


                if (
                    !Number.isNaN(
                        date.getTime()
                    )
                ) {

                    joinedDate =
                        date.toLocaleDateString(
                            "en-GB",
                            {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                            }
                        );

                }

            }


            const firstLetter =
                name
                    .charAt(0)
                    .toUpperCase();


            const memberElement =
                document.createElement(
                    "div"
                );


            memberElement.className =
                "team-member";


            memberElement.innerHTML = `

                <div class="member-avatar">
                    ${escapeHTML(firstLetter)}
                </div>


                <div class="member-info">

                    <div class="member-name">
                        ${escapeHTML(name)}
                    </div>


                    <div class="member-details">
                        ${escapeHTML(phone)}
                        <br>
                        Account:
                        ${escapeHTML(accountNumber)}
                        · Joined:
                        ${escapeHTML(joinedDate)}
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
   LOAD TEAM
========================================================= */

async function loadTeam() {

    try {

        hideError();


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


        /* -----------------------------------------
           REQUEST CURRENT USER'S TEAM
        ----------------------------------------- */

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


        /* -----------------------------------------
           LOGIN SESSION EXPIRED
        ----------------------------------------- */

        if (
            response.status === 401
        ) {

            window.location.href =
                "login.html";

            return;

        }


        /* -----------------------------------------
           SERVER ERROR
        ----------------------------------------- */

        if (!response.ok) {

            throw new Error(
                `Team request failed: ${response.status}`
            );

        }


        /* -----------------------------------------
           READ RESPONSE
        ----------------------------------------- */

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
                    : "Invalid FINORA team response."
            );

        }


        /* -----------------------------------------
           REFERRAL CODE
        ----------------------------------------- */

        displayReferral(
            data.referralCode
        );


        /* -----------------------------------------
           REFERRAL INCOME
        ----------------------------------------- */

        if (referralIncome) {

            referralIncome.textContent =
                formatMoney(
                    data.totalReferralIncome
                );

        }


        /* -----------------------------------------
           TEAM
        ----------------------------------------- */

        displayTeam(
            data.team
        );

    }

    catch (error) {

        console.error(
            "FINORA TEAM ERROR:",
            error
        );


        if (teamLoading) {

            teamLoading.style.display =
                "none";

        }


        if (teamList) {

            teamList.style.display =
                "none";

        }


        if (teamEmpty) {

            teamEmpty.style.display =
                "none";

        }


        showError(
            "Unable to load your team right now. Please try again."
        );

    }

}


/* =========================================================
   COPY REFERRAL CODE
========================================================= */

if (copyReferralButton) {

    copyReferralButton.addEventListener(
        "click",
        function () {

            const code =
                referralCode
                    ? referralCode.textContent.trim()
                    : "";


            copyText(
                code,
                copyReferralButton,
                "Copy"
            );

        }
    );

}


/* =========================================================
   COPY REFERRAL LINK
========================================================= */

if (copyReferralLinkButton) {

    copyReferralLinkButton.addEventListener(
        "click",
        function () {

            const link =
                referralLink
                    ? referralLink.textContent.trim()
                    : "";


            copyText(
                link,
                copyReferralLinkButton,
                "Copy"
            );

        }
    );

}


/* =========================================================
   START TEAM PAGE
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        loadTeam
    );

}

else {

    loadTeam();

}
