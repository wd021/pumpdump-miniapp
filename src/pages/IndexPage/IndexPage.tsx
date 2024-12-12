import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  History,
  X,
  Info,
  Crown,
  AlertCircle,
  ExternalLink,
  User,
} from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import {
  TonConnectButton,
  useTonConnectUI,
  useTonAddress,
} from "@tonconnect/ui-react";
import { publicUrl } from "@/helpers/publicUrl.ts";

interface PredictionPeriod {
  id: number;
  asset_id: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  buy_in: number;
  total_pool: number;
  current_price: number;
  current_high: number;
  current_low: number;
  final_high: number;
  final_low: number;
  closed_at: string;
  created_at: string;
  updated_at: string;
}

interface UserPrediction {
  wallet_address: string;
  period_id: number;
  predicted_high: number;
  predicted_low: number;
}

interface LeaderboardEntry {
  wallet_address: string;
  predicted_high: number;
  predicted_low: number;
  combined_accuracy_percentage: number;
  rank: number;
}

interface WalletLeaderboardPosition {
  wallet_address: string;
  predicted_high: number;
  predicted_low: number;
  combined_accuracy_percentage: number;
  rank: number;
}

interface PredictionHistory {
  period_id: number;
  period_start_time: string;
  period_end_time: string;
  final_high: number;
  final_low: number;
  winner_wallet_address: string;
  winner_predicted_high: number;
  winner_predicted_low: number;
  winner_accuracy: number;
  user_predicted_high: number;
  user_predicted_low: number;
  user_accuracy: number;
  total_pool: number;
}

