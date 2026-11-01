const crypto = require('crypto');
const { readStore, writeStore } = require('../config/database');

class ClassroomRecord {
  constructor(data) { Object.assign(this, data); }
}

class Classroom {
  static async create(data) {
    if (!data.title || !String(data.title).trim()) throw new Error('Classroom title is required');
    const store = readStore();
    const item = {
      room_id: crypto.randomUUID(),
      title: String(data.title).trim(),
      instructor_id: data.instructor_id,
      createdAt: new Date().toISOString()
    };
    store.classrooms.push(item);
    writeStore(store);
    return new ClassroomRecord(item);
  }

  static async bulkCreate(rows = []) {
    if (!Array.isArray(rows)) throw new Error('bulkCreate expects an array');
    const created = [];
    for (const row of rows) created.push(await Classroom.create(row));
    return created;
  }

  static async findAll({ where = {}, order = [] } = {}) {
    const store = readStore();
    let rows = store.classrooms.filter(item => Object.entries(where).every(([key, value]) => Array.isArray(value) ? value.includes(item[key]) : item[key] === value));
    if (order.length) {
      const [field, direction] = order[0];
      rows = [...rows].sort((a, b) => String(a[field]).localeCompare(String(b[field])) * (direction === 'DESC' ? -1 : 1));
    }
    return rows.map(row => new ClassroomRecord(row));
  }

  static async findOne({ where = {}, attributes } = {}) {
    const store = readStore();
    const row = store.classrooms.find(item => Object.entries(where).every(([key, value]) => Array.isArray(value) ? value.includes(item[key]) : item[key] === value));
    if (!row) return null;
    const projected = attributes ? Object.fromEntries(attributes.map(key => [key, row[key]])) : row;
    return new ClassroomRecord(projected);
  }

  static async count({ where = {} } = {}) {
    const rows = await Classroom.findAll({ where });
    return rows.length;
  }
}

module.exports = Classroom;
