const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { readStore, writeStore } = require('../config/database');

class UserRecord {
  constructor(data) { Object.assign(this, data); }
  async comparePassword(candidatePassword) { return bcrypt.compare(candidatePassword, this.password); }
}

class User {
  static async create(data) {
    const store = readStore();
    if (store.users.some(u => u.email.toLowerCase() === String(data.email).toLowerCase())) {
      throw new Error('Email already registered');
    }
    const user = {
      user_id: crypto.randomUUID(),
      email: String(data.email).trim().toLowerCase(),
      password: await bcrypt.hash(String(data.password), 10),
      role: data.role,
      createdAt: new Date().toISOString()
    };
    store.users.push(user);
    writeStore(store);
    return new UserRecord(user);
  }

  static async findOne({ where = {} } = {}) {
    const store = readStore();
    const user = store.users.find(item => Object.entries(where).every(([key, value]) => item[key] === value));
    return user ? new UserRecord(user) : null;
  }

  static async findAll({ where = {}, attributes } = {}) {
    const store = readStore();
    return store.users
      .filter(item => Object.entries(where).every(([key, value]) => Array.isArray(value) ? value.includes(item[key]) : item[key] === value))
      .map(item => {
        if (!attributes) return new UserRecord(item);
        const projected = Object.fromEntries(attributes.map(key => [key, item[key]]));
        return new UserRecord(projected);
      });
  }

  static async findOrCreate({ where, defaults }) {
    const existing = await User.findOne({ where });
    if (existing) return [existing, false];
    return [await User.create({ ...where, ...defaults }), true];
  }
}

module.exports = User;
