import puppeteer from 'puppeteer';

/**
 * Renders a proposal template to a PDF buffer using a headless browser.
 * @param templateId  The template folder name (e.g. "default")
 * @param proposalId  The proposal UUID
 * @param port        The port this templater is running on (for the internal render URL)
 */
export async function generatePdf(templateId: string, proposalId: string, port: number | string): Promise<Buffer> {
  const renderUrl = `http://localhost:${port}/pdf/${templateId}/${proposalId}`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Wait for network to be fully idle so all assets (tailwind, CSS) have loaded
    await page.goto(renderUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    // Run the page-overflow handler JS before capturing
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        // Give the overflow handler script time to reflow content
        setTimeout(resolve, 500);
      });
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
