const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'canteen.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  // Create Menu Items Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      is_available INTEGER DEFAULT 1,
      prep_time_minutes INTEGER DEFAULT 5,
      badge TEXT,
      image_url TEXT,
      is_veg INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Orders Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      notes TEXT,
      total_amount REAL NOT NULL,
      payment_status TEXT DEFAULT 'PAID',
      payment_method TEXT DEFAULT 'UPI',
      payment_ref TEXT,
      status TEXT DEFAULT 'PENDING',
      pin_hash TEXT NOT NULL,
      pin_display TEXT NOT NULL,
      estimated_prep_minutes INTEGER DEFAULT 8,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      preparing_at DATETIME,
      ready_at DATETIME,
      completed_at DATETIME
    );
  `);

  // Create Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      full_name TEXT,
      phone TEXT,
      student_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure individual profile columns exist on users table
  try {
    db.exec(`ALTER TABLE users ADD COLUMN full_name TEXT;`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN phone TEXT;`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE users ADD COLUMN student_id TEXT;`);
  } catch (e) {}

  // Ensure username and user_id columns exist on orders table
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN user_id INTEGER;`);
  } catch (e) {}
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN username TEXT;`);
  } catch (e) {}

  // Seed default admin account if not already present
  const adminRow = db.prepare('SELECT id FROM users WHERE LOWER(username) = ?').get('admin');
  if (!adminRow) {
    const adminHash = bcrypt.hashSync('77777', 8);
    db.prepare(`
      INSERT INTO users (username, password_hash, role)
      VALUES (?, ?, ?)
    `).run('admin', adminHash, 'staff');
    console.log('Seeded default admin account (username: admin)');
  }

  // Create Order Items Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL
    );
  `);

  // Seed Menu Items if empty
  const countRow = db.prepare('SELECT COUNT(*) as count FROM menu_items').get();
  if (countRow.count === 0) {
    console.log('Seeding initial campus canteen menu items...');
    const seedItems = [
      {
        name: 'Crispy Aloo Samosa (2 pcs)',
        category: 'Evening Snacks',
        description: 'Golden spiced potato stuffed pastries served with mint & tamarind chutney.',
        price: 30,
        is_available: 1,
        prep_time_minutes: 3,
        badge: 'Bestseller',
        image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=60',
        is_veg: 1
      },
      {
        name: 'Mumbai Style Vada Pav',
        category: 'Evening Snacks',
        description: 'Spicy batata vada tucked in soft pav with dry garlic coconut chutney.',
        price: 25,
        is_available: 1,
        prep_time_minutes: 4,
        badge: 'Popular',
        image_url: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&auto=format&fit=crop&q=60',
        is_veg: 1
      },
      {
        name: 'Paneer Tikka Grilled Sandwich',
        category: 'Quick Bites',
        description: 'Loaded with marinated cottage cheese, crunchy bell peppers, and melted cheese.',
        price: 75,
        is_available: 1,
        prep_time_minutes: 8,
        badge: 'Chef Special',
        image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=60',
        is_veg: 1
      },
      {
        name: 'Crispy French Fries (Peri-Peri)',
        category: 'Quick Bites',
        description: 'Crunchy deep-fried potato batons tossed in zesty peri-peri spice mix.',
        price: 55,
        is_available: 1,
        prep_time_minutes: 5,
        badge: 'Rush Favorite',
        image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=500&auto=format&fit=crop&q=60',
        is_veg: 1
      },
      {
        name: 'Steamed Veg Momos (6 pcs)',
        category: 'Evening Snacks',
        description: 'Juicy cabbage and scallion dumplings paired with fiery Himalayan red chili dip.',
        price: 60,
        is_available: 1,
        prep_time_minutes: 6,
        badge: 'Hot Seller',
        image_url: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500&auto=format&fit=crop&q=60',
        is_veg: 1
      },
      {
        name: 'Cutting Masala Chai (Kulhad)',
        category: 'Beverages',
        description: 'Aromatic ginger-cardamom brewed milk tea served in an authentic clay kulhad.',
        price: 15,
        is_available: 1,
        prep_time_minutes: 2,
        badge: 'Campus Classic',
        image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60',
        is_veg: 1
      },
      {
        name: 'Thick Iced Cold Coffee',
        category: 'Beverages',
        description: 'Rich creamy blended coffee with chocolate drizzle and vanilla ice cream scoop.',
        price: 45,
        is_available: 1,
        prep_time_minutes: 3,
        badge: 'Chill Out',
        image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=60',
        is_veg: 1
      },
      {
        name: 'Crispy Butter Masala Dosa',
        category: 'South Indian',
        description: 'Crispy fermented crepe filled with spiced potato mash, served with sambar & coconut chutney.',
        price: 70,
        is_available: 1,
        prep_time_minutes: 9,
        badge: 'Evening Feast',
        image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=60',
        is_veg: 1
      },
      {
        name: 'Fresh Mint Lime Soda',
        category: 'Beverages',
        description: 'Fizzy thirst-quencher with freshly squeezed lemon juice, mint, and black salt.',
        price: 25,
        is_available: 1,
        prep_time_minutes: 2,
        badge: 'Refreshing',
        image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=60',
        is_veg: 1
      },
      {
        name: 'Spicy Maggi with Cheese',
        category: 'Quick Bites',
        description: 'College student staple: 2-minute instant noodles loaded with veggies and melted cheddar.',
        price: 45,
        is_available: 0, // demo sold out item
        prep_time_minutes: 5,
        badge: 'Sold Out Demo',
        image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=60',
        is_veg: 1
      }
    ];

    const insertStmt = db.prepare(`
      INSERT INTO menu_items (name, category, description, price, is_available, prep_time_minutes, badge, image_url, is_veg)
      VALUES (@name, @category, @description, @price, @is_available, @prep_time_minutes, @badge, @image_url, @is_veg)
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) insertStmt.run(item);
    });

    insertMany(seedItems);
    console.log(`Seeded ${seedItems.length} menu items successfully.`);
  }

  // Auto-cleanup: Delete orders older than 1 month (30 days)
  cleanupOldOrders(30);
}

// Function: Automatically purge data older than 1 month (30 days)
function cleanupOldOrders(days = 30) {
  try {
    const cutoffModifier = `-${days} days`;

    const countRow = db.prepare(`
      SELECT COUNT(*) as count FROM orders 
      WHERE datetime(created_at) < datetime('now', ?)
    `).get(cutoffModifier);

    if (countRow.count === 0) {
      return { success: true, deletedOrders: 0, deletedItems: 0, message: 'No records older than 1 month found.' };
    }

    const deleteItemsStmt = db.prepare(`
      DELETE FROM order_items 
      WHERE order_id IN (
        SELECT id FROM orders 
        WHERE datetime(created_at) < datetime('now', ?)
      )
    `);

    const deleteOrdersStmt = db.prepare(`
      DELETE FROM orders 
      WHERE datetime(created_at) < datetime('now', ?)
    `);

    const purgeTx = db.transaction(() => {
      const itemsRes = deleteItemsStmt.run(cutoffModifier);
      const ordersRes = deleteOrdersStmt.run(cutoffModifier);
      return { deletedOrders: ordersRes.changes, deletedItems: itemsRes.changes };
    });

    const result = purgeTx();
    console.log(`[Auto-Purge] Cleaned up ${result.deletedOrders} orders older than 1 month (${result.deletedItems} items removed).`);
    return { success: true, ...result };
  } catch (err) {
    console.error('[Auto-Purge] Error cleaning old data:', err);
    return { success: false, error: err.message };
  }
}

initDatabase();

db.cleanupOldOrders = cleanupOldOrders;
module.exports = db;
