const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// User Registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    const user = await User.create({ email, password, role });
    res.status(201).json({ user_id: user.user_id, email: user.email, role: user.role });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login and Token Generation
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid security credentials' });
    }
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role }, 
      process.env.JWT_SECRET || 'fallback', 
      { expiresIn: '2h' }
    );
    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;