import React, { useState, useEffect } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
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
const BOT_USERNAME = "TapToPaisa_Official_bot";

export default function App() {
  const [userId, setUserId] = useState<string>("guest_user");
  const [userName, setUserName] = useState<string>("Gamer");
  const [balance, setBalance] = useState<number>(15.0);
  const [energy, setEnergy] = useState<number>(1000);
  const [adsToday, setAdsToday] = useState<number>(0);
  const [scratchesLeft, setScratchesLeft] = useState<number>(5);
  const [streakDays, setStreakDays] = useState<number>(0);
  const [streakClaimed, setStreakClaimed] = useState<boolean>(false);
  const [blockBonusClaimed, setBlockBonusClaimed] = useState<boolean>(false);
  const [referrals, setReferrals] = useState<number>(0);
  const [payoutCount, setPayoutCount] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [adLoading, setAdLoading] = useState<boolean>(false);
  const [tapPopups, setTapPopups] = useState<{ id: number; x: number; y: number }[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "tasks" | "invite" | "wallet">("home");
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
    const uid = tgUser?.id ? String(tgUser.id) : "local_" + (localStorage.getItem("ttp_uid") || Math.floor(100000 + Math.random() * 900000));
    localStorage.setItem("ttp_uid", uid.replace("local_", ""));
    setUserId(uid);
    if (tgUser?.first_name) setUserName(tgUser.first_name);

    const startParam = tg?.initDataUnsafe?.start_param;
    initUserData(uid, tgUser?.first_name || "Gamer", startParam);
  }, []);

  const initUserData = async (uid: string, name: string, referrerId?: string) => {
    try {
      const res = await fetch(`${DB_BASE}/users/${uid}.json`);
      const data = await res.json();

      if (data && typeof data.balance === "number") {
        // Purane users ka balance (e.g. ₹20) bilkul safe rahega!
        setBalance(data.balance);
        setReferrals(data.referrals || 0);
        setStreakDays(data.streakDays || 0);
        setStreakClaimed(Boolean(data.streakClaimed));
        setBlockBonusClaimed(Boolean(data.blockBonusClaimed));
        setPayoutCount(data.payoutCount || 0);

        if (data.lastActiveDate === todayStr) {
          setEnergy(typeof data.energy === "number" ? data.energy : 1000);
          setAdsToday(data.adsToday || 0);
          setScratchesLeft(typeof data.scratchesLeft === "number" ? data.scratchesLeft : 5);
        } else {
          setEnergy(1000);
          setAdsToday(0);
          setScratchesLeft(5);
        }

        // Check Block Paisa 7-day combo bonus auto-sync
        if (!data.blockBonusClaimed) {
          try {
            const bpRes = await fetch(`${DB_BASE}/blockpaisa_users/${uid}.json`);
            const bpData = await bpRes.json();
            if (bpData && bpData.streak5Paid === true) {
              const updatedBal = Number((data.balance + 5.0).toFixed(3));
              setBalance(updatedBal);
              setBlockBonusClaimed(true);
              await fetch(`${DB_BASE}/users/${uid}.json`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ balance: updatedBal, blockBonusClaimed: true })
              });
              alert("🎉 Cross-Game Combo Bonus! You received +₹5.00 from Block Paisa!");
            }
          } catch {}
        }
      } else {
        // Naye users ko ₹15.00 Welcome Bonus milega
        const initialData = {
          userId: uid,
          name,
          balance: 15.0,
          energy: 1000,
          adsToday: 0,
          scratchesLeft: 5,
          streakDays: 0,
          streakClaimed: false,
          blockBonusClaimed: false,
          referrals: 0,
          payoutCount: 0,
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
      await new Promise((r) => setTimeout(r, 1500));
      return true;
    } catch {
      alert("⚠️ Ad failed to load. Please check your internet and try again!");
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
    }, 600);

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

    if (nextAds === 50 && streakDays < 7) {
      nextStreak = streakDays + 1;
      if (nextStreak === 7 && !streakClaimed) {
        nextBalance = Number((nextBalance + 3.0).toFixed(3));
        nextStreakClaimed = true;
        alert("🔥 7-Day Streak Completed! You won +₹3.00 Bonus!");
      }
    }

    setAdsToday(nextAds);
    setBalance(nextBalance);
    setStreakDays(nextStreak);
    setStreakClaimed(nextStreakClaimed);

    await syncToFirebase({
      balance: nextBalance,
      adsToday: nextAds,
      streakDays: nextStreak,
      streakClaimed: nextStreakClaimed
    });
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

    setScratchesLeft(nextScratches);
    setBalance(nextBalance);
    alert(`🎉 Scratch Card Won: +₹${reward.toFixed(2)}!`);

    await syncToFirebase({
      balance: nextBalance,
      scratchesLeft: nextScratches
    });
  };

  const handleWithdraw = async () => {
    setWithdrawMsg("");
    if (balance < 50) {
      setWithdrawMsg("❌ Minimum withdrawal is ₹50.00!");
      return;
    }
    if (referrals < 2) {
      setWithdrawMsg("❌ At least 2 active referrals are required to withdraw!");
      return;
    }
    if (!upiId.trim()) {
      setWithdrawMsg("❌ Please enter your UPI ID or Email for Google Play code!");
      return;
    }

    const remaining = Number((balance - 50).toFixed(3));
    const loyalty = payoutCount === 0 ? 10.0 : 0;
    const finalBalance = Number((remaining + loyalty).toFixed(3));
    const nextPayoutCount = payoutCount + 1;

    setBalance(finalBalance);
    setPayoutCount(nextPayoutCount);

    await syncToFirebase({
      balance: finalBalance,
      payoutCount: nextPayoutCount
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
        ? "✅ ₹50 Withdrawal Submitted! +₹10.00 Loyalty Cashback added to your wallet!"
        : "✅ ₹50 Withdrawal Submitted! Processing takes 48–72 hours."
    );
  };
  const inviteLink = `https://t.me{BOT_USERNAME}?start=${userId}`;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">🪙</div>
          <p className="text-amber-400 font-bold">Loading Tap To Paisa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between max-w-md mx-auto pb-20">
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">Welcome, {userName}</p>
          <h1 className="text-2xl font-extrabold text-amber-400">₹{balance.toFixed(3)}</h1>
        </div>
        <div className="text-right">
          <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full font-semibold">
            🔥 Streak: {streakDays}/7d
          </span>
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-center">
        {activeTab === "home" && (
          <div className="flex flex-col items-center">
            <div className="mb-4 text-center">
              <p className="text-sm text-slate-300">Tap Coin to Earn (+₹0.001/tap)</p>
              <p className="text-xs text-amber-400 font-semibold mt-1">⚡ Energy: {energy} / 1,000</p>
            </div>
            <div className="relative my-4">
              <button
                onClick={handleTap}
                className="w-52 h-52 rounded-full bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-[0_0_45px_rgba(245,158,11,0.45)] border-4 border-amber-200 flex items-center justify-center active:scale-95 transition-transform select-none"
              >
                <span className="text-7xl">🪙</span>
              </button>
              {tapPopups.map((p) => (
                <span
                  key={p.id}
                  style={{ left: p.x, top: p.y }}
                  className="pointer-events-none absolute text-amber-300 font-extrabold text-sm animate-ping"
                >
                  +₹0.001
                </span>
              ))}
            </div>

            <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 mt-4 text-xs text-slate-300 flex justify-between">
              <span>📺 Ads Today: {adsToday}/50</span>
              <span>🎁 Scratch Left: {scratchesLeft}/5</span>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-amber-400">Daily Earning Tasks</h2>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold">📺 Watch Short Ad</h3>
                <p className="text-xs text-slate-400">+₹0.015 per ad ({adsToday}/50 today)</p>
              </div>
              <button
                disabled={adLoading || adsToday >= 50}
                onClick={handleWatchAd}
                className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm"
              >
                {adLoading ? "Loading..." : "+₹0.015"}
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold">🎁 Mystery Scratch Card</h3>
                <p className="text-xs text-slate-400">Win up to ₹0.25 ({scratchesLeft}/5 left)</p>
              </div>
              <button
                disabled={adLoading || scratchesLeft <= 0}
                onClick={handleScratchCard}
                className="bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm"
              >
                {adLoading ? "Loading..." : "Scratch"}
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h3 className="font-bold text-amber-300">🧱 Cross-Game Combo (+₹5.00)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Play <b>Block Paisa</b> for 7 days and get +₹5.00 auto-added to your wallet!
              </p>
              <a
                href={`https://t.me{userId}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl"
              >
                Play Block Paisa ↗
              </a>
            </div>
          </div>
        )}

        {activeTab === "invite" && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h2 className="text-lg font-bold text-amber-400">👥 Invite & Earn ₹3.00</h2>
              <p className="text-xs text-slate-300 mt-1">
                Earn <b>₹3.00 Bonus</b> for every friend who joins via your link and completes a 7-Day Streak!
              </p>
              <div className="mt-3 p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs break-all text-amber-300">
                {inviteLink}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  alert("✅ Invite link copied!");
                }}
                className="w-full mt-3 bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl text-sm"
              >
                Copy Invite Link
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center">
              <span className="text-sm text-slate-300">Active Referrals</span>
              <span className="text-lg font-extrabold text-emerald-400">{referrals} / 2</span>
            </div>
          </div>
        )}

        {activeTab === "wallet" && (
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h2 className="text-lg font-bold text-amber-400">💸 Withdraw Earnings</h2>
              <p className="text-xs text-slate-400 mt-1">
                Min Withdrawal: <b>₹50.00</b> • Requires <b>2 Active Referrals</b> • +₹10 Loyalty Cashback after 1st payout!
              </p>

              <div className="flex gap-2 mt-3">
                {(["UPI", "Google Play"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPayoutMethod(m)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                      payoutMethod === m
                        ? "bg-amber-500 text-slate-950 border-amber-400"
                        : "bg-slate-950 text-slate-300 border-slate-800"
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
                placeholder={payoutMethod === "UPI" ? "Enter UPI ID (e.g. name@upi)" : "Enter Gmail for Play Code"}
                className="w-full mt-3 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white"
              />

              <button
                onClick={handleWithdraw}
                className="w-full mt-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-sm"
              >
                Withdraw ₹50.00
              </button>

              {withdrawMsg && <p className="mt-3 text-xs text-amber-300 font-semibold">{withdrawMsg}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-slate-900 border-t border-slate-800 grid grid-cols-4 py-2 text-xs">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center ${activeTab === "home" ? "text-amber-400 font-bold" : "text-slate-400"}`}
        >
          <span>🪙</span>
          <span>Tap</span>
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={`flex flex-col items-center ${activeTab === "tasks" ? "text-amber-400 font-bold" : "text-slate-400"}`}
        >
          <span>📺</span>
          <span>Tasks</span>
        </button>
        <button
          onClick={() => setActiveTab("invite")}
          className={`flex flex-col items-center ${activeTab === "invite" ? "text-amber-400 font-bold" : "text-slate-400"}`}
        >
          <span>👥</span>
          <span>Invite</span>
        </button>
        <button
          onClick={() => setActiveTab("wallet")}
          className={`flex flex-col items-center ${activeTab === "wallet" ? "text-amber-400 font-bold" : "text-slate-400"}`}
        >
          <span>💸</span>
          <span>Wallet</span>
        </button>
      </div>
    </div>
  );
}

      
