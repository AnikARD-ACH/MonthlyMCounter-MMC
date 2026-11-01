
/* =====================================
   MONTHLY MUTT COUNTER — HISTORY
===================================== */

const historyDb = supabase.createClient(
  window.MMC_CONFIG.url,
  window.MMC_CONFIG.key
);

const historyStatus =
  document.getElementById("historyStatus");

const historySection =
  document.getElementById("historySection");

const historyList =
  document.getElementById("historyList");

// Convert YYYY-MM-DD into a readable month
function formatHistoryMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, 1))
    .toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    });
}

// Convert YYYY-MM-DD to a numeric month index
function monthIndex(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return year * 12 + month - 1;
}

// Convert month index back to YYYY-MM-01
function monthFromIndex(index) {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;

  return (
    year + "-" +
    String(month).padStart(2, "0") +
    "-01"
  );
}

// Create a read-only history row
function createHistoryRow(month, total) {
  const row = document.createElement("div");
  row.className = "history-row";

  const information = document.createElement("div");

  const name = document.createElement("strong");
  name.textContent = formatHistoryMonth(month);

  const locked = document.createElement("small");
  locked.textContent = "Completed • Locked";

  information.append(name, locked);

  const count = document.createElement("strong");
  count.className = "history-count";
  count.textContent = total;

  row.append(information, count);

  return row;
}

// Fetch completed monthly totals
async function loadHistory() {
  historyStatus.textContent = "Loading history...";

  try {
    // Confirm the user is authenticated
    const { data: { user }, error: authError } =
      await historyDb.auth.getUser();

    if (authError) throw authError;

    if (!user) {
      historyStatus.textContent =
        "Please sign in on the main page first.";
      return;
    }

    // Current month according to Supabase
    const { data: currentMonth, error: monthError } =
      await historyDb.rpc("get_current_month");

    if (monthError) throw monthError;

    // Read all existing monthly records
    const { data: records, error: recordsError } =
      await historyDb
        .from("monthly_counts")
        .select("month_start,total")
        .order("month_start", { ascending: true });

    if (recordsError) throw recordsError;

    historyList.replaceChildren();

    if (!records || records.length === 0) {
      historyStatus.textContent =
        "No completed monthly records yet.";
      return;
    }

    const totals = new Map(
      records.map(record => [
        record.month_start,
        record.total
      ])
    );

    const firstMonth = monthIndex(
      records[0].month_start
    );

    const lastCompletedMonth =
      monthIndex(currentMonth) - 1;

    if (firstMonth > lastCompletedMonth) {
      historyStatus.textContent =
        "Your first month is still in progress.";
      return;
    }

    // Newest completed month first
    for (
      let index = lastCompletedMonth;
      index >= firstMonth;
      index--
    ) {
      const month = monthFromIndex(index);
      const total = totals.get(month) ?? 0;

      historyList.appendChild(
        createHistoryRow(month, total)
      );
    }

    historySection.hidden = false;
    historyStatus.textContent =
      "Your completed monthly records";
  } catch (error) {
    historyStatus.textContent =
      "Error: " + error.message;
  }
}

loadHistory();
