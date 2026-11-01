const express = require('express');
const jwt = require('jsonwebtoken');
const { User, Classroom, Grade } = require('../models');
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

router.get('/', authenticateToken, async (req, res) => {
  try {
    const classrooms = await Classroom.findAll({ where: { instructor_id: req.user.user_id }, order: [['createdAt', 'ASC']] });
    const roomIds = classrooms.map(room => room.room_id);
    const grades = roomIds.length ? await Grade.findAll({ where: { room_id: roomIds } }) : [];
    const uniqueStudents = new Set(grades.map(g => g.student_id));
    const avgAccuracy = grades.length
      ? `${(grades.reduce((sum, g) => sum + Number(g.score_ratio), 0) / grades.length).toFixed(1)}%`
      : '0.0%';

    res.json({
      metrics: {
        activeRooms: classrooms.length,
        connectedStudents: uniqueStudents.size,
        avgAccuracy
      },
      classrooms: classrooms.map(room => ({
        id: room.room_id,
        title: room.title,
        studentsEnrolled: grades.filter(g => g.room_id === room.room_id).length
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Unable to load dashboard data' });
  }
});

module.exports = router;
