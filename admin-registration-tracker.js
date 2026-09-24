/* =========================================================
FINORA — ADMIN REGISTRATION TRACKER

Live registration analytics

Backend endpoint:
GET /api/admin/registrations

Features:

- Real FINORA users from MongoDB
- Africa/Kampala dates and times
- 30-day registration graph
- Direct vs referral analytics
- Top referrer analytics
- Horizontal/swipeable calendar timeline
- Historical registrations
- Registration detail modal
- Full names + referral codes
- Automatic 30-second refresh
- Refresh when Admin returns to the page
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

const TIMEZONE =
"Africa/Kampala";

const DAYS_TO_DISPLAY =
30;

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

    initializeModal();

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
       Preserve the selected date when possible.
    */

    const previousSelectedDate =
        selectedDate;


    trackerData =
        data;


    /*
       First successful load selects TODAY.
    */

    if (
        !selectedDate
    ) {

        selectedDate =
            data.today;

    }


    /*
       If the selected date still exists,
       keep it.

       If it somehow falls outside the newly
       available data, return to today.
    */

    if (
        previousSelectedDate &&
        !isValidDateKey(
            previousSelectedDate
        )
    ) {

        selectedDate =
            data.today;

    }


    renderStatistics();

    renderAnalytics();

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
ANALYTICS
========================================================= */

function renderAnalytics() {

if (
    !trackerData
) {

    return;

}


renderGrowthChart();

renderTopReferrers();

renderSourceBreakdown();

}

/* =========================================================
REGISTRATION GROWTH GRAPH
========================================================= */

function renderGrowthChart() {

const container =
    $("#registrationChart");


if (
    !container
) {

    return;

}


const graphData =
    Array.isArray(
        trackerData?.graph?.data
    )
        ? trackerData.graph.data
        : [];


if (
    graphData.length ===
    0
) {

    container.innerHTML = `

        <div class="chart-loading">
            No registration data available.
        </div>

    `;

    setText(
        "#graphPeriodTotal",
        "0"
    );

    return;

}


const total =
    graphData.reduce(
        (
            sum,
            item
        ) => {

            return (
                sum +
                (
                    Number(
                        item.count
                    ) || 0
                )
            );

        },
        0
    );


setText(
    "#graphPeriodTotal",
    formatNumber(total)
);


/*
   Graph dimensions are responsive because
   the SVG uses a viewBox.
*/

const width =
    900;

const height =
    245;

const paddingLeft =
    35;

const paddingRight =
    12;

const paddingTop =
    15;

const paddingBottom =
    30;


const chartWidth =
    width -
    paddingLeft -
    paddingRight;

const chartHeight =
    height -
    paddingTop -
    paddingBottom;


const maxCount =
    Math.max(
        1,
        ...graphData.map(
            item =>
                Number(
                    item.count
                ) || 0
        )
    );


/*
   Give the chart a little vertical breathing
   room when the maximum is small.
*/

const graphMax =
    maxCount <= 3
        ? Math.max(
            3,
            maxCount
        )
        : Math.ceil(
            maxCount * 1.15
        );


const points =
    graphData.map(
        (
            item,
            index
        ) => {

            const x =
                paddingLeft +
                (
                    graphData.length === 1
                        ? chartWidth / 2
                        : (
                            index /
                            (
                                graphData.length -
                                1
                            )
                        ) *
                        chartWidth
                );


            const count =
                Number(
                    item.count
                ) || 0;


            const y =
                paddingTop +
                chartHeight -
                (
                    count /
                    graphMax
                ) *
                chartHeight;


            return {

                ...item,

                count,

                x,

                y

            };

        }
    );


/*
   Smooth-ish line using quadratic midpoint
   segments rather than a heavy chart library.
*/

const linePath =
    buildSmoothPath(
        points
    );


const areaPath =
    `
    ${linePath}
    L ${points[points.length - 1].x}
      ${paddingTop + chartHeight}
    L ${points[0].x}
      ${paddingTop + chartHeight}
    Z
    `;


const gridValues =
    buildGridValues(
        graphMax
    );


const grid =
    gridValues.map(
        value => {

            const y =
                paddingTop +
                chartHeight -
                (
                    value /
                    graphMax
                ) *
                chartHeight;


            return `

                <line
                    class="chart-grid-line"
                    x1="${paddingLeft}"
                    y1="${y}"
                    x2="${width - paddingRight}"
                    y2="${y}"
                />

                <text
                    class="chart-axis-label"
                    x="${paddingLeft - 8}"
                    y="${y + 3}"
                    text-anchor="end"
                >
                    ${escapeHTML(
                        formatNumber(value)
                    )}
                </text>

            `;

        }
    )
        .join("");


/*
   Show a few date labels along the bottom.
*/

const labelIndexes =
    getGraphLabelIndexes(
        graphData.length
    );


const labels =
    labelIndexes.map(
        index => {

            const point =
                points[index];


            return `

                <text
                    class="chart-axis-label"
                    x="${point.x}"
                    y="${height - 8}"
                    text-anchor="middle"
                >
                    ${escapeHTML(
                        formatGraphDate(
                            graphData[index].date
                        )
                    )}
                </text>

            `;

        }
    )
        .join("");


const pointMarkup =
    points.map(
        point => {

            return `

                <circle
                    class="chart-point"
                    cx="${point.x}"
                    cy="${point.y}"
                    r="3.2"
                    data-date="${escapeHTML(point.date)}"
                    data-count="${point.count}"
                />

            `;

        }
    )
        .join("");


container.innerHTML = `

    <svg
        viewBox="0 0 ${width} ${height}"
        preserveAspectRatio="none"
        role="img"
        aria-label="FINORA registration growth over the last 30 days"
    >

        ${grid}

        <path
            class="chart-area"
            d="${areaPath}"
        />

        <path
            class="chart-line"
            d="${linePath}"
        />

        ${pointMarkup}

        ${labels}

    </svg>

    <div
        class="chart-tooltip"
        id="chartTooltip"
    ></div>

`;


attachChartInteractions(
    points,
    container
);

}

