import { useEffect, useState } from "react";
import "./SplashScreen.css";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let value = 0;

    const timer = setInterval(() => {
      value += Math.floor(Math.random() * 4) + 1;

      if (value >= 100) {
        value = 100;
        clearInterval(timer);
        setLoaded(true);
      }

      setProgress(value);
    }, 60);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="gateway-splash">
      <div className="splash-glow splash-glow-one" />
      <div className="splash-glow splash-glow-two" />

      <div className="splash-content">

        <div className="logo-wrapper">
          <div className="logo-ring logo-ring-one" />
          <div className="logo-ring logo-ring-two" />

          <img
            src="/logo.png"
            alt="Gateway Church"
            className="gateway-splash-logo"
          />
        </div>

        <h1 className="gateway-title">GATEWAY</h1>

        <div className="gateway-connect">
          <span />
          CONNECT
          <span />
        </div>

        <p className="gateway-tagline">
          CONNECTING PEOPLE
          <br />
          TO A BRIGHTER FUTURE
        </p>

        {!loaded ? (
          <div className="splash-loading">
            <div className="loading-text">
              Connecting...
            </div>

            <div className="loading-bar">
              <div
                className="loading-progress"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="loading-percent">
              {progress}%
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="gateway-start-button"
            onClick={onComplete}
          >
            <span>GET STARTED</span>
            <span className="start-arrow">→</span>
          </button>
        )}

      </div>

      <div className="splash-bottom">
        <span>SECURE</span>
        <span>•</span>
        <span>CONNECTED</span>
        <span>•</span>
        <span>TOGETHER</span>
      </div>
    </div>
  );
}
