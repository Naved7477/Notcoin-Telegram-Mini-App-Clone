import { useEffect, useState } from 'react';
import './index.css';
import { coin, notcoin } from './images';

const showUnityAd = (onSuccess: () => void) => {
  if ((window as any).unityAds && (window as any).unityAds.isReady && (window as any).unityAds.isReady('BP_Rewarded_Android')) {
    (window as any).unityAds.show('BP_Rewarded_Android');
    onSuccess();
  } else {
    const script = document.createElement('script');
    script.src = 'https://jsdelivr.net';
    script.onload = () => {
      (window as any).unityAds.initialize('800380130', false);
      setTimeout(() => {
        if ((window as any).unityAds) {
          (window as any).unityAds.show('BP_Rewarded_Android');
          onSuccess();
        }
      }, 1500);
    };
    document.body.appendChild(script);
  }
};

const sendWithdrawalAlertToAdmin = async (amount: string, upi: string) => {
  const token = '8922827316:AAGHwwIIkiJcSyJQhu-D1RINI_8pC9bU9cw';
  const chatId = '8219259239';
  const messageText = "🚨 NAVED BHAI! NAYA WITHDRAWAL AAYA HAI!\n\n💰 Amount: ₹" + parseFloat(amount).toFixed(2) + "\n📱 UPI Linked Mobile: " + upi + "\n\n💸 Paytm / PhonePe se jaldi payout check karo!";
  try {
    await fetch("https://telegram.org" + token + "/sendMessage", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: messageText })
    });
  } catch (error) {
    console.error(error);
  }
};

