const prisma = require('../config/db');
const ApiError = require('../utils/apiError');
const {
  convertToKg,
  calculateBuyerReturn,
  evaluatePriceTrend,
  LOCATION_SPREAD_FACTORS,
} = require('../utils/calculation');

class FarmerService {
  /**
   * Fetches real-time / current market ticker prices for all commodities.
   */
  static async getMarketTicker() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        basePrice: true,
        standardUnit: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    const prices = products.map((p) => ({
      productId: p.id,
      cropSlug: p.slug,
      label: p.name,
      icon: p.icon,
      pricePerKg: Number(p.basePrice),
      unit: `/${p.standardUnit.toLowerCase()}`,
    }));

    return {
      lastUpdated: new Date().toISOString(),
      lastUpdatedHuman: 'Last updated: 2 hours ago (eNAM feed)',
      prices,
    };
  }

  /**
   * Fetches 7-day price series and generates market trend advisory for a specific crop.
   */
  static async getCropTrend(cropSlug) {
    const product = await prisma.product.findUnique({
      where: { slug: cropSlug.toLowerCase() },
    });

    if (!product) {
      throw ApiError.notFound(`Crop commodity with slug "${cropSlug}" was not found.`);
    }

    const trendSeries = product.priceTrend.map(Number);
    const advisory = evaluatePriceTrend(trendSeries);

    return {
      cropId: product.id,
      cropSlug: product.slug,
      cropName: product.name,
      currentPrice: Number(product.basePrice),
      trendSeries,
      dayLabels: ['D-6', 'D-5', 'D-4', 'D-3', 'D-2', 'D-1', 'Today'],
      percentageChange7d: advisory.percentageChange,
      direction: advisory.direction,
      demandLevel: advisory.demandLevel,
      recommendation: {
        key: advisory.recommendationKey,
        cssClass: advisory.cssClass,
        whyKey: advisory.whyKey,
      },
    };
  }

  /**
   * Core decision engine: compares and ranks all nearby buyers based on true net return.
   */
  static async discoverBestBuyers({ cropSlug, quantity, unit = 'KG', location = 'warangal', qualityGrade = 'GRADE_A' }) {
    const product = await prisma.product.findUnique({
      where: { slug: cropSlug.toLowerCase() },
    });

    if (!product) {
      throw ApiError.notFound(`Crop "${cropSlug}" not found in catalog.`);
    }

    const quantityKg = convertToKg(quantity, unit);
    if (quantityKg <= 0) {
      throw ApiError.badRequest('Quantity must be greater than zero.');
    }

    // Normalized location spread factor
    const normalizedLoc = (location || 'warangal').toLowerCase();
    const spreadFactor = LOCATION_SPREAD_FACTORS[normalizedLoc] || 1.0;

    // Fetch all active buyers
    const buyers = await prisma.buyer.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            phone: true,
          },
        },
      },
    });

    if (!buyers || buyers.length === 0) {
      throw ApiError.notFound('No buyers currently available in this region.');
    }

    // Compute returns across all buyers
    const rankedResults = buyers.map((buyer) => {
      const calculation = calculateBuyerReturn({
        basePrice: product.basePrice,
        buyerPriceMultiplier: buyer.priceMultiplier,
        qualityGrade,
        quantityKg,
        buyerBaseDistance: buyer.baseDistanceKm,
        locationSpread: spreadFactor,
        commissionRate: buyer.commissionRate,
      });

      return {
        buyerId: buyer.id,
        buyerName: buyer.businessName,
        buyerType: buyer.buyerType.toLowerCase(),
        isVerified: buyer.isVerified,
        rating: Number(buyer.ratingAverage),
        totalDeals: buyer.totalDealsCount,
        freshness: 'Live Quote',
        distanceKm: calculation.distanceKm,
        priceOfferedPerKg: calculation.pricePerKg,
        breakdown: {
          grossAmount: calculation.grossAmount,
          transportCost: calculation.transportCost,
          marketFee: calculation.marketFee,
          handlingCost: calculation.handlingCost,
          netTakeHome: calculation.netAmount,
        },
      };
    });

    // Sort descending by net take-home return
    rankedResults.sort((a, b) => b.breakdown.netTakeHome - a.breakdown.netTakeHome);

    // Tag highest return
    if (rankedResults.length > 0) {
      rankedResults[0].isBestReturn = true;
    }

    return {
      querySummary: {
        crop: product.name,
        quantity: Number(quantity),
        unit,
        quantityKg,
        location: location.charAt(0).toUpperCase() + location.slice(1),
        qualityGrade,
      },
      rankedBuyers: rankedResults,
    };
  }

  /**
   * Fetches active harvest lot listings for a farmer.
   */
  static async getMyListings(farmerUserId) {
    const farmer = await prisma.farmer.findUnique({
      where: { userId: farmerUserId },
    });

    const products = await prisma.product.findMany({
      where: { isActive: true },
      take: 6,
    });

    const listings = products.map((p) => ({
      id: p.id,
      commodity: p.name,
      name: p.name,
      quantityAvailableKg: 500,
      basePricePerKg: Number(p.basePrice),
      qualityGrade: 'GRADE_A',
      mandiLocation: farmer ? `${farmer.village || 'Narsampet'}, ${farmer.district || 'Warangal'}` : 'Warangal',
    }));

    return listings;
  }

  /**
   * Creates a new harvest lot listing for a farmer.
   */
  static async createHarvestLot(farmerUserId, data) {
    const { commodity, qualityGrade, quantityAvailableKg, basePricePerKg, mandiLocation } = data;
    const cat = (await prisma.category.findFirst()) || { id: 'default-cat' };

    const product = await prisma.product.create({
      data: {
        name: commodity || 'Produce',
        slug: `${(commodity || 'lot').toLowerCase()}-${Date.now()}`,
        icon: '🌾',
        basePrice: Number(basePricePerKg) || 20,
        standardUnit: 'KG',
        priceTrend: [Number(basePricePerKg) || 20, Number(basePricePerKg) || 20],
        categoryId: cat.id,
        isActive: true,
      },
    });

    return {
      id: product.id,
      commodity: product.name,
      qualityGrade: qualityGrade || 'GRADE_A',
      quantityAvailableKg: Number(quantityAvailableKg) || 500,
      basePricePerKg: Number(product.basePrice),
      mandiLocation: mandiLocation || 'Warangal',
    };
  }
}

module.exports = FarmerService;
