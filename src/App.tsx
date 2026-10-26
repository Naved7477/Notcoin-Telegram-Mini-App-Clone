import React, { useState } from 'react';
import './App.css';

const CoinImg = 'https://icons8.com';

const showUnityAd = (cb: () => void) => {
  // Direct bypass logic taaki testing smooth chale aur blank screen na aaye
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
    <div className="bg-[#0b0b0c] min-h-screen px-4 flex flex-col items-center text-white relative pb-32 select-none">
      <h1 className="text-2xl font-bold mt-8">Tap To Paisa</h1>
      
      <div className="flex flex-col items-center justify-center flex-1 mt-20">
        <img 
          src={CoinImg} 
          alt="Coin" 
          className="w-40 h-40 object-contain cursor-pointer active:scale-95 transition-transform" 
        />
        <p className="text-xl mt-4 font-semibold">{adsWatched} / 100 Ads</p>
      </div>

      <button 
        onClick={handleWatchAdClick}
        className="w-full max-w-sm bg-yellow-500 text-black py-4 rounded-xl font-bold text-lg shadow-lg active:scale-98 transition-transform mb-8"
      >
        Watch Ad & Earn
      </button>

      {adsWatched >= 100 && (
        <div className="w-full max-w-sm bg-green-600 text-white py-4 rounded-xl font-bold text-center animate-bounce">
          🎉 Payout Unlocked! Claim via UPI / Gift Card
        </div>
      )}
    </div>
  );
}

export default App;
