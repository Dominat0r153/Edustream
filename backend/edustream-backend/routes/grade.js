const express = require('express');
const jwt = require('jsonwebtoken');
const { Grade, Classroom } = require('../models');
const router = express.Router();

const activeQuizzes = new Map();
const QUIZ = {
  id: 'acid-01',
  question: 'Which constraint model prevents race conditions during concurrent database operations?',
  options: [
    { value: 'A', label: 'Loose NoSQL Eventual Consistency' },
    { value: 'B', label: 'Strict Relational ACID Isolation Boundaries' },
    { value: 'C', label: 'Client-side LocalStorage Assertions' }
  ],
  correctAnswer: 'B'
};

function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  jwt.verify(token, process.env.JWT_SECRET || 'fallback', (err, user) => {
    if (err) return res.status(403).json({ error: 'Session expired or invalid token' });
    req.user = user;
    next();
  });
}

router.post('/trigger', authenticateToken, async (req, res) => {
  const roomId = req.body.room_id;
  if (!roomId) return res.status(400).json({ error: 'room_id is required' });
  const classroomWhere = { room_id: roomId };
  if (req.user.role !== 'admin') classroomWhere.instructor_id = req.user.user_id;
  const classroom = await Classroom.findOne({ where: classroomWhere });
  if (!classroom) return res.status(404).json({ error: 'Classroom not found' });
  if (!['instructor', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Instructor access required' });
  activeQuizzes.set(roomId, QUIZ);
  const { correctAnswer, ...publicQuiz } = QUIZ;
  res.json({ success: true, quizActive: true, quiz: publicQuiz });
});

router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { room_id: roomId, selection, score_ratio: providedScore } = req.body;
    if (!roomId) return res.status(400).json({ error: 'room_id is required' });

    let scoreRatio;
    let isCorrect = null;
    if (selection) {
      const quiz = activeQuizzes.get(roomId) || QUIZ;
      isCorrect = selection === quiz.correctAnswer;
      scoreRatio = isCorrect ? 100 : 0;
      activeQuizzes.delete(roomId);
    } else if (providedScore !== undefined) {
      scoreRatio = Number(providedScore);
    } else {
      return res.status(400).json({ error: 'selection or score_ratio is required' });
    }

    if (!Number.isFinite(scoreRatio) || scoreRatio < 0 || scoreRatio > 100) {
      return res.status(400).json({ error: 'score_ratio must be between 0 and 100' });
    }

    const grade = await Grade.create({ room_id: roomId, score_ratio: scoreRatio, student_id: req.user.user_id });
    res.status(201).json({ success: true, grade, isCorrect });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
