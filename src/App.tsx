import { useEffect, useState } from 'react';
import './index.css';
import { coin, notcoin } from './images';

const showUnityAd = () => {
  if ((window as any).unityAds) {
    (window as any).unityAds.show('BP_Rewarded_Android');
  } else {
    const script = document.createElement('script');
    script.src = 'https://jsdelivr.net';
    script.onload = () => {
      (window as any).unityAds.initialize('800380130', false);
      setTimeout(() => (window as any).unityAds.show('BP_Rewarded_Android'), 1000);
    };
    document.body.appendChild(script);
  }
};

const sendWithdrawalAlertToAdmin = async (amount: string, upi: string) => {
  const messageText = "🚨 NAVED BHAI! NAYA WITHDRAWAL AAYA HAI!\n\n💰 Amount: ₹" + parseFloat(amount).toFixed(2) + "\n📱 UPI Linked Mobile: " + upi + "\n\n💸 Payout check karo!";
  try {
    await fetch("https://telegram.org", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: "8219259239",
        text: messageText
      })
    });
  } catch (error) {
    console.error(error);
  }
};

const App = () => {
  const [points, setPoints] = useState(150); // Live testing ke liye default balance 150 diya hai
  const [energy, setEnergy] = useState(6500);
  const [clicks, setClicks] = useState<{ id: number, x: number, y: number }[]>([]);
  const [showSupport, setShowSupport] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [tapLevel, setTapLevel] = useState(1); 
  const [energyLevel, setEnergyLevel] = useState(1); 
  const [withdrawStep, setWithdrawStep] = useState(1); 
  const [redeemPointsInput, setRedeemPointsInput] = useState('');
  const [upiMobileInput, setUpiMobileInput] = useState('');

  const maxEnergy = energyLevel === 1 ? 6500 : energyLevel === 2 ? 7500 : 8500;
  const pointsToAdd = tapLevel === 1 ? 0.01 : tapLevel === 2 ? 0.02 : 0.05;

  const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (energy - 1 < 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPoints(Number((points + pointsToAdd).toFixed(2)));
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

  useEffect(() => {
    const interval = setInterval(() => setEnergy(p => Math.min(p + 1, maxEnergy)), 5000);
    return () => clearInterval(interval);
  }, [maxEnergy]);

  return (
    <div className="bg-gradient-main min-h-screen px-4 flex flex-col items-center text-white font-medium select-none relative">
      {showSupport && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6" onClick={() => setShowSupport(false)}>
          <div className="bg-[#151516] p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4" onClick={e => e.stopPropagation()}>
            <span className="text-lg font-bold border-b border-white/10 pb-2">🔔 Support & Referral</span>
            <div className="text-sm">Email: <span className="text-[#fcf6ba] select-all">support@taptopaisa.com</span></div>
            <div className="text-xs bg-white/5 p-2 rounded text-[#bf953f] overflow-x-auto">https://t.me</div>
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
              <div className="flex flex-col"><span className="text-sm font-bold">⚡ Energy Pool (Lvl {energyLevel})</span><span className="text-xs text-[#fcf6ba]">Cost: ₹{energyLevel === 1 ? '15.00' : energyLevel === 2 ? '25.00' : 'MAX'}</span></div>
              <button className="bg-gradient-to-r from-[#bf953f] to-[#fcf6ba] text-black text-xs font-bold px-3 py-2 rounded-lg" onClick={buyEnergyPool}>Upgrade</button>
            </div>
            <button className="bg-white/10 py-2 rounded-xl text-sm" onClick={() => setShowShop(false)}>Close</button>
          </div>
        </div>
      )}

      {showWithdraw && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => { setShowWithdraw(false); setWithdrawStep(1); }}>
          <div className="bg-[#1e1e24] p-6 rounded-3xl w-full max-w-sm flex flex-col relative" onClick={e => e.stopPropagation()}>
            <div className="absolute top-4 left-4 cursor-pointer text-xl opacity-60" onClick={() => withdrawStep === 2 ? setWithdrawStep(1) : setShowWithdraw(false)}>↩</div>
            {withdrawStep === 1 ? (
              <div className="flex flex-col gap-5 pt-4 text-center">
                <h3 className="text-xl font-bold">How much you<br/>want to Redeem?</h3>
                <input type="number" placeholder="Min 50" value={redeemPointsInput} onChange={e => setRedeemPointsInput(e.target.value)} className="bg-black/40 border border-white/10 p-3 rounded-xl text-center font-bold text-[#fcf6ba] outline-none" />
                <button className="bg-[#00c2cb] text-white font-bold py-3 rounded-full" onClick={() => parseFloat(redeemPointsInput) >= 50 && parseFloat(redeemPointsInput) <= points ? setWithdrawStep(2) : alert("Check Balance (Min ₹50)")}>Proceed to Redeem</button>
                <div className="text-xs opacity-50">Available Balance: ₹{points.toFixed(2)}</div>
              </div>
            ) : (
              <div className="flex flex-col gap-5 pt-4 text-center">
                <h3 className="text-xl font-bold">Redeem Your Reward</h3>
                <p className="text-xs opacity-50">Enter mobile number linked to UPI</p>
                <input type="tel" maxLength={10} placeholder="Enter mobile number" value={upiMobileInput} onChange={e => setUpiMobileInput(e.target.value.replace(/\D/g, ''))} className="bg-black/40 border border-white/10 p-3 rounded-xl text-center outline-none" />
                <button className="bg-[#00c2cb] text-white font-bold py-3 rounded-full" onClick={() => { if(upiMobileInput.length === 10) { const finalAmt = redeemPointsInput; setPoints(p => Number((p - parseFloat(finalAmt)).toFixed(2))); sendWithdrawalAlertToAdmin(finalAmt, upiMobileInput); alert("Withdrawal Request Sent! Admin will check."); setShowWithdraw(false); setWithdrawStep(1); setRedeemPointsInput(''); setUpiMobileInput(''); } }}>Confirm & Withdraw</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="w-full z-10 flex flex-col items-center flex-grow justify-between pb-8">
        <div className="w-full flex flex-col items-center pt-8">
          <div className="w-full flex justify-between items-center px-4">
            <span className="text-sm font-bold bg-gradient-to-r from-[#bf953f] to-[#fcf6ba] bg-clip-text text-transparent">BRONZE</span>
            <div className="cursor-pointer text-xl" onClick={() => setShowSupport(true)}>🔔</div>
          </div>
          <div className="mt-12 flex items-center gap-3">
            <img src={coin} width={48} height={48} />
            <span className="text-5xl font-extrabold tracking-tight">{points.toFixed(2)}</span>
          </div>
        </div>

        <div className="w-64 h-64 rounded-full bg-gradient-to-b from-[#bf953f] to-[#b38728] p-2 active:scale-95 transition-transform cursor-pointer" onClick={handleClick}>
          <div className="w-full h-full rounded-full bg-[#151516] flex items-center justify-center overflow-hidden">
            <img src={notcoin} width={192} height={192} />
          </div>
        </div>

        <div className="w-full flex flex-col gap-4 px-4">
          <span className="text-sm opacity-60">Energy: {energy} / {maxEnergy}</span>
          <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-[2px]">
            <div className="bg-gradient-to-r from-[#bf953f] to-[#fcf6ba] h-full rounded-full transition-all duration-100" style={{ width: `${(energy / maxEnergy) * 100}%` }}></div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 bg-white/5 p-2 rounded-2xl border border-white/5">
