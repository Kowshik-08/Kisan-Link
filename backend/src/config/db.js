const { PrismaClient } = require('@prisma/client');
const mockPrisma = require('./mockDb');

let activeClient;
let isMock = process.env.USE_MOCK_DB === 'true';

if (isMock) {
  activeClient = mockPrisma;
} else {
  try {
    activeClient = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch (err) {
    activeClient = mockPrisma;
    isMock = true;
  }
}

const prismaProxy = new Proxy({}, {
  get(target, prop) {
    if (prop === '$switchToMock') {
      return () => {
        isMock = true;
        activeClient = mockPrisma;
      };
    }
    if (prop === '$isMock') {
      return () => isMock;
    }
    const val = activeClient[prop];
    if (typeof val === 'function') {
      return val.bind(activeClient);
    }
    return val;
  },
  set(target, prop, value) {
    activeClient[prop] = value;
    return true;
  }
});

module.exports = prismaProxy;

