import { TrendingUp, TrendingDown, ExternalLink, Trophy } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/Modal";
import { supabase } from "@/utils/supabaseClient";
import { PredictionEntry } from "@/types/prediction";

const HistoryContent = ({
  t,
  historyLoading,
  predictionHistory,
}: {
  t: any;
  historyLoading: boolean;
  predictionHistory: PredictionEntry[];
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [detailedPredictions, setDetailedPredictions] = useState<
    PredictionEntry[]
  >([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchDetailedPredictions = async (periodId: number) => {
    setDetailsLoading(true);
    const { data, error } = await supabase
      .from("t_user_predictions")
      .select("*")
      .eq("period_id", periodId)
      .order("total_difference");

    if (!error && data) {
      setDetailedPredictions(data);
    }
    setDetailsLoading(false);
  };

  const formatWalletAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (historyLoading) {
    return (
      <div className="text-gray-500 text-center py-8">
        {t.history["Loading history..."]}
      </div>
    );
  }

  if (predictionHistory.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        {t.history["No prediction history found"]}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto hide-scrollbar px-1 -mx-1">
        {predictionHistory.map((entry) => (
          <div
            key={entry.period_id}
            onClick={() => {
              setSelectedPeriod(entry.period_id);
              fetchDetailedPredictions(entry.period_id);
            }}
            className="group relative border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-all hover:shadow-sm cursor-pointer bg-white"
          >
            {/* Date and Pool Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="text-gray-900 font-medium">
                  {new Date(entry.period_start_time).toLocaleDateString(
                    undefined,
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }
                  )}
                </div>
                {entry.winner_wallet_address ? (
                  <span className="text-green-500 text-sm bg-green-50 px-2 py-0.5 rounded-full">
                    {t.history["Settled"]}
                  </span>
                ) : (
                  <span className="text-orange-500 text-sm bg-orange-50 px-2 py-0.5 rounded-full">
                    {t.history["Pending"]}
                  </span>
                )}
              </div>
              <div className="flex items-center font-semibold rounded-full">
                <span className="text-gray-600 mr-1">💰</span>
                <span className="text-gray-600 mr-1">{entry.total_pool}</span>
                <span className="text-gray-600">TON</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Final Results */}
              <div className="p-3 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-xs font-medium text-gray-700 mb-2">
                  {t.history["Final Price"]}
                </div>
                {entry.final_high ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="font-mono text-gray-900">
                        ${Math.round(entry.final_high).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                      <span className="font-mono text-gray-900">
                        ${Math.round(entry.final_low).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">
                    {t.history["Pending"]}
                  </div>
                )}
              </div>

              {/* Your Prediction */}
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
                <div className="text-xs font-medium text-gray-700 mb-2">
                  {t.history["Your Prediction"]}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="font-mono text-gray-900">
                      ${Math.round(entry.user_predicted_high).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                    <span className="font-mono text-gray-900">
                      ${Math.round(entry.user_predicted_low).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Winner Card */}
              <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100/50">
                <div className="text-xs font-medium text-gray-700 mb-2">
                  {t.history["Winner"]}
                </div>
                {entry.winner_wallet_address ? (
                  <div className="space-y-2">
                    <div className="text-gray-900 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="font-mono">
                          $
                          {Math.round(
                            entry.winner_predicted_high
                          ).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-rose-500" />
                        <span className="font-mono">
                          $
                          {Math.round(
                            entry.winner_predicted_low
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <Trophy className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                          <span className="text-xs text-gray-600 truncate">
                            {formatWalletAddress(entry.winner_wallet_address)}
                          </span>
                        </div>
                        <a
                          href={`https://tonscan.org/tx/${entry.winner_transaction_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-500 hover:text-blue-600 flex-shrink-0 ml-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-sm">
                    {t.history["To be settled"]}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Predictions Modal */}
      <Modal
        isOpen={!!selectedPeriod}
        onClose={() => setSelectedPeriod(null)}
        title={t.history["All Predictions"]}
      >
        {detailsLoading ? (
          <div className="text-center py-8">
            {t.history["Loading predictions..."]}
          </div>
        ) : (
          <div className="space-y-6">
            {/* List of Predictions */}
            <div className="max-h-[45vh] overflow-y-auto hide-scrollbar space-y-3 pr-1">
              {detailedPredictions.map((prediction, index) => (
                <div
                  key={prediction.ton_transaction_hash}
                  className="relative border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-800">
                        {formatWalletAddress(prediction.wallet_address)}
                      </div>
                      <a
                        href={`https://tonscan.org/tx/${prediction.ton_transaction_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500">
                        {new Date(prediction.created_at).toLocaleString()}
                      </div>
                      {index === 0 &&
                        prediction.winner_wallet_address ===
                          prediction.wallet_address && (
                          <Trophy className="w-4 h-4 text-yellow-500" />
                        )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="font-mono text-sm text-black">
                        $
                        {Math.round(prediction.predicted_high).toLocaleString()}
                      </span>
                      {prediction.high_difference && (
                        <span className="text-xs text-gray-500">
                          (±${Math.abs(prediction.high_difference).toFixed(2)})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                      <span className="font-mono text-sm text-black">
                        ${Math.round(prediction.predicted_low).toLocaleString()}
                      </span>
                      {prediction.low_difference && (
                        <span className="text-xs text-gray-500">
                          (±${Math.abs(prediction.low_difference).toFixed(2)})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Winner Banner at Bottom */}
            {detailedPredictions.length > 0 &&
              detailedPredictions[0].winner_wallet_address && (
                <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6">
                  <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-yellow-500" />
                        <span className="font-medium text-gray-900">
                          {t.history["Winner"]}:{" "}
                          {formatWalletAddress(
                            detailedPredictions[0].winner_wallet_address
                          )}
                        </span>
                      </div>
                      <a
                        href={`https://tonscan.org/tx/${detailedPredictions[0].winner_transaction_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-600 inline-flex items-center gap-1 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default HistoryContent;
