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

      
