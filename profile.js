/* =========================================================
   FINORA PROFILE
   profile.js

   Loads the currently logged-in user's profile
   from the FINORA MongoDB backend.
   ========================================================= */


/* =========================================================
   BACKEND
   ========================================================= */

const FINORA_API =
    "https://cashnova-backend-89lg.onrender.com/api/users";


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
   HELPERS
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
   SHOW PROFILE
   ========================================================= */

function displayProfile(user) {

    if (!user) {
        return;
    }


    /*
     * IMPORTANT:
     *
     * FINORA uses ONLY fullName.
     *
     * There is no username and no separate name field.
     */

    const fullName =
        safeText(user.fullName, "Investor");

    const email =
        safeText(user.email);

    const phone =
        safeText(user.phone);

    const accountNumber =
        safeText(user.accountNumber);


    /* PROFILE SUMMARY */

    if (profileFullName) {

        profileFullName.textContent =
            fullName;

    }


    if (profileEmail) {

        profileEmail.textContent =
            email;

    }


    /* ACCOUNT INFORMATION */

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


    /* ACCOUNT STATUS */

    if (profileStatus) {

        /*
         * The profile is considered active when
         * the backend account exists.
         */

        profileStatus.textContent =
            "Active";

    }

}


/* =========================================================
   LOAD USER PROFILE
   ========================================================= */

async function loadProfile() {

    try {

        /*
         * The login system stores the MongoDB
         * user ID here after successful login.
         */

        const userId =
            localStorage.getItem("cashnovaUserId");


        /* NO USER ID */

        if (!userId) {

            console.warn(
                "FINORA: No logged-in user ID found."
            );

            window.location.href =
                "index.html";

            return;
        }


        /* SHOW LOADING STATE */

        document.body.classList.add(
            "profile-loading"
        );


        /* FETCH USER FROM MONGODB */

        const response =
            await fetch(
                `${FINORA_API}/${encodeURIComponent(userId)}`,
                {
                    method: "GET",
                    headers: {
                        "Accept": "application/json"
                    }
                }
            );


        /* SERVER ERROR */

        if (!response.ok) {

            throw new Error(
                `Profile request failed: ${response.status}`
            );

        }


        const user =
            await response.json();


        /* DISPLAY USER */

        displayProfile(user);


    } catch (error) {

        console.error(
            "FINORA Profile Error:",
            error
        );


        /*
         * Do not invent user information.
         *
         * If the backend cannot be reached,
         * the page keeps the safe fallback values.
         */

    } finally {

        document.body.classList.remove(
            "profile-loading"
        );

    }

}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    loadProfile
);