const usePredictionPeriod = () => {
  const [period, setPeriod] = useState<PredictionPeriod | null>(null);
  const [userPrediction, setUserPrediction] = useState<UserPrediction | null>(
    null
  );
  const [currentLeader, setCurrentLeader] = useState<LeaderboardEntry | null>(
    null
  );
  const [walletPosition, setWalletPosition] =
    useState<WalletLeaderboardPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const walletAddress = useTonAddress();

  const fetchCurrentPeriod = async () => {
    try {
      const { data, error } = await supabase
        .from("t_prediction_periods")
        .select("*")
        .eq("is_active", true)
        .lte("starts_at", new Date().toISOString())
        .gte("ends_at", new Date().toISOString())
        .single();

      if (error) throw error;
      setPeriod(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Separate effect for fetching user prediction
  useEffect(() => {
    const fetchUserPrediction = async () => {
      if (!walletAddress || !period?.id) {
        setUserPrediction(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("t_user_predictions")
          .select("*")
          .eq("wallet_address", walletAddress)
          .eq("period_id", period.id)
          .single();

        if (error) throw error;
        setUserPrediction(data);
      } catch (err) {
        console.error("Error fetching user prediction:", err);
        setUserPrediction(null);
      }
    };

    fetchUserPrediction();
  }, [walletAddress, period?.id]);

  // Original period polling effect
  useEffect(() => {
    fetchCurrentPeriod();
    const intervalId = setInterval(fetchCurrentPeriod, 15000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchLeaderboard = async (periodId: number) => {
    try {
      const { data, error } = await supabase.rpc("get_current_leaderboard", {
        p_period_id: periodId,
        p_limit: 1,
      });

      if (error) throw error;
      if (data && data.length > 0) {
        setCurrentLeader(data[0]);
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  };

  useEffect(() => {
    if (period?.id) {
      fetchLeaderboard(period.id);
    }
  }, [period?.id]);

  useEffect(() => {
    const fetchWalletPosition = async () => {
      if (!walletAddress || !period?.id) {
        setWalletPosition(null);
        return;
      }

      try {
        const { data, error } = await supabase.rpc(
          "get_wallet_leaderboard_position",
          {
            p_period_id: period.id,
            p_wallet_address: walletAddress,
          }
        );

        if (error) throw error;
        if (data && data.length > 0) {
          setWalletPosition(data[0]);
        } else {
          setWalletPosition(null);
        }
      } catch (err) {
        console.error("Error fetching wallet position:", err);
        setWalletPosition(null);
      }
    };

    fetchWalletPosition();
  }, [walletAddress, period?.id]);

  return {
    period,
    loading,
    error,
    userPrediction,
    currentLeader,
    walletPosition,
  };
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-lg m-4 p-6 z-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default function PumpDumpHome() {
  const walletAddress = useTonAddress();
  const [tonConnectUI, setOptions] = useTonConnectUI();

  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [prediction, setPrediction] = useState({ high: "", low: "" });
  const [countdown, setCountdown] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [yourPrediction, setYourPrediction] = useState(null);
  const {
    period,
    loading,
    error,
    userPrediction,
    currentLeader,
    walletPosition,
  } = usePredictionPeriod();

  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [predictionHistory, setPredictionHistory] = useState<
    PredictionHistory[]
  >([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      if (!period?.ends_at) return;

      const now = new Date();
      const endTime = new Date(period.ends_at);
      const timeRemaining = endTime.getTime() - now.getTime();

      // Return early if time has expired
      if (timeRemaining < 0) {
        setCountdown({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor(
        (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      setCountdown({ hours, minutes, seconds });
    };

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(timer);
  }, [period?.ends_at]);

  const stats = {
    currentPrice: period?.current_price ?? 0,
    todayRange: {
      high: period?.current_high ?? 0,
      low: period?.current_low ?? 0,
    },
  };

  const handleSubmitPrediction = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitStatus("loading");
      setSubmitError(null);

      if (!walletAddress) {
        throw new Error("Please connect your wallet first");
      }

      if (!period?.id) {
        throw new Error("No active prediction period found");
      }

      if (!prediction.high || !prediction.low) {
        throw new Error("Please enter both high and low predictions");
      }

      // 1. Send TON transaction
      // const transaction: SendTransactionRequest = {
      //   validUntil: Date.now() + 5 * 60 * 1000,
      //   messages: [
      //     {
      //       address: "UQAS5RgeZdShqIIjhTtbFiLPask0eHUmbsltA99oybs8KDvm",
      //       amount: "1000000", // 0.001 TON
      //     },
      //   ],
      // };

      // const txResult = await tonConnectUI.sendTransaction(transaction);

      // 2. Submit prediction to API
      const response = await fetch(
        "https://zyld7uqfrv5ruinxs7sdntcmsm0dbzez.lambda-url.us-east-1.on.aws/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletAddress: walletAddress,
            periodId: period.id,
            predictedHigh: parseFloat(prediction.high),
            predictedLow: parseFloat(prediction.low),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit prediction");
      }

      // Success handling
      setYourPrediction({
        high: parseFloat(prediction.high),
        low: parseFloat(prediction.low),
      });
      setShowPredictionModal(false);
      setPrediction({ high: "", low: "" });
      setSubmitStatus("success");
    } catch (error) {
      console.error("Prediction submission error:", error);
      setSubmitStatus("error");
      setSubmitError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  };

  const SubmitStatusModal = () => {
    if (submitStatus === "idle") return null;

    return (
      <Modal
        isOpen={
          submitStatus === "loading" ||
          submitStatus === "success" ||
          submitStatus === "error"
        }
        onClose={() => setSubmitStatus("idle")}
        title={
          submitStatus === "loading"
            ? "Submitting..."
            : submitStatus === "success"
            ? "Success!"
            : "Error"
        }
      >
        <div className="p-4 text-center">
          {submitStatus === "loading" && (
            <div className="text-gray-400">Processing your prediction...</div>
          )}
          {submitStatus === "success" && (
            <div className="text-emerald-500">
              Your prediction has been submitted successfully!
            </div>
          )}
          {submitStatus === "error" && (
            <div className="text-rose-500">{submitError}</div>
          )}
        </div>
      </Modal>
    );
  };

  const fetchPredictionHistory = async () => {
    if (!walletAddress) return;

    setHistoryLoading(true);
    try {
      const { data, error } = await supabase.rpc(
        "get_user_prediction_history",
        {
          p_wallet_address: walletAddress,
          p_page_size: 10,
          p_page_number: 1,
        }
      );

      if (error) throw error;
      setPredictionHistory(data || []);
    } catch (err) {
      console.error("Error fetching prediction history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (showHistoryModal) {
      fetchPredictionHistory();
    }
  }, [showHistoryModal, walletAddress]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <img src={publicUrl("/logo.png")} alt="Pumpdump Logo" className="w-1/2" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Header - Update prize pool */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex flex-col items-center justify-between text-center">
            <div className="text-gray-400 text-sm">Today's Prize Pool</div>
            <div className="text-white font-bold text-3xl mt-2">
              {period ? `${period.total_pool} TON` : "Loading..."}
            </div>
          </div>
        </div>

        {/* Main Game Panel - Add loading state */}
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-2xl p-8 text-center border border-gray-800">
            {loading ? (
              <div className="text-gray-400">Loading price data...</div>
            ) : error ? (
              <div className="text-rose-500">Error: {error}</div>
            ) : (
              <>
                <div className="text-gray-400 mb-3">Current BTC Price</div>
                <div className="text-5xl font-bold text-white mb-4">
                  ${Math.round(stats.currentPrice).toLocaleString()}
                </div>

                {/* Today's Range */}
                <div className="grid grid-cols-2 gap-8 mt-8">
                  <div>
                    <div className="flex items-center justify-center gap-2 text-emerald-500 mb-3">
                      <TrendingUp className="w-6 h-6" />
                      <div className="text-base font-medium">Today's High</div>
                    </div>
                    <div className="text-4xl font-bold text-white">
                      ${Math.round(stats.todayRange.high).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-center gap-2 text-rose-500 mb-3">
                      <TrendingDown className="w-6 h-6" />
                      <div className="text-base font-medium">Today's Low</div>
                    </div>
                    <div className="text-4xl font-bold text-white">
                      ${Math.round(stats.todayRange.low).toLocaleString()}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Leader Section - Redesigned with Emphasis on Accuracy */}
          <div>
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <div className="text-sm text-gray-400 mb-2 ml-1">
                Leading Prediction
              </div>
              {currentLeader ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-yellow-500/10 p-1.5 rounded-lg">
                        <Crown className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div className="text-2xl font-bold text-emerald-500">
                        {currentLeader.combined_accuracy_percentage.toFixed(1)}%
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-gray-400">
                      <div className="font-mono text-sm">
                        {currentLeader.wallet_address.slice(0, 4)}...
                        {currentLeader.wallet_address.slice(-4)}
                      </div>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-gray-400 text-sm">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-emerald-500/60" />$
                      {Math.round(
                        currentLeader.predicted_high
                      ).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingDown className="w-4 h-4 text-rose-500/60" />$
                      {Math.round(currentLeader.predicted_low).toLocaleString()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm py-2">
                  No predictions yet
                </div>
              )}
            </div>
          </div>

          {/* Your Prediction Section */}
          <div>
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <div className="text-sm text-gray-400 mb-2 ml-1">
                Your Prediction
              </div>
              {walletPosition ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-500/10 p-1.5 rounded-lg">
                        <User className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="text-2xl font-bold text-emerald-500">
                        {walletPosition.combined_accuracy_percentage.toFixed(1)}
                        %
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-gray-400">
                      <div className="font-mono text-sm">
                        {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
                      </div>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-gray-400 text-sm">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-emerald-500/60" />$
                      {Math.round(
                        walletPosition.predicted_high
                      ).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingDown className="w-4 h-4 text-rose-500/60" />$
                      {Math.round(
                        walletPosition.predicted_low
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm py-2">
                  You haven't made a prediction for this round
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons - Cleaner Look */}
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-2 bg-gray-950/50 rounded-lg p-2 mt-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <div className="font-mono text-white">
              {`${String(countdown.hours).padStart(2, "0")}:${String(
                countdown.minutes
              ).padStart(2, "0")}:${String(countdown.seconds).padStart(
                2,
                "0"
              )}`}
            </div>
            <div className="text-gray-400 text-sm ml-2">
              tomorrow's round starts
            </div>
          </div>

          {walletAddress ? (
            <button
              onClick={() => setShowPredictionModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all font-bold"
            >
              Predict Tomorrow's Price (1 TON)
            </button>
          ) : (
            <TonConnectButton className="w-full" />
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <History className="w-5 h-5" />
              History
            </button>
            <button
              onClick={() => setShowAboutModal(true)}
              className="bg-gray-900 hover:bg-gray-800 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Info className="w-5 h-5" />
              About
            </button>
          </div>
        </div>
      </div>

      {/* Prediction Modal - Simplified */}
      <Modal
        isOpen={showPredictionModal}
        onClose={() => setShowPredictionModal(false)}
        title="Tomorrow's BTC Price"
      >
        <form onSubmit={handleSubmitPrediction} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm block mb-2">
                Predict High ($)
              </label>
              <input
                type="number"
                value={prediction.high}
                onChange={(e) =>
                  setPrediction({ ...prediction, high: e.target.value })
                }
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter predicted high..."
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm block mb-2">
                Predict Low ($)
              </label>
              <input
                type="number"
                value={prediction.low}
                onChange={(e) =>
                  setPrediction({ ...prediction, low: e.target.value })
                }
                className="w-full bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter predicted low..."
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-all"
          >
            Submit Prediction (1 TON)
          </button>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title="Past Predictions"
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto hide-scrollbar">
          {historyLoading ? (
            <div className="text-gray-400 text-center py-4">
              Loading history...
            </div>
          ) : predictionHistory.length === 0 ? (
            <div className="text-gray-400 text-center py-4">
              No prediction history found
            </div>
          ) : (
            predictionHistory.map((entry) => (
              <div
                key={entry.period_id}
                className="border border-gray-800 rounded-lg p-4 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="text-gray-400">
                    {new Date(entry.period_start_time).toLocaleDateString()}
                  </div>
                  <div className="text-gray-400">💰 {entry.total_pool} TON</div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Final Results */}
                  <div>
                    <div className="text-sm text-gray-400 mb-2">Final</div>
                    {entry.final_high ? (
                      <div className="text-white">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />$
                          {Math.round(entry.final_high).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <TrendingDown className="w-4 h-4 text-rose-500" />$
                          {Math.round(entry.final_low).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">Pending</div>
                    )}
                  </div>

                  {/* Winner's Prediction */}
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <span>Winner</span>
                      {entry.winner_accuracy && (
                        <div className="bg-green-500/10 px-2 py-0.5 rounded">
                          <span className="text-green-500">
                            {entry.winner_accuracy.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                    {entry.winner_wallet_address ? (
                      <div className="text-white">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />$
                          {Math.round(
                            entry.winner_predicted_high
                          ).toLocaleString()}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <TrendingDown className="w-4 h-4 text-rose-500" />$
                          {Math.round(
                            entry.winner_predicted_low
                          ).toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">Pending</div>
                    )}
                  </div>

                  {/* Your Prediction */}
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                      <span>You</span>
                      {entry.user_accuracy && (
                        <div className="bg-green-500/10 px-2 py-0.5 rounded">
                          <span className="text-green-500">
                            {entry.user_accuracy.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-white">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />$
                        {Math.round(entry.user_predicted_high).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <TrendingDown className="w-4 h-4 text-rose-500" />$
                        {Math.round(entry.user_predicted_low).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* About Modal - Simplified */}
      <Modal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        title="How It Works"
      >
        <div className="space-y-4 text-gray-300">
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-gray-900 rounded-lg">
              <div className="text-xl">1️⃣</div>
              <p>Predict tomorrow's BTC high & low prices</p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-gray-900 rounded-lg">
              <div className="text-xl">2️⃣</div>
              <p>Pay 1 TON to submit your prediction</p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-gray-900 rounded-lg">
              <div className="text-xl">3️⃣</div>
              <p>Most accurate prediction wins the prize pool!</p>
            </div>
          </div>
        </div>
      </Modal>

      <SubmitStatusModal />
    </div>
  );
}
