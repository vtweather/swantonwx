// Swanton Village Weather
// Live observations from KVTSWANT4

const WEATHER_API =
  "https://swantonwx-weather-e2ef.vtweather.workers.dev/";

function valueOrDash(value, suffix = "") {
  return value !== null && value !== undefined
    ? `${value}${suffix}`
    : "--";
}

function windDirection(degrees) {
  if (degrees === null || degrees === undefined) return "--";

  const directions = [
    "N", "NNE", "NE", "ENE",
    "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW",
    "W", "WNW", "NW", "NNW"
  ];

  return directions[Math.round(degrees / 22.5) % 16];
}

async function loadWeather() {
  try {
    const response = await fetch(WEATHER_API, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Weather API returned ${response.status}`);
    }

    const weather = await response.json();

    // Main current temperature
    document.getElementById("temperature").textContent =
      valueOrDash(weather.temperature, "°F");

    // Temperature card
    document.getElementById("temp-details").textContent =
      `${valueOrDash(weather.temperature, "°F")} • ` +
      `Feels like ${valueOrDash(weather.feelsLike, "°F")} • ` +
      `Humidity ${valueOrDash(weather.humidity, "%")} • ` +
      `Dew point ${valueOrDash(weather.dewPoint, "°F")}`;

    // Wind card
    document.getElementById("wind-details").textContent =
      `${windDirection(weather.windDirection)} ` +
      `${valueOrDash(weather.windSpeed, " mph")} • ` +
      `Gust ${valueOrDash(weather.windGust, " mph")}`;

    // Rain card
    document.getElementById("rain-details").textContent =
      `Today ${valueOrDash(weather.rainTotal, " in")} • ` +
      `Rate ${valueOrDash(weather.rainRate, " in/hr")}`;

    // Pressure card
    document.getElementById("pressure-details").textContent =
      valueOrDash(weather.pressure, " inHg");

    // Last station observation
    if (weather.observationTime) {
      const observed = new Date(weather.observationTime);

      document.getElementById("updated").textContent =
        `Station KVTSWANT4 • Updated ${observed.toLocaleString([], {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
        })}`;
    } else {
      document.getElementById("updated").textContent =
        "Station KVTSWANT4 • Live";
    }

  } catch (error) {
    console.error("Weather data error:", error);

    document.getElementById("temperature").textContent = "--°F";
    document.getElementById("updated").textContent =
      "Station KVTSWANT4 • Live data temporarily unavailable";
  }
}

// Load immediately
loadWeather();

// Refresh live observations every 60 seconds
setInterval(loadWeather, 60000);

// =====================================================
// NATIONAL WEATHER SERVICE ALERTS
// =====================================================

const ALERTS_API =
  "https://swantonwx-weather-e2ef.vtweather.workers.dev/alerts";

async function loadAlerts() {
  const title = document.getElementById("alert-title");
  const message = document.getElementById("alert-message");
  const details = document.getElementById("alert-details");

  try {
    const response = await fetch(ALERTS_API, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`NWS alerts request failed: ${response.status}`);
    }

    const data = await response.json();

    // No active alerts
    if (!data.alerts || data.alerts.length === 0) {
      title.textContent = "No Active Weather Alerts";
      message.textContent =
        "There are currently no active National Weather Service alerts for the Swanton area.";
      details.innerHTML = "";
      return;
    }

    // Active alerts
    title.textContent =
      data.alerts.length === 1
        ? "1 Active Weather Alert"
        : `${data.alerts.length} Active Weather Alerts`;

    message.textContent =
      "National Weather Service alerts currently affecting the Swanton area:";

    details.innerHTML = "";

    data.alerts.forEach((alert) => {
      const alertItem = document.createElement("div");
      alertItem.className = "nws-alert";

      const heading = document.createElement("h3");
      heading.textContent = alert.event || "Weather Alert";

      const headline = document.createElement("p");
      headline.textContent =
        alert.headline || alert.description || "";

      alertItem.appendChild(heading);
      alertItem.appendChild(headline);

      if (alert.instruction) {
        const instructions = document.createElement("p");
        instructions.textContent = alert.instruction;
        alertItem.appendChild(instructions);
      }

      details.appendChild(alertItem);
    });

  } catch (error) {
    console.error("NWS alert error:", error);

    title.textContent = "Weather Alerts";
    message.textContent =
      "National Weather Service alert information is temporarily unavailable.";
    details.innerHTML = "";
  }
}

// Load alerts immediately
loadAlerts();

// Check for new NWS alerts every 5 minutes
setInterval(loadAlerts, 300000);
