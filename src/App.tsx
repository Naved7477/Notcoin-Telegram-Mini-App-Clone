import { useEffect, useMemo, useState } from "react";

const APP_VERSION = "1.0.1";
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

type User = {
  id: number;
  telegramId: string;
  username: string;
  firstName: string;
  balanceCents: number;
  points: number;
  energy: number;
  tapLevel: number;
  energyLevel: number;
  adsWatchedToday: number;
  rank: string;
  rankIndex: number;
};

type Transaction = {
  id: number;
  type: string;
  amountCents: number;
  pointsDelta: number;
  status: string;
  reference: string | null;
  createdAt: string;
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        expand: () => void;
        initData: string;
        initDataUnsafe?: {
          user?: {
            id: number;
            username?: string;
            first_name?: string;
          };
        };
        showAlert?: (message: string) => void;
      };
    };
  }
}

function money(cents: number) {
  return `₹${(cents / 100).toFixed(2)}`;
}

function getTelegramInitData() {
  return window.Telegram?.WebApp?.initData || "";
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const initData = getTelegramInitData();

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": initData,
      ...(options.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Something went wrong");
  }

  return data;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [showRank, setShowRank] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [upi, setUpi] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const [tapLoading, setTapLoading] = useState(false);
  const [adLoading, setAdLoading] = useState(false);

  const [floatingCoins, setFloatingCoins] = useState<
    { id: number; text: string }[]
  >([]);

  const ranks = [
    "BRONZE",
    "SILVER",
    "GOLD",
    "PLATINUM",
    "DIAMOND",
    "MASTER",
  ];

  const nextRank = useMemo(() => {
    if (!user) return null;

    const nextIndex = user.rankIndex + 1;

    if (nextIndex >= ranks.length) {
      return null;
    }

    return {
      name: ranks[nextIndex],
      pointsNeeded: Math.max(0, (nextIndex * 100) - user.points),
    };
  }, [user]);

  useEffect(() => {
    const telegram = window.Telegram?.WebApp;

    if (telegram) {
      telegram.ready();
      telegram.expand();
    }

    loadUser();

    const hasSeenVersion = localStorage.getItem("app_version");

    if (hasSeenVersion !== APP_VERSION) {
      setShowUpdate(true);
      localStorage.setItem("app_version", APP_VERSION);
    }
  }, []);

  async function loadUser() {
    try {
      setLoading(true);

      const data = await api<{ user: User }>("/api/me");

      setUser(data.user);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load account"
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadTransactions() {
    try {
      const data = await api<{ transactions: Transaction[] }>(
        "/api/transactions"
      );

      setTransactions(data.transactions);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load history"
      );
    }
  }

  async function handleTap() {
    if (!user || tapLoading) return;

    if (user.energy <= 0) {
      setMessage("⚡ Energy khatam hai.");
      return;
    }

    try {
      setTapLoading(true);

      const data = await api<{ user: User }>("/api/tap", {
        method: "POST",
      });

      setUser(data.user);

      const id = Date.now();

      setFloatingCoins((old) => [...old, { id, text: "+₹0.01" }]);

      setTimeout(() => {
        setFloatingCoins((old) => old.filter((item) => item.id !== id));
      }, 900);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Tap failed"
      );
    } finally {
      setTapLoading(false);
    }
  }

  async function handleAd() {
    if (!user || adLoading) return;

    if (user.adsWatchedToday >= 100) {
      setMessage("Aaj ke 100 ads complete ho gaye.");
      return;
    }

    /*
      IMPORTANT:
      Yahan actual rewarded-ad provider connect karna hoga.

      Reward tabhi backend ko bhejna hai jab ad provider
      successful completion confirm kare.

      Example:
      const adSessionId = await yourAdProvider.showRewardedAd();

      Then:
      POST /api/ads/reward
    */

    try {
      setAdLoading(true);

      setMessage(
        "Rewarded ad provider abhi connect nahi hai. Ad complete hone ke baad hi ₹0.25 milega."
      );

      /*
      Example backend call after VERIFIED ad completion:

      const adSessionId = "provider-generated-session-id";

      const data = await api<{ user: User }>("/api/ads/reward", {
        method: "POST",
        body: JSON.stringify({
          adSessionId,
        }),
      });

      setUser(data.user);
      */

    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Ad failed"
      );
    } finally {
      setAdLoading(false);
    }
  }

  async function openHistory() {
    await loadTransactions();
    setShowHistory(true);
  }

  async function handleWithdraw() {
    if (!user) return;

    const amount = Number(withdrawAmount);

    if (!amount || amount < 50) {
      setMessage("Minimum withdrawal ₹50 hai.");
      return;
    }

    if (!upi.trim()) {
      setMessage("UPI ID enter karo.");
      return;
    }

    if (amount * 100 > user.balanceCents) {
      setMessage("Balance insufficient hai.");
      return;
    }

    try {
      setWithdrawLoading(true);

      await api("/api/withdrawals", {
        method: "POST",
        body: JSON.stringify({
          amountCents: Math.round(amount * 100),
          upi: upi.trim(),
        }),
      });

      setWithdrawAmount("");
      setUpi("");
      setShowWithdraw(false);

      setMessage(
        "✅ Withdrawal request submit ho gayi. Admin ko notification bhej diya gaya hai."
      );

      await loadUser();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Withdrawal failed"
      );
    } finally {
      setWithdrawLoading(false);
    }
  }

  function closeMessage() {
    setMessage("");
  }

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="loader">LOADING...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app loading-screen">
        <div className="error-box">
          <h2>Unable to load game</h2>

          <p>{message || "Please open the game from Telegram."}</p>

          <button onClick={loadUser}>RETRY</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* TOP BAR */}

      <header className="topbar">
        <button
          className="rank-button"
          onClick={() => setShowRank(true)}
        >
          <span className="rank-icon">🏆</span>

          <span>
            <small>RANK</small>
            <strong>{user.rank}</strong>
          </span>
        </button>

        <div className="logo">
          <span>TAP</span>
          <b>2</b>
          <span>PAISA</span>
        </div>

        <button
          className="bell-button"
          onClick={openHistory}
          aria-label="Transaction history"
        >
          🔔
        </button>
      </header>

      {/* BALANCE */}

      <section className="balance-card">
        <div className="balance-label">YOUR BALANCE</div>

        <div className="balance">
          {money(user.balanceCents)}
        </div>

        <div className="points">
          ⭐ {user.points} POINTS
        </div>
      </section>

      {/* ENERGY */}

      <section className="energy-section">
        <div className="energy-row">
          <span>⚡ ENERGY</span>

          <strong>{user.energy}</strong>
        </div>

        <div className="energy-bar">
          <div
            className="energy-fill"
            style={{
              width: `${Math.min(
                100,
                Math.max(0, user.energy)
              )}%`,
            }}
          />
        </div>
      </section>

      {/* TAP AREA */}

      <main className="game-area">
        <div className="floating-container">
          {floatingCoins.map((coin) => (
            <div key={coin.id} className="floating-coin">
              {coin.text}
            </div>
          ))}
        </div>

        <button
          className="tap-button"
          onClick={handleTap}
          disabled={tapLoading || user.energy <= 0}
        >
          <span className="coin-symbol">₹</span>

          <span className="tap-text">TAP</span>

          <small>+₹0.01</small>
        </button>

        <div className="tap-info">
          Tap karke ₹0.01 earn karo
        </div>
      </main>

      {/* ADS */}

      <section className="ads-card">
        <div className="ads-header">
          <div>
            <strong>🎬 WATCH ADS</strong>

            <span>Earn ₹0.25 per verified ad</span>
          </div>

          <div className="ads-count">
            {user.adsWatchedToday}/100
          </div>
        </div>

        <div className="ads-progress">
          <div
            style={{
              width: `${Math.min(
                100,
                (user.adsWatchedToday / 100) * 100
              )}%`,
            }}
          />
        </div>

        <button
          className="watch-ad-button"
          onClick={handleAd}
          disabled={
            adLoading || user.adsWatchedToday >= 100
          }
        >
          {adLoading ? "LOADING..." : "WATCH AD +₹0.25"}
        </button>
      </section>

      {/* NEXT RANK */}

      <section className="rank-progress-card">
        <div className="rank-progress-header">
          <span>
            🏆 {user.rank}
          </span>

          {nextRank ? (
            <span>
              {nextRank.pointsNeeded} points to {nextRank.name}
            </span>
          ) : (
            <span>MAX RANK</span>
          )}
        </div>

        <div className="rank-progress">
          <div
            style={{
              width: `${Math.min(
                100,
                ((user.points % 100) / 100) * 100
              )}%`,
            }}
          />
        </div>

        <p>
          Every 100 points = next rank + ₹20 bonus
        </p>
      </section>

      {/* ACTION BUTTONS */}

      <section className="actions">
        <button
          className="action-button withdraw"
          onClick={() => setShowWithdraw(true)}
        >
          <span>💸</span>
          <strong>WITHDRAW</strong>
          <small>Minimum ₹50</small>
        </button>

        <button
          className="action-button"
          onClick={openHistory}
        >
          <span>📜</span>
          <strong>HISTORY</strong>
          <small>Transactions</small>
        </button>

        <button
          className="action-button"
          onClick={() => setShowShop(true)}
        >
          <span>🛒</span>
          <strong>SHOP</strong>
          <small>Upgrade</small>
        </button>
      </section>

      {/* USER INFO */}

      <footer className="footer">
        <div>
          👤 {user.firstName || user.username || "Player"}
        </div>

        <div>v{APP_VERSION}</div>
      </footer>

      {/* MESSAGE */}

      {message && (
        <div className="message-overlay">
          <div className="message-box">
            <p>{message}</p>

            <button onClick={closeMessage}>OK</button>
          </div>
        </div>
      )}

      {/* RANK MODAL */}

      {showRank && (
        <div
          className="modal-overlay"
          onClick={() => setShowRank(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowRank(false)}
            >
              ×
            </button>

            <h2>🏆 RANK SYSTEM</h2>

            <p className="modal-subtitle">
              Har 100 points par next rank.
            </p>

            <div className="rank-list">
              {ranks.map((rank, index) => {
                const unlocked =
                  user.rankIndex >= index;

                return (
                  <div
                    key={rank}
                    className={`rank-item ${
                      unlocked ? "unlocked" : "locked"
                    } ${
                      user.rank === rank ? "current" : ""
                    }`}
                  >
                    <div className="rank-number">
                      {index === 0
                        ? "🥉"
                        : index === 1
                        ? "🥈"
                        : index === 2
                        ? "🥇"
                        : index === 3
                        ? "💎"
                        : index === 4
                        ? "💠"
                        : "👑"}
                    </div>

                    <div className="rank-name">
                      <strong>{rank}</strong>

                      <small>
                        {index * 100} points
                      </small>
                    </div>

                    <div className="rank-bonus">
                      +₹20
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}

      {showHistory && (
        <div
          className="modal-overlay"
          onClick={() => setShowHistory(false)}
        >
          <div
            className="modal history-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowHistory(false)}
            >
              ×
            </button>

            <h2>📜 TRANSACTION HISTORY</h2>

            {transactions.length === 0 ? (
              <div className="empty-history">
                No transactions yet.
              </div>
            ) : (
              <div className="transaction-list">
                {transactions.map((tx) => (
                  <div
                    className="transaction"
                    key={tx.id}
                  >
                    <div className="transaction-icon">
                      {tx.type === "tap"
                        ? "👆"
                        : tx.type === "ad_reward"
                        ? "🎬"
                        : tx.type === "rank_bonus"
                        ? "🏆"
                        : tx.type === "withdrawal"
                        ? "💸"
                        : "💰"}
                    </div>

                    <div className="transaction-info">
                      <strong>
                        {formatTransactionType(tx.type)}
                      </strong>

                      <small>
                        {formatDate(tx.createdAt)}
                      </small>
                    </div>

                    <div
                      className={`transaction-amount ${
                        tx.amountCents >= 0
                          ? "positive"
                          : "negative"
                      }`}
                    >
                      {tx.amountCents >= 0
                        ? "+"
                        : ""}
                      {money(Math.abs(tx.amountCents))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* WITHDRAW MODAL */}

      {showWithdraw && (
        <div
          className="modal-overlay"
          onClick={() => setShowWithdraw(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowWithdraw(false)}
            >
              ×
            </button>

            <h2>💸 WITHDRAW</h2>

            <div className="withdraw-balance">
              Available:{" "}
              <strong>{money(user.balanceCents)}</strong>
            </div>

            <label>Amount</label>

            <div className="input-with-prefix">
              <span>₹</span>

              <input
                type="number"
                min="50"
                step="1"
                placeholder="Minimum 50"
                value={withdrawAmount}
                onChange={(e) =>
                  setWithdrawAmount(e.target.value)
                }
              />
            </div>

            <label>UPI ID</label>

            <input
              className="text-input"
              type="text"
              placeholder="example@upi"
              value={upi}
              onChange={(e) => setUpi(e.target.value)}
            />

            <div className="withdraw-note">
              <strong>Minimum withdrawal: ₹50</strong>

              <p>
                Request submit hone ke baad admin ko
                Telegram notification jayega.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={handleWithdraw}
              disabled={withdrawLoading}
            >
              {withdrawLoading
                ? "SUBMITTING..."
                : "REQUEST WITHDRAWAL"}
            </button>
          </div>
        </div>
      )}

      {/* SHOP MODAL */}

      {showShop && (
        <div
          className="modal-overlay"
          onClick={() => setShowShop(false)}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowShop(false)}
            >
              ×
            </button>

            <h2>🛒 SHOP</h2>

            <div className="shop-item">
              <div>
                <strong>⚡ Energy Level</strong>

                <small>
                  Current Level: {user.energyLevel}
                </small>
              </div>

              <button disabled>
                COMING SOON
              </button>
            </div>

            <div className="shop-item">
              <div>
                <strong>👆 Tap Level</strong>

                <small>
                  Current Level: {user.tapLevel}
                </small>
              </div>

              <button disabled>
                COMING SOON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE MODAL */}

      {showUpdate && (
        <div className="modal-overlay">
          <div className="modal update-modal">
            <div className="update-icon">🚀</div>

            <h2>NEW UPDATE</h2>

            <p>
              Version {APP_VERSION} is now available.
            </p>

            <div className="update-list">
              <div>✅ Tap reward ₹0.01</div>
              <div>✅ Verified ad reward ₹0.25</div>
              <div>✅ Maximum 100 ads/day</