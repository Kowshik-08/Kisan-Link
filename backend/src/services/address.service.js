const prisma = require('../config/db');
const ApiError = require('../utils/apiError');

class AddressService {
  static async getUserAddresses(userId) {
    return prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  }

  static async createAddress(userId, data) {
    const { title, street, village, mandal, district, state = 'Telangana', pincode, latitude, longitude, isDefault } = data;

    if (!district || !village) {
      throw ApiError.badRequest('Village and district are required fields.');
    }

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return prisma.address.create({
      data: {
        userId,
        title,
        street,
        village,
        mandal,
        district,
        state,
        pincode,
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        isDefault: Boolean(isDefault),
      },
    });
  }

  static async updateAddress(userId, addressId, data) {
    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== userId) {
      throw ApiError.notFound('Address not found or unauthorized.');
    }

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return prisma.address.update({
      where: { id: addressId },
      data,
    });
  }

  static async deleteAddress(userId, addressId) {
    const address = await prisma.address.findUnique({ where: { id: addressId } });
    if (!address || address.userId !== userId) {
      throw ApiError.notFound('Address not found or unauthorized.');
    }

    await prisma.address.delete({ where: { id: addressId } });
    return { id: addressId, deleted: true };
  }
}

module.exports = AddressService;
