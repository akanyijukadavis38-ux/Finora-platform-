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
  }

  function clearMessage() {
    if (!message) return;

    message.textContent = "";
    message.className = "message";
    message.style.display = "none";
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
        throw new Error("Unable to load account details.");
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
      console.error("FINORA withdrawal account error:", error);

      showMessage(
        "We could not load your wallet details. Please try again.",
        "error"
      );

      return false;
    }
  }

  function validateAmount() {
    const amount = Number(amountInput?.value || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      showMessage("Please enter a withdrawal amount.", "error");
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
        "Your withdrawal amount is greater than your available wallet balance.",
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

    if (amount === null) return;

    if (submitWithdraw.disabled) return;

    const originalText = submitWithdraw.textContent;

    submitWithdraw.disabled = true;
    submitWithdraw.textContent = "Processing...";

    try {
      const response = await fetch(`${API_BASE}/api/withdrawals`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          amount
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        window.location.href = "login.html";
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
          "Your withdrawal request could not be submitted."
        );
      }

      if (data.walletBalance !== undefined) {
        currentBalance = Number(data.walletBalance);
        walletBalance.textContent = formatUGX(currentBalance);
      }

      amountInput.value = "";
      updateSummary();

      showMessage(
        "Your withdrawal request has been submitted successfully and is pending processing.",
        "success"
      );
    } catch (error) {
      console.error("FINORA withdrawal error:", error);

      showMessage(
        error.message ||
        "Something went wrong while submitting your withdrawal request.",
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
