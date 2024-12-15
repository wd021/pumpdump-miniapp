export interface PredictionPeriod {
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

export interface UserPrediction {
  wallet_address: string;
  period_id: number;
  predicted_high: number;
  predicted_low: number;
}

export interface LeaderboardEntry {
  wallet_address: string;
  predicted_high: number;
  predicted_low: number;
  combined_accuracy_percentage: number;
  rank: number;
}

export interface WalletLeaderboardPosition {
  wallet_address: string;
  predicted_high: number;
  predicted_low: number;
  combined_accuracy_percentage: number;
  rank: number;
}

export interface PredictionHistory {
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
