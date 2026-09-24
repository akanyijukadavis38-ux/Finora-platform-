/* =========================================================
   FINORA — ADMIN REGISTRATION TRACKER
   ---------------------------------------------------------
   Live registration activity

   Backend:
   GET /api/admin/registrations

   Features:
   - Real existing registrations
   - Kampala calendar dates
   - Horizontal date timeline
   - Today's live registrations
   - Full names only
   - Total / Today / 7 Days / 30 Days
   - Direct / Referral statistics
   - Automatic refresh
========================================================= */

const API_BASE =
    "https://finora-platform.onrender.com";

const REGISTRATION_ENDPOINT =
    `${API_BASE}/api/admin/registrations`;

const REFRESH_INTERVAL =
    30 * 1000;


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (selector) =>
    document.querySelector(selector);

const $$ = (selector) =>
    document.querySelectorAll(selector);


/* =========================================================
   STATE
========================================================= */

let trackerData = null;

let selectedDate = null;

let refreshTimer = null;


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeTracker();

    }
);


/* =========================================================
   INITIALIZE TRACKER
========================================================= */

async function initializeTracker() {

    updateFooterYear();

    setupBackButton();

    setupRefreshButton();

    await loadRegistrationTracker();

    startAutoRefresh();

}


/* =========================================================
   LOAD REGISTRATION DATA
========================================================= */

async function loadRegistrationTracker() {

    try {

        setLiveStatus(
            "loading"
        );

        const response =
            await fetch(
                REGISTRATION_ENDPOINT,
                {
                    method:
                        "GET",

                    credentials:
                        "include",

                    headers: {
                        "Accept":
                            "application/json"
                    },

                    cache:
                        "no-store"
                }
            );


        /* =================================================
           ADMIN SESSION EXPIRED
        ================================================= */

        if (
            response.status ===
            401
        ) {

            window.location.href =
                "/admin-login.html";

            return;
        }


        /* =================================================
           ADMIN ACCESS DENIED
        ================================================= */

        if (
            response.status ===
            403
        ) {

            showTrackerError(
                "Admin access is required to view registration activity."
            );

            setLiveStatus(
                "offline"
            );

            return;
        }


        if (
            !response.ok
        ) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        const data =
            await response.json();


        if (
            !data ||
            data.success !== true
        ) {

            throw new Error(
                data?.message ||
                "Registration data could not be loaded."
            );

        }


        trackerData =
            data;


        renderStatistics();

        renderDateTimeline();

        /*
           If no date has been selected yet,
           automatically select TODAY.
        */

        if (
            !selectedDate
        ) {

            selectedDate =
                data.today;

        }


        /*
           If the selected date no longer
           exists in the response, keep it
           as a valid zero-registration date.
        */

        renderSelectedDate();

        setLiveStatus(
            "live"
        );


        updateLastUpdated();


    } catch (error) {

        console.error(
            "FINORA REGISTRATION TRACKER ERROR:",
            error
        );


        setLiveStatus(
            "offline"
        );


        showTrackerError(
            "Unable to load registration activity. Please try again."
        );

    }

}


/* =========================================================
   STATISTICS
========================================================= */

function renderStatistics() {

    if (
        !trackerData ||
        !trackerData.statistics
    ) {

        return;
    }


    const stats =
        trackerData.statistics;


    setText(
        "#totalRegistered",
        formatNumber(
            stats.totalRegistered
        )
    );


    setText(
        "#todayRegistered",
        formatNumber(
            stats.today
        )
    );


    setText(
        "#last7Days",
        formatNumber(
            stats.last7Days
        )
    );


    setText(
        "#last30Days",
        formatNumber(
            stats.last30Days
        )
    );


    setText(
        "#directRegistrations",
        formatNumber(
            stats.directRegistrations
        )
    );


    setText(
        "#referralRegistrations",
        formatNumber(
            stats.referralRegistrations
        )
    );

}


/* =========================================================
   DATE TIMELINE
========================================================= */

