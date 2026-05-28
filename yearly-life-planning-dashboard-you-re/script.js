const fields = [
  "theme",
  "monthlyIncome",
  "livingExpenses",
  "currentSavings",
  "debtBalance",
  "debtPayment",
  "weeklyVacation",
  "monthlyInvesting",
  "houseTarget",
  "bigTrip",
  "smallTrips",
  "miniTrips",
  "goals",
];

const defaults = {};
for (const id of fields) {
  defaults[id] = document.getElementById(id).value;
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

let deferredInstallPrompt;

function value(id) {
  const element = document.getElementById(id);
  return element.type === "number" ? Number(element.value || 0) : element.value;
}

function pct(part, whole) {
  if (!whole) return 0;
  return Math.max(0, Math.min(100, (part / whole) * 100));
}

function monthNameFromNow(months) {
  const date = new Date();
  date.setMonth(date.getMonth() + Math.max(0, Math.ceil(months)));
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function saveState() {
  const state = {};
  for (const id of fields) {
    state[id] = document.getElementById(id).value;
  }
  localStorage.setItem("yearly-life-dashboard", JSON.stringify(state));
}

function loadState() {
  const stored = localStorage.getItem("yearly-life-dashboard");
  if (!stored) return;
  const state = JSON.parse(stored);
  for (const [id, currentValue] of Object.entries(state)) {
    const element = document.getElementById(id);
    if (element) element.value = currentValue;
  }
}

function setProgress(id, percent) {
  const width = `${Math.round(Math.max(0, Math.min(100, percent)))}%`;
  document.getElementById(id).style.width = width;
}

function renderBudgetBars(monthlyIncome) {
  const categories = [
    ["Living Expenses", value("livingExpenses"), "45-55%", "#2f6f5e"],
    ["Emergency/Savings", Math.max(0, value("currentSavings") / 12), "10-15%", "#0f8f8c"],
    ["Investing", value("monthlyInvesting"), "10-15%", "#315f9f"],
    ["Debt Payoff", value("debtPayment"), "10-20%", "#a84f55"],
    ["Travel/Fun", (value("weeklyVacation") * 52) / 12, "5-10%", "#ba7b2f"],
    ["Big Purchase Fund", Math.max(0, value("houseTarget") / 60), "5-10%", "#5d6f2f"],
  ];

  document.getElementById("budgetBars").innerHTML = categories
    .map(([name, amount, target, color]) => {
      const percent = pct(amount, monthlyIncome);
      return `
        <div class="budget-row">
          <span>${name}</span>
          <div class="bar-track"><i style="width: ${Math.min(percent, 100)}%; background: ${color}"></i></div>
          <span>${Math.round(percent)}% / ${target}</span>
        </div>
      `;
    })
    .join("");
}

function render() {
  const monthlyIncome = value("monthlyIncome");
  const livingExpenses = value("livingExpenses");
  const currentSavings = value("currentSavings");
  const debtBalance = value("debtBalance");
  const debtPayment = value("debtPayment");
  const weeklyVacation = value("weeklyVacation");
  const monthlyInvesting = value("monthlyInvesting");
  const houseTarget = value("houseTarget");
  const yearlyTravel = weeklyVacation * 52;
  const travelPlans = value("bigTrip") + value("smallTrips") + value("miniTrips");
  const emergencyMonths = livingExpenses ? currentSavings / livingExpenses : 0;

  document.getElementById("monthlyIncomeOut").textContent = money.format(monthlyIncome);
  document.getElementById("emergencyOut").textContent = money.format(currentSavings);
  document.getElementById("emergencyMonthsOut").textContent = `${emergencyMonths.toFixed(1)} months covered`;
  document.getElementById("debtOut").textContent = money.format(debtBalance);
  document.getElementById("travelOut").textContent = money.format(yearlyTravel);

  const debtMonths = debtPayment > 0 ? Math.ceil(debtBalance / debtPayment) : Infinity;
  document.getElementById("debtMonthsOut").textContent =
    debtBalance === 0 ? "Debt cleared" : debtPayment > 0 ? `${debtMonths} months at current pace` : "Add a monthly payoff amount";

  setProgress("starterProgress", pct(currentSavings, 3000));
  setProgress("threeMonthProgress", pct(currentSavings, livingExpenses * 3));
  document.getElementById("starterProgressText").textContent = `${Math.round(pct(currentSavings, 3000))}%`;
  document.getElementById("threeMonthProgressText").textContent = `${Math.round(pct(currentSavings, livingExpenses * 3))}%`;

  document.getElementById("emergencyGuidance").textContent =
    currentSavings < 3000
      ? `Aim for the starter fund first. You need ${money.format(3000 - currentSavings)} more to hit $3,000.`
      : `Starter fund is covered. The 3-month target is ${money.format(livingExpenses * 3)}.`;

  document.getElementById("debtFreeDate").textContent =
    debtBalance === 0 ? "Debt-free now" : debtPayment > 0 ? `Debt-free: ${monthNameFromNow(debtMonths)}` : "Debt-free date needs a payment";
  document.getElementById("debtGuidance").textContent =
    debtPayment > 0
      ? `Keep minimums on everything, then push the extra ${money.format(debtPayment)} toward the highest-interest balance.`
      : "Add a monthly debt payoff amount to forecast your debt-free month.";

  const travelGap = yearlyTravel - travelPlans;
  document.getElementById("travelGuidance").textContent =
    travelGap >= 0
      ? `Your travel plan fits with about ${money.format(travelGap)} left for cushions or upgrades.`
      : `Your planned trips are ${money.format(Math.abs(travelGap))} above the current vacation fund pace.`;

  const fiveYearInvestment = monthlyInvesting * (((1 + 0.07 / 12) ** 60 - 1) / (0.07 / 12));
  document.getElementById("investmentOut").textContent = `${money.format(fiveYearInvestment)} in 5 years`;

  setProgress("houseProgress", pct(currentSavings, houseTarget));
  document.getElementById("houseProgressText").textContent = `${Math.round(pct(currentSavings, houseTarget))}%`;
  document.getElementById("houseGuidance").textContent =
    houseTarget > 0
      ? `Current savings are ${money.format(currentSavings)} against a ${money.format(houseTarget)} target. Keep emergency money separate before treating this as spendable down payment cash.`
      : "Set a down payment target when you are ready to model the house fund.";

  renderBudgetBars(monthlyIncome);
  saveState();
}

loadState();
for (const id of fields) {
  document.getElementById(id).addEventListener("input", render);
}

document.getElementById("resetBtn").addEventListener("click", () => {
  for (const [id, defaultValue] of Object.entries(defaults)) {
    document.getElementById(id).value = defaultValue;
  }
  localStorage.removeItem("yearly-life-dashboard");
  render();
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  document.getElementById("installBtn").hidden = false;
  document.getElementById("installHelp").textContent = "Tap Install to add this dashboard to your home screen.";
});

document.getElementById("installBtn").addEventListener("click", async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = undefined;
  document.getElementById("installBtn").hidden = true;
});

if (window.navigator.standalone || window.matchMedia("(display-mode: standalone)").matches) {
  document.getElementById("installStrip").hidden = true;
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js");
  });
}

render();
