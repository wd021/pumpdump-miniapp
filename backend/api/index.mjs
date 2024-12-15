/*
  CALL THIS WITH -
  {
    "walletAddress": "user's TON wallet address",
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

// Add this at the beginning of the handler function
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Add these error codes at the top of the file
const ERROR_CODES = {
  DUPLICATE_TRANSACTION: "23505",
  CHECK_VIOLATION: "P0001",
};

// Add this function to handle Supabase errors
const handleSupabaseError = (error) => {
  if (!error) return null;

  // Handle duplicate transaction hash
  if (
    error.code === ERROR_CODES.DUPLICATE_TRANSACTION &&
    error.message.includes("ton_transaction_hash")
  ) {
    return {
      code: "DUPLICATE_TRANSACTION",
      message: "This transaction has already been used for a prediction",
      status: 400,
    };
  }

  // Handle high/low validation error
  if (
    error.code === ERROR_CODES.CHECK_VIOLATION &&
    error.message.includes("Predicted low must be less than predicted high")
  ) {
    return {
      code: "INVALID_PREDICTION_VALUES",
      message: "Predicted low value must be less than predicted high value",
      status: 400,
    };
  }

  // Handle duplicate prediction for same period
  if (
    error.code === ERROR_CODES.DUPLICATE_TRANSACTION &&
    error.message.includes("wallet_period_unique")
  ) {
    return {
      code: "DUPLICATE_PREDICTION",
      message: "You have already submitted a prediction for this period",
      status: 400,
    };
  }

  // Default error
  return {
    code: "UNKNOWN_ERROR",
    message: error.message || "An unexpected error occurred",
    status: 500,
  };
};

export const handler = async (event) => {
  // Handle OPTIONS request for CORS preflight
  if (event.requestContext?.http?.method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  try {
    validateEnvVars();

    // Extract parameters from the request
    const { walletAddress, predictedHigh, predictedLow } = JSON.parse(
      event.body
    );

    // Validate input parameters
    if (!walletAddress || !predictedHigh || !predictedLow) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Missing required parameters" }),
      };
    }

    // Query TON transactions first
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

    // Validate transaction
    const validTransaction = tonResponse.data.result.find(
      (tx) =>
        tx.in_msg.destination === process.env.TARGET_WALLET &&
        tx.in_msg.value === process.env.REQUIRED_AMOUNT
    );

    if (!validTransaction) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: "No valid transaction found" }),
      };
    }

    // Get transaction hash
    // Get transaction hash from either location
    const transactionHash =
      validTransaction.in_msg?.transaction_id?.hash ||
      validTransaction.transaction_id?.hash;
    if (!transactionHash) {
      throw new Error("Transaction hash not found");
    }

    // Submit prediction to Supabase
    const { data, error } = await supabase.rpc("submit_prediction", {
      p_wallet_address: walletAddress,
      p_predicted_high: predictedHigh,
      p_predicted_low: predictedLow,
      p_ton_transaction_hash: transactionHash,
    });

    if (error) {
      const handledError = handleSupabaseError(error);
      return {
        statusCode: handledError.status,
        headers: corsHeaders,
        body: JSON.stringify({
          error: {
            code: handledError.code,
            message: handledError.message,
          },
        }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        data,
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    const handledError = handleSupabaseError(error);
    return {
      statusCode: handledError.status,
      headers: corsHeaders,
      body: JSON.stringify({
        error: {
          code: handledError.code,
          message: handledError.message,
        },
      }),
    };
  }
};
