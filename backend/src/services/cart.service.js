const prisma = require('../config/db');
const ApiError = require('../utils/apiError');

class CartService {
  /**
   * Retrieves or initializes the user's active trade/lot cart.
   */
  static async getCart(userId) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
                basePrice: true,
                standardUnit: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: { items: { include: { product: true } } },
      });
    }

    // Compute summary totals for staged trade lots
    const totalItems = cart.items.length;
    const totalQuantityKg = cart.items.reduce((sum, item) => {
      const q = Number(item.quantity);
      return sum + (item.unit === 'QUINTAL' ? q * 100 : q);
    }, 0);

    return {
      cartId: cart.id,
      userId: cart.userId,
      totalItems,
      totalQuantityKg,
      items: cart.items,
    };
  }

  /**
   * Adds an agricultural lot item to the cart.
   */
  static async addItem(userId, { productId, quantity, unit = 'KG', qualityGrade = 'GRADE_A', targetPricePerKg }) {
    const cart = await this.getCart(userId);

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw ApiError.notFound('Product commodity not found.');
    }

    const normalizedUnit = (unit || 'KG').toUpperCase();
    const normalizedGrade = (qualityGrade || 'GRADE_A').toUpperCase();

    // Check if item with exact product and quality grade already exists
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId_qualityGrade: {
          cartId: cart.cartId,
          productId,
          qualityGrade: normalizedGrade,
        },
      },
    });

    if (existingItem) {
      // Increment quantity
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: Number(existingItem.quantity) + Number(quantity),
          unit: normalizedUnit,
          targetPricePerKg: targetPricePerKg ? Number(targetPricePerKg) : existingItem.targetPricePerKg,
        },
        include: { product: true },
      });
      return updatedItem;
    }

    const newItem = await prisma.cartItem.create({
      data: {
        cartId: cart.cartId,
        productId,
        quantity: Number(quantity),
        unit: normalizedUnit,
        qualityGrade: normalizedGrade,
        targetPricePerKg: targetPricePerKg ? Number(targetPricePerKg) : Number(product.basePrice),
      },
      include: { product: true },
    });

    return newItem;
  }

  /**
   * Updates an existing cart item.
   */
  static async updateItem(userId, cartItemId, { quantity, unit, qualityGrade, targetPricePerKg }) {
    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!item || !item.cart || item.cart.userId !== userId) {
      throw ApiError.notFound('Cart item not found or unauthorized.');
    }

    const data = {};
    if (quantity !== undefined) data.quantity = Number(quantity);
    if (unit) data.unit = unit.toUpperCase();
    if (qualityGrade) data.qualityGrade = qualityGrade.toUpperCase();
    if (targetPricePerKg !== undefined) data.targetPricePerKg = Number(targetPricePerKg);

    return prisma.cartItem.update({
      where: { id: cartItemId },
      data,
      include: { product: true },
    });
  }

  /**
   * Removes an item from the cart.
   */
  static async removeItem(userId, cartItemId) {
    const item = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
      include: { cart: true },
    });

    if (!item || !item.cart || item.cart.userId !== userId) {
      throw ApiError.notFound('Cart item not found or unauthorized.');
    }

    await prisma.cartItem.delete({ where: { id: cartItemId } });
    return { id: cartItemId, removed: true };
  }

  /**
   * Clears all items in the cart.
   */
  static async clearCart(userId) {
    const cart = await this.getCart(userId);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.cartId } });
    return { cartId: cart.cartId, cleared: true };
  }
}

module.exports = CartService;
