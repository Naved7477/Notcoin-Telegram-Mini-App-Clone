import React, { useState, useEffect } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        openLink?: (url: string) => void;
        initDataUnsafe?: {
          user?: {
            id?: number;
            first_name?: string;
            username?: string;
          };
          start_param?: string;
        };
      };
    };
    show_12277677?: () => Promise<void>;
  }
}

const DB_BASE = "https://" + "taptopaisa-db-default-rtdb.asia-southeast1.firebasedatabase.app";
const DIRECT_LINK_URL = "https://" + "://uplcm.com";
const BOT_USERNAME = "TapToPaisa_Official_bot";

interface HistoryItem {
  id: string;
  title: string;
  amount: string;
  date: string;
}

export default function App() {
  const [userId, setUserId] = useState<string>("guest_user");
  const [userName, setUserName] = useState<string>("Gamer");
  const [balance, setBalance] = useState<number>(15.0);
  const [energy, setEnergy] = useState<number>(1000);
  const [adsToday, setAdsToday] = useState<number>(0);
  const [scratchesLeft, setScratchesLeft] = useState<number>(5);
  const [offersLeft, setOffersLeft] = useState<number>(3);
  const [offerTimer, setOfferTimer] = useState<number>(0);
  const [streakDays, setStreakDays] = useState<number>(0);
  const [streakClaimed, setStreakClaimed] = useState<boolean>(false);
  const [blockBonusClaimed, setBlockBonusClaimed] = useState<boolean>(false);
  const [referrals, setReferrals] = useState<number>(0);
  const [payoutCount, setPayoutCount] = useState<number>(0);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [adLoading, setAdLoading] = useState<boolean>(false);
  const [tapPopups, setTapPopups] = useState<{ id: number; x: number; y: number }[]>([]);

  const [activeModal, setActiveModal] = useState<"none" | "history" | "invite" | "wallet">("none");
  const [upiId, setUpiId] = useState<string>("");
  const [payoutMethod, setPayoutMethod] = useState<"UPI" | "Google Play">("UPI");
  const [withdrawMsg, setWithdrawMsg] = useState<string>("");

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
    }
    const tgUser = tg?.initDataUnsafe?.user;
    const uid = tgUser?.id
      ? String(tgUser.id)
      : "local_" + (localStorage.getItem("ttp_uid") || Math.floor(100000 + Math.random() * 900000));
    localStorage.setItem("ttp_uid", uid.replace("local_", ""));
    setUserId(uid);
    if (tgUser?.first_name) setUserName(tgUser.first_name);

    const startParam = tg?.initDataUnsafe?.start_param;
    initUserData(uid, tgUser?.first_name || "Gamer", startParam);
  }, []);

  const addHistory = (title: string, amount: string, currentList: HistoryItem[]) => {
    const entry: HistoryItem = {
      id: String(Date.now() + Math.random()),
      title,
      amount,
      date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    };
    return [entry, ...currentList].slice(0, 25);
  };

  const initUserData = async (uid: string, name: string, referrerId?: string) => {
    try {
      const res = await fetch(`${DB_BASE}/users/${uid}.json`);
      const data = await res.json();

      if (data && typeof data.balance === "number") {
        // Purane users ka balance (₹20+) 100% safe rahega
        setBalance(data.balance);
        setReferrals(data.referrals || 0);
        setStreakDays(data.streakDays || 0);
        setStreakClaimed(Boolean(data.streakClaimed));
        setBlockBonusClaimed(Boolean(data.blockBonusClaimed));
        setPayoutCount(data.payoutCount || 0);
        const existingHist: HistoryItem[] = Array.isArray(data.history) ? data.history : [];
        setHistoryList(existingHist);

        if (data.lastActiveDate === todayStr) {
          setEnergy(typeof data.energy === "number" ? data.energy : 1000);
          setAdsToday(data.adsToday || 0);
          setScratchesLeft(typeof data.scratchesLeft === "number" ? data.scratchesLeft : 5);
          setOffersLeft(typeof data.offersLeft === "number" ? data.offersLeft : 3);
        } else {
          setEnergy(1000);
          setAdsToday(0);
          setScratchesLeft(5);
          setOffersLeft(3);
        }

        // Cross-game Block Paisa 7-day auto-sync
        if (!data.blockBonusClaimed) {
          try {
            const bpRes = await fetch(`${DB_BASE}/blockpaisa_users/${uid}.json`);
            const bpData = await bpRes.json();
            if (bpData && bpData.streak5Paid === true) {
              const updatedBal = Number((data.balance + 5.0).toFixed(3));
              const updatedHist = addHistory("Block Paisa 7d Combo", "+₹5.00", existingHist);
              setBalance(updatedBal);
              setBlockBonusClaimed(true);
              setHistoryList(updatedHist);
              await fetch(`${DB_BASE}/users/${uid}.json`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  balance: updatedBal,
                  blockBonusClaimed: true,
                  history: updatedHist
                })
              });
              alert("🎉 Cross-Game Combo Bonus! You received +₹5.00 from Block Paisa!");
            }
          } catch {}
        }
      } else {
        // Naye users ko ₹15.00 Welcome Bonus milega
        const initialHist = addHistory("Welcome Bonus", "+₹15.00", []);
        const initialData = {
          userId: uid,
          name,
          balance: 15.0,
          energy: 1000,
          adsToday: 0,
          scratchesLeft: 5,
          offersLeft: 3,
          streakDays: 0,
          streakClaimed: false,
          blockBonusClaimed: false,
          referrals: 0,
          payoutCount: 0,
          history: initialHist,
          referredBy: referrerId && referrerId !== uid ? referrerId : "",
          lastActiveDate: todayStr,
          createdAt: Date.now()
        };
        await fetch(`${DB_BASE}/users/${uid}.json`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(initialData)
        });
        setBalance(15.0);
        setHistoryList(initialHist);
      }
    } catch {
      const saved = localStorage.getItem("ttp_backup_" + uid);
      if (saved) {
        const parsed = JSON.parse(saved);
        setBalance(parsed.balance ?? 15.0);
      }
    } finally {
      setIsLoaded(true);
    }
  };

  const syncToFirebase = async (patch: Record<string, unknown>) => {
    const payload = { ...patch, lastActiveDate: todayStr };
    try {
      await fetch(`${DB_BASE}/users/${userId}.json`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch {}
    localStorage.setItem("ttp_backup_" + userId, JSON.stringify({ balance, ...payload }));
  };

  const showRewardedAd = async (): Promise<boolean> => {
    setAdLoading(true);
    try {
      if (typeof window.show_12277677 === "function") {
        await window.show_12277677();
        return true;
      }
      await new Promise((r) => setTimeout(r, 1400));
      return true;
    } catch {
      alert("⚠️ Ad failed to load. Please check your connection and try again!");
      return false;
    } finally {
      setAdLoading(false);
    }
  };

  const handleTap = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (energy <= 0) {
      alert("⚡ Daily 1,000 energy finished! Come back tomorrow or watch ads.");
      return;
    }
    const newEnergy = energy - 1;
    const newBalance = Number((balance + 0.001).toFixed(3));
    setEnergy(newEnergy);
    setBalance(newBalance);

    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now() + Math.random();
    setTapPopups((prev) => [...prev.slice(-6), { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => {
      setTapPopups((prev) => prev.filter((p) => p.id !== id));
    }, 550);

    if (newEnergy % 20 === 0 || newEnergy === 0) {
      syncToFirebase({ balance: newBalance, energy: newEnergy });
    }
  };

  const handleWatchAd = async () => {
    if (adsToday >= 50) {
      alert("📺 Daily limit of 50 ads reached! Come back tomorrow.");
      return;
    }
    const ok = await showRewardedAd();
    if (!ok) return;

    const nextAds = adsToday + 1;
    let nextBalance = Number((balance + 0.015).toFixed(3));
    let nextStreak = streakDays;
    let nextStreakClaimed = streakClaimed;
    let nextHist = addHistory("Watched Ad", "+₹0.015", historyList);

    if (nextAds === 50 && streakDays < 7) {
      nextStreak = streakDays + 1;
      if (nextStreak === 7 && !streakClaimed) {
        nextBalance = Number((nextBalance + 3.0).toFixed(3));
        nextStreakClaimed = true;
        nextHist = addHistory("7-Day Streak Bonus", "+₹3.00", nextHist);
        alert("🔥 7-Day Streak Completed! You won +₹3.00 Bonus!");
      }
    }

    setAdsToday(nextAds);
    setBalance(nextBalance);
    setStreakDays(nextStreak);
    setStreakClaimed(nextStreakClaimed);
    setHistoryList(nextHist);

    await syncToFirebase({
      balance: nextBalance,
      adsToday: nextAds,
      streakDays: nextStreak,
      streakClaimed: nextStreakClaimed,
      history: nextHist
    });
  };

  const handleSponsorOffer = () => {
    if (offersLeft <= 0 || offerTimer > 0) return;

    let sec = 15;
    setOfferTimer(sec);
        const interval = setInterval(async () => {
      sec -= 1;
      setOfferTimer(sec);
      if (sec <= 0) {
        clearInterval(interval);
        const nextOffers = offersLeft - 1;
                const nextBalance = Number((balance + 0.15).toFixed(3));
        const nextHist = addHistory("Sponsor Offer Bonus", "+₹0.15", historyList);

        setOffersLeft(nextOffers);
        setBalance(nextBalance);
        setHistoryList(nextHist);
        alert("🎯 Sponsor Offer Completed! +₹0.15 added to your wallet!");

        await syncToFirebase({
          balance: nextBalance,
          offersLeft: nextOffers,
          history: nextHist
        });
      }
    }, 1000);
  };

  const handleScratchCard = async () => {
    if (scratchesLeft <= 0) {
      alert("🎁 All 5 daily scratch cards used! Come back tomorrow.");
      return;
    }
    const ok = await showRewardedAd();
    if (!ok) return;

    const reward = Number((0.05 + Math.random() * 0.2).toFixed(2));
    const nextScratches = scratchesLeft - 1;
    const nextBalance = Number((balance + reward).toFixed(3));
    const nextHist = addHistory("Mystery Scratch Card", `+₹${reward.toFixed(2)}`, historyList);

    setScratchesLeft(nextScratches);
    setBalance(nextBalance);
    setHistoryList(nextHist);
    alert(`🎉 Scratch Card Won: +₹${reward.toFixed(2)}!`);

    await syncToFirebase({
      balance: nextBalance,
      scratchesLeft: nextScratches,
      history: nextHist
    });
  };

  const handleWithdraw = async () => {
    setWithdrawMsg("");
    if (balance < 50) {
      setWithdrawMsg("❌ Insufficient balance! Minimum withdrawal is ₹50.00.");
      return;
    }
    if (referrals < 2) {
      setWithdrawMsg("❌ At least 2 active referrals are required to withdraw!");
      return;
    }
    if (!upiId.trim()) {
      setWithdrawMsg("❌ Please enter your UPI ID, Email, or Telegram @username!");
      return;
    }

    const remaining = Number((balance - 50).toFixed(3));
    const loyalty = payoutCount === 0 ? 10.0 : 0;
    const finalBalance = Number((remaining + loyalty).toFixed(3));
    const nextPayoutCount = payoutCount + 1;

    let nextHist = addHistory(`Withdraw (${payoutMethod})`, "-₹50.00", historyList);
    if (loyalty > 0) {
      nextHist = addHistory("Loyalty Cashback", "+₹10.00", nextHist);
    }

    setBalance(finalBalance);
    setPayoutCount(nextPayoutCount);
    setHistoryList(nextHist);

    await syncToFirebase({
      balance: finalBalance,
      payoutCount: nextPayoutCount,
      history: nextHist
    });

    await fetch(`${DB_BASE}/withdrawals.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        userName,
        amount: 50,
        method: payoutMethod,
        details: upiId.trim(),
        referrals,
        status: "pending",
        timestamp: Date.now()
      })
    });

    setUpiId("");
    setWithdrawMsg(
      loyalty > 0
        ? "✅ ₹50 Withdrawal Submitted! +₹10.00 Loyalty Cashback added!"
        : "✅ ₹50 Withdrawal Submitted! Processing takes 48–72 hours."
    );
  };

  const inviteLink = `https://t.me{BOT_USERNAME}?start=${userId}`;
  const energyPct = Math.max(0, Math.min(100, (energy / 1000) * 100));

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#0c0d10] text-white flex items-center justify-center">
        <p className="text-amber-400 font-bold tracking-wider">LOADING TAP TO PAISA...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0d10] text-white flex flex-col justify-between max-w-md mx-auto px-5 py-6 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="bg-[#18191e] border border-amber-500/40 rounded-full px-3.5 py-1.5 flex items-center gap-1.5 text-sm font-bold text-amber-300">
          <span>🔥</span>
          <span>{streakDays}/7d</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setActiveModal("history")}
            className="bg-[#18191e] border border-white/10 hover:border-amber-400/50 rounded-full px-4 py-1.5 text-sm font-semibold text-gray-200 flex items-center gap-1.5"
          >
            <span>📜</span>
            <span>History</span>
          </button>

          <a
            href="https://t.me"
            target="_blank"
            rel="noreferrer"
            className="w-9 h-9 rounded-full bg-[#18191e] border border-white/10 hover:border-amber-400/50 flex items-center justify-center text-gray-300"
            title="Customer Support"
          >
            🎧
          </a>
        </div>
      </div>

      {/* Balance, Ads Counter & Sponsor Offer Pill */}
      <div className="text-center mt-3">
        <h1 className="text-5xl font-extrabold tracking-tight text-white">
          ₹{balance.toFixed(3)}
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
          <div className="inline-flex items-center gap-1.5 bg-[#18191e] border border-white/10 rounded-full px-3.5 py-1.5 text-xs font-semibold text-gray-300">
            <span>📺</span>
            <span>Ads Today: {adsToday} / 50</span>
          </div>

                {offersLeft > 0 && offerTimer === 0 ? (
            <a
              href={DIRECT_LINK_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleSponsorOffer}
              className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/50 hover:bg-amber-500/25 rounded-full px-3.5 py-1.5 text-xs font-bold text-amber-300"
            >
              <span>🎯</span>
              <span>Sponsor Offer +₹0.15 ({offersLeft}/3)</span>
            </a>
          ) : (
            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 opacity-60 rounded-full px-3.5 py-1.5 text-xs font-bold text-amber-300">
              <span>🎯</span>
              <span>
                {offerTimer > 0
                  ? `Explore ${offerTimer}s...`
                  : "Sponsor Offer Done (0/3)"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sleek Dark-Gold Ring Tap Button */}
      <div className="flex justify-center my-4">
        <div className="relative">
          <button
            onClick={handleTap}
            className="w-64 h-64 rounded-full bg-[#111216] border-[4px] border-amber-500/80 shadow-[0_0_40px_rgba(245,158,11,0.18)] active:scale-95 transition-transform flex flex-col items-center justify-center"
          >
            <span className="text-2xl font-extrabold tracking-wider text-amber-400">
              TAP COIN
            </span>
            <span className="text-xs text-gray-400 mt-1.5 font-medium">
              +₹0.001 / tap
            </span>
          </button>

          {tapPopups.map((p) => (
            <span
              key={p.id}
              style={{ left: p.x, top: p.y }}
              className="pointer-events-none absolute text-amber-300 font-bold text-sm animate-ping"
            >
              +₹0.001
            </span>
          ))}
        </div>
      </div>

      {/* Energy Bar + Bottom 4-Icon Dock */}
      <div>
        <div className="flex items-center justify-between text-xs font-semibold mb-2">
          <span className="text-amber-400 flex items-center gap-1">
            ⚡ <span className="text-gray-200">Energy</span>
          </span>
          <span className="text-gray-300">{energy} / 1000</span>
        </div>

        <div className="w-full h-2.5 bg-[#1b1c22] rounded-full overflow-hidden mb-5">
          <div
            style={{ width: `${energyPct}%` }}
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-150"
          />
        </div>

        {/* Bottom Dock */}
        <div className="bg-[#16171c] border border-white/10 rounded-2xl p-3 grid grid-cols-4 gap-2 text-center">
          <button
            disabled={adLoading || adsToday >= 50}
            onClick={handleWatchAd}
            className="flex flex-col items-center justify-center py-1.5 rounded-xl hover:bg-white/5 disabled:opacity-50"
          >
            <span className="text-xl mb-1">📺</span>
            <span className="text-[11px] font-semibold text-amber-300 leading-tight">
              {adLoading ? "Wait..." : "Watch Ad"}
            </span>
          </button>

          <button
            disabled={adLoading || scratchesLeft <= 0}
            onClick={handleScratchCard}
            className="flex flex-col items-center justify-center py-1.5 rounded-xl hover:bg-white/5 disabled:opacity-50"
          >
            <span className="text-xl mb-1">🎁</span>
            <span className="text-[11px] font-semibold text-amber-300 leading-tight">
              Scratch ({scratchesLeft})
            </span>
          </button>

          <button
            onClick={() => setActiveModal("invite")}
            className="flex flex-col items-center justify-center py-1.5 rounded-xl hover:bg-white/5"
          >
            <span className="text-xl mb-1">👥</span>
            <span className="text-[11px] font-semibold text-amber-300 leading-tight">
              Invite ({referrals}/2)
            </span>
          </button>

          <button
            onClick={() => {
              setWithdrawMsg("");
              setActiveModal("wallet");
            }}
            className="flex flex-col items-center justify-center py-1.5 rounded-xl hover:bg-white/5"
          >
            <span className="text-xl mb-1">💳</span>
            <span className="text-[11px] font-semibold text-amber-300 leading-tight">
              Wallet
            </span>
          </button>
        </div>
      </div>

      {/* History Modal */}
      {activeModal === "history" && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#16171c] border border-white/15 rounded-2xl w-full max-w-sm p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-amber-400">📜 Activity History</h2>
              <button onClick={() => setActiveModal("none")} className="text-gray-400 text-lg">
                ✕
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
              {historyList.length === 0 ? (
                  <p className="text-gray-400 text-center py-6">No recent transactions yet.</p>
              ) : (
                historyList.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-[#0c0d10] p-2.5 rounded-xl border border-white/5"
                  >
                    <div>
                      <p className="font-semibold text-gray-200">{item.title}</p>
                      <p className="text-[10px] text-gray-500">{item.date}</p>
                    </div>
                    <span
                      className={`font-bold ${
                        item.amount.startsWith("-") ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {item.amount}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {activeModal === "invite" && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#16171c] border border-white/15 rounded-2xl w-full max-w-sm p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-amber-400">👥 Invite & Earn ₹3.00</h2>
              <button onClick={() => setActiveModal("none")} className="text-gray-400 text-lg">
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Earn <b>₹3.00 Bonus</b> for every friend who joins via your link and completes a 7-Day Streak!
            </p>
            <div className="mt-3 p-2.5 bg-[#0c0d10] rounded-xl border border-white/10 text-xs break-all text-amber-300">
              {inviteLink}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteLink);
                alert("✅ Invite link copied!");
              }}
              className="w-full mt-3 bg-amber-500 text-black font-bold py-2.5 rounded-xl text-sm"
            >
              Copy Invite Link
            </button>

            <div className="mt-4 pt-3 border-t border-white/10">
              <p className="text-xs text-gray-300">
                🧱 Play <b>Block Paisa</b> for 7 days & get <b>+₹5.00 Combo Bonus</b>:
              </p>
              <a
                href={`https://t.me{userId}`}
                target="_blank"
                rel="noreferrer"
                className="block text-center mt-2 bg-indigo-600 text-white font-bold py-2 rounded-xl text-xs"
              >
                Open Block Paisa ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      {activeModal === "wallet" && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-[#16171c] border border-white/15 rounded-2xl w-full max-w-sm p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-amber-400">💳 Withdraw Earnings</h2>
              <button onClick={() => setActiveModal("none")} className="text-gray-400 text-lg">
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-400">
              Min Withdrawal: <b>₹50.00</b> • Requires <b>2 Active Referrals</b> • +₹10 Loyalty Cashback after 1st payout!
            </p>

            <div className="flex gap-2 mt-3">
              {(["UPI", "Google Play"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setPayoutMethod(m)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                    payoutMethod === m
                      ? "bg-amber-500 text-black border-amber-400"
                      : "bg-[#0c0d10] text-gray-300 border-white/10"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder={
                payoutMethod === "UPI"
                  ? "Enter UPI ID (e.g. name@upi)"
                  : "Enter Email or Telegram @username"
              }
              className="w-full mt-3 bg-[#0c0d10] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white"
            />

            <button
              onClick={handleWithdraw}
              className="w-full mt-3 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 rounded-xl text-sm"
            >
              Withdraw ₹50.00
            </button>

            {withdrawMsg && <p className="mt-3 text-xs text-amber-300 font-semibold">{withdrawMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
