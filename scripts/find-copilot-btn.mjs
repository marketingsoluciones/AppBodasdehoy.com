import { chromium } from 'playwright';

async function findCopilotButton() {
  console.log('🔍 Buscando elementos del Copilot...\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://app-test.bodasdehoy.com', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  await page.waitForTimeout(3000);

  // Buscar elementos con "copilot" en cualquier atributo
  const copilotElements = await page.$$eval('*', els => {
    return els.filter(el => {
      const html = el.outerHTML.toLowerCase();
      return html.includes('copilot');
    }).map(el => ({
      tag: el.tagName,
      class: (el.className || '').substring(0, 80),
      id: el.id,
      text: (el.innerText || '').substring(0, 30).replace(/\n/g, ' ')
    })).slice(0, 10);
  });

  console.log('📋 Elementos con "copilot":');
  copilotElements.forEach((el, i) => {
    console.log('  [' + i + '] <' + el.tag + '> class="' + el.class + '" text="' + el.text + '"');
  });

  // Buscar todos los botones
  const allButtons = await page.$$eval('button, [role="button"]', btns => {
    return btns.map(b => ({
      tag: b.tagName,
      text: (b.innerText || '').substring(0, 40).replace(/\n/g, ' '),
      class: (b.className || '').substring(0, 60)
    }));
  });

  console.log('\n📋 Todos los botones (' + allButtons.length + '):');
  allButtons.slice(0, 20).forEach((b, i) => {
    console.log('  [' + i + '] <' + b.tag + '> "' + b.text + '" class="' + b.class + '"');
  });

  // Buscar links con "copilot"
  const links = await page.$$eval('a', as => {
    return as.filter(a => {
      const text = (a.innerText || '').toLowerCase();
      const href = (a.href || '').toLowerCase();
      return text.includes('copilot') || href.includes('copilot');
    }).map(a => ({
      text: a.innerText.substring(0, 30),
      href: a.href
    }));
  });

  console.log('\n📋 Links con "copilot":');
  links.forEach((l, i) => {
    console.log('  [' + i + '] "' + l.text + '" -> ' + l.href);
  });

  await browser.close();
  console.log('\n✅ Búsqueda completada');
}

findCopilotButton().catch(e => console.error('Error:', e.message));
