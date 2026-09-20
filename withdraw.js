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

    // Make sure the message is actually visible on screen.
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

    let value = String(phone).trim().replace(/\s+/g, "");

    if (value.startsWith("+256")) {
      value = "0" + value.substring(4);
    } else if (value.startsWith("256")) {
      value = "0" + value.substring(3);
    }

    return value;
  }

  function detectNetwork(phone) {
    const normalized = normalizePhone(phone);

    if (/^07(7\d|8\d)\d{7}$/.test(normalized)) {
      return "MTN";
    }

    if (/^07(0\d|5\d)\d{7}$/.test(normalized)) {
      return "Airtel";
    }

    return "Mobile Money";
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

  async function loadUser() {
    try {
      const response = await fetch(`${API_BASE}/api/users/me`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json"
        }
      });

      if (response.status === 401) {
        window.location.href = "login.html";
        return false;
      }

      if (!response.ok) {
        throw new Error("Unable to load your account details.");
      }

      const data = await response.json();
      const user = data?.user || data?.data || data;

      currentBalance = Number(
        user?.balance ??
        user?.walletBalance ??
        user?.wallet ??
        0
      );

      userPhone = getUserPhone(user);

      walletBalance.textContent = formatUGX(currentBalance);

      if (userPhone) {
        registeredNumber.textContent = userPhone;
        mobileNetwork.textContent = detectNetwork(userPhone);
      } else {
        registeredNumber.textContent = "Number unavailable";
        mobileNetwork.textContent = "Not detected";
      }

      return true;
    } catch (error) {
      console.error("FINORA account error:", error);

      showMessage(
        error.message || "We could not load your wallet details.",
        "error"
      );

      return false;
    }
  }

  function validateAmount() {
    const rawValue = amountInput?.value?.trim() || "";

    if (!rawValue) {
      showMessage(
        "Please enter the amount you want to withdraw.",
        "error"
      );
      return null;
    }

    const amount = Number(rawValue);

    if (!Number.isFinite(amount) || amount <= 0) {
      showMessage(
        "Please enter a valid withdrawal amount.",
        "error"
      );
      return null;
    }

    if (amount < MIN_WITHDRAWAL) {
      showMessage(
        `Minimum withdrawal is ${formatUGX(MIN_WITHDRAWAL)}.`,
        "error"
      );
      return null;
    }

    if (Math.round(amount * 100) !== amount * 100) {
      showMessage(
        "Please enter an amount with no more than 2 decimal places.",
        "error"
      );
      return null;
    }

    if (amount > currentBalance) {
      showMessage(
        `Insufficient funds. Your available balance is ${formatUGX(currentBalance)}.`,
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

    return amount;
  }

  async function submitWithdrawal() {
    clearMessage();

    const amount = validateAmount();

    if (amount === null) {
      return;
    }

    if (submitWithdraw.disabled) {
      return;
    }

    const originalText = submitWithdraw.textContent;

    submitWithdraw.disabled = true;
    submitWithdraw.textContent = "Processing...";

    // Always give the user immediate feedback.
    showMessage(
      "Submitting your withdrawal request...",
      "info"
    );

    try {
      const response = await fetch(`${API_BASE}/api/withdrawals`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          amount: amount
        })
      });

      const data = await response.json().catch(() => ({}));

      console.log("Withdrawal response:", response.status, data);

      if (response.status === 401) {
        window.location.href = "login.html";
        return;
      }

      if (!response.ok || data.success !== true) {
        showMessage(
          data.message ||
          "Your withdrawal request could not be submitted.",
          "error"
        );
        return;
      }

      if (data.walletBalance !== undefined) {
        currentBalance = Number(data.walletBalance);
        walletBalance.textContent = formatUGX(currentBalance);
      } else {
        currentBalance -= amount;
        walletBalance.textContent = formatUGX(currentBalance);
      }

      amountInput.value = "";
      updateSummary();

      showMessage(
        "Withdrawal submitted successfully. Your request is pending processing.",
        "success"
      );

    } catch (error) {
      console.error("FINORA withdrawal error:", error);

      showMessage(
        "Unable to connect to the withdrawal service. Please try again.",
        "error"
      );

    } finally {
      submitWithdraw.disabled = false;
      submitWithdraw.textContent = originalText;
    }
  }

  amountInput?.addEventListener("input", () => {
    clearMessage();
    updateSummary();
  });

  submitWithdraw?.addEventListener("click", submitWithdrawal);

  async function initialize() {
    updateSummary();

    const loaded = await loadUser();

    hideLoader();

    if (!loaded) {
      return;
    }
  }

  initialize();
});
