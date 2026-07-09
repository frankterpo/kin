import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH ?? '/usr/local/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox'],
})

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true })
  await page.goto(process.env.APP_URL ?? 'http://127.0.0.1:5173', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /train my taste/i }).click()
  await page.getByText('What feels right?').waitFor()

  for (let index = 0; index < 8; index += 1) {
    await page.locator('.like-action').click()
  }

  await page.getByText('Now it evolves.').waitFor()
  await page.getByText('BRED FOR YOU').waitFor()
  await page.getByRole('button', { name: /my taste/i }).click()
  await page.getByText('taste.mdc').waitFor()
  await page.getByRole('button', { name: /copy cursor rule/i }).waitFor()
  console.log('Smoke test passed: intro → learning → variant → taste file')
} finally {
  await browser.close()
}
