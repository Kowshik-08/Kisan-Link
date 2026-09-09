const prisma = require('../config/db');
const ApiError = require('../utils/apiError');
const { convertToKg } = require('../utils/calculation');

const STAGE_SEQUENCE = [
  'OFFER_SENT',
  'BUYER_ACCEPTED',
  'DEAL_CONFIRMED',
  'DISPATCHED',
  'DELIVERED',
  'PAID',
  'COMPLETED_RATED',
];

const STAGE_METADATA = {
  OFFER_SENT: {
    title: 'Offer sent',
    description: 'Your offer has been sent to the buyer with your price, quantity and quality grade.',
  },
  BUYER_ACCEPTED: {
    title: 'Buyer accepts',
    description: 'The buyer has reviewed and accepted your offer.',
  },
  DEAL_CONFIRMED: {
    title: 'Deal confirmed',
    description: 'Both sides have confirmed the deal terms — price, quantity and pickup details.',
  },
  DISPATCHED: {
    title: 'Dispatch',
    description: 'Produce has been dispatched from your location toward the buyer.',
  },
  DELIVERED: {
    title: 'Delivery',
    description: 'The buyer has received and inspected the delivery.',
  },
  PAID: {
    title: 'Payment',
    description: 'Payment has been released to your account.',
  },
  COMPLETED_RATED: {
    title: 'Rate buyer',
    description: 'Deal complete! Please rate the buyer to help other farmers.',
  },
};