/* =========================================================
BUILD SMOOTH GRAPH PATH
========================================================= */

function buildSmoothPath(
points
) {

if (
    points.length ===
    0
) {

    return "";

}


if (
    points.length ===
    1
) {

    return `
        M ${points[0].x}
          ${points[0].y}
    `;

}


let path =
    `M ${points[0].x} ${points[0].y}`;


for (
    let index = 1;
    index < points.length;
    index++
) {

    const previous =
        points[index - 1];

    const current =
        points[index];


    const midpointX =
        (
            previous.x +
            current.x
        ) / 2;


    path += `
        Q ${midpointX}
          ${previous.y}
          ${current.x}
          ${current.y}
    `;

}


return path;

}

/* =========================================================
GRAPH GRID
========================================================= */

function buildGridValues(
max
) {

const values =
    [];


if (
    max <= 3
) {

    for (
        let value = 0;
        value <= max;
        value++
    ) {

        values.push(
            value
        );

    }

    return values;

}


const step =
    Math.max(
        1,
        Math.ceil(
            max / 4
        )
    );


for (
    let value = 0;
    value <= max;
    value += step
) {

    values.push(
        value
    );

}


if (
    values[values.length - 1] !==
    max
) {

    values.push(
        max
    );

}


return values;

}

/* =========================================================
GRAPH DATE LABELS
========================================================= */

function getGraphLabelIndexes(
length
) {

if (
    length <= 5
) {

    return Array.from(
        {
            length
        },
        (
            _,
            index
        ) => index
    );

}


const indexes =
    [
        0,
        Math.floor(
            (length - 1) * 0.25
        ),
        Math.floor(
            (length - 1) * 0.5
        ),
        Math.floor(
            (length - 1) * 0.75
        ),
        length - 1
    ];


return [
    ...new Set(
        indexes
    )
];

}

function formatGraphDate(
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
            "short",

        timeZone:
            TIMEZONE
    }
)
    .format(date)
    .replace(
        " ",
        " "
    )
    .toUpperCase();

}

