import React, { useState } from "react";
import { TrendingUp, TrendingDown, Trophy, History, Plus } from "lucide-react";

export default function CryptoPredictionGame() {
  const [showPredictionModal, setShowPredictionModal] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const currentStats = {
    price: 44321.55,
    dayHigh: 45100.0,
    dayLow: 43800.0,
    lastUpdate: "2 seconds ago",
    change: "+2.5%",
  };

  const currentLeaders = [
    {
      user: "CryptoWhiz",
      prediction: { high: 45200, low: 43700 },
      accuracy: 98.5,
    },
    {
      user: "BitMaster",
      prediction: { high: 45000, low: 43900 },
      accuracy: 97.2,
    },
    {
      user: "TradeGuru",
      prediction: { high: 45300, low: 43600 },
      accuracy: 96.8,
    },
  ];

  return (
    <div className="relative">
      <div className="flex flex-col gap-4 p-4 max-w-md mx-auto">
        {/* Live Price Action Card */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg overflow-hidden shadow-lg">
          <div className="p-6">
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold transition-all duration-300">
                ${currentStats.price.toLocaleString()}
                <span className="ml-2 text-lg text-blue-100">
                  {currentStats.change}
                </span>
              </div>
              <div className="text-sm opacity-80">
                Live • {currentStats.lastUpdate}
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>Day High</span>
                  </div>
                  <div className="text-xl font-bold">
                    ${currentStats.dayHigh.toLocaleString()}
                  </div>
                </div>
                <div className="text-center p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingDown className="w-4 h-4" />
                    <span>Day Low</span>
                  </div>
                  <div className="text-xl font-bold">
                    ${currentStats.dayLow.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Leaders Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold">Current Leaders</h2>
              </div>
              <div className="text-sm text-blue-600 font-medium">
                Prize Pool: $1,420
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {currentLeaders.map((leader, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg transition-all duration-200 hover:bg-gray-50
                    ${index === 0 ? "bg-yellow-50" : ""}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-lg font-medium ${
                          index === 0 ? "text-yellow-600" : "text-gray-600"
                        }`}
                      >
                        #{index + 1}
                      </span>
                      <span className="font-medium">{leader.user}</span>
                    </div>
                    <div className="text-green-600">{leader.accuracy}%</div>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    ${leader.prediction.low.toLocaleString()} - $
                    {leader.prediction.high.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowPredictionModal(true)}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Prediction
          </button>
          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
          >
            <History className="w-5 h-5" />
            History
          </button>
        </div>
      </div>

      {/* Modals */}
      {showPredictionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-4">Tomorrow's Prediction</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Predicted High
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-200 transition-colors"
                  placeholder="Enter predicted high"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Predicted Low
                </label>
                <input
                  type="number"
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-200 transition-colors"
                  placeholder="Enter predicted low"
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
                  onClick={() => setShowPredictionModal(false)}
                >
                  Submit
                </button>
                <button
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200 transition-colors"
                  onClick={() => setShowPredictionModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Previous Days</h2>
            <div className="space-y-3">
              {[1, 2, 3].map((day) => (
                <div
                  key={day}
                  className="bg-white rounded-lg shadow p-4 border"
                >
                  <div className="font-medium">December {9 - day}, 2024</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Range: $43,200 - $45,100
                  </div>
                  <div className="mt-2">
                    <div className="text-green-600">Winner: CryptoKing</div>
                    <div className="text-sm text-blue-600">Prize: $1,280</div>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">156 players</div>
                </div>
              ))}
            </div>
            <button
              className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded hover:bg-gray-200 transition-colors"
              onClick={() => setShowHistoryModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
