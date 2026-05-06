const express = require('express');
const path = require('path');

const app = express();

// Serve built static files
app.use(express.static(path.join(__dirname, 'dist')));

// Content fetch proxy (same as Vite dev middleware, for production)
app.get('/api/fetch', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RSVP-Speed-Reader/2.0)',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!resp.ok) {
      return res
        .status(502)
        .json({ error: `Upstream returned ${resp.status} ${resp.statusText}` });
    }

    const html = await resp.text();
    res.type('html').send(html);
  } catch (e) {
    res
      .status(500)
      .json({ error: `Failed to fetch: ${e.message}` });
  }
});

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`RSVP Speed Reader running on :${PORT}`);
});
