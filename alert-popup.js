const ALERT_URL = "https://trevorwx-alert-service.onrender.com/alert.json";

const popup = document.getElementById("alertPopup");
const alertType = document.getElementById("alertType");
const alertLocation = document.getElementById("alertLocation");
const alertIcon = document.getElementById("alertIcon");

const POPUP_TIME = 15000;

let seenAlertIds = new Set();
let alertQueue = [];
let popupIsShowing = false;
let firstLoad = true;

const themes = {
  red:     { main: "#e5282f", dark: "#8e1016", glow: "#ff5960", icon: "🌪" },
  darkred: { main: "#8b0000", dark: "#430000", glow: "#e34b4b", icon: "🌪" },
  pink:    { main: "#ff4fa3", dark: "#8b174f", glow: "#ff9bcb", icon: "🌪" },
  purple:  { main: "#9f3cff", dark: "#4c118b", glow: "#c891ff", icon: "🌪" }
};

const sounds = {
  red: "sounds/tornado warning.wav",
  darkred: "sounds/Confirmed tornado warning.wav",
  pink: "sounds/pds tornado warning.wav",
  purple: "sounds/tornado emergency.wav"
};

function applyTheme(color) {
  const theme = themes[color] || themes.red;
  const root = document.documentElement;

  root.style.setProperty("--alert", theme.main);
  root.style.setProperty("--alert-dark", theme.dark);
  root.style.setProperty("--alert-glow", theme.glow);

  alertIcon.textContent = theme.icon;
}

function playAlertSound(color) {
  const soundPath = sounds[color];

  if (!soundPath) return;

  const sound = new Audio(soundPath);
  sound.volume = 1;

  sound.play().catch((error) => {
    console.log("Alert sound could not play:", error);
  });
}

function showNextAlert() {
  if (popupIsShowing || alertQueue.length === 0) return;

  popupIsShowing = true;

  const alert = alertQueue.shift();

  applyTheme(alert.color);
  alertType.textContent = alert.type || "TORNADO WARNING";
  alertLocation.textContent = alert.location || "AFFECTED AREA";

  popup.classList.remove("hidden");
  playAlertSound(alert.color);

  setTimeout(() => {
    popup.classList.add("hidden");

    setTimeout(() => {
      popupIsShowing = false;
      showNextAlert();
    }, 700);
  }, POPUP_TIME);
}

function processTornadoAlerts(alerts) {
  if (!Array.isArray(alerts)) return;

  if (firstLoad) {
    alerts.forEach((alert) => {
      if (alert.id) seenAlertIds.add(alert.id);
    });

    firstLoad = false;
    return;
  }

  const newAlerts = alerts
    .filter((alert) => alert.id && !seenAlertIds.has(alert.id))
    .sort((a, b) => (a.sent || "").localeCompare(b.sent || ""));

  newAlerts.forEach((alert) => {
    seenAlertIds.add(alert.id);
    alertQueue.push(alert);
  });

  showNextAlert();
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
    processTornadoAlerts(data.tornadoAlerts || []);
  } catch (error) {
    console.log("Alert popup waiting for alert data...", error);
  }
}

loadAlerts();
setInterval(loadAlerts, 5000);
