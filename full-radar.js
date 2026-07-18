const ALERT_URL = "../alert.json";

function updateClock() {
  const clock = document.getElementById("clock");

  if (!clock) return;

  clock.textContent = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function setTheme(color) {
  const themes = {
    none:    { main: "#e5282f", dark: "#8e1016", glow: "#ff5960" },
    red:     { main: "#e5282f", dark: "#8e1016", glow: "#ff5960" },
    darkred: { main: "#8b0000", dark: "#430000", glow: "#e34b4b" },
    orange:  { main: "#f28c18", dark: "#8a4300", glow: "#ffb15c" },
    yellow:  { main: "#f3bd00", dark: "#806400", glow: "#ffe16a" },
    green:   { main: "#23b86b", dark: "#086a38", glow: "#66f2a0" },
    pink:    { main: "#ff4fa3", dark: "#8b174f", glow: "#ff9bcb" },
    purple:  { main: "#9f3cff", dark: "#4c118b", glow: "#c891ff" }
  };

  const theme = themes[color] || themes.red;
  const root = document.documentElement;

  root.style.setProperty("--red", theme.main);
  root.style.setProperty("--red-dark", theme.dark);

  document.querySelectorAll(
    ".topbar, .radar-main, .webcam-frame, .brand-panel, .warning-box, .forecast-strip, .ticker"
  ).forEach((element) => {
    element.style.borderColor = theme.main;
    element.style.boxShadow = `0 0 12px ${theme.glow}`;
  });

  document.querySelectorAll(".panel-label, .live-tag").forEach((element) => {
    element.style.background = theme.dark;
  });

  document.querySelectorAll(".brand strong").forEach((element) => {
    element.style.background = theme.main;
  });

  document.querySelectorAll(".topbar").forEach((element) => {
    element.style.background =
      `linear-gradient(90deg, ${theme.dark}, ${theme.main} 55%, ${theme.dark})`;
  });

  document.querySelectorAll(".ticker, .ticker-tag").forEach((element) => {
    element.style.borderColor = theme.main;
    element.style.background = theme.dark;
    element.style.boxShadow = `0 0 12px ${theme.glow}`;
  });
}

function updateScene(data) {
  const counts = data.counts || {};
  const highest = data.highest || {};

  const tornadoCount = document.getElementById("tornadoCount");
  const severeCount = document.getElementById("severeCount");
  const tickerText = document.getElementById("tickerText");

  if (tornadoCount) tornadoCount.textContent = counts.tornado || 0;
  if (severeCount) severeCount.textContent = counts.severe || 0;

  if (tickerText) {
    const type = highest.type || "NO ACTIVE ALERT";
    const location = highest.location || "MONITORING NATIONWIDE";
    const headline =
      highest.headline || "Monitoring severe weather across the United States.";

    tickerText.textContent =
      `${type} • ${location} • ${headline}     ${type} • ${location} • ${headline}`;
  }

  setTheme(highest.color || "none");
}

async function loadAlerts() {
  try {
    const response = await fetch(`${ALERT_URL}?t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Alert file error: ${response.status}`);
    }

    const data = await response.json();
    updateScene(data);
  } catch (error) {
    console.log("Full Radar alert data waiting...", error);
  }
}

updateClock();
loadAlerts();

setInterval(updateClock, 1000);
setInterval(loadAlerts, 5000);