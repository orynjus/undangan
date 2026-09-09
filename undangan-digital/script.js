/**
 * SATUACARA DIGITAL INVITATION SPA LOGIC
 * Mengintegrasikan Landing Page, Dashboard Klien, Admin Panel, dan Undangan Digital dalam 1 file
 */

(function () {
  'use strict';

  // --- DEFAULT MASTER DATA ---
  const DEFAULT_DATA = {
    slug: 'kirana-bayu',
    brideName: 'Kirana',
    brideFullName: 'Kirana Ayu Pratiwi',
    brideParents: 'Putri dari<br>Bapak Herman Pratiwi & Ibu Susanti',
    bridePhotoUrl: 'https://picsum.photos/id/64/400/500',
    brideInstagram: '@kirana.ayu',
    groomName: 'Bayu',
    groomFullName: 'Bayu Aditya Nugraha',
    groomParents: 'Putra dari<br>Bapak Nugroho Wibowo & Ibu Ratna Dewi',
    groomPhotoUrl: 'https://picsum.photos/id/91/400/500',
    groomInstagram: '@bayu.aditya',
    weddingDate: '2026-11-14',
    akadDate: '',
    resepsiDate: '',
    couplePhotoUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop',
    quoteText: '"Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan pasangan untukmu agar kamu merasa tenteram kepadanya, serta dijadikan-Nya rasa kasih dan sayang di antaramu."',
    quoteSource: 'QS. Ar-Rum: 21',
    greetingTitle: 'With Love',
    greetingText: 'Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan pernikahan dan mengundang Bapak/Ibu/Saudara/i untuk berkenan hadir memberikan doa restu.',
    akadTime: '08.00 – 10.00 WIB',
    akadVenue: 'Kediaman Mempelai Wanita, Jl. Dago Asri No. 12, Bandung',
    mapUrlAkad: 'https://maps.google.com',
    resepsiTime: '11.00 – 14.00 WIB',
    resepsiVenue: 'Gedung Grha Kirana, Jl. Setiabudi No. 45, Bandung',
    mapUrlResepsi: 'https://maps.google.com',
    galleryUrls: 'https://picsum.photos/id/1011/300/300\nhttps://picsum.photos/id/1012/300/300\nhttps://picsum.photos/id/1013/300/300\nhttps://picsum.photos/id/1015/300/300\nhttps://picsum.photos/id/1016/300/300\nhttps://picsum.photos/id/1018/300/300',
    musicUrl: '',
    timeline: [
      { year: '2019', title: 'Perkenalan', text: 'Bertemu pertama kali di acara kampus, berlanjut jadi teman diskusi yang paling sering bertukar cerita.' },
      { year: '2021', title: 'Lebih Dekat', text: 'Dari sekadar teman diskusi menjadi pasangan yang saling mendukung dalam suka maupun duka.' },
      { year: '2026', title: 'Menuju Pernikahan', text: 'Setelah melalui banyak hal bersama, kami memutuskan untuk melangkah ke jenjang yang lebih serius.' }
    ],
    bankName1: 'Bank Mandiri',
    bankNum1: '1234567890',
    bankOwner1: 'a.n. Kirana Ayu Pratiwi',
    bankName2: 'Bank BCA',
    bankNum2: '0987654321',
    bankOwner2: 'a.n. Bayu Aditya Nugraha',
    approved: true
  };

  // Safe Indonesian Date Formatter (Kebal perbedaan timezone dan locale browser)
  const INDO_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const INDO_MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  function parseDateSafe(dateVal) {
    if (!dateVal) return null;
    if (typeof dateVal === 'string' && dateVal.includes('-')) {
      const parts = dateVal.split('T')[0].split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          return new Date(y, m, d, 8, 0, 0);
        }
      }
    }
    const parsed = new Date(dateVal);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  function formatIndoDate(d, withDay = false) {
    if (!d || isNaN(d.getTime())) return '';
    const dayName = INDO_DAYS[d.getDay()];
    const date = d.getDate();
    const monthName = INDO_MONTHS[d.getMonth()];
    const year = d.getFullYear();
    if (withDay) {
      return `${dayName}, ${date} ${monthName} ${year}`;
    }
    return `${date} ${monthName} ${year}`;
  }

  // Helper ekstraksi ID file Google Drive
  function extractDriveId(url) {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (trimmed.includes('/folders/')) return null; // Link folder bukan file gambar
    const m = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/) || 
              trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) || 
              trimmed.match(/id=([a-zA-Z0-9_-]+)/);
    return (m && m[1]) ? m[1] : null;
  }

  // Helper untuk Gambar Google Drive (Otomatis konversi ke Direct High-Res Thumbnail)
  function fixDriveUrl(url) {
    if (!url || typeof url !== 'string') return url;
    const trimmed = url.trim();
    if (trimmed.includes('drive.google.com') || trimmed.includes('drive.usercontent.google.com') || trimmed.includes('docs.google.com') || trimmed.includes('googleusercontent.com')) {
      const fileId = extractDriveId(trimmed);
      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
      }
    }
    return trimmed;
  }
  window.fixDriveUrl = fixDriveUrl;

  // Helper untuk Musik / Lagu (Google Drive, Dropbox, Local Assets, & Direct MP3)
  function fixDriveMusicUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;

    // Dukungan Dropbox: Otomatis ganti ?dl=0 menjadi ?raw=1 agar bisa streaming audio langsung
    if (trimmed.includes('dropbox.com')) {
      return trimmed.replace(/[?&]dl=0/, '?raw=1').replace(/[?&]dl=1/, '?raw=1');
    }

    if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
      const fileId = extractDriveId(trimmed);
      if (fileId) {
        // Hanya gunakan proxy jika berjalan di server lokal Node.js (localhost / 127.0.0.1)
        const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalHost) {
          return `/api/proxy-audio?id=${fileId}`;
        }
        return `https://docs.google.com/uc?export=download&id=${fileId}`;
      }
    }
    return trimmed;
  }

  // Normalizer: Menjembatani format lama (nested general, groom, bride) dengan format satuacara (flat)
  function normalizeWeddingData(raw) {
    if (!raw) return Object.assign({}, DEFAULT_DATA);
    const data = Object.assign({}, DEFAULT_DATA, raw);

    // Jika data berasal dari format nested legacy
    if (raw.general) {
      data.brideName = data.brideName || raw.general.brideNickname || raw.bride?.fullName || 'Wanita';
      data.groomName = data.groomName || raw.general.groomNickname || raw.groom?.fullName || 'Pria';
      data.couplePhotoUrl = data.couplePhotoUrl || raw.general.heroImage || raw.general.coverImage || '';
      if (raw.general.countdownTarget) {
        data.weddingDate = raw.general.countdownTarget.split('T')[0];
      }
    }
    if (raw.quote) {
      data.quoteText = raw.quote.translation || raw.quote.text || data.quoteText;
      data.quoteSource = raw.quote.surah || raw.quote.source || data.quoteSource;
    }
    if (raw.bride) {
      data.brideFullName = raw.bride.fullName || data.brideFullName;
      data.brideParents = raw.bride.father || raw.bride.mother ? `Putri dari Bapak ${raw.bride.father || ''} & Ibu ${raw.bride.mother || ''}` : data.brideParents;
      data.bridePhotoUrl = raw.bride.photo || data.bridePhotoUrl;
      data.brideInstagram = raw.bride.instagram || data.brideInstagram;
    }
    if (raw.groom) {
      data.groomFullName = raw.groom.fullName || data.groomFullName;
      data.groomParents = raw.groom.father || raw.groom.mother ? `Putra dari Bapak ${raw.groom.father || ''} & Ibu ${raw.groom.mother || ''}` : data.groomParents;
      data.groomPhotoUrl = raw.groom.photo || data.groomPhotoUrl;
      data.groomInstagram = raw.groom.instagram || data.groomInstagram;
    }
    if (raw.events) {
      if (raw.events.akad) {
        data.akadDate = raw.events.akad.date || data.akadDate || '';
        data.akadTime = `${raw.events.akad.timeStart || '08:00'} - ${raw.events.akad.timeEnd || 'Selesai'}`;
        data.akadVenue = raw.events.akad.venue || data.akadVenue;
        data.mapUrlAkad = raw.events.akad.mapsUrl || data.mapUrlAkad;
      }
      if (raw.events.resepsi) {
        data.resepsiDate = raw.events.resepsi.date || data.resepsiDate || '';
        data.resepsiTime = `${raw.events.resepsi.timeStart || '11:00'} - ${raw.events.resepsi.timeEnd || 'Selesai'}`;
        data.resepsiVenue = raw.events.resepsi.venue || data.resepsiVenue;
        data.mapUrlResepsi = raw.events.resepsi.mapsUrl || data.mapUrlResepsi;
      }
    }
    if (raw.story && Array.isArray(raw.story) && raw.story.length > 0) {
      data.timeline = raw.story.map(s => ({
        year: s.year || '',
        title: s.title || '',
        text: s.desc || s.text || ''
      }));
    }
    if (raw.gifts && raw.gifts.banks && raw.gifts.banks.length > 0) {
      const b1 = raw.gifts.banks[0];
      if (b1) {
        data.bankName1 = b1.bankName || b1.name;
        data.bankNum1 = b1.accountNumber || b1.number;
        data.bankOwner1 = b1.accountHolder || b1.holder;
      }
      const b2 = raw.gifts.banks[1];
      if (b2) {
        data.bankName2 = b2.bankName || b2.name;
        data.bankNum2 = b2.accountNumber || b2.number;
        data.bankOwner2 = b2.accountHolder || b2.holder;
      }
    }
    if (raw.gallery && Array.isArray(raw.gallery.items)) {
      data.galleryUrls = raw.gallery.items.map(it => it.src || it).join('\n');
    }
    return data;
  }

  // Elements
  const loader = document.getElementById('loader');
  const authPages = document.getElementById('authPages');
  const loginPage = document.getElementById('loginPage');
  const userDashboard = document.getElementById('userDashboard');
  const adminPage = document.getElementById('adminPage');
  const invitationPage = document.getElementById('invitationPage');
  const pendingPage = document.getElementById('pendingPage');
  const btnBackHome = document.getElementById('btnBackHome');
  const shell = document.getElementById('shell');

  // Menyembunyikan seluruh tampilan
  function hideAll() {
    if (loader) loader.style.display = 'none';
    if (authPages) authPages.style.display = 'none';
    if (loginPage) loginPage.style.display = 'none';
    if (adminPage) adminPage.style.display = 'none';
    if (userDashboard) userDashboard.style.display = 'none';
    if (invitationPage) invitationPage.style.display = 'none';
    if (pendingPage) pendingPage.style.display = 'none';
    if (btnBackHome) btnBackHome.style.display = 'none';
    document.body.classList.remove('no-floral');
  }

  // Tampilkan Halaman Landing / Login
  function showLoginPage() {
    hideAll();
    if (authPages) authPages.style.display = 'flex';
    if (loginPage) loginPage.style.display = 'block';
  }

  // --- ROUTING AWAL ---
  const urlParams = new URLSearchParams(window.location.search);
  const inviteId = urlParams.get('id') || urlParams.get('c');
  const guestName = urlParams.get('to');
  const viewMode = urlParams.get('view') || urlParams.get('page');

  if (viewMode === 'admin') {
    showAdminDashboard();
  } else if (viewMode === 'dashboard' || viewMode === 'client') {
    showUserDashboard(inviteId);
  } else if (inviteId) {
    loadInvitation(inviteId, guestName);
  } else if (viewMode === 'preview' || viewMode === 'invitation') {
    loadInvitation(null, guestName);
  } else {
    // Jika sudah login sebelumnya dalam sesi ini, langsung masuk ke dashboard pembuatan undangan
    if (sessionStorage.getItem('satuacara_auth') === 'true') {
      showUserDashboard();
    } else {
      showLoginPage();
    }
  }

  // --- LOAD & RENDER INVITATION ---
  async function loadInvitation(id, guest) {
    hideAll();
    if (loader) loader.style.display = 'flex';

    let data = null;
    try {
      // 1. Coba ambil dari server API /api/data?id=... (atau /api/data untuk data aktif jika tanpa id)
      const apiUrl = (id && id !== 'demo') ? `/api/data?id=${encodeURIComponent(id)}` : '/api/data';
      let res = await fetch(apiUrl).catch(() => null);
      if (res && res.ok) {
        data = await res.json();
      }

      // 1b. Fallback Static JSON untuk Cloudflare Pages / Static Hosting jika /api/data tidak ada
      if (!data && id && id !== 'demo') {
        res = await fetch(`/data/clients/${encodeURIComponent(id)}.json`).catch(() => null);
        if (res && res.ok) {
          data = await res.json();
        }
      }
      if (!data && id !== 'demo') {
        res = await fetch('/data/wedding-data.json').catch(() => null);
        if (res && res.ok) {
          data = await res.json();
        }
      }
    } catch (e) {
      console.warn('Gagal memuat dari API/Static server, mencoba localStorage...');
    }

    // 2. Fallback: LocalStorage spesifik slug
    if (!data && id && id !== 'demo') {
      const localSlug = localStorage.getItem('wedding_data_' + id);
      if (localSlug) {
        try { data = JSON.parse(localSlug); } catch (e) {}
      }
    }

    // 3. Fallback: Current wedding data atau Default
    if (!data) {
      const currentLocal = localStorage.getItem('current_wedding_data');
      if (currentLocal) {
        try { data = JSON.parse(currentLocal); } catch (e) {}
      }
    }

    if (!data && id && id !== 'demo') {
      // Jika data tidak ditemukan sama sekali, gunakan DEFAULT_DATA
      data = Object.assign({}, DEFAULT_DATA, { slug: id });
    } else if (id === 'demo' || !data) {
      data = Object.assign({}, DEFAULT_DATA);
    }

    data = normalizeWeddingData(data);

    // Cek approval jika global requirement aktif
    try {
      const setRes = await fetch('/api/settings').catch(() => null);
      if (setRes && setRes.ok) {
        const settings = await setRes.json();
        if (settings.requireApproval === true && data.approved === false && id !== 'demo') {
          hideAll();
          if (pendingPage) pendingPage.style.display = 'flex';
          return;
        }
      }
    } catch (e) {}

    // RENDER DATA KE ELEMEN HTML UNDANGAN
    const bride = data.brideName || 'Kirana';
    const groom = data.groomName || 'Bayu';

    const namesSerif = document.querySelector('.names.serif');
    if (namesSerif) namesSerif.innerHTML = `${bride}<span class="amp">&amp;</span>${groom}`;

    const circleCap = document.querySelector('#circlefoto .cap');
    if (circleCap) circleCap.textContent = `${bride} & ${groom}`;

    const penutupSigned = document.querySelector('#penutup .signed');
    if (penutupSigned) penutupSigned.textContent = `${bride} & ${groom}`;

    const leftPanelNames = document.getElementById('leftPanelNames');
    if (leftPanelNames) leftPanelNames.innerHTML = `${bride}<br>&amp; ${groom}`;

    if (data.couplePhotoUrl) {
      const coupleImg = document.getElementById('coupleCoverPhoto');
      if (coupleImg) coupleImg.src = fixDriveUrl(data.couplePhotoUrl);
    }

    const qText = document.getElementById('quoteTextDisplay');
    if (qText) qText.textContent = data.quoteText;

    const qSrc = document.getElementById('quoteSourceDisplay');
    if (qSrc) qSrc.textContent = data.quoteSource;

    const gTitle = document.getElementById('greetingTitleDisplay');
    if (gTitle) gTitle.textContent = data.greetingTitle;

    const gText = document.getElementById('greetingTextDisplay');
    if (gText) gText.textContent = data.greetingText;

    // Profil Bride
    const bFull = document.getElementById('brideFullNameDisplay');
    if (bFull) bFull.textContent = data.brideFullName;
    const bParents = document.getElementById('brideParentsDisplay');
    if (bParents) bParents.innerHTML = data.brideParents;
    if (data.bridePhotoUrl) {
      const bPhoto = document.getElementById('bridePhotoDisplay');
      if (bPhoto) bPhoto.src = fixDriveUrl(data.bridePhotoUrl);
    }
    const bInsta = document.getElementById('brideInstagramLink');
    if (bInsta) {
      bInsta.textContent = data.brideInstagram;
      bInsta.href = data.brideInstagram.startsWith('@') ? `https://instagram.com/${data.brideInstagram.substring(1)}` : `https://instagram.com/${data.brideInstagram}`;
    }

    // Profil Groom
    const gFull = document.getElementById('groomFullNameDisplay');
    if (gFull) gFull.textContent = data.groomFullName;
    const gParents = document.getElementById('groomParentsDisplay');
    if (gParents) gParents.innerHTML = data.groomParents;
    if (data.groomPhotoUrl) {
      const gPhoto = document.getElementById('groomPhotoDisplay');
      if (gPhoto) gPhoto.src = fixDriveUrl(data.groomPhotoUrl);
    }
    const gInsta = document.getElementById('groomInstagramLink');
    if (gInsta) {
      gInsta.textContent = data.groomInstagram;
      gInsta.href = data.groomInstagram.startsWith('@') ? `https://instagram.com/${data.groomInstagram.substring(1)}` : `https://instagram.com/${data.groomInstagram}`;
    }

    // Galeri & Foto Bundar
    const galContainer = document.getElementById('galleryContainer');
    const circleContainer = document.querySelector('#circlefoto .circle-inner');
    if (galContainer) {
      galContainer.innerHTML = '';
      if (data.galleryUrls && data.galleryUrls.trim()) {
        const urls = data.galleryUrls.split('\n').map(u => u.trim()).filter(Boolean);
        urls.forEach(u => {
          const finalSrc = fixDriveUrl(u);
          galContainer.innerHTML += `<img src="${finalSrc}" loading="lazy" alt="Momen" onclick="window.openLightbox('${finalSrc}')" style="cursor:pointer;" title="Klik untuk perbesar">`;
        });
      } else {
        galContainer.innerHTML = `
          <img src="https://picsum.photos/id/1011/600/600" onclick="window.openLightbox(this.src)" style="cursor:pointer;" alt="Galeri">
          <img src="https://picsum.photos/id/1012/600/600" onclick="window.openLightbox(this.src)" style="cursor:pointer;" alt="Galeri">
          <img src="https://picsum.photos/id/1013/600/600" onclick="window.openLightbox(this.src)" style="cursor:pointer;" alt="Galeri">
          <img src="https://picsum.photos/id/1015/600/600" onclick="window.openLightbox(this.src)" style="cursor:pointer;" alt="Galeri">
          <img src="https://picsum.photos/id/1016/600/600" onclick="window.openLightbox(this.src)" style="cursor:pointer;" alt="Galeri">
          <img src="https://picsum.photos/id/1018/600/600" onclick="window.openLightbox(this.src)" style="cursor:pointer;" alt="Galeri">
        `;
      }

      // Foto bundar dinamis (prioritas: galeri -> cover -> bride -> groom)
      if (circleContainer) {
        const pool = [];
        if (data.galleryUrls && data.galleryUrls.trim()) {
          data.galleryUrls.split('\n').map(u => u.trim()).filter(Boolean).forEach(u => pool.push(fixDriveUrl(u)));
        }
        if (data.couplePhotoUrl) pool.push(fixDriveUrl(data.couplePhotoUrl));
        if (data.bridePhotoUrl) pool.push(fixDriveUrl(data.bridePhotoUrl));
        if (data.groomPhotoUrl) pool.push(fixDriveUrl(data.groomPhotoUrl));

        if (pool.length > 0) {
          circleContainer.innerHTML = '';
          const circleUrls = pool.slice(0, 3);
          while (circleUrls.length < 3) circleUrls.push(circleUrls[0]);
          circleUrls.forEach(u => {
            circleContainer.innerHTML += `<img src="${fixDriveUrl(u)}" alt="Foto">`;
          });
        }
      }
    }

    // Timeline Kisah
    const timelineContainer = document.getElementById('timelineContainer');
    if (timelineContainer && Array.isArray(data.timeline)) {
      let tHtml = '';
      data.timeline.forEach((item, idx) => {
        const isLast = idx === data.timeline.length - 1;
        tHtml += `
          <div class="timeline-item">
            <div class="dot-col">
              <div class="dot"></div>
              ${!isLast ? '<div class="line"></div>' : ''}
            </div>
            <div>
              <div class="tyear">${item.year}</div>
              <h3 class="serif">${item.title}</h3>
              <p>${item.text}</p>
            </div>
          </div>
        `;
      });
      timelineContainer.innerHTML = tHtml;
    }

    // Rekening Amplop Digital
    const bankContainer = document.getElementById('bankContainer');
    if (bankContainer) {
      let bHtml = '';
      if (data.bankName1 || data.bankNum1) {
        bHtml += `
          <div class="bank-card">
            <div>
              <div class="bname">${data.bankName1 || 'Bank'}</div>
              <div class="bnum serif">${data.bankNum1 || '-'}</div>
              <div class="bowner">${data.bankOwner1 || ''}</div>
            </div>
            <button onclick="window.copyNum(this, '${data.bankNum1 || ''}')">Salin</button>
          </div>
        `;
      }
      if (data.bankName2 || data.bankNum2) {
        bHtml += `
          <div class="bank-card">
            <div>
              <div class="bname">${data.bankName2 || 'Bank'}</div>
              <div class="bnum serif">${data.bankNum2 || '-'}</div>
              <div class="bowner">${data.bankOwner2 || ''}</div>
            </div>
            <button onclick="window.copyNum(this, '${data.bankNum2 || ''}')">Salin</button>
          </div>
        `;
      }
      if (!bHtml) {
        bHtml = `
          <div class="bank-card">
            <div>
              <div class="bname">Bank Mandiri</div>
              <div class="bnum serif">1234567890</div>
              <div class="bowner">a.n. Kirana Ayu Pratiwi</div>
            </div>
            <button onclick="window.copyNum(this, '1234567890')">Salin</button>
          </div>
          <div class="bank-card">
            <div>
              <div class="bname">Bank BCA</div>
              <div class="bnum serif">0987654321</div>
              <div class="bowner">a.n. Bayu Aditya Nugraha</div>
            </div>
            <button onclick="window.copyNum(this, '0987654321')">Salin</button>
          </div>
        `;
      }
      bankContainer.innerHTML = bHtml;
    }

    // Nama Tamu di Cover
    const guestEl = document.getElementById('guestName');
    if (guestEl) {
      guestEl.textContent = guest ? decodeURIComponent(guest.replace(/\+/g, ' ')) : 'Tamu Undangan';
    }

    // Musik URL
    window._customMusicUrl = data.musicUrl || null;

    // Tanggal Acara, Tempat & Countdown
    const mainDateObj = parseDateSafe(data.weddingDate) || new Date(2026, 10, 14, 8, 0, 0);
    const dateStr = formatIndoDate(mainDateObj, false) || '14 November 2026';
    const fullDateWithDay = formatIndoDate(mainDateObj, true) || 'Sabtu, 14 November 2026';
    window.weddingTargetDate = mainDateObj.getTime();

    // Tampilkan tanggal utama di section Acara & Left Panel Desktop
    const bigDateEl = document.querySelector('.big-date');
    if (bigDateEl) bigDateEl.textContent = dateStr;
    const leftDateEl = document.getElementById('leftPanelDate');
    if (leftDateEl) leftDateEl.textContent = dateStr;

    // Tanggal khusus Akad & Resepsi jika ditentukan terpisah (atau fallback ke tanggal utama)
    const akadDateObj = parseDateSafe(data.akadDate) || mainDateObj;
    const resepsiDateObj = parseDateSafe(data.resepsiDate) || mainDateObj;

    const akadDateStr = formatIndoDate(akadDateObj, true) || fullDateWithDay;
    const resepsiDateStr = formatIndoDate(resepsiDateObj, true) || fullDateWithDay;

    // Tampilkan detail tanggal, waktu, dan tempat AKAD NIKAH secara dinamis
    const akadDetailEl = document.getElementById('akadDetailDisplay');
    if (akadDetailEl) {
      const aTime = data.akadTime || '08.00 – 10.00 WIB';
      const aVenue = (data.akadVenue || 'Kediaman Mempelai Wanita').replace(/\n/g, '<br>');
      akadDetailEl.innerHTML = `${akadDateStr}<br>${aTime}<br>${aVenue}`;
    }

    // Tampilkan detail tanggal, waktu, dan tempat RESEPSI secara dinamis
    const resepsiDetailEl = document.getElementById('resepsiDetailDisplay');
    if (resepsiDetailEl) {
      const rTime = data.resepsiTime || '11.00 – 14.00 WIB';
      const rVenue = (data.resepsiVenue || 'Gedung Pertemuan').replace(/\n/g, '<br>');
      resepsiDetailEl.innerHTML = `${resepsiDateStr}<br>${rTime}<br>${rVenue}`;
    }

    // Update link Google Maps
    const mapAkad = document.getElementById('mapUrlAkadDisplay');
    if (mapAkad) {
      const href = data.mapUrlAkad || (data.akadVenue ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.akadVenue)}` : 'https://maps.google.com');
      mapAkad.href = href;
      mapAkad.style.display = 'inline-block';
    }

    const mapResepsi = document.getElementById('mapUrlResepsiDisplay');
    if (mapResepsi) {
      const href = data.mapUrlResepsi || (data.resepsiVenue ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.resepsiVenue)}` : 'https://maps.google.com');
      mapResepsi.href = href;
      mapResepsi.style.display = 'inline-block';
    }

    tickCountdown();

    // Selesai memuat
    hideAll();
    if (invitationPage) invitationPage.style.display = 'flex';
    if (btnBackHome) btnBackHome.style.display = 'block';

    // Muat Ucapan
    loadWishes(id);
  }

  // --- DEMO MODE ---
  window.viewDemo = () => {
    hideAll();
    loadInvitation('demo', 'Tamu Demo');
  };

  window.goHome = () => {
    window.location.href = window.location.origin + window.location.pathname;
  };

  // --- USER DASHBOARD (PENGANTIN / KLIEN) ---
  async function showUserDashboard(clientSlug) {
    hideAll();
    document.body.classList.add('no-floral');
    if (loader) loader.style.display = 'flex';

    let data = null;
    const requestedSlug = clientSlug || localStorage.getItem('current_wedding_slug');

    try {
      // Jika ada requestedSlug spesifik, ambil by ID. Jika tidak ada, ambil data aktif dari /api/data!
      const apiUrl = requestedSlug ? `/api/data?id=${encodeURIComponent(requestedSlug)}` : '/api/data';
      let res = await fetch(apiUrl).catch(() => null);
      if (res && res.ok) data = await res.json();

      // Fallback file static JSON untuk Cloudflare Pages
      if (!data && requestedSlug) {
        res = await fetch(`/data/clients/${encodeURIComponent(requestedSlug)}.json`).catch(() => null);
        if (res && res.ok) data = await res.json();
      }
      if (!data) {
        res = await fetch('/data/wedding-data.json').catch(() => null);
        if (res && res.ok) data = await res.json();
      }
    } catch (e) {}

    if (!data && requestedSlug) {
      const local = localStorage.getItem('wedding_data_' + requestedSlug);
      if (local) {
        try { data = JSON.parse(local); } catch (e) {}
      }
    }

    if (!data) {
      const currentLocal = localStorage.getItem('current_wedding_data');
      if (currentLocal) {
        try { data = JSON.parse(currentLocal); } catch (e) {}
      }
    }

    data = normalizeWeddingData(data);

    if (data.slug) {
      localStorage.setItem('current_wedding_slug', data.slug);
    }

    // Isi Form Dashboard
    setVal('brideName', data.brideName);
    setVal('brideFullName', data.brideFullName);
    setVal('brideParents', data.brideParents ? data.brideParents.replace(/<br>/gi, ' ') : '');
    setVal('bridePhotoUrl', data.bridePhotoUrl);
    setVal('brideInstagram', data.brideInstagram);

    setVal('groomName', data.groomName);
    setVal('groomFullName', data.groomFullName);
    setVal('groomParents', data.groomParents ? data.groomParents.replace(/<br>/gi, ' ') : '');
    setVal('groomPhotoUrl', data.groomPhotoUrl);
    setVal('groomInstagram', data.groomInstagram);

    setVal('couplePhotoUrl', data.couplePhotoUrl);
    setVal('quoteText', data.quoteText);
    setVal('quoteSource', data.quoteSource);
    setVal('greetingTitle', data.greetingTitle);
    setVal('greetingText', data.greetingText);

    setVal('weddingDate', data.weddingDate);
    setVal('akadDate', data.akadDate);
    setVal('akadTime', data.akadTime);
    setVal('akadVenue', data.akadVenue);
    setVal('mapUrlAkad', data.mapUrlAkad);
    setVal('resepsiDate', data.resepsiDate);
    setVal('resepsiTime', data.resepsiTime);
    setVal('resepsiVenue', data.resepsiVenue);
    setVal('mapUrlResepsi', data.mapUrlResepsi);

    setVal('galleryUrls', data.galleryUrls);
    setVal('musicUrl', data.musicUrl);

    setVal('bankName1', data.bankName1);
    setVal('bankNum1', data.bankNum1);
    setVal('bankOwner1', data.bankOwner1);
    setVal('bankName2', data.bankName2);
    setVal('bankNum2', data.bankNum2);
    setVal('bankOwner2', data.bankOwner2);

    const slugInput = document.getElementById('inviteSlug');
    if (slugInput) slugInput.value = data.slug || requestedSlug || 'kirana-bayu';
    window.updateSlugPreview();

    // Tampilkan preview foto mempelai & cover di dashboard jika sudah ada
    window.updatePhotoPreview('bride');
    window.updatePhotoPreview('groom');
    window.updatePhotoPreview('couple');
    window.updateGalleryPreview();

    // Timeline momen
    window.loadTimelineToForm(data.timeline || null);

    // Link sebar
    const baseUrl = window.location.origin + window.location.pathname;
    const myInviteUrl = document.getElementById('myInviteUrl');
    if (myInviteUrl) {
      myInviteUrl.textContent = `${baseUrl}?id=${data.slug || requestedSlug || 'kirana-bayu'}`;
    }

    if (loader) loader.style.display = 'none';
    if (userDashboard) userDashboard.style.display = 'flex';
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val || '';
  }

  // Live Preview Foto Mempelai & Cover di Dashboard
  window.updatePhotoPreview = (type) => {
    const map = {
      bride: { input: 'bridePhotoUrl', wrap: 'previewBridePhotoWrap', img: 'previewBridePhotoImg', status: 'previewBridePhotoStatus', note: 'previewBridePhotoNote' },
      groom: { input: 'groomPhotoUrl', wrap: 'previewGroomPhotoWrap', img: 'previewGroomPhotoImg', status: 'previewGroomPhotoStatus', note: 'previewGroomPhotoNote' },
      couple: { input: 'couplePhotoUrl', wrap: 'previewCouplePhotoWrap', img: 'previewCouplePhotoImg', status: 'previewCouplePhotoStatus', note: 'previewCouplePhotoNote' }
    };
    const cfg = map[type];
    if (!cfg) return;
    const input = document.getElementById(cfg.input);
    const wrap = document.getElementById(cfg.wrap);
    const img = document.getElementById(cfg.img);
    const status = document.getElementById(cfg.status);
    const note = document.getElementById(cfg.note);
    if (!input || !wrap || !img) return;

    const val = (input.value || '').trim();
    if (!val) {
      wrap.style.display = 'none';
      img.src = '';
      return;
    }

    wrap.style.display = 'block';

    if (val.includes('/folders/')) {
      img.style.display = 'none';
      if (status) {
        status.textContent = '⚠️ Link Folder Terdeteksi';
        status.style.color = '#d32f2f';
      }
      if (note) {
        note.textContent = 'Harap gunakan link file foto langsung (bukan folder). Buka fotonya di Google Drive lalu pilih Bagikan > Salin link.';
      }
      return;
    }

    img.style.display = 'block';
    const isDrive = val.includes('drive.google.com') || val.includes('docs.google.com') || val.includes('drive.usercontent.google.com');
    const finalSrc = fixDriveUrl(val);
    img.src = finalSrc;

    if (isDrive) {
      if (status) {
        status.textContent = '✓ Google Drive Terdeteksi';
        status.style.color = '#2e7d32';
      }
      if (note) {
        note.textContent = 'Otomatis dikonversi ke tampilan resolusi tinggi (HD)';
      }
    } else {
      if (status) {
        status.textContent = '✓ URL Gambar Valid';
        status.style.color = '#2e7d32';
      }
      if (note) {
        note.textContent = 'Menampilkan foto dari link langsung';
      }
    }

    img.onerror = () => {
      if (status) {
        status.textContent = '⚠️ Foto Belum Terbuka';
        status.style.color = '#d32f2f';
      }
      if (note) {
        note.textContent = isDrive 
          ? 'Pastikan opsi berbagi Google Drive: "Siapa saja yang memiliki link" (Bukan Dibatasi)' 
          : 'Periksa kembali URL gambar Anda';
      }
    };
  };

  // Lightbox Modal Galeri
  window.openLightbox = (src) => {
    const box = document.getElementById('galleryLightbox');
    const img = document.getElementById('lightboxImg');
    if (box && img) {
      img.src = src;
      box.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeLightbox = (e) => {
    const box = document.getElementById('galleryLightbox');
    if (box) {
      box.style.display = 'none';
      document.body.style.overflow = '';
    }
  };

  // Quick Add Link Foto Galeri
  window.addQuickGalleryUrl = () => {
    const input = document.getElementById('quickGalleryInput');
    const textarea = document.getElementById('galleryUrls');
    if (!input || !textarea) return;

    const val = (input.value || '').trim();
    if (!val) {
      alert('Silakan tempelkan link Google Drive atau URL foto terlebih dahulu.');
      input.focus();
      return;
    }

    const currentText = textarea.value.trim();
    const newText = currentText ? `${currentText}\n${val}` : val;
    textarea.value = newText;
    input.value = '';
    window.updateGalleryPreview();
  };

  // Live Preview Grid Galeri di Dashboard
  window.updateGalleryPreview = () => {
    const textarea = document.getElementById('galleryUrls');
    const wrap = document.getElementById('galleryLivePreviewWrap');
    const grid = document.getElementById('galleryLivePreviewGrid');
    const badge = document.getElementById('galleryCountBadge');
    if (!textarea || !wrap || !grid) return;

    const text = (textarea.value || '').trim();
    if (!text) {
      wrap.style.display = 'none';
      grid.innerHTML = '';
      return;
    }

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      wrap.style.display = 'none';
      grid.innerHTML = '';
      return;
    }

    wrap.style.display = 'block';
    if (badge) badge.textContent = `${lines.length} Foto Terdeteksi`;

    let html = '';
    lines.forEach((url, idx) => {
      const isDrive = url.includes('drive.google.com') || url.includes('docs.google.com') || url.includes('googleusercontent.com');
      const isFolder = url.includes('/folders/');
      const src = fixDriveUrl(url);

      if (isFolder) {
        html += `
          <div style="position:relative; background:#ffebee; border:1px solid #ffcdd2; border-radius:6px; padding:6px; font-size:10px; color:#c62828; text-align:center; height:80px; display:flex; flex-direction:column; justify-content:center; align-items:center;">
            <b>Folder Drive</b>
            <span style="font-size:9px;">Gunakan link file</span>
            <button type="button" onclick="window.removeGalleryItem(${idx})" style="position:absolute; top:-5px; right:-5px; background:#d32f2f; color:#fff; border:none; border-radius:50%; width:18px; height:18px; font-size:11px; cursor:pointer; line-height:1;">&times;</button>
          </div>
        `;
      } else {
        html += `
          <div style="position:relative; width:100%; height:80px; border-radius:6px; overflow:hidden; border:1px solid #ddd; background:#eee;">
            <img src="${src}" alt="Foto ${idx+1}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onerror="this.parentElement.style.background='#ffcdd2'; this.alt='Gagal memuat';" onclick="window.openLightbox('${src}')">
            ${isDrive ? '<span style="position:absolute; bottom:2px; left:2px; background:rgba(0,0,0,0.6); color:#fff; font-size:8px; padding:1px 4px; border-radius:3px;">Drive</span>' : ''}
            <button type="button" onclick="window.removeGalleryItem(${idx})" title="Hapus foto ini" style="position:absolute; top:2px; right:2px; background:rgba(0,0,0,0.65); color:#fff; border:none; border-radius:50%; width:18px; height:18px; font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; line-height:1;">&times;</button>
          </div>
        `;
      }
    });

    grid.innerHTML = html;
  };

  // Hapus item foto dari galeri
  window.removeGalleryItem = (index) => {
    const textarea = document.getElementById('galleryUrls');
    if (!textarea) return;
    const lines = (textarea.value || '').split('\n').map(l => l.trim()).filter(Boolean);
    if (index >= 0 && index < lines.length) {
      lines.splice(index, 1);
      textarea.value = lines.join('\n');
      window.updateGalleryPreview();
    }
  };

  // Simpan Data Undangan Klien
  window.saveWeddingData = async (e) => {
    if (e) e.preventDefault();
    const btn = (e && e.target) ? e.target : document.getElementById('btnSaveData');
    const origText = btn ? btn.textContent : 'Simpan';
    if (btn) {
      btn.textContent = 'Menyimpan...';
      btn.disabled = true;
    }

    const brideN = (document.getElementById('brideName')?.value || '').trim();
    const groomN = (document.getElementById('groomName')?.value || '').trim();
    let slug = (document.getElementById('inviteSlug')?.value || '').trim();
    if (!slug && brideN && groomN) {
      slug = (brideN + '-' + groomN).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const slugEl = document.getElementById('inviteSlug');
      if (slugEl) slugEl.value = slug;
      window.updateSlugPreview();
    }

    // Ambil timeline momen
    const timelineItems = document.querySelectorAll('.timeline-momen-row');
    const timelineArr = [];
    timelineItems.forEach(row => {
      const yr = row.querySelector('.tl-year')?.value.trim() || '';
      const ti = row.querySelector('.tl-title')?.value.trim() || '';
      const tx = row.querySelector('.tl-text')?.value.trim() || '';
      if (yr || ti || tx) timelineArr.push({ year: yr, title: ti, text: tx });
    });

    const payload = {
      slug: slug || 'kirana-bayu',
      brideName: brideN || 'Kirana',
      brideFullName: document.getElementById('brideFullName')?.value || '',
      brideParents: document.getElementById('brideParents')?.value || '',
      bridePhotoUrl: fixDriveUrl(document.getElementById('bridePhotoUrl')?.value || ''),
      brideInstagram: document.getElementById('brideInstagram')?.value || '',
      groomName: groomN || 'Bayu',
      groomFullName: document.getElementById('groomFullName')?.value || '',
      groomParents: document.getElementById('groomParents')?.value || '',
      groomPhotoUrl: fixDriveUrl(document.getElementById('groomPhotoUrl')?.value || ''),
      groomInstagram: document.getElementById('groomInstagram')?.value || '',
      weddingDate: document.getElementById('weddingDate')?.value || '',
      akadDate: document.getElementById('akadDate')?.value || '',
      couplePhotoUrl: fixDriveUrl(document.getElementById('couplePhotoUrl')?.value || ''),
      galleryUrls: document.getElementById('galleryUrls')?.value || '',
      quoteText: document.getElementById('quoteText')?.value || '',
      quoteSource: document.getElementById('quoteSource')?.value || '',
      greetingTitle: document.getElementById('greetingTitle')?.value || '',
      greetingText: document.getElementById('greetingText')?.value || '',
      mapUrlAkad: document.getElementById('mapUrlAkad')?.value || '',
      mapUrlResepsi: document.getElementById('mapUrlResepsi')?.value || '',
      akadTime: document.getElementById('akadTime')?.value || '',
      akadVenue: document.getElementById('akadVenue')?.value || '',
      resepsiDate: document.getElementById('resepsiDate')?.value || '',
      resepsiTime: document.getElementById('resepsiTime')?.value || '',
      resepsiVenue: document.getElementById('resepsiVenue')?.value || '',
      timeline: timelineArr,
      musicUrl: (document.getElementById('musicUrl')?.value || '').trim(),
      bankName1: document.getElementById('bankName1')?.value || '',
      bankNum1: document.getElementById('bankNum1')?.value || '',
      bankOwner1: document.getElementById('bankOwner1')?.value || '',
      bankName2: document.getElementById('bankName2')?.value || '',
      bankNum2: document.getElementById('bankNum2')?.value || '',
      bankOwner2: document.getElementById('bankOwner2')?.value || '',
      approved: true
    };

    try {
      // 1. Simpan ke server
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => null);

      // 2. Simpan ke localStorage
      localStorage.setItem('wedding_data_' + payload.slug, JSON.stringify(payload));
      localStorage.setItem('current_wedding_data', JSON.stringify(payload));
      localStorage.setItem('current_wedding_slug', payload.slug);

      // 3. Tampilkan pesan sukses di semua tab
      document.querySelectorAll('[id^="saveSuccessMsg"]').forEach(msg => {
        msg.style.display = 'inline-block';
        setTimeout(() => { msg.style.display = 'none'; }, 3000);
      });

      const baseUrl = window.location.origin + window.location.pathname;
      const myInviteUrl = document.getElementById('myInviteUrl');
      if (myInviteUrl) {
        myInviteUrl.textContent = `${baseUrl}?id=${payload.slug}`;
      }
      window.updateSlugPreview();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan: ' + err.message);
    } finally {
      if (btn) {
        btn.textContent = origText;
        btn.disabled = false;
      }
    }
  };

  // Tab switching logic di Dashboard Klien
  window.switchTab = (tabId, navEl, isBottom = false) => {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(tabId)?.classList.add('active');

    document.querySelectorAll('.sidebar .nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.bnav-item').forEach(n => n.classList.remove('active'));

    if (navEl) navEl.classList.add('active');

    if (isBottom) {
      const map = { tabProfil: 'navProfil', tabAcara: 'navAcara', tabGaleri: 'navGaleri', tabKisah: 'navKisah', tabHadiah: 'navHadiah', tabSebar: 'navSebar' };
      document.getElementById(map[tabId])?.classList.add('active');
    } else {
      const order = ['tabProfil', 'tabAcara', 'tabGaleri', 'tabKisah', 'tabHadiah', 'tabSebar'];
      const idx = order.indexOf(tabId);
      const bnItems = document.querySelectorAll('.bnav-item');
      if (bnItems[idx]) bnItems[idx].classList.add('active');
    }
  };

  // --- PEMBUATAN URL UNDANGAN OTOMATIS UNTUK KLIEN ---
  window._slugManuallyEdited = false;

  window.autoGenerateSlug = (force = false) => {
    if (window._slugManuallyEdited && !force) return;

    const bride = (document.getElementById('brideName')?.value || '').trim();
    const groom = (document.getElementById('groomName')?.value || '').trim();

    if (bride || groom) {
      const parts = [bride, groom].filter(Boolean);
      const generated = parts.join('-')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const slugEl = document.getElementById('inviteSlug');
      if (slugEl && generated) {
        slugEl.value = generated;
      }
    }
    if (force) {
      window._slugManuallyEdited = false;
    }
    window.updateSlugPreview();
  };

  window.onSlugManualInput = () => {
    window._slugManuallyEdited = true;
    window.updateSlugPreview();
  };

  // Update Preview URL Undangan
  window.updateSlugPreview = () => {
    const slugEl = document.getElementById('inviteSlug');
    let v = slugEl ? slugEl.value.trim() : '';
    if (!v) {
      const bride = (document.getElementById('brideName')?.value || '').trim();
      const groom = (document.getElementById('groomName')?.value || '').trim();
      if (bride || groom) {
        v = [bride, groom].filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      }
    }
    if (!v) v = 'kirana-bayu';

    const baseUrl = window.location.origin + window.location.pathname;
    const fullUrl = `${baseUrl}?id=${encodeURIComponent(v)}`;

    // Update di card profil
    const elLegacy = document.getElementById('slugPreviewVal');
    if (elLegacy) elLegacy.textContent = v;

    const elFull = document.getElementById('slugPreviewFullUrl');
    if (elFull) elFull.textContent = fullUrl;

    // Update di tab sebar
    const myInviteUrl = document.getElementById('myInviteUrl');
    if (myInviteUrl) myInviteUrl.textContent = fullUrl;
  };

  // Salin URL Undangan Lengkap
  window.copyFullInviteUrl = (btn) => {
    const slugEl = document.getElementById('inviteSlug');
    const slug = slugEl ? slugEl.value.trim() : 'kirana-bayu';
    const baseUrl = window.location.origin + window.location.pathname;
    const fullUrl = `${baseUrl}?id=${encodeURIComponent(slug)}`;

    navigator.clipboard.writeText(fullUrl).then(() => {
      const orig = btn.textContent;
      btn.textContent = 'Tersalin ✓';
      setTimeout(() => { btn.textContent = orig; }, 1800);
    });
  };

  // Generator Link Tamu
  window.generateLink = () => {
    const guestInput = document.getElementById('guestInputName');
    const guest = guestInput ? guestInput.value.trim() : '';
    if (!guest) {
      alert('Masukkan nama tamu terlebih dahulu!');
      guestInput?.focus();
      return;
    }
    const slug = document.getElementById('inviteSlug')?.value?.trim() || 'kirana-bayu';
    const baseUrl = window.location.origin + window.location.pathname;
    const fullUrl = `${baseUrl}?id=${encodeURIComponent(slug)}&to=${encodeURIComponent(guest)}`;
    const resultInput = document.getElementById('resultLink');
    if (resultInput) resultInput.value = fullUrl;
    const resBox = document.getElementById('generatedLinkResult');
    if (resBox) resBox.style.display = 'block';
  };

  window.copyGeneratedLink = () => {
    const resInput = document.getElementById('resultLink');
    if (resInput && resInput.value) {
      navigator.clipboard.writeText(resInput.value).then(() => {
        alert('✓ Link undangan tamu berhasil disalin!');
      });
    }
  };

  // Buka Undangan Klien dari Dashboard
  window.openUserInvitation = () => {
    const slug = document.getElementById('inviteSlug')?.value?.trim() || 'kirana-bayu';
    window.open(`${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(slug)}`, '_blank');
  };

  // Mobile Drawer
  window.openMobileDrawer = () => {
    document.getElementById('mobileDrawer')?.classList.add('open');
    document.getElementById('mobileDrawerOverlay')?.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  window.closeMobileDrawer = () => {
    document.getElementById('mobileDrawer')?.classList.remove('open');
    document.getElementById('mobileDrawerOverlay')?.classList.remove('open');
    document.body.style.overflow = '';
  };

  // Dynamic Timeline Form
  window.addTimelineMomen = (data = {}) => {
    const list = document.getElementById('timelineMomenList');
    if (!list) return;
    const idx = list.children.length + 1;
    const row = document.createElement('div');
    row.className = 'timeline-momen-row';
    row.style.cssText = 'border:1px solid #f0f0f0; border-radius:10px; padding:16px; margin-bottom:14px; position:relative; background:#fafafa;';
    row.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span style="font-size:12px; font-weight:600; color:#aaa; text-transform:uppercase; letter-spacing:0.08em;">Momen ${idx}</span>
        <button type="button" onclick="this.closest('.timeline-momen-row').remove(); window.renumberTimeline()" style="background:none; border:none; color:#ccc; cursor:pointer; font-size:18px; line-height:1; padding:0; transition:color 0.2s;" onmouseover="this.style.color='#e05757'" onmouseout="this.style.color='#ccc'">&times;</button>
      </div>
      <div class="form-group"><label>Tahun</label><input type="text" class="tl-year" placeholder="2019" value="${data.year || ''}"></div>
      <div class="form-group-row" style="margin-top:10px;">
        <div class="form-group"><label>Judul</label><input type="text" class="tl-title" placeholder="Perkenalan" value="${data.title || ''}"></div>
        <div class="form-group"><label>Cerita</label><input type="text" class="tl-text" placeholder="Bertemu pertama kali..." value="${data.text || ''}"></div>
      </div>
    `;
    list.appendChild(row);
  };

  window.renumberTimeline = () => {
    document.querySelectorAll('.timeline-momen-row').forEach((row, i) => {
      const label = row.querySelector('span');
      if (label) label.textContent = `Momen ${i + 1}`;
    });
  };

  window.loadTimelineToForm = (timelineArr) => {
    const list = document.getElementById('timelineMomenList');
    if (!list) return;
    list.innerHTML = '';
    if (timelineArr && timelineArr.length > 0) {
      timelineArr.forEach(item => window.addTimelineMomen(item));
    } else {
      window.addTimelineMomen({ year: '2019', title: 'Perkenalan', text: 'Bertemu pertama kali di acara kampus...' });
      window.addTimelineMomen({ year: '2021', title: 'Lebih Dekat', text: 'Dari sekadar teman diskusi menjadi pasangan...' });
      window.addTimelineMomen({ year: '2026', title: 'Menuju Pernikahan', text: 'Kami memutuskan untuk melangkah ke jenjang serius...' });
    }
  };

  // Logout Klien
  document.getElementById('btnLogoutUser')?.addEventListener('click', () => {
    showLoginPage();
  });

  // --- ADMIN DASHBOARD ---
  async function showAdminDashboard() {
    hideAll();
    document.body.classList.add('no-floral');
    if (adminPage) adminPage.style.display = 'flex';

    // Logout Admin
    document.getElementById('btnLogoutAdmin')?.addEventListener('click', () => showLoginPage());
    document.getElementById('btnLogoutAdminMobile')?.addEventListener('click', () => showLoginPage());

    // Muat data klien/users
    let clients = [];
    try {
      const res = await fetch('/api/clients').catch(() => null);
      if (res && res.ok) clients = await res.json();
    } catch (e) {}

    // Fallback jika kosong
    if (!clients || clients.length === 0) {
      clients = [
        { slug: 'kirana-bayu', name: 'Kirana & Bayu', approved: true },
        { slug: 'deni-dwi', name: 'Deni & Dwi', approved: true }
      ];
    }

    // Render statistik & user table
    const statUsers = document.getElementById('statTotalUsers');
    if (statUsers) statUsers.textContent = clients.length;
    const statActive = document.getElementById('statTotalActive');
    if (statActive) statActive.textContent = clients.length;

    const tbody = document.getElementById('adminUserList');
    if (tbody) {
      tbody.innerHTML = '';
      clients.forEach(c => {
        const isApproved = c.approved !== false;
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight:500;">${c.name || c.slug}</td>
          <td>${isApproved ? '<span class="badge-active">Aktif</span>' : '<span class="badge-pending-approval">Menunggu</span>'}</td>
          <td style="display:flex; gap:8px; align-items:center;">
            <a href="?id=${encodeURIComponent(c.slug)}" target="_blank">Lihat &rarr;</a>
            ${!isApproved ? `<button class="btn-approve-link" onclick="window.approveUser('${c.slug}')">Setujui</button>` : ''}
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Muat RSVP
    let rsvps = [];
    try {
      const res = await fetch('/api/rsvps').catch(() => null);
      if (res && res.ok) rsvps = await res.json();
    } catch (e) {}

    const statRsvp = document.getElementById('statTotalRsvp');
    if (statRsvp) statRsvp.textContent = rsvps.length;

    const tbodyRsvp = document.getElementById('adminRsvpList');
    if (tbodyRsvp) {
      tbodyRsvp.innerHTML = '';
      if (rsvps.length === 0) {
        tbodyRsvp.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#5a7a6e; padding:30px;">Belum ada konfirmasi RSVP masuk.</td></tr>';
      } else {
        rsvps.forEach(r => {
          const tr = document.createElement('tr');
          tr.innerHTML = `<td>${r.name || '-'}</td><td>${r.pax || '1'} orang</td><td>${r.attendance || 'Hadir'}</td>`;
          tbodyRsvp.appendChild(tr);
        });
      }
    }

    // Muat Pengaturan Global
    try {
      const sRes = await fetch('/api/settings').catch(() => null);
      if (sRes && sRes.ok) {
        const set = await sRes.json();
        const toggle = document.getElementById('globalRequireApproval');
        if (toggle) toggle.checked = set.requireApproval === true;
        const badge = document.getElementById('approvalBadge');
        if (badge) {
          badge.textContent = set.requireApproval ? 'Aktif' : 'Tidak Aktif';
          badge.className = 'approval-status-badge ' + (set.requireApproval ? 'badge-on' : 'badge-off');
        }
      }
    } catch (e) {}
  }

  window.adminSwitchTab = (tabId, el, isBottom = false) => {
    ['adminTabUsers', 'adminTabRsvp', 'adminTabSettings'].forEach(id => {
      const t = document.getElementById(id);
      if (t) t.style.display = 'none';
    });

    document.querySelectorAll('.admin-nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.abnav-item').forEach(n => n.classList.remove('active'));

    const target = document.getElementById(tabId);
    if (target) target.style.display = 'block';
    if (el) el.classList.add('active');

    if (isBottom) {
      const map = { adminTabUsers: 'adminNavUsers', adminTabRsvp: 'adminNavRsvp', adminTabSettings: 'adminNavSettings' };
      document.getElementById(map[tabId])?.classList.add('active');
    }
  };

  window.saveApprovalSetting = async (val) => {
    const badge = document.getElementById('approvalBadge');
    if (badge) {
      badge.textContent = val ? 'Aktif' : 'Tidak Aktif';
      badge.className = 'approval-status-badge ' + (val ? 'badge-on' : 'badge-off');
    }
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requireApproval: val })
    }).catch(() => null);
  };

  window.approveUser = async (slug) => {
    await fetch('/api/clients/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug })
    }).catch(() => null);
    alert(`Undangan ${slug} berhasil disetujui!`);
    showAdminDashboard();
  };

  // --- LOGIN DENGAN PIN (LANGSUNG KE DASHBOARD PEMBUATAN UNDANGAN) ---
  window.handlePinLogin = async (e) => {
    if (e) e.preventDefault();
    const pinInput = document.getElementById('inputPin');
    const errEl = document.getElementById('pinErrorMsg');
    const btnSubmit = document.getElementById('btnSubmitPin');
    const enteredPin = (pinInput ? pinInput.value : '').trim();

    if (!enteredPin) return;

    if (btnSubmit) {
      btnSubmit.textContent = 'Memverifikasi...';
      btnSubmit.disabled = true;
    }

    let isValid = false;

    // 1. Coba verifikasi ke backend /api/verify-pin
    try {
      const res = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: enteredPin })
      });
      if (res.ok) {
        const data = await res.json();
        isValid = data.valid === true;
      }
    } catch (err) {}

    // 2. Fallback PIN yang valid secara offline / standalone
    const validPins = ['1234', 'admin123', 'admin', '2026'];
    const localPin = localStorage.getItem('wedding_admin_pin');
    if (localPin && enteredPin === localPin) isValid = true;
    if (validPins.includes(enteredPin.toLowerCase())) isValid = true;

    if (isValid) {
      if (errEl) errEl.style.display = 'none';
      sessionStorage.setItem('satuacara_auth', 'true');
      
      // Jika PIN admin, buka dashboard admin; jika PIN biasa (1234 dsb), langsung ke dashboard pembuatan undangan!
      if (enteredPin.toLowerCase() === 'admin' || enteredPin.toLowerCase() === 'superadmin') {
        showAdminDashboard();
      } else {
        showUserDashboard();
      }
    } else {
      if (errEl) {
        errEl.style.display = 'block';
        errEl.textContent = '⚠️ PIN salah! Gunakan PIN default: 1234 atau admin123';
      }
      if (pinInput) {
        pinInput.focus();
        pinInput.select();
      }
    }

    if (btnSubmit) {
      btnSubmit.textContent = 'Masuk ke Dashboard Undangan';
      btnSubmit.disabled = false;
    }
  };

  // Logout Handler (Membersihkan sesi dan kembali ke halaman login PIN)
  document.getElementById('btnLogoutUser')?.addEventListener('click', () => {
    sessionStorage.removeItem('satuacara_auth');
    showLoginPage();
  });
  document.getElementById('btnLogoutAdmin')?.addEventListener('click', () => {
    sessionStorage.removeItem('satuacara_auth');
    showLoginPage();
  });
  document.getElementById('btnLogoutAdminMobile')?.addEventListener('click', () => {
    sessionStorage.removeItem('satuacara_auth');
    showLoginPage();
  });

  // --- INVITATION UI & MUSIC LOGIC ---
  window.openInvitation = () => {
    if (shell) shell.classList.remove('locked');
    const musicBtn = document.getElementById('musicBtn');
    if (musicBtn) musicBtn.style.display = 'flex';
    const bNav = document.getElementById('bottomNav');
    if (bNav) bNav.style.display = 'flex';
    startMusic();
    setTimeout(() => {
      document.getElementById('quote')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  // Web Audio Synthesizer & MP3 Player
  let audioCtx, masterGain, musicOn = false, musicTimer, htmlAudio = null;
  const chordNotes = [261.63, 329.63, 392.00, 493.88, 587.33, 493.88, 392.00, 329.63];

  function playNote(freq, startTime, dur) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.12, startTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(startTime);
    osc.stop(startTime + dur + 0.05);
  }

  function scheduleLoop() {
    if (!audioCtx || !musicOn) return;
    const now = audioCtx.currentTime;
    chordNotes.forEach((freq, i) => { playNote(freq, now + i * 0.42, 1.1); });
    musicTimer = setTimeout(scheduleLoop, chordNotes.length * 420);
  }

  function startMusic() {
    const musicBtn = document.getElementById('musicBtn');
    const processedUrl = fixDriveMusicUrl(window._customMusicUrl);

    if (processedUrl) {
      if (!htmlAudio) {
        htmlAudio = new Audio(processedUrl);
        htmlAudio.loop = true;
        htmlAudio.volume = 0.6;

        htmlAudio.onerror = (e) => {
          console.warn('⚠️ Gagal memutar audio dari URL:', processedUrl);

          // Coba fallback kedua jika tadi memakai proxy audio: langsung ke link direct Google Drive
          const fileId = extractDriveId(window._customMusicUrl);
          if (fileId && processedUrl.startsWith('/api/proxy-audio')) {
            console.log('🔄 Mencoba fallback langsung Google Drive download URL...');
            htmlAudio.src = `https://docs.google.com/uc?export=download&id=${fileId}`;
            htmlAudio.play().catch(() => fallbackToSynthesizer());
            return;
          }

          fallbackToSynthesizer();
        };

        function fallbackToSynthesizer() {
          console.log('🎶 Menggunakan default Web Audio synthesizer melody...');
          window._customMusicUrl = null;
          htmlAudio = null;
          startMusic();
        }
      }

      htmlAudio.play().then(() => {
        musicOn = true;
        musicBtn?.classList.add('spinning');
      }).catch((err) => {
        console.warn('Playback audio autoplay terhalang atau gagal:', err.message);
        musicOn = true;
        musicBtn?.classList.add('spinning');
      });
    } else {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.9;
        masterGain.connect(audioCtx.destination);
      }
      audioCtx.resume();
      musicOn = true;
      musicBtn?.classList.add('spinning');
      scheduleLoop();
    }
  }

  window.toggleMusic = () => {
    const musicBtn = document.getElementById('musicBtn');
    if (window._customMusicUrl) {
      if (!htmlAudio) return;
      if (musicOn) {
        htmlAudio.pause();
        musicOn = false;
        musicBtn?.classList.remove('spinning');
      } else {
        htmlAudio.play().catch(() => {});
        musicOn = true;
        musicBtn?.classList.add('spinning');
      }
    } else {
      if (!audioCtx) return;
      if (musicOn) {
        audioCtx.suspend();
        musicOn = false;
        clearTimeout(musicTimer);
        musicBtn?.classList.remove('spinning');
      } else {
        audioCtx.resume();
        musicOn = true;
        musicBtn?.classList.add('spinning');
        scheduleLoop();
      }
    }
  };

  // Countdown
  function tickCountdown() {
    if (!window.weddingTargetDate) return;
    const now = Date.now();
    const diff = Math.max(0, window.weddingTargetDate - now);
    const dayEl = document.getElementById('cd-day');
    const hrEl = document.getElementById('cd-hour');
    const minEl = document.getElementById('cd-min');
    const secEl = document.getElementById('cd-sec');
    if (dayEl) dayEl.textContent = String(Math.floor(diff / (1000 * 60 * 60 * 24))).padStart(2, '0');
    if (hrEl) hrEl.textContent = String(Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
    if (minEl) minEl.textContent = String(Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
    if (secEl) secEl.textContent = String(Math.floor((diff % (1000 * 60)) / 1000)).padStart(2, '0');
  }
  setInterval(tickCountdown, 1000);

  // RSVP Form Submit
  window.submitRsvp = async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Mengirim...';
    }

    const name = form.querySelector('input[type="text"]')?.value || 'Tamu';
    const pax = form.querySelector('select')?.value || '1 orang';
    const attendance = form.querySelector('input[name="hadir"]:checked')?.parentElement?.textContent?.trim() || 'Hadir';
    const id = new URLSearchParams(window.location.search).get('id') || 'demo';

    const rsvpPayload = { name, pax, attendance, inviteId: id };

    try {
      await fetch('/api/rsvps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rsvpPayload)
      }).catch(() => null);

      const succ = document.getElementById('rsvpSuccess');
      if (succ) succ.style.display = 'block';
      if (btn) btn.textContent = 'Terkirim ✓';
    } catch (err) {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Gagal, Coba Lagi';
      }
    }
  };

  // Wishes Form & Feed
  async function loadWishes(inviteId) {
    const list = document.getElementById('wishList');
    if (!list) return;

    let wishes = [];
    try {
      const res = await fetch('/api/wishes').catch(() => null);
      if (res && res.ok) wishes = await res.json();
    } catch (e) {}

    if (!wishes || wishes.length === 0) {
      wishes = [
        { name: 'Dinda Ayu', text: 'Selamat menempuh hidup baru! Semoga selalu bahagia dan sakinah mawaddah warahmah 🤍', tag: 'Hadir' },
        { name: 'Rafi Ramadhan', text: 'Congratulations for both of you, semoga langgeng sampai kakek nenek ya!', tag: 'Hadir' }
      ];
    }

    list.innerHTML = '';
    wishes.forEach(w => {
      const item = document.createElement('div');
      item.className = 'wish';
      item.innerHTML = `
        <div class="wname">${w.name || 'Tamu'}</div>
        <div class="wtext">${w.message || w.text || ''}</div>
        <div class="wtag">${w.status || w.tag || 'Hadir'}</div>
      `;
      list.appendChild(item);
    });
  }

  window.submitWish = async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button');
    if (btn) btn.disabled = true;

    const name = document.getElementById('wishName')?.value || '';
    const text = document.getElementById('wishText')?.value || '';
    const id = new URLSearchParams(window.location.search).get('id') || 'demo';

    const wishPayload = { name, message: text, text, status: 'Hadir', tag: 'Hadir', inviteId: id };

    try {
      await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wishPayload)
      }).catch(() => null);

      // Langsung prepend ke daftar ucapan
      const list = document.getElementById('wishList');
      if (list) {
        const item = document.createElement('div');
        item.className = 'wish';
        item.innerHTML = `
          <div class="wname">${name}</div>
          <div class="wtext">${text}</div>
          <div class="wtag">Hadir</div>
        `;
        list.insertBefore(item, list.firstChild);
      }
      form.reset();
    } catch (err) {
      alert('Gagal mengirim ucapan: ' + err.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  };

  // Copy Nomor Rekening
  window.copyNum = (btn, num) => {
    if (!num) return;
    navigator.clipboard.writeText(num).then(() => {
      const old = btn.textContent;
      btn.textContent = 'Tersalin';
      setTimeout(() => { btn.textContent = old; }, 1500);
    });
  };

})();