/* =========================================================
GRAPH INTERACTIONS
========================================================= */

function attachChartInteractions(
points,
container
) {

const tooltip =
    $("#chartTooltip");


if (
    !tooltip
) {

    return;

}


const svg =
    container.querySelector(
        "svg"
    );


const circles =
    container.querySelectorAll(
        ".chart-point"
    );


const showTooltip =
    (
        point,
        event
    ) => {

        const rect =
            svg.getBoundingClientRect();


        const xRatio =
            point.x /
            900;


        const yRatio =
            point.y /
            245;


        const x =
            xRatio *
            rect.width;


        const y =
            yRatio *
            rect.height;


        tooltip.innerHTML = `

            <strong>
                ${escapeHTML(
                    formatDateLong(
                        point.date
                    )
                )}
            </strong>

            <span>
                ${formatNumber(
                    point.count
                )}
                ${
                    point.count === 1
                        ? " registration"
                        : " registrations"
                }
            </span>

        `;


        tooltip.style.left =
            `${x}px`;

        tooltip.style.top =
            `${y}px`;

        tooltip.classList.add(
            "visible"
        );

    };


circles.forEach(
    (
        circle,
        index
    ) => {

        const point =
            points[index];


        circle.addEventListener(
            "mouseenter",
            event => {

                showTooltip(
                    point,
                    event
                );

            }
        );


        circle.addEventListener(
            "mouseleave",
            () => {

                tooltip.classList.remove(
                    "visible"
                );

            }
        );


        circle.addEventListener(
            "click",
            () => {

                selectDate(
                    point.date
                );

            }
        );

    }
);

}

/* =========================================================
TOP REFERRERS
========================================================= */

function renderTopReferrers() {

const container =
    $("#topReferrers");


if (
    !container
) {

    return;

}


const referrers =
    Array.isArray(
        trackerData?.referrals?.topReferrers
    )
        ? trackerData.referrals.topReferrers
        : [];


container.innerHTML =
    "";


if (
    referrers.length ===
    0
) {

    container.innerHTML = `

        <div class="no-referrers">
            No referral registrations yet.
        </div>

    `;

    return;

}


/*
   Display a compact top list.

   The backend deliberately returns the complete
   referrer data; the tracker keeps the dashboard
   compact by showing the first five.
*/

referrers
    .slice(
        0,
        5
    )
    .forEach(
        (
            referrer,
            index
        ) => {

            const row =
                document.createElement(
                    "div"
                );


            row.className =
                "referrer-row";


            const initials =
                getInitials(
                    referrer.fullName
                );


            row.innerHTML = `

                <span class="referrer-rank">
                    ${index + 1}
                </span>

                <span class="referrer-avatar">
                    ${escapeHTML(initials)}
                </span>

                <span class="referrer-info">

                    <span class="referrer-name">
                        ${escapeHTML(
                            referrer.fullName ||
                            "FINORA User"
                        )}
                    </span>

                    <span class="referrer-code">
                        ${escapeHTML(
                            referrer.referralCode ||
                            "NO CODE"
                        )}
                    </span>

                </span>

                <span class="referrer-count">
                    ${formatNumber(
                        referrer.count
                    )}
                </span>

            `;


            container.appendChild(
                row
            );

        }
    );

}

/* =========================================================
DIRECT / REFERRAL BREAKDOWN
========================================================= */

