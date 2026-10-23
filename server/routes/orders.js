const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

// Helper: Generate Unique Order ID (e.g. ORD-1042)
function generateOrderNumber() {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${randomSuffix}`;
}

// Helper: Generate 4-digit Verification PIN (e.g. 4821)
function generateVerificationPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// 1. POST /api/orders - Create Pre-order (Student Flow)
router.post('/', (req, res) => {
  try {
    const { customerName, customerPhone, notes, items, paymentMethod, paymentRef, username, userId } = req.body;

    if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Customer name and at least one item are required.' });
    }

    // Verify stock and calculate real total from database to prevent price tampering
    let totalAmount = 0;
    let maxPrepTime = 5;
    const validatedItems = [];

    const getMenuItemStmt = db.prepare('SELECT * FROM menu_items WHERE id = ?');

    for (const orderItem of items) {
      const menuItem = getMenuItemStmt.get(orderItem.id);
      if (!menuItem) {
        return res.status(400).json({ success: false, message: `Menu item with ID ${orderItem.id} not found.` });
      }
      if (menuItem.is_available === 0) {
        return res.status(400).json({
          success: false,
          message: `"${menuItem.name}" is currently SOLD OUT. Please update your cart.`
        });
      }

      const qty = parseInt(orderItem.quantity, 10) || 1;
      const subtotal = menuItem.price * qty;
      totalAmount += subtotal;

      if (menuItem.prep_time_minutes > maxPrepTime) {
        maxPrepTime = menuItem.prep_time_minutes;
      }

      validatedItems.push({
        menu_item_id: menuItem.id,
        item_name: menuItem.name,
        quantity: qty,
        unit_price: menuItem.price,
        subtotal: subtotal
      });
    }

    // Generate unique order number and verification PIN
    let orderNumber = generateOrderNumber();
    // Ensure uniqueness
    while (db.prepare('SELECT id FROM orders WHERE order_number = ?').get(orderNumber)) {
      orderNumber = generateOrderNumber();
    }

    const secretPin = generateVerificationPin();
    const pinHash = bcrypt.hashSync(secretPin, 8);

    // Estimated preparation time based on item count + max prep time
    const estimatedPrepMinutes = Math.min(25, maxPrepTime + Math.floor(validatedItems.length * 1.5));

    const insertOrderStmt = db.prepare(`
      INSERT INTO orders (
        order_number, customer_name, customer_phone, notes, total_amount,
        payment_status, payment_method, payment_ref, status,
        pin_hash, pin_display, estimated_prep_minutes, username, user_id
      ) VALUES (?, ?, ?, ?, ?, 'PAID', ?, ?, 'PENDING', ?, ?, ?, ?, ?)
    `);

    const insertItemStmt = db.prepare(`
      INSERT INTO order_items (order_id, menu_item_id, item_name, quantity, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Atomic transaction
    const createOrderTx = db.transaction(() => {
      const orderResult = insertOrderStmt.run(
        orderNumber,
        customerName.trim(),
        customerPhone ? customerPhone.trim() : null,
        notes ? notes.trim() : null,
        totalAmount,
        paymentMethod || 'UPI',
        paymentRef || `UPI-TXN-${Date.now().toString().slice(-6)}`,
        pinHash,
        secretPin,
        estimatedPrepMinutes,
        username ? username.trim() : customerName.trim(),
        userId ? parseInt(userId, 10) : null
      );

      const orderId = orderResult.lastInsertRowid;

      for (const item of validatedItems) {
        insertItemStmt.run(
          orderId,
          item.menu_item_id,
          item.item_name,
          item.quantity,
          item.unit_price,
          item.subtotal
        );
      }

      return orderId;
    });

    const newOrderId = createOrderTx();

    const createdOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(newOrderId);
    const orderItemsList = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(newOrderId);

    const fullOrder = {
      ...createdOrder,
      items: orderItemsList
    };

    // Broadcast new order to Canteen Owner dashboard via WebSockets (WITHOUT exposing the secret PIN to vendor dashboard)
    const io = req.app.get('io');
    if (io) {
      const vendorSafeOrder = {
        ...fullOrder,
        pin_display: undefined, // Hide PIN from vendor view
        pin_hash: undefined     // Hide hash from vendor view
      };
      io.emit('new_order', vendorSafeOrder);
    }

    // Return full details including the secret PIN to the student who just placed the order
    res.status(201).json({
      success: true,
      message: 'Order placed and paid successfully!',
      order: fullOrder
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/orders - Get Orders for Canteen Owner Dashboard
router.get('/', (req, res) => {
  try {
    const { status, limit } = req.query;

    let query = `
      SELECT id, order_number, customer_name, customer_phone, notes, 
             total_amount, payment_status, payment_method, payment_ref, 
             status, estimated_prep_minutes, created_at, preparing_at, 
             ready_at, completed_at
      FROM orders
    `;
    const params = [];

    if (status === 'active') {
      query += ` WHERE status IN ('PENDING', 'PREPARING', 'READY_FOR_PICKUP')`;
    } else if (status) {
      query += ` WHERE status = ?`;
      params.push(status.toUpperCase());
    }

    query += ` ORDER BY 
      CASE status 
        WHEN 'READY_FOR_PICKUP' THEN 1
        WHEN 'PREPARING' THEN 2
        WHEN 'PENDING' THEN 3
        ELSE 4
      END,
      created_at DESC`;

    if (limit) {
      query += ` LIMIT ?`;
      params.push(parseInt(limit, 10));
    }

    const orders = db.prepare(query).all(...params);

    // Fetch items for each order
    const getItemsStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const enrichedOrders = orders.map((order) => {
      const items = getItemsStmt.all(order.id);
      return {
        ...order,
        items
      };
    });

    res.json({ success: true, orders: enrichedOrders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET /api/orders/:orderNumber - Fetch Order for Student Live Tracking Screen
router.get('/:orderNumber', (req, res) => {
  try {
    const { orderNumber } = req.params;
    const cleanNumber = orderNumber.replace('#', '').trim();

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(cleanNumber);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

    res.json({
      success: true,
      order: {
        ...order,
        items
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. PATCH /api/orders/:orderNumber/status - Owner updates status (PREPARING, READY_FOR_PICKUP)
router.patch('/:orderNumber/status', (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { status } = req.body;
    const cleanNumber = orderNumber.replace('#', '').trim();

    const validStatuses = ['PREPARING', 'READY_FOR_PICKUP', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition to '${status}'. Use verify-pin to mark order as COMPLETED.`
      });
    }

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(cleanNumber);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Completed orders cannot be modified.' });
    }

    let timestampField = '';
    if (status === 'PREPARING') timestampField = ', preparing_at = CURRENT_TIMESTAMP';
    if (status === 'READY_FOR_PICKUP') timestampField = ', ready_at = CURRENT_TIMESTAMP';

    db.prepare(`UPDATE orders SET status = ? ${timestampField} WHERE id = ?`).run(status, order.id);

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const fullUpdated = { ...updatedOrder, items };

    const io = req.app.get('io');
    if (io) {
      // Notify student & vendor screens
      io.emit('order_status_updated', {
        orderNumber: cleanNumber,
        status: status,
        order: fullUpdated
      });
    }

    res.json({ success: true, message: `Order updated to ${status}`, order: fullUpdated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. POST /api/orders/:orderNumber/verify-pin - Canteen Owner enters student's PIN to claim food
router.post('/:orderNumber/verify-pin', (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { enteredPin } = req.body;
    const cleanNumber = orderNumber.replace('#', '').trim();

    if (!enteredPin || enteredPin.length !== 4) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid 4-digit verification PIN.'
      });
    }

    const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(cleanNumber);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been verified and collected!'
      });
    }

    // Cryptographic verification check
    const isPinMatch = bcrypt.compareSync(enteredPin.trim(), order.pin_hash);

    if (!isPinMatch) {
      return res.status(400).json({
        success: false,
        isMatch: false,
        message: 'INCORRECT PIN! The PIN stated by student does not match this order. Verification denied.'
      });
    }

    // PIN matched! Mark order as COMPLETED
    db.prepare(`
      UPDATE orders 
      SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(order.id);

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const fullCompleted = { ...updatedOrder, items };

    const io = req.app.get('io');
    if (io) {
      io.emit('order_verified', {
        orderNumber: cleanNumber,
        status: 'COMPLETED',
        order: fullCompleted
      });
    }

    res.json({
      success: true,
      isMatch: true,
      message: `Verification SUCCESSFUL! PIN ${enteredPin} verified. Hand over food to ${order.customer_name}.`,
      order: fullCompleted
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. GET /api/orders/stats/summary - Dashboard KPI metrics for Canteen Staff
router.get('/stats/summary', (req, res) => {
  try {
    const totalActive = db.prepare(`
      SELECT COUNT(*) as count FROM orders 
      WHERE status IN ('PENDING', 'PREPARING', 'READY_FOR_PICKUP')
    `).get().count;

    const preparing = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE status = 'PREPARING'
    `).get().count;

    const readyForPickup = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE status = 'READY_FOR_PICKUP'
    `).get().count;

    const completedToday = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue 
      FROM orders 
      WHERE status = 'COMPLETED' AND date(created_at) = date('now')
    `).get();

    res.json({
      success: true,
      stats: {
        activeOrders: totalActive,
        preparingOrders: preparing,
        readyOrders: readyForPickup,
        completedToday: completedToday.count,
        todayRevenue: completedToday.revenue
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. GET /api/orders/user/:username - Track money paid & order history for specific user
router.get('/user/:username', (req, res) => {
  try {
    const { username } = req.params;
    const cleanUsername = username.trim();

    const orders = db.prepare(`
      SELECT id, order_number, customer_name, customer_phone, notes, 
             total_amount, payment_status, payment_method, payment_ref, 
             status, pin_display, estimated_prep_minutes, created_at, 
             preparing_at, ready_at, completed_at, username, user_id
      FROM orders
      WHERE LOWER(COALESCE(username, '')) = LOWER(?)
      ORDER BY created_at DESC
    `).all(cleanUsername);

    const getItemsStmt = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const enrichedOrders = orders.map((order) => ({
      ...order,
      items: getItemsStmt.all(order.id)
    }));

    const totalPaid = enrichedOrders
      .filter((o) => o.payment_status === 'PAID')
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    const totalOrders = enrichedOrders.length;
    const completedOrders = enrichedOrders.filter((o) => o.status === 'COMPLETED').length;
    const activeOrders = enrichedOrders.filter((o) =>
      ['PENDING', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status)
    ).length;

    res.json({
      success: true,
      stats: {
        totalPaid,
        totalOrders,
        completedOrders,
        activeOrders
      },
      orders: enrichedOrders
    });
  } catch (err) {
    console.error('Error fetching user payment history:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7b. GET /api/orders/user/:username/active - Fetch active order specifically for this user
router.get('/user/:username/active', (req, res) => {
  try {
    const { username } = req.params;
    const cleanUsername = username.trim();

    const activeOrder = db.prepare(`
      SELECT * FROM orders
      WHERE LOWER(COALESCE(username, '')) = LOWER(?)
        AND status IN ('PENDING', 'PREPARING', 'READY_FOR_PICKUP')
      ORDER BY created_at DESC
      LIMIT 1
    `).get(cleanUsername);

    if (!activeOrder) {
      return res.json({ success: true, activeOrder: null });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(activeOrder.id);

    res.json({
      success: true,
      activeOrder: {
        ...activeOrder,
        items
      }
    });
  } catch (err) {
    console.error('Error fetching user active order:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. GET /api/orders/analytics/bestsellers - Owner sales insights: what item sold most with counts
router.get('/analytics/bestsellers', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT 
        oi.menu_item_id,
        oi.item_name,
        COALESCE(m.category, 'General') as category,
        COALESCE(m.image_url, '') as image_url,
        COALESCE(m.price, oi.unit_price) as price,
        COALESCE(m.is_available, 1) as is_available,
        COALESCE(m.badge, '') as badge,
        SUM(oi.quantity) as total_sold_count,
        SUM(oi.subtotal) as total_revenue,
        COUNT(DISTINCT oi.order_id) as total_orders_count
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id
      WHERE o.payment_status = 'PAID'
      GROUP BY oi.menu_item_id, oi.item_name
      ORDER BY total_sold_count DESC, total_revenue DESC
    `).all();

    // Also get all menu items that have 0 sales so owner has full visibility
    const allMenuItems = db.prepare('SELECT id, name, category, image_url, price, is_available, badge FROM menu_items').all();
    const soldItemIds = new Set(rows.map(r => r.menu_item_id));

    const unsoldItems = allMenuItems
      .filter(item => !soldItemIds.has(item.id))
      .map(item => ({
        menu_item_id: item.id,
        item_name: item.name,
        category: item.category,
        image_url: item.image_url,
        price: item.price,
        is_available: item.is_available,
        badge: item.badge,
        total_sold_count: 0,
        total_revenue: 0,
        total_orders_count: 0
      }));

    const completeList = [...rows, ...unsoldItems];

    const totalUnitsSold = rows.reduce((sum, r) => sum + Number(r.total_sold_count || 0), 0);
    const totalSalesRevenue = rows.reduce((sum, r) => sum + Number(r.total_revenue || 0), 0);
    const topItem = rows.length > 0 ? rows[0] : null;

    res.json({
      success: true,
      summary: {
        totalUnitsSold,
        totalSalesRevenue,
        uniqueProductsSold: rows.length,
        topItem: topItem ? {
          id: topItem.menu_item_id,
          name: topItem.item_name,
          count: topItem.total_sold_count,
          revenue: topItem.total_revenue
        } : null
      },
      items: completeList
    });
  } catch (err) {
    console.error('Error fetching bestsellers:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. POST /api/orders/cleanup-old - Trigger automatic 1-month data purge
router.post('/cleanup-old', (req, res) => {
  try {
    const days = parseInt(req.body?.days, 10) || 30;
    if (typeof db.cleanupOldOrders === 'function') {
      const result = db.cleanupOldOrders(days);
      return res.json(result);
    }
    res.json({ success: false, message: 'Auto-cleanup function not available.' });
  } catch (err) {
    console.error('Error during old data cleanup:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
