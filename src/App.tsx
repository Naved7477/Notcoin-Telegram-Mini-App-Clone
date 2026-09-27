import { useEffect, useState } from 'react';
import './index.css';
import Arrow from './icons/Arrow';
import { coin, highVoltage, notcoin, trophy } from './images';

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

const App = () => {
  const [points, setPoints] = useState(0);
  const [energy, setEnergy] = useState(6500);
  const [clicks, setClicks] = useState<{ id: number, x: number, y: number }[]>([]);
  
  // Popups State
  const [showSupport, setShowSupport] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);

  // Blue Print Automatic Levels Setup (Lvl 1=6500, Lvl 2=7500, Lvl 3=8500)
  const [tapLevel, setTapLevel] = useState(1); 
  const [energyLevel, setEnergyLevel] = useState(1); 

  // Withdrawal Two-Step States (As per User Blueprint Images)
  const [withdrawStep, setWithdrawStep] = useState(1); // 1 = Points input, 2 = UPI Mobile number input
  const [redeemPointsInput, setRedeemPointsInput] = useState('');
  const [upiMobileInput, setUpiMobileInput] = useState('');

  const maxEnergy = energyLevel === 1 ? 6500 : energyLevel === 2 ? 7500 : 8500;
  const pointsToAdd = tapLevel === 1 ? 0.01 : tapLevel === 2 ? 0.02 : 0.05;
  const energyToReduce = 1;

  const handleClick = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (energy - energyToReduce < 0) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPoints(Number((points + pointsToAdd).toFixed(2)));
    setEnergy(energy - energyToReduce < 0 ? 0 : energy - energyToReduce);
    
    const clickId = Date.now();
    setClicks([...clicks, { id: clickId, x, y }]);

    // Floating Points Auto-Clean up
    setTimeout(() => {
      setClicks((prevClicks) => prevClicks.filter(click => click.id !== clickId));
    }, 800);
  };

  // Upgrades Purchase Logic (Real Money Balance)
  const buyMultiTap = () => {
    const cost = tapLevel === 1 ? 5.00 : 10.00;
    if (points >= cost && tapLevel < 3) {
      setPoints(Number((points - cost).toFixed(2)));
      setTapLevel(tapLevel + 1);
      alert(`Multi-Tap Upgraded to Level ${tapLevel + 1}!`);
    } else if (tapLevel >= 3) {
      alert("Max Level Reached!");
    } else {
      alert("Insufficient Real Game Money!");
    }
  };

  const buyEnergyPool = () => {
    const cost = energyLevel === 1 ? 15.00 : 25.00;
    if (points >= cost && energyLevel < 3) {
      setPoints(Number((points - cost).toFixed(2)));
      setEnergyLevel(energyLevel + 1);
      setEnergy(energyLevel === 1 ? 7500 : 8500);
      alert(`Energy Tank Upgraded to Level ${energyLevel + 1}!`);
    } else if (energyLevel >= 3) {
      alert("Max Level Reached!");
    } else {
      alert("Insufficient Real Game Money!");
    }
  };

  useEffect(() => {
    // Slowly refill energy (5 seconds per 1 energy) to maximize ad revenue
    const interval = setInterval(() => {
      setEnergy((prevEnergy) => Math.min(prevEnergy + 1, maxEnergy));
    }, 5000);
    return () => clearInterval(interval);
  }, [maxEnergy]);

  // Handle Two-Step Withdrawal Actions
  const handleProceedToRedeem = () => {
    const pts = parseFloat(redeemPointsInput);
    if (!redeemPointsInput || isNaN(pts) || pts <= 0) {
      alert("Please enter a valid amount of points!");
      return;
    }
    if (pts > points) {
      alert("Insufficient balance to redeem this amount!");
      return;
    }
    if (pts < 50) {
      alert("Minimum withdrawal limit is ₹50.00!");
      return;
    }
    setWithdrawStep(2); // Go to UPI mobile number input screen
  };

  const handleConfirmWithdrawal = () => {
    if (!upiMobileInput || upiMobileInput.length < 10) {
      alert("Please enter a valid 10-digit UPI linked mobile number!");
      return;
    }
    const finalPts = parseFloat(redeemPointsInput);
    setPoints(Number((points - finalPts).toFixed(2)));
    alert(`Withdrawal request for ₹${finalPts.toFixed(2)} sent successfully! Payout will be processed to mobile ${upiMobileInput}.`);
    
    // Reset withdrawal modal state
    setRedeemPointsInput('');
    setUpiMobileInput('');
    setWithdrawStep(1);
    setShowWithdraw(false);
  };

  return (
    <div className="bg-gradient-main min-h-screen px-4 flex flex-col items-center text-white font-medium select-none relative">
      <div className="absolute inset-0 h-1/2 bg-gradient-to-b from-[#bf953f] via-[#fcf6ba] to-transparent opacity-10 pointer-events-none z-0"></div>

      {/* 🔔 Support Popup Panel */}
      {showSupport && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowSupport(false)}>
          <div className="bg-[#151516] border border-[#ffffff10] p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <span className="text-lg font-bold text-gradient border-b border-[#ffffff10] pb-2">🔔 Support & Updates</span>
            <div className="text-sm text-center">Customer Care Email: <br/><span className="text-[#fcf6ba] select-all font-bold">support@taptopaisa.com</span></div>
            <div className="text-xs bg-[#ffffff05] p-2 rounded border border-[#ffffff05] overflow-x-auto text-center text-[#bf953f]">
              Invite Link: <br/>https://t.me
            </div>
            <button className="bg-gradient-to-r from-[#bf953f] to-[#fcf6ba] text-black font-bold py-2 rounded-xl text-sm" onClick={() => setShowSupport(false)}>Close Panel</button>
          </div>
        </div>
      )}

      {/* 🧸 Shop Popup (Real Balance Boosters) */}
      {showShop && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm" onClick={() => setShowShop(false)}>
          <div className="bg-[#151516] border border-[#ffffff10] p-6 rounded-2xl w-full max-w-sm flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <span className="text-lg font-bold text-gradient border-b border-[#ffffff10] pb-2">🧸 Boosters Shop</span>
            
            <div className="flex justify-between items-center bg-[#ffffff05] p-3 rounded-xl border border-[#ffffff05]">
              <div className="flex flex-col">
                <span className="text-sm font-bold">👆 Multi-Tap Upgrade</span>
                <span className="text-xs opacity-60">Current Lvl: {tapLevel}</span>
                <span className="text-xs text-[#fcf6ba] font-bold mt-1">Cost: ₹{tapLevel === 1 ? '5.00' : tapLevel === 2 ? '10.00' : 'MAX'}</span>
              </div>
              <button className="bg-gradient-to-r from-[#bf953f] to-[#fcf6ba] text-black text-xs font-bold px-3 py-2 rounded-lg" onClick={buyMultiTap}>Upgrade</button>
            </div>

            <div className="flex justify-between items-center bg-[#ffffff05] p-3 rounded-xl border border-[#ffffff05]">
              <div className="flex flex-col">
                <span className="text-sm font-bold">⚡ Energy Pool Capacity</span>
                <span className="text-xs opacity-60">Max Tank: {maxEnergy} (Lvl {energyLevel})</span>
                <span className="text-xs text-[#fcf6ba] font-bold mt-1">Cost: ₹{energyLevel === 1 ? '15.00' : energyLevel === 2 ? '25.00' : 'MAX'}</span>
              </div>
              <button className="bg-gradient-to-r from-[#bf953f] to-[#fcf6ba] text-black text-xs font-bold px-3 py-2 rounded-lg" onClick={buyEnergyPool}>Upgrade</button>
            </div>
            
            <button className="bg-[#ffffff10] text-white py-2 rounded-xl text-sm mt-2" onClick={() => setShowShop(false)}>Close Shop</button>
          </div>
        </div>
      )}

      {/* 🚀 Custom 2-Step Withdrawal Popup (As per Screen Layout) */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-md" onClick={() => { setShowWithdraw(false); setWithdrawStep(1); }}>
          <div className="bg-[#1e1e24] border border-[#ffffff10] p-6 rounded-3xl w-full max-w-sm flex flex-col text-white shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            
            {/* Back button configuration */}
            <div className="absolute top-4 left-4 cursor-pointer text-xl opacity-60" onClick={() => { if (withdrawStep === 2) setWithdrawStep(1); else setShowWithdraw(false); }}>↩</div>

            {withdrawStep === 1 ? (
              /* SCREEN 1 Blueprint Layout */
              <div className="flex flex-col gap-5 pt-4 text-center">
                <h3 className="text-xl font-bold tracking-wide">How much you<br/>want to Redeem?</h3>
                <div className="flex flex-col gap-1 text-left">
                  <label className="text-xs opacity-50 ml-1">Enter your points</label>
                  <input 
                    type="number" 
                    placeholder="Min 50" 
                    value={redeemPointsInput}
                    onChange={(e) => setRedeemPointsInput(e.target.value)}
                    className="bg-black/40 border border-[#ffffff10] p-3 rounded-xl text-center font-bold text-lg text-[#fcf6ba] outline-none"
                  />
                </div>
                
                <button 
                  className="bg-[#00c2cb] text-white font-bold py-3 rounded-full text-base shadow-lg transition-transform active:scale-95"
                  onClick={handleProceedToRedeem}
                >