function renderSourceBreakdown() {

const breakdown =
    trackerData?.referrals?.breakdown ||
    trackerData?.statistics ||
    {};


const direct =
    Number(
        breakdown.direct ??
        breakdown.directRegistrations ??
        0
    ) || 0;


const referral =
    Number(
        breakdown.referral ??
        breakdown.referralRegistrations ??
        0
    ) || 0;


const total =
    direct +
    referral;


const directPercent =
    total > 0
        ? (
            direct /
            total
        ) *
        100
        : 0;


const referralPercent =
    total > 0
        ? (
            referral /
            total
        ) *
        100
        : 0;


const directBar =
    document.querySelector(
        ".source-direct"
    );


const referralBar =
    document.querySelector(
        ".source-referral"
    );


if (
    directBar
) {

    directBar.style.width =
        `${directPercent}%`;

}


if (
    referralBar
) {

    referralBar.style.width =
        `${referralPercent}%`;

}


setText(
    "#directBreakdown",
    formatNumber(
        direct
    )
);


setText(
    "#referralBreakdown",
    formatNumber(
        referral
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


const currentSelectedDate =
    selectedDate;


scroller.innerHTML =
    "";


/*
   Always render the latest 30 CALENDAR dates.

   This means dates with zero registrations are still
   visible and selectable.
*/

const dates =
    buildLatestCalendarDates(
        DAYS_TO_DISPLAY
    );


dates.forEach(
    dateKey => {

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


        if (
            dateKey ===
            trackerData.today
        ) {

            button.classList.add(
                "today"
            );

        }


        if (
            dateKey ===
            currentSelectedDate
        ) {

            button.classList.add(
                "selected"
            );

        }


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
                        TIMEZONE
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
                        TIMEZONE
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
                        TIMEZONE
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
                REGISTERED
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


const dateButtons =
    document.querySelectorAll(
        ".date-item"
    );


dateButtons.forEach(
    button => {

        button.classList.toggle(
            "selected",
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


setText(
    "#selectedDate",
    formatDateLong(
        selectedDate
    )
);


setText(
    "#selectedCount",
    formatNumber(
        registrations.length
    )
);


setText(
    "#selectedKicker",
    selectedDate ===
    trackerData.today
        ? "TODAY"
        : "SELECTED DATE"
);


const list =
    $("#registrationList");


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


registrations.forEach(
    (
        registration,
        index
    ) => {

        const row =
            document.createElement(
                "button"
            );


        row.type =
            "button";


        row.className =
            "registration-row";


        const name =
            registration.fullName ||
            "FINORA User";


        const referralCode =
            registration.referralCode ||
            "NO CODE";


        const registrationType =
            String(
                registration.registrationType ||
                "direct"
            )
                .toLowerCase();


        const typeLabel =
            registrationType ===
            "referral"
                ? "REFERRAL"
                : "DIRECT";


        row.innerHTML = `

            <span class="registration-number">
                ${formatNumber(
                    index + 1
                )}
            </span>

            <span class="registration-main">

                <span class="registration-name">
                    ${escapeHTML(name)}
                </span>

                <span class="registration-meta">

                    <span class="registration-code">
                        ${escapeHTML(
                            referralCode
                        )}
                    </span>

                    <span
                        class="registration-type ${registrationType}"
                    >
                        ${typeLabel}
                    </span>

                </span>

            </span>

            <span class="registration-arrow">
                ›
            </span>

        `;


        row.addEventListener(
            "click",
            () => {

                openRegistrationModal(
                    registration
                );

            }
        );


        list.appendChild(
            row
        );

    }
);

}

/* =========================================================
REGISTRATION MODAL
========================================================= */

function initializeModal() {

const closeButton =
    $("#modalClose");


const backdrop =
    $("#modalBackdrop");


if (
    closeButton
) {

    closeButton.addEventListener(
        "click",
        closeRegistrationModal
    );

}


if (
    backdrop
) {

    backdrop.addEventListener(
        "click",
        closeRegistrationModal
    );

}


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            closeRegistrationModal();

        }

    }
);

}

function openRegistrationModal(
registration
) {

if (
    !registration
) {

    return;

}


const modal =
    $("#registrationModal");


if (
    !modal
) {

    return;

}


setText(
    "#modalUserName",
    registration.fullName ||
    "FINORA User"
);


setText(
    "#modalReferralCode",
    registration.referralCode ||
    "NO CODE"
);


const createdAt =
    registration.createdAt
        ? new Date(
            registration.createdAt
        )
        : null;


if (
    createdAt &&
    !Number.isNaN(
        createdAt.getTime()
    )
) {

    setText(
        "#modalRegisteredDate",
        formatDateTimeDate(
            createdAt
        )
    );


    setText(
        "#modalRegisteredTime",
        formatKampalaTime(
            createdAt
        )
    );

} else {

    setText(
        "#modalRegisteredDate",
        "—"
    );


    setText(
        "#modalRegisteredTime",
        "—"
    );

}


const type =
    String(
        registration.registrationType ||
        "direct"
    )
        .toLowerCase();


setText(
    "#modalRegistrationType",
    type ===
    "referral"
        ? "REFERRAL"
        : "DIRECT"
);


const referrerDetail =
    $("#modalReferrerDetail");


const referrerName =
    findReferrerName(
        registration.referredByCode
    );


if (
    type === "referral" &&
    registration.referredByCode
) {

    if (
        referrerDetail
    ) {

        referrerDetail.style.display =
            "";

    }


    setText(
        "#modalReferrerName",
        referrerName ||
        registration.referredByCode
    );

} else {

    if (
        referrerDetail
    ) {

        referrerDetail.style.display =
            "none";

    }

}


modal.classList.add(
    "open"
);


modal.setAttribute(
    "aria-hidden",
    "false"
);


document.body.style.overflow =
    "hidden";

}

function closeRegistrationModal() {

const modal =
    $("#registrationModal");


if (
    !modal
) {

    return;

}


modal.classList.remove(
    "open"
);


modal.setAttribute(
    "aria-hidden",
    "true"
);


document.body.style.overflow =
    "";

}

/* =========================================================
FIND REFERRER NAME
========================================================= */

function findReferrerName(
referralCode
) {

if (
    !referralCode ||
    !trackerData?.referrals?.topReferrers
) {

    return null;

}


const normalized =
    String(
        referralCode
    )
        .trim()
        .toUpperCase();


const referrer =
    trackerData.referrals.topReferrers.find(
        item =>
            String(
                item.referralCode ||
                ""
            )
                .trim()
                .toUpperCase() ===
            normalized
    );


return referrer
    ? referrer.fullName
    : null;

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
            TIMEZONE
    }
)
    .format(date)
    .toUpperCase();

}

function formatDateTimeDate(
date
) {

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
            TIMEZONE
    }
)
    .format(date)
    .toUpperCase();

}

