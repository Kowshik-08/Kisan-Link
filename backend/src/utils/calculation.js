/**
 * KisanLink Pricing & Logistics Computation Engine
 * Implements the financial and logistics models from SIH26132 frontend prototype.
 */

const QUALITY_MULTIPLIERS = {
  GRADE_A: 1.0,
  GRADE_B: 0.88,
  GRADE_C: 0.74,
};

const LOCATION_SPREAD_FACTORS = {
  warangal: 1.0,
  karimnagar: 1.3,
  nalgonda: 1.6,
  khammam: 1.1,
  adilabad: 1.4,
};

/**
 * Standardizes any quantity into kilograms.
 * 1 quintal = 100 kg.
 */
function convertToKg(quantity, unit = 'KG') {
  const q = Number(quantity);
  const normalizedUnit = (unit || 'KG').toUpperCase();
  return normalizedUnit === 'QUINTAL' ? q * 100 : q;
}

/**
 * Computes net take-home return for a single buyer quote.
 */
function calculateBuyerReturn({
  basePrice,
  buyerPriceMultiplier = 1.0,
  qualityGrade = 'GRADE_A',
  quantityKg,
  buyerBaseDistance = 10,
  locationSpread = 1.0,
  commissionRate = 0.02,
}) {
  const qMult = QUALITY_MULTIPLIERS[qualityGrade] || 1.0;
  const spread = locationSpread || 1.0;

  // 1. Price offered per kg
  const pricePerKg = Math.round(Number(basePrice) * Number(buyerPriceMultiplier) * qMult * 100) / 100;

  // 2. Gross revenue
  const gross = Math.round(pricePerKg * quantityKg);

  // 3. Distance in km
  const distanceKm = Math.round(Number(buyerBaseDistance) * spread);

  // 4. Logistics / Transport deduction: distance * ₹2.10 * (quantity in quintals)
  const transportCost = Math.round(distanceKm * 2.1 * (quantityKg / 100));

  // 5. Mandi / Agent commission cess fee
  const marketFee = Math.round(gross * Number(commissionRate));

  // 6. Yard loading / unloading & handling charges
  const handlingCost = Math.round(40 + quantityKg * 0.06);

  // 7. Actual net return to the farmer's pocket
  const netAmount = Math.round(gross - transportCost - marketFee - handlingCost);

  return {
    pricePerKg,
    distanceKm,
    grossAmount: gross,
    transportCost,
    marketFee,
    handlingCost,
    netAmount,
  };
}

/**
 * Evaluates 7-day price series and produces market trend advisory insights.
 */
function evaluatePriceTrend(trendSeries = []) {
  if (!trendSeries || trendSeries.length < 2) {
    return {
      percentageChange: 0,
      direction: 'trendFlat',
      demandLevel: 'demandMedium',
      recommendationKey: 'goodTimeToSell',
      cssClass: 'rec-go',
      whyKey: 'whyFlat',
    };
  }

  const numericSeries = trendSeries.map(Number);
  const first = numericSeries[0];
  const last = numericSeries[numericSeries.length - 1];
  const pctChange = ((last - first) / first) * 100;

  let direction = 'trendFlat';
  let demandLevel = 'demandMedium';
  let recommendationKey = 'goodTimeToSell';
  let cssClass = 'rec-go';
  let whyKey = 'whyFlat';

  if (pctChange > 4) {
    direction = 'trendIncreasing';
    demandLevel = 'demandHigh';
    recommendationKey = 'goodTimeToSell';
    cssClass = 'rec-go';
    whyKey = 'whyIncreasing';
  } else if (pctChange < -4) {
    direction = 'trendDecreasing';
    demandLevel = 'demandLow';
    recommendationKey = 'considerWaiting';
    cssClass = 'rec-wait';
    whyKey = 'whyDecreasing';
  }

  return {
    percentageChange: Math.round(pctChange * 100) / 100,
    direction,
    demandLevel,
    recommendationKey,
    cssClass,
    whyKey,
  };
}

module.exports = {
  QUALITY_MULTIPLIERS,
  LOCATION_SPREAD_FACTORS,
  convertToKg,
  calculateBuyerReturn,
  evaluatePriceTrend,
};
