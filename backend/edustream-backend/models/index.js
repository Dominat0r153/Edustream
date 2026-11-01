const User = require('./user');
const Classroom = require('./classroom');
const Grade = require('./grade');
const { sequelize } = require('../config/database');

// Relationship declarations are represented by instructor_id/student_id/room_id in the JSON store.
module.exports = { sequelize, User, Classroom, Grade };
