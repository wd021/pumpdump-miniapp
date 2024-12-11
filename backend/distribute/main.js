const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");
const TonWeb = require("tonweb");

// Configure environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const TON_NODE_URL = process.env.TON_NODE_URL;
const WALLET_PRIVATE_KEY = process.env.WALLET_PRIVATE_KEY;

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const tonweb = new TonWeb(new TonWeb.HttpProvider(TON_NODE_URL));

async function getClosingPrices(apiTicker, startTimestamp, endTimestamp) {
  try {
    const response = await axios.get(
      `https://api.coinbase.com/api/v3/brokerage/market/products/${apiTicker}/candles`,
      {
        params: {
          start: Math.floor(startTimestamp.getTime() / 1000),
          end: Math.floor(endTimestamp.getTime() / 1000),
          granularity: "ONE_DAY",
          limit: 1,
        },
      }
    );

    // Coinbase candle format: [start, high, low, open, close, volume]
    const candle = response.data.candles[0];
    return {
      high: candle[1],
      low: candle[2],
    };
  } catch (error) {
    console.error("Error fetching prices:", error);
    throw error;
  }
}

async function findWinner(periodId, finalHigh, finalLow) {
  const { data: predictions, error } = await supabase
    .from("t_user_predictions")
    .select(
      `
            wallet_address,
            predicted_high,
            predicted_low
        `
    )
    .eq("period_id", periodId);

  if (error) throw error;

  let bestAccuracy = Infinity;
  let winner = null;

  predictions.forEach((prediction) => {
    const highDiff = Math.abs(prediction.predicted_high - finalHigh);
    const lowDiff = Math.abs(prediction.predicted_low - finalLow);
    const totalDiff = highDiff + lowDiff;

    if (totalDiff < bestAccuracy) {
      bestAccuracy = totalDiff;
      winner = prediction;
    }
  });

  return winner;
}

async function transferPrize(winnerAddress, amount) {
  // Initialize wallet
  const wallet = new TonWeb.Wallet(WALLET_PRIVATE_KEY);

  // Calculate 90% of prize (10% fee)
  const prizeAmount = amount * 0.9;

  // Create transfer
  const transfer = await wallet.createTransfer({
    toAddress: winnerAddress,
    amount: TonWeb.utils.toNano(prizeAmount.toString()),
    payload: "Prize distribution",
  });

  // Send transaction
  const result = await transfer.send();
  return result.hash;
}

async function distributePrize(periodId) {
  try {
    // Get period details
    const { data: period, error: periodError } = await supabase
      .from("t_prediction_periods")
      .select(
        `
                *,
                t_crypto_assets (
                    symbol
                )
            `
      )
      .eq("id", periodId)
      .single();

    if (periodError) throw periodError;

    // Check if period is already closed
    if (period.closed_at) {
      throw new Error("Period already closed");
    }

    // Get final prices
    const prices = await getClosingPrices(
      period.t_crypto_assets.symbol,
      period.starts_at,
      period.ends_at
    );

    // Update period with final prices
    const { error: updateError } = await supabase
      .from("t_prediction_periods")
      .update({
        final_high: prices.high,
        final_low: prices.low,
        closed_at: new Date().toISOString(),
        is_active: false,
      })
      .eq("id", periodId);

    if (updateError) throw updateError;

    // Find winner
    const winner = await findWinner(periodId, prices.high, prices.low);
    if (!winner) throw new Error("No winner found");

    // Transfer prize
    const transactionHash = await transferPrize(
      winner.wallet_address,
      period.total_pool
    );

    // Record prize distribution
    const { error: distributionError } = await supabase
      .from("t_prize_distributions")
      .insert({
        period_id: periodId,
        winner_wallet_address: winner.wallet_address,
        prize_amount: period.total_pool * 0.9,
        ton_transaction_hash: transactionHash,
        status: "completed",
        completed_at: new Date().toISOString(),
      });

    if (distributionError) throw distributionError;

    console.log(`Successfully distributed prize for period ${periodId}`);
    console.log(`Winner: ${winner.wallet_address}`);
    console.log(`Prize Amount: ${period.total_pool * 0.9} TON`);
    console.log(`Transaction Hash: ${transactionHash}`);

    return {
      winner: winner.wallet_address,
      prizeAmount: period.total_pool * 0.9,
      transactionHash,
    };
  } catch (error) {
    console.error("Error in prize distribution:", error);
    throw error;
  }
}

// Function to check and distribute prizes for all completed periods
async function checkAndDistributePrizes() {
  try {
    const { data: periods, error } = await supabase
      .from("t_prediction_periods")
      .select("id")
      .eq("is_active", true)
      .lte("ends_at", new Date().toISOString());

    if (error) throw error;

    for (const period of periods) {
      await distributePrize(period.id);
    }
  } catch (error) {
    console.error("Error in prize distribution check:", error);
    throw error;
  }
}

module.exports = {
  distributePrize,
  checkAndDistributePrizes,
};
