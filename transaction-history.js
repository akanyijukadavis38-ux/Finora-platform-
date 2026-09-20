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
    return `UGX ${Number(amount || 0).toLocaleString("en-US")}`;
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
    if (!dateValue) return "Date unavailable";

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
    if (!status) return "Pending";

    return String(status)
      .charAt(0)
      .toUpperCase() +
      String(status).slice(1);
  }

  function getTransactionType(transaction) {
    return String(transaction?.type || "").toLowerCase();
  }

  function getWithdrawalDetails(transaction) {
    return {
      phone:
        transaction?.phoneNumber ||
        transaction?.mobileNumber ||
        transaction?.phone ||
        transaction?.withdrawal?.phoneNumber ||
        "",

      network:
        transaction?.network ||
        transaction?.paymentMethod ||
        transaction?.withdrawal?.network ||
        "",

      reference:
        transaction?.reference ||
        ""
    };
  }

  function renderTransaction(transaction) {
    const type = getTransactionType(transaction);
    const typeName = getTypeName(type);
    const icon = getTypeIcon(type);

    const amount = Number(transaction?.amount || 0);
    const direction = String(
      transaction?.direction || "credit"
    ).toLowerCase();

    const status = getStatusClass(transaction?.status);
    const statusName = getStatusName(transaction?.status);

    const date = formatDate(transaction?.createdAt);

    const withdrawalDetails =
      type === "withdrawal"
        ? getWithdrawalDetails(transaction)
        : null;

    let detailsHTML = "";

    if (type === "withdrawal") {
      if (withdrawalDetails.network) {
        detailsHTML += `
          <div class="transaction-detail">
            <span class="transaction-detail-label">Network</span>
            <span class="transaction-detail-value">
              ${escapeHTML(withdrawalDetails.network)}
            </span>
          </div>
        `;
      }

      if (withdrawalDetails.phone) {
        detailsHTML += `
          <div class="transaction-detail">
            <span class="transaction-detail-label">Mobile Number</span>
            <span class="transaction-detail-value">
              ${escapeHTML(withdrawalDetails.phone)}
            </span>
          </div>
        `;
      }

      if (withdrawalDetails.reference) {
        detailsHTML += `
          <div class="transaction-detail">
            <span class="transaction-detail-label">Reference</span>
            <span class="transaction-detail-value">
              ${escapeHTML(withdrawalDetails.reference)}
            </span>
          </div>
        `;
      }
    } else {
      if (transaction?.reference) {
        detailsHTML += `
          <div class="transaction-detail">
            <span class="transaction-detail-label">Reference</span>
            <span class="transaction-detail-value">
              ${escapeHTML(transaction.reference)}
            </span>
          </div>
        `;
      }

      if (transaction?.description) {
        detailsHTML += `
          <div class="transaction-detail">
            <span class="transaction-detail-label">Details</span>
            <span class="transaction-detail-value">
              ${escapeHTML(transaction.description)}
            </span>
          </div>
        `;
      }
    }

    return `
      <article class="transaction-card ${escapeHTML(type)}">

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
              ${escapeHTML(formatUGX(amount))}
            </div>

            <div class="transaction-direction ${escapeHTML(direction)}">
              ${direction === "debit" ? "Debit" : "Credit"}
            </div>
          </div>

        </div>

        <div class="transaction-bottom">

          <div class="transaction-detail">
            <span class="transaction-detail-label">Status</span>

            <span class="transaction-status ${escapeHTML(status)}">
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

    return allTransactions.filter((transaction) => {
      return getTransactionType(transaction) === currentFilter;
    });
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

    recordsTitle.textContent =
      titles[currentFilter] || "Overall Records";
  }

  function renderRecords() {
    const transactions = getFilteredTransactions();

    updateTitle();

    totalRecords.textContent = allTransactions.length;
    visibleCount.textContent = transactions.length;

    recordsList.innerHTML = "";

    emptyState.hidden = transactions.length !== 0;
    errorState.hidden = true;

    if (!transactions.length) {
      return;
    }

    const fragment = document.createDocumentFragment();

    transactions.forEach((transaction) => {
      const wrapper = document.createElement("div");

      wrapper.innerHTML = renderTransaction(transaction);

      const card = wrapper.firstElementChild;

      if (card) {
        fragment.appendChild(card);
      }
    });

    recordsList.appendChild(fragment);
  }

  function setActiveFilter(filter) {
    currentFilter = filter;

    filterTabs.forEach((tab) => {
      const active =
        tab.dataset.filter === filter;

      tab.classList.toggle("active", active);
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

    recordsList.innerHTML = "";
    emptyState.hidden = true;
    errorState.hidden = true;

    try {
      const response = await fetch(
        `${API_BASE}/api/transactions?limit=100`,
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
        return;
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success !== true) {
        throw new Error(
          data.message ||
          "FINORA could not load your transaction records."
        );
      }

      allTransactions = Array.isArray(data.transactions)
        ? data.transactions
        : [];

      renderRecords();

    } catch (error) {
      console.error(
        "FINORA transaction history error:",
        error
      );

      allTransactions = [];

      recordsList.innerHTML = "";
      emptyState.hidden = true;
      errorState.hidden = false;

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
    tab.addEventListener("click", () => {
      setActiveFilter(tab.dataset.filter);
    });
  });

  retryButton?.addEventListener("click", () => {
    loadTransactions();
  });

  loadTransactions();
});
