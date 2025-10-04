# NCR Weather App

Simple Node + Express app that shows current weather for cities in the National Capital Region (Philippines) using OpenWeatherMap.

Quick start

1. Install dependencies

   Open a terminal and run:

    npm install

2. Start the server

   node index.js

3. Open http://localhost:3000 in your browser.

Notes
- The project uses the OpenWeatherMap API key from `.env`. The provided key has been written to `.env` already.
- Tailwind and Font Awesome are loaded via CDN in `public/index.html`.
# NCR Weather App

A small Node + Express application that shows the current weather for cities in the National Capital Region (Philippines) using the OpenWeatherMap API.

## Quick start

Requirements
- Node.js (v14+ recommended)
- npm

1) Install dependencies

Open PowerShell and run:

```powershell
cd C:\Users\ADMIN\Desktop\AWS\WeatherApp
npm install
```

2) Add your OpenWeatherMap API key

Create a file named `.env` in the project root and add your API key as:

```text
OPENWEATHERMAP_API_KEY=your_api_key_here
```

You can create it from PowerShell with:

```powershell
"OPENWEATHERMAP_API_KEY=your_api_key_here" > .env
```

3) Start the server

```powershell
node index.js
npm start
```

4) Open the app

Visit http://localhost:3000 in your browser.

