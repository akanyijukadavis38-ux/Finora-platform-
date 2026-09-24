/* =========================================================
   FINORA — ADMIN REGISTRATION TRACKER
   ---------------------------------------------------------
   Live registration activity

   Backend endpoint:
   GET /api/admin/registrations

   Features:
   - Uses real FINORA users from MongoDB
   - Uses Africa/Kampala calendar dates
   - Shows actual registration dates
   - Horizontal/swipeable date timeline
   - Shows zero-registration days
   - Shows full names only
   - Today / 7 Days / 30 Days statistics
   - Direct / Referral statistics
   - Automatically refreshes every 30 seconds
   - Refreshes when Admin returns to the page
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const API_BASE =
    "https://finora-platform.onrender.com";

const REGISTRATION_ENDPOINT =
    `${API_BASE}/api/admin/registrations`;

const REFRESH_INTERVAL =
    30 * 1000;


/* =========================================================
   STATE
========================================================= */

let trackerData =
    null;

let selectedDate =
    null;

let refreshTimer =
    null;

let isLoading =
    false;


/* =========================================================
   DOM HELPER
========================================================= */

function $(selector) {

    return document.querySelector(
        selector
    );

}


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

    await loadRegistrationTracker();

    startAutoRefresh();

}


/* =========================================================
   LOAD REGISTRATION DATA
========================================================= */

async function loadRegistrationTracker() {

    /*
       Prevent two requests from running
       at the exact same time.
    */

    if (
        isLoading
    ) {

        return;

    }


    isLoading =
        true;


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

            showError(
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
                `Server returned HTTP ${response.status}`
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
                "FINORA could not load registration data."
            );

        }


        /*
           Save the latest real backend data.
        */

        trackerData =
            data;


        /*
           If this is the first successful load,
           automatically select TODAY.
        */

        if (
            !selectedDate
        ) {

            selectedDate =
                data.today;

        }


        /*
           Update all sections.
        */

        renderStatistics();

        renderDateTimeline();

        renderSelectedDate();

        setLiveStatus(
            "live"
        );


    } catch (error) {

        console.error(
            "❌ FINORA REGISTRATION TRACKER ERROR:",
            error
        );


        setLiveStatus(
            "offline"
        );


        /*
           Only show the full error screen if
           we do not already have usable data.

           This prevents a temporary refresh problem
           from unnecessarily destroying the current
           registration list.
        */

        if (
            !trackerData
        ) {

            showError(
                "Unable to load registration activity. Please try again."
            );

        }

    } finally {

        isLoading =
            false;

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


    const statistics =
        trackerData.statistics;


    setText(
        "#totalRegistered",
        formatNumber(
            statistics.totalRegistered
        )
    );


    setText(
        "#todayRegistered",
        formatNumber(
            statistics.today
        )
    );


    setText(
        "#last7Days",
        formatNumber(
            statistics.last7Days
        )
    );


    setText(
        "#last30Days",
        formatNumber(
            statistics.last30Days
        )
    );


    setText(
        "#directRegistrations",
        formatNumber(
            statistics.directRegistrations
        )
    );


    setText(
        "#referralRegistrations",
        formatNumber(
            statistics.referralRegistrations
        )
    );

}


/* =========================================================
   DATE TIMELINE
========================================================= */

function renderDateTimeline() {

    const scroller =
        $("#dateScroller");


    if (
        !scroller ||
        !trackerData
    ) {

        return;

    }


    /*
       Remember the currently selected date
       before rebuilding the timeline.
    */

    const currentSelectedDate =
        selectedDate;


    scroller.innerHTML =
        "";


    /*
       Generate the latest 30 CALENDAR dates.

       This is important:

       We do NOT only show dates where someone
       registered.

       Therefore:

       24 SEPTEMBER — 6
       23 SEPTEMBER — 2
       22 SEPTEMBER — 0
       21 SEPTEMBER — 4

       etc.

       Zero-registration days remain visible.
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


            const count =
                Number(
                    dateInfo.count ||
                    0
                );


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "date-item";


            button.dataset.date =
                dateKey;


            /*
               TODAY
            */

            if (
                dateKey ===
                trackerData.today
            ) {

                button.classList.add(
                    "today"
                );

            }


            /*
               SELECTED DATE
            */

            if (
                dateKey ===
                currentSelectedDate
            ) {

                button.classList.add(
                    "selected"
                );

            }


            /*
               Date display.
            */

            const date =
                parseDateKey(
                    dateKey
                );


            const month =
                new Intl.DateTimeFormat(
                    "en-GB",
                    {
                        month:
                            "short",
                        timeZone:
                            "Africa/Kampala"
                    }
                )
                    .format(date)
                    .toUpperCase();


            const day =
                new Intl.DateTimeFormat(
                    "en-GB",
                    {
                        day:
                            "2-digit",
                        timeZone:
                            "Africa/Kampala"
                    }
                )
                    .format(date);


            const weekday =
                new Intl.DateTimeFormat(
                    "en-GB",
                    {
                        weekday:
                            "short",
                        timeZone:
                            "Africa/Kampala"
                    }
                )
                    .format(date)
                    .toUpperCase();


            button.innerHTML = `

                <span class="date-weekday">
                    ${escapeHTML(weekday)}
                </span>

                <span class="date-day">
                    ${escapeHTML(day)}
                </span>

                <span class="date-month">
                    ${escapeHTML(month)}
                </span>

                <span class="date-registration-count">
                    ${formatNumber(count)}
                </span>

                <span class="date-registration-label">
                    ${
                        count === 1
                            ? "REGISTERED"
                            : "REGISTERED"
                    }
                </span>

                ${
                    dateKey ===
                    trackerData.today
                        ? `
                            <span class="today-badge">
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


            scroller.appendChild(
                button
            );

        }
    );


    /*
       Put the selected date into view.
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
   BUILD LATEST CALENDAR DATES
========================================================= */

