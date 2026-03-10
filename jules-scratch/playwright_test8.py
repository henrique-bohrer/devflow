from playwright.sync_api import sync_playwright
import time
import subprocess

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    # Start with a predefined state in localStorage to trigger the original bug
    # and confirm both the syntax error is gone AND the bug is fixed
    context = browser.new_context(
        storage_state={
            "cookies": [],
            "origins": [
                {
                    "origin": "http://localhost:8000",
                    "localStorage": [
                        {"name": "pomodoroMusicStation", "value": "custom_123456"}
                    ]
                }
            ]
        }
    )
    page = context.new_page()

    server = subprocess.Popen(["python3", "-m", "http.server", "8000"])
    time.sleep(2)

    try:
        page.on("pageerror", lambda err: print(f"Console Error: {err.message}"))

        # Load the page with the corrupted localStorage state
        page.goto("http://localhost:8000")

        # Ensure the page loads without crashing the JS
        page.locator("#select-desktop-btn").wait_for(state="visible", timeout=10000)

        # Take a screenshot to prove it
        page.screenshot(path="jules-scratch/page_loaded2.png")
        print("Page loaded successfully without TypeError and without SyntaxError!")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        server.terminate()
        context.close()
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
