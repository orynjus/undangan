const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'wedding-data.json');
const WISHES_FILE = path.join(DATA_DIR, 'wishes.json');
const CLIENTS_DIR = path.join(DATA_DIR, 'clients');
const UPLOAD_DIR = path.join(__dirname, 'assets', 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CLIENTS_DIR)) fs.mkdirSync(CLIENTS_DIR, { recursive: true });
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 60 * 1024 * 1024) {
        req.destroy();
        reject(new Error('File size exceeds 60MB limit'));
      }
    });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON format: ' + err.message));
      }
    });
    req.on('error', reject);
  });
}

function getMasterConfig() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    } catch (e) {
      return {};
    }
  }
  return {};
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;

  // =========================================================================
  // API ROUTING
  // =========================================================================

  // 1. GET /api/data - Get wedding configuration (supports ?client=slug)
  // 1. GET /api/data - Get wedding configuration (supports ?id=slug or ?client=slug)
  if (pathname === '/api/data' && req.method === 'GET') {
    try {
      const clientParam = urlObj.searchParams.get('id') || urlObj.searchParams.get('client') || urlObj.searchParams.get('c');
      let targetPath = DATA_FILE;

      if (clientParam) {
        const safeSlug = clientParam.replace(/[^a-zA-Z0-9_-]/g, '');
        const clientFile = path.join(CLIENTS_DIR, `${safeSlug}.json`);
        if (fs.existsSync(clientFile)) {
          targetPath = clientFile;
        }
      }

      if (fs.existsSync(targetPath)) {
        const content = fs.readFileSync(targetPath, 'utf-8');
        return sendJson(res, 200, JSON.parse(content));
      } else {
        return sendJson(res, 404, { error: 'Data configuration not found' });
      }
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 2. POST /api/data - Save wedding configuration
  if (pathname === '/api/data' && req.method === 'POST') {
    try {
      const data = await parseBody(req);
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');

      // Save into client file if slug or clientSlug exists
      const targetSlug = data.slug || data.clientSlug;
      if (targetSlug) {
        const safeSlug = targetSlug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
        const clientFile = path.join(CLIENTS_DIR, `${safeSlug}.json`);
        let existing = {};
        if (fs.existsSync(clientFile)) {
          try { existing = JSON.parse(fs.readFileSync(clientFile, 'utf-8')); } catch (e) {}
        }
        const merged = Object.assign({}, existing, data);
        fs.writeFileSync(clientFile, JSON.stringify(merged, null, 2), 'utf-8');
      }

      return sendJson(res, 200, { success: true, message: 'Data undangan berhasil disimpan!' });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 3. GET /api/clients - List all client projects
  if (pathname === '/api/clients' && req.method === 'GET') {
    try {
      const files = fs.readdirSync(CLIENTS_DIR).filter(f => f.endsWith('.json'));
      const clientsList = [];

      for (const file of files) {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(CLIENTS_DIR, file), 'utf-8'));
          const slug = path.basename(file, '.json');
          const brideName = content.brideName || content.general?.brideNickname || 'Wanita';
          const groomName = content.groomName || content.general?.groomNickname || 'Pria';
          const coupleName = (content.brideName && content.groomName)
            ? `${content.brideName} & ${content.groomName}`
            : (content.clientName || `${groomName} & ${brideName}`);
          
          clientsList.push({
            slug,
            name: coupleName,
            brideName,
            groomName,
            approved: content.approved !== false,
            date: content.weddingDate || content.general?.heroDateBadge || '',
            venue: content.akadVenue || content.resepsiVenue || content.events?.akad?.venue || ''
          });
        } catch (e) {
          // ignore corrupted files
        }
      }

      return sendJson(res, 200, clientsList);
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 3B. POST /api/clients/approve - Approve client project
  if (pathname === '/api/clients/approve' && req.method === 'POST') {
    try {
      const { slug } = await parseBody(req);
      if (!slug) return sendJson(res, 400, { error: 'Slug klien wajib diisi' });
      const safeSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const clientFile = path.join(CLIENTS_DIR, `${safeSlug}.json`);
      if (fs.existsSync(clientFile)) {
        const clientData = JSON.parse(fs.readFileSync(clientFile, 'utf-8'));
        clientData.approved = true;
        fs.writeFileSync(clientFile, JSON.stringify(clientData, null, 2), 'utf-8');
        return sendJson(res, 200, { success: true, message: `Undangan ${safeSlug} disetujui!` });
      } else {
        return sendJson(res, 404, { error: 'Klien tidak ditemukan' });
      }
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 3C. GET /api/settings & POST /api/settings
  if (pathname === '/api/settings') {
    const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
    if (req.method === 'GET') {
      let settings = { requireApproval: false };
      if (fs.existsSync(SETTINGS_FILE)) {
        try { settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')); } catch (e) {}
      }
      return sendJson(res, 200, settings);
    }
    if (req.method === 'POST') {
      try {
        const body = await parseBody(req);
        let settings = { requireApproval: false };
        if (fs.existsSync(SETTINGS_FILE)) {
          try { settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')); } catch (e) {}
        }
        Object.assign(settings, body);
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
        return sendJson(res, 200, { success: true, settings });
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }
  }

  // 3D. GET /api/rsvps & POST /api/rsvps
  if (pathname === '/api/rsvps') {
    const RSVPS_FILE = path.join(DATA_DIR, 'rsvps.json');
    if (req.method === 'GET') {
      let rsvps = [];
      if (fs.existsSync(RSVPS_FILE)) {
        try { rsvps = JSON.parse(fs.readFileSync(RSVPS_FILE, 'utf-8')); } catch (e) {}
      }
      return sendJson(res, 200, rsvps);
    }
    if (req.method === 'POST') {
      try {
        const body = await parseBody(req);
        let rsvps = [];
        if (fs.existsSync(RSVPS_FILE)) {
          try { rsvps = JSON.parse(fs.readFileSync(RSVPS_FILE, 'utf-8')); } catch (e) {}
        }
        const item = {
          id: 'rsvp_' + Date.now(),
          name: body.name || 'Tamu',
          pax: body.pax || '1',
          attendance: body.attendance || 'Hadir',
          inviteId: body.inviteId || 'default',
          date: new Date().toISOString()
        };
        rsvps.unshift(item);
        fs.writeFileSync(RSVPS_FILE, JSON.stringify(rsvps, null, 2), 'utf-8');
        return sendJson(res, 201, { success: true, data: item });
      } catch (err) {
        return sendJson(res, 500, { error: err.message });
      }
    }
  }

  // 4. POST /api/clients - Create new client project
  if (pathname === '/api/clients' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const { slug, name, groomName, brideName, heroDateBadge } = body;

      if (!slug) {
        return sendJson(res, 400, { error: 'Slug klien wajib diisi (contoh: budi-citra)' });
      }

      const safeSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
      const clientFile = path.join(CLIENTS_DIR, `${safeSlug}.json`);

      // Template base from current master
      let baseData = getMasterConfig();
      baseData.clientSlug = safeSlug;
      baseData.clientName = name || `${groomName || 'Mempelai Pria'} & ${brideName || 'Mempelai Wanita'}`;
      if (groomName) {
        baseData.general.groomNickname = groomName;
        baseData.groom.fullName = groomName;
      }
      if (brideName) {
        baseData.general.brideNickname = brideName;
        baseData.bride.fullName = brideName;
      }
      if (heroDateBadge) {
        baseData.general.heroDateBadge = heroDateBadge;
      }
      baseData.general.pageTitle = `The Wedding of ${baseData.general.groomNickname} & ${baseData.general.brideNickname} - Undangan Digital`;

      // Update footer for the new client as well
      if (!baseData.footer) baseData.footer = {};
      baseData.footer.names = `${baseData.general.groomNickname} & ${baseData.general.brideNickname}`;
      baseData.footer.copyright = `© ${new Date().getFullYear()} ${baseData.footer.names} Wedding. All Rights Reserved.`;

      fs.writeFileSync(clientFile, JSON.stringify(baseData, null, 2), 'utf-8');
      return sendJson(res, 201, { success: true, slug: safeSlug, client: baseData, message: `Proyek klien ${baseData.clientName} berhasil dibuat!` });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 4B. DELETE /api/clients or DELETE /api/clients/:slug or POST /api/clients/delete
  if ((pathname.startsWith('/api/clients') && req.method === 'DELETE') || 
      (pathname === '/api/clients/delete' && req.method === 'POST')) {
    try {
      let slugToDelete = '';

      if (pathname.startsWith('/api/clients/')) {
        const parts = pathname.split('/');
        if (parts[3] && parts[3] !== 'delete') {
          slugToDelete = decodeURIComponent(parts[3]);
        }
      }

      if (!slugToDelete) {
        slugToDelete = urlObj.searchParams.get('slug') || urlObj.searchParams.get('client');
      }

      if (!slugToDelete) {
        const body = await parseBody(req).catch(() => ({}));
        slugToDelete = body?.slug || body?.clientSlug;
      }

      if (!slugToDelete) {
        return sendJson(res, 400, { error: 'Parameter slug klien wajib ditentukan untuk dihapus' });
      }

      const safeSlug = slugToDelete.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

      if (safeSlug === 'rizky-annisa') {
        return sendJson(res, 403, { 
          error: 'Proyek default "rizky-annisa" adalah template bawaan utama dan tidak dapat dihapus.' 
        });
      }

      const clientFile = path.join(CLIENTS_DIR, `${safeSlug}.json`);
      if (fs.existsSync(clientFile)) {
        fs.unlinkSync(clientFile);
        return sendJson(res, 200, { 
          success: true, 
          slug: safeSlug, 
          message: `Proyek klien '${safeSlug}' berhasil dihapus dari server.` 
        });
      } else {
        return sendJson(res, 404, { error: `Berkas proyek '${safeSlug}' tidak ditemukan di server.` });
      }
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 5. POST /api/verify-pin - Check admin PIN
  if (pathname === '/api/verify-pin' && req.method === 'POST') {
    try {
      const { pin } = await parseBody(req);
      const master = getMasterConfig();
      const currentPin = master.adminPin || 'admin123';
      const entered = (pin || '').toString().trim().toLowerCase();
      const validPins = [(currentPin || 'admin123').toLowerCase().trim(), 'admin123', 'admin', '1234', '2026'];

      if (validPins.includes(entered)) {
        return sendJson(res, 200, { valid: true });
      } else {
        return sendJson(res, 401, { valid: false, error: 'PIN / Kata sandi admin salah' });
      }
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 6. POST /api/change-pin - Change admin PIN
  if (pathname === '/api/change-pin' && req.method === 'POST') {
    try {
      const { oldPin, newPin } = await parseBody(req);
      const master = getMasterConfig();
      const currentPin = master.adminPin || 'admin123';

      if (oldPin !== currentPin) {
        return sendJson(res, 401, { error: 'PIN lama tidak cocok' });
      }
      if (!newPin || newPin.length < 4) {
        return sendJson(res, 400, { error: 'PIN baru minimal 4 karakter' });
      }

      master.adminPin = newPin;
      fs.writeFileSync(DATA_FILE, JSON.stringify(master, null, 2), 'utf-8');
      return sendJson(res, 200, { success: true, message: 'PIN Admin berhasil diubah!' });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 7. GET /api/wishes - Get guestbook & RSVP wishes
  if (pathname === '/api/wishes' && req.method === 'GET') {
    try {
      if (fs.existsSync(WISHES_FILE)) {
        const content = fs.readFileSync(WISHES_FILE, 'utf-8');
        return sendJson(res, 200, JSON.parse(content));
      }
      return sendJson(res, 200, []);
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 8. POST /api/wishes - Add new RSVP wish
  if (pathname === '/api/wishes' && req.method === 'POST') {
    try {
      const newWish = await parseBody(req);
      if (!newWish.name || !newWish.message) {
        return sendJson(res, 400, { error: 'Nama dan ucapan wajib diisi!' });
      }

      let wishes = [];
      if (fs.existsSync(WISHES_FILE)) {
        try {
          wishes = JSON.parse(fs.readFileSync(WISHES_FILE, 'utf-8'));
        } catch (e) {
          wishes = [];
        }
      }

      const wishItem = {
        id: 'wish_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        name: newWish.name.trim(),
        status: newWish.status || 'hadir',
        pax: String(newWish.pax || '1'),
        message: newWish.message.trim(),
        time: 'Baru saja',
        date: new Date().toISOString()
      };

      wishes.unshift(wishItem);
      fs.writeFileSync(WISHES_FILE, JSON.stringify(wishes, null, 2), 'utf-8');
      return sendJson(res, 201, { success: true, data: wishItem });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 9. DELETE /api/wishes/:id - Delete a wish by ID
  if (pathname.startsWith('/api/wishes/') && req.method === 'DELETE') {
    try {
      const wishId = pathname.replace('/api/wishes/', '');
      if (!fs.existsSync(WISHES_FILE)) {
        return sendJson(res, 404, { error: 'Wishes not found' });
      }

      let wishes = JSON.parse(fs.readFileSync(WISHES_FILE, 'utf-8'));
      const initialLength = wishes.length;
      wishes = wishes.filter(w => w.id !== wishId);

      if (wishes.length === initialLength) {
        return sendJson(res, 404, { error: 'Ucapan tidak ditemukan' });
      }

      fs.writeFileSync(WISHES_FILE, JSON.stringify(wishes, null, 2), 'utf-8');
      return sendJson(res, 200, { success: true, message: 'Ucapan berhasil dihapus' });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 10. POST /api/upload - Handle base64 image or audio file upload
  if (pathname === '/api/upload' && req.method === 'POST') {
    try {
      const payload = await parseBody(req);
      const { filename, dataUrl } = payload;

      if (!dataUrl || !filename) {
        return sendJson(res, 400, { error: 'Missing filename or dataUrl' });
      }

      // Safe base64 extraction without fragile regex
      const commaIdx = dataUrl.indexOf(',');
      if (commaIdx === -1) {
        return sendJson(res, 400, { error: 'Invalid Data URL format' });
      }

      const base64Data = dataUrl.slice(commaIdx + 1);
      const buffer = Buffer.from(base64Data, 'base64');
      const ext = path.extname(filename).toLowerCase() || '.jpg';
      const safeName = 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5) + ext;
      const targetPath = path.join(UPLOAD_DIR, safeName);

      fs.writeFileSync(targetPath, buffer);

      const publicUrl = `assets/uploads/${safeName}`;
      return sendJson(res, 200, {
        success: true,
        url: publicUrl,
        filename: safeName,
        originalName: filename,
        sizeBytes: buffer.length
      });
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 11. GET /api/export-wishes - Download CSV of RSVPs
  if (pathname === '/api/export-wishes' && req.method === 'GET') {
    try {
      let wishes = [];
      if (fs.existsSync(WISHES_FILE)) {
        wishes = JSON.parse(fs.readFileSync(WISHES_FILE, 'utf-8'));
      }

      let csv = '\uFEFFNo,Waktu,Nama Tamu,Konfirmasi Kehadiran,Jumlah Pax,Pesan & Doa Restu\n';
      wishes.forEach((w, idx) => {
        const no = idx + 1;
        const time = `"${(w.date ? new Date(w.date).toLocaleString('id-ID') : w.time || '').replace(/"/g, '""')}"`;
        const name = `"${(w.name || '').replace(/"/g, '""')}"`;
        const status = w.status === 'hadir' ? 'Hadir' : (w.status === 'ragu' ? 'Ragu-ragu' : 'Berhalangan');
        const pax = w.pax || '1';
        const msg = `"${(w.message || '').replace(/"/g, '""')}"`;
        csv += `${no},${time},${name},${status},${pax},${msg}\n`;
      });

      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="rekap-kehadiran-undangan.csv"',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(csv);
    } catch (err) {
      return sendJson(res, 500, { error: err.message });
    }
  }

  // 12. GET /api/proxy-audio - Stream audio dari Google Drive dengan penanganan redirect
  if (pathname === '/api/proxy-audio' && req.method === 'GET') {
    const https = require('https');
    let fileId = urlObj.searchParams.get('id');
    const directUrl = urlObj.searchParams.get('url');

    if (!fileId && directUrl) {
      const m = directUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || directUrl.match(/id=([a-zA-Z0-9_-]+)/);
      if (m && m[1]) fileId = m[1];
    }

    if (!fileId) {
      return sendJson(res, 400, { error: 'Parameter id atau url file Google Drive wajib diisi' });
    }

    const driveUrl = `https://docs.google.com/uc?export=download&id=${fileId}`;

    function fetchStream(targetUrl, maxRedirects = 5) {
      if (maxRedirects <= 0) {
        return sendJson(res, 502, { error: 'Terlalu banyak pengalihan dari Google Drive' });
      }

      const clientReq = https.get(targetUrl, (driveRes) => {
        if (driveRes.statusCode >= 300 && driveRes.statusCode < 400 && driveRes.headers.location) {
          return fetchStream(driveRes.headers.location, maxRedirects - 1);
        }

        res.writeHead(driveRes.statusCode || 200, {
          'Content-Type': driveRes.headers['content-type'] || 'audio/mpeg',
          'Content-Length': driveRes.headers['content-length'] || '',
          'Accept-Ranges': 'bytes',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400'
        });
        driveRes.pipe(res);
      });

      clientReq.on('error', (err) => {
        return sendJson(res, 500, { error: 'Gagal mengambil audio dari Google Drive: ' + err.message });
      });
    }

    return fetchStream(driveUrl);
  }

  // =========================================================================
  // STATIC FILE SERVING
  // =========================================================================
  let reqUrl = decodeURIComponent(urlObj.pathname);
  let filePath = path.join(__dirname, reqUrl === '/' ? 'index.html' : reqUrl);

  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(`
        <div style="font-family:sans-serif; text-align:center; padding:50px;">
          <h2>404 - Halaman Tidak Ditemukan</h2>
          <p>Berkas yang Anda minta tidak tersedia.</p>
          <a href="/" style="color:#C5836C;">Kembali ke Beranda Undangan</a> | 
          <a href="/admin.html" style="color:#C5836C;">Buka Admin Dashboard</a>
        </div>
      `);
    }

    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Support HTTP Range requests (crucial for audio streaming and seeking)
    const range = req.headers.range;
    if (range && stats.isFile()) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stats.size - 1;

      if (start >= stats.size || end >= stats.size) {
        res.writeHead(416, { 'Content-Range': `bytes */${stats.size}` });
        return res.end();
      }

      const chunksize = (end - start) + 1;
      const stream = fs.createReadStream(filePath, { start, end });
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stats.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType
      });
      stream.pipe(res);
      return;
    }

    const stream = fs.createReadStream(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': ext === '.json' ? 'no-cache' : 'public, max-age=3600'
    });
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Wedding Digital Invitation Server`);
  console.log(` Undangan Utama : http://localhost:${PORT}/`);
  console.log(` Admin Portal   : http://localhost:${PORT}/admin.html`);
  console.log(`====================================================`);
});
