import { useEffect, useState } from 'react';
import './index.css';
import coin from './images/coin.png';

interface HistoryItem { amt: number; upi: string; date: string; status: string; type: string; }

const showUnityAd = (onSuccess: () => void) => {
  if ((window as any).unityAds?.isReady?.('BP_Rewarded_Android')) {
    (window as any).unityAds.show('BP_Rewarded_Android'); onSuccess();
  } else {
    const s = document.createElement('script'); s.src = 'https://jsdelivr.net';
    s.onload = () => { (window as any).unityAds?.initialize('800380130', false); setTimeout(() => (window as any).unityAds?.show('BP_Rewarded_Android') && onSuccess(), 1500); };
    document.body.appendChild(s);
  }
};

const sendWithdrawalAlertToAdmin = async (amount: string, upi: string, type: string) => {
  const messageText = `🚨 *NEW WITHDRAWAL REQUEST* 🚨\n\n💰 *Amount:* ₹${parseFloat(amount).toFixed(2)}\n🎯 *Method:* ${type}\n📱 *User Account/UPI:* ${upi}`;
  try {
    await fetch(`https://telegram.org`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: "-8219259239", text: messageText, parse_mode: "Markdown", reply_markup: { inline_keyboard: [[{ text: "🔍 View User Details", callback_data: `view_user_${upi}` }]] } })
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
  const [history, setHistory] = useState<HistoryItem[]>(() => JSON.parse(localStorage.getItem('naved_tx_history') || '[]'));

  const maxEnergy = 8500;
  useEffect(() => { localStorage.setItem('naved_points', points.toFixed(2)); }, [points]);
  useEffect(() => { localStorage.setItem('naved_ads_watched', adsWatched.toString()); }, [adsWatched]);

  const currentRank = ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND", "MASTER"][Math.min(Math.floor(points / 100), 5)];

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (energy < 1) return;
    const r = e.currentTarget.getBoundingClientRect(); setPoints(p => Number((p + 0.01).toFixed(2))); setEnergy(energy - 1);
    const cid = Date.now(); setClicks([...clicks, { id: cid, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setClicks(cl => cl.filter(c => c.id !== cid)), 800);
  };

  const handleMatchAdClick = () => {
    if (adsWatched >= 100) return alert("❌ 100 Ads limit complete!");
    showUnityAd(() => { setAdsWatched(a => a + 1); setPoints(p => Number((p + 0.10).toFixed(2))); });
  };

  useEffect(() => { const i = setInterval(() => setEnergy(p => Math.min(p + 15, maxEnergy)), 5000); return () => clearInterval(i); }, []);

  const handleWithdrawSubmit = () => {
    if (points < 50) return alert("❌ Minimum withdrawal limit ₹50.00 hai!");
    if (!upiMobileInput) return alert("⚠️ Enter details!");
    sendWithdrawalAlertToAdmin(points.toFixed(2), upiMobileInput, redeemPointsInput);
    const updated = [{ amt: points, upi: upiMobileInput, date: new Date().toLocaleDateString(), status: 'Pending', type: redeemPointsInput }, ...history];
    setHistory(updated); localStorage.setItem('naved_tx_history', JSON.stringify(updated));
    setPoints(0); alert("💸 Withdrawal Request Sent!"); setShowWithdraw(false); setWithdrawStep(1); setUpiMobileInput('');
  };

  return (
    <div className="bg-gradient-main min-h-screen px-4 flex flex-col items-center text-white font-medium select-none relative pb-28">
      <div className="w-full flex justify-between items-center pt-4">
        <div className="bg-[#151516]/80 px-4 py-1.5 rounded-full text-xs font-bold text-yellow-500">🏆 {currentRank}</div>
        <button onClick={() => setShowSupport(true)} className="relative bg-[#151516]/80 p-2 rounded-full"><span>🔔</span></button>
      </div>
      <div className="mt-12 flex items-center gap-3">
        <img src={coin} width={48} height={48} alt="coin" />
        <span className="text-5xl font-extrabold tracking-tight">₹{points.toFixed(2)}</span>
      </div>
      <div className="mt-4 bg-[#151516]/60 border border-gray-800 px-4 py-1.5 rounded-xl text-xs text-gray-300 font-bold">
        📺 Today's Ads: <span className="text-yellow-400 font-mono text-sm">{adsWatched}</span> / 100
      </div>
      <div className="mt-12 w-64 h-64 rounded-full bg-gradient-to-b from-[#bf953f] to-[#b38728] p-2 active:scale-95 transition-transform relative">
        <div onClick={handleClick} className="w-full h-full rounded-full bg-[#151516] flex items-center justify-center cursor-pointer"><img src={coin} width={192} height={192} alt="main" /></div>
        {clicks.map(c => <span key={c.id} style={{ left: c.x, top: c.y }} className="absolute text-2xl font-bold text-yellow-400 animate-float-up">+₹0.01</span>)}
      </div>
      <div className="w-full max-w-sm mt-8 px-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1"><span>⚡ Energy</span><span>{energy} / {maxEnergy}</span></div>
        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden"><div className="bg-yellow-500 h-full" style={{ width: `${(energy / maxEnergy) * 100}%` }}></div></div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-[#151516] border-t border-gray-800 py-4 px-12 flex justify-around items-center z-40 rounded-t-2xl shadow-2xl">
        <button onClick={handleMatchAdClick} className="flex flex-col items-center justify-center text-gray-400 hover:text-yellow-500"><span className="text-3xl">📺</span><span className="text-xs mt-1 font-extrabold">Watch Ad</span></button>
        <button onClick={() => { setShowWithdraw(true); setWithdrawStep(1); }} className="flex flex-col items-center justify-center text-gray-400 hover:text-yellow-500"><span className="text-3xl">💰</span><span className="text-xs mt-1 font-extrabold">Withdraw</span></button>
      </div>
      {showSupport && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-[#151516] p-6 rounded-2xl w-full max-w-sm border border-gray-800 shadow-xl">
            <h3 className="text-xl font-bold text-yellow-500 mb-2">💬 Support</h3>
            <p className="text-sm text-gray-400 mb-4">Email Us: <span className="text-white font-mono select-all">support@taptopaisa.com</span></p>
            <h4 className="text-md font-bold text-white mb-2">📊 Payout History</h4>
            <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
              {history.length === 0 ? <p className="text-xs text-gray-500 text-center py-4">No data tracked yet.</p> : history.map((h, idx) => (
                <div key={idx} className="bg-white/5 p-2 rounded-lg flex justify-between items-center text-xs">
                  <div><p className="font-bold text-red-400">-₹{h.amt.toFixed(2)} ({h.type})</p><p className="text-[10px] text-gray-500">{h.date}</p></div>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${h.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>{h.status}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowSupport(false)} className="mt-4 w-full py-2 bg-white text-black font-bold rounded-xl text-sm">Close</button>
          </div>
        </div>
      )}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-[#151516] p-6 rounded-2xl w-full max-w-sm border border-gray-800 shadow-xl">
            <h3 className="text-xl font-bold text-yellow-500 mb-4 text-center">💰 Claim Earnings</h3>
            <p className="text-xs text-gray-400 mb-4 text-center">Available Balance: ₹{points.toFixed(2)} (Min: ₹50)</p>
            {withdrawStep === 1 ? (
              <div className="space-y-3">
                <button onClick={() => { setRedeemPointsInput('UPI'); setWithdrawStep(2); }} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl text-sm">🇮🇳 UPI Transfer</button>
                <button onClick={() => { setRedeemPointsInput('GooglePlay'); setWithdrawStep(2); }} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl text-sm">🎮 Google Play Code</button>
                <button onClick={() => setShowWithdraw(false)} className="w-full py-2 bg-white/10 text-white font-bold rounded-xl text-sm mt-2">Cancel</button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-bold text-white">{redeemPointsInput === 'UPI' ? 'Enter UPI ID:' : 'Enter Mobile Number:'}</h4>
                <input type="text" placeholder={redeemPointsInput === 'UPI' ? 'example@ybl' : 'Enter number'} value={upiMobileInput} onChange={e => setUpiMobileInput(e.target.value)} className="w-full p-2.5 rounded-xl bg-white/5 border border-gray-700 text-white text-sm focus:outline-none" />
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setWithdrawStep(1)} className="flex-1 py-2 bg-white/10 text-white font-bold rounded-xl text-sm">Back</button>
                  
