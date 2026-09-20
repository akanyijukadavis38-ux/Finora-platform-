<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <meta
    name="description"
    content="FINORA transaction history and financial records."
  >

  <title>Transaction History | FINORA</title>

  <link rel="stylesheet" href="transaction-history.css?v=1">
</head>

<body>

  <!-- PAGE LOADER -->
  <div id="pageLoader" class="page-loader">
    <div class="loader-ring"></div>
    <span>Loading records...</span>
  </div>

  <main class="records-page">

    <!-- HEADER -->
    <header class="records-header">

      <button
        class="back-button"
        type="button"
        onclick="window.location.href='dashboard.html'"
        aria-label="Back to dashboard"
      >
        <span class="back-icon">‹</span>
      </button>

      <div class="brand">
        <div class="brand-name">
          <span class="brand-fin">FIN</span><span class="brand-ora">ORA</span>
        </div>

        <div class="brand-tagline">
          INVEST • GROW • EARN
        </div>
      </div>

      <div class="header-space"></div>

    </header>

    <!-- INTRO -->
    <section class="records-intro">

      <div class="section-label">
        FINANCIAL RECORDS
      </div>

      <h1>Transaction History</h1>

      <p>
        View and manage your complete FINORA financial activity in one place.
      </p>

    </section>

    <!-- MESSAGE -->
    <div id="message" class="message" hidden></div>

    <!-- RECORD SUMMARY -->
    <section class="records-summary">

      <div class="summary-glow"></div>

      <div class="summary-content">

        <div>
          <span class="summary-label">TOTAL RECORDS</span>
          <strong id="totalRecords">0</strong>
        </div>

        <div class="summary-icon" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>

      </div>

    </section>

    <!-- FILTERS -->
    <section class="filter-section">

      <div class="filter-heading">
        <span>Records</span>
        <span class="filter-caption">FILTER BY TYPE</span>
      </div>

      <div class="filter-tabs" role="tablist">

        <button
          class="filter-tab active"
          type="button"
          data-filter="all"
          role="tab"
          aria-selected="true"
        >
          Overall
        </button>

        <button
          class="filter-tab"
          type="button"
          data-filter="deposit"
          role="tab"
          aria-selected="false"
        >
          Deposits
        </button>

        <button
          class="filter-tab"
          type="button"
          data-filter="investment"
          role="tab"
          aria-selected="false"
        >
          Investments
        </button>

        <button
          class="filter-tab"
          type="button"
          data-filter="withdrawal"
          role="tab"
          aria-selected="false"
        >
          Withdrawals
        </button>

        <button
          class="filter-tab"
          type="button"
          data-filter="earning"
          role="tab"
          aria-selected="false"
        >
          Earnings
        </button>

        <button
          class="filter-tab"
          type="button"
          data-filter="referral"
          role="tab"
          aria-selected="false"
        >
          Referrals
        </button>

      </div>

    </section>

    <!-- RECORDS LIST -->
    <section class="records-section">

      <div class="records-heading">
        <div>
          <span class="section-label">ACTIVITY</span>
          <h2 id="recordsTitle">Overall Records</h2>
        </div>

        <span id="visibleCount" class="visible-count">0</span>
      </div>

      <div id="recordsList" class="records-list">

        <!-- Records are loaded by transaction-history.js -->

      </div>

      <!-- EMPTY STATE -->
      <div id="emptyState" class="empty-state" hidden>

        <div class="empty-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <h3>No records yet</h3>

        <p>
          Your financial activity will appear here once you make a transaction.
        </p>

      </div>

      <!-- ERROR STATE -->
      <div id="errorState" class="error-state" hidden>

        <div class="error-icon">!</div>

        <h3>Unable to load records</h3>

        <p>
          We could not load your transaction history. Please try again.
        </p>

        <button id="retryButton" type="button">
          Try Again
        </button>

      </div>

    </section>

    <!-- FOOTER -->
    <footer class="records-footer">

      <div class="footer-brand">
        <span class="brand-fin">FIN</span><span class="brand-ora">ORA</span>
      </div>

      <p>
        INVEST • GROW • EARN
      </p>

      <small>
        Secure financial records
      </small>

    </footer>

  </main>

  <script src="transaction-history.js?v=1"></script>

</body>
</html>
