const prisma = require('../config/db');
const ApiError = require('../utils/apiError');

class ProductService {
  /**
   * Retrieves products with search, category filtering, and price bounds.
   */
  static async getAllProducts(query = {}) {
    const { search, category, minPrice, maxPrice, isActive = 'true' } = query;

    const where = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (category) {
      where.category = {
        is: {
          OR: [{ slug: category.toLowerCase() }, { id: category }],
        },
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search.toLowerCase() } },
        { nameTe: { contains: search } },
        { nameHi: { contains: search } },
      ];
    }

    if (minPrice || maxPrice) {
      where.basePrice = {};
      if (minPrice) where.basePrice.gte = Number(minPrice);
      if (maxPrice) where.basePrice.lte = Number(maxPrice);
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Return only primary catalog commodities (exclude farmer harvest lots)
    return products.filter((p) => !p.slug || !p.slug.startsWith('lot_'));
  }

  /**
   * Retrieves a single product by ID or slug.
   */
  static async getProductByIdOrSlug(identifier) {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      identifier
    );

    let product = null;

    if (isUuid) {
      product = await prisma.product.findUnique({
        where: { id: identifier },
        include: { category: true },
      });
    } else {
      product = await prisma.product.findUnique({
        where: { slug: identifier.toLowerCase() },
        include: { category: true },
      });
      // Fallback for non-UUID identifiers
      if (!product) {
        product = await prisma.product.findUnique({
          where: { id: identifier },
          include: { category: true },
        });
      }
    }

    if (!product) {
      throw ApiError.notFound(`Product with identifier "${identifier}" was not found.`);
    }

    return product;
  }

  /**
   * Creates a new product commodity.
   */
  static async createProduct(data) {
    const {
      name,
      slug,
      nameTe,
      nameHi,
      icon,
      basePrice,
      standardUnit = 'KG',
      priceTrend = [],
      categoryId,
    } = data;

    const existing = await prisma.product.findUnique({
      where: { slug: slug.toLowerCase() },
    });

    if (existing) {
      throw ApiError.conflict(`Product with slug "${slug}" already exists.`);
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug: slug.toLowerCase(),
        nameTe,
        nameHi,
        icon: icon || '🌾',
        basePrice: Number(basePrice),
        standardUnit: (standardUnit || 'KG').toUpperCase(),
        priceTrend: priceTrend.length > 0 ? priceTrend.map(Number) : [Number(basePrice)],
        categoryId,
      },
      include: { category: true },
    });

    return product;
  }

  /**
   * Updates an existing product commodity.
   */
  static async updateProduct(id, data) {
    const existing = await this.getProductByIdOrSlug(id);

    const updateData = { ...data };
    if (updateData.basePrice !== undefined) updateData.basePrice = Number(updateData.basePrice);
    if (updateData.standardUnit) updateData.standardUnit = updateData.standardUnit.toUpperCase();
    if (updateData.priceTrend) updateData.priceTrend = updateData.priceTrend.map(Number);

    const updated = await prisma.product.update({
      where: { id: existing.id },
      data: updateData,
      include: { category: true },
    });

    return updated;
  }

  /**
   * Deletes a product.
   */
  static async deleteProduct(id) {
    const existing = await this.getProductByIdOrSlug(id);
    await prisma.product.delete({ where: { id: existing.id } });
    return { id: existing.id, deleted: true };
  }

  /**
   * Category Management: Fetches all categories.
   */
  static async getAllCategories() {
    return prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Category Management: Creates a category.
   */
  static async createCategory({ name, slug, description }) {
    const cleanSlug = (slug || name.toLowerCase().replace(/\s+/g, '-')).toLowerCase();
    const existing = await prisma.category.findUnique({ where: { slug: cleanSlug } });

    if (existing) {
      throw ApiError.conflict(`Category with slug "${cleanSlug}" already exists.`);
    }

    return prisma.category.create({
      data: { name, slug: cleanSlug, description },
    });
  }
}

module.exports = ProductService;
