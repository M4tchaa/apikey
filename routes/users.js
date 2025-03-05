const express = require('express');
const router = express.Router();
const db = require('../db'); // Import koneksi database

// API GET all users
router.get('/', async (req, res) => {
  try {
    const [users] = await db.query('SELECT id_user, username, email, role, created_at FROM users WHERE deleted = 0');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;