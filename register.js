/* =====================================================
   FINORA REGISTER SYSTEM
   register.js
   ===================================================== */


/* =====================================================
   ELEMENTS
   ===================================================== */

const form = document.getElementById("registerForm");

const fullName = document.getElementById("fullName");
const phone = document.getElementById("phone");
const email = document.getElementById("email");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const referralCode = document.getElementById("referralCode");
const terms = document.getElementById("terms");

const createButton = document.getElementById("createButton");
const formStatus = document.getElementById("formStatus");

const nameMessage = document.getElementById("nameMessage");
const phoneMessage = document.getElementById("phoneMessage");
const emailMessage = document.getElementById("emailMessage");
const passwordMessage = document.getElementById("passwordMessage");
const confirmMessage = document.getElementById("confirmMessage");

const referralStatus =
    document.getElementById("referralStatus");

const referralMessage =
    document.getElementById("referralMessage");

const strengthBox =
    document.getElementById("passwordStrength");

const strengthBars =
    document.querySelectorAll(".strength-bar");

const strengthText =
    document.getElementById("strengthText");


/* =====================================================
   FINORA STORAGE
   ===================================================== */

const USERS_KEY = "finoraUsers";
const CURRENT_USER_KEY = "finoraCurrentUser";


/* =====================================================
   USERS
   ===================================================== */

function getUsers(){

    try{

        const saved =
            localStorage.getItem(USERS_KEY);

        if(!saved){
            return [];
        }

        const users =
            JSON.parse(saved);

        return Array.isArray(users)
            ? users
            : [];

    }catch(error){

        console.error(
            "Unable to read FINORA users:",
            error
        );

        return [];
    }
}


function saveUsers(users){

    localStorage.setItem(
        USERS_KEY,
        JSON.stringify(users)
    );
}


/* =====================================================
   ACCOUNT ID
   ===================================================== */

function generateAccountId(){

    const users = getUsers();

    let accountId;

    do{

        accountId =
            "FN" +
            Math.floor(
                10000000 +
                Math.random() * 90000000
            );

    }while(
        users.some(
            user =>
                String(user.accountId)
                .toUpperCase() ===
                accountId
        )
    );

    return accountId;
}


/* =====================================================
   PHONE
   ===================================================== */

function cleanPhone(value){

    return String(value || "")
        .replace(/\s+/g, "")
        .replace(/-/g, "");
}


function isValidUgandaPhone(value){

    return /^07\d{8}$/.test(
        cleanPhone(value)
    );
}


/* =====================================================
   EMAIL
   ===================================================== */

function isValidEmail(value){

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(String(value).trim());
}


/* =====================================================
   PASSWORD
   ===================================================== */

function getPasswordStrength(value){

    if(value.length < 6){
        return 0;
    }

    let score = 1;

    if(/[A-Z]/.test(value)){
        score++;
    }

    if(/[0-9]/.test(value)){
        score++;
    }

    if(/[^A-Za-z0-9]/.test(value)){
        score++;
    }

    return score;
}


/* =====================================================
   MESSAGES
   ===================================================== */

function showFieldMessage(
    element,
    message,
    type = "error"
){

    element.className =
        "field-message " +
        type +
        " show";

    element.textContent =
        message;
}


function clearFieldMessage(element){

    element.className =
        "field-message";

    element.textContent =
        "";
}


function showFormStatus(
    message,
    type = "error"
){

    formStatus.className =
        "form-status " +
        type +
        " show";

    formStatus.textContent =
        message;
}


function clearFormStatus(){

    formStatus.className =
        "form-status";

    formStatus.textContent =
        "";
}


/* =====================================================
   PASSWORD STRENGTH
   ===================================================== */

function updatePasswordStrength(){

    const value =
        password.value;

    if(!value){

        strengthBox.classList.remove("show");

        strengthBars.forEach(
            bar => {
                bar.style.background =
                    "rgba(255,255,255,.08)";
            }
        );

        return;
    }

    strengthBox.classList.add("show");

    const score =
        getPasswordStrength(value);

    const labels = [
        "Password must contain at least 6 characters.",
        "Weak password",
        "Fair password",
        "Good password",
        "Strong password"
    ];

    strengthText.textContent =
        labels[score];

    strengthBars.forEach(
        (bar, index) => {

            if(index < score){

                if(score === 1){

                    bar.style.background =
                        "#FF5C7A";

                }else if(score === 2){

                    bar.style.background =
                        "#F5A623";

                }else{

                    bar.style.background =
                        "#49E6A1";
                }

            }else{

                bar.style.background =
                    "rgba(255,255,255,.08)";
            }
        }
    );
}


/* =====================================================
   PASSWORD VISIBILITY
   ===================================================== */

document
.querySelectorAll(".toggle-password")
.forEach(button => {

    button.addEventListener(
        "click",
        function(){

            const target =
                document.getElementById(
                    button.dataset.target
                );

            if(target.type === "password"){

                target.type = "text";

                button.textContent = "🙈";

                button.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            }else{

                target.type = "password";

                button.textContent = "👁";

                button.setAttribute(
                    "aria-label",
                    "Show password"
                );
            }
        }
    );

});


