import time
import json
from playwright.sync_api import sync_playwright

def capture():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()

        # 1. Student Dashboard & Place Order
        student_user = {
            "id": 10,
            "username": "saikumar",
            "full_name": "Saikumar Batta",
            "phone": "9876543210",
            "student_id": "21B91A0501",
            "role": "user"
        }
        page.goto('http://localhost:5173')
        page.evaluate(f"() => {{ localStorage.setItem('campusbite_user', JSON.stringify({json.dumps(student_user)})); }}")
        page.reload()
        page.wait_for_selector('text=CampusBite', timeout=10000)
        time.sleep(1)

        # Add item
        add_btn = page.locator('button:has-text("Add to Tray")').first
        if add_btn.is_visible():
            add_btn.click()
            time.sleep(0.8)

            # CartDrawer is open, click Pay & Generate Pickup PIN
            pay_generate_btn = page.locator('button:has-text("Pay & Generate Pickup PIN")').first
            if pay_generate_btn.is_visible():
                pay_generate_btn.click()
                time.sleep(0.8)

                # In PaymentModal, click Campus SmartCard tab
                smartcard_tab = page.locator('button:has-text("Campus SmartCard")').first
                if smartcard_tab.is_visible():
                    smartcard_tab.click()
                    time.sleep(0.5)

                    # Click Tap SmartCard
                    tap_btn = page.locator('button:has-text("Tap SmartCard")').first
                    if tap_btn.is_visible():
                        tap_btn.click()
                        time.sleep(2.5)

                        # Now OrderConfirmation is visible!
                        page.wait_for_selector('text=Secret Pickup PIN', timeout=10000)
                        time.sleep(1)
                        page.screenshot(path='screenshot_5_order_pin.png')
                        print("Captured screenshot_5_order_pin.png")

        # 2. Staff Dashboard
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
        time.sleep(1.5)

        # Click Stock Manager Tab
        stock_tab = page.locator('button:has-text("Stock Manager")').first
        if stock_tab.is_visible():
            stock_tab.click()
            time.sleep(1)
            page.screenshot(path='screenshot_8_stock_manager.png')
            print("Captured screenshot_8_stock_manager.png")

        # Switch back to Order Queue
        queue_tab = page.locator('button:has-text("Order Queue")').first
        if queue_tab.is_visible():
            queue_tab.click()
            time.sleep(1)

        # Advance order to kitchen
        start_btn = page.locator('button:has-text("Start Cooking")').first
        if start_btn.is_visible():
            start_btn.click()
            time.sleep(1)

        # Advance order to ready
        ready_btn = page.locator('button:has-text("Mark as Ready for Pickup")').first
        if ready_btn.is_visible():
            ready_btn.click()
            time.sleep(1)

        # Prompt Student for PIN
        pin_prompt_btn = page.locator('button:has-text("Prompt Student for PIN")').first
        if pin_prompt_btn.is_visible():
            pin_prompt_btn.click()
            time.sleep(1)
            page.screenshot(path='screenshot_7_pin_modal.png')
            print("Captured screenshot_7_pin_modal.png")

        browser.close()
        print("Done capturing remaining screenshots!")

if __name__ == '__main__':
    capture()