function buildLatestCalendarDates(
    numberOfDays
) {

    const dates =
        [];


    if (
        !trackerData ||
        !trackerData.today
    ) {

        return dates;

    }


    const today =
        parseDateKey(
            trackerData.today
        );


    for (
        let index = 0;
        index < numberOfDays;
        index++
    ) {

        const date =
            new Date(
                today
            );


        date.setUTCDate(
            date.getUTCDate() -
            index
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
   GET DATE INFORMATION
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


    /*
       A date that has no registrations
       still needs a valid object.
    */

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
       Update the selected visual state.
    */

    const dateButtons =
        document.querySelectorAll(
            ".date-item"
        );


    dateButtons.forEach(
        (button) => {

            button.classList.toggle(
                "selected",
                button.dataset.date ===
                dateKey
            );

        }
    );


    /*
       Update the selected-date section.
    */

    renderSelectedDate();


    /*
       Keep the selected date visible
       horizontally.
    */

    scrollDateIntoView(
        dateKey
    );

}


/* =========================================================
   SELECTED DATE REGISTRATIONS
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


    /*
       Selected date heading.
    */

    setText(
        "#selectedDate",
        formatDateLong(
            selectedDate
        )
    );


    /*
       Selected date count.
    */

    setText(
        "#selectedCount",
        formatNumber(
            registrations.length
        )
    );


    /*
       Update kicker.

       TODAY gets a special label.
    */

    setText(
        "#selectedKicker",
        selectedDate ===
        trackerData.today
            ? "TODAY"
            : "SELECTED DATE"
    );


    /*
       Registration names container.
    */

    const list =
        $("#registrationList");


    if (
        !list
    ) {

        return;

    }


    list.innerHTML =
        "";


    /*
       No registrations on this date.
    */

    if (
        registrations.length ===
        0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "empty-state";


        empty.innerHTML = `

            <div class="empty-symbol">
                ✦
            </div>

            <strong>
                No registrations yet
            </strong>

            <span>
                No FINORA users registered
                on this date.
            </span>

        `;


        list.appendChild(
            empty
        );


        return;

    }


    /*
       Show FULL NAMES ONLY.

       We deliberately do NOT show:

       - phone
       - email
       - referral code
       - user ID
       - balance
       - deposit
       - status

       Those details already belong
       in the Users section.
    */

    registrations.forEach(
        (registration) => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "registration-row";


            const name =
                registration.fullName ||
                "FINORA User";


            row.innerHTML = `

                <span class="registration-number">
                    ${formatNumber(
                        registrations.indexOf(
                            registration
                        ) + 1
                    )}
                </span>

                <span class="registration-name">
                    ${escapeHTML(name)}
                </span>

            `;


            list.appendChild(
                row
            );

        }
    );

}


/* =========================================================
   SCROLL SELECTED DATE INTO VIEW
========================================================= */

function scrollDateIntoView(
    dateKey
) {

    const button =
        document.querySelector(
            `.date-item[data-date="${dateKey}"]`
        );


    if (
        !button
    ) {

        return;

    }


    button.scrollIntoView(
        {
            behavior:
                "smooth",

            block:
                "nearest",

            inline:
                "center"
        }
    );

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

                loadRegistrationTracker();

            },
            REFRESH_INTERVAL
        );

}


/* =========================================================
   REFRESH WHEN PAGE BECOMES VISIBLE
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
            day:
                "2-digit",

            month:
                "long",

            year:
                "numeric",

            timeZone:
                "Africa/Kampala"
        }
    )
        .format(date)
        .toUpperCase();

}


/* =========================================================
   LIVE STATUS
========================================================= */

function setLiveStatus(
    status
) {

    const liveStatus =
        document.querySelector(
            ".live-status"
        );


    const liveDot =
        document.querySelector(
            ".live-dot"
        );


    if (
        !liveStatus ||
        !liveDot
    ) {

        return;

    }


    liveStatus.classList.remove(
        "loading",
        "offline"
    );


    liveDot.classList.remove(
        "loading",
        "offline"
    );


    if (
        status ===
        "live"
    ) {

        /*
           Restore normal LIVE display.
        */

        liveStatus.textContent =
            "";


        const dot =
            document.createElement(
                "span"
            );


        dot.className =
            "live-dot";


        liveStatus.appendChild(
            dot
        );


        liveStatus.appendChild(
            document.createTextNode(
                " LIVE"
            )
        );


        return;

    }


    if (
        status ===
        "loading"
    ) {

        liveStatus.classList.add(
            "loading"
        );


        liveDot.classList.add(
            "loading"
        );


        /*
           Keep the label simple.
        */

        liveStatus.lastChild.textContent =
            " UPDATING";

        return;

    }


    /*
       Offline/error state.
    */

    liveStatus.classList.add(
        "offline"
    );


    liveDot.classList.add(
        "offline"
    );


    liveStatus.lastChild.textContent =
        " OFFLINE";

}


/* =========================================================
   ERROR STATE
========================================================= */

function showError(
    message
) {

    const list =
        $("#registrationList");


    if (
        !list
    ) {

        return;

    }


    list.innerHTML = `

        <div class="error-state">

            <div class="error-symbol">
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
                id="retryRegistrationTracker"
            >
                TRY AGAIN
            </button>

        </div>

    `;


    const retry =
        $("#retryRegistrationTracker");


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
   HTML ESCAPING
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