/* =====================================================
   NAME VALIDATION
   ===================================================== */

function validateName(){

    const value =
        fullName.value.trim();

    if(value.length < 2){

        showFieldMessage(
            nameMessage,
            "Enter your full name."
        );

        fullName.classList.add("invalid");
        fullName.classList.remove("valid");

        return false;
    }

    clearFieldMessage(nameMessage);

    fullName.classList.remove("invalid");
    fullName.classList.add("valid");

    return true;
}


/* =====================================================
   PHONE VALIDATION
   ===================================================== */

function validatePhone(){

    const value =
        cleanPhone(phone.value);

    phone.value =
        value.slice(0, 10);

    if(!value){

        clearFieldMessage(phoneMessage);

        phone.classList.remove(
            "valid",
            "invalid"
        );

        return false;
    }

    if(!isValidUgandaPhone(value)){

        showFieldMessage(
            phoneMessage,
            "Enter a valid Ugandan phone number starting with 07."
        );

        phone.classList.add("invalid");
        phone.classList.remove("valid");

        return false;
    }

    clearFieldMessage(phoneMessage);

    phone.classList.remove("invalid");
    phone.classList.add("valid");

    return true;
}


/* =====================================================
   EMAIL VALIDATION
   ===================================================== */

function validateEmail(){

    const value =
        email.value.trim();

    if(!value){

        clearFieldMessage(emailMessage);

        email.classList.remove(
            "valid",
            "invalid"
        );

        return false;
    }

    if(!isValidEmail(value)){

        showFieldMessage(
            emailMessage,
            "Enter a valid email address."
        );

        email.classList.add("invalid");
        email.classList.remove("valid");

        return false;
    }

    clearFieldMessage(emailMessage);

    email.classList.remove("invalid");
    email.classList.add("valid");

    return true;
}


/* =====================================================
   PASSWORD VALIDATION
   ===================================================== */

function validatePassword(){

    const value =
        password.value;

    updatePasswordStrength();

    if(value.length < 6){

        showFieldMessage(
            passwordMessage,
            "Password must be at least 6 characters."
        );

        password.classList.add("invalid");
        password.classList.remove("valid");

        return false;
    }

    clearFieldMessage(passwordMessage);

    password.classList.remove("invalid");
    password.classList.add("valid");

    return true;
}


/* =====================================================
   CONFIRM PASSWORD
   ===================================================== */

function validateConfirmPassword(){

    const value =
        confirmPassword.value;

    if(!value){

        clearFieldMessage(confirmMessage);

        confirmPassword.classList.remove(
            "valid",
            "invalid"
        );

        return false;
    }

    if(value !== password.value){

        showFieldMessage(
            confirmMessage,
            "Passwords do not match."
        );

        confirmPassword.classList.add("invalid");
        confirmPassword.classList.remove("valid");

        return false;
    }

    if(value.length < 6){

        showFieldMessage(
            confirmMessage,
            "Password must be at least 6 characters."
        );

        confirmPassword.classList.add("invalid");
        confirmPassword.classList.remove("valid");

        return false;
    }

    clearFieldMessage(confirmMessage);

    confirmPassword.classList.remove("invalid");
    confirmPassword.classList.add("valid");

    return true;
}


/* =====================================================
   REFERRAL CODE
   ===================================================== */

function checkReferralCode(){

    const code =
        referralCode.value.trim();

    if(!code){

        referralStatus.className =
            "referral-status";

        referralStatus.textContent = "";

        referralMessage.className =
            "field-message";

        referralMessage.textContent = "";

        return true;
    }

    const users =
        getUsers();

    const exists =
        users.some(user => {

            const accountId =
                String(
                    user.accountId || ""
                ).toUpperCase();

            const userReferral =
                String(
                    user.referralCode || ""
                ).toUpperCase();

            const entered =
                code.toUpperCase();

            return (
                accountId === entered ||
                userReferral === entered
            );
        });

    if(exists){

        referralStatus.className =
            "referral-status show valid";

        referralStatus.textContent =
            "✓";

        showFieldMessage(
            referralMessage,
            "Referral code accepted.",
            "success"
        );

        return true;
    }

    referralStatus.className =
        "referral-status show invalid";

    referralStatus.textContent =
        "×";

    showFieldMessage(
        referralMessage,
        "This referral code was not found."
    );

    return false;
}


/* =====================================================
   LOAD REFERRAL FROM URL
   ===================================================== */

function loadReferralFromURL(){

    const params =
        new URLSearchParams(
            window.location.search
        );

    const ref =
        params.get("ref");

    if(ref){

        referralCode.value =
            ref.trim();

        checkReferralCode();
    }
}

loadReferralFromURL();


/* =====================================================
   LIVE VALIDATION
   ===================================================== */

fullName.addEventListener(
    "input",
    function(){

        clearFormStatus();

        validateName();
    }
);


