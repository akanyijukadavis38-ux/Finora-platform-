/* =========================================================
   FINORA PROFILE
   profile.js

   Uses the current FINORA backend session.

   IMPORTANT:
   - No MongoDB
   - No localStorage user ID
   - No CashNova backend
   - No username
   - FINORA registration uses Full Name
   ========================================================= */


/* =========================================================
   FINORA BACKEND
   ========================================================= */

const FINORA_API =
    "https://finora-backend-l949.onrender.com/api";


/* =========================================================
   ELEMENTS
   ========================================================= */

const profileFullName =
    document.getElementById("profileFullName");

const profileEmail =
    document.getElementById("profileEmail");

const accountFullName =
    document.getElementById("accountFullName");

const profilePhone =
    document.getElementById("profilePhone");

const profileEmailAddress =
    document.getElementById("profileEmailAddress");

const profileAccountNumber =
    document.getElementById("profileAccountNumber");

const profileStatus =
    document.getElementById("profileStatus");


/* =========================================================
   SAFE TEXT
   ========================================================= */

function safeText(value, fallback = "—") {

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
   DISPLAY PROFILE
   ========================================================= */

function displayProfile(user) {

    if (!user) {
        return;
    }


    /*
     * FINORA uses ONLY:
     *
     * fullName
     *
     * There is NO username.
     */

    const fullName =
        safeText(
            user.fullName,
            "Investor"
        );


    const email =
        safeText(
            user.email
        );


    const phone =
        safeText(
            user.phone
        );


    const accountNumber =
        safeText(
            user.accountNumber
        );


    /* =====================================================
       PROFILE SUMMARY
       ===================================================== */

    if (profileFullName) {

        profileFullName.textContent =
            fullName;

    }


    if (profileEmail) {

        profileEmail.textContent =
            email;

    }


    /* =====================================================
       ACCOUNT INFORMATION
       ===================================================== */

    if (accountFullName) {

        accountFullName.textContent =
            fullName;

    }


    if (profilePhone) {

        profilePhone.textContent =
            phone;

    }


    if (profileEmailAddress) {

        profileEmailAddress.textContent =
            email;

    }


    if (profileAccountNumber) {

        profileAccountNumber.textContent =
            accountNumber;

    }


    /* =====================================================
       ACCOUNT STATUS
       ===================================================== */

    if (profileStatus) {

        const status =
            safeText(
                user.accountStatus,
                "active"
            ).toLowerCase();


        if (status === "active") {

            profileStatus.textContent =
                "Active";

        } else {

            profileStatus.textContent =
                status.charAt(0).toUpperCase() +
                status.slice(1);

        }

    }

}


/* =========================================================
   LOAD CURRENT FINORA USER
   ========================================================= */

async function loadProfile() {

    try {

        /*
         * IMPORTANT:
         *
         * We do NOT look for:
         *
         * cashnovaUserId
         * cashnovaUserData
         * username
         *
         * The current FINORA backend identifies the
         * logged-in user through the Express session.
         */


        document.body.classList.add(
            "profile-loading"
        );


        /* =================================================
           REQUEST CURRENT SESSION USER
           ================================================= */

        const response =
            await fetch(
                `${FINORA_API}/me`,
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


            /*
             * Only redirect when the backend actually
             * tells us that the user is not logged in.
             */

            window.location.href =
                "login.html";

            return;

        }


        /* =================================================
           OTHER SERVER ERROR
           ================================================= */

        if (!response.ok) {

            throw new Error(
                `Profile request failed: ${response.status}`
            );

        }


        /* =================================================
           READ RESPONSE
           ================================================= */

        const data =
            await response.json();


        if (
            !data ||
            data.success !== true ||
            !data.user
        ) {

            throw new Error(
                "FINORA returned an invalid user response."
            );

        }


        /* =================================================
           DISPLAY USER
           ================================================= */

        displayProfile(
            data.user
        );


    }

    catch (error) {

        console.error(
            "FINORA PROFILE ERROR:",
            error
        );


        /*
         * IMPORTANT:
         *
         * Do NOT redirect to index.html here.
         *
         * A temporary backend/network problem should
         * not throw the user back to the landing page.
         */

    }

    finally {

        document.body.classList.remove(
            "profile-loading"
        );

    }

}


/* =========================================================
   START PROFILE
   ========================================================= */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        loadProfile
    );

} else {

    loadProfile();

}
