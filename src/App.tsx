import React, { useState, useEffect } from 'react';
import './App.css';

declare global {
  interface Window {
    AdexiumWidget: any;
    Telegram: any;
  }
}

function App() {
  const todayDate = new Date().toDateString(); // Aaj ki date nikalne ke liye

  // 1. Balance load karna (taaki refresh par 0 na ho)
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('ttp_balance');
    return saved ? parseFloat(saved) : 0.00;
  });

  // 2. Daily Ads count load karna (agle din reset hoga)
  const [adsWatched, setAdsWatched] = useState<number>(() => {
    const savedDate = localStorage.getItem('ttp_date');
    if (savedDate !== todayDate) return 0;
    const savedAds = localStorage.getItem('ttp_ads');
    return savedAds ? parseInt(savedAds) : 0;
  });

  // 3. Daily Energy load karna (agle din 8500 refill hogi)
  const [energy, setEnergy] = useState<number>(() => {
    const savedDate = localStorage.getItem('ttp_date');
    if (savedDate !== todayDate) return 8500; // Naya din = Full 8500 refill
    const savedEnergy = localStorage.getItem('ttp_energy');
    return savedEnergy !== null ? parseInt(savedEnergy) : 8500;
  });

  // Jab bhi balance, energy, ya ads badlein, use save karein
  useEffect(() => {
    localStorage.setItem('ttp_date', todayDate);
    localStorage.setItem('ttp_balance', balance.toFixed(2));
    localStorage.setItem('ttp_energy', energy.toString());
    localStorage.setItem('ttp_ads', adsWatched.toString());
  }, [balance, energy, adsWatched, todayDate]);

  // TAP COIN LOGIC (Per click ₹0.01)
  const handleTapCoin = () => {
    if (energy > 0) {
      setBalance((prev) => parseFloat((prev + 0.01).toFixed(2)));
      setEnergy((prev) => prev - 1);
    } else {
      alert("Aaj ki energy khatam ho gayi hai! Ab kal subah 8,500 energy refill hogi.");
    }
  };

  // WATCH AD LOGIC (Adexium Ad + ₹0.05 Reward)
  const handleWatchAdClick = () => {
    if (adsWatched >= 100) {
      alert("Aaj ki 100 ads ki limit poori ho gayi hai! Kal dobara dekhein.");
      return;
    }

    if (window.AdexiumWidget) {
      try {
        const adexiumWidget = new window.AdexiumWidget({
          wid: 'dc83b77d-01d0-412f-9055-0945fb57b2d8',
          adFormat: 'interstitial'
        });

        adexiumWidget.requestAd('interstitial');

        adexiumWidget.on('adPlaybackCompleted', () => {
          setAdsWatched((prev) => prev + 1);
          setBalance((prev) => parseFloat((prev + 0.05).toFixed(2)));
          alert("Badhai ho! ₹0.05 add ho gaye.");
        });

        adexiumWidget.on('noAdFound', () => {
          alert("Abhi ad available nahi hai, thodi der baad try karein.");
        });
      } catch (error) {
        console.error("Adexium error:", error);
        alert("Ad load hone mein error aaya.");
      }
    } else {
      alert("Adexium SDK load nahi hua hai!");
    }
  };

  // WITHDRAW LOGIC (Minimum ₹50)
  const handleWithdraw = () => {
    if (balance < 50) {
      alert(`Minimum withdrawal ₹50 hai! Abhi aapka balance ₹${balance.toFixed(2)} hai.`);
      return;
    }
    const upi = prompt("Apna UPI ID dalein (jaise name@upi):");
    if (upi && upi.trim() !== "") {
      alert(`₹${balance.toFixed(2)} ki withdrawal request (${upi}) submit ho gayi hai!`);
      setBalance(0);
    }
  };

  // CUSTOMER SERVICE BELL ICON LOGIC
  const handleSupportClick = () => {
    const supportUrl = "https://t.me"; // Yahan apna Telegram username dalein
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(supportUrl);
    } else {
      window.open(supportUrl, "_blank");
    }
  };

  return (
    <div className="bg-[#0b0b0e] min-h-screen px-4 flex flex-col items-center text-white relative pb-24 select-none">
      
      {/* Top Bar: Bronze League & Notification Bell */}
      <div className="w-full flex justify-between items-center mt-6 px-2">
        <div className="bg-zinc-900/80 border border-amber-600/30 px-3 py-1 rounded-full flex items-center space-x-1">
          <span className="text-sm">🏆 BRONZE</span>
        </div>
        <div 
          onClick={handleSupportClick}
          className="p-2 bg-zinc-900/90 rounded-full cursor-pointer active:scale-90 transition-transform"
        >
          <span className="text-xl">🔔</span>
        </div>
      </div>

      {/* Main Income Display */}
      <div className="flex flex-col items-center justify-center mt-12">
        <div className="flex items-center space-x-1">
          <span className="text-4xl font-extrabold tracking-tight text-white">₹{balance.toFixed(2)}</span>
        </div>

        {/* Ads Counter Status Badge */}
        <div className="mt-4 bg-zinc-900 px-4 py-1.5 rounded-full border border-zinc-800 text-xs text-gray-300 flex items-center space-x-2">
          <span>📺 Ads Today: {adsWatched} / 100</span>
        </div>
      </div>

      {/* Big Golden Tapper Ring Layer */}
      <div className="flex-1 flex items-center justify-center my-8">
        <div 
          onClick={handleTapCoin}
          className="w-64 h-64 rounded-full border-4 border-yellow-600/70 flex items-center justify-center bg-gradient-to-b from-zinc-900 to-black shadow-[0_0_40px_rgba(202,138,4,0.15)] cursor-pointer active:scale-95 transition-transform"
        >
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
            <div 
              className="bg-yellow-500 h-full rounded-full transition-all duration-150"
              style={{ width: `${(energy / 8500) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Action Button Navigation Bar UI */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 flex justify-around items-center shadow-lg">
          <button
            onClick={handleWatchAdClick}
            className="flex flex-col items-center space-y-1 text-yellow-500 active:scale-95 transition-transform"
          >
            <span className="text-2xl">📺</span>
            <span className="text-xs font-medium">Watch Ad</span>
          </button>

          <button
            onClick={handleWithdraw}
            className="flex flex-col items-center space-y-1 text-gray-300 hover:text-white active:scale-95 transition-transform"
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