phone.addEventListener(
    "input",
    function(){

        clearFormStatus();

        validatePhone();
    }
);


email.addEventListener(
    "input",
    function(){

        clearFormStatus();

        validateEmail();
    }
);


password.addEventListener(
    "input",
    function(){

        clearFormStatus();

        validatePassword();

        if(confirmPassword.value){
            validateConfirmPassword();
        }
    }
);


confirmPassword.addEventListener(
    "input",
    function(){

        clearFormStatus();

        validateConfirmPassword();
    }
);


referralCode.addEventListener(
    "input",
    function(){

        clearFormStatus();

        checkReferralCode();
    }
);


/* =====================================================
   SUBMIT
   ===================================================== */

form.addEventListener(
    "submit",
    function(event){

        event.preventDefault();

        clearFormStatus();


        /* ---------------------------------------------
           VALIDATE FORM
           --------------------------------------------- */

        if(!validateName()){

            showFormStatus(
                "Please enter your full name.",
                "error"
            );

            fullName.focus();

            return;
        }


        if(!validatePhone()){

            showFormStatus(
                "Please enter a valid Ugandan phone number.",
                "error"
            );

            phone.focus();

            return;
        }


        if(!validateEmail()){

            showFormStatus(
                "Please enter a valid email address.",
                "error"
            );

            email.focus();

            return;
        }


        if(!validatePassword()){

            showFormStatus(
                "Your password must contain at least 6 characters.",
                "error"
            );

            password.focus();

            return;
        }


        if(!validateConfirmPassword()){

            showFormStatus(
                "Password and Confirm Password must match.",
                "error"
            );

            confirmPassword.focus();

            return;
        }


        const referralValue =
            referralCode.value.trim();

        if(
            referralValue &&
            !checkReferralCode()
        ){

            showFormStatus(
                "The referral code entered could not be verified.",
                "error"
            );

            referralCode.focus();

            return;
        }


        if(!terms.checked){

            showFormStatus(
                "Please agree to the Terms & Conditions and Privacy Policy.",
                "error"
            );

            terms.focus();

            return;
        }


        /* ---------------------------------------------
           GET USERS
           --------------------------------------------- */

        const users =
            getUsers();


        const phoneValue =
            cleanPhone(phone.value);

        const emailValue =
            email.value
            .trim()
            .toLowerCase();


        /* ---------------------------------------------
           DUPLICATE PHONE
           --------------------------------------------- */

        const phoneExists =
            users.some(
                user =>
                    cleanPhone(
                        user.phone || ""
                    ) === phoneValue
            );

        if(phoneExists){

            showFormStatus(
                "An account with this phone number already exists.",
                "error"
            );

            phone.focus();

            return;
        }


        /* ---------------------------------------------
           DUPLICATE EMAIL
           --------------------------------------------- */

        const emailExists =
            users.some(
                user =>
                    String(
                        user.email || ""
                    ).toLowerCase() ===
                    emailValue
            );

        if(emailExists){

            showFormStatus(
                "An account with this email address already exists.",
                "error"
            );

            email.focus();

            return;
        }


        /* ---------------------------------------------
           ACCOUNT
           --------------------------------------------- */

        const accountId =
            generateAccountId();


        /* ---------------------------------------------
           CREATE USER
           --------------------------------------------- */

        const newUser = {

            accountId: accountId,

            fullName:
                fullName.value.trim(),

            name:
                fullName.value.trim(),

            phone:
                phoneValue,

            email:
                emailValue,

            password:
                password.value,

            referralCode:
                accountId,

            referredBy:
                referralValue || null,

            referralLevel:
                referralValue ? 1 : 0,

            referralCommission: {

                level1: 15,
                level2: 3,
                level3: 2

            },

            walletBalance: 0,

            cumulativeIncome: 0,

            totalDeposit: 0,

            totalWithdrawal: 0,

            registrationBonus: 0,

            loginBonus: 0,

            dailyLoginBonus: 0,

            registrationDate:
                new Date().toISOString(),

            status: "active"
        };


        /* ---------------------------------------------
           SAVE USER
           --------------------------------------------- */

        users.push(newUser);

        saveUsers(users);


        /* ---------------------------------------------
           CURRENT USER
           --------------------------------------------- */

        localStorage.setItem(
            CURRENT_USER_KEY,
            JSON.stringify({

                accountId:
                    newUser.accountId,

                fullName:
                    newUser.fullName,

                phone:
                    newUser.phone,

                email:
                    newUser.email
            })
        );


        /* ---------------------------------------------
           SUCCESS
           --------------------------------------------- */

        createButton.disabled = true;

        createButton.textContent =
            "ACCOUNT CREATED ✓";

        showFormStatus(
            "Your FINORA account has been created successfully. Redirecting to login...",
            "success"
        );


        /* ---------------------------------------------
           LOGIN
           --------------------------------------------- */

        setTimeout(
            function(){

                window.location.href =
                    "login.html";

            },
            1400
        );

    }
);
