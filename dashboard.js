/* =========================================================
   FINORA DASHBOARD JAVASCRIPT
   Premium Investment Dashboard
   ========================================================= */


/* =========================================================
   WAIT FOR DOM
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    initHamburgerMenu();
    initNotifications();
    initBalanceToggle();
    initBannerSlider();
    initDashboardLinks();
    initActiveNavigation();
    initYear();

});


/* =========================================================
   HAMBURGER MENU
   ---------------------------------------------------------
   The hamburger menu contains ONLY secondary/account
   information pages.
========================================================= */

function initHamburgerMenu() {

    const menuButton =
        document.getElementById("menuButton");

    const menuPanel =
        document.getElementById("menuPanel");

    const menuOverlay =
        document.getElementById("menuOverlay");

    const closeMenu =
        document.getElementById("closeMenu");

    if (!menuButton || !menuPanel) {
        return;
    }


    function openMenu() {

        menuPanel.classList.add("open");

        if (menuOverlay) {
            menuOverlay.classList.add("open");
        }

        menuButton.setAttribute(
            "aria-expanded",
            "true"
        );

        document.body.classList.add(
            "menu-open"
        );
    }


    function closeMenuPanel() {

        menuPanel.classList.remove("open");

        if (menuOverlay) {
            menuOverlay.classList.remove("open");
        }

        menuButton.setAttribute(
            "aria-expanded",
            "false"
        );

        document.body.classList.remove(
            "menu-open"
        );
    }


    menuButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            if (
                menuPanel.classList.contains("open")
            ) {

                closeMenuPanel();

            } else {

                openMenu();

            }

        }
    );


    if (closeMenu) {

        closeMenu.addEventListener(
            "click",
            function () {

                closeMenuPanel();

            }
        );

    }


    if (menuOverlay) {

        menuOverlay.addEventListener(
            "click",
            function () {

                closeMenuPanel();

            }
        );

    }


    /* Close menu when selecting a menu link */

    const menuLinks =
        menuPanel.querySelectorAll("a");

    menuLinks.forEach(function (link) {

        link.addEventListener(
            "click",
            function () {

                closeMenuPanel();

            }
        );

    });


    /* ESC closes the menu */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                menuPanel.classList.contains("open")
            ) {

                closeMenuPanel();

            }

        }
    );

}


/* =========================================================
   NOTIFICATIONS
========================================================= */

function initNotifications() {

    const notificationButton =
        document.getElementById(
            "notificationButton"
        );

    const notificationPanel =
        document.getElementById(
            "notificationPanel"
        );

    const closeNotifications =
        document.getElementById(
            "closeNotifications"
        );

    if (
        !notificationButton ||
        !notificationPanel
    ) {
        return;
    }


    function openNotifications() {

        notificationPanel.classList.add(
            "open"
        );

        notificationPanel.setAttribute(
            "aria-hidden",
            "false"
        );

    }


    function closeNotificationPanel() {

        notificationPanel.classList.remove(
            "open"
        );

        notificationPanel.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    notificationButton.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            if (
                notificationPanel.classList.contains(
                    "open"
                )
            ) {

                closeNotificationPanel();

            } else {

                openNotifications();

            }

        }
    );


    if (closeNotifications) {

        closeNotifications.addEventListener(
            "click",
            function () {

                closeNotificationPanel();

            }
        );

    }


    /* Prevent clicks inside panel from closing it */

    notificationPanel.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

        }
    );


    /* Click outside notification panel */

    document.addEventListener(
        "click",
        function () {

            closeNotificationPanel();

        }
    );

}


/* =========================================================
   WALLET BALANCE VISIBILITY
========================================================= */

function initBalanceToggle() {

    const balanceElement =
        document.getElementById(
            "walletBalance"
        );

    const balanceToggle =
        document.getElementById(
            "balanceToggle"
        );

    if (
        !balanceElement ||
        !balanceToggle
    ) {
        return;
    }


    let balanceVisible = true;


    balanceToggle.addEventListener(
        "click",
        function () {

            balanceVisible =
                !balanceVisible;


            if (balanceVisible) {

                balanceElement.classList.remove(
                    "balance-hidden"
                );

                balanceToggle.setAttribute(
                    "aria-label",
                    "Hide wallet balance"
                );

            } else {

                balanceElement.classList.add(
                    "balance-hidden"
                );

                balanceToggle.setAttribute(
                    "aria-label",
                    "Show wallet balance"
                );

            }

        }
    );

}


