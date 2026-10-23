import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    """Set background color of a table cell."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    """Set cell padding (in dxa: 20 dxa = 1 pt)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'''
        <w:tcMar {nsdecls("w")}>
            <w:top w:w="{top}" w:type="dxa"/>
            <w:bottom w:w="{bottom}" w:type="dxa"/>
            <w:left w:w="{left}" w:type="dxa"/>
            <w:right w:w="{right}" w:type="dxa"/>
        </w:tcMar>
    ''')
    tcPr.append(tcMar)

def create_report():
    doc = docx.Document()

    # Page Margins: 1 inch (72pt)
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Styles Setup
    normal_style = doc.styles['Normal']
    normal_font = normal_style.font
    normal_font.name = 'Calibri'
    normal_font.size = Pt(11)
    normal_font.color.rgb = RGBColor(30, 41, 59) # Slate 800

    # Palette
    COLOR_PRIMARY = RGBColor(15, 23, 42)    # Slate 900
    COLOR_ACCENT = RGBColor(234, 88, 12)    # Orange 600
    COLOR_MUTED = RGBColor(100, 116, 139)   # Slate 500
    COLOR_SUCCESS = RGBColor(5, 150, 105)   # Emerald 600

    # ==================== DOCUMENT HEADER ====================
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_title = title_p.add_run("PROJECT STATUS UPDATE REPORT")
    run_title.font.size = Pt(22)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_PRIMARY

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(18)
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = sub_p.add_run("CampusBite — College Canteen Pre-Order & Real-Time Queue Management System")
    run_sub.font.size = Pt(12)
    run_sub.font.bold = True
    run_sub.font.color.rgb = COLOR_ACCENT

    # ==================== STUDENT METADATA SUMMARY TABLE ====================
    meta_table = doc.add_table(rows=6, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False

    meta_data = [
        ("Roll Number", "24P31A0507"),
        ("Student Name", "B. Sai Kumar"),
        ("Project Title", "CampusBite — College Canteen Pre-order & Queue Management"),
        ("Current Project Status", "90% Completed — Functional Real-Time MVP Operational"),
        ("Current Working Module", "Module 5: Real-Time Counter PIN Verification & Live Vendor Order Lifecycle"),
        ("GitHub Repository", "In Progress — https://github.com/Saikumar050714/CampusBite")
    ]

    col_widths = [Inches(2.2), Inches(4.3)]
    for r_idx, (label, val) in enumerate(meta_data):
        row = meta_table.rows[r_idx]
        cell_lbl = row.cells[0]
        cell_val = row.cells[1]

        cell_lbl.width = col_widths[0]
        cell_val.width = col_widths[1]

        set_cell_background(cell_lbl, "F1F5F9") # Slate 100
        set_cell_background(cell_val, "FFFFFF")
        set_cell_margins(cell_lbl, 100, 100, 140, 140)
        set_cell_margins(cell_val, 100, 100, 140, 140)

        p_lbl = cell_lbl.paragraphs[0]
        p_lbl.paragraph_format.space_before = Pt(0)
        p_lbl.paragraph_format.space_after = Pt(0)
        r_l = p_lbl.add_run(label)
        r_l.font.bold = True
        r_l.font.size = Pt(10)
        r_l.font.color.rgb = COLOR_PRIMARY

        p_val = cell_val.paragraphs[0]
        p_val.paragraph_format.space_before = Pt(0)
        p_val.paragraph_format.space_after = Pt(0)
        r_v = p_val.add_run(val)
        r_v.font.size = Pt(10)
        if label == "Roll Number" or label == "Student Name":
            r_v.font.bold = True
            r_v.font.color.rgb = COLOR_ACCENT

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Helper function for adding question headings
    def add_question_heading(q_num, q_title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        
        run_num = p.add_run(f"{q_num}. ")
        run_num.font.bold = True
        run_num.font.size = Pt(13)
        run_num.font.color.rgb = COLOR_ACCENT

        run_txt = p.add_run(q_title)
        run_txt.font.bold = True
        run_txt.font.size = Pt(13)
        run_txt.font.color.rgb = COLOR_PRIMARY

    def add_subheading(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(text)
        r.font.bold = True
        r.font.size = Pt(11)
        r.font.color.rgb = RGBColor(51, 65, 85)

    def add_bullet(bold_prefix, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix + ": ")
            r_bold.font.bold = True
            r_bold.font.color.rgb = COLOR_PRIMARY
        r_text = p.add_run(text)
        r_text.font.size = Pt(10.5)

    def add_body(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(text)
        r.font.size = Pt(10.5)
        return p

    def add_image_if_exists(img_filename, caption_text, width_inches=5.8):
        full_path = os.path.join(r"c:\Users\saiku\Documents\Coding\Project\CampusBite", img_filename)
        if os.path.exists(full_path):
            p_img = doc.add_paragraph()
            p_img.paragraph_format.space_before = Pt(8)
            p_img.paragraph_format.space_after = Pt(4)
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run_img = p_img.add_run()
            run_img.add_picture(full_path, width=Inches(width_inches))

            p_cap = doc.add_paragraph()
            p_cap.paragraph_format.space_before = Pt(0)
            p_cap.paragraph_format.space_after = Pt(10)
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            r_cap = p_cap.add_run(caption_text)
            r_cap.font.size = Pt(9.5)
            r_cap.font.italic = True
            r_cap.font.color.rgb = COLOR_MUTED

    # ==================== QUESTION ANSWERS ====================

    # Q1
    add_question_heading("1", "Roll Number")
    add_body("24P31A0507")

    # Q2
    add_question_heading("2", "Student Name")
    add_body("B. Sai Kumar")

    # Q3
    add_question_heading("3", "Project Title")
    add_body("CampusBite — College Canteen Pre-Order & Real-Time Queue Management System with Cryptographic PIN Verification")

    # Q4
    add_question_heading("4", "Project Description")
    add_body(
        "CampusBite is a high-performance, full-stack college canteen queue management and food pre-ordering web application. "
        "Engineered specifically for university campus environments, CampusBite resolves the chronic problem of overcrowding, "
        "delayed orders, and chaotic rush-hour pickups during short lecture breaks, lunch hours, and evening recess. "
        "The system introduces a seamless dual-role architecture: students browse a real-time digital canteen menu, customize "
        "their food trays with kitchen instructions, pay instantly using multi-app UPI simulations or Campus RFID SmartCard meal credits, "
        "and receive a unique Order ID coupled with a cryptographically generated, secret 4-digit verification PIN. "
        "Simultaneously, canteen kitchen staff monitor live incoming orders via bi-directional WebSockets, transition orders "
        "through visual preparation states ('Cooking', 'Ready at Counter'), and verify student authenticity using an on-screen "
        "touchscreen POS keypad matching bcrypt hashes before handing over food—completely eliminating line jumping, food theft, and erroneous collections."
    )
    add_image_if_exists("screenshot_1_login.png", "Figure 1: CampusBite Authentication Portal with Individual Student Profiles & Staff Access")

    # Q5
    add_question_heading("5", "Problem Statement – What Problem Does Your Project Solve?")
    add_body(
        "College canteens face severe operational bottlenecks during peak break intervals (especially 12:30–1:30 PM lunch and 4:30–5:30 PM evening tea). "
        "Specific problems solved include:"
    )
    add_bullet("Long Queues & Wasted Break Times", "Students spend 35 to 45 minutes waiting in line just to place an order and pay cash, causing them to rush through meals or miss academic lectures and campus transport buses.")
    add_bullet("Wrong Food Handover & Fraudulent Pickups", "Traditional noisy canteen counters rely on shouting order numbers or paper tokens, which often leads to accidental wrong handovers, food theft, and disputes.")
    add_bullet("Kitchen Overwhelm & Lack of Live Demand Visibility", "Kitchen staff have no advance visibility into incoming snack demand during brief 15-minute breaks, resulting in sudden stockouts or cold, pre-cooked food waste.")
    add_bullet("Cash & Change Delays", "Physical cash exchanges at single-window counters drastically slow down transaction throughput.")

    # Q6
    add_question_heading("6", "Proposed Solution – How Does Your Project Solve the Problem?")
    add_body(
        "CampusBite provides a structured, technology-driven solution that completely decouples order placement and payment from physical pickup:"
    )
    add_bullet("Advance Remote Food Ordering", "Students browse categorized evening specials, snacks, and beverages and submit orders from their classroom or library before arriving at the canteen.")
    add_bullet("Cryptographic 4-Digit PIN Handover", "When payment is finalized, the server generates a cryptographically random 4-digit PIN stored as a bcrypt hash. At pickup Counter #1, the student recites the PIN to staff, who validates it on an interactive POS keypad. Only a verified match releases the order.")
    add_bullet("Bi-Directional WebSocket Synchronization", "Socket.io pushes instant updates to kitchen screens as orders arrive, and notifies students immediately when their food transitions to 'Ready at Counter'.")
    add_bullet("Simulated Cashless Payments", "Students pay within seconds using deep-linked UPI simulations (Google Pay, PhonePe, Paytm, BHIM, CRED) or student RFID SmartCard credits.")
    add_bullet("Live Kitchen Stock Control", "Kitchen staff toggle items between 'In Stock' and 'Sold Out' with a single tap, updating student trays in real time.")
    add_image_if_exists("screenshot_2_menu.png", "Figure 2: Student Digital Evening Menu Specials with Live Preparation Times and Stock Status")

    # Q7
    add_question_heading("7", "Objectives of the Project")
    add_bullet("Drastic Queue Reduction", "Cut student counter waiting time from ~40 minutes down to under 2 minutes at an express zero-queue pickup counter.")
    add_bullet("Zero-Theft Food Release", "Guarantee 100% fraud-proof order collection using bcrypt cryptographic PIN verification.")
    add_bullet("Real-Time Kitchen Queue Management", "Streamline kitchen operations with live order state tracking (Received → Cooking → Ready → Picked Up).")
    add_bullet("Cashless Campus Experience", "Eliminate physical cash bottlenecks through integrated digital payments (UPI simulation and RFID meal smartcards).")
    add_bullet("Operational Analytics & Stock Toggles", "Provide canteen vendors with live bestseller statistics, revenue counters, and real-time inventory management.")
    add_bullet("Zero-Configuration Embedded Database", "Deploy a high-concurrency embedded SQLite database with WAL mode and 30-day automatic data cleanup.")

    # Q8
    add_question_heading("8", "Use Cases – Who Will Use Your Project and How?")
    add_subheading("Primary Actors & Use Case Scenarios:")
    add_bullet("College Students & Faculty (Customers)", "Log in or register an individual account; browse live evening snack categories; add items with kitchen notes (e.g., 'extra chutney', 'less spicy'); checkout via UPI / RFID SmartCard; receive unique Order ID and secret 4-digit PIN; track live order status; walk up to Counter #1 when ready, state secret PIN, and claim fresh hot food.")
    add_bullet("Canteen Kitchen Staff & Operators (Vendors)", "Monitor the live WebSocket queue; accept orders and click 'Start Cooking'; mark orders as 'Ready for Pickup'; prompt the student for their secret PIN; enter the 4 digits into the touchscreen keypad modal; release food upon verified match; toggle item availability in the Stock Manager.")
    add_bullet("Canteen Administrators & Management", "Track real-time revenue, monitor bestselling items and order volumes, review completed order history, and maintain database performance with automated 30-day order purges.")
    add_image_if_exists("screenshot_3_cart.png", "Figure 3: Interactive Snack Tray (Cart) Drawer with Custom Cooking Notes and Price Breakdown")

    # Q9
    add_question_heading("9", "Technology Stack – Programming Languages, Frameworks, Tools, and Databases Used")
    
    tech_table = doc.add_table(rows=5, cols=3)
    tech_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    tech_table.autofit = False

    t_headers = ["Layer", "Technologies / Frameworks", "Role & Description"]
    t_rows = [
        ("Frontend", "React 19, Vite 8.3, Tailwind CSS v4, Lucide React, Canvas-Confetti", "Responsive SPA with modern glassmorphism UI, hot-reloading dev server, vector iconography, and audio-visual celebration feedback."),
        ("Backend", "Node.js, Express.js v5, Socket.io v4, bcryptjs, CORS", "RESTful API services, bi-directional WebSocket event bus, cryptographic PIN/password hashing, and middleware pipeline."),
        ("Database & Storage", "SQLite via better-sqlite3 (WAL Mode Enabled)", "Zero-setup embedded ACID-compliant relational storage with WAL concurrency and auto-purging of records older than 30 days."),
        ("Tools & Automation", "Playwright, Concurrently, Git, GitHub, Python (python-docx)", "Browser automation & test screenshot capture, parallel dev execution, version control, and automated documentation generation.")
    ]

    t_widths = [Inches(1.5), Inches(2.2), Inches(2.8)]
    for c_idx, h_text in enumerate(t_headers):
        cell = tech_table.rows[0].cells[c_idx]
        cell.width = t_widths[c_idx]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, 100, 100, 120, 120)
        p = cell.paragraphs[0]
        r = p.add_run(h_text)
        r.font.bold = True
        r.font.size = Pt(10)
        r.font.color.rgb = RGBColor(255, 255, 255)

    for r_idx, row_data in enumerate(t_rows):
        row = tech_table.rows[r_idx + 1]
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.width = t_widths[c_idx]
            bg = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
            set_cell_background(cell, bg)
            set_cell_margins(cell, 80, 80, 120, 120)
            p = cell.paragraphs[0]
            r = p.add_run(val)
            r.font.size = Pt(9.5)
            if c_idx == 0:
                r.font.bold = True
                r.font.color.rgb = COLOR_PRIMARY

    doc.add_paragraph().paragraph_format.space_after = Pt(8)
    add_image_if_exists("screenshot_4_payment.png", "Figure 4: Express Cashless Checkout Modal with Multi-App UPI Simulation and Campus RFID SmartCard")

    # Q10
    add_question_heading("10", "Software and Hardware Requirements")
    add_subheading("Software Requirements:")
    add_bullet("Operating System", "Windows 10/11, macOS, or Ubuntu/Linux")
    add_bullet("Runtime Environment", "Node.js (v18.x or v20.x+) and npm (v9.x+)")
    add_bullet("Web Browser", "Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari (Desktop and Mobile)")
    add_bullet("Database Engine", "Embedded SQLite (self-contained via better-sqlite3; no external database server setup required)")
    
    add_subheading("Hardware Requirements:")
    add_bullet("Client Devices (Students & Staff)", "Any standard smartphone, tablet, laptop, or PC with active Wi-Fi / 4G / 5G connectivity and minimum 2 GB RAM.")
    add_bullet("Server / Host Device", "Standard PC or cloud instance with Dual-Core x64 CPU, minimum 4 GB RAM, and 500 MB free storage.")

    # Q11
    add_question_heading("11", "Benefits and Advantages")
    add_bullet("Eliminates Counter Crowding", "Decouples order queuing from waiting; students only arrive at Counter #1 when their order is called.")
    add_bullet("Eliminates Food Theft & Collection Mistakes", "The secret 4-digit PIN is known only to the student and verified cryptographically on the staff POS touchscreen.")
    add_bullet("Real-Time Kitchen Visibility", "Kitchen staff prepare items just-in-time, ensuring snacks are hot and minimizing uncollected waste.")
    add_bullet("Instant Cashless Speed", "Zero cash-handling delays at the counter; pre-authorized payments enable sub-5-second food collections.")
    add_bullet("Lightweight & Low Maintenance", "Embedded SQLite with WAL mode requires zero cloud DB hosting fees, zero DB administration, and runs offline on campus LAN.")
    add_image_if_exists("screenshot_5_order_pin.png", "Figure 5: Live Order Tracking Screen with Secret 4-Digit Verification PIN (#ORD-8766)")

    # Q12
    add_question_heading("12", "Limitations and Challenges")
    add_bullet("Pickup Counter Terminal Requirement", "Canteen staff requires a mobile tablet or PC at Counter #1 to verify PINs and update order statuses.")
    add_bullet("Active Campus Wi-Fi / Data Dependency", "Real-time WebSocket events require an active network connection; if a student disconnects, they must tap 'Sync Status' to refresh order state.")
    add_bullet("Simulated Payment Gateway (Academic Environment)", "The current build utilizes realistic simulated UPI intent URIs and simulated RFID SmartCard deduction rather than live production commercial merchant accounts due to KYC registration requirements.")
    add_bullet("Single-Station Routing (MVP Scope)", "Designed for a central campus canteen; multi-vendor food court routing (franchise sub-counters) is planned for the next development iteration.")

    # Q13
    add_question_heading("13", "Current Project Status – What Have You Completed So Far?")
    add_body("The project has achieved a fully functional, end-to-end interactive MVP. Completed milestones include:")
    add_bullet("Authentication & Profile System", "Registration and login for students and staff with custom user profiles and credentials.")
    add_bullet("Dynamic Menu Catalog", "Full evening snack catalog with categories, real-time search, prices, veg tags, preparation times, and badges.")
    add_bullet("Interactive Tray (Cart)", "Quantity modifiers, subtotal calculations, express queue fee exemptions, and special kitchen instructions.")
    add_bullet("Cashless Checkout Engine", "Multi-app UPI intent routing (GPay, PhonePe, Paytm, BHIM, CRED) and simulated RFID SmartCard meal deductions.")
    add_bullet("Cryptographic PIN Generation", "Secure server-side generation of 4-digit secret PINs stored as bcrypt hashes.")
    add_bullet("Live WebSocket Kitchen Queue", "Real-time kitchen cards showing incoming orders, customer details, and one-click status transitions (Received → Cooking → Ready).")
    add_bullet("POS PIN Verification Keypad", "Touchscreen on-screen keypad on vendor counter to verify student PIN with audio chime and confetti celebration.")
    add_bullet("Live Stock Manager", "Real-time toggle switches for items to instantly update customer menus when sold out.")
    add_bullet("Analytics & Revenue Engine", "Real-time metrics tracking active orders, completed count, today's revenue, and bestselling item rankings.")
    add_bullet("Automated SQLite Data Purge", "Automated cleanup routine that safely deletes orders and line items older than 30 days.")
    add_image_if_exists("screenshot_6_vendor_dashboard.png", "Figure 6: Canteen Vendor Live Order Fulfillment Dashboard with Active Queue and Metrics")

    # Q14
    add_question_heading("14", "Project Completion Percentage (0–100%)")
    add_body("Current Completion: 90% (Fully functional, operational, and demonstrated real-time MVP).")

    # Q15
    add_question_heading("15", "Current Working Module")
    add_body("Module 5: Real-Time Counter PIN Verification & Live Vendor Order Lifecycle Management.")
    add_body(
        "Focus on fine-tuning counter PIN verification ergonomics, WebSocket event resilience under high concurrency, "
        "and audio-visual pickup confirmations between student and vendor interfaces."
    )
    add_image_if_exists("screenshot_7_pin_modal.png", "Figure 7: Counter Pickup Verification Touchscreen POS Keypad Modal with Cryptographic Hash Check")

    # Q16
    add_question_heading("16", "Remaining Work")
    add_bullet("Production Payment Gateway Sandbox", "Integration with Razorpay / Cashfree test sandbox APIs for real test-card and UPI QR processing.")
    add_bullet("Web Push Notifications / SMS Alerts", "Browser Service Worker notifications and SMS gateway alerts so students get notified even if their browser tab is minimized.")
    add_bullet("Camera QR Code Counter Scanner", "Optional QR code scanner on vendor POS for sub-second contactless scanning in addition to 4-digit PIN.")
    add_bullet("Multi-Counter Routing", "Sub-dividing orders into specific pickup stations (e.g., Counter #1 Hot Snacks, Counter #2 Fresh Juices).")
    add_bullet("CSV / Excel Financial Reporting", "One-click export of daily and monthly canteen revenue reports for accounting audits.")
    add_image_if_exists("screenshot_8_stock_manager.png", "Figure 8: Live Rush Hour Menu Inventory & Stock Toggles for Canteen Staff")

    # Q17
    add_question_heading("17", "Estimated Time Required to Complete the Project")
    add_body(
        "Estimated Time: 2 to 3 Weeks (approximately 15 to 20 working days to implement sandbox payment gateways, "
        "Web Push notifications, multi-counter routing, and final production cloud deployment on Render / Vercel)."
    )

    # Q18
    add_question_heading("18", "GitHub Status")
    add_body("In Progress (Configured with Git version control and prepared for remote repository hosting).")

    # Q19
    add_question_heading("19", "GitHub Repository Link (if Available)")
    add_body("https://github.com/Saikumar050714/CampusBite")

    # Q20
    add_question_heading("20", "Next Steps – What Will You Work on Next?")
    add_bullet("Step 1: Remote GitHub Synchronization", "Push the complete local repository to https://github.com/Saikumar050714/CampusBite with clean commit history, technical documentation, and MIT licensing.")
    add_bullet("Step 2: Web Push & PWA Capabilities", "Implement Progressive Web App (PWA) service worker to enable mobile home-screen installation and native push notifications when orders are marked 'Ready'.")
    add_bullet("Step 3: QR Code Counter Scanning", "Generate a scannable dynamic QR code on the order confirmation screen as an instant alternative to verbal PIN recitation.")
    add_bullet("Step 4: Load Testing & Campus Trial", "Conduct simulated multi-user concurrent ordering tests (100–500 simultaneous users) on local campus network to evaluate WebSocket throughput and latency.")

    # Save to all target filenames
    targets = [
        r"c:\Users\saiku\Documents\Coding\Project\CampusBite\projectStatus.docx",
        r"c:\Users\saiku\Documents\Coding\Project\CampusBite\24P31A0507.docx",
        r"c:\Users\saiku\Documents\Coding\Project\CampusBite\RollNumber.docx",
        r"c:\Users\saiku\Documents\Coding\Project\CampusBite\README.docx"
    ]

    for t in targets:
        doc.save(t)
        print(f"Successfully saved: {t}")

if __name__ == '__main__':
    create_report()
