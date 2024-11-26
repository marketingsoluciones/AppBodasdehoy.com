import puppeteer, { PaperFormat } from 'puppeteer';

export interface GeneratePdfOptions {
  html: string;
  filename: string;
  format?: PaperFormat;
}

export async function generatePdf({ html, filename, format = 'LETTER' }: GeneratePdfOptions) {
  console.log(10004, html)
  // const browser = await puppeteer.launch({
  //   headless: true, // Si deseas ejecutar Chrome en modo headless
  //   args: ['--no-sandbox']
  // });
  // const page = await browser.newPage();
  // await page.setContent(html);
  // await page.pdf({ path, format });
  // await browser.close();


  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto(html);
  await page.waitForSelector("#elementControl");
  const pdfBuffer = await page.pdf({ format, margin: { bottom: '1cm', left: "1cm", right: "1cm", top: "1cm" } });
  await browser.close();
  return pdfBuffer

}