const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

// 1. POST /api/auth/register - Register unique user with individual profile details
router.post('/register', (req, res) => {
  try {
    const { username, password, fullName, phone, studentId } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    const cleanFullName = (fullName || cleanUsername).trim();
    const cleanPhone = (phone || '').trim();
    const cleanStudentId = (studentId || '').trim();

    if (cleanUsername.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Username must be at least 2 characters long.'
      });
    }

    if (cleanPassword.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 3 characters long.'
      });
    }

    // Protect reserved admin username
    if (cleanUsername.toLowerCase() === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Username "admin" is reserved. Please sign in directly.'
      });
    }

    // Check if user already exists
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(cleanUsername);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'An account with this username already exists. Please choose another username or sign in.'
      });
    }

    const passwordHash = bcrypt.hashSync(cleanPassword, 8);
    const insertStmt = db.prepare(`
      INSERT INTO users (username, password_hash, role, full_name, phone, student_id)
      VALUES (?, ?, 'user', ?, ?, ?)
    `);

    const result = insertStmt.run(cleanUsername, passwordHash, cleanFullName, cleanPhone, cleanStudentId);

    const newUser = db.prepare('SELECT id, username, role, full_name, phone, student_id, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Individual account created successfully!',
      user: newUser
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

// 2. POST /api/auth/login - Login returns exact individual profile
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.'
      });
    }

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    // Check for staff admin credentials: username=admin, password=77777
    if (cleanUsername.toLowerCase() === 'admin' && cleanPassword === '77777') {
      return res.json({
        success: true,
        message: 'Staff login successful',
        user: {
          id: 1,
          username: 'admin',
          full_name: 'Canteen Staff Admin',
          phone: '',
          student_id: 'STAFF-01',
          role: 'staff'
        }
      });
    }

    // If username is admin but wrong password
    if (cleanUsername.toLowerCase() === 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please verify your password.'
      });
    }

    // Lookup regular user in SQLite database
    const user = db.prepare('SELECT * FROM users WHERE LOWER(username) = LOWER(?)').get(cleanUsername);

    if (!user) {
      return res.status(404).json({
        success: false,
        notFound: true,
        message: 'Account not found. Please click Register to create your account.'
      });
    }

    const isMatch = bcrypt.compareSync(cleanPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.'
      });
    }

    return res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name || user.username,
        phone: user.phone || '',
        student_id: user.student_id || '',
        role: user.role || 'user',
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// 3. GET /api/auth/profile/:username - Fetch individual user profile
router.get('/profile/:username', (req, res) => {
  try {
    const { username } = req.params;
    const cleanUsername = username.trim();

    if (cleanUsername.toLowerCase() === 'admin') {
      return res.json({
        success: true,
        user: {
          id: 1,
          username: 'admin',
          full_name: 'Canteen Staff Admin',
          phone: '',
          student_id: 'STAFF-01',
          role: 'staff',
          created_at: new Date().toISOString()
        }
      });
    }

    const user = db.prepare(`
      SELECT id, username, role, full_name, phone, student_id, created_at 
      FROM users 
      WHERE LOWER(username) = LOWER(?)
    `).get(cleanUsername);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      user: {
        ...user,
        full_name: user.full_name || user.username
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error retrieving profile.' });
  }
});

// 4. PUT /api/auth/profile/:username - Update individual user profile
router.put('/profile/:username', (req, res) => {
  try {
    const { username } = req.params;
    const { fullName, phone, studentId } = req.body;
    const cleanUsername = username.trim();

    if (cleanUsername.toLowerCase() === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot edit admin profile.' });
    }

    const user = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(cleanUsername);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    db.prepare(`
      UPDATE users 
      SET full_name = ?, phone = ?, student_id = ?
      WHERE id = ?
    `).run(
      (fullName || cleanUsername).trim(),
      (phone || '').trim(),
      (studentId || '').trim(),
      user.id
    );

    const updated = db.prepare('SELECT id, username, role, full_name, phone, student_id, created_at FROM users WHERE id = ?').get(user.id);

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      user: updated
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
});

module.exports = router;
