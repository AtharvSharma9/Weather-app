import MapView from './MapView';


import { useState } from 'react';
import './App.css';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';


import { useEffect } from 'react';

function App() {
  const [city, setCity] = useState('Indore');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourly, setHourly] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('Weather');
  // Settings: theme ('dark'|'light'), unit ('metric'|'imperial'), defaultCity
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem('weather_settings');
      return raw ? JSON.parse(raw) : { theme: 'dark', unit: 'metric', defaultCity: 'Indore', showWorldCities: true, time24: false };
    } catch {
      return { theme: 'dark', unit: 'metric', defaultCity: 'Indore', showWorldCities: true, time24: false };
    }
  });

  // Apply theme class to body for CSS variables
  useEffect(() => {
    const cls = settings.theme === 'light' ? 'theme-light' : 'theme-dark';
    document.documentElement.classList.remove('theme-light', 'theme-dark');
    document.documentElement.classList.add(cls);
    try { localStorage.setItem('weather_settings', JSON.stringify(settings)); } catch {}
  }, [settings]);

  const fetchWeather = async (cityName) => {
    setLoading(true);
    setError('');
    setWeather(null);
    setForecast([]);
    setHourly([]);
    try {
      const unit = settings.unit || 'metric';
      const res = await fetch(`${BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&units=${unit}`);
      if (!res.ok) throw new Error('City not found');
      const data = await res.json();
      setWeather(data);

      const forecastRes = await fetch(`${BASE_URL}/forecast?q=${cityName}&appid=${API_KEY}&units=${unit}`);
      if (!forecastRes.ok) throw new Error('Forecast not found');
      const forecastData = await forecastRes.json();
      // Group forecast by day
      const daily = {};
      forecastData.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0];
        if (!daily[date]) daily[date] = [];
        daily[date].push(item);
      });
      // Get one forecast per day (midday)
      const sevenDay = Object.values(daily).slice(0, 7).map(items => items[Math.floor(items.length/2)]);
      setForecast(sevenDay);
      // Get today's hourly forecast (first 6 items, 3-hour intervals)
      const today = Object.values(daily)[0] || [];
      setHourly(today.slice(0, 6));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Use saved defaultCity from settings on startup
    fetchWeather(settings.defaultCity || 'Indore');
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (city.trim()) fetchWeather(city.trim());
  };

  return (
    <div className="dashboard-bg">
      <div className="dashboard-container">
        <aside className="sidebar">
          <div className="sidebar-logo">🌤️</div>
          <nav className="sidebar-nav" role="tablist" aria-label="Main navigation">
            {['Weather', 'Cities', 'RM Map', 'Settings'].map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                tabIndex={0}
                className={`nav-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveTab(tab);
                  }
                }}
              >
                {tab}
              </button>
            ))}
          </nav>
        </aside>
        <div className="main-flex">
          <main className="main-content">
            {activeTab === 'Weather' && (
              <>
                <form onSubmit={handleSubmit} className="search-bar">
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Search for cities"
                  />
                  <button type="submit" disabled={loading}>🔍</button>
                </form>
                {loading && <p className="loading">Loading...</p>}
                {error && <p className="error">{error}</p>}
                {weather && (
                  <section className="weather-main-card">
                    <div className="weather-header">
                      <div>
                        <h2>{weather.name}</h2>
                        <span className="weather-desc">Chance of rain: {weather.rain ? '10%' : '0%'}</span>
                      </div>
                      <div className="weather-icon-main">
                        <img src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`} alt={weather.weather[0].main} />
                      </div>
                    </div>
                    <div className="weather-temp">{Math.round(weather.main.temp)}°</div>
                    <div className="weather-details-row">
                      <div className="weather-details-card">
                        <h4>Today's Forecast</h4>
                        <div className="hourly-forecast-row">
                          {hourly.map((item, idx) => (
                            <div key={idx} className="hourly-forecast-card">
                              <span>{new Date(item.dt_txt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <img src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`} alt={item.weather[0].main} />
                              <span>{Math.round(item.main.temp)}°</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="weather-details-card air-conditions">
                        <div className="air-header">
                          <h4>Air Conditions</h4>
                          <button className="see-more">See more</button>
                        </div>
                        <div className="air-grid">
                          <div>
                            <span className="air-label">Real Feel</span>
                            <span className="air-value">{Math.round(weather.main.feels_like)}°</span>
                          </div>
                          <div>
                            <span className="air-label">Wind</span>
                            <span className="air-value">{weather.wind.speed} m/s</span>
                          </div>
                          <div>
                            <span className="air-label">Chance of rain</span>
                            <span className="air-value">{weather.rain ? '10%' : '0%'}</span>
                          </div>
                          <div>
                            <span className="air-label">Humidity</span>
                            <span className="air-value">{weather.main.humidity}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}
                {forecast.length > 0 && (
                  <section className="forecast-7day">
                    <h4>7-Day Forecast</h4>
                    <div className="forecast-7day-cards">
                      {forecast.map((item, idx) => (
                        <div key={idx} className="forecast-7day-card">
                          <span className="forecast-7day-day">{idx === 0 ? 'Today' : new Date(item.dt_txt).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                          <img src={`https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`} alt={item.weather[0].main} />
                          <span className="forecast-7day-main">{item.weather[0].main}</span>
                          <span className="forecast-7day-temp">{Math.round(item.main.temp_max)} / {Math.round(item.main.temp_min)}°</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {activeTab === 'Cities' && (
              <div>
                <h2 style={{ marginTop: 0 }}>Cities</h2>
                <p className="loading">Below is a list of world cities — click any to load its weather.</p>
                <CityWeatherPanel fetchWeather={fetchWeather} onSelect={(c) => { setActiveTab('Weather'); fetchWeather(c); }} />
              </div>
            )}

            {activeTab === 'RM Map' && (
                <div>
                  <h2 style={{ marginTop: 0 }}>RM Map</h2>
                  <MapView apiKey={API_KEY} />
                </div>
            )}

            {activeTab === 'Settings' && (
              <div>
                <h2 style={{ marginTop: 0 }}>Settings</h2>
                <div className="settings-panel">
                  <div className="settings-row">
                    <label>Theme</label>
                    <div className="settings-controls">
                      <button
                        className={`pill ${settings.theme === 'dark' ? 'active' : ''}`}
                        onClick={() => setSettings(s => ({ ...s, theme: 'dark' }))}
                      >Dark</button>
                      <button
                        className={`pill ${settings.theme === 'light' ? 'active' : ''}`}
                        onClick={() => setSettings(s => ({ ...s, theme: 'light' }))}
                      >Light</button>
                    </div>
                  </div>

                  <div className="settings-row">
                    <label>Temperature Unit</label>
                    <div className="settings-controls">
                      <button
                        className={`pill ${settings.unit === 'metric' ? 'active' : ''}`}
                        onClick={() => { setSettings(s => ({ ...s, unit: 'metric' })); if (weather) fetchWeather(city); }}
                      >Celsius (°C)</button>
                      <button
                        className={`pill ${settings.unit === 'imperial' ? 'active' : ''}`}
                        onClick={() => { setSettings(s => ({ ...s, unit: 'imperial' })); if (weather) fetchWeather(city); }}
                      >Fahrenheit (°F)</button>
                    </div>
                  </div>

                  <div className="settings-row">
                    <label>Default City / Region</label>
                    <div className="settings-controls">
                      <input
                        type="text"
                        value={settings.defaultCity}
                        onChange={e => setSettings(s => ({ ...s, defaultCity: e.target.value }))}
                        placeholder="e.g. New York"
                      />
                      <button className="pill" onClick={() => fetchWeather(settings.defaultCity || city)}>Apply</button>
                    </div>
                  </div>

                  <div className="settings-row">
                    <label>Show World Cities Panel</label>
                    <div className="settings-controls">
                      <button
                        className={`pill ${settings.showWorldCities ? 'active' : ''}`}
                        onClick={() => setSettings(s => ({ ...s, showWorldCities: true }))}
                      >On</button>
                      <button
                        className={`pill ${!settings.showWorldCities ? 'active' : ''}`}
                        onClick={() => setSettings(s => ({ ...s, showWorldCities: false }))}
                      >Off</button>
                    </div>
                  </div>

                  <div className="settings-row">
                    <label>Time Format</label>
                    <div className="settings-controls">
                      <button
                        className={`pill ${settings.time24 ? 'active' : ''}`}
                        onClick={() => setSettings(s => ({ ...s, time24: true }))}
                      >24-hour</button>
                      <button
                        className={`pill ${!settings.time24 ? 'active' : ''}`}
                        onClick={() => setSettings(s => ({ ...s, time24: false }))}
                      >12-hour</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
          {activeTab !== 'Cities' && settings.showWorldCities && (
            <CityWeatherPanel unit={settings.unit} fetchWeather={fetchWeather} onSelect={(c) => { setActiveTab('Weather'); fetchWeather(c); }} />
          )}
        </div>
      </div>
    </div>
  );
}


import { useEffect as useEffect2, useState as useState2 } from 'react';

function CityWeatherPanel({ fetchWeather, onSelect, unit = 'metric' }) {
  const cities = [
    'Delhi', 'Kolkata', 'New York', 'Chennai', 'Goa', 'California', 'Tokyo',
    'London', 'Paris', 'Sydney', 'Moscow', 'Dubai', 'Singapore', 'Bangkok',
    'Cape Town', 'Berlin', 'Madrid', 'Toronto', 'Istanbul', 'Hong Kong', 'Rio de Janeiro',
    'Rome', 'Seoul', 'Beijing', 'Los Angeles', 'Chicago', 'San Francisco', 'Melbourne',
    'Barcelona', 'Munich', 'Zurich', 'Vienna', 'Prague', 'Budapest', 'Warsaw', 'Brussels'
  ];
  const [cityData, setCityData] = useState2([]);
  useEffect2(() => {
    async function fetchAll() {
      const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
      const BASE_URL = 'https://api.openweathermap.org/data/2.5';
      const results = await Promise.all(
        cities.map(async (city) => {
          try {
            const res = await fetch(`${BASE_URL}/weather?q=${city}&appid=${API_KEY}&units=${unit}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            return { city, temp: Math.round(data.main.temp), icon: data.weather[0].icon, main: data.weather[0].main };
          } catch {
            return { city, temp: '--', icon: '01d', main: 'N/A' };
          }
        })
      );
      setCityData(results);
    }
    fetchAll();
  }, []);
  return (
    <div className="city-weather-panel">
      <h4>World Cities Weather</h4>
      <div className="city-weather-list">
        {cityData.map(({ city, temp, icon, main }) => (
          <button
            key={city}
            className="city-weather-btn"
            onClick={() => {
              if (onSelect) onSelect(city);
              else fetchWeather(city);
            }}
          >
            <span className="city-weather-name">{city}</span>
            <img src={`https://openweathermap.org/img/wn/${icon}.png`} alt={main} />
            <span className="city-weather-temp">{temp}°</span>
            <span className="city-weather-main">{main}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
