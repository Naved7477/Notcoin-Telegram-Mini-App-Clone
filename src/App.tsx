import { useEffect, useState } from 'react';
import './index.css';

// Fixed online gold coin image URL so it never crashes on Vercel
const coinImg = 'https://icons8.com';

interface HistoryItem { amt: number; upi: string; date: string; status: string; type: string; }

const showUnityAd = (onSuccess: () => void) => {
  try {
    if ((window as any).unityAds?.isReady?.('BP_Rewarded_Android')) {
      (window as any).unityAds.show('BP_Rewarded_Android'); 
      onSuccess();
    } else {
      const s = document.createElement('script'); 
      s.src = 'https://jsdelivr.net';
      s.onload = () => { 
        try {
          (window as any).unityAds?.initialize('800380130', false); 
          setTimeout(() => {
            if ((window as any).unityAds?.isReady?.('BP_Rewarded_Android')) {
              (window as any).unityAds.show('BP_Rewarded_Android');
              onSuccess();
            } else {
              alert("Ad load ho raha hai, kripya 2-3 baar click karke try karein!");
            }
          }, 2000);
        } catch(err) {
          console.error(err);
        }
      };
      document.body.appendChild(s);
    }
  } catch(e) {
    console.error(e);
  }
};

const sendWithdrawAlert = async (amount: string, upi: string, type: string) => {
  try {
    await fetch(`https://telegram.org`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: "-8219259239", text: `🚨 *WITHDRAWAL* 🚨\n💰 Amt: ₹${parseFloat(amount).toFixed(2)}\n🎯 Type: ${type}\n📱 UPI/No: ${upi}`, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "🔍 Details", callback_data: `view_user_${upi}` }]] } })
    });
  } catch (e) { console.error(e); }
};

