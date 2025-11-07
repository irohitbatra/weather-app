import { useState, useEffect } from "react";
import "./styles.css";

export default function App() {
  const [city, setCity] = useState("");
  const [selectedCity, setSelectedCity] = useState(null);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_KEY = "YOUR_API_KEY_HERE"; // replace with your API key

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // Get city suggestions
  const getCitySuggestions = async (query) => {
    if (!query) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${API_KEY}`
      );
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getCitySuggestions(city);
  }, [city]);

  // Get weather + forecast
  const getWeather = async (cityObj) => {
    if (!cityObj?.name) return;

    setSelectedCity(cityObj);
    setCity(cityObj.name);
    setSuggestions([]);
    setLoading(true);

    try {
      const { lat, lon } = cityObj;

      // Current weather
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      if (!weatherRes.ok) throw new Error(`Error ${weatherRes.status}`);
      const weatherData = await weatherRes.json();
      setWeather({ ...weatherData, cityName: cityObj.name });

      // 5-day forecast
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      if (!forecastRes.ok) throw new Error(`Error ${forecastRes.status}`);
      const forecastData = await forecastRes.json();

      // Extract one forecast per day (pick 12:00 PM)
      const dailyForecast = forecastData.list.filter((item) =>
        item.dt_txt.includes("12:00:00")
      );
      setForecast(dailyForecast);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Network error or API key issue");
      setWeather(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`container ${theme}`}>
      <h1>🌤 Weather Forecast</h1>

      {/* Theme Toggle */}
      <div className="themeToggle">
        <label className="switch">
          <input
            type="checkbox"
            onChange={toggleTheme}
            checked={theme === "dark"}
          />
          <span className="slider round"></span>
        </label>
        <span>{theme === "light" ? "Light Mode" : "Dark Mode"}</span>
      </div>

      {/* Search */}
      <div className="searchBox">
        <input
          type="text"
          placeholder="Enter city..."
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            setSelectedCity(null);
            setWeather(null);
            setForecast([]);
          }}
        />
        {suggestions.length > 0 && (
          <ul className="suggestions">
            {suggestions.map((s, idx) => (
              <li key={idx} onClick={() => getWeather(s)}>
                {s.name}, {s.country}
              </li>
            ))}
          </ul>
        )}
      </div>

      {loading && <div className="loader"></div>}

      {error && <p className="error">{error}</p>}

      {/* Current Weather */}
      {weather && (
        <div className="card current">
          <h2>{weather.cityName}</h2>
          <p className="temp">{weather.main.temp.toFixed(1)}°C</p>
          <p>{weather.weather[0].main}</p>
          <p>Humidity: {weather.main.humidity}%</p>
          <p>Wind: {weather.wind.speed} m/s</p>
        </div>
      )}

      {/* 5-Day Forecast */}
      {forecast.length > 0 && (
        <div className="forecast">
          {forecast.map((day, idx) => {
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString("en-US", {
              weekday: "short",
            });
            return (
              <div className="card day" key={idx}>
                <h4>{dayName}</h4>
                <img
                  src={`http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                  alt={day.weather[0].description}
                />
                <p>{day.main.temp.toFixed(1)}°C</p>
                <p>{day.weather[0].main}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
