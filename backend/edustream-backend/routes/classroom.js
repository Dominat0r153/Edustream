const express = require('express');
const jwt = require('jsonwebtoken');
const { Classroom, Grade, User } = require('../models');
const router = express.Router();

function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  jwt.verify(token, process.env.JWT_SECRET || 'fallback', (err, user) => {
    if (err) return res.status(403).json({ error: 'Session expired or invalid token' });
    req.user = user;
    next();
  });
}

router.post('/', authenticateToken, async (req, res) => {
  if (!['instructor', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Instructor access required' });
  try {
    const classroom = await Classroom.create({ title: req.body.title, instructor_id: req.user.user_id });
    res.status(201).json(classroom);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const classrooms = await Classroom.findAll({ where: { instructor_id: req.user.user_id }, order: [['createdAt', 'ASC']] });
    res.json(classrooms);
  } catch (err) {
    res.status(500).json({ error: 'Unable to load classrooms' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const classroomWhere = { room_id: req.params.id };
    if (req.user.role !== 'admin') classroomWhere.instructor_id = req.user.user_id;
    const classroom = await Classroom.findOne({ where: classroomWhere });
    if (!classroom) return res.status(404).json({ error: 'Classroom not found' });
    const grades = await Grade.findAll({ where: { room_id: classroom.room_id } });
    const users = grades.length ? await User.findAll({ where: { user_id: [...new Set(grades.map(g => g.student_id))] }, attributes: ['user_id', 'email', 'role'] }) : [];
    const average = grades.length ? grades.reduce((sum, g) => sum + Number(g.score_ratio), 0) / grades.length : 0;
    res.json({
      classroom: { id: classroom.room_id, title: classroom.title, instructorId: classroom.instructor_id },
      roster: users.map(user => ({ id: user.user_id, name: user.email.split('@')[0] })),
      metrics: { submissions: grades.length, averageScore: Number(average.toFixed(1)) },
      quizActive: false
    });
  } catch (err) {
    res.status(500).json({ error: 'Unable to load classroom context' });
  }
});

router.get('/:id/metrics', authenticateToken, async (req, res) => {
  try {
    const classroomWhere = { room_id: req.params.id };
    if (req.user.role !== 'admin') classroomWhere.instructor_id = req.user.user_id;
    const classroom = await Classroom.findOne({ where: classroomWhere, attributes: ['room_id'] });
    if (!classroom) return res.status(404).json({ error: 'Classroom not found' });
    const grades = await Grade.findAll({ where: { room_id: classroom.room_id } });
    if (grades.length === 0) return res.json({ average_score: 0, total_submissions: 0 });
    const sum = grades.reduce((acc, current) => acc + Number(current.score_ratio), 0);
    res.json({ average_score: Number((sum / grades.length).toFixed(2)), total_submissions: grades.length });
  } catch (err) {
    res.status(500).json({ error: 'Unable to calculate classroom metrics' });
  }
});

module.exports = router;
