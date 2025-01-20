import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import {
  PredictionPeriod,
  UserPrediction,
  LeaderboardEntry,
  WalletLeaderboardPosition,
} from "@/types/prediction";
import { useTonAddress } from "@tonconnect/ui-react";

export const usePredictionPeriod = () => {
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
  const [tomorrowsPrediction, setTomorrowsPrediction] =
    useState<UserPrediction | null>(null);

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
    const intervalId = setInterval(fetchCurrentPeriod, 30000);
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

  // Add new effect to fetch tomorrow's prediction
  useEffect(() => {
    const fetchTomorrowsPrediction = async () => {
      if (!walletAddress || !period?.id) {
        setTomorrowsPrediction(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("t_user_predictions")
          .select("*")
          .eq("wallet_address", walletAddress)
          .eq("period_id", period.id + 1)
          .single();

        if (error) {
          if (error.code !== "PGRST116") {
            // No rows returned
            console.error("Error fetching tomorrow's prediction:", error);
          }
          setTomorrowsPrediction(null);
          return;
        }

        setTomorrowsPrediction(data);
      } catch (err) {
        console.error("Error fetching tomorrow's prediction:", err);
        setTomorrowsPrediction(null);
      }
    };

    fetchTomorrowsPrediction();
  }, [walletAddress, period?.id]);

  return {
    period,
    loading,
    error,
    userPrediction,
    currentLeader,
    walletPosition,
    tomorrowsPrediction,
    setTomorrowsPrediction,
  };
};
