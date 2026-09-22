document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://finora-platform.onrender.com";

  const loader = document.getElementById("pageLoader");
  const message = document.getElementById("message");

  const walletBalance = document.getElementById("walletBalance");
  const amountInput = document.getElementById("amount");

  const mobileNetwork = document.getElementById("mobileNetwork");
  const registeredNumber = document.getElementById("registeredNumber");

  const summaryAmount = document.getElementById("summaryAmount");
  const summaryFee = document.getElementById("summaryFee");
  const summaryReceive = document.getElementById("summaryReceive");

  const submitWithdraw = document.getElementById("submitWithdraw");

  const MIN_WITHDRAWAL = 4000;
  const WITHDRAWAL_RATE = 0.15;

  let currentBalance = 0;
  let userPhone = "";

  function formatUGX(amount) {
    return `UGX ${Number(amount || 0).toLocaleString("en-US")}`;
  }

  function showMessage(text, type = "info") {
    if (!message) return;

    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = "block";
    message.hidden = false;

    message.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }

  function clearMessage() {
    if (!message) return;

    message.textContent = "";
    message.className = "message";
    message.style.display = "none";
    message.hidden = true;
  }

  function hideLoader() {
    if (!loader) return;

    loader.classList.add("hidden");

    setTimeout(() => {
      loader.style.display = "none";
    }, 350);
  }

  function normalizePhone(phone) {
    if (!phone) return "";

    let value = String(phone)
      .trim()
      .replace(/\s+/g, "");

    if (value.startsWith("+256")) {
      value = "0" + value.substring(4);
    } else if (value.startsWith("256")) {
      value = "0" + value.substring(3);
    }

    return value;
  }

  /*
   * Uganda mobile ranges used by FINORA.
   *
   * MTN:
   * 031, 039, 076, 077, 078, 079
   *
   * Airtel:
   * 070, 074, 075
   *
   * The number must still be a valid 10-digit
   * Uganda domestic mobile number.
   */
  function detectNetwork(phone) {
    const normalized = normalizePhone(phone);

    if (!/^0\d{9}$/.test(normalized)) {
      return null;
    }

    const prefix = normalized.substring(0, 3);

    const mtnPrefixes = [
      "031",
      "039",
      "076",
      "077",
      "078",
      "079"
    ];

    const airtelPrefixes = [
      "070",
      "074",
      "075"
    ];

    if (mtnPrefixes.includes(prefix)) {
      return "MTN";
    }

    if (airtelPrefixes.includes(prefix)) {
      return "Airtel";
    }

    return null;
  }

  function getUserPhone(user) {
    return normalizePhone(
      user?.phone ||
      user?.phoneNumber ||
      user?.mobile ||
      user?.mobileNumber ||
      user?.telephone ||
      user?.contact ||
      ""
    );
  }

  function updateSummary() {
    const amount = Number(amountInput?.value || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      summaryAmount.textContent = formatUGX(0);
      summaryFee.textContent = formatUGX(0);
      summaryReceive.textContent = formatUGX(0);
      return;
    }

    const fee = amount * WITHDRAWAL_RATE;
    const receive = amount - fee;

    summaryAmount.textContent = formatUGX(amount);
    summaryFee.textContent = formatUGX(fee);
    summaryReceive.textContent = formatUGX(receive);
  }

  /*
   * Small FINORA explanatory popup.
   * It is created only when needed, so no HTML
   * change is required in withdraw.html.
   */
  function showWithdrawalPopup(text) {
    const existing =
      document.getElementById("finoraWithdrawalPopup");

    if (existing) {
      existing.remove();
    }

    const overlay = document.createElement("div");

    overlay.id = "finoraWithdrawalPopup";

    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.zIndex = "99999";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.padding = "20px";
    overlay.style.background = "rgba(0, 0, 0, 0.68)";
    overlay.style.boxSizing = "border-box";

    const box = document.createElement("div");

    box.style.width = "100%";
    box.style.maxWidth = "360px";
    box.style.background =
      "linear-gradient(145deg, #120918, #08050b)";
    box.style.border =
      "1px solid rgba(234,60,255,0.45)";
    box.style.borderRadius = "18px";
    box.style.padding = "22px";
    box.style.boxSizing = "border-box";
    box.style.boxShadow =
      "0 20px 60px rgba(0,0,0,0.55)";
    box.style.textAlign = "center";

    const title = document.createElement("div");

    title.textContent = "Withdrawal Notice";

    title.style.fontFamily =
      "Times New Roman, serif";
    title.style.fontSize = "21px";
    title.style.fontWeight = "700";
    title.style.color = "#ffffff";
    title.style.marginBottom = "12px";

    const textElement = document.createElement("div");

    textElement.textContent = text;

    textElement.style.fontFamily =
      "Arial, sans-serif";
    textElement.style.fontSize = "14px";
    textElement.style.lineHeight = "1.55";
    textElement.style.color = "#ddd5e2";
    textElement.style.marginBottom = "20px";

    const okButton = document.createElement("button");

    okButton.type = "button";
    okButton.textContent = "OK";

    okButton.style.width = "100%";
    okButton.style.border = "0";
    okButton.style.borderRadius = "12px";
    okButton.style.padding = "12px 18px";
    okButton.style.background =
      "linear-gradient(135deg, #EA3CFF, #9E18BD)";
    okButton.style.color = "#ffffff";
    okButton.style.fontSize = "15px";
    okButton.style.fontWeight = "700";
    okButton.style.cursor = "pointer";

    function closePopup() {
      overlay.remove();
    }

    okButton.addEventListener(
      "click",
      closePopup
    );

    overlay.addEventListener(
      "click",
      (event) => {
        if (event.target === overlay) {
          closePopup();
        }
      }
    );

    box.appendChild(title);
    box.appendChild(textElement);
    box.appendChild(okButton);

    overlay.appendChild(box);

    document.body.appendChild(overlay);
  }

  async function loadUser() {
    try {
      const response = await fetch(
        `${API_BASE}/api/users/me`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json"
          }
        }
      );

      if (response.status === 401) {
        window.location.href = "login.html";
        return false;
      }

      if (!response.ok) {
        throw new Error(
          "Unable to load your account details."
        );
      }

      const data = await response.json();
      const user =
        data?.user ||
        data?.data ||
        data;

      currentBalance = Number(
        user?.balance ??
        user?.walletBalance ??
        user?.wallet ??
        0
      );

      userPhone = getUserPhone(user);

      walletBalance.textContent =
        formatUGX(currentBalance);

      if (userPhone) {
        registeredNumber.textContent =
          userPhone;

        const network =
          detectNetwork(userPhone);

        mobileNetwork.textContent =
          network || "Mobile Money";
      } else {
        registeredNumber.textContent =
          "Number unavailable";

        mobileNetwork.textContent =
          "Not detected";
      }

      return true;

    } catch (error) {
      console.error(
        "FINORA account error:",
        error
      );

      showMessage(
        error.message ||
        "We could not load your wallet details.",
        "error"
      );

      return false;
    }
  }

  function validateAmount() {
    const rawValue =
      amountInput?.value?.trim() || "";

    if (!rawValue) {
      showMessage(
        "Please enter the amount you want to withdraw.",
        "error"
      );
      return null;
    }

    const amount = Number(rawValue);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      showMessage(
        "Please enter a valid withdrawal amount.",
        "error"
      );
      return null;
    }

    if (amount < MIN_WITHDRAWAL) {
      showMessage(
        `Minimum withdrawal is ${formatUGX(
          MIN_WITHDRAWAL
        )}.`,
        "error"
      );
      return null;
    }

    if (
      Math.round(amount * 100) !==
      amount * 100
    ) {
      showMessage(
        "Please enter an amount with no more than 2 decimal places.",
        "error"
      );
      return null;
    }

    if (amount > currentBalance) {
      showMessage(
        `Insufficient funds. Your available balance is ${formatUGX(
          currentBalance
        )}.`,
        "error"
      );
      return null;
    }

    if (!userPhone) {
      showMessage(
        "Your registered Mobile Money number could not be detected.",
        "error"
      );
      return null;
    }

    const network =
      detectNetwork(userPhone);

    if (!network) {
      showMessage(
        "Your registered Mobile Money number could not be identified as MTN or Airtel.",
        "error"
      );
      return null;
    }

    return amount;
  }

  async function submitWithdrawal() {
    clearMessage();

    const amount =
      validateAmount();

    if (amount === null) {
      return;
    }

    if (submitWithdraw.disabled) {
      return;
    }

    const originalText =
      submitWithdraw.textContent;

    submitWithdraw.disabled = true;
    submitWithdraw.textContent =
      "Processing...";

    showMessage(
      "Submitting your withdrawal request...",
      "info"
    );

    try {
      const response =
        await fetch(
          `${API_BASE}/api/withdrawals`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type":
                "application/json",
              Accept:
                "application/json"
            },
            body: JSON.stringify({
              amount: amount
            })
          }
        );

      const data =
        await response
          .json()
          .catch(() => ({}));

      console.log(
        "Withdrawal response:",
        response.status,
        data
      );

      if (response.status === 401) {
        window.location.href =
          "login.html";
        return;
      }

      /*
       * Deposited capital is not withdrawable.
       * Show the backend explanation in a
       * simple FINORA popup with an OK button.
       */
      if (
        data.code ===
        "CAPITAL_NOT_WITHDRAWABLE"
      ) {
        clearMessage();

        showWithdrawalPopup(
          data.message ||
          "This amount is currently part of your deposited investment capital. Withdrawals are available from eligible earnings and referral income."
        );

        return;
      }

      if (
        !response.ok ||
        data.success !== true
      ) {
        showMessage(
          data.message ||
          "Your withdrawal request could not be submitted.",
          "error"
        );
        return;
      }

      if (
        data.walletBalance !==
        undefined
      ) {
        currentBalance =
          Number(
            data.walletBalance
          );

        walletBalance.textContent =
          formatUGX(
            currentBalance
          );

      } else {
        currentBalance -=
          amount;

        walletBalance.textContent =
          formatUGX(
            currentBalance
          );
      }

      amountInput.value = "";

      updateSummary();

      showMessage(
        "Withdrawal submitted successfully. Your request is pending processing.",
        "success"
      );

    } catch (error) {
      console.error(
        "FINORA withdrawal error:",
        error
      );

      showMessage(
        "Unable to connect to the withdrawal service. Please try again.",
        "error"
      );

    } finally {
      submitWithdraw.disabled =
        false;

      submitWithdraw.textContent =
        originalText;
    }
  }

  amountInput?.addEventListener(
    "input",
    () => {
      clearMessage();
      updateSummary();
    }
  );

  submitWithdraw?.addEventListener(
    "click",
    submitWithdrawal
  );

  async function initialize() {
    updateSummary();

    const loaded =
      await loadUser();

    hideLoader();

    if (!loaded) {
      return;
    }
  }

  initialize();
});
