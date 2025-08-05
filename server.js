const express = require('express');
const { fetch } = require('undici'); // <- ici on importe fetch depuis undici
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

const ICS_URL = 'https://edt.grenoble-inp.fr/directCal/2025-2026/etudiant/phelma?resources=20917';

app.get('/edt', async (req, res) => {
  try {
    const auth = Buffer.from(`${process.env.EDT_USER}:${process.env.EDT_PASS}`).toString('base64');

    const response = await fetch(ICS_URL, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (!response.ok) {
      return res.status(response.status).send('Erreur ICS : accès refusé');
    }

    const ics = await response.text();
    res.set('Content-Type', 'text/calendar');
    res.send(ics);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

app.listen(PORT, () => {
  console.log(`Serveur prêt sur http://localhost:${PORT}`);
});
