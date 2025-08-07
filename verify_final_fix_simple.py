import asyncio
from playwright.async_api import async_playwright, expect
import os
import re

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()

        file_path = os.path.abspath('index.html')
        await page.goto(f'file://{file_path}')

        await page.wait_for_selector("#loader", state="hidden", timeout=10000)

        await page.locator("#ai-assistant-btn").click()

        await page.wait_for_timeout(500) # Wait for any JS/CSS transitions

        await page.screenshot(path="final_verification_attempt.png")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
