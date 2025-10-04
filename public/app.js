const NCR_CITIES = [
  'Manila',
  'Quezon City',
  'Caloocan',
  'Makati',
  'Pasig',
  'Taguig',
  'Mandaluyong',
  'Parañaque',
  'Las Piñas',
  'Muntinlupa',
  'Pasay',
  'Valenzuela'
];

const citiesContainer = document.getElementById('cities');
const resultContainer = document.getElementById('result');
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');

// filter elements
const showIconEl = document.getElementById('showIcon');
const showTempEl = document.getElementById('showTemp');
const showDescEl = document.getElementById('showDesc');
const showHumidityEl = document.getElementById('showHumidity');
const showWindEl = document.getElementById('showWind');

function createCityButtons() {
  NCR_CITIES.forEach((c) => {
    const btn = document.createElement('button');
    btn.className = 'city-pill px-4 py-2 bg-white border border-slate-100 rounded-full shadow-sm text-sm hover:bg-sky-50 transition';
    btn.textContent = c;
    btn.onclick = () => fetchAndShow(c);
    citiesContainer.appendChild(btn);
  });
}

// small helpers
function degToCompass(num) {
  const val = Math.floor((num / 22.5) + 0.5);
  const arr = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
  return arr[(val % 16)];
}

function formatLocalTime(unixSec, tzOffsetSec) {
  // unixSec is in UTC seconds, tzOffsetSec is seconds to add to get local time
  const dt = new Date((unixSec + (tzOffsetSec || 0)) * 1000);
  // use UTC getters because we've already applied the tz offset
  const hh = String(dt.getUTCHours()).padStart(2,'0');
  const mm = String(dt.getUTCMinutes()).padStart(2,'0');
  return `${hh}:${mm}`;
}

