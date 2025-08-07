import asyncio
from playwright.async_api import async_playwright, expect
import os
import re

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await context.new_page()

        file_path = os.path.abspath('index.html')
        await page.goto(f'file://{file_path}')

        await expect(page.locator("#loader")).to_be_hidden(timeout=10000)

        # 1. Verificar a posição do botão do assistente
        assistant_button = page.locator("#ai-assistant-btn")
        await expect(assistant_button).to_be_visible()

        # 2. Abrir a janela de chat
        await assistant_button.click()
        chat_window = page.locator("#ai-chat-window")
        await expect(chat_window).to_have_class(re.compile(r'is-chat-open'))

        # 3. Tirar screenshot para verificação visual do layout final
        await page.screenshot(path="final_layout_with_chat.png")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
