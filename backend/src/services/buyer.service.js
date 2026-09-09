const prisma = require('../config/db');
const ApiError = require('../utils/apiError');

class BuyerService {
  /**
   * Returns high-level statistics for the buyer dashboard overview.
   */
  static async getDashboardStats(userId) {
    const buyer = await prisma.buyer.findUnique({
      where: { userId },
    });

    if (!buyer) {
      throw ApiError.notFound('Buyer profile not found for this user.');
    }

    // Count open/active orders or deals
    const activeDeals = await prisma.order.count({
      where: {
        buyerId: buyer.id,
        dealStage: { notIn: ['COMPLETED_RATED'] },
      },
    });

    // Count completed deals
    const closedDeals = await prisma.order.count({
      where: {
        buyerId: buyer.id,
        dealStage: 'COMPLETED_RATED',
      },
    });

    // Total available harvest lots in database
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
    });
    const activeLotsCount = allProducts.filter((p) => p.slug && p.slug.startsWith('lot_')).length;

    return {
      activeListings: activeLotsCount,
      activeListingsNearYou: activeLotsCount,
      farmersContacted: buyer.totalDealsCount || activeDeals || 0,
      dealsClosedThisMonth: closedDeals,
      currentActiveDeals: activeDeals,
      reputationScore: Number(buyer.ratingAverage),
    };
  }

  /**
   * Fetches real-time feed of farmer produce listings for buyers to browse.
   */
  static async getFarmerListingsFeed(query = {}) {
    const { crop } = query;

    // Query active harvest lots (slug starts with 'lot_')
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    let lots = allProducts.filter((p) => p.slug && p.slug.startsWith('lot_'));

    if (crop) {
      lots = lots.filter((p) => p.name.toLowerCase() === crop.toLowerCase());
    }

    // Fetch all farmers for attribution
    const allFarmers = await prisma.farmer.findMany({
      include: {
        user: {
          select: {
            fullName: true,
            phone: true,
          },
        },
      },
    });
    const farmerMap = new Map(allFarmers.map((f) => [f.id, f]));

    const listings = lots.map((lot) => {
      let farmerId = lot.nameTe;
      if (!farmerId && lot.slug && lot.slug.startsWith('lot_')) {
        const parts = lot.slug.split('_');
        farmerId = parts[1];
      }

      const farmer = farmerMap.get(farmerId);
      const farmerName = farmer?.user?.fullName || 'Local Farmer';

      let qty = 500;
      let grade = 'GRADE_A';
      let loc = farmer ? `${farmer.village}, ${farmer.district}` : 'Warangal';

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

      const timeDiffMs = Date.now() - new Date(lot.updatedAt || lot.createdAt).getTime();
      const mins = Math.max(0, Math.floor(timeDiffMs / (1000 * 60)));
      let updatedHuman = 'recently';
      if (mins < 1) updatedHuman = 'just now';
      else if (mins < 60) updatedHuman = `${mins} min ago`;
      else {
        const hours = Math.floor(mins / 60);
        if (hours < 24) updatedHuman = `${hours} hr ago`;
        else updatedHuman = `${Math.floor(hours / 24)} d ago`;
      }

      return {
        id: lot.id,
        productId: lot.id,
        farmerId: farmerId || '',
        farmerName,
        village: loc,
        crop: lot.name,
        icon: lot.icon || '🌾',
        quantityDisplay: `${qty} kg`,
        quantityKg: qty,
        qualityGrade: grade,
        askPrice: `₹${Number(lot.basePrice)}/kg`,
        pricePerKg: Number(lot.basePrice),
        updatedHuman,
        createdAt: lot.createdAt,
      };
    });

    return listings;
  }

  /**
   * Allows a buyer to initiate outreach / send inquiry to a farmer.
   */
  static async inquireFarmer({ buyerUserId, farmerId, cropName, message }) {
    const buyer = await prisma.buyer.findUnique({
      where: { userId: buyerUserId },
    });

    if (!buyer) {
      throw ApiError.notFound('Buyer profile not found.');
    }

    const farmer = await prisma.farmer.findUnique({
      where: { id: farmerId },
      include: { user: true },
    });

    if (!farmer) {
      throw ApiError.notFound('Farmer record not found.');
    }

    // In a full messaging/lead system, this persists a lead record
    return {
      inquiryId: `INQ-${Date.now()}`,
      farmerName: farmer.user.fullName,
      farmerPhone: farmer.user.phone,
      crop: cropName || 'Produce',
      message: message || `Inquiry from ${buyer.businessName} regarding harvest procurement.`,
      status: 'SENT',
      createdAt: new Date().toISOString(),
    };
  }
}

module.exports = BuyerService;
