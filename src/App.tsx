import { useEffect, useState } from 'react';
import './index.css';
import coin from './images/coin.png';
// Types for history items
interface HistoryItem {
  amt: number;
  upi: string;
  date: string;
  status: string;
  type: string;
}

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

const sendWithdrawalAlertToAdmin = async (amount: string, upi: string, type: string) => {
  const token = "8022827316:AAGHWwik1kdjcsyJQHo-DtRiN1_8pC9bUBw";
  const chatid = "-8219259239";
  
  const messageText = `🚨 *NEW WITHDRAWAL REQUEST* 🚨\n\n💰 *Amount:* ₹${parseFloat(amount).toFixed(2)}\n🎯 *Method:* ${type}\n📱 *User Account/UPI:* ${upi}\n\n👉 Click details button below to review user profile.`;

  try {
    await fetch(`https://telegram.org{token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatid,
        text: messageText,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔍 View User Details", callback_data: `view_user_${upi}` }
            ]
          ]
        }
      })
    });
  } catch (error) {
    console.error("Telegram Alert Failed:", error);
  }
};

const App = () => {
  const [points, setPoints] = useState<number>(() => Number(localStorage.getItem('naved_points')) || 0.00);
  const [energy, setEnergy] = useState<number>(8500);
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number }[]>([]);

  const [showSupport, setShowSupport] = useState<boolean>(false);
  const [showShop, setShowShop] = useState<boolean>(false);
  const [showWithdraw, setShowWithdraw] = useState<boolean>(false);
  const [withdrawStep, setWithdrawStep] = useState<number>(1);
  const [redeemPointsInput, setRedeemPointsInput] = useState<string>(''); 
  const [upiMobileInput, setUpiMobileInput] = useState<string>('');

  const [adsWatched, setAdsWatched] = useState<number>(() => Number(localStorage.getItem('naved_ads_watched')) || 0);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    return JSON.parse(localStorage.getItem('naved_tx_history') || '[]');
  });

  const maxEnergy = 8500;
  const pointsToAdd = 0.01;

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
      setPoints(p => p + 20.00);
      localStorage.setItem('last_rewarded_rank', currentRankIndex.toString());
      alert(`🎉 Badhaai Ho! Aapka Rank Up Hua Aur ₹20.00 Bonus Mila!`);
    }
  }, [currentRankIndex]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (energy < 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPoints(p => Number((p + pointsToAdd).toFixed(2)));
    setEnergy(energy - 1);
    
    const clickId = Date.now();
    setClicks([...clicks, { id: clickId, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setClicks(clicks => clicks.filter(c => c.id !== clickId)), 800);
  };

  const handleMatchAdClick = () => {
    if (adsWatched >= 100) {
      alert("❌ Aapki aaj ki 100 Ads ki limit poori ho chuki hai! Kal wapas aana.");
      return;
    }
    showUnityAd(() => {
      setAdsWatched(a => a + 1);
      setPoints(p => Number((p + 0.10).toFixed(2))); 
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy(p => Math.min(p + 15, maxEnergy));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleWithdrawSubmit = () => {
    if (points < 50) {
      alert("❌ Minimum withdrawal limit ₹50.00 hai!");
      return;
    }
    if (!upiMobileInput) {
      alert("⚠️ Kripya details enter karein!");
      return;
    }

    sendWithdrawalAlertToAdmin(points.toFixed(2), upiMobileInput, redeemPointsInput);

    const nowTx: HistoryItem = {
      amt: points,
      upi: upiMobileInput,
      date: new Date().toLocaleDateString(),
      status: 'Pending',
      type: redeemPointsInput
    };
    
    const updatedHistory = [nowTx, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('naved_tx_history', JSON.stringify(updatedHistory));

    setPoints(0);
    alert("💸 Withdrawal Request Sent! Admin will check.");
    setShowWithdraw(false);
    setWithdrawStep(1);
    setUpiMobileInput('');
    setRedeemPointsInput('');
  };

  return (
    <div className="bg-gradient-main min-h-screen px-4 flex flex-col items-center text-white font-medium select-none relative pb-24">
      
      {/* Top Header Section */}
      <div className="w-full flex justify-between items-center pt-4">
        <div className="bg-[#151516] px-4 py-1.5 rounded-full text-xs font-bold text-yellow-500">
          🏆 {currentRank}
        </div>
        {/* Bell Icon */}
        <button onClick={() => setShowSupport(true)} className="relative bg-[#151516] p-2 rounded-full">
          <span className="text-xl">🔔</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full"></span>
        </button>
      </div>

      {/* Main Score Board */}
      <div className="mt-12 flex items-center gap-3">
        <img src={coin} width={48} height={48} alt="coin" />
        <span className="text-5xl font-extrabold tracking-tight">₹{points.toFixed(2)}</span>
      </div>

      {/* Big Main Tap Coin */}
      <div className="mt-16 w-64 h-64 rounded-full bg-gradient-to-b from-[#bf953f] to-[#b38728] p-2 active:scale-95 transition-transform relative">
        <div onClick={handleClick} className="w-full h-full rounded-full bg-[#151516] flex items-center justify-center overflow-hidden cursor-pointer">
          <img src={coin} width={192} height={192} alt="main-coin" />
        </div>
        {clicks.map(c => (
          <span key={c.id} style={{ left: c.x, top: c.y }} className="absolute text-2xl font-bold text-yellow-400 animate-float-up pointer-events-none">
            +₹0.01
          </span>
        ))}
      </div>

      {/* Energy Bar */}
      <div className="w-full max-w-sm mt-8 px-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>⚡ Energy</span>
          <span>{energy} / {maxEnergy}</span>
        </div>
        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
          <div className="bg-yellow-500 h-full transition-all duration-300" style={{ width: `${(energy / maxEnergy) * 100}%` }}></div>
        </div>
      </div>

      {/* FIXED BOTTOM NAVIGATION BAR WITH 3 ICONS */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#151516] border-t border-gray-800 py-3 px-6 flex justify-around items-center z-40 rounded-t-2xl">
        <button onClick={() => setShowShop(true)} className="flex flex-col items-center justify-center text-gray-400 hover:text-yellow-500 transition-colors">
          <span className="text-2xl">🚀</span>
          <span className="text-xs mt-1 font-bold">Boosters</span>
        </button>

        <button onClick={handleMatchAdClick} className="flex flex-col items-center justify-center text-gray-400 hover:text-yellow-500 transition-colors bg-gradient-to-r from-yellow-500 to-amber-600 p-3 rounded-full -mt-6 shadow-lg text-white">
          <span className="text-2xl">📺</span>
        </button>

        <button onClick={() => { setShowWithdraw(true); setWithdrawStep(1); }} className="flex flex-col items-center justify-center text-gray-400 hover:text-yellow-500 transition-colors">
          <span className="text-2xl">💰</span>
          <span className="text-xs mt-1 font-bold">Withdraw</span>
        </button>
      </div>

      {/* POPUP 1: SUPPORT / HISTORY (BELL ICON CLICK) */}
      {showSupport && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-[#151516] p-6 rounded-2xl w-full max-w-sm border border-gray-800">
            <h3 className="text-xl font-bold text-yellow-500 mb-2">💬 Customer Care Support</h3>
            <p className="text-sm text-gray-400 mb-4">Email Us: <span className="text-white select-all font-mono">support@taptopaisa.com</span></p>
            
            <h4 className="text-md font-bold text-white mb-2">📊 Withdrawal History</h4>
                      <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {history.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">No withdrawals requested yet.</p>
              ) : (
                history.map((h, idx) => (
                  <div key={idx} className="bg-white/5 p-2 rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-red-400">-₹{h.amt.toFixed(2)} ({h.type})</p>
                      <p className="text-[10px] text-gray-500">{h.date}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${h.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                      {h.status}
                    </span>
                          </div>
                ))
              )}
            </div>
            
            