const App = () => {
  const [points, setPoints] = useState<number>(() => Number(localStorage.getItem('naved_points')) || 0.00);
  const [energy, setEnergy] = useState<number>(8500);
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number }[]>([]);
  const [showSupport, setShowSupport] = useState<boolean>(false);
  const [showWithdraw, setShowWithdraw] = useState<boolean>(false);
  const [withdrawStep, setWithdrawStep] = useState<number>(1);
  const [redeemPointsInput, setRedeemPointsInput] = useState<string>(''); 
  const [upiMobileInput, setUpiMobileInput] = useState<string>('');
  const [adsWatched, setAdsWatched] = useState<number>(() => Number(localStorage.getItem('naved_ads_watched')) || 0);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try { 
      const raw = localStorage.getItem('naved_tx_history');
      return raw ? JSON.parse(raw) : []; 
    } catch(e) { return []; }
  });

  const maxEnergy = 8500;

  useEffect(() => { localStorage.setItem('naved_points', points.toFixed(2)); }, [points]);
  useEffect(() => { localStorage.setItem('naved_ads_watched', adsWatched.toString()); }, [adsWatched]);

  const currentRank = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "MASTER"][Math.min(Math.floor(points / 100), 5)];

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (energy < 1) return;
    const r = e.currentTarget.getBoundingClientRect(); 
    setPoints(p => Number((p + 0.01).toFixed(2))); 
    setEnergy(energy - 1);
    const cid = Date.now(); 
    setClicks(prev => [...prev, { id: cid, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setClicks(cl => cl.filter(c => c.id !== cid)), 800);
  };

  const handleMatchAdClick = () => {
    if (adsWatched >= 100) { alert("❌ 100 Ads limit complete!"); return; }
    showUnityAd(() => { 
      setAdsWatched(a => a + 1); 
      setPoints(p => Number((p + 0.10).toFixed(2))); 
    });
  };

  useEffect(() => { 
    const i = setInterval(() => setEnergy(p => Math.min(p + 15, maxEnergy)), 5000); 
    return () => clearInterval(i); 
  }, []);

  const handleWithdrawSubmit = () => {
    if (points < 50) { alert("❌ Min withdrawal limit ₹50.00 hai!"); return; }
    if (!upiMobileInput) { alert("⚠️ Enter details!"); return; }
    const finalType = redeemPointsInput === 'GooglePlay' ? 'GooglePlay Code' : 'UPI';
    sendWithdrawAlert(points.toFixed(2), upiMobileInput, finalType);
    const updated = [{ amt: points, upi: upiMobileInput, date: new Date().toLocaleDateString(), status: 'Pending', type: finalType }, ...history];
    setHistory(updated); 
    localStorage.setItem('naved_tx_history', JSON.stringify(updated));
    setPoints(0); 
    alert("💸 Requested Successfully!"); 
    setShowWithdraw(false); 
    setWithdrawStep(1); 
    setUpiMobileInput('');
  };

  return (
    <div className="bg-[#0b0b0c] min-h-screen px-4 flex flex-col items-center text-white relative pb-32 select-none">
      
      {/* Top Header */}
      <div className="w-full flex justify-between items-center pt-4">
        <div className="bg-[#151516]/90 px-4 py-1.5 rounded-full text-xs font-bold text-yellow-500">🏆 {currentRank}</div>
        <button onClick={() => setShowSupport(true)} className="bg-[#151516]/90 p-2.5 rounded-full text-xl active:scale-90 transition-transform">🔔</button>
      </div>

      {/* Score Dashboard */}
      <div className="mt-12 flex items-center gap-3">
        <img src={coinImg} width={44} height={44} alt="coin" />
        <span className="text-5xl font-extrabold tracking-tight">₹{points.toFixed(2)}</span>
      </div>

      <div className="mt-4 bg-[#151516]/70 border border-gray-800 px-4 py-1.5 rounded-xl text-xs font-bold">
        📺 Ads Today: <span className="text-yellow-400 font-mono text-sm">{adsWatched}</span> / 100
      </div>

      {/* Main Clicker Coin */}
      <div className="mt-12 w-64 h-64 rounded-full bg-gradient-to-b from-[#bf953f] to-[#b38728] p-1.5 active:scale-95 transition-transform relative shadow-xl">
        <div onClick={handleClick} className="w-full h-full rounded-full bg-[#151516] flex items-center justify-center cursor-pointer overflow-hidden">
          <img src={coinImg} width={180} height={180} alt="main-coin" />
        </div>
        {clicks.map(c => (
          <span key={c.id} style={{ left: c.x, top: c.y }} className="absolute text-xl font-extrabold text-yellow-400 animate-float-up pointer-events-none">+₹0.01</span>
        ))}
      </div>

      {/* Energy Progress */}
      <div className="w-full max-w-sm mt-8 px-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>⚡ Energy</span>
          <span>{energy} / {maxEnergy}</span>
        </div>
        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
          <div className="bg-yellow-500 h-full transition-all duration-300" style={{ width: `${(energy / maxEnergy) * 100}%` }}></div>
        </div>
      </div>

      {/* FIXED 2 BOTTOM TABS NAV BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#151516] border-t border-gray-800 py-4 px-12 flex justify-around items-center z-40 rounded-t-2xl shadow-2xl">
        <button onClick={handleMatchAdClick} className="flex flex-col items-center justify-center text-gray-400 hover:text-yellow-500 active:scale-95 transition-transform">
          <span className="text-3xl block">📺</span>
          <span className="text-xs mt-1 font-extrabold text-white">Watch Ad</span>
        </button>
        <button onClick={() => { setShowWithdraw(true); setWithdrawStep(1); }} className="flex flex-col items-center justify-center text-gray-400 hover:text-yellow-500 active:scale-95 transition-transform">
          <span className="text-3xl block">💰</span>
          <span className="text-xs mt-1 font-extrabold text-white">Withdraw</span>
        </button>
      </div>

      {/* POPUP: SUPPORT CUSTOMER VIEW */}
      {showSupport && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-[#151516] p-6 rounded-2xl w-full max-w-sm border border-gray-800 text-center shadow-xl">
            <h3 className="text-xl font-bold text-yellow-500 mb-2">💬 Customer Care Support</h3>
            <p className="text-sm text-gray-400 mt-4 mb-2">Email Us:</p>
            <p className="text-md text-white font-mono bg-white/5 py-2 rounded-xl border border-gray-800 select-all mb-4">support@taptopaisa.com</p>
            <button onClick={() => setShowSupport(false)} className="w-full py-2.5 bg-white text-black font-bold rounded-xl text-sm">Close</button>
          </div>
        </div>
      )}

      {/* POPUP: WITHDRAW MODE VIEW WITH INTEGRATED HISTORY */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-[#151516] p-6 rounded-2xl w-full max-w-sm border border-gray-800 shadow-xl flex flex-col max-h-[80vh]">
            <h3 className="text-xl font-bold text-yellow-500 mb-2 text-center">💰 Claim Earnings</h3>
            <p className="text-xs text-gray-400 mb-4 text-center">Available Balance: ₹{points.toFixed(2)} (Min Limit: ₹50)</p>
                      <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {withdrawStep === 1 ? (
                <div className="space-y-3">
                  <button onClick={() => { setRedeemPointsInput('UPI'); setWithdrawStep(2); }} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl text-sm">🇮🇳 UPI Transfer</button>
                  <button onClick={() => { setRedeemPointsInput('GooglePlay'); setWithdrawStep(2); }} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl text-sm">🛍️ Google Play Code</button>
                  <button onClick={() => setShowWithdraw(false)} className="w-full py-2 bg-white/10 text-white font-bold rounded-xl text-sm mt-2">Cancel</button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <h4 className="text-sm font-bold text-white">{redeemPointsInput === 'UPI' ? 'Enter UPI ID:' : 'Enter Mobile Number:'}</h4>
                  <input type="text" placeholder={redeemPointsInput === 'UPI' ? 'example@ybl' : 'Enter number'} value={upiMobileInput} onChange={e => setUpiMobileInput(e.target.value)} className="w-full p-2.5 rounded-xl bg-white/5 border border-gray-700 text-white text-sm focus:outline-none" />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setWithdrawStep(1)} className="flex-1 py-2 bg-white/10 text-white font-bold rounded-xl text-sm">Back</button>
                    <button onClick={handleWithdrawSubmit} className="flex-1 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white font-bold rounded-xl text-sm">Confirm</button>
                  </div>
                </div>
              )}
                     <div className="border-t border-gray-800 pt-4 mt-2">
                <h4 className="text-sm font-bold text-white mb-2 tracking-wide">📊 History</h4>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {(!history || history.length === 0) ? (
                    <p className="text-xs text-gray-500 text-center py-4">No data tracked yet.</p>
                  ) : (
                    history.map((h, idx) => (
                      <div key={idx} className="bg-white/5 p-2 rounded-lg flex justify-between items-center text-xs border border-gray-900">
                        <div>
                          <p className="font-bold text-red-400">-₹{h.amt.toFixed(2)}</p>
                          <p className="text-[10px] text-gray-500">{h.date} • {h.type}</p>
                        </div>
                        <span className="text-yellow-400 text-[10px]">{h.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
