# CampusBite — College Canteen Pre-order & Queue Management MVP

> **Problem Solved:** During evening rush hours, college canteens get crowded, causing students to skip snacks or miss their buses. CampusBite enables students to pre-order food, pay in advance, receive a unique **Order ID** and a secret **4-digit Verification PIN**, and claim their food without waiting in the main line. Canteen staff verify the PIN at the pickup counter to guarantee fraud-free handover.

---

## ⚡ Key Features

### 🎒 1. Student / Customer Flow
- **Browse Evening Menu:** Hot snacks, quick bites, beverages, South Indian combos with prep times and live stock status.
- **Customized Tray & Notes:** Add special instructions like *"extra chutney"*, *"less spice"*, or *"separate bag"*.
- **Advance Mock Checkout:** Instant UPI (GPay, PhonePe, Paytm simulation) and Campus RFID SmartCard meal credits.
- **Order Confirmation & Secret PIN:**
  - Unique Order ID (e.g., `#ORD-9395`).
  - Secret 4-digit Verification PIN (e.g., `8925`) generated cryptographically on the server.
  - Live progress stepper: `Order Received` $\rightarrow$ `In Kitchen` $\rightarrow$ `Ready at Counter` $\rightarrow$ `Picked Up`.
  - Audio chimes upon food ready and celebratory confetti upon counter collection.

### 👨‍🍳 2. Canteen Staff / Vendor Flow
- **Live Real-time Queue Dashboard:** Instant WebSocket (`socket.io`) notification when new orders arrive.
- **Kitchen Actions:** One-click *"Accept & Start Cooking"* and *"Mark as Ready for Pickup"*.
- **Cryptographic PIN Verification:**
  - Staff prompts student for their secret PIN when calling their Order ID.
  - Staff types the 4 digits into the on-screen touchscreen keypad / POS modal.
  - Server verifies entered PIN against the bcrypt hash.
  - If matching: marks order `COMPLETED`, plays success chime, bursts confetti, and logs pickup.
  - If mismatch: shows alert and denies handover to prevent wrongful pickups or food theft.
- **Live Rush Hour Stock Manager:** Toggle any menu item between *In Stock* and *Sold Out* in real-time.

---

## 🛠️ Tech Stack & Architecture

- **Backend:** Node.js, Express, `better-sqlite3`, `socket.io`, `bcryptjs`, `cors`.
- **Frontend:** React, Vite, Tailwind CSS v4, `lucide-react`, `canvas-confetti`, Web Audio API sound synthesizer.
- **Database:** SQLite (embedded `server/canteen.db`, zero external database installation required).
- **Real-Time Layer:** Bi-directional WebSockets (`socket.io`).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- npm

### 1. Install Dependencies
```bash
# In project root:
npm install

# In client directory:
npm --prefix client install
```

### 2. Run the Full Application (Single Command)
```bash
npm run dev
```
- **Backend Server:** `http://localhost:5000` (API & WebSockets)
- **Frontend App:** `http://localhost:5173` (Vite Hot-Reload Server)

Alternatively, run in production single-port mode:
```bash
npm run build
npm start
```
Open **`http://localhost:5000`** in your browser!

---

## 📱 Testing the Dual-Role Experience
Use the switcher at the top of the app:
1. **Student App Tab:** Browse menu, add Samosa & Chai, click *Pay & Generate Pickup PIN*.
2. Copy or note down the **4-digit secret PIN** (e.g. `8925`).
3. Switch to **Canteen Staff Tab**:
   - See the order in the live queue.
   - Click *Accept & Start Preparing*.
   - Click *Mark as Ready for Pickup*.
   - Click *Prompt Student for PIN & Handover*.
   - Enter wrong PIN (e.g. `0000`) $\rightarrow$ see error rejection.
   - Enter the student's correct PIN $\rightarrow$ order verified and archived!
