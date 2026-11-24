import React, { useState, useEffect } from 'react';
import './App.css';

declare global {
  interface Window {
    AdexiumWidget: any;
    show_12277677: any;
    initCdTma: any;
    onClickAShow: any;
    Telegram: any;
  }
}

function App() {
  const todayDate = new Date().toDateString();

  const [balance, setBalance] = useState<number>(() => {
    const saved = parseFloat(localStorage.getItem('ttp_balance') || '');
    return !isNaN(saved) ? saved : 20.00;
  });

  const [adsWatched, setAdsWatched] = useState<number>(() => {
    if (localStorage.getItem('ttp_date') !== todayDate) return 0;
    const saved = parseInt(localStorage.getItem('ttp_ads') || '0');
    return !isNaN(saved) ? saved : 0;
  });

  const [energy, setEnergy] = useState<number>(() => {
    if (localStorage.getItem('ttp_date') !== todayDate) return 1000;
    const saved = parseInt(localStorage.getItem('ttp_energy') || '1000');
    return !isNaN(saved) ? saved : 1000;
  });

    const [streak, setStreak] = useState<number>(() => {
    const saved = parseInt(localStorage.getItem('ttp_streak') || '0');
    const lastStreakTime = parseInt(localStorage.getItem('ttp_last_streak_ts') || '0');
    if (lastStreakTime > 0 && Date.now() - lastStreakTime > 3 * 24 * 60 * 60 * 1000) {
      return 0;
    }
    return !isNaN(saved) ? saved : 0;
  });
  
  const [streakDoneToday, setStreakDoneToday] = useState<boolean>(() => {
    if (localStorage.getItem('ttp_date') !== todayDate) return false;
    return localStorage.getItem('ttp_streak_done') === 'true';
  });

  const [activeReferrals, setActiveReferrals] = useState<number>(() => {
    const saved = parseInt(localStorage.getItem('ttp_refs') || '0');
    return !isNaN(saved) ? saved : 0;
  });

  const [scratchUsed, setScratchUsed] = useState<number>(() => {
    if (localStorage.getItem('ttp_date') !== todayDate) return 0;
    const saved = parseInt(localStorage.getItem('ttp_scratch') || '0');
    return !isNaN(saved) ? saved : 0;
  });

  const [loyaltyAdsLeft, setLoyaltyAdsLeft] = useState<number>(() => {
    const saved = parseInt(localStorage.getItem('ttp_loyalty') || '0');
    return !isNaN(saved) ? saved : 0;
  });

  const [showScratchModal, setShowScratchModal] = useState<boolean>(false);
  const [scratchUnlocked, setScratchUnlocked] = useState<boolean>(false);
  const [scratchPrize, setScratchPrize] = useState<number>(0);

  const [withdrawStep, setWithdrawStep] = useState<number>(0);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(50);
  const [withdrawMethod, setWithdrawMethod] = useState<'UPI' | 'REDEEM'>('UPI');
  const [withdrawInput, setWithdrawInput] = useState<string>('');

  const [cooldown, setCooldown] = useState<number>(0);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [txHistory, setTxHistory] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('ttp_history') || '[]'); } catch { return []; }
  });
  
  useEffect(() => {
    try {
      if (window.initCdTma) {
        window.initCdTma({ id: '6155389' })
          .then((show: any) => { window.onClickAShow = show; })
          .catch(() => {});
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    localStorage.setItem('ttp_date', todayDate);
    localStorage.setItem('ttp_balance', balance.toFixed(3));
    localStorage.setItem('ttp_energy', energy.toString());
    localStorage.setItem('ttp_ads', adsWatched.toString());
    localStorage.setItem('ttp_streak', streak.toString());
    localStorage.setItem('ttp_history', JSON.stringify(txHistory));
    localStorage.setItem('ttp_streak_done', streakDoneToday.toString());
    localStorage.setItem('ttp_refs', activeReferrals.toString());
    localStorage.setItem('ttp_scratch', scratchUsed.toString());
    localStorage.setItem('ttp_loyalty', loyaltyAdsLeft.toString());
  }, [balance, energy, adsWatched, streak, streakDoneToday, activeReferrals, scratchUsed, loyaltyAdsLeft, todayDate]);
  useEffect(() => {
    const uid = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (!uid) return;
    const ttpDb = "https://" + "taptopaisa-db-default-rtdb.asia-southeast1.firebasedatabase.app";
    const bpDb = "https://" + "block-paisa-default-rtdb.asia-southeast1.firebasedatabase.app";

    fetch(`${ttpDb}/users/${uid}.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance, streak, streak7Done: streak >= 7 })
    }).catch(() => {});

    if (localStorage.getItem('ttp_combo5_claimed') !== 'yes') {
      fetch(`${bpDb}/users/${uid}.json`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.streak5Paid) {
            localStorage.setItem('ttp_combo5_claimed', 'yes');
            setBalance((prev) => parseFloat((prev + 5).toFixed(3)));
            setTxHistory((prev) => [{ title: 'Block Paisa 7d Combo', amount: '+₹5.00', date: new Date().toLocaleDateString('en-IN'), status: 'Credited' }, ...prev]);
            alert('🎉 Cross-Game Combo Bonus! +₹5.00 has been added to your Tap To Paisa wallet!');
          }
        })
        .catch(() => {});
    }
  }, [streak]);
  
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const playAdWithCallback = (onSuccess: () => void) => {
    const tryAdexium = () => {
      if (window.AdexiumWidget) {
        const widget = new window.AdexiumWidget({
          wid: 'dc83b77d-01d0-412f-9055-0945fb57b2d8',
          adFormat: 'interstitial'
        });
        widget.requestAd('interstitial');
        widget.on('adPlaybackCompleted', onSuccess);
        widget.on('noAdFound', () => alert("No ads available right now. Please try again shortly."));
      } else {
        alert("No ads available right now. Please try again shortly.");
      }
    };

          if (typeof window.show_12277677 === 'function') {
      window.show_12277677().then(onSuccess).catch(tryAdexium);
    } else {
      tryAdexium();
    }
  };
  
  

  const handleWatchAdClick = () => {
    if (adsWatched >= 50) {
      alert("Daily limit of 50 ads reached! Come back tomorrow.");
      return;
    }
    if (cooldown > 0) {
      alert(`Please wait ${cooldown}s before watching the next ad.`);
      return;
    }

    playAdWithCallback(() => {
      const updatedAds = adsWatched + 1;
      setAdsWatched(updatedAds);
      setCooldown(15);

      if (updatedAds === 50 && !streakDoneToday) {
        const nextStreak = streak + 1;
        setStreakDoneToday(true);
                localStorage.setItem('ttp_last_streak_ts', Date.now().toString());
        if (nextStreak >= 7) {
          setBalance((prev) => parseFloat((prev + 0.025 + 3.00).toFixed(3)));
          setStreak(0);
          alert("7-Day Streak Complete! You earned ₹0.025 + ₹3.00 Weekly Bonus!");
        } else {
          setBalance((prev) => parseFloat((prev + 0.025).toFixed(3)));
          setStreak(nextStreak);
          alert(`Day ${nextStreak}/7 Streak Complete! ₹0.025 added.`);
        }
      } else if (loyaltyAdsLeft > 0) {
        const rem = loyaltyAdsLeft - 1;
        setLoyaltyAdsLeft(rem);
        if (rem === 0) {
          setBalance((prev) => parseFloat((prev + 0.025 + 10.00).toFixed(3)));
          alert("🎉 2 Loyalty Ads Complete! You earned ₹0.025 + ₹10.00 Loyalty Cashback!");
        } else {
          setBalance((prev) => parseFloat((prev + 0.025).toFixed(3)));
          alert(`₹0.025 added! Watch ${rem} more ad to unlock ₹10.00 Loyalty Cashback!`);
        }
      } else {
        setBalance((prev) => parseFloat((prev + 0.025).toFixed(3)));
        alert("Congrats! ₹0.025 added to your balance.");
      }
    });
  };

  const handleUnlockScratchCard = () => {
    if (scratchUsed >= 5) {
      alert("All 5 daily scratch cards used! Come back tomorrow.");
      return;
    }
    if (cooldown > 0) {
      alert(`Please wait ${cooldown}s before unlocking the next card.`);
      return;
    }

    playAdWithCallback(() => {
      const roll = Math.random() * 100;
      let won = 0.01;
      if (roll < 2) won = 0.25;
      else if (roll < 10) won = 0.10;
      else if (roll < 30) won = 0.05;
      else if (roll < 65) won = 0.02;
      else won = 0.01;

      setScratchPrize(won);
      setScratchUnlocked(true);
      setScratchUsed((prev) => prev + 1);
      setCooldown(15);
    });
  };

  const handleClaimScratchPrize = () => {
    setBalance((prev) => parseFloat((prev + scratchPrize).toFixed(3)));
    setScratchUnlocked(false);
    setShowScratchModal(false);
    alert(`🎉 You won ₹${scratchPrize.toFixed(3)} from Scratch Card!`);
  };

  const handleTapCoin = () => {
    if (energy > 0) {
      setBalance((prev) => parseFloat((prev + 0.001).toFixed(3)));
      setEnergy((prev) => prev - 1);
    } else {
      alert("Daily 1,000 energy used! Refills tomorrow.");
    }
  };

  const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const userId = tgUser?.id || "player";
  const inviteLink = "https://" + `t.me/TapToPaisa_Official_bot?start=${userId}`;

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied! Share it with your gamer squad.");
  };

  const handleWithdrawOpen = () => {
    if (balance < 50) {
      alert(`Minimum withdrawal is ₹50.00! Current balance: ₹${balance.toFixed(3)}`);
      return;
    }
    if (activeReferrals < 2) {
      alert(`Invite at least 2 active friends (who complete a 7-Day Streak) to unlock withdrawal! (${activeReferrals}/2)`);
      return;
    }
    setWithdrawAmount(50);
    setWithdrawStep(1);
  };

  const handleWithdrawSubmit = async () => {
    if (!withdrawInput.trim()) {
      alert(withdrawMethod === 'UPI' ? "Please enter your UPI Mobile Number or UPI ID!" : "Please enter your Gmail or @Telegram username!");
      return;
    }

    const botToken = "8922827316:AAHBkPk6rQJWPQ41iV9jTpQtABChyux6iyM";
    const adminChatId = "8219259239";
    const userName = tgUser?.username ? `@${tgUser.username}` : (tgUser?.first_name || "Unknown User");

    const messageText = `🔔 *New Withdrawal Request!*\n\n👤 *User:* ${userName} (ID: \`${userId}\`)\n💰 *Amount:* ₹${withdrawAmount.toFixed(2)}\n💳 *Method:* ${withdrawMethod === 'UPI' ? 'UPI Transfer' : 'Google Play Store'}\n📝 *Details:* \`${withdrawInput}\`\n👥 *Active Refs:* ${activeReferrals}`;
    const apiUrl = "https://" + `api.telegram.org/bot${botToken}/sendMessage`;

    try {
      await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: adminChatId, text: messageText, parse_mode: "Markdown" })
      });
    } catch (err) {}

    setBalance((prev) => parseFloat(Math.max(0, prev - withdrawAmount).toFixed(3)));
    setLoyaltyAdsLeft(2);
        const newTx = { title: `${withdrawMethod === 'UPI' ? 'UPI Transfer' : 'Google Play Store'}`, amount: `-₹${withdrawAmount.toFixed(2)}`, date: new Date().toLocaleDateString('en-IN'), status: 'Processing' };
    setTxHistory((prev) => [newTx, ...prev]);
    
    setWithdrawStep(3);
  };

  const handleSupportClick = () => {
    const supportUrl = "https://" + "t.me/Game_Developer07";
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(supportUrl);
    } else {
      window.open(supportUrl, "_blank");
    }
  };
    return (
    <div className="bg-[#0b0b0e] min-h-screen px-4 flex flex-col items-center text-white relative pb-24 select-none">
                          <div className="w-full flex justify-between items-center mt-5 px-1 gap-2">
        <div className="bg-zinc-900/90 border border-orange-500/40 px-3 py-1.5 rounded-full whitespace-nowrap">
          <span className="text-xs font-bold text-orange-400">🔥 {streak}/7d</span>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setShowHistoryModal(true)} className="px-3 py-1.5 bg-zinc-900/90 border border-zinc-700 rounded-full text-xs font-bold text-gray-200 whitespace-nowrap active:scale-90">
            📜 History
          </button>
          <div onClick={handleSupportClick} className="w-8 h-8 flex items-center justify-center bg-zinc-900/90 border border-zinc-800 rounded-full cursor-pointer active:scale-90">
            <span className="text-base">🎧</span>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-center justify-center mt-10">
        <span className="text-4xl font-extrabold tracking-tight text-white">₹{balance.toFixed(3)}</span>
        <div className="mt-3 bg-zinc-900 px-4 py-1.5 rounded-full border border-zinc-800 text-xs text-gray-300 flex items-center space-x-2">
          <span>📺 Ads Today: {adsWatched} / 50</span>
          {cooldown > 0 && <span className="text-yellow-500">({cooldown}s)</span>}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center my-6">
        <div onClick={handleTapCoin} className="w-60 h-60 rounded-full border-4 border-yellow-600/70 flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black shadow-[0_0_40px_rgba(202,138,4,0.15)] cursor-pointer active:scale-95 transition-transform">
          <span className="text-yellow-500 font-bold text-xl tracking-wider">TAP COIN</span>
          <span className="text-[11px] text-gray-400 mt-1">+₹0.001 / tap</span>
        </div>
      </div>

      <div className="w-full max-w-md space-y-4 px-2">
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-400">
            <span className="text-yellow-500 font-medium">⚡ Energy</span>
            <span>{energy} / 1000</span>
          </div>
          <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
            <div className="bg-yellow-500 h-full rounded-full transition-all duration-150" style={{ width: `${(energy / 1000) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 grid grid-cols-4 gap-1 shadow-lg">
          <button onClick={handleWatchAdClick} className="flex flex-col items-center space-y-1 text-yellow-500 active:scale-95">
            <span className="text-xl">📺</span>
            <span className="text-[11px] font-medium">{cooldown > 0 ? `${cooldown}s` : 'Watch Ad'}</span>
          </button>
          <button onClick={() => { setScratchUnlocked(false); setShowScratchModal(true); }} className="flex flex-col items-center space-y-1 text-pink-400 active:scale-95">
            <span className="text-xl">🎁</span>
            <span className="text-[11px] font-medium">Scratch ({5 - scratchUsed})</span>
          </button>
          <button onClick={() => setShowInviteModal(true)} className="flex flex-col items-center space-y-1 text-blue-400 active:scale-95">
            <span className="text-xl">👥</span>
            <span className="text-[11px] font-medium">Invite ({activeReferrals}/2)</span>
          </button>
                    <button onClick={handleWithdrawOpen} className="flex flex-col items-center space-y-1 text-amber-400 active:scale-95">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
            <span className="text-[11px] font-medium">Wallet</span>
          </button>
          
        </div>
      </div>

      {showScratchModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center px-4 z-50">
          <div className="bg-zinc-900 border border-pink-500/40 rounded-3xl p-6 w-full max-w-sm space-y-4 text-center">
            <h2 className="text-lg font-bold text-pink-400">🎁 Lucky Scratch Card ({5 - scratchUsed}/5 Left)</h2>
            {!scratchUnlocked ? (
              <>
                <div className="h-36 rounded-2xl bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-700 flex flex-col items-center justify-center p-4 shadow-inner">
                  <span className="text-3xl mb-1">🔒</span>
                  <p className="text-xs text-white/90 font-medium">Watch 1 Ad to Unlock & Scratch Instant Cash!</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setShowScratchModal(false)} className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-gray-300 text-sm">Close</button>
                  <button onClick={handleUnlockScratchCard} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-bold">
                    {cooldown > 0 ? `Wait ${cooldown}s` : '📺 Unlock Card'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div onClick={handleClaimScratchPrize} className="h-36 rounded-2xl bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 flex flex-col items-center justify-center p-4 cursor-pointer animate-pulse text-black">
                  <span className="text-xs font-bold uppercase tracking-wider">You Won!</span>
                  <span className="text-4xl font-extrabold mt-1">₹{scratchPrize.toFixed(3)}</span>
                  <span className="text-[11px] font-semibold mt-1">Tap to Collect</span>
                </div>
                <button onClick={handleClaimScratchPrize} className="w-full py-2.5 rounded-xl bg-green-500 text-black text-sm font-bold">Collect ₹{scratchPrize.toFixed(3)}</button>
              </>
            )}
          </div>
        </div>
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center px-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 w-full max-w-sm space-y-4">
            <h2 className="text-lg font-bold text-center text-blue-400">👥 Squad Invite Bonus</h2>
            <p className="text-xs text-gray-300 text-center leading-relaxed">
              Earn <span className="text-green-400 font-bold">₹3.00 Bonus</span> for every friend who joins via your link and completes a <span className="text-orange-400 font-bold">7-Day Streak</span>!
            </p>
            <div className="bg-zinc-800 p-2.5 rounded-xl text-[11px] text-gray-300 break-all border border-zinc-700">{inviteLink}</div>
            <div className="flex space-x-2">
              <button onClick={() => setShowInviteModal(false)} className="flex-1 py-2 rounded-xl bg-zinc-800 text-gray-300 text-sm">Close</button>
              <button onClick={handleCopyInvite} className="flex-1 py-2 rounded-xl bg-blue-500 text-white text-sm font-bold">Copy Link</button>
            </div>
          </div>
        </div>
      )}
            {showHistoryModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center px-4 z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-3xl p-5 w-full max-w-sm space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-yellow-400">📜 Transaction History</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 text-lg font-bold">✕</button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {txHistory.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">No withdrawals or bonuses yet. Start watching ads to earn!</p>
              ) : (
                txHistory.map((item, idx) => (
                  <div key={idx} className="bg-zinc-800/90 border border-zinc-700 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-white">{item.title}</p>
                      <p className="text-[10px] text-gray-400">{item.date} • {item.status}</p>
                    </div>
                    <span className={item.amount.startsWith('+') ? 'text-xs font-extrabold text-green-400' : 'text-xs font-extrabold text-rose-400'}>{item.amount}</span>
                  </div>
                ))
              )}
            </div>
            <button onClick={() => setShowHistoryModal(false)} className="w-full py-2.5 rounded-xl bg-zinc-800 text-white text-xs font-bold">Close</button>
          </div>
        </div>
      )}
      
            {withdrawStep === 1 && (
        <div className="fixed inset-0 bg-gray-100 text-gray-900 flex flex-col justify-between p-5 z-50">
          <div>
            <button onClick={() => setWithdrawStep(0)} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-lg font-bold">↩</button>
            <div className="bg-white rounded-2xl p-4 mt-4 shadow-sm flex items-center justify-center space-x-3">
              <span className="text-2xl font-extrabold">🪙 ₹{withdrawAmount}</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-rose-500">Select Payout</span>
            </div>

            <div className="bg-white rounded-3xl p-5 mt-5 shadow-md space-y-4">
              <h3 className="font-bold text-base">1. Choose Amount</h3>
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, Math.floor(balance)].map((amt, idx) => (
                  <button
                    key={idx}
                    disabled={balance < amt || amt < 50}
                    onClick={() => setWithdrawAmount(amt)}
                    className={withdrawAmount === amt ? 'py-2 rounded-xl font-bold text-sm bg-teal-500 text-white' : 'py-2 rounded-xl font-bold text-sm bg-gray-100 text-gray-700 disabled:opacity-40'}
                  >
                    🪙 ₹{amt}
                  </button>
                ))}
              </div>

              <h3 className="font-bold text-base pt-2">2. Choose Method</h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setWithdrawMethod('UPI')} className={withdrawMethod === 'UPI' ? 'py-3 rounded-xl text-xs font-bold border-2 border-rose-500 bg-rose-50 text-rose-600 flex items-center justify-center space-x-1.5' : 'py-3 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 flex items-center justify-center space-x-1.5'}>
                  <span>🏦</span>
                  <span>UPI Transfer</span>
                </button>
                <button onClick={() => setWithdrawMethod('REDEEM')} className={withdrawMethod === 'REDEEM' ? 'py-3 rounded-xl text-xs font-bold border-2 border-rose-500 bg-rose-50 text-rose-600 flex items-center justify-center space-x-1.5' : 'py-3 rounded-xl text-xs font-bold border border-gray-200 text-gray-600 flex items-center justify-center space-x-1.5'}>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M3.6 2.4c-.3.3-.5.8-.5 1.4v16.4c0 .6.2 1.1.5 1.4l.1.1 9.2-9.2v-.2L3.7 2.3l-.1.1z"/>
                    <path fill="#34A853" d="M16 15.5l-3.1-3.1v-.2L16 9.1l.1.1 3.6 2.1c1 .6 1 1.5 0 2.1l-3.6 2.1-.1 0z"/>
                    <path fill="#FBBC05" d="M16.1 15.4L12.9 12.2 3.6 21.5c.3.4.9.4 1.6 0l10.9-6.1z"/>
                    <path fill="#EA4335" d="M16.1 9L5.2 2.9c-.7-.4-1.3-.4-1.6 0l9.3 9.3L16.1 9z"/>
                  </svg>
                  <span>Google Play</span>
                </button>
              </div>

              <button onClick={() => setWithdrawStep(2)} className="w-full py-3 rounded-full text-white font-bold text-sm bg-gradient-to-r from-teal-500 via-purple-500 to-rose-500 shadow-md mt-2">
                Continue with 🪙 ₹{withdrawAmount}
              </button>
            </div>
          </div>
        </div>
      )}

      {withdrawStep === 2 && (
        <div className="fixed inset-0 bg-gray-100 text-gray-900 flex flex-col p-5 z-50">
          <button onClick={() => setWithdrawStep(1)} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-lg font-bold">↩</button>
          <div className="bg-white rounded-2xl p-4 mt-4 shadow-sm flex items-center justify-center space-x-3">
            <span className="text-3xl font-extrabold">🪙 {withdrawAmount}</span>
            <span className="px-3.5 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-rose-500">Withdraw Reward</span>
          </div>

          <div className="bg-white rounded-3xl p-5 mt-5 shadow-md space-y-4">
            <div>
              <h2 className="text-lg font-extrabold">Redeem Your Reward</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {withdrawMethod === 'UPI' ? 'Please add the mobile number or UPI ID linked to your UPI' : 'Please enter your Gmail or @Telegram username for Redeem Code'}
              </p>
            </div>

            <div className="border-2 border-rose-400 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 rounded-full border-4 border-rose-400 inline-block"></span>
                <span className="text-xs font-bold">{withdrawMethod === 'UPI' ? 'Mobile Number / UPI Linked' : 'Gmail ID / @Telegram Username'}</span>
              </div>
              <input
                type="text"
                value={withdrawInput}
                onChange={(e) => setWithdrawInput(e.target.value)}
                placeholder={withdrawMethod === 'UPI' ? 'e.g. 9876543210 or name@upi' : 'e.g. gamer@gmail.com or @username'}
                className="w-full bg-stone-100 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-900 focus:outline-none"
              />
            </div>

            <button onClick={handleWithdrawSubmit} className="w-full py-3 rounded-full text-white font-bold text-sm bg-gradient-to-r from-teal-500 via-purple-500 to-rose-500 shadow-md">
              Confirm & Withdraw 🪙 {withdrawAmount}
            </button>
          </div>
        </div>
      )}

      {withdrawStep === 3 && (
        <div className="fixed inset-0 bg-gradient-to-b from-indigo-950 via-purple-700 to-pink-300 text-white flex flex-col items-center justify-between p-6 z-50 text-center">
          <div className="mt-6 space-y-2">
            <p className="text-xs uppercase tracking-widest text-purple-200 font-bold">Tap To Paisa</p>
            <h1 className="text-3xl font-extrabold leading-tight">Great!<br />Your Redemption<br />Successful</h1>
            <p className="text-xs text-purple-100 max-w-xs mx-auto pt-1">
              Your ₹{withdrawAmount} has been processed. You'll receive confirmation in your Telegram chat shortly.
            </p>
          </div>

          <div className="bg-white text-gray-900 rounded-3xl p-5 w-full max-w-xs shadow-xl space-y-3">
            <div className="text-3xl font-extrabold">🪙 {withdrawAmount}</div>
            <p className="text-xs text-gray-500 font-medium">Amount Redeemed</p>
            <div className="py-1 rounded-md text-xs font-bold text-white bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500">
              1 Coin = ₹1
            </div>
            <div className="bg-cyan-50 rounded-xl p-3">
              <p className="text-xs font-bold text-gray-800">Stay with Tap To Paisa</p>
              <p className="text-[11px] text-gray-500">Watch 2 Ads now to unlock ₹10.00 Loyalty Cashback!</p>
            </div>
          </div>

          <button
            onClick={() => { setWithdrawInput(''); setWithdrawStep(0); }}
            className="w-full max-w-xs py-3 rounded-full bg-white text-gray-900 font-bold text-sm shadow-lg border-2 border-rose-400"
          >
            Back to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
