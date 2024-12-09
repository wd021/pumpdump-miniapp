/*
  CALL THIS WITH -
  {
    "walletAddress": "user's TON wallet address",
    "periodId": "prediction period ID",
    "predictedHigh": "predicted high value",
    "predictedLow": "predicted low value"
  }
*/

import { createClient } from "@supabase/supabase-js";
import axios from "axios";

// Environment variables validation
const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_KEY",
  "TARGET_WALLET",
  "REQUIRED_AMOUNT",
  "TONCENTER_API_KEY",
];

const validateEnvVars = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
};

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export const handler = async (event) => {
  try {
    // Validate environment variables
    validateEnvVars();

    // Extract parameters from the request
    const { walletAddress, periodId, predictedHigh, predictedLow } = JSON.parse(
      event.body
    );

    // Validate input parameters
    if (!walletAddress || !periodId || !predictedHigh || !predictedLow) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required parameters" }),
      };
    }

    // Query TON transactions
    const tonResponse = await axios.get(
      `https://toncenter.com/api/v2/getTransactions`,
      {
        params: {
          address: walletAddress,
          limit: 10,
          to_lt: 0,
          archival: false,
        },
        headers: {
          "X-API-Key": process.env.TONCENTER_API_KEY,
        },
      }
    );

    if (!tonResponse.data.ok) {
      throw new Error("Failed to fetch TON transactions");
    }

    // Find the most recent valid transaction
    const validTransaction = tonResponse.data.result.find(
      (tx) =>
        tx.in_msg.destination === process.env.TARGET_WALLET &&
        tx.in_msg.value === process.env.REQUIRED_AMOUNT
    );

    if (!validTransaction) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No valid transaction found" }),
      };
    }

    // Get transaction hash
    const transactionHash = validTransaction.in_msg?.transaction_id?.hash;
    if (!transactionHash) {
      throw new Error("Transaction hash not found");
    }

    // Submit prediction to Supabase
    const { data, error } = await supabase.rpc("submit_prediction", {
      p_wallet_address: walletAddress,
      p_period_id: periodId,
      p_predicted_high: predictedHigh,
      p_predicted_low: predictedLow,
      p_ton_transaction_hash: transactionHash,
    });

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        data,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      }),
    };
  }
};
