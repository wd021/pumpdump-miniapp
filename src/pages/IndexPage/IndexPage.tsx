import React, { useState, useEffect } from "react";
import { initData, useSignal } from "@telegram-apps/sdk-react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  History,
  Info,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  ExternalLink,
  User,
} from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import {
  SendTransactionRequest,
  TonConnectButton,
  useTonAddress,
  useTonConnectUI,
} from "@tonconnect/ui-react";
import { PredictionHistory, PredictionEntry } from "@/types/prediction";
import { usePredictionPeriod } from "@/hooks/usePredictionPeriod";
import { Modal } from "@/components/Modal";
import { API_URL } from "@/utils/constants";

import HistoryContent from "./historyContent";
import { getTranslations } from "@/i18n/utils/getTranslation";
import { publicUrl } from "@/helpers/publicUrl";

const steps = [
  {
    emoji: "🎯",
    title: "Predict BTC Prices",
    description: "Set tomorrow's BTC high & low prices",
  },
  {
    emoji: "💎",
    title: "Pay 1 TON",
    description: "Submit your prediction to join",
  },
  {
    emoji: "🏆",
    title: "Win Prize Pool",
    description: "Most accurate prediction wins!",
  },
];

export default function PumpDumpHome() {
  const initDataState = useSignal(initData.state);
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const t = getTranslations(initDataState?.user?.languageCode ?? "en");

  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [prediction, setPrediction] = useState({ high: "", low: "" });
  const [countdown, setCountdown] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [, setYourPrediction] = useState<any>(null);
  const { period, loading, error, currentLeader, walletPosition } =
    usePredictionPeriod();

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
      const transaction: SendTransactionRequest = {
        validUntil: Date.now() + 5 * 60 * 1000,
        messages: [
          {
            address: "UQAS5RgeZdShqIIjhTtbFiLPask0eHUmbsltA99oybs8KDvm",
            amount: "1000000", // 0.001 TON
          },
        ],
      };

      await tonConnectUI.sendTransaction(transaction);

      // 2. Submit prediction to API
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
          predictedHigh: parseFloat(prediction.high),
          predictedLow: parseFloat(prediction.low),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes from the backend
        if (data.error) {
          switch (data.error.code) {
            case "DUPLICATE_TRANSACTION":
              throw new Error(
                "This TON transaction has already been used for another prediction"
              );
            case "INVALID_PREDICTION_VALUES":
              throw new Error(
                "Your predicted low price must be less than your predicted high price"
              );
            case "DUPLICATE_PREDICTION":
              throw new Error(
                "You've already submitted a prediction for this round. Wait for the next day!"
              );
            default:
              throw new Error(
                data.error.message || "Failed to submit prediction"
              );
          }
        }
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

    const getStatusContent = () => {
      switch (submitStatus) {
        case "loading":
          return {
            title: t.predict["Submitting..."],
            message: t.predict["Processing your prediction..."],
            className: "text-gray-400",
          };
        case "success":
          return {
            title: t.predict["Success!"],
            message:
              t.predict[
                "Your prediction has been submitted successfully! Good luck! 🍀"
              ],
            className: "text-emerald-500",
          };
        case "error":
          return {
            title: t.predict["Error"],
            message: submitError || t.predict["An unexpected error occurred"],
            className: "text-rose-500",
          };
        default:
          return {
            title: "",
            message: "",
            className: "",
          };
      }
    };

    const content = getStatusContent();

    return (
      <Modal
        isOpen={
          submitStatus === "loading" ||
          submitStatus === "success" ||
          submitStatus === "error"
        }
        onClose={() => setSubmitStatus("idle")}
        title={content.title}
      >
        <div className="p-4 text-center">
          <div className={content.className}>{content.message}</div>
          {submitStatus === "error" && (
            <button
              onClick={() => setSubmitStatus("idle")}
              className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {t.predict["Try Again"]}
            </button>
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
    <div className="min-h-screen py-8">
      <img
        src={publicUrl("/logo.png")}
        alt="PumpDump Logo"
        className="w-1/4 mx-auto"
      />
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Header - Update prize pool */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex flex-col items-center justify-between text-center">
            <div className="text-gray-400 text-sm">
              {t.home["Today's prize pool"]}
            </div>
            <div className="text-white font-bold text-3xl mt-2">
              💰 {period ? `${period?.total_pool} TON` : t.home["Loading..."]}
            </div>
            <div className="flex items-center gap-2 text-gray-400 mt-2">
              <Clock className="w-4 h-4" />
              <div className="font-mono">
                <span className="text-white">
                  {`${String(countdown.hours).padStart(2, "0")}:${String(
                    countdown.minutes
                  ).padStart(2, "0")}:${String(countdown.seconds).padStart(
                    2,
                    "0"
                  )}`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Game Panel - Add loading state */}
        <div className="rounded-2xl p-6 border border-gray-800 bg-gray-900">
          <div className="text-center relative">
            {loading ? (
              <div className="text-gray-400">
                {t.home["Loading price data..."]}
              </div>
            ) : error ? (
              <div className="text-rose-500">
                {t.home["Error:"]} {error}
              </div>
            ) : (
              <>
                <div className="text-gray-400 text-sm">
                  {t.home["Current BTC price"]}
                </div>
                <div className="text-5xl font-bold text-white mb-4 mt-2 font-mono">
                  ${Math.round(stats.currentPrice).toLocaleString()}
                </div>

                {/* Today's Range */}
                <div className="grid grid-cols-2 gap-8 mt-8">
                  <div>
                    <div className="flex items-center justify-center gap-2 text-emerald-500 mb-3">
                      <TrendingUp className="w-6 h-6" />
                      <div className="text-base font-medium">
                        {t.home["Today's High"]}
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-white font-mono">
                      ${Math.round(stats.todayRange.high).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-center gap-2 text-rose-500 mb-3">
                      <TrendingDown className="w-6 h-6" />
                      <div className="text-base font-medium">
                        {t.home["Today's Low"]}
                      </div>
                    </div>
                    <div className="text-4xl font-bold text-white font-mono">
                      ${Math.round(stats.todayRange.low).toLocaleString()}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="mt-6">
            {/* Leader Section - Redesigned with Emphasis on Accuracy */}
            <div className="bg-gray-900 p-4">
              <div className="text-sm text-gray-400 mb-2">
                {t.home["Leading Prediction"]}
              </div>
              {currentLeader ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-yellow-500/10 p-1.5 rounded-lg">
                        <Crown className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div className="text-2xl font-bold text-emerald-500">
                        {currentLeader?.combined_accuracy_percentage.toFixed(1)}
                        %
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-gray-400">
                      <div className="font-mono text-sm">
                        {currentLeader?.wallet_address.slice(0, 4)}...
                        {currentLeader?.wallet_address.slice(-4)}
                      </div>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-gray-400 text-sm">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-emerald-500/60" />$
                      {Math.round(
                        currentLeader?.predicted_high!
                      ).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingDown className="w-4 h-4 text-rose-500/60" />$
                      {Math.round(
                        currentLeader?.predicted_low!
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm py-2">
                  {t.home["No predictions yet"]}
                </div>
              )}
            </div>

            {/* Your Prediction Section */}
            <div className="bg-gray-900 p-4">
              <div className="text-sm text-gray-400 mb-2">
                {t.home["Your Prediction"]}
              </div>
              {walletPosition ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-500/10 p-1.5 rounded-lg">
                        <User className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="text-2xl font-bold text-emerald-500">
                        {walletPosition?.combined_accuracy_percentage.toFixed(
                          1
                        )}
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
                        walletPosition?.predicted_high!
                      ).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingDown className="w-4 h-4 text-rose-500/60" />$
                      {Math.round(
                        walletPosition?.predicted_low!
                      ).toLocaleString()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm py-2">
                  {t.home["You haven't made a prediction for this round"]}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons - Cleaner Look */}
        <div className="grid grid-cols-1 gap-6">
          {walletAddress ? (
            <div className="rounded-xl bg-white p-0.5 shadow-lg transition-all duration-300">
              <button
                onClick={() => setShowPredictionModal(true)}
                className="w-full rounded-lg bg-white"
              >
                <div className="flex flex-col items-center gap-4 p-6">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-black">
                      {t.home["Enter Tomorrow's Race"]}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:translate-x-0.5 transition-transform duration-300" />
                  </div>

                  <div className="flex gap-x-2 text-black font-semibold">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
                      <div className="text-sm">💰 1 TON</div>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold mb-2">
                  {t.home["Connect Wallet to Predict"]}
                </h3>
                <p className="text-sm text-gray-400">
                  {t.home["Join the prediction game by connecting your wallet"]}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-center">
                <div className="w-full flex items-center justify-center">
                  <TonConnectButton />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowHistoryModal(true)}
              className="bg-white text-black font-semibold p-4 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <History className="w-5 h-5" />
              {t.home["History"]}
            </button>
            <button
              onClick={() => setShowAboutModal(true)}
              className="bg-white text-black font-semibold p-4 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Info className="w-5 h-5" />
              {t.home["About"]}
            </button>
          </div>
        </div>
      </div>

      {/* Prediction Modal - Simplified */}
      <Modal
        isOpen={showPredictionModal}
        onClose={() => setShowPredictionModal(false)}
        title={t.predict["Predict Tomorrow's BTC Price"]}
      >
        <form onSubmit={handleSubmitPrediction} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                {t.predict["Predict High"]}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  value={prediction.high}
                  onChange={(e) =>
                    setPrediction({ ...prediction, high: e.target.value })
                  }
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 
                         focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                         transition-all duration-200"
                  placeholder={t.predict["Enter predicted high..."]}
                />
              </div>
            </div>

            <div className="relative">
              <label className="flex items-center gap-2 text-gray-700 font-medium mb-2">
                <ArrowDownRight className="w-4 h-4 text-red-500" />
                {t.predict["Predict Low"]}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  value={prediction.low}
                  onChange={(e) =>
                    setPrediction({ ...prediction, low: e.target.value })
                  }
                  className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 
                         focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                         transition-all duration-200"
                  placeholder={t.predict["Enter predicted low..."]}
                />
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mt-4">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-yellow-500" />
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">
                    {t.predict["Most accurate prediction wins!"]}
                  </span>
                  <br />
                  <span className="text-gray-500">
                    {
                      t.predict[
                        "Get closest to tomorrow's actual high & low to win the entire prize pool"
                      ]
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 
                     text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200
                     flex items-center justify-center gap-2 group"
            >
              <span>{t.predict["Submit Prediction"]}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        title={t.history["Past Predictions"]}
      >
        <HistoryContent
          t={t}
          historyLoading={historyLoading}
          predictionHistory={predictionHistory as unknown as PredictionEntry[]}
        />
      </Modal>

      {/* About Modal - Simplified */}
      <Modal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        title={t.about["How It Works"]}
      >
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white rounded-lg shadow-sm">
                <span className="text-xl">{step.emoji}</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {t.about[step.title]}
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  {t.about[step.description]}
                </p>
              </div>
            </div>
          ))}

          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="text-blue-600 text-sm text-center font-medium">
              {t.about["Ready to make your prediction?"]} 🚀
            </p>
          </div>
        </div>
      </Modal>

      <SubmitStatusModal />
    </div>
  );
}
