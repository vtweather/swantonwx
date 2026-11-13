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

// =====================================================
// NATIONAL WEATHER SERVICE FORECAST
// =====================================================

const FORECAST_API =
  "https://swantonwx-weather-e2ef.vtweather.workers.dev/forecast";

async function loadForecast() {
  const forecastGrid = document.getElementById("forecast-grid");

  if (!forecastGrid) return;

  try {
    const response = await fetch(FORECAST_API, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Forecast request failed: ${response.status}`);
    }

    const data = await response.json();
    const periods = data.periods || [];

    forecastGrid.innerHTML = "";

    // Show the first 8 NWS forecast periods
    periods.slice(0, 8).forEach((period) => {
      const card = document.createElement("article");
      card.className = "card forecast-card";

      const name = document.createElement("h3");
      name.textContent = period.name;

      const icon = document.createElement("img");
      icon.src = period.icon;
      icon.alt = period.shortForecast || period.name;
      icon.loading = "lazy";

      const temperature = document.createElement("div");
      temperature.className = "forecast-temp";
      temperature.textContent =
        `${period.temperature}°${period.temperatureUnit}`;

      const conditions = document.createElement("p");
      conditions.textContent = period.shortForecast;

      const precipitation = document.createElement("small");

      if (
        period.probabilityOfPrecipitation !== null &&
        period.probabilityOfPrecipitation !== undefined
      ) {
        precipitation.textContent =
          `Precipitation: ${period.probabilityOfPrecipitation}%`;
      }

      const wind = document.createElement("small");
      wind.textContent =
        `Wind: ${period.windDirection} ${period.windSpeed}`;

      card.appendChild(name);
      card.appendChild(icon);
      card.appendChild(temperature);
      card.appendChild(conditions);

      if (precipitation.textContent) {
        card.appendChild(precipitation);
      }

      card.appendChild(document.createElement("br"));
      card.appendChild(wind);

      forecastGrid.appendChild(card);
    });

  } catch (error) {
    console.error("NWS forecast error:", error);

    forecastGrid.innerHTML = `
      <article class="card">
        <h3>Forecast Unavailable</h3>
        <p>The National Weather Service forecast is temporarily unavailable.</p>
      </article>
    `;
  }
}

// Load forecast immediately
loadForecast();

// Refresh the NWS forecast every 15 minutes
setInterval(loadForecast, 900000);

// HISTORICAL TEMPERATURE GRAPH

const HISTORY_API =
 "https://swantonwx-weather-e2ef.vtweather.workers.dev/history";

async function loadTemperatureHistory() {
  const canvas = document.getElementById("temperature-chart");
  const status = document.getElementById("history-status");

 if (!canvas) return;

  try {
    const response = await fetch(HISTORY_API + "?hours=24");

    if (!response.ok) {
      throw new Error("History request failed");
    }

    const data = await response.json();
    console.log("History API response:", data);
    const observations = (data.observations || [])
      .filter(item => item.temperature != null)
      .sort((a, b) =>
        a.observed_at.localeCompare(b.observed_at)
      );
function parseVermontTime(timestamp) {
  if (!timestamp) return new Date(NaN);

  const normalized = timestamp.replace(" ", "T");

  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(normalized)) {
    return new Date(normalized);
  }

  // Interpret timestamps without a timezone as Vermont local time.
  const offset = "-05:00"; // EST in November
  return new Date(normalized + offset);
}
    const todayVermont = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
}).format(new Date());

const todaysObservations = observations.filter(item => {
  const observationDate = parseVermontTime(item.observed_at)
    .toLocaleDateString("en-CA", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });

  return observationDate === todayVermont;
});
const now = new Date();

const vermontParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "numeric",
  day: "numeric"
}).formatToParts(now);

const getPart = type =>
  Number(vermontParts.find(part => part.type === type).value);

const year = getPart("year");
const month = getPart("month");
const day = getPart("day");

function vermontMidnight(y, m, d) {
  const date = new Date(Date.UTC(y, m - 1, d, 12));

  const zone = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "shortOffset"
  }).format(date);

  const offsetHours = zone.includes("-4") ? 4 : 5;

  return Date.UTC(y, m - 1, d, offsetHours);
}

const dayStart = vermontMidnight(year, month, day);
const nextDayStart = vermontMidnight(year, month, day + 1);
const highElement = document.getElementById("daily-high");
const lowElement = document.getElementById("daily-low");

if (todaysObservations.length > 0) {
  const temperatures = todaysObservations.map(item => Number(item.temperature));

  const dailyHigh = Math.max(...temperatures);
  const dailyLow = Math.min(...temperatures);

  if (highElement) highElement.textContent = dailyHigh.toFixed(1) + " °F";
  if (lowElement) lowElement.textContent = dailyLow.toFixed(1) + " °F";
} else {
  if (highElement) highElement.textContent = "-- °F";
  if (lowElement) lowElement.textContent = "-- °F";
}
    if (observations.length < 2) {
      if (status) status.textContent = "Not enough historical data yet.";
      return;
    }

    const width = Math.max(200, canvas.parentElement.getBoundingClientRect().width - 20);
    const height = window.innerWidth <= 600 ? 200 : 240;
    const ratio = window.devicePixelRatio || 1;

    canvas.width = width * ratio;
    canvas.height = height * ratio;

    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);

    const padding = 65;
    const temps = observations.map(item => item.temperature);
    const min = Math.floor(Math.min(...temps) - 2);
    const max = Math.ceil(Math.max(...temps) + 2);
    const range = max - min || 1;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "#94a3b8";
    ctx.fillStyle = "#64748b";
    ctx.font = "12px sans-serif";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = padding +
        (i / 4) * (height - padding * 2);

      const temp = max - (i / 4) * range;

      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - 10, y);
      ctx.stroke();

      ctx.fillText(
        temp.toFixed(0) + "°",
        2,
        y + 4
      );
    }

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 3;
    ctx.beginPath();

    observations.forEach((item, index) => {
       const x = padding +
    ((parseVermontTime(item.observed_at).getTime() - dayStart) /
    (nextDayStart - dayStart)) *
    (width - padding - 15);

      const y = padding +
        ((max - item.temperature) / range) *
        (height - padding * 2);

      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    ctx.stroke();

     // Display observation times in Vermont local time
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";

const isMobile = window.innerWidth <= 600;

// Fixed midnight-to-midnight Vermont time labels
const timeLabels = [
  { hour: 0, label: "12 AM" },
  { hour: 6, label: "6 AM" },
  { hour: 12, label: "12 PM" },
  { hour: 18, label: "6 PM" },
  { hour: 24, label: "12 AM" }
];

ctx.fillStyle = "#e2e8f0";
ctx.font = "12px sans-serif";

timeLabels.forEach(({ hour, label }) => {
  const x = padding +
    (hour / 24) * (width - padding - 15);

  ctx.textAlign =
    hour === 0 ? "left" :
    hour === 24 ? "right" : "center";

  ctx.fillText(label, x, height - 12);
});

ctx.textAlign = "left";

    if (status) {
  status.textContent =
    "Showing " + observations.length +
    " observations from the last 24 hours.";
}

  } catch (error) {
    console.error("Weather history error:", error);
   if (status) {
  status.textContent =
    "Unable to load historical weather data.";
}
  }
}

loadTemperatureHistory();
setInterval(loadTemperatureHistory, 300000);


async function loadWindHistory() {
  const canvas = document.getElementById("wind-chart");
  const status = document.getElementById("wind-history-status");

  if (!canvas) return;

  try {
    const response = await fetch(HISTORY_API + "?hours=48");

    if (!response.ok) {
      throw new Error("Wind history request failed");
    }

    const data = await response.json();
    const todayVT = new Date().toLocaleDateString("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
});

const observations = (data.observations || [])
  .filter(item => {
    if (item.wind_speed == null || !item.observed_at) return false;

    const observationDate = new Date(item.observed_at)
      .toLocaleDateString("en-CA", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });

    return observationDate === todayVT;
  })
  .sort((a, b) => a.observed_at.localeCompare(b.observed_at));
const maxSustained = Math.max(
  0,
  ...observations
    .map(item => Number(item.wind_speed))
    .filter(Number.isFinite)
);
    const maxSustainedObservation = observations.find(
  item => Number(item.wind_speed) === maxSustained
);
    const maxGust = Math.max(
  0,
  ...observations
    .map(item => Number(item.wind_gust))
    .filter(Number.isFinite)
);
    const maxGustObservation = observations.find(
  item => Number(item.wind_gust) === maxGust
);
    const sustainedTimeDisplay = document.getElementById("max-sustained-time");

if (sustainedTimeDisplay && maxSustainedObservation) {
  sustainedTimeDisplay.textContent = "Recorded: " +
    new Date(maxSustainedObservation.observed_at).toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
}
    const sustainedDisplay = document.getElementById("max-sustained");
    const gustTimeDisplay = document.getElementById("max-gust-time");

if (gustTimeDisplay && maxGustObservation) {
  gustTimeDisplay.textContent = "Recorded: " +
    new Date(maxGustObservation.observed_at).toLocaleString("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
}
    const gustDisplay = document.getElementById("max-gust");

if (sustainedDisplay) {
  sustainedDisplay.textContent = maxSustained.toFixed(1) + " mph";
}

if (gustDisplay) {
  gustDisplay.textContent = maxGust.toFixed(1) + " mph";
}


    if (observations.length < 2) {
      if (status) status.textContent = "Not enough wind history yet.";
      return;
    }

    const width = canvas.clientWidth || 600;
    const height = window.innerWidth <= 600 ? 220 : 240;
    const ratio = window.devicePixelRatio || 1;

    canvas.width = width * ratio;
    canvas.height = height * ratio;

    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);

    const padding = 40;
    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;
    const now = new Date();

const vtDateParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
}).formatToParts(now);

const getPart = type =>
  Number(vtDateParts.find(part => part.type === type).value);

const year = getPart("year");
const month = getPart("month");
const day = getPart("day");

const offsetHours = new Date(
  Date.UTC(year, month - 1, day, 12)
).toLocaleString("en-US", {
  timeZone: "America/New_York",
  timeZoneName: "short"
}).includes("EDT") ? 4 : 5;

const dayStart = Date.UTC(
  year, month - 1, day, offsetHours
);

const nextDayOffsetHours = new Date(
  Date.UTC(year, month - 1, day + 1, 12)
).toLocaleString("en-US", {
  timeZone: "America/New_York",
  timeZoneName: "short"
}).includes("EDT") ? 4 : 5;

const nextDayStart = Date.UTC(
  year, month - 1, day + 1, nextDayOffsetHours
);

const timeToX = timestamp =>
  padding + ((new Date(timestamp).getTime() - dayStart) /
  (nextDayStart - dayStart)) * plotWidth;

    const maxWind = Math.max(
      5,
      ...observations.map(item =>
        Math.max(item.wind_speed || 0, item.wind_gust || 0)
      )
    );

    const yMax = Math.ceil(maxWind / 5) * 5;

    ctx.clearRect(0, 0, width, height);
    ctx.font = "12px sans-serif";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const value = (yMax / 4) * i;
      const y = height - padding - (i / 4) * plotHeight;

      ctx.strokeStyle = "#64748b";
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(value.toFixed(1), 4, y + 4);
    }

    function drawLine(field, color) {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;

      observations.forEach((item, index) => {
       const x = timeToX(item.observed_at);
        const y = height - padding -
          ((item[field] || 0) / yMax) * plotHeight;

        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.stroke();
    }

    drawLine("wind_speed", "#38bdf8");
    
    // Draw wind gusts as yellow dots
ctx.fillStyle = "#fbbf24";

observations.forEach((item, index) => {
  const gust = Number(item.wind_gust);

  if (!Number.isFinite(gust) || gust <= 0) return;

  const x = timeToX(item.observed_at);

  const y = height - padding -
    (gust / yMax) * plotHeight;

  ctx.beginPath();
  ctx.arc(x, y, 1.5, 0, Math.PI * 2);
  ctx.fill();
});
// Display wind observation times in Vermont local time
ctx.fillStyle = "#e2e8f0";
ctx.font = "12px sans-serif";

// Fixed midnight-to-midnight time labels
const windTimeLabels = [
  "12 AM",
  "6 AM",
  "12 PM",
  "6 PM",
  "12 AM"
];

windTimeLabels.forEach((label, index) => {
  const x = padding + (index / 4) * plotWidth;

  ctx.textAlign =
    index === 0 ? "left" :
    index === 4 ? "right" : "center";

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "12px sans-serif";
  ctx.fillText(label, x, height - 12);
});

ctx.textAlign = "left";

if (status) {
  status.textContent =
    "Showing " + observations.length +
    " wind observations for today (12 AM - 12 AM Vermont time). " +
    "Blue = Wind Speed | Yellow = Wind Gusts (mph)";
}

  } catch (error) {
    console.error("Wind history error:", error);
    if (status) status.textContent = "Unable to load wind history.";
  }
}

loadWindHistory();
setInterval(loadWindHistory, 300000);
