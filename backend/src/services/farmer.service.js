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

    const baseProducts = products.filter((p) => !p.slug || !p.slug.startsWith('lot_'));

    const prices = baseProducts.map((p) => ({
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

    if (!farmer) {
      return [];
    }

    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const farmerLots = allProducts.filter((p) =>
      p.slug && (p.slug.startsWith(`lot_${farmer.id}`) || p.nameTe === farmer.id)
    );

    return farmerLots.map((lot) => {
      let qty = 500;
      let grade = 'GRADE_A';
      let loc = `${farmer.village}, ${farmer.district}`;

      if (lot.nameHi && lot.nameHi.includes('|')) {
        const parts = lot.nameHi.split('|');
        if (parts[0] && !isNaN(parts[0])) qty = Number(parts[0]);
        if (parts[1]) grade = parts[1];
        if (parts[2]) loc = parts[2];
      } else if (lot.slug && lot.slug.startsWith('lot_')) {
        const parts = lot.slug.split('_');
        if (parts.length >= 4) {
          if (!isNaN(parts[2])) qty = Number(parts[2]);
          if (parts[3]) grade = parts[3];
        }
      }

      return {
        id: lot.id,
        commodity: lot.name,
        name: lot.name,
        icon: lot.icon || '🌾',
        quantityAvailableKg: qty,
        basePricePerKg: Number(lot.basePrice),
        qualityGrade: grade,
        mandiLocation: loc,
        createdAt: lot.createdAt,
      };
    });
  }

  /**
   * Creates a new harvest lot listing for a farmer.
   */
  static async createHarvestLot(farmerUserId, data) {
    const { commodity, qualityGrade, quantityAvailableKg, basePricePerKg, mandiLocation } = data;

    const farmer = await prisma.farmer.findUnique({
      where: { userId: farmerUserId },
    });

    if (!farmer) {
      throw ApiError.notFound('Farmer profile not found.');
    }

    const allProducts = await prisma.product.findMany({ where: { isActive: true } });
    const baseProduct = allProducts.find(
      (p) => (!p.slug || !p.slug.startsWith('lot_')) && p.name.toLowerCase() === (commodity || '').toLowerCase()
    );

    const cat = baseProduct
      ? { id: baseProduct.categoryId }
      : (await prisma.category.findFirst()) || { id: '11111111-1111-4111-a111-111111111111' };

    const cleanName = baseProduct ? baseProduct.name : (commodity || 'Produce');
    const icon = baseProduct ? baseProduct.icon : '🌾';
    const qtyKg = Number(quantityAvailableKg) || 500;
    const price = Number(basePricePerKg) || (baseProduct ? Number(baseProduct.basePrice) : 20);
    const grade = qualityGrade || 'GRADE_A';
    const loc = mandiLocation || `${farmer.village}, ${farmer.district}`;

    const slug = `lot_${farmer.id}_${qtyKg}_${grade}_${Date.now()}`;

    const product = await prisma.product.create({
      data: {
        name: cleanName,
        slug,
        icon,
        basePrice: price,
        standardUnit: 'KG',
        priceTrend: [price],
        categoryId: cat.id,
        nameTe: farmer.id,
        nameHi: `${qtyKg}|${grade}|${loc}`,
        isActive: true,
      },
    });

    return {
      id: product.id,
      commodity: product.name,
      qualityGrade: grade,
      quantityAvailableKg: qtyKg,
      basePricePerKg: Number(product.basePrice),
      mandiLocation: loc,
      createdAt: product.createdAt,
    };
  }

  /**
   * Deletes a harvest lot listing for a farmer.
   */
  static async deleteHarvestLot(farmerUserId, lotId) {
    const farmer = await prisma.farmer.findUnique({
      where: { userId: farmerUserId },
    });

    if (!farmer) {
      throw ApiError.notFound('Farmer profile not found.');
    }

    const lot = await prisma.product.findUnique({
      where: { id: lotId },
    });

    if (!lot) {
      throw ApiError.notFound('Harvest lot not found.');
    }

    if (lot.nameTe !== farmer.id && (!lot.slug || !lot.slug.startsWith(`lot_${farmer.id}`))) {
      throw ApiError.forbidden('You can only delete your own harvest lots.');
    }

    await prisma.product.delete({
      where: { id: lot.id },
    });

    return { id: lot.id, deleted: true };
  }
}

module.exports = FarmerService;
