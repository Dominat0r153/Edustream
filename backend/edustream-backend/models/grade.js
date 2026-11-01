const crypto = require('crypto');
const { readStore, writeStore } = require('../config/database');

class GradeRecord {
  constructor(data) { Object.assign(this, data); }
}

class Grade {
  static async create(data) {
    const score = Number(data.score_ratio);
    if (!Number.isFinite(score) || score < 0 || score > 100) throw new Error('score_ratio must be between 0 and 100');
    const store = readStore();
    const item = {
      grade_id: crypto.randomUUID(),
      room_id: data.room_id,
      score_ratio: score,
      student_id: data.student_id,
      createdAt: new Date().toISOString()
    };
    store.grades.push(item);
    writeStore(store);
    return new GradeRecord(item);
  }

  static async findAll({ where = {} } = {}) {
    const store = readStore();
    return store.grades
      .filter(item => Object.entries(where).every(([key, value]) => Array.isArray(value) ? value.includes(item[key]) : item[key] === value))
      .map(row => new GradeRecord(row));
  }
}

module.exports = Grade;