function formatKampalaTime(
date
) {

return new Intl.DateTimeFormat(
    "en-GB",
    {
        hour:
            "2-digit",

        minute:
            "2-digit",

        hour12:
            true,

        timeZone:
            TIMEZONE
    }
)
    .format(date)
    .toUpperCase();

}

/* =========================================================
DATE VALIDATION
========================================================= */

function isValidDateKey(
dateKey
) {

if (
    !trackerData ||
    !trackerData.today
) {

    return false;

}


const dates =
    buildLatestCalendarDates(
        DAYS_TO_DISPLAY
    );


return dates.includes(
    dateKey
);

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


if (
    !liveStatus
) {

    return;

}


liveStatus.classList.remove(
    "loading",
    "offline"
);


if (
    status ===
    "live"
) {

    liveStatus.innerHTML = `

        <span class="live-dot"></span>

        <span class="live-label">
            LIVE
        </span>

    `;

    return;

}


if (
    status ===
    "loading"
) {

    liveStatus.classList.add(
        "loading"
    );


    liveStatus.innerHTML = `

        <span class="live-dot loading"></span>

        <span class="live-label">
            UPDATING
        </span>

    `;

    return;

}


liveStatus.classList.add(
    "offline"
);


liveStatus.innerHTML = `

    <span class="live-dot offline"></span>

    <span class="live-label">
        OFFLINE
    </span>

`;

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
INITIALS
========================================================= */

function getInitials(
fullName
) {

const words =
    String(
        fullName ||
        "FINORA User"
    )
        .trim()
        .split(
            /\s+/
        )
        .filter(
            Boolean
        );


if (
    words.length ===
    0
) {

    return "F";

}


if (
    words.length ===
    1
) {

    return words[0]
        .slice(
            0,
            2
        )
        .toUpperCase();

}


return (
    words[0][0] +
    words[words.length - 1][0]
)
    .toUpperCase();

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
