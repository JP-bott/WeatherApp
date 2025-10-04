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
    btn.className = 'px-3 py-1 bg-white border rounded shadow-sm text-sm hover:bg-sky-50';
    btn.textContent = c;
    btn.onclick = () => fetchAndShow(c);
    citiesContainer.appendChild(btn);
  });
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

  const el = document.createElement('div');
  el.className = 'bg-white p-4 rounded shadow';

  // Build pieces based on filters
  const leftParts = [];
  if (showDescEl.checked) {
    leftParts.push(`<div class="text-sm text-slate-500 capitalize">${description}</div>`);
  }
  leftParts.unshift(`<div class="text-lg font-semibold">${city}</div>`);

  const rightParts = [];
  if (showIconEl.checked && icon) {
    rightParts.push(`<img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="icon" />`);
  }
  if (showTempEl.checked) {
    rightParts.push(`<div class="text-3xl font-bold">${temp}°C</div>`);
  }

  const bottomParts = [];
  if (showHumidityEl.checked) bottomParts.push(`<div><i class="fa-solid fa-droplet"></i> ${humidity}%</div>`);
  if (showWindEl.checked) bottomParts.push(`<div><i class="fa-solid fa-wind"></i> ${wind} m/s</div>`);

  el.innerHTML = `
    <div class="flex items-center justify-between">
      <div>${leftParts.join('\n')}</div>
      <div class="flex items-center gap-3">${rightParts.join('\n')}</div>
    </div>
    ${bottomParts.length ? `<div class="mt-3 text-sm text-slate-600 flex gap-4">${bottomParts.join('\n')}</div>` : ''}
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