function renderDateTimeline() {

    const container =
        $("#registrationDates");

    if (
        !container
    ) {

        return;
    }


    container.innerHTML =
        "";


    /*
       We intentionally create the latest
       30 calendar dates rather than only
       dates where registrations occurred.

       This means days with ZERO registrations
       are also visible.
    */

    const dates =
        buildLatestCalendarDates(
            30
        );


    dates.forEach(
        (dateKey) => {

            const dateInfo =
                getDateInfo(
                    dateKey
                );


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "registration-date";


            if (
                dateKey ===
                trackerData.today
            ) {

                button.classList.add(
                    "is-today"
                );

            }


            if (
                dateKey ===
                selectedDate
            ) {

                button.classList.add(
                    "is-selected"
                );

            }


            button.dataset.date =
                dateKey;


            const label =
                formatDateShort(
                    dateKey
                );


            const dayNumber =
                formatDayNumber(
                    dateKey
                );


            const count =
                Number(
                    dateInfo.count ||
                    0
                );


            button.innerHTML = `

                <span class="date-month">
                    ${escapeHTML(label)}
                </span>

                <span class="date-number">
                    ${escapeHTML(dayNumber)}
                </span>

                <span class="date-count">
                    ${formatNumber(count)}
                </span>

                ${
                    dateKey ===
                    trackerData.today
                        ? `
                            <span class="today-label">
                                TODAY
                            </span>
                          `
                        : ""
                }

            `;


            button.addEventListener(
                "click",
                () => {

                    selectDate(
                        dateKey
                    );

                }
            );


            container.appendChild(
                button
            );

        }
    );


    /*
       Scroll today's date into view
       when the timeline is first loaded.
    */

    if (
        selectedDate
    ) {

        requestAnimationFrame(
            () => {

                scrollDateIntoView(
                    selectedDate
                );

            }
        );

    }

}


/* =========================================================
   BUILD CALENDAR DATES
========================================================= */

function buildLatestCalendarDates(
    numberOfDays
) {

    const dates = [];

    const today =
        parseDateKey(
            trackerData.today
        );


    for (
        let i = 0;
        i < numberOfDays;
        i++
    ) {

        const date =
            new Date(
                today
            );


        date.setUTCDate(
            date.getUTCDate() - i
        );


        dates.push(
            date
                .toISOString()
                .slice(
                    0,
                    10
                )
        );

    }


    return dates;

}


/* =========================================================
   DATE INFORMATION
========================================================= */

function getDateInfo(
    dateKey
) {

    if (
        trackerData &&
        trackerData.registrationsByDate &&
        trackerData.registrationsByDate[
            dateKey
        ]
    ) {

        return trackerData
            .registrationsByDate[
                dateKey
            ];

    }


    return {

        date:
            dateKey,

        count:
            0,

        registrations:
            []

    };

}


/* =========================================================
   SELECT DATE
========================================================= */

function selectDate(
    dateKey
) {

    selectedDate =
        dateKey;


    /*
       Update active date without
       rebuilding the whole page.
    */

    $$(".registration-date")
        .forEach(
            (button) => {

                button.classList.toggle(
                    "is-selected",
                    button.dataset.date ===
                    dateKey
                );

            }
        );


    renderSelectedDate();


    scrollDateIntoView(
        dateKey
    );

}


/* =========================================================
   SELECTED DATE
========================================================= */