class OrderService {
  /**
   * Generates a unique human-friendly deal code e.g. "KL-2026-8742"
   */
  static generateOrderNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `KL-${year}-${random}`;
  }

  /**
   * Creates a new deal/order between a farmer and a buyer.
   */
  static async createOrder({
    farmerUserId,
    buyerId,
    productId,
    quantity,
    unit = 'KG',
    qualityGrade = 'GRADE_A',
    agreedPricePerKg,
    transportCost,
    marketFee,
    handlingCost,
    netAmount,
    distanceKm = 10,
    pickupAddressId,
    deliveryAddressId,
  }) {
    let farmer = await prisma.farmer.findUnique({
      where: { userId: farmerUserId },
    });

    let buyer = buyerId ? await prisma.buyer.findUnique({ where: { id: buyerId } }) : null;

    // If initiated by a buyer
    if (!farmer) {
      const isBuyer = await prisma.buyer.findUnique({
        where: { userId: farmerUserId },
      });
      if (isBuyer) {
        buyer = isBuyer;
        farmer = await prisma.farmer.findFirst();
      }
    }

    if (!farmer) {
      farmer = await prisma.farmer.findFirst();
    }
    if (!buyer) {
      buyer = await prisma.buyer.findFirst();
    }

    if (!farmer || !buyer) {
      throw ApiError.badRequest('Both a farmer and buyer participant are required to initiate a deal.');
    }

    let product = productId ? await prisma.product.findUnique({ where: { id: productId } }) : null;
    if (!product) {
      product = await prisma.product.findFirst({ where: { isActive: true } });
    }

    if (!product) {
      throw ApiError.notFound('Crop product was not found.');
    }

    const quantityKg = convertToKg(quantity, unit);
    const unitPrice = Number(agreedPricePerKg) || Number(product.basePrice);
    const gross = Math.round(unitPrice * quantityKg);

    const transport = transportCost !== undefined ? Number(transportCost) : Math.round(distanceKm * 2.1 * (quantityKg / 100));
    const fee = marketFee !== undefined ? Number(marketFee) : Math.round(gross * Number(buyer.commissionRate));
    const handling = handlingCost !== undefined ? Number(handlingCost) : Math.round(40 + quantityKg * 0.06);
    const net = netAmount !== undefined ? Number(netAmount) : Math.round(gross - transport - fee - handling);

    const orderNumber = this.generateOrderNumber();

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          farmerId: farmer.id,
          buyerId: buyer.id,
          dealStage: 'OFFER_SENT',
          paymentStatus: 'PENDING',
          distanceKm: Number(distanceKm),
          grossAmount: gross,
          transportCost: transport,
          marketFee: fee,
          handlingCost: handling,
          netAmount: net,
          pickupAddressId: pickupAddressId || null,
          deliveryAddressId: deliveryAddressId || null,
          items: {
            create: [
              {
                productId: product.id,
                quantity: Number(quantity),
                unit: (unit || 'KG').toUpperCase(),
                quantityInKg: quantityKg,
                qualityGrade: (qualityGrade || 'GRADE_A').toUpperCase(),
                pricePerKg: unitPrice,
                totalPrice: gross,
              },
            ],
          },
        },
        include: {
          farmer: { include: { user: { select: { fullName: true, phone: true } } } },
          buyer: { include: { user: { select: { fullName: true, phone: true } } } },
          items: { include: { product: true } },
        },
      });

      return newOrder;
    });

    return {
      order,
      lifecycle: {
        currentStage: order.dealStage,
        stageTitle: STAGE_METADATA[order.dealStage].title,
        stageDescription: STAGE_METADATA[order.dealStage].description,
        stageIndex: 0,
        totalStages: STAGE_SEQUENCE.length,
        allStages: STAGE_SEQUENCE.map((s) => STAGE_METADATA[s].title),
      },
    };
  }

  /**
   * Advances the 7-stage state machine for a deal.
   */
  static async advanceStage(orderId, userId, userRole) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        farmer: true,
        buyer: true,
      },
    });

    if (!order) {
      throw ApiError.notFound('Order not found.');
    }

    // Check authorization: must be either the farmer, the buyer, or an admin
    const isFarmer = order.farmer.userId === userId;
    const isBuyer = order.buyer.userId === userId;
    const isAdmin = userRole === 'ADMIN';

    if (!isFarmer && !isBuyer && !isAdmin) {
      throw ApiError.forbidden('You are not authorized to update this order.');
    }

    const currentIndex = STAGE_SEQUENCE.indexOf(order.dealStage);
    if (currentIndex === -1 || currentIndex >= STAGE_SEQUENCE.length - 1) {
      throw ApiError.badRequest('This deal is already completed.');
    }

    const nextStage = STAGE_SEQUENCE[currentIndex + 1];
    const updateData = { dealStage: nextStage };

    // When reaching payment or completion, update payment status
    if (nextStage === 'PAID' || nextStage === 'COMPLETED_RATED') {
      updateData.paymentStatus = 'RELEASED';
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        farmer: { include: { user: { select: { fullName: true, phone: true } } } },
        buyer: { include: { user: { select: { fullName: true, phone: true } } } },
        items: { include: { product: true } },
      },
    });

    const nextIndex = currentIndex + 1;

    return {
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      previousStage: order.dealStage,
      currentStage: nextStage,
      stageTitle: STAGE_METADATA[nextStage].title,
      stageDescription: STAGE_METADATA[nextStage].description,
      stageIndex: nextIndex,
      isCompleted: nextIndex >= STAGE_SEQUENCE.length - 1,
    };
  }

  /**
   * Fetches orders associated with the user (Farmer or Buyer).
   */
  static async getUserOrders(userId, userRole) {
    let where = {};

    if (userRole === 'FARMER') {
      const farmer = await prisma.farmer.findUnique({ where: { userId } });
      if (!farmer) return [];
      where = { farmerId: farmer.id };
    } else if (userRole === 'BUYER') {
      const buyer = await prisma.buyer.findUnique({ where: { userId } });
      if (!buyer) return [];
      where = { buyerId: buyer.id };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        farmer: { include: { user: { select: { fullName: true, phone: true } } } },
        buyer: { include: { user: { select: { fullName: true, phone: true } } } },
        items: { include: { product: true } },
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  }

  /**
   * Fetches an order by its ID or orderNumber.
   */
  static async getOrderById(identifier, userId, userRole) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      identifier
    );

    let order = null;
    if (isUuid) {
      order = await prisma.order.findUnique({
        where: { id: identifier },
        include: {
          farmer: { include: { user: { select: { fullName: true, phone: true } } } },
          buyer: { include: { user: { select: { fullName: true, phone: true } } } },
          items: { include: { product: true } },
          pickupAddress: true,
          deliveryAddress: true,
          review: true,
        },
      });
    } else {
      order = await prisma.order.findUnique({
        where: { orderNumber: identifier },
        include: {
          farmer: { include: { user: { select: { fullName: true, phone: true } } } },
          buyer: { include: { user: { select: { fullName: true, phone: true } } } },
          items: { include: { product: true } },
          pickupAddress: true,
          deliveryAddress: true,
          review: true,
        },
      });
      // Fallback
      if (!order) {
        order = await prisma.order.findUnique({
          where: { id: identifier },
          include: {
            farmer: { include: { user: { select: { fullName: true, phone: true } } } },
            buyer: { include: { user: { select: { fullName: true, phone: true } } } },
            items: { include: { product: true } },
            pickupAddress: true,
            deliveryAddress: true,
            review: true,
          },
        });
      }
    }

    if (!order) {
      throw ApiError.notFound(`Order "${identifier}" was not found.`);
    }

    if (userRole !== 'ADMIN' && order.farmer.userId !== userId && order.buyer.userId !== userId) {
      throw ApiError.forbidden('You are not authorized to view this order.');
    }

    const currentIndex = STAGE_SEQUENCE.indexOf(order.dealStage);

    return {
      order,
      lifecycle: {
        currentStage: order.dealStage,
        stageTitle: STAGE_METADATA[order.dealStage].title,
        stageDescription: STAGE_METADATA[order.dealStage].description,
        stageIndex: currentIndex,
        totalStages: STAGE_SEQUENCE.length,
        allStages: STAGE_SEQUENCE.map((s) => STAGE_METADATA[s].title),
      },
    };
  }
}

module.exports = OrderService;
