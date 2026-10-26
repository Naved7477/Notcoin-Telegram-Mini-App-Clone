import React, { useState } from 'react';
import './App.css';

// Direct bypass configuration for Adsgram
const showUnityAd = (cb: () => void) => {
  console.log("Bypassing ad screen for testing...");
  cb();
};

function App() {
  const [balance, setBalance] = useState(11.25);
  const [adsWatched, setAdsWatched] = useState(25);
  const [energy, setEnergy] = useState(8500);

  const handleWatchAdClick = () => {
    showUnityAd(() => {
      setAdsWatched((prev) => {
        if (prev < 100) {
          const nextVal = prev + 1;
          // Per ad watch par ₹0.45 balance badhane ka logic (Math calculation setup)
          setBalance((b) => parseFloat((b + 0.45).toFixed(2)));
          return nextVal;
        }
        return prev;
      });
    });
  };

  return (
    <div className="bg-[#0b0b0c] min-h-screen px-4 flex flex-col items-center text-white relative pb-24 select-none">
      
      {/* Top Bar: Bronze League & Notification Bell */}
      <div className="w-full flex justify-between items-center mt-6 px-2">
        <div className="bg-zinc-900/80 border border-amber-600/30 px-3 py-1 rounded-full flex items-center space-x-1">
          <span className="text-sm">🏆 BRONZE</span>
        </div>
        <div className="p-2 bg-zinc-900/50 rounded-full cursor-pointer">
          <span className="text-xl">🔔</span>
        </div>
      </div>

      {/* Main Income Display */}
      <div className="flex flex-col items-center justify-center mt-12">
        <div className="flex items-center space-x-3">
          <span className="text-4xl font-extrabold tracking-tight text-white">₹{balance}</span>
        </div>
        
        {/* Ads Counter Status Badge */}
        <div className="mt-4 bg-zinc-900 px-4 py-1.5 rounded-full border border-zinc-800 text-xs text-gray-300 flex items-center space-x-1">
          <span>📺 Ads Today: {adsWatched} / 100</span>
        </div>
      </div>

      {/* Big Golden Tapper Ring Layer */}
      <div className="flex-1 flex items-center justify-center my-8">
        <div className="w-64 h-64 rounded-full border-4 border-yellow-600/70 flex items-center justify-center bg-gradient-to-b from-zinc-900 to-black shadow-[0_0_50px_rgba(234,179,8,0.15)] active:scale-95 transition-transform duration-100 cursor-pointer">
          {/* Fallback clean placeholder text inside circle if public asset isn't fetched */}
          <span className="text-yellow-500 font-bold text-xl tracking-wider">TAP COIN</span>
        </div>
      </div>

      {/* Bottom Interface: Energy Bar and Bottom Navigation Buttons */}
      <div className="w-full max-w-md space-y-5 px-2">
        {/* Energy Status Bar Component */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span className="flex items-center text-yellow-500">⚡ Energy</span>
            <span>{energy} / 8500</span>
          </div>
          <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-yellow-500 h-full w-full rounded-full"></div>
          </div>
        </div>

        {/* Action Button Navigation Bar UI */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 flex justify-around items-center shadow-xl">
          <button 
            onClick={handleWatchAdClick}
            className="flex flex-col items-center space-y-1 text-yellow-500 active:scale-95 transition-transform"
          >
            <span className="text-2xl">📺</span>
            <span className="text-xs font-medium">Watch Ad</span>
          </button>
          
          <button 
            onClick={() => alert(adsWatched >= 100 ? "UPI / Play Code options loading..." : "Pehle 100 ads complete karein bhai!")}
            className="flex flex-col items-center space-y-1 text-gray-400 hover:text-white active:scale-95 transition-transform"
          >
            <span className="text-2xl">💰</span>
            <span className="text-xs font-medium">Withdraw</span>
          </button>
        </div>
      </div>

    </div>
  );
}

export default App;