function renderSelectedDate() {

    if (
        !trackerData ||
        !selectedDate
    ) {

        return;
    }


    const dateInfo =
        getDateInfo(
            selectedDate
        );


    const registrations =
        Array.isArray(
            dateInfo.registrations
        )
            ? dateInfo.registrations
            : [];


    setText(
        "#selectedDateTitle",
        formatDateLong(
            selectedDate
        )
    );


    setText(
        "#selectedDateCount",
        `${formatNumber(
            registrations.length
        )} REGISTERED`
    );


    const list =
        $("#registrationNames");


    if (
        !list
    ) {

        return;
    }


    list.innerHTML =
        "";


    if (
        registrations.length ===
        0
    ) {

        list.innerHTML = `

            <div class="empty-registrations">

                <div class="empty-icon">
                    ✦
                </div>

                <strong>
                    No registrations yet
                </strong>

                <span>
                    No FINORA users registered
                    on this date.
                </span>

            </div>

        `;


        return;
    }


    registrations.forEach(
        (registration) => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "registration-person";


            /*
               IMPORTANT:
               We deliberately show ONLY
               the user's full name here.
            */

            row.innerHTML = `

                <span class="person-dot"></span>

                <span class="person-name">
                    ${escapeHTML(
                        registration.fullName ||
                        "FINORA User"
                    )}
                </span>

            `;


            list.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   DATE FORMATTING
========================================================= */

function parseDateKey(
    dateKey
) {

    return new Date(
        `${dateKey}T00:00:00Z`
    );

}


function formatDateLong(
    dateKey
) {

    const date =
        parseDateKey(
            dateKey
        );


    return new Intl.DateTimeFormat(
        "en-GB",
        {
            timeZone:
                "Africa/Kampala",

            day:
                "2-digit",

            month:
                "long",

            year:
                "numeric"
        }
    )
        .format(date)
        .toUpperCase();

}


function formatDateShort(
    dateKey
) {

    const date =
        parseDateKey(
            dateKey
        );


    return new Intl.DateTimeFormat(
        "en-GB",
        {
            timeZone:
                "Africa/Kampala",

            month:
                "short"
        }
    )
        .format(date)
        .toUpperCase();

}


function formatDayNumber(
    dateKey
) {

    const date =
        parseDateKey(
            dateKey
        );


    return new Intl.DateTimeFormat(
        "en-GB",
        {
            timeZone:
                "Africa/Kampala",

            day:
                "2-digit"
        }
    )
        .format(date);

}


/* =========================================================
   SCROLL SELECTED DATE INTO VIEW
========================================================= */

function scrollDateIntoView(
    dateKey
) {

    const button =
        document.querySelector(
            `.registration-date[data-date="${dateKey}"]`
        );


    if (
        !button
    ) {

        return;
    }


    button.scrollIntoView({
        behavior:
            "smooth",

        block:
            "nearest",

        inline:
            "center"
    });

}


/* =========================================================
   AUTO REFRESH
========================================================= */

function startAutoRefresh() {

    if (
        refreshTimer
    ) {

        clearInterval(
            refreshTimer
        );

    }


    refreshTimer =
        setInterval(
            () => {

                /*
                   Keep the selected date.

                   If it is TODAY, its list/count
                   will update immediately.

                   If it is an older date, its data
                   remains selected while the overall
                   statistics refresh.
                */

                loadRegistrationTracker();

            },
            REFRESH_INTERVAL
        );

}


/* =========================================================
   REFRESH WHEN ADMIN RETURNS TO TAB
========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            loadRegistrationTracker();

        }

    }
);


/* =========================================================
   MANUAL REFRESH
========================================================= */

function setupRefreshButton() {

    const button =
        $("#refreshTracker");


    if (
        !button
    ) {

        return;
    }


    button.addEventListener(
        "click",
        async () => {

            button.classList.add(
                "is-refreshing"
            );


            await loadRegistrationTracker();


            setTimeout(
                () => {

                    button.classList.remove(
                        "is-refreshing"
                    );

                },
                400
            );

        }
    );

}


/* =========================================================
   BACK BUTTON
========================================================= */

function setupBackButton() {

    const button =
        $("#backToAdmin");


    if (
        !button
    ) {

        return;
    }


    button.addEventListener(
        "click",
        () => {

            window.location.href =
                "/admin.html";

        }
    );

}


/* =========================================================
   LIVE STATUS
========================================================= */

function setLiveStatus(
    status
) {

    const indicator =
        $("#liveIndicator");


    const label =
        $("#liveLabel");


    if (
        !indicator
    ) {

        return;
    }


    indicator.classList.remove(
        "live",
        "loading",
        "offline"
    );


    if (
        status ===
        "live"
    ) {

        indicator.classList.add(
            "live"
        );


        if (
            label
        ) {

            label.textContent =
                "LIVE";

        }

    } else if (
        status ===
        "loading"
    ) {

        indicator.classList.add(
            "loading"
        );


        if (
            label
        ) {

            label.textContent =
                "UPDATING";

        }

    } else {

        indicator.classList.add(
            "offline"
        );


        if (
            label
        ) {

            label.textContent =
                "OFFLINE";

        }

    }

}


/* =========================================================
   LAST UPDATED
========================================================= */

function updateLastUpdated() {

    const element =
        $("#lastUpdated");


    if (
        !element
    ) {

        return;
    }


    const now =
        new Date();


    element.textContent =
        `Updated ${now.toLocaleTimeString(
            "en-GB",
            {
                timeZone:
                    "Africa/Kampala",

                hour:
                    "2-digit",

                minute:
                    "2-digit"
            }
        )}`;

}


/* =========================================================
   ERROR DISPLAY
========================================================= */

function showTrackerError(
    message
) {

    const container =
        $("#registrationNames");


    if (
        !container
    ) {

        return;
    }


    container.innerHTML = `

        <div class="tracker-error">

            <div class="error-icon">
                !
            </div>

            <strong>
                Registration tracker unavailable
            </strong>

            <span>
                ${escapeHTML(message)}
            </span>

            <button
                type="button"
                id="retryTracker"
            >
                TRY AGAIN
            </button>

        </div>

    `;


    const retry =
        $("#retryTracker");


    if (
        retry
    ) {

        retry.addEventListener(
            "click",
            () => {

                loadRegistrationTracker();

            }
        );

    }

}


/* =========================================================
   FOOTER YEAR
========================================================= */

function updateFooterYear() {

    const year =
        $("#footerYear");


    if (
        year
    ) {

        year.textContent =
            new Date()
                .getFullYear();

    }

}


/* =========================================================
   TEXT HELPER
========================================================= */

function setText(
    selector,
    value
) {

    const element =
        $(selector);


    if (
        element
    ) {

        element.textContent =
            value;

    }

}


/* =========================================================
   NUMBER FORMAT
========================================================= */

function formatNumber(
    value
) {

    const number =
        Number(value) || 0;


    return number.toLocaleString(
        "en-US"
    );

}


/* =========================================================
   HTML SECURITY
========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
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
