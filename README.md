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
- The project reads the OpenWeatherMap API key from a `.env` file at the project root using `dotenv`.
   - A default `.env` has been created with the key for convenience. To use your own key, replace the value of `OPENWEATHERMAP_API_KEY` in `.env`.
- Tailwind and Font Awesome are loaded via CDN in `public/index.html`.
