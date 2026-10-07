import { useEffect, useState, useCallback, useRef } from "react";
import { Sparkles, ChevronRight, ChevronLeft, Heart, BookOpen, ShieldCheck } from "lucide-react";
import "./SplashScreen.css";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [currentScreen, setCurrentScreen] = useState(0); // 0: Connect/Logo, 1: Apostle Joe Daniels, 2: Gateway Church
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Touch gesture swipe tracking
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const totalScreens = 3;

  const handleFinish = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 280);
  }, [isExiting, onComplete]);

  const goToNext = useCallback(() => {
    if (currentScreen < totalScreens - 1) {
      setSlideDirection('next');
      setCurrentScreen(prev => prev + 1);
    } else {
      handleFinish();
    }
  }, [currentScreen, totalScreens, handleFinish]);

  const goToPrev = useCallback(() => {
    if (currentScreen > 0) {
      setSlideDirection('prev');
      setCurrentScreen(prev => prev - 1);
    }
  }, [currentScreen]);

  // Loading progression on initial launch (finishes in ~700ms)
  useEffect(() => {
    let value = 0;
    const timer = setInterval(() => {
      value += Math.floor(Math.random() * 10) + 8;
      if (value >= 100) {
        value = 100;
        clearInterval(timer);
        setProgress(100);
        setLoaded(true);
      } else {
        setProgress(value);
      }
    }, 35);
    return () => clearInterval(timer);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleFinish();
      } else if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
        goToNext();
      } else if (e.key === "ArrowLeft") {
        goToPrev();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleFinish, goToNext, goToPrev]);

  // Touch swipe handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 45; // Minimum px to register as swipe

    if (diff > minSwipeDistance) {
      // Swiped Left -> Go Next
      goToNext();
    } else if (diff < -minSwipeDistance) {
      // Swiped Right -> Go Prev
      goToPrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div 
      id="gateway-splash-screen"
      className={`gateway-splash ${isExiting ? "splash-fade-out" : ""}`}
      role="dialog"
      aria-label="Welcome to Gateway Connect"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient background lighting */}
      <div className="splash-glow splash-glow-one" />
      <div className="splash-glow splash-glow-two" />

      {/* Skip button in top corner for instant entry */}
      <button 
        type="button" 
        id="splash-skip-btn"
        className="splash-skip-button"
        onClick={(e) => {
          e.stopPropagation();
          handleFinish();
        }}
        aria-label="Skip splash screen and enter app"
      >
        Skip ➔
      </button>

      {/* Screen 1: Gateway Connect Brand Splash */}
      {currentScreen === 0 && (
        <div className={`splash-content ${slideDirection === 'next' ? 'slide-in-right' : 'slide-in-left'}`}>
          <div className="logo-wrapper">
            <div className="logo-ring logo-ring-one" />
            <div className="logo-ring logo-ring-two" />
            <div className="logo-backdrop-glow" />

            {!imgError ? (
              <img
                src="/logo.png"
                alt="Gateway Church Logo"
                className="gateway-splash-logo"
                width={120}
                height={120}
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="gateway-splash-logo flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 rounded-full text-slate-950 shadow-lg">
                <Sparkles className="w-10 h-10" />
              </div>
            )}
          </div>

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
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                autoFocus
              >
                <span>CONTINUE</span>
                <span className="start-arrow" aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Screen 2: Apostle Joe Daniels Bio */}
      {currentScreen === 1 && (
        <div className={`splash-content splash-profile-content ${slideDirection === 'next' ? 'slide-in-right' : 'slide-in-left'}`}>
          <div className="apostle-portrait-wrapper">
            <div className="apostle-portrait-halo" />
            <div className="apostle-portrait-ring" />
            <img
              src="/assets/apostle_joe_daniels_main.jpg"
              alt="Apostle Joe Daniels"
              className="apostle-portrait-img"
              onError={(e) => {
                // Fallback to silhouette or dark asset
                (e.target as HTMLImageElement).src = '/assets/apostle_main_dark_1788354101321.jpg';
              }}
            />
            <div className="apostle-portrait-badge">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current" />
              <span>Apostolic Founder</span>
            </div>
          </div>

          <div className="space-y-1 mt-3">
            <h2 className="apostle-title">APOSTLE JOE DANIELS</h2>
            <div className="apostle-subtitle">
              MINISTER • PREACHER • PHILANTHROPIST
            </div>
          </div>

          <div className="apostle-bio-card">
            <p className="apostle-bio-text">
              Joe Daniels is a father, minister, preacher, motivational speaker and philanthropist from Zimbabwe. He is married to Melinda Daniels and they are blessed with three children. His assignment is to preach the Word, reach people with compassion and help build successful lives through faith, wisdom, love and grace.
            </p>
          </div>

          <div className="splash-action-area">
            <button
              type="button"
              id="splash-screen2-next-btn"
              className="gateway-start-button"
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
            >
              <span>NEXT</span>
              <span className="start-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}

      {/* Screen 3: Gateway Church Mission & Purpose */}
      {currentScreen === 2 && (
        <div className={`splash-content splash-church-content ${slideDirection === 'next' ? 'slide-in-right' : 'slide-in-left'}`}>
          <div className="church-visual-wrapper">
            <div className="church-visual-aura" />
            <div className="church-visual-box">
              <img
                src="/assets/apostle_joe_daniels_preach.jpg"
                alt="Gateway Church Worship"
                className="church-visual-img"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/apostle_preach_dark_1788354137000.jpg';
                }}
              />
              <div className="church-visual-overlay">
                <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-md">
                  <BookOpen className="w-5 h-5 fill-current" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1 mt-3">
            <h2 className="church-title">GATEWAY CHURCH</h2>
            <div className="church-subtitle">
              ENCOUNTER • UNDERSTAND • GROW
            </div>
          </div>

          <div className="church-statement-card">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-widest mb-1.5">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Our Divine Calling</span>
            </div>
            <p className="church-statement-text">
              Gateway Church exists to help people encounter Christ, understand God’s Word and grow in their relationship with God.
            </p>
          </div>

          <div className="splash-action-area">
            <button
              type="button"
              id="splash-enter-sanctuary-btn"
              className="gateway-start-button gateway-enter-button"
              onClick={(e) => {
                e.stopPropagation();
                handleFinish();
              }}
            >
              <span>ENTER SANCTUARY</span>
              <span className="start-arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}

      {/* Swipe & Navigation Controls: Pagination Dots and Prev/Next Chevrons */}
      <div className="splash-nav-container">
        {currentScreen > 0 ? (
          <button
            type="button"
            className="splash-nav-btn"
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            aria-label="Previous screen"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-7 h-7" />
        )}

        <div className="splash-dots">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              className={`splash-dot ${currentScreen === idx ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setSlideDirection(idx > currentScreen ? 'next' : 'prev');
                setCurrentScreen(idx);
              }}
              aria-label={`Go to screen ${idx + 1}`}
            />
          ))}
        </div>

        {currentScreen < totalScreens - 1 ? (
          <button
            type="button"
            className="splash-nav-btn"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            aria-label="Next screen"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-7 h-7" />
        )}
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
