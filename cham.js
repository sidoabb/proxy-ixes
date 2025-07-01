const express = require('express');
const puppeteer = require('puppeteer');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

app.get('/chamilo', async (req, res) => {
  let browser;
  try {
    browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // ✅ suffisant
      });
      
    const page = await browser.newPage();
    await page.goto('https://cas-simsu.grenet.fr/login?service=https%3A%2F%2Fchamilo.grenoble-inp.fr%2Fmain%2Fauth%2Fcas%2Flogincas.php', {
      waitUntil: 'networkidle2'
    });

    console.log('📍 URL actuelle :', page.url());

    // Connexion CAS
    await page.type('#username', process.env.CAS_USER);
    await page.type('#password', process.env.CAS_PASS);
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);

    // Aller vers le cours
    await page.goto('https://chamilo.grenoble-inp.fr/courses/PHELMACATALOGUE/index.php?id_session=0', {
      waitUntil: 'networkidle2'
    });

    const html = await page.content();
    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('❌ Erreur :', err);
    res.status(500).send('Erreur lors de la récupération de Chamilo');
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur Chamilo prêt sur http://localhost:${PORT}`);
});
