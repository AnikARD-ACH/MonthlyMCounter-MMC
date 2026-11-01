
const db = supabase.createClient(
  window.MMC_CONFIG.url,
  window.MMC_CONFIG.key
);

// HTML elements
const loginSection = document.getElementById("loginSection");
const counterSection = document.getElementById("counterSection");

const emailInput = document.getElementById("emailInput");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const increaseBtn = document.getElementById("increaseBtn");
const counterElement = document.getElementById("counter");
const monthElement = document.getElementById("month");
const statusElement = document.getElementById("status");

// App state
let activeUser = null;
let busy = false;
let loading = false;

function showStatus(message) {
  statusElement.textContent = message;
}

// Convert 2026-11-01 to November 2026
function formatMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, 1))
    .toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC"
    });
}

// Load the saved counter from Supabase
async function loadCounter() {
  if (!activeUser || busy || loading) return;

  loading = true;
  increaseBtn.disabled = true;

  showStatus("Loading online count...");

  try {
    // Ask the database for the current month
    const { data: currentMonth, error: monthError } =
      await db.rpc("get_current_month");

    if (monthError) throw monthError;

    // Read this month's saved count
    const { data, error } = await db
      .from("monthly_counts")
      .select("total")
      .eq("month_start", currentMonth)
      .maybeSingle();

    if (error) throw error;

    monthElement.textContent = formatMonth(currentMonth);
    counterElement.textContent = data?.total ?? 0;

    showStatus("Saved online");
  } catch (error) {
    showStatus("Error: " + error.message);
  } finally {
    loading = false;

    if (activeUser && !busy) {
      increaseBtn.disabled =
        statusElement.textContent !== "Saved online";
    }
  }
}

// Send login link by email

const passwordInput =
  document.getElementById("passwordInput");



// Password login
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showStatus("Enter your email and password.");
    return;
  }

  loginBtn.disabled = true;
  showStatus("Signing in...");

  const { error } = await db.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showStatus("Login failed: " + error.message);
  } else {
    passwordInput.value = "";
    showStatus("Signed in successfully");
  }

  loginBtn.disabled = false;
});

// Increase the count by exactly 1
increaseBtn.addEventListener("click", async () => {
  if (!activeUser || busy || loading) return;

  busy = true;
  increaseBtn.disabled = true;
  showStatus("Saving...");

  try {
    const { data, error } =
      await db.rpc("increment_monthly_count");

    if (error) throw error;

    if (data && data.length > 0) {
      monthElement.textContent =
        formatMonth(data[0].month_start);

      counterElement.textContent = data[0].total;
    }

    showStatus("Saved online");
  } catch (error) {
    showStatus("Error: " + error.message);
  } finally {
    busy = false;

    // Refresh the count from the database
    await loadCounter();
  }
});

// Sign out
logoutBtn.addEventListener("click", async () => {
  increaseBtn.disabled = true;

  const { error } = await db.auth.signOut();

  if (error) {
    showStatus("Error: " + error.message);
  }
});

// Check whether the user is signed in
async function updateSession() {
  const { data: { user }, error } =
    await db.auth.getUser();

  activeUser = error ? null : user;

  loginSection.hidden = !!activeUser;
  counterSection.hidden = !activeUser;

  increaseBtn.disabled = true;

  if (activeUser) {
    await loadCounter();
  } else {
    counterElement.textContent = "0";
    showStatus("Sign in to continue.");
  }
}

// Respond to sign-in and sign-out
db.auth.onAuthStateChange(() => {
  setTimeout(() => {
    updateSession();
  }, 0);
});

// Initial session check
updateSession();

// Refresh when returning to the website
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && activeUser) {
    loadCounter();
  }
});

// Check the server every minute
// This also detects a new calendar month.
setInterval(() => {
  if (activeUser) {
    loadCounter();
  }
}, 60000);



