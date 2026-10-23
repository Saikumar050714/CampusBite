import time
import json
from playwright.sync_api import sync_playwright

def capture():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()

        # 1. Student view with active order ORD-8766 (PIN display)
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
        page.wait_for_selector('#order-confirmation-section', timeout=10000)
        time.sleep(1.5)
        page.screenshot(path='screenshot_5_order_pin.png')
        print("Captured screenshot_5_order_pin.png successfully!")

        # 2. Vendor view - Advance order to READY and open PIN modal
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

        # Look for "Mark Ready" or click "Start Cooking" then "Mark Ready"
        mark_ready_btn = page.locator('button:has-text("Mark Ready")').first
        if not mark_ready_btn.is_visible():
            start_btn = page.locator('button:has-text("Start Cooking")').first
            if start_btn.is_visible():
                start_btn.click()
                time.sleep(1)

        mark_ready_btn = page.locator('button:has-text("Mark Ready")').first
        if mark_ready_btn.is_visible():
            mark_ready_btn.click()
            time.sleep(1)

        # Now click "Verify 4-Digit PIN"
        verify_btn = page.locator('button:has-text("Verify 4-Digit PIN")').first
        if verify_btn.is_visible():
            verify_btn.click()
            time.sleep(1)
            page.screenshot(path='screenshot_7_pin_modal.png')
            print("Captured screenshot_7_pin_modal.png successfully!")

        # Switch to Most Sold Items / Analytics tab
        close_btn = page.locator('button:has-text("Cancel"), button svg.lucide-x').first
        if close_btn.is_visible():
            close_btn.click()
            time.sleep(0.5)

        bestsellers_tab = page.locator('button:has-text("Most Sold Items")').first
        if bestsellers_tab.is_visible():
            bestsellers_tab.click()
            time.sleep(1)
            page.screenshot(path='screenshot_9_analytics.png')
            print("Captured screenshot_9_analytics.png successfully!")

        browser.close()
        print("Final screenshots completed!")

if __name__ == '__main__':
    capture()
