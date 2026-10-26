import React, { useState } from 'react';
import './App.css';

// Sahi coin link jo broken image nahi dikhayega
const CoinImg = 'https://icons8.com';

const showUnityAd = (cb: () => void) => {
  console.log("Bypassing ad screen for testing...");
  cb();
};

function App() {
  const [adsWatched, setAdsWatched] = useState(0);

  const handleWatchAdClick = () => {
    showUnityAd(() => {
      setAdsWatched((prev) => (prev < 100 ? prev + 1 : prev));
    });
  };

  return (
    <div className="bg-[#0b0b0c] min-h-screen px-6 flex flex-col items-center justify-between text-white relative pb-12 select-none">
      
      {/* Title Header */}
      <div className="text-center mt-12">
        <h1 className="text-3xl font-extrabold tracking-wider text-yellow-500">Tap To Paisa</h1>
        <p className="text-gray-400 text-sm mt-1">Watch ads, Earn Rewards</p>
      </div>
      
      {/* Center Coin and Counter Layout */}
      <div className="flex flex-col items-center justify-center flex-1 my-auto space-y-6">
        <div className="relative p-4 bg-zinc-900/50 rounded-full border border-zinc-800 shadow-2xl">
          <img 
            src={CoinImg} 
            alt="Gold Coin" 
            className="w-44 h-44 object-contain cursor-pointer active:scale-90 transition-transform duration-100" 
          />
        </div>
        <div className="bg-zinc-900 px-6 py-2 rounded-full border border-yellow-500/30">
          <p className="text-2xl font-bold tracking-widest text-yellow-400">{adsWatched} / 100 Ads</p>
        </div>
      </div>

      {/* Dynamic Payout & Button Section */}
      <div className="w-full max-w-sm flex flex-col space-y-4">
        {adsWatched >= 100 && (
          <div className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-center text-md shadow-lg animate-bounce border border-green-500">
            🎉 Payout Unlocked! Claim via UPI / Gift Card
          </div>
        )}

        <button 
          onClick={handleWatchAdClick}
          className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 text-black py-4 rounded-xl font-extrabold text-lg shadow-xl hover:brightness-110 active:scale-95 transition-all"
        >
          Watch Ad & Earn
        </button>
      </div>

    </div>
  );
}

export default App;
