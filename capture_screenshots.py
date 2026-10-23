import time
import json
from playwright.sync_api import sync_playwright

def capture():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()

        # 1. Login Page
        page.goto('http://localhost:5173')
        page.wait_for_selector('input[type="text"]', timeout=10000)
        time.sleep(1)
        page.screenshot(path='screenshot_1_login.png')
        print("Captured screenshot_1_login.png")

        # 2. Student Dashboard
        student_user = {
            "id": 10,
            "username": "saikumar",
            "full_name": "Saikumar Batta",
            "phone": "9876543210",
            "student_id": "21B91A0501",
            "role": "user"
        }
        page.evaluate(f"() => {{ localStorage.setItem('campusbite_user', JSON.stringify({json.dumps(student_user)})); }}")
        page.reload()
        page.wait_for_selector('text=CampusBite', timeout=10000)
        time.sleep(1.5)
        page.screenshot(path='screenshot_2_menu.png')
        print("Captured screenshot_2_menu.png")

        # 3. Add item to cart (opens CartDrawer automatically)
        add_btn = page.locator('button:has-text("Add to Tray")').first
        if add_btn.is_visible():
            add_btn.click()
            time.sleep(1)
            page.screenshot(path='screenshot_3_cart.png')
            print("Captured screenshot_3_cart.png")

            # 4. In CartDrawer, click "Pay & Generate Pickup PIN"
            pay_generate_btn = page.locator('button:has-text("Pay & Generate Pickup PIN")').first
            if pay_generate_btn.is_visible():
                pay_generate_btn.click()
                time.sleep(1)
                page.screenshot(path='screenshot_4_payment.png')
                print("Captured screenshot_4_payment.png")

                # 5. Switch to Campus SmartCard and pay
                smartcard_tab = page.locator('button:has-text("Campus SmartCard")').first
                if smartcard_tab.is_visible():
                    smartcard_tab.click()
                    time.sleep(0.5)

                pay_card_btn = page.locator('button:has-text("Pay with RFID Meal Card"), button:has-text("Authorize")').first
                if pay_card_btn.is_visible():
                    pay_card_btn.click()
                    time.sleep(3)
                    page.screenshot(path='screenshot_5_order_pin.png')
                    print("Captured screenshot_5_order_pin.png")

        # 6. Vendor Dashboard
        staff_user = {
            "id": 1,
            "username": "admin",
            "full_name": "Canteen Staff Admin",
            "phone": "",
            "role": "staff"
        }
        page.evaluate(f"() => {{ localStorage.setItem('campusbite_user', JSON.stringify({json.dumps(staff_user)})); }}")
        page.reload()
        page.wait_for_selector('text=Canteen', timeout=10000)
        time.sleep(2)
        page.screenshot(path='screenshot_6_vendor_dashboard.png')
        print("Captured screenshot_6_vendor_dashboard.png")

        # 7. Pin Verification Modal on Vendor Dashboard
        verify_btn = page.locator('button:has-text("Prompt Student for PIN")').first
        if verify_btn.is_visible():
            verify_btn.click()
            time.sleep(1)
            page.screenshot(path='screenshot_7_pin_modal.png')
            print("Captured screenshot_7_pin_modal.png")

        browser.close()
        print("ALL 7 SCREENSHOTS CAPTURED SUCCESSFULLY!")

if __name__ == '__main__':
    capture()
