const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting KisanLink database seed...');

  // 1. Clean existing records (in reverse dependency order)
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.farmer.deleteMany();
  await prisma.buyer.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database tables.');

  const hashedPassword = await bcrypt.hash('password123', 10);
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);

  // 2. Seed Users & Profiles
  // Farmer 1: Ramesh Patil
  const userFarmer1 = await prisma.user.create({
    data: {
      phone: '9876543210',
      fullName: 'Ramesh Patil',
      passwordHash: hashedPassword,
      role: 'FARMER',
      preferredLanguage: 'EN',
      farmer: {
        create: {
          village: 'Narsampet',
          mandal: 'Narsampet',
          district: 'Warangal',
          state: 'Telangana',
          landSizeAcres: 4.5,
          upiId: 'rameshpatil@upi',
          bankAccountNumber: '123456789012',
          bankIfsc: 'SBIN0001234'
        }
      },
      cart: {
        create: {}
      }
    },
    include: { farmer: true }
  });

  // Farmer 2: Sunita Jadhav
  const userFarmer2 = await prisma.user.create({
    data: {
      phone: '9876543211',
      fullName: 'Sunita Jadhav',
      passwordHash: hashedPassword,
      role: 'FARMER',
      preferredLanguage: 'TE',
      farmer: {
        create: {
          village: 'ReddyPalem',
          mandal: 'Hanamkonda',
          district: 'Warangal',
          state: 'Telangana',
          landSizeAcres: 3.0,
          upiId: 'sunitaj@upi'
        }
      },
      cart: {
        create: {}
      }
    },
    include: { farmer: true }
  });

  // Buyer 1: Warangal APMC Market (MANDI)
  const userBuyer1 = await prisma.user.create({
    data: {
      phone: '9123456780',
      fullName: 'Warangal APMC Market',
      passwordHash: hashedPassword,
      role: 'BUYER',
      preferredLanguage: 'EN',
      buyer: {
        create: {
          businessName: 'Warangal APMC Market',
          buyerType: 'MANDI',
          commissionRate: 0.06,
          priceMultiplier: 1.00,
          baseDistanceKm: 12,
          isVerified: true,
          ratingAverage: 4.6,
          totalDealsCount: 212,
          licenseNumber: 'APMC-WGL-2024-001'
        }
      },
      cart: {
        create: {}
      }
    },
    include: { buyer: true }
  });

  // Buyer 2: Sahyadri Farmers FPO (FPO)
  const userBuyer2 = await prisma.user.create({
    data: {
      phone: '9123456781',
      fullName: 'Sahyadri Farmers FPO',
      passwordHash: hashedPassword,
      role: 'BUYER',
      preferredLanguage: 'EN',
      buyer: {
        create: {
          businessName: 'Sahyadri Farmers FPO',
          buyerType: 'FPO',
          commissionRate: 0.03,
          priceMultiplier: 1.05,
          baseDistanceKm: 22,
          isVerified: true,
          ratingAverage: 4.8,
          totalDealsCount: 340,
          licenseNumber: 'FPO-SYD-2023-089'
        }
      },
      cart: {
        create: {}
      }
    },
    include: { buyer: true }
  });

  // Buyer 3: Green Harvest Traders (PRIVATE)
  const userBuyer3 = await prisma.user.create({
    data: {
      phone: '9123456782',
      fullName: 'Green Harvest Traders',
      passwordHash: hashedPassword,
      role: 'BUYER',
      preferredLanguage: 'EN',
      buyer: {
        create: {
          businessName: 'Green Harvest Traders',
          buyerType: 'PRIVATE',
          commissionRate: 0.02,
          priceMultiplier: 0.94,
          baseDistanceKm: 8,
          isVerified: true,
          ratingAverage: 4.1,
          totalDealsCount: 76,
          licenseNumber: 'PVT-GHT-2022-104'
        }
      },
      cart: {
        create: {}
      }
    },
    include: { buyer: true }
  });

  // Admin User
  await prisma.user.create({
    data: {
      adminCode: 'ADMIN001',
      fullName: 'KisanLink Administrator',
      passwordHash: hashedAdminPassword,
      role: 'ADMIN',
      preferredLanguage: 'EN'
    }
  });

  console.log('👤 Seeded users, farmers, buyers, and admin.');

  // 3. Seed Addresses
  const addressFarmer1 = await prisma.address.create({
    data: {
      userId: userFarmer1.id,
      title: 'Patil Farmstead',
      village: 'Narsampet',
      mandal: 'Narsampet',
      district: 'Warangal',
      state: 'Telangana',
      pincode: '506132',
      isDefault: true
    }
  });

  const addressBuyer1 = await prisma.address.create({
    data: {
      userId: userBuyer1.id,
      title: 'APMC Yard Gate 1',
      village: 'Enumamula',
      mandal: 'Warangal Urban',
      district: 'Warangal',
      state: 'Telangana',
      pincode: '506002',
      isDefault: true
    }
  });

  console.log('📍 Seeded addresses.');

  // 4. Seed Categories
  const catVegetables = await prisma.category.create({
    data: {
      name: 'Perishable Vegetables',
      slug: 'vegetables',
      description: 'Short shelf-life horticulture produce requiring swift market linkage.'
    }
  });

  const catOilseeds = await prisma.category.create({
    data: {
      name: 'Oilseeds',
      slug: 'oilseeds',
      description: 'Commercial oilseed cash crops.'
    }
  });

  const catCommercial = await prisma.category.create({
    data: {
      name: 'Commercial & Fiber Crops',
      slug: 'commercial',
      description: 'Textile and industrial staple crops.'
    }
  });

  const catGrains = await prisma.category.create({
    data: {
      name: 'Food Grains & Cereals',
      slug: 'grains',
      description: 'Paddy, wheat and staple grain crops.'
    }
  });

  console.log('🏷️ Seeded categories.');

  // 5. Seed Products (Crops from KisanLink Frontend)
  const productTomato = await prisma.product.create({
    data: {
      name: 'Tomato',
      slug: 'tomato',
      nameTe: 'టమాటా',
      nameHi: 'टमाटर',
      icon: '🍅',
      basePrice: 18.00,
      standardUnit: 'KG',
      priceTrend: [14.0, 15.0, 15.0, 17.0, 16.0, 18.0, 18.0],
      categoryId: catVegetables.id
    }
  });

  const productOnion = await prisma.product.create({
    data: {
      name: 'Onion',
      slug: 'onion',
      nameTe: 'ఉల్లిపాయ',
      nameHi: 'प्याज़',
      icon: '🧅',
      basePrice: 14.00,
      standardUnit: 'KG',
      priceTrend: [16.0, 15.0, 15.0, 14.0, 14.0, 13.0, 14.0],
      categoryId: catVegetables.id
    }
  });

  const productSoybean = await prisma.product.create({
    data: {
      name: 'Soybean',
      slug: 'soybean',
      nameTe: 'సోయాబీన్',
      nameHi: 'सोयाबीन',
      icon: '🌱',
      basePrice: 44.00,
      standardUnit: 'KG',
      priceTrend: [41.0, 42.0, 43.0, 43.0, 44.0, 44.0, 44.0],
      categoryId: catOilseeds.id
    }
  });

  const productCotton = await prisma.product.create({
    data: {
      name: 'Cotton',
      slug: 'cotton',
      nameTe: 'పత్తి',
      nameHi: 'कपास',
      icon: '🌾',
      basePrice: 62.00,
      standardUnit: 'KG',
      priceTrend: [58.0, 59.0, 60.0, 61.0, 61.0, 62.0, 62.0],
      categoryId: catCommercial.id
    }
  });

  const productWheat = await prisma.product.create({
    data: {
      name: 'Wheat',
      slug: 'wheat',
      nameTe: 'గోధుమ',
      nameHi: 'गेहूं',
      icon: '🌿',
      basePrice: 24.00,
      standardUnit: 'KG',
      priceTrend: [25.0, 25.0, 24.0, 24.0, 24.0, 24.0, 24.0],
      categoryId: catGrains.id
    }
  });

  console.log('🌾 Seeded 5 primary agricultural commodities.');

  // 6. Seed a completed Order with Review (Stage 7 Demo)
  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'KL-2026-9041',
      farmerId: userFarmer1.farmer.id,
      buyerId: userBuyer2.buyer.id,
      dealStage: 'COMPLETED_RATED',
      paymentStatus: 'RELEASED',
      distanceKm: 22,
      grossAmount: 9450.00,
      transportCost: 231.00,
      marketFee: 284.00,
      handlingCost: 70.00,
      netAmount: 8865.00,
      pickupAddressId: addressFarmer1.id,
      deliveryAddressId: addressBuyer1.id,
      items: {
        create: [
          {
            productId: productTomato.id,
            quantity: 500.0,
            unit: 'KG',
            quantityInKg: 500.0,
            qualityGrade: 'GRADE_A',
            pricePerKg: 18.90,
            totalPrice: 9450.00
          }
        ]
      }
    }
  });

  await prisma.review.create({
    data: {
      orderId: order1.id,
      reviewerId: userFarmer1.id,
      revieweeId: userBuyer2.id,
      rating: 5,
      comment: 'Excellent FPO cooperation. Fair weighing and immediate payment release.'
    }
  });

  console.log('📦 Seeded initial deals and review.');
  console.log('✅ KisanLink database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
