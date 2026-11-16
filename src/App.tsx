import React, { useState, useEffect } from 'react';
import './App.css';

declare global {
  interface Window {
    AdexiumWidget: any;
    Telegram: any;
  }
}

function App() {
  const todayDate = new Date().toDateString();

  // 1. Balance (Purani key 'ttp_balance' rakhi hai taaki update par paisa na ude!)
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('ttp_balance');
    return saved !== null ? parseFloat(saved) : 20.00;
  });

  // 2. Daily Ads Count (Max 50/day)
  const [adsWatched, setAdsWatched] = useState<number>(() => {
    const savedDate = localStorage.getItem('ttp_date');
    if (savedDate !== todayDate) return 0;
    const savedAds = localStorage.getItem('ttp_ads');
    return savedAds ? parseInt(savedAds) : 0;
  });

  // 3. Daily Energy (1,000/day, agle din refill)
  const [energy, setEnergy] = useState<number>(() => {
    const savedDate = localStorage.getItem('ttp_date');
    if (savedDate !== todayDate) return 1000;
    const savedEnergy = localStorage.getItem('ttp_energy');
    return savedEnergy !== null ? parseInt(savedEnergy) : 1000;
  });

  // 4. 7-Day Streak State
  const [streak, setStreak] = useState<number>(() => {
    const savedStreak = localStorage.getItem('ttp_streak');
    return savedStreak ? parseInt(savedStreak) : 0;
  });
  const [streakDoneToday, setStreakDoneToday] = useState<boolean>(() => {
    const savedDate = localStorage.getItem('ttp_date');
    if (savedDate !== todayDate) return false;
    return localStorage.getItem('ttp_streak_done') === 'true';
  });

  // 5. Active Referrals & Cooldown State
  const [activeReferrals, setActiveReferrals] = useState<number>(() => {
    const savedRef = localStorage.getItem('ttp_refs');
    return savedRef ? parseInt(savedRef) : 0;
  });
  const [cooldown, setCooldown] = useState<number>(0);

  // Modals State
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [withdrawMethod, setWithdrawMethod] = useState<'UPI' | 'REDEEM'>('UPI');
  const [withdrawInput, setWithdrawInput] = useState<string>('');

  // Auto-Save Data (Hamesha same keys mein save hoga)
  useEffect(() => {
    localStorage.setItem('ttp_date', todayDate);
    localStorage.setItem('ttp_balance', balance.toFixed(3));
    localStorage.setItem('ttp_energy', energy.toString());
    localStorage.setItem('ttp_ads', adsWatched.toString());
    localStorage.setItem('ttp_streak', streak.toString());
    localStorage.setItem('ttp_streak_done', streakDoneToday.toString());
    localStorage.setItem('ttp_refs', activeReferrals.toString());
  }, [balance, energy, adsWatched, streak, streakDoneToday, activeReferrals, todayDate]);

  // Ad Cooldown Timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // TAP COIN (₹0.001 per tap)
  const handleTapCoin = () => {
    if (energy > 0) {
      setBalance((prev) => parseFloat((prev + 0.001).toFixed(3)));
      setEnergy((prev) => prev - 1);
    } else {
      alert("Aaj ki 1,000 energy khatam ho gayi hai! Ab kal subah refill hogi.");
    }
  };

  // WATCH AD (50/day, ₹0.025/ad + 7-Day Streak Check)
  const handleWatchAdClick = () => {
    if (adsWatched >= 50) {
      alert("Aaj ki 50 ads ki limit poori ho gayi hai! Kal dobara dekhein.");
      return;
    }
    if (cooldown > 0) {
      alert(`Agli ad ke liye ${cooldown} second wait karein.`);
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
          const updatedAds = adsWatched + 1;
          setAdsWatched(updatedAds);
          setCooldown(15);

          if (updatedAds === 50 && !streakDoneToday) {
            const nextStreak = streak + 1;
            setStreakDoneToday(true);

            if (nextStreak >= 7) {
              setBalance((prev) => parseFloat((prev + 0.025 + 3.00).toFixed(3)));
              setStreak(0);
              alert("🔥 7-DAY STREAK COMPLETE! Aapko ₹0.025 Ad Reward + ₹3.00 Weekly Streak Bonus mila hai!");
            } else {
              setBalance((prev) => parseFloat((prev + 0.025).toFixed(3)));
              setStreak(nextStreak);
              alert(`🔥 Day ${nextStreak} / 7 Streak Complete! ₹0.025 add ho gaye.`);
            }
          } else {
            setBalance((prev) => parseFloat((prev + 0.025).toFixed(3)));
            alert("Badhai ho! ₹0.025 add ho gaye.");
          }
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

  // INVITE LINK SHARE
  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const userId = tgUser?.id || "player";
  const inviteLink = "https://" + `t.me/TapToPaisa_Official_bot?start=${userId}`;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Invite link copy ho gaya! Apne gamer friends ko bhejein.");
  };

  // OPEN WITHDRAW
  const handleWithdrawOpen = () => {
    if (balance < 50) {
      alert(`Minimum withdrawal ₹50.00 hai! Abhi aapka balance ₹${balance.toFixed(3)} hai.`);
      return;
    }
    if (activeReferrals < 2) {
      alert(`Withdrawal unlock karne ke liye kam se kam 2 Active Friends chahiye jo 7-Day Streak poori karein! (Abhi: ${activeReferrals} / 2)`);
      return;
    }
    setShowWithdrawModal(true);
  };

  // SUBMIT WITHDRAW + ADMIN TELEGRAM ALERT
  const handleWithdrawSubmit = async () => {
    if (!withdrawInput.trim()) {
      alert(withdrawMethod === 'UPI' ? "Apna UPI ID dalein!" : "Apna Gmail ya Telegram Username dalein!");
      return;
    }

    const botToken = "NAYA_BOT_TOKEN_YAHAN_DALEIN";
    const adminChatId = "8219259239";
    const userName = tgUser?.username ? `@${tgUser.username}` : (tgUser?.first_name || "Unknown User");

    const messageText = `🔔 *New Withdrawal Request!*\n\n👤 *User:* ${userName} (ID: \`${userId}\`)\n💰 *Amount:* ₹${balance.toFixed(2)}\n💳 *Method:* ${withdrawMethod === 'UPI' ? 'UPI Transfer' : 'Google Play Store'}\n📝 *Details:* \`${withdrawInput}\`\n👥 *Active Refs:* ${activeReferrals}`;
    const apiUrl = "https://" + `api.telegram.org/bot${botToken}/sendMessage`;

    try {
      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: adminChatId,
          text: messageText,
          parse_mode: "Markdown"
        })
      });
    } catch (err) {
      console.error("Telegram alert failed:", err);
    }

    alert(`Withdrawal Request Submit Ho Gayi!\n\nAmount: ₹${balance.toFixed(2)}\nMethod: ${withdrawMethod === 'UPI' ? 'UPI Transfer' : 'Google Play Store'}\n\nReceipt aapke Telegram bot chat par bhej di jayegi!`);
    setBalance(0);
    setWithdrawInput('');
    setShowWithdrawModal(false);
  };

  // SUPPORT BUTTON
  const handleSupportClick = () => {
    const supportUrl = "https://" + "t.me/naved_games";
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(supportUrl);
    } else {
      window.open(supportUrl, "_blank");
    }
  };

  return (
    <div className="bg-[#0b0b0e] min-h-screen px-4 flex flex-col items-center text-white relative pb-24 select-none">
      
      {/* Top Bar */}
      <div className="w-full flex justify-between items-center mt-6 px-2">
        <div className="bg-zinc-900/90 border border-orange-500/40 px-3.5 py-1.5 rounded-full flex items-center space-x-1.5">
          <span className="text-sm font-bold text-orange-400">🔥 Streak: {streak} / 7d</span>
        </div>
        <div 
          onClick={handleSupportClick}
          className="p-2.5 bg-zinc-900/90 border border-zinc-800 rounded-full cursor-pointer active:scale-90 transition-transform"
        >
          <span className="text-xl">🎧</span>
        </div>
      </div>

      {/* Main Income Display */}
      <div className="flex flex-col items-center justify-center mt-10">
        <span className="text-4xl font-extrabold tracking-tight text-white">₹{balance.toFixed(3)}</span>

        <div className="mt-3 bg-zinc-900 px-4 py-1.5 rounded-full border border-zinc-800 text-xs text-gray-300 flex items-center space-x-2">
          <span>📺 Ads Today: {adsWatched} / 50</span>
          {cooldown > 0 && <span className="text-yellow-500">({cooldown}s)</span>}
        </div>
      </div>

      {/* Golden Tapper Circle */}
      <div className="flex-1 flex items-center justify-center my-6">
        <div 
          onClick={handleTapCoin}
          className="w-60 h-60 rounded-full border-4 border-yellow-600/70 flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black shadow-[0_0_40px_rgba(202,138,4,0.15)] cursor-pointer active:scale-95 transition-transform"
        >
          <span className="text-yellow-500 font-bold text-xl tracking-wider">TAP COIN</span>
          <span className="text-[11px] text-gray-400 mt-1">+₹0.001 / tap</span>
        </div>
      </div>

      {/* Bottom Interface */}
      <div className="w-full max-w-md space-y-4 px-2">
        {/* Energy Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span className="text-yellow-500 font-medium">⚡ Energy</span>
            <span>{energy} / 1000</span>
          </div>
          <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                    <div 
              className="bg-yellow-500 h-full rounded-full transition-all duration-150"
              style={{ width: `${(energy / 1000) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* 3 Action Buttons */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 grid grid-cols-3 gap-2 shadow-lg">
          <button
            onClick={handleWatchAdClick}
            className="flex flex-col items-center space-y-1 text-yellow-500 active:scale-95 transition-transform"
          >
            <span className="text-2xl">📺</span>
            <span className="text-xs font-medium">
              {cooldown > 0 ? `Wait ${cooldown}s` : 'Watch Ad'}
            </span>
          </button>

          <button
            onClick={() => setShowInviteModal(true)}
            className="flex flex-col items-center space-y-1 text-blue-400 active:scale-95 transition-transform"
          >
            <span className="text-2xl">👥</span>
            <span className="text-xs font-medium">Invite ({activeReferrals}/2)</span>
          </button>

          <button
            onClick={handleWithdrawOpen}
            className="flex flex-col items-center space-y-1 text-green-400 active:scale-95 transition-transform"
          >
            <span className="text-2xl">💰</span>
            <span className="text-xs font-medium">Withdraw</span>
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center px-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-center text-blue-400">👥 Squad Invite Bonus</h2>
            <p className="text-xs text-gray-300 text-center leading-relaxed">
              Har friend jo aapke link se join karke <span className="text-orange-400 font-bold">7-Day Streak</span> poori karega, uske badle aapko <span className="text-green-400 font-bold">₹3.00 Bonus</span> milega!
            </p>
            <div className="bg-zinc-800 p-2.5 rounded-xl text-[11px] text-gray-300 break-all border border-zinc-700">
              {inviteLink}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 py-2 rounded-xl bg-zinc-800 text-gray-300 text-sm"
              >
                Close
              </button>
              <button
                onClick={handleCopyInvite}
                className="flex-1 py-2 rounded-xl bg-blue-500 text-white text-sm font-bold"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center px-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-center text-yellow-500">Withdraw ₹{balance.toFixed(2)}</h2>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setWithdrawMethod('UPI')}
                className={
                  withdrawMethod === 'UPI'
                    ? 'py-2 px-3 rounded-xl text-xs font-semibold border bg-yellow-500 text-black border-yellow-500'
                    : 'py-2 px-3 rounded-xl text-xs font-semibold border bg-zinc-800 text-gray-300 border-zinc-700'
                }
              >
                🏦 UPI Transfer
              </button>
              <button
                onClick={() => setWithdrawMethod('REDEEM')}
                className={
                  withdrawMethod === 'REDEEM'
                    ? 'py-2 px-3 rounded-xl text-xs font-semibold border bg-yellow-500 text-black border-yellow-500'
                    : 'py-2 px-3 rounded-xl text-xs font-semibold border bg-zinc-800 text-gray-300 border-zinc-700'
                }
              >
                <span className="flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M3.6 2.4c-.3.3-.5.8-.5 1.4v16.4c0 .6.2 1.1.5 1.4l.1.1 9.2-9.2v-.2L3.7 2.3l-.1.1z"/>
                    <path fill="#34A853" d="M16 15.5l-3.1-3.1v-.2L16 9.1l.1.1 3.6 2.1c1 .6 1 1.5 0 2.1l-3.6 2.1-.1 0z"/>
                    <path fill="#FBBC05" d="M16.1 15.4L12.9 12.2 3.6 21.5c.3.4.9.4 1.6 0l10.9-6.1z"/>
                    <path fill="#EA4335" d="M16.1 8.6L5.2 2.5c-.7-.4-1.3-.4-1.6 0l9.3 9.3 3.2-3.2z"/>
                  </svg>
                  <span>Google Play Store</span>
                </span>
              </button>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">
                {withdrawMethod === 'UPI'
                  ? 'Apna UPI ID dalein (jaise name@okaxis):'
                  : 'Apna Gmail ya @Telegram username dalein:'}
              </label>
              <input
                type="text"
                value={withdrawInput}
                onChange={(e) => setWithdrawInput(e.target.value)}
                placeholder={withdrawMethod === 'UPI' ? 'example@upi' : 'name@gmail.com ya @username'}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1 py-2 rounded-xl bg-zinc-800 text-gray-300 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdrawSubmit}
                className="flex-1 py-2 rounded-xl bg-yellow-500 text-black text-sm font-bold"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;

              
