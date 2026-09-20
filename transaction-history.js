document.addEventListener("DOMContentLoaded", () => {
  const API_BASE = "https://finora-platform.onrender.com";

  const loader = document.getElementById("pageLoader");
  const message = document.getElementById("message");

  const totalRecords = document.getElementById("totalRecords");
  const visibleCount = document.getElementById("visibleCount");
  const recordsTitle = document.getElementById("recordsTitle");
  const recordsList = document.getElementById("recordsList");

  const emptyState = document.getElementById("emptyState");
  const errorState = document.getElementById("errorState");
  const retryButton = document.getElementById("retryButton");

  const filterTabs = document.querySelectorAll(".filter-tab");

  let allTransactions = [];
  let currentFilter = "all";

  function formatUGX(amount) {
    const value = Number(amount);

    if (!Number.isFinite(value)) {
      return "UGX 0";
    }

    return `UGX ${value.toLocaleString("en-US")}`;
  }

  function hideLoader() {
    if (!loader) return;

    loader.classList.add("hidden");

    setTimeout(() => {
      loader.style.display = "none";
    }, 350);
  }

  function showMessage(text, type = "info") {
    if (!message) return;

    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = "block";
    message.hidden = false;
  }

  function clearMessage() {
    if (!message) return;

    message.textContent = "";
    message.className = "message";
    message.style.display = "none";
    message.hidden = true;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleString("en-UG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function getTypeName(type) {
    const names = {
      deposit: "Deposit",
      investment: "Investment",
      withdrawal: "Withdrawal",
      earning: "Earning",
      referral: "Referral"
    };

    return names[type] || "Transaction";
  }

  function getTypeIcon(type) {
    const icons = {
      deposit: "↓",
      investment: "◆",
      withdrawal: "↑",
      earning: "✦",
      referral: "↗"
    };

    return icons[type] || "•";
  }

  function getStatusClass(status) {
    const value = String(status || "pending").toLowerCase();

    if (
      value === "completed" ||
      value === "approved"
    ) {
      return value;
    }

    if (
      value === "rejected" ||
      value === "failed"
    ) {
      return value;
    }

    return "pending";
  }

  function getStatusName(status) {
    const value = String(status || "pending").toLowerCase();

    const names = {
      pending: "Pending",
      approved: "Approved",
      completed: "Completed",
      rejected: "Rejected",
      failed: "Failed"
    };

    return names[value] || "Pending";
  }

  function getTransactionType(transaction) {
    return String(transaction?.type || "").toLowerCase();
  }

  function getTransactionDirection(transaction) {
    const direction = String(
      transaction?.direction || ""
    ).toLowerCase();

    if (direction === "debit") {
      return "debit";
    }

    return "credit";
  }

  function getWithdrawalDetails(transaction) {
    const withdrawal =
      transaction?.withdrawal || {};

    return {
      phone:
        transaction?.phoneNumber ||
        transaction?.mobileNumber ||
        transaction?.phone ||
        withdrawal?.phoneNumber ||
        "",

      network:
        transaction?.network ||
        transaction?.paymentMethod ||
        withdrawal?.network ||
        "",

      fee:
        transaction?.fee ??
        withdrawal?.fee ??
        null,

      netAmount:
        transaction?.netAmount ??
        withdrawal?.netAmount ??
        null,

      reference:
        transaction?.reference ||
        withdrawal?.payoutReference ||
        ""
    };
  }

  function getDepositDetails(transaction) {
    const deposit =
      transaction?.deposit || {};

    return {
      network:
        transaction?.paymentMethod ||
        transaction?.network ||
        deposit?.paymentMethod ||
        "",

      reference:
        transaction?.reference ||
        deposit?.paymentReference ||
        ""
    };
  }

  function getReferralDetails(transaction) {
    const referral =
      transaction?.referralCommission ||
      transaction?.referral ||
      {};

    return {
      level:
        transaction?.level ??
        referral?.level ??
        null,

      rate:
        transaction?.rate ??
        referral?.rate ??
        null
    };
  }

  function getEarningDetails(transaction) {
    const earning =
      transaction?.earning ||
      {};

    return {
      day:
        transaction?.day ??
        earning?.day ??
        null
    };
  }

  function addDetail(label, value) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "";
    }

    return `
      <div class="transaction-detail">
        <span class="transaction-detail-label">
          ${escapeHTML(label)}
        </span>

        <span class="transaction-detail-value">
          ${escapeHTML(value)}
        </span>
      </div>
    `;
  }

  function buildDetails(transaction, type) {
    let html = "";

    if (type === "deposit") {
      const details =
        getDepositDetails(transaction);

      if (details.network) {
        html += addDetail(
          "Network",
          details.network
        );
      }

      if (details.reference) {
        html += addDetail(
          "Payment Reference",
          details.reference
        );
      }

      if (transaction?.description) {
        html += addDetail(
          "Details",
          transaction.description
        );
      }

      return html;
    }

    if (type === "withdrawal") {
      const details =
        getWithdrawalDetails(transaction);

      if (details.network) {
        html += addDetail(
          "Network",
          details.network
        );
      }

      if (details.phone) {
        html += addDetail(
          "Mobile Number",
          details.phone
        );
      }

      if (
        details.fee !== null &&
        details.fee !== undefined
      ) {
        html += addDetail(
          "Withdrawal Fee",
          formatUGX(details.fee)
        );
      }

      if (
        details.netAmount !== null &&
        details.netAmount !== undefined
      ) {
        html += addDetail(
          "You Receive",
          formatUGX(details.netAmount)
        );
      }

      if (details.reference) {
        html += addDetail(
          "Reference",
          details.reference
        );
      }

      if (transaction?.description) {
        html += addDetail(
          "Details",
          transaction.description
        );
      }

      return html;
    }

    if (type === "referral") {
      const details =
        getReferralDetails(transaction);

      if (details.level !== null) {
        html += addDetail(
          "Referral Level",
          `Level ${details.level}`
        );
      }

      if (
        details.rate !== null &&
        details.rate !== undefined
      ) {
        html += addDetail(
          "Commission Rate",
          `${details.rate}%`
        );
      }

      if (transaction?.description) {
        html += addDetail(
          "Details",
          transaction.description
        );
      }

      if (transaction?.reference) {
        html += addDetail(
          "Reference",
          transaction.reference
        );
      }

      return html;
    }

    if (type === "earning") {
      const details =
        getEarningDetails(transaction);

      if (details.day !== null) {
        html += addDetail(
          "Earning Day",
          `Day ${details.day}`
        );
      }

      if (transaction?.description) {
        html += addDetail(
          "Details",
          transaction.description
        );
      }

      if (transaction?.reference) {
        html += addDetail(
          "Reference",
          transaction.reference
        );
      }

      return html;
    }

    if (transaction?.reference) {
      html += addDetail(
        "Reference",
        transaction.reference
      );
    }

    if (transaction?.description) {
      html += addDetail(
        "Details",
        transaction.description
      );
    }

    return html;
  }

  function renderTransaction(transaction) {
    const type =
      getTransactionType(transaction);

    const typeName =
      getTypeName(type);

    const icon =
      getTypeIcon(type);

    const amount =
      Number(transaction?.amount || 0);

    const direction =
      getTransactionDirection(transaction);

    const status =
      getStatusClass(transaction?.status);

    const statusName =
      getStatusName(transaction?.status);

    const date =
      formatDate(transaction?.createdAt);

    const detailsHTML =
      buildDetails(
        transaction,
        type
      );

    return `
      <article
        class="transaction-card ${escapeHTML(type)}"
        data-status="${escapeHTML(status)}"
        data-type="${escapeHTML(type)}"
      >

        <div class="transaction-top">

          <div class="transaction-type">

            <div class="transaction-icon">
              ${escapeHTML(icon)}
            </div>

            <div>
              <div class="transaction-name">
                ${escapeHTML(typeName)}
              </div>

              <div class="transaction-date">
                ${escapeHTML(date)}
              </div>
            </div>

          </div>

          <div>
            <div class="transaction-amount">
              ${escapeHTML(
                formatUGX(amount)
              )}
            </div>

            <div
              class="transaction-direction ${escapeHTML(direction)}"
            >
              ${
                direction === "debit"
                  ? "Debit"
                  : "Credit"
              }
            </div>
          </div>

        </div>

        <div class="transaction-bottom">

          <div class="transaction-detail">

            <span class="transaction-detail-label">
              Status
            </span>

            <span
              class="transaction-status ${escapeHTML(status)}"
            >
              ${escapeHTML(statusName)}
            </span>

          </div>

          ${detailsHTML}

        </div>

      </article>
    `;
  }

  function getFilteredTransactions() {
    if (currentFilter === "all") {
      return allTransactions;
    }

    return allTransactions.filter(
      (transaction) => {
        return (
          getTransactionType(transaction) ===
          currentFilter
        );
      }
    );
  }

  function updateTitle() {
    const titles = {
      all: "Overall Records",
      deposit: "Deposit Records",
      investment: "Investment Records",
      withdrawal: "Withdrawal Records",
      earning: "Earning Records",
      referral: "Referral Records"
    };

    if (!recordsTitle) return;

    recordsTitle.textContent =
      titles[currentFilter] ||
      "Overall Records";
  }

  function renderRecords() {
    const transactions =
      getFilteredTransactions();

    updateTitle();

    if (totalRecords) {
      totalRecords.textContent =
        allTransactions.length;
    }

    if (visibleCount) {
      visibleCount.textContent =
        transactions.length;
    }

    if (recordsList) {
      recordsList.innerHTML = "";
    }

    if (errorState) {
      errorState.hidden = true;
    }

    if (emptyState) {
      emptyState.hidden =
        transactions.length !== 0;
    }

    if (!transactions.length) {
      return;
    }

    const fragment =
      document.createDocumentFragment();

    transactions.forEach(
      (transaction) => {
        const wrapper =
          document.createElement("div");

        wrapper.innerHTML =
          renderTransaction(transaction);

        const card =
          wrapper.firstElementChild;

        if (card) {
          fragment.appendChild(card);
        }
      }
    );

    recordsList.appendChild(
      fragment
    );
  }

  function setActiveFilter(filter) {
    currentFilter =
      filter || "all";

    filterTabs.forEach((tab) => {
      const active =
        tab.dataset.filter ===
        currentFilter;

      tab.classList.toggle(
        "active",
        active
      );

      tab.setAttribute(
        "aria-selected",
        active ? "true" : "false"
      );
    });

    clearMessage();

    renderRecords();
  }

  async function loadTransactions() {
    clearMessage();

    if (recordsList) {
      recordsList.innerHTML = "";
    }

    if (emptyState) {
      emptyState.hidden = true;
    }

    if (errorState) {
      errorState.hidden = true;
    }

    try {
      const response =
        await fetch(
          `${API_BASE}/api/transactions?limit=100`,
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept:
                "application/json"
            }
          }
        );

      if (response.status === 401) {
        window.location.href =
          "login.html";
        return;
      }

      const data =
        await response
          .json()
          .catch(() => ({}));

      if (
        !response.ok ||
        data.success !== true
      ) {
        throw new Error(
          data.message ||
          "FINORA could not load your transaction records."
        );
      }

      allTransactions =
        Array.isArray(
          data.transactions
        )
          ? data.transactions
          : [];

      renderRecords();

    } catch (error) {
      console.error(
        "FINORA transaction history error:",
        error
      );

      allTransactions = [];

      if (recordsList) {
        recordsList.innerHTML = "";
      }

      if (emptyState) {
        emptyState.hidden = true;
      }

      if (errorState) {
        errorState.hidden = false;
      }

      showMessage(
        error.message ||
        "We could not load your transaction history.",
        "error"
      );

    } finally {
      hideLoader();
    }
  }

  filterTabs.forEach((tab) => {
    tab.addEventListener(
      "click",
      () => {
        setActiveFilter(
          tab.dataset.filter
        );
      }
    );
  });

  retryButton?.addEventListener(
    "click",
    () => {
      loadTransactions();
    }
  );

  setActiveFilter("all");

  loadTransactions();
});