/* =========================================================
   HERO BANNER SLIDER
   ---------------------------------------------------------
   The dashboard reference uses multiple banner slides.
========================================================= */

function initBannerSlider() {

    const slides =
        document.querySelectorAll(
            ".hero-slide"
        );

    const dots =
        document.querySelectorAll(
            ".hero-dot"
        );

    if (!slides.length) {
        return;
    }


    let currentSlide = 0;

    let sliderTimer;


    function showSlide(index) {

        if (
            index < 0 ||
            index >= slides.length
        ) {
            return;
        }


        slides.forEach(
            function (slide, slideIndex) {

                slide.classList.toggle(
                    "active",
                    slideIndex === index
                );

            }
        );


        dots.forEach(
            function (dot, dotIndex) {

                dot.classList.toggle(
                    "active",
                    dotIndex === index
                );

            }
        );


        currentSlide = index;

    }


    function nextSlide() {

        let next =
            currentSlide + 1;

        if (next >= slides.length) {

            next = 0;

        }

        showSlide(next);

    }


    function startSlider() {

        if (slides.length <= 1) {
            return;
        }

        sliderTimer =
            setInterval(
                nextSlide,
                5000
            );

    }


    function resetSlider() {

        clearInterval(sliderTimer);

        startSlider();

    }


    dots.forEach(
        function (dot, index) {

            dot.addEventListener(
                "click",
                function () {

                    showSlide(index);

                    resetSlider();

                }
            );

        }
    );


    showSlide(0);

    startSlider();


    /* Pause while the user is touching/hovering */

    const hero =
        document.querySelector(
            ".hero-banner"
        );

    if (hero) {

        hero.addEventListener(
            "mouseenter",
            function () {

                clearInterval(
                    sliderTimer
                );

            }
        );


        hero.addEventListener(
            "mouseleave",
            function () {

                startSlider();

            }
        );

    }

}


/* =========================================================
   DASHBOARD LINKS
   ---------------------------------------------------------
   Prevent accidental double taps on action links.
========================================================= */

function initDashboardLinks() {

    const actionLinks =
        document.querySelectorAll(
            ".quick-action, " +
            ".hero-button, " +
            ".wallet-action, " +
            ".bottom-nav-item"
        );


    actionLinks.forEach(
        function (link) {

            link.addEventListener(
                "click",
                function () {

                    link.classList.add(
                        "clicked"
                    );


                    setTimeout(
                        function () {

                            link.classList.remove(
                                "clicked"
                            );

                        },
                        250
                    );

                }
            );

        }
    );

}


/* =========================================================
   BOTTOM NAVIGATION
========================================================= */

function initActiveNavigation() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();


    const navigationItems =
        document.querySelectorAll(
            ".bottom-nav-item"
        );


    navigationItems.forEach(
        function (item) {

            const href =
                item.getAttribute("href");


            if (!href) {
                return;
            }


            const targetPage =
                href
                    .split("/")
                    .pop()
                    .toLowerCase();


            if (
                targetPage === currentPage ||
                (
                    currentPage === "" &&
                    targetPage === "dashboard.html"
                )
            ) {

                item.classList.add(
                    "active"
                );

            }

        }
    );

}


/* =========================================================
   CURRENT YEAR
========================================================= */

function initYear() {

    const yearElements =
        document.querySelectorAll(
            "[data-current-year]"
        );


    yearElements.forEach(
        function (element) {

            element.textContent =
                new Date().getFullYear();

        }
    );

}


/* =========================================================
   SMALL INTERACTION EFFECT
========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest(
                "button, .quick-action, " +
                ".hero-button, .bottom-nav-item"
            );


        if (!button) {
            return;
        }


        button.classList.add(
            "finora-pressed"
        );


        setTimeout(
            function () {

                button.classList.remove(
                    "finora-pressed"
                );

            },
            180
        );

    }
);