const App = () => {
  const [points, setPoints] = useState(() => Number(localStorage.getItem('naved_points') || '0.00'));
  const [energy, setEnergy] = useState(6500);
  const [clicks, setClicks] = useState<{ id: number, x: number, y: number }[]>([]);
  
  const [showSupport, setShowSupport] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showRankPopup, setShowRankPopup] = useState(false);
  const [showUpdatePopup, setShowUpdatePopup] = useState(true);
  
  const [tapLevel, setTapLevel] = useState(1); 
  const [energyLevel, setEnergyLevel] = useState(1); 
  const [withdrawStep, setWithdrawStep] = useState(1); 
  const [redeemPointsInput, setRedeemPointsInput] = useState('');
  const [upiMobileInput, setUpiMobileInput] = useState('');
  
  const [adsWatched, setAdsWatched] = useState(() => Number(localStorage.getItem('naved_ads_watched') || '0'));
  
  const [history, setHistory] = useState<{amt: string, upi: string, date: string}[]>(() => {
    return JSON.parse(localStorage.getItem('naved_tx_history') || '[]');
  });

  useEffect(() => {
    localStorage.setItem('naved_points', points.toFixed(2));
  }, [points]);

  useEffect(() => {
    localStorage.setItem('naved_ads_watched', adsWatched.toString());
  }, [adsWatched]);

  const currentRankIndex = Math.floor(points / 100);
  const ranksList = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "MASTER"];
  const currentRank = ranksList[Math.min(currentRankIndex, ranksList.length - 1)];
  const nextRankPoints = (currentRankIndex + 1) * 100;

  useEffect(() => {
    const lastRewardedRank = Number(localStorage.getItem('last_rewarded_rank') || '0');
    if (currentRankIndex > lastRewardedRank) {
      setPoints(p => Number((p + 20.00).toFixed(2)));
      localStorage.setItem('last_rewarded_rank', currentRankIndex.toString());
      alert("🎉 Badhaai Ho! Aapka Rank Up Hua Aur ₹20.00 Bonus Mila!");
    }
  }, [currentRankIndex]);

  const maxEnergy = energyLevel === 1 ? 6500 : energyLevel === 2 ? 7500 : 8500;
  const pointsToAdd = tapLevel === 1 ? 0.01 : tapLevel === 2 ? 0.02 : 0.05;

  const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (energy - 1 < 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPoints(p => Number((p + pointsToAdd).toFixed(2)));
    setEnergy(energy - 1);
    const clickId = Date.now();
    setClicks([...clicks, { id: clickId, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setClicks(p => p.filter(c => c.id !== clickId)), 800);
  };

  const buyMultiTap = () => {
    const cost = tapLevel === 1 ? 5 : 10;
    if (points >= cost && tapLevel < 3) { setPoints(p => Number((p - cost).toFixed(2))); setTapLevel(tapLevel + 1); }
  };

  const buyEnergyPool = () => {
    const cost = energyLevel === 1 ? 15 : 25;
    if (points >= cost && energyLevel < 3) { setPoints(p => Number((p - cost).toFixed(2))); setEnergyLevel(energyLevel + 1); setEnergy(energyLevel === 1 ? 7500 : 8500); }
  };

  const handleWatchAdClick = () => {
    if (adsWatched >= 100) {
      alert("❌ Aapki aaj ki 100 Ads ki limit poori ho chuki hai! Kal wapas aana.");
      return;
    }
    showUnityAd(() => {
      setAdsWatched(a => a + 1);
      setPoints(p => Number((p + 0.50).toFixed(2))); 
    });
  };

  useEffect(() => {
    const interval = setInterval(() => setEnergy(p => Math.min(p + 1, maxEnergy)), 5000);
    return () => clearInterval(interval);
  }, [maxEnergy]);

  return (
    <div className="bg-gradient-main min-h-screen px-4 flex flex-col items-center text-white font-medium select-none relative">
      
      {showUpdatePopup && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6">
          <div className="bg-[#1e1e24] p-6 rounded-3xl w-full max-w-sm flex flex-col gap-4 text-center border border-cyan-500/30">
            <span className="text-xl font-bold text-[#00c2cb]">📢 NEW GAME UPDATE LIVE!</span>
            <div className="text-sm opacity-80 text-left bg-black/30 p-3 rounded-xl flex flex-col gap-1">
              <span>• Har 100 Point par naya Rank + ₹20 Bonus! 🏆</span>
              <span>• 0/100 Daily Ads Counter system active! 📺</span>
              <span>• Dynamic Withdrawal History tab locked! 🔔</span>
            </div>
            <button className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 rounded-full mt-2" onClick={() => setShowUpdatePopup(false)}>Let's Play! 🚀</button>
          </div>
        </div>
      )}

      {showRankPopup && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={() => setShowRankPopup(false)}>
          <div className="bg-[#151516] p-6 rounded-2xl w-full max-w-sm text-center flex flex-col gap-4 border border-yellow-500/20" onClick={e => e.stopPropagation()}>
            <span className="text-xl font-bold bg-gradient-to-r from-[#bf953f] to-[#fcf6ba] bg-clip-text text-transparent">🏆 LEADERBOARD RANK SYSTEM</span>
            <div className="bg-white/5 p-4 rounded-xl flex flex-col gap-2">
              <div>Current Rank: <span className="text-[#fcf6ba] font-bold">{currentRank}</span></div>
              <div className="text-xs text-white/60">Agla Rank unlock hoga: {nextRankPoints} points par</div>
              <div className="text-xs text-green-400 mt-1">⭐ Har Level Up par milega ₹20.00 cash bonus!</div>
            </div>
            <button className="bg-white/10 py-2 rounded-xl text-sm" onClick={() => setShowRankPopup(false)}>Close</button>
          </div>
        </div>
      )}

      {showSupport && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6" onClick={() => setShowSupport(false)}>
          <div className="bg-[#151516] p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <span className="text-lg font-bold border-b border-white/10 pb-2 text-cyan-400">🔔 Transaction History & Support</span>
            <div className="text-sm">Email Support: <span className="text-[#fcf6ba] select-all">support@taptopaisa.com</span></div>
            
            <span className="text-xs font-bold text-white/50 mt-2">🕒 RECENT WITHDRAWAL LOGS:</span>
            <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
              {history.length === 0 ? (
                <div className="text-xs opacity-40 text-center py-4 bg-white/5 rounded-xl">No withdrawals requested yet.</div>
              ) : (
                history.map((tx, idx) => (
                  <div key={idx} className="bg-white/5 p-2 rounded-lg flex justify-between items-center text-xs">
                    <div className="flex flex-col">
                      <span className="font-bold text-red-400">-₹{tx.amt}</span>
                      <span className="opacity-40 text-[10px]">{tx.upi}</span>
                    </div>
                    <span className="bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded text-[10px]">Pending</span>
                  </div>
                ))
              )}
            </div>
            <button className="bg-gradient-to-r from-[#bf953f] to-[#fcf6ba] text-black font-bold py-2 rounded-xl text-sm" onClick={() => setShowSupport(false)}>Close</button>
          </div>
        </div>
      )}

      {showShop && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={() => setShowShop(false)}>
          <div className="bg-[#151516] p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <span className="text-lg font-bold border-b border-white/10 pb-2">🧸 Boosters Shop</span>
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
              <div className="flex flex-col"><span className="text-sm font-bold">👆 Multi-Tap (Lvl {tapLevel})</span><span className="text-xs text-[#fcf6ba]">Cost: ₹{tapLevel === 1 ? '5.00' : tapLevel === 2 ? '10.00' : 'MAX'}</span></div>
              <button className="bg-gradient-to-r from-[#bf953f] to-[#fcf6ba] text-black text-xs font-bold px-3 py-2 rounded-lg" onClick={buyMultiTap}>Upgrade</button>
            </div>
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">