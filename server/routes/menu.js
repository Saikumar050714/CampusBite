const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all menu items
router.get('/', (req, res) => {
  try {
    const items = db.prepare(`
      SELECT * FROM menu_items 
      ORDER BY category ASC, is_available DESC, id ASC
    `).all();
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH toggle availability (In Stock / Sold Out)
router.patch('/:id/toggle', (req, res) => {
  try {
    const itemId = req.params.id;
    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const newStatus = item.is_available === 1 ? 0 : 1;
    db.prepare('UPDATE menu_items SET is_available = ? WHERE id = ?').run(newStatus, itemId);

    const updatedItem = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(itemId);

    // Broadcast menu update if socket.io is available
    if (req.app.get('io')) {
      req.app.get('io').emit('menu_item_updated', updatedItem);
    }

    res.json({ success: true, item: updatedItem });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST add new menu item
router.post('/', (req, res) => {
  try {
    const { name, category, description, price, prep_time_minutes, badge, image_url, is_veg } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ success: false, message: 'Name, category, and price are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO menu_items (name, category, description, price, prep_time_minutes, badge, image_url, is_veg)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      category,
      description || '',
      parseFloat(price),
      parseInt(prep_time_minutes || 5, 10),
      badge || '',
      image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
      is_veg !== undefined ? (is_veg ? 1 : 0) : 1
    );

    const newItem = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(result.lastInsertRowid);

    if (req.app.get('io')) {
      req.app.get('io').emit('menu_item_added', newItem);
    }

    res.status(201).json({ success: true, item: newItem });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
