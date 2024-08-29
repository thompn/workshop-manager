// src/components/TimeWeather.jsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FaSun, FaCloudSun, FaCloud, FaCloudRain, FaSnowflake } from 'react-icons/fa';

const TimeWeather = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius`);
        const data = await response.json();
        setWeather({
          temperature: Math.round(data.current_weather.temperature),
          condition: getWeatherCondition(data.current_weather.weathercode),
        });
      } catch (err) {
        setError('Failed to fetch weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  };

  const getWeatherCondition = (weathercode) => {
    const weatherCodes = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Slight snow fall',
      73: 'Moderate snow fall',
      75: 'Heavy snow fall',
      95: 'Thunderstorm',
    };
    return weatherCodes[weathercode] || 'Unknown';
  };

  const getWeatherIcon = (condition) => {
    if (condition.includes('Clear') || condition.includes('Mainly clear')) {
      return <FaSun className="text-yellow-400" />;
    } else if (condition.includes('Partly cloudy')) {
      return <FaCloudSun className="text-gray-400" />;
    } else if (condition.includes('Overcast') || condition.includes('Fog')) {
      return <FaCloud className="text-gray-500" />;
    } else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('Thunderstorm')) {
      return <FaCloudRain className="text-blue-400" />;
    } else if (condition.includes('snow')) {
      return <FaSnowflake className="text-blue-200" />;
    } else {
      return <FaCloudSun className="text-gray-400" />;
    }
  };

  return (
    <div className="mb-8 flex items-center">
      {weather && getWeatherIcon(weather.condition)}
      <div className="ml-4">
        <p className="text-xl">The time is {format(currentTime, 'h:mm:ss a')}</p>
        {loading && <p>Loading weather data...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {weather && (
          <p className="text-xl">The weather is {weather.temperature}°C and {weather.condition}</p>
        )}
      </div>
    </div>
  );
};

export default TimeWeather;