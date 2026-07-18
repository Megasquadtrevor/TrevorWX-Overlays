// =========================================================
// TREVORWX IRL STORM CHASER OVERLAY
// =========================================================

const ALERT_URL =
  "https://trevorwx-alert-service.onrender.com/alert.json";


// =========================================================
// CLOCK + DATE
// =========================================================

function updateClock() {
  const now = new Date();

  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });

  const date = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const timeElement = document.getElementById("currentTime");
  const dateElement = document.getElementById("currentDate");

  if (timeElement) {
    timeElement.textContent = time;
  }

  if (dateElement) {
    dateElement.textContent = date;
  }
}

updateClock();

setInterval(updateClock, 1000);


// =========================================================
// ESCAPE HTML
// Prevent alert data from inserting unwanted HTML
// =========================================================

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


// =========================================================
// DETERMINE WARNING STYLE
// =========================================================

function getWarningClass(alert) {
  const event = String(
    alert.event ||
    alert.type ||
    alert.headline ||
    ""
  ).toLowerCase();

  const headline = String(
    alert.headline || ""
  ).toLowerCase();

  const description = String(
    alert.description || ""
  ).toLowerCase();

  const combined =
    event + " " +
    headline + " " +
    description;

  if (
    combined.includes("tornado emergency")
  ) {
    return "warning-emergency";
  }

  if (
    combined.includes("particularly dangerous") ||
    combined.includes("pds")
  ) {
    return "warning-pds";
  }

  if (
    combined.includes("confirmed tornado") ||
    combined.includes("observed tornado")
  ) {
    return "warning-confirmed";
  }

  if (
    combined.includes("tornado warning") ||
    event.includes("tornado")
  ) {
    return "warning-tornado";
  }

  if (
    combined.includes("severe thunderstorm")
  ) {
    return "warning-severe";
  }

  if (
    combined.includes("flash flood")
  ) {
    return "warning-flood";
  }

  return "";
}


// =========================================================
// FORMAT ALERT NAME
// =========================================================

function getAlertName(alert) {
  return (
    alert.event ||
    alert.headline ||
    alert.type ||
    "Weather Alert"
  );
}


// =========================================================
// FORMAT ALERT LOCATION
// =========================================================

function getAlertLocation(alert) {
  return (
    alert.areaDesc ||
    alert.location ||
    alert.area ||
    "Location unavailable"
  );
}


// =========================================================
// FORMAT EXPIRATION
// =========================================================

function formatExpiration(alert) {
  const expires =
    alert.expires ||
    alert.ends ||
    alert.end ||
    null;

  if (!expires) {
    return "ACTIVE";
  }

  const date = new Date(expires);

  if (Number.isNaN(date.getTime())) {
    return "ACTIVE";
  }

  return (
    "UNTIL " +
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    })
  );
}


// =========================================================
// GET ALERT ARRAY
// Supports multiple possible backend structures
// =========================================================

function extractAlerts(data) {
  if (Array.isArray(data.alerts)) {
    return data.alerts;
  }

  if (Array.isArray(data.activeAlerts)) {
    return data.activeAlerts;
  }

  if (Array.isArray(data.features)) {
    return data.features.map(
      feature => feature.properties || feature
    );
  }

  // If backend currently sends one popup alert
  if (
    data.show &&
    (
      data.headline ||
      data.type ||
      data.event
    )
  ) {
    return [data];
  }

  return [];
}


// =========================================================
// DISPLAY ACTIVE WARNINGS
// =========================================================

function displayAlerts(alerts) {
  const container =
    document.getElementById("activeWarnings");

  const total =
    document.getElementById("totalAlerts");

  if (!container || !total) {
    return;
  }

  total.textContent = alerts.length;

  if (alerts.length === 0) {
    container.innerHTML = `
      <div class="no-alerts">
        No Active TrevorWX Alerts
      </div>
    `;

    return;
  }

  const priorityAlerts =
    alerts.slice(0, 5);

  container.innerHTML =
    priorityAlerts
      .map(alert => {
        const warningClass =
          getWarningClass(alert);

        const name =
          escapeHTML(
            getAlertName(alert)
          );

        const location =
          escapeHTML(
            getAlertLocation(alert)
          );

        const expiration =
          escapeHTML(
            formatExpiration(alert)
          );

        return `
          <div class="warning-item ${warningClass}">

            <div class="warning-icon">
              ⚠
            </div>

            <div class="warning-info">

              <strong>
                ${name}
              </strong>

              <span>
                ${location}
              </span>

            </div>

            <div class="warning-time">
              ${expiration}
            </div>

          </div>
        `;
      })
      .join("");
}


// =========================================================
// UPDATE ALERT TICKER
// =========================================================

function updateTicker(alerts) {
  const ticker =
    document.getElementById("tickerText");

  if (!ticker) {
    return;
  }

  if (alerts.length === 0) {
    ticker.textContent =
      "TrevorWX Severe Weather Alert System Online • Monitoring NWS alerts across the United States";

    return;
  }

  const tickerMessages =
    alerts
      .slice(0, 10)
      .map(alert => {
        return (
          getAlertName(alert) +
          " — " +
          getAlertLocation(alert)
        );
      });

  ticker.textContent =
    tickerMessages.join(
      "     •     "
    );
}


// =========================================================
// FETCH LIVE TREVORWX ALERT DATA
// =========================================================

async function fetchAlertData() {
  try {
    const response =
      await fetch(
        ALERT_URL +
        "?t=" +
        Date.now(),
        {
          cache: "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        "Alert server returned " +
        response.status
      );
    }

    const data =
      await response.json();

    const alerts =
      extractAlerts(data);

    displayAlerts(alerts);

    updateTicker(alerts);

  } catch (error) {
    console.error(
      "TrevorWX alert fetch error:",
      error
    );

    const ticker =
      document.getElementById(
        "tickerText"
      );

    if (ticker) {
      ticker.textContent =
        "TrevorWX Alert Service connection interrupted • Attempting to reconnect automatically";
    }
  }
}


// Run immediately

fetchAlertData();


// Refresh every 5 seconds

setInterval(
  fetchAlertData,
  5000
);


// =========================================================
// FUTURE LIVE DATA CONNECTIONS
// =========================================================
//
// These will be connected in later phases:
//
// updateGPS()
// updateCurrentLocation()
// updateElevation()
//
// updateTemperature()
// updateDewPoint()
// updateWindSpeed()
// updateWindGust()
// updateHumidity()
// updatePressure()
//
// updateSPCOutlook()
//
// updateChaserFeeds()
//
// connectTrevorWXDashboard()
//
// =========================================================
