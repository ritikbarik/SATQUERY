import React from "react";
import { CloudSun, Droplets, Gauge, RefreshCw, ScanLine, SunMedium, Wind } from "lucide-react";
import { Card } from "../common/Card";
import type { WeatherData } from "../../types/satquery";

interface WeatherCardProps {
  weather?: WeatherData;
  onRefresh?: () => void;
  isProcessing?: boolean;
}

export const WeatherCard: React.FC<WeatherCardProps> = ({
  weather,
  onRefresh,
  isProcessing = false,
}) => {
  const temp = weather ? weather.temperature : 28.4;
  const condition = weather ? weather.condition : "Partly Cloudy";
  const humidity = weather ? weather.humidity : 64;
  const wind = weather ? weather.wind : "12 km/h";
  const cloudCover = weather ? weather.cloudCover : 18;
  const soilMoisture = weather ? weather.soilMoisture : 28.5;
  const updatedAt = weather ? weather.updatedAt : "Just now";
  const isLive = weather ? weather.isLive : true;

  return (
    <Card
      title="LIVE METEOROLOGY & SOIL"
      icon={<ScanLine size={18} />}
      className="weather-card"
    >
      <div className="weather-live-indicator">
        <span className={`status-pill ${isLive ? "live" : "cached"}`}>
          <span className="dot" /> {isLive ? "Open-Meteo Live API" : "Simulated"}
        </span>
      </div>

      <div className="weather-main">
        <div className="weather-icon-wrap">
          <CloudSun size={54} className="weather-hero-icon" />
        </div>
        <div className="weather-temp-wrap">
          <strong>{temp}°c</strong>
          <span className="weather-cond-text">{condition}</span>
        </div>
      </div>

      <div className="weather-grid">
        <div className="weather-stat-box">
          <div className="stat-label">
            <Droplets size={13} className="cyan" />
            <span>Humidity</span>
          </div>
          <strong>{humidity}%</strong>
        </div>

        <div className="weather-stat-box">
          <div className="stat-label">
            <Wind size={13} className="purple" />
            <span>Wind</span>
          </div>
          <strong>{wind}</strong>
        </div>

        <div className="weather-stat-box">
          <div className="stat-label">
            <SunMedium size={13} className="yellow" />
            <span>Cloud Cover</span>
          </div>
          <strong>{cloudCover}%</strong>
        </div>

        <div className="weather-stat-box">
          <div className="stat-label">
            <Gauge size={13} className="green" />
            <span>Topsoil Moisture</span>
          </div>
          <strong>{soilMoisture}%</strong>
        </div>
      </div>

      <div className="weather-footer">
        <span className="updated">
          Updated {updatedAt}
        </span>
        <button
          className="refresh-weather-btn"
          onClick={onRefresh}
          disabled={isProcessing}
          title="Refresh Live Meteorology"
        >
          <RefreshCw size={13} className={isProcessing ? "spin" : ""} />
        </button>
      </div>
    </Card>
  );
};