async function fetchWeather(city) {
  // Call server-side API which should read OPENWEATHERMAP_API_KEY from server env vars.
  // On Vercel, configure the variable under Project Settings -> Environment Variables.
  const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
  if (!res.ok) {
    // try to read JSON error body, fallback to text
    const body = await res.text().catch(() => '');
    let parsed = null;
    try { parsed = JSON.parse(body); } catch (e) { /* not JSON */ }
    const msg = parsed?.error || parsed?.message || body || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return res.json();
}

function renderCard(data) {
  const city = data.name;
  const temp = Math.round(data.main.temp);
  const description = data.weather?.[0]?.description || '';
  const icon = data.weather?.[0]?.icon;
  const humidity = data.main.humidity;
  const wind = data.wind.speed;
  const windDeg = data.wind.deg;
  const feels = Math.round(data.main.feels_like);
  const tmin = Math.round(data.main.temp_min);
  const tmax = Math.round(data.main.temp_max);
  const pressure = data.main.pressure;
  const sunrise = data.sys?.sunrise;
  const sunset = data.sys?.sunset;
  const tz = data.timezone || 0;
  const el = document.createElement('div');
  el.className = 'bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition card-hover';

  const badgeColor = (description.toLowerCase().includes('rain') || description.toLowerCase().includes('shower')) ? 'from-sky-400 to-indigo-500' : 'from-amber-400 to-rose-400';

  const leftHtml = `
    <div class="flex flex-col">
      <div class="flex items-baseline gap-3">
        <div class="text-lg font-semibold">${city}</div>
        <div class="ml-2 text-xs text-slate-400">${new Date().toLocaleDateString()}</div>
      </div>
      ${showDescEl.checked ? `<div class="text-sm text-slate-500 capitalize mt-1">${description}</div>` : ''}
      <div class="mt-3 flex gap-3 items-center text-sm text-slate-500">
        ${showHumidityEl.checked ? `<div class="flex items-center gap-2"><i class="fa-solid fa-droplet text-sky-500"></i><span>${humidity}%</span></div>` : ''}
        ${showWindEl.checked ? `<div class="flex items-center gap-2"><i class="fa-solid fa-wind text-slate-400"></i><span>${wind} m/s${windDeg ? ' · '+degToCompass(windDeg) : ''}</span></div>` : ''}
        <div class="flex items-center gap-2"><i class="fa-solid fa-gauge-high text-slate-400"></i><span>${pressure} hPa</span></div>
      </div>
    </div>
  `;

  const rightHtml = `
    <div class="flex items-center gap-4">
      ${showIconEl.checked && icon ? `<img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="icon" class="w-14 h-14"/>` : ''}
      <div class="flex flex-col items-end">
        ${showTempEl.checked ? `<div class="text-3xl temp-large">${temp}°C</div>` : ''}
        <div class="text-xs text-slate-400">Feels ${feels}° • ${tmin}°/${tmax}°</div>
      </div>
    </div>
  `;

  const sunriseHtml = sunrise ? `<div class="flex items-center gap-2 text-xs text-slate-400"><i class="fa-solid fa-sun text-amber-400"></i><span>${formatLocalTime(sunrise, tz)}</span></div>` : '';
  const sunsetHtml = sunset ? `<div class="flex items-center gap-2 text-xs text-slate-400"><i class="fa-solid fa-moon text-indigo-400"></i><span>${formatLocalTime(sunset, tz)}</span></div>` : '';

  el.innerHTML = `
    <div class="flex items-start justify-between">
      ${leftHtml}
      ${rightHtml}
    </div>
    <div class="mt-3 flex items-center justify-between text-sm">
      <div class="flex gap-4 items-center text-slate-400">
        ${sunriseHtml}
        ${sunsetHtml}
      </div>
      <div class="text-xs text-slate-400">Updated now</div>
    </div>
  `;

  // store data on element for re-render when filters change
  el.__weatherData = data;
  // also store a normalized city string for quick lookup
  try {
    el.dataset.city = (data.name || '').toLowerCase();
  } catch (e) {
    // ignore if dataset isn't writable for some reason
  }

  return el;
}

async function fetchAndShow(city) {
  const norm = (city || '').trim().toLowerCase();

  // if there's already a loader for this city, don't start another request
  const alreadyLoading = Array.from(resultContainer.children).some((c) => c.__isLoader && c.__cityName && c.__cityName.toLowerCase() === norm);
  if (alreadyLoading) return;

  const loader = document.createElement('div');
  loader.className = 'p-4 bg-white rounded shadow';
  loader.textContent = `Loading ${city}...`;
  loader.__isLoader = true;
  loader.__cityName = city;

  // If a card for this city already exists, replace it with the loader (refresh). Otherwise prepend.
  const existingCard = Array.from(resultContainer.children).find((c) => c.__weatherData && ((c.__weatherData.name || '').toLowerCase() === norm || (c.dataset && c.dataset.city === norm)));
  if (existingCard) {
    resultContainer.replaceChild(loader, existingCard);
  } else {
    resultContainer.prepend(loader);
  }

  try {
    const data = await fetchWeather(city);
    const card = renderCard(data);
    // replace loader with fresh card (if loader still present)
    if (loader.parentNode === resultContainer) {
      resultContainer.replaceChild(card, loader);
    } else {
      // fallback: prepend card
      resultContainer.prepend(card);
    }
  } catch (err) {
    loader.className = 'p-4 bg-red-50 border border-red-200 rounded';
    loader.textContent = `Error loading ${city}: ${err.message}`;
    loader.__isLoader = false;
  }
}

searchBtn.addEventListener('click', () => {
  const v = cityInput.value.trim();
  if (v) fetchAndShow(v);
});

cityInput.addEventListener('keyup', (e) => {
  if (e.key === 'Enter') searchBtn.click();
});

createCityButtons();

// when filters change, re-render existing cards to show selected fields only
function rerenderAll() {
  const children = Array.from(resultContainer.children);
  children.forEach((child) => {
    const data = child.__weatherData;
    if (data) {
      const newEl = renderCard(data);
      resultContainer.replaceChild(newEl, child);
    }
  });
}

[showIconEl, showTempEl, showDescEl, showHumidityEl, showWindEl].forEach((el) => {
  if (el) el.addEventListener('change', rerenderAll);
});
