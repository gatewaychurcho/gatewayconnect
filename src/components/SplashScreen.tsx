import { useEffect, useState } from "react";
import "./SplashScreen.css";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    let value = 0;

    const timer = setInterval(() => {
      value += Math.floor(Math.random() * 5) + 3;

      if (value >= 100) {
        value = 100;
        clearInterval(timer);
        setLoaded(true);
      }

      setProgress(value);
    }, 45);

    return () => clearInterval(timer);
  }, []);

  const handleFinish = () => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 320);
  };

  return (
    <div 
      id="gateway-splash-screen"
      className={`gateway-splash ${isExiting ? "splash-fade-out" : ""}`}
      role="dialog"
      aria-label="Welcome to Gateway Connect"
    >
      {/* Ambient background lighting */}
      <div className="splash-glow splash-glow-one" />
      <div className="splash-glow splash-glow-two" />

      {/* Skip button in top corner for instant access */}
      <button 
        type="button" 
        id="splash-skip-btn"
        className="splash-skip-button"
        onClick={handleFinish}
        aria-label="Skip splash screen"
      >
        Skip ➔
      </button>

      <div className="splash-content">
        {/* Emblem & Glow Ring */}
        <div className="logo-wrapper">
          <div className="logo-ring logo-ring-one" />
          <div className="logo-ring logo-ring-two" />
          <div className="logo-backdrop-glow" />

          <img
            src="/logo.png"
            alt="Gateway Church Logo"
            className="gateway-splash-logo"
            width={120}
            height={120}
          />
        </div>

        {/* Brand Titles */}
        <h1 className="gateway-title">GATEWAY</h1>

        <div className="gateway-connect">
          <span className="connect-line" />
          <span className="connect-text">CONNECT</span>
          <span className="connect-line" />
        </div>

        <p className="gateway-tagline">
          CONNECTING PEOPLE
          <br />
          TO A BRIGHTER FUTURE
        </p>

        {/* Loading Bar & Action Area */}
        <div className="splash-action-area">
          {!loaded ? (
            <div className="splash-loading">
              <div className="loading-meta">
                <span className="loading-text">Connecting Sanctuary...</span>
                <span className="loading-percent">{progress}%</span>
              </div>

              <div className="loading-bar">
                <div
                  className="loading-progress"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              id="splash-start-button"
              className="gateway-start-button"
              onClick={handleFinish}
              autoFocus
            >
              <span>GET STARTED</span>
              <span className="start-arrow" aria-hidden="true">→</span>
            </button>
          )}
        </div>
      </div>

      {/* Footer Values */}
      <div className="splash-bottom">
        <span>SECURE</span>
        <span className="bottom-dot">•</span>
        <span>CONNECTED</span>
        <span className="bottom-dot">•</span>
        <span>TOGETHER</span>
      </div>
    </div>
  );
}
