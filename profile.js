/* =========================================================
   FINORA PROFILE
   profile.js
   ONLINE / BACKEND VERSION
   NO LOCAL STORAGE
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       FINORA BACKEND
    ===================================================== */

    const FINORA_API =
        "https://finora-backend-l949.onrender.com";


    /* =====================================================
       ELEMENTS
    ===================================================== */

    const profileAvatar =
        document.getElementById("profileAvatar");

    const profileName =
        document.getElementById("profileName");

    const profileEmail =
        document.getElementById("profileEmail");

    const fullName =
        document.getElementById("fullName");

    const profilePhone =
        document.getElementById("profilePhone");

    const profileEmailFull =
        document.getElementById("profileEmailFull");

    const accountNumber =
        document.getElementById("accountNumber");

    const profileWalletBalance =
        document.getElementById(
            "profileWalletBalance"
        );

    const referralCode =
        document.getElementById("referralCode");

    const accountStatus =
        document.getElementById("accountStatus");

    const profileMessage =
        document.getElementById("profileMessage");

    const backButton =
        document.getElementById("backButton");

    const copyReferralCode =
        document.getElementById(
            "copyReferralCode"
        );

    const transactionsButton =
        document.getElementById(
            "transactionsButton"
        );

    const teamButton =
        document.getElementById(
            "teamButton"
        );

    const supportButton =
        document.getElementById(
            "supportButton"
        );

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    /* =====================================================
       HELPERS
    ===================================================== */

    function safeNumber(value) {

        const number = Number(value);

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


    function showMessage(
        message,
        type = "error"
    ) {

        if (!profileMessage) {
            return;
        }

        profileMessage.textContent =
            message;

        profileMessage.className =
            "profile-message " + type;
    }


    function clearMessage() {

        if (!profileMessage) {
            return;
        }

        profileMessage.textContent =
            "";

        profileMessage.className =
            "profile-message";
    }


    /* =====================================================
       UPDATE PROFILE
    ===================================================== */

    function updateProfile(user) {

        if (!user) {
            return;
        }


        /* ================================================
           USER INFORMATION

           PostgreSQL returns snake_case fields:
           full_name
           phone
           email
           referral_code
           wallet_balance
           account_status
        ================================================ */

        const name =
            user.full_name ||
            "Investor";


        const email =
            user.email ||
            "—";


        const phone =
            user.phone ||
            "—";


        const code =
            user.referral_code ||
            "—";


        const balance =
            safeNumber(
                user.wallet_balance
            );


        const status =
            user.account_status ||
            "active";


        /* ================================================
           NAME
        ================================================ */

        if (profileName) {

            profileName.textContent =
                name;
        }


        if (fullName) {

            fullName.textContent =
                name;
        }


        /* ================================================
           AVATAR
        ================================================ */

        if (profileAvatar) {

            const firstLetter =
                name
                    .trim()
                    .charAt(0)
                    .toUpperCase();


            profileAvatar.textContent =
                firstLetter || "F";
        }


        /* ================================================
           EMAIL
        ================================================ */

        if (profileEmail) {

            profileEmail.textContent =
                email;
        }


        if (profileEmailFull) {

            profileEmailFull.textContent =
                email;
        }


        /* ================================================
           PHONE
        ================================================ */

        if (profilePhone) {

            profilePhone.textContent =
                phone;
        }


        /* ================================================
           ACCOUNT NUMBER

           Your current PostgreSQL users table does NOT
           contain an account_number column.

           Therefore we deliberately don't invent one.
        ================================================ */

        if (accountNumber) {

            accountNumber.textContent =
                "—";
        }


        /* ================================================
           WALLET
        ================================================ */

        if (profileWalletBalance) {

            profileWalletBalance.textContent =
                formatUGX(balance);
        }


        /* ================================================
           REFERRAL CODE
        ================================================ */

        if (referralCode) {

            referralCode.textContent =
                code;
        }


        /* ================================================
           ACCOUNT STATUS
        ================================================ */

        if (accountStatus) {

            const statusText =
                status
                    .toString()
                    .toLowerCase();


            const active =
                statusText === "active";


            accountStatus.innerHTML = `

                <span class="status-dot"></span>

                <span>
                    ${
                        active
                            ? "Active"
                            : status
                    }
                </span>

            `;


            accountStatus.classList.toggle(
                "inactive",
                !active
            );
        }

    }


    /* =====================================================
       LOAD CURRENT USER
    ===================================================== */

    async function loadProfile() {

        clearMessage();


        try {

            const response =
                await fetch(
                    `${FINORA_API}/api/me`,
                    {
                        method: "GET",

                        credentials: "include",

                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );


            let data = null;


            try {

                data =
                    await response.json();

            } catch (jsonError) {

                console.error(
                    "FINORA PROFILE JSON ERROR:",
                    jsonError
                );
            }


            console.log(
                "FINORA PROFILE STATUS:",
                response.status
            );


            console.log(
                "FINORA PROFILE RESPONSE:",
                data
            );


            /* =========================================
               SESSION EXPIRED
            ========================================= */

            if (response.status === 401) {

                showMessage(
                    "Your FINORA session has expired. Please log in again."
                );

                return;
            }


            /* =========================================
               USER NOT FOUND
            ========================================= */

            if (response.status === 404) {

                showMessage(
                    "Your FINORA account could not be found."
                );

                return;
            }


            /* =========================================
               SERVER ERROR
            ========================================= */

            if (response.status >= 500) {

                showMessage(
                    "Unable to load your profile. Please try again."
                );

                return;
            }


            /* =========================================
               OTHER FAILED REQUEST
            ========================================= */

            if (!response.ok) {

                showMessage(
                    data &&
                    data.message
                        ? data.message
                        : "Unable to load your profile."
                );

                return;
            }


            /* =========================================
               SUCCESS
            ========================================= */

            if (
                !data ||
                data.success !== true ||
                !data.user
            ) {

                showMessage(
                    "FINORA returned incomplete profile information."
                );

                return;
            }


            updateProfile(
                data.user
            );

        }


        catch (error) {

            console.error(
                "FINORA PROFILE ERROR:",
                error
            );


            showMessage(
                "Cannot connect to the FINORA server. Please try again."
            );
        }

    }


    /* =====================================================
       BACK BUTTON
    ===================================================== */

    if (backButton) {

        backButton.addEventListener(
            "click",
            function () {

                if (
                    window.history.length > 1
                ) {

                    window.history.back();

                } else {

                    window.location.href =
                        "dashboard.html";

                }

            }
        );
    }


    /* =====================================================
       COPY REFERRAL CODE
    ===================================================== */

    if (copyReferralCode) {

        copyReferralCode.addEventListener(
            "click",
            async function () {

                const code =
                    referralCode
                        ? referralCode.textContent.trim()
                        : "";


                if (
                    !code ||
                    code === "—"
                ) {

                    showMessage(
                        "Referral code is not available yet."
                    );

                    return;
                }


                try {

                    await navigator.clipboard.writeText(
                        code
                    );


                    showMessage(
                        "Referral code copied.",
                        "success"
                    );


                } catch (error) {

                    showMessage(
                        "Unable to copy referral code."
                    );
                }

            }
        );

    }


    /* =====================================================
       TRANSACTION HISTORY
    ===================================================== */

    if (transactionsButton) {

        transactionsButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "transaction-history.html";

            }
        );

    }


    /* =====================================================
       TEAM
    ===================================================== */

    if (teamButton) {

        teamButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "team.html";

            }
        );

    }


    /* =====================================================
       SUPPORT
    ===================================================== */

    if (supportButton) {

        supportButton.addEventListener(
            "click",
            function () {

                showMessage(
                    "FINORA support will be available here."
                );

            }
        );

    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            async function () {

                logoutButton.disabled =
                    true;

                logoutButton.textContent =
                    "Logging out...";


                try {

                    const response =
                        await fetch(
                            `${FINORA_API}/api/logout`,
                            {
                                method: "POST",

                                credentials: "include",

                                headers: {
                                    "Accept":
                                        "application/json"
                                }
                            }
                        );


                    const data =
                        await response
                            .json()
                            .catch(
                                function () {
                                    return {};
                                }
                            );


                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            "Logout failed."
                        );

                    }


                    window.location.href =
                        "login.html";

                }


                catch (error) {

                    console.error(
                        "FINORA LOGOUT ERROR:",
                        error
                    );


                    showMessage(
                        "Unable to log out. Please try again."
                    );


                    logoutButton.disabled =
                        false;

                    logoutButton.textContent =
                        "Log Out";
                }

            }
        );

    }


    /* =====================================================
       START
    ===================================================== */

    loadProfile();

});
