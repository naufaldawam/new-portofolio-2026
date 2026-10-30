/* ===== NAUFAL AI - WEBSITE KNOWLEDGE ENGINE =====
 * Scans the portfolio DOM, builds a structured knowledge base from the real
 * page content, and provides lightweight retrieval: text normalization,
 * tokenization, stop-word filtering, synonym expansion, fuzzy matching, and
 * TF-IDF (cosine) relevance scoring.
 * Pure client-side JavaScript - no external AI services and no predefined
 * question-answer pairs. All knowledge is generated from the website itself.
 */
(function (global) {
  'use strict';

  /* ===== 1. TEXT NORMALIZATION ===== */

  var STOP_WORDS = new Set([
    // English (interrogative words and "you" are kept: they carry routing
    // meaning for identity questions, so do not strip them here)
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'being', 'but', 'by',
    'can', 'could', 'did', 'do', 'does', 'for', 'from', 'had', 'has', 'have',
    'he', 'her', 'his', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'me',
    'more', 'most', 'my', 'no', 'nor', 'not', 'of', 'on', 'or', 'our', 'she',
    'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'then',
    'there', 'these', 'they', 'this', 'those', 'to', 'was', 'we', 'were',
    'will', 'with', 'please', 'okay', 'maybe', 'really', 'just',
    'like', 'know', 'now', 'much', 'many', 'want', 'known',
    // Indonesian (same rule: interrogatives are kept, stopworded otherwise)
    'adalah', 'ada', 'akan', 'apa', 'apakah', 'banyak', 'bisa', 'dah',
    'dalam', 'dan', 'dapat', 'dari', 'di', 'dia', 'gimana', 'ia', 'ingin',
    'ini', 'itu', 'jika', 'juga', 'kalian', 'kan', 'karena', 'ke', 'kita',
    'mau', 'mereka', 'mu', 'nanti', 'nya', 'pada', 'pernah', 'saja',
    'saya', 'sebagai', 'seperti', 'sudah', 'untuk', 'utk', 'yg', 'yang',
    'kah', 'pun', 'selalu', 'jangan', 'kami', 'dong', 'deh', 'si', 'se',
    'gk', 'ga', 'enggak', 'tidak', 'bukan', 'lah', 'kok', 'hanya'
  ]);

  /* synonym groups: the first term is the canonical token */
  var SYNONYM_GROUPS = [
    ['name', 'nama', 'called', 'dipanggil', 'dipanggil'],
    ['developer', 'programmer', 'engineer', 'coder', 'programer',
      'developers', 'programmers', 'engineers'],
    ['backend', 'server', 'back-end', 'serverside'],
    ['frontend', 'front-end', 'ui', 'clientside'],
    ['experience', 'pengalaman', 'career', 'karir', 'karier', 'job', 'jobs',
      'work', 'worked', 'riwayat', 'pekerjaan', 'posisi', 'position', 'role',
      'roles', 'bekerja', 'kerja', 'kerjanya'],
    ['project', 'projek', 'projects', 'works', 'projectnya'],
    ['skill', 'skills', 'keahlian', 'kemampuan', 'stack', 'tech', 'technology',
      'teknologi', 'technologi', 'technical', 'teknikal', 'tool', 'tools',
      'alat', 'menguasai'],
    ['framework', 'fwk'],
    ['language', 'bahasa', 'languages', 'pemrograman'],
    ['programming', 'coding', 'code', 'ngoding', 'ngode', 'cod'],
    ['use', 'using', 'used', 'pakai', 'dipakai', 'digunakan', 'menggunakan',
      'memakai', 'pake', 'dipake', 'employing'],
    ['build', 'built', 'make', 'made', 'create', 'created', 'buat',
      'buatkan', 'membuat', 'bikin', 'develop', 'developed', 'kembangkan',
      'membangun', 'mengerjakan'],
    ['contact', 'kontak', 'hubungi', 'reach', 'connect', 'koordinasi'],
    ['email', 'mail', 'surel'],
    ['whatsapp', 'wa'],
    ['phone', 'telepon', 'number', 'nomor', 'hp', 'num'],
    ['education', 'pendidikan', 'study', 'studies', 'studied', 'studying',
      'educational', 'background', 'kuliah', 'sekolah', 'school', 'university',
      'universitas', 'lulusan', 'alumni', 'kampus', 'degree', 'gelar',
      'belajar', 'learn', 'learning', 'bootcamp', 'ijazah'],
    ['about', 'tentang', 'profile', 'profil', 'biodata', 'owner', 'pemilik',
      'identity', 'identitas', 'intro', 'introduction', 'perkenalan',
      'perkenalkan', 'myself', 'self', 'diri', 'yourself', 'himself', 'person',
      'orang', 'bio', 'pemiliknya', 'who', 'siapa'],
    ['you', 'your', 'kamu', 'anda', 'u'],
    ['year', 'years', 'tahun', 'umur', 'age', 'lamanya', 'lama'],
    ['location', 'lokasi', 'alamat', 'address', 'domisili', 'tinggal',
      'berasal', 'based', 'located', 'find', 'where', 'dimana'],
    ['see', 'show', 'lihat', 'tampilkan', 'tunjukkan', 'display', 'list',
      'perlihatkan'],
    ['describe', 'tell', 'ceritakan', 'ceritain', 'jelaskan', 'explain',
      'info', 'informasi', 'information', 'detail', 'details', 'rincian',
      'perihal', 'mengenai', 'cerita', 'kisah'],
    ['purpose', 'fungsi', 'tujuan', 'kegunaan', 'gunanya', 'guna'],
    ['status', 'perkembangan', 'progress', 'kondisi'],
    ['available', 'ada', 'tersedia', 'punya'],
    ['specialize', 'fokus', 'spesialis', 'specialized'],
    ['company', 'perusahaan', 'companies', 'instansi', 'firma'],
    ['gin', 'golang', 'go-lang'],
    ['whatsapp', 'wa'],
    ['website', 'web', 'site', 'situs', 'halaman', 'page', 'portofolio',
      'portfolio']
  ];

  var CATEGORY_ALIASES = {
    personal: ('profile about biodata owner pemilik identity identitas intro ' +
      'introduction perkenalan perkenalkan self diri yourself himself bio ' +
      'name nama person orang age umur website web site situs portofolio ' +
      'portfolio halaman page who siapa you your kamu anda describe tell ' +
      'cv resume').split(' '),
    experience: ('experience pengalaman career karir karier job jobs work ' +
      'riwayat pekerjaan kerja posisi position role roles perusahaan ' +
      'company companies').split(' '),
    skill: ('skill skills keahlian kemampuan stack tech technology teknologi ' +
      'technologi technical framework language bahasa programming coding ' +
      'pemrograman code tool tools use pakai menguasai').split(' '),
    education: ('education pendidikan educational background study studies ' +
      'studying kuliah sekolah school university universitas lulusan alumni ' +
      'kampus degree gelar bootcamp learn learning belajar ijazah').split(' '),
    project: ('project projek karya works product produk application ' +
      'aplikasi website web feature fitur buat build aplikasi').split(' '),
    contact: ('contact kontak hubungi reach connect email mail whatsapp wa ' +
      'phone telepon number nomor hp social sosmed media linkedin github ' +
      'instagram').split(' ')
  };

  var synonymMap = null;
  var categoryAliasTokens = null;

  function buildSynonymMap() {
    if (synonymMap) return;
    synonymMap = {};
    SYNONYM_GROUPS.forEach(function (group) {
      var canonical = group[0];
      group.forEach(function (term) {
        synonymMap[term.toLowerCase()] = canonical;
      });
    });
  }

  function normalizeText(text) {
    return String(text || '')
      .toLowerCase()
      .replace(/[\u2019\u2018']/g, "'")
      .replace(/[^a-z0-9\s+.@]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokenize(text) {
    return normalizeText(text)
      .split(/\s+/)
      .filter(Boolean)
      .map(function (tok) {
        return tok.replace(/^[.@]+|[.@]+$/g, '');
      })
      .filter(Boolean)
      .filter(function (tok) {
        return tok.length > 1 && !/^[.@+]+$/.test(tok);
      });
  }

  function canonicalToken(token) {
    return synonymMap[token] || token;
  }

  function canonicalTokens(tokens) {
    var seen = {};
    var out = [];
    tokens.forEach(function (token) {
      var key = canonicalToken(token);
      if (!seen[key]) {
        seen[key] = true;
        out.push(key);
      }
    });
    return out;
  }

  function meaningfulTokens(text) {
    return tokenize(text)
      .filter(function (token) {
        return !STOP_WORDS.has(token);
      });
  }

  function canonTokens(text) {
    return canonicalTokens(meaningfulTokens(text));
  }

  /* cheap levenshtein for fuzzy token matching */
  function levenshtein(a, b) {
    if (a === b) return 0;
    var la = a.length;
    var lb = b.length;
    if (!la) return lb;
    if (!lb) return la;
    var prev = new Array(lb + 1);
    var curr = new Array(lb + 1);
    for (var j = 0; j <= lb; j++) prev[j] = j;
    for (var i = 1; i <= la; i++) {
      curr[0] = i;
      for (var j = 1; j <= lb; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(
          prev[j] + 1,
          curr[j - 1] + 1,
          prev[j - 1] + cost
        );
      }
      var tmp = prev;
      prev = curr;
      curr = tmp;
    }
    return prev[lb];
  }

  /* ===== 2. KNOWLEDGE ENTRY HELPERS ===== */

  function makeEntry(parts) {
    return {
      id: parts.id,
      category: parts.category || 'general',
      sectionId: parts.sectionId || null,
      sectionTitle: parts.sectionTitle || '',
      title: parts.title || '',
      content: parts.content || '',
      keywords: parts.keywords || [],
      entities: parts.entities || [],
      references: parts.references || [],
      link: parts.link || null,
      status: parts.status || null,
      kind: parts.kind || 'text',
      meta: parts.meta || null
    };
  }

  /* ===== 3. DOM SCANNER ===== */

  var SECTION_PLAN = [
    { id: 'home', category: 'personal', title: 'Home' },
    { id: 'about', category: 'personal', title: 'About' },
    { id: 'skills', category: 'skill', title: 'Skills' },
    { id: 'education', category: 'education', title: 'Education' },
    { id: 'journey', category: 'experience', title: 'Journey' },
    { id: 'portfolio', category: 'project', title: 'Portfolio' },
    { id: 'contact', category: 'contact', title: 'Contact' }
  ];

  function textOf(node) {
    if (!node) return '';
    var txt = node.textContent || '';
    return txt.replace(/\s+/g, ' ').trim();
  }

  function queryAll(root, selector) {
    if (!root || !root.querySelectorAll) return [];
    return Array.prototype.slice.call(root.querySelectorAll(selector));
  }

  function iconLabel(iconClass) {
    if (/github/i.test(iconClass)) return 'GitHub';
    if (/linkedin/i.test(iconClass)) return 'LinkedIn';
    if (/instagram/i.test(iconClass)) return 'Instagram';
    if (/whatsapp/i.test(iconClass)) return 'WhatsApp';
    if (/envelope|mail/i.test(iconClass)) return 'Email';
    if (/map-marker/i.test(iconClass)) return 'Location';
    if (/facebook/i.test(iconClass)) return 'Facebook';
    if (/twitter|(x-)/i.test(iconClass)) return 'Twitter';
    return null;
  }

  function scanHero(entries) {
    var hero = document.getElementById('home');
    if (!hero) return;

    var name = textOf(hero.querySelector('h1'));
    var tagline = textOf(hero.querySelector('h3'));
    var desc = textOf(hero.querySelector('.hero-content > p'));
    var rolesEl = hero.querySelector('.typed-text');
    var roles = [];
    if (rolesEl) {
      var attr = rolesEl.getAttribute('data-roles');
      if (attr) {
        roles = attr.split('|').map(function (r) { return r.trim(); })
          .filter(Boolean);
      }
    }
    var rolesText = roles.join(', ');

    entries.push(makeEntry({
      id: 'personal-name',
      category: 'personal',
      sectionId: '#home',
      sectionTitle: 'Home',
      title: name,
      content: desc,
      keywords: rolesText ? rolesText.split(/[,\s]+/) : [],
      entities: [name, 'Naufal', 'Dawam', 'Dzikrilah'],
      references: [tagline, 'Owner of this portfolio website']
        .concat(rolesText ? ['Roles: ' + rolesText] : []),
      kind: 'bio',
      meta: { roles: roles, tagline: tagline }
    }));

    if (roles.length) {
      entries.push(makeEntry({
        id: 'personal-roles',
        category: 'personal',
        sectionId: '#home',
        sectionTitle: 'Home',
        title: rolesText,
        content: 'Naufal works as: ' + rolesText,
        keywords: roles,
        references: ['professional roles'],
        kind: 'roles',
        meta: { roles: roles }
      }));
    }

    queryAll(hero, '.social-links a').forEach(function (a, i) {
      var href = a.getAttribute('href') || '';
      var label = iconLabel(a.className || '');
      if (!label) return;
      entries.push(makeEntry({
        id: 'social-' + i + '-' + label.toLowerCase().replace(/[^a-z0-9]/g, ''),
        category: 'contact',
        sectionId: '#home',
        sectionTitle: 'Home',
        title: label,
        content: label + ': ' + href,
        keywords: [label.toLowerCase(), 'sosial', 'social', 'media'],
        entities: [label],
        references: [href],
        link: href,
        kind: 'social'
      }));
    });
  }

  function scanAbout(entries) {
    var about = document.getElementById('about');
    if (!about) return;

    var sectionTitle = textOf(about.querySelector('.section-title')) ||
      'Beyond the Code';

    var descEl = about.querySelector('.about-text p');
    if (descEl) {
      entries.push(makeEntry({
        id: 'personal-desc',
        category: 'personal',
        sectionId: '#about',
        sectionTitle: sectionTitle,
        title: 'About Naufal',
        content: textOf(descEl),
        keywords: ['about', 'naufal', 'curious', 'responsibility', 'learning',
          'software', 'development'],
        references: [textOf(about.querySelector('.about-text'))],
        kind: 'bio-desc'
      }));
    }

    queryAll(about, '.about-stats .stat-box').forEach(function (box, i) {
      var value = textOf(box.querySelector('h3'));
      var label = textOf(box.querySelector('p')) ||
        textOf(box.querySelector('h7'));
      if (!value || !label) return;
      var kind = 'stat';
      var cat = 'personal';
      if (/experience|pengalaman|tahun/i.test(label)) {
        kind = 'stat-experience';
        cat = 'experience';
      } else if (/project/i.test(label)) {
        kind = 'stat-projects';
        cat = 'personal';
      } else if (/compan|perusahaan/i.test(label)) {
        kind = 'stat-companies';
        cat = 'experience';
      }
      entries.push(makeEntry({
        id: 'stat-' + i,
        category: cat,
        sectionId: '#about',
        sectionTitle: sectionTitle,
        title: value + ' ' + label,
        content: value + ' ' + label,
        keywords: [value, label.toLowerCase()],
        entities: [value],
        references: [value + ' ' + label],
        kind: kind,
        meta: { value: value, label: label }
      }));
    });

    var cvLink = about.querySelector('a[href*="drive.google.com"], a[download]') ||
      about.querySelector('.about-text a');
    if (cvLink) {
      entries.push(makeEntry({
        id: 'personal-cv',
        category: 'personal',
        sectionId: '#about',
        sectionTitle: sectionTitle,
        title: 'Curriculum Vitae',
        content: 'Naufal shares his CV in the About section. You can download it there.',
        keywords: ['cv', 'curriculum', 'vitae', 'resume', 'download', 'daftar'],
        entities: ['CV'],
        references: [cvLink.getAttribute('href') || ''],
        link: (cvLink.getAttribute('href') || '').split('?')[0],
        kind: 'cv'
      }));
    }

    entries.push(makeEntry({
      id: 'site-intro',
      category: 'personal',
      sectionId: '#home',
      sectionTitle: 'Home',
      title: 'Portfolio Website',
      content: document.title || 'Naufal Dawam | Interactive Portfolio',
      keywords: ['website', 'web', 'site', 'portofolio', 'portfolio',
        'interactive', 'portfolio'],
      entities: ['Portfolio Website', 'Naufal Dawam'],
      references: ['Static website built with HTML, CSS, and JavaScript'],
      kind: 'site'
    }));
  }

  function scanSkills(entries) {
    var skills = document.getElementById('skills');
    if (!skills) return;

    var sectionTitle = textOf(skills.querySelector('.section-title')) ||
      'Tech Arsenal';

    queryAll(skills, '.skill-category').forEach(function (catEl) {
      var catName = textOf(catEl.querySelector('.skill-head h3'));
      queryAll(catEl, '.bar').forEach(function (bar, i) {
        var spans = queryAll(bar, '.info span');
        if (spans.length < 2) return;
        var skillName = textOf(spans[0]);
        var levelText = textOf(spans[1]);
        var level = parseInt(levelText.replace(/\D+/g, ''), 10) || 0;
        if (!skillName) return;
        entries.push(makeEntry({
          id: 'skill-' + catName.toLowerCase().replace(/[^a-z0-9]/g, '-') +
            '-' + i,
          category: 'skill',
          sectionId: '#skills',
          sectionTitle: sectionTitle,
          title: skillName,
          content: skillName + ' (' + catName + ') at ' + level + '%',
          keywords: [skillName.toLowerCase()],
          entities: [skillName],
          references: [catName, levelText],
          kind: 'skill',
          meta: { group: catName, level: level }
        }));
      });
    });
  }

  function scanTimeline(entries, sectionId, category) {
    var section = document.getElementById(sectionId);
    if (!section) return;

    var sectionTitle = textOf(section.querySelector('.section-title')) ||
      sectionId.charAt(0).toUpperCase() + sectionId.slice(1);

    queryAll(section, '.timeline-item').forEach(function (item, i) {
      var date = textOf(item.querySelector('.timeline-content .date'));
      var title = textOf(item.querySelector('.timeline-content h3'));
      var place = textOf(item.querySelector('.timeline-content p'));
      if (!title) return;

      var isEducation = category === 'education';
      entries.push(makeEntry({
        id: category + '-' + i,
        category: category,
        sectionId: '#' + sectionId,
        sectionTitle: sectionTitle,
        title: isEducation ? title + ' at ' + place : title,
        content: title + (place ? ' at ' + place : '') +
          (date ? ' (' + date + ')' : ''),
        keywords: [title.toLowerCase()]
          .concat(date ? date.toLowerCase().split(/\s+/) : [])
          .concat(place ? place.toLowerCase().split(/\s+/) : []),
        entities: [place, date].filter(Boolean),
        references: [date, place].filter(Boolean),
        kind: isEducation ? 'education' : 'role',
        meta: { date: date, place: place, title: title }
      }));
    });
  }

  function scanProjects(entries) {
    var portfolio = document.getElementById('portfolio');
    if (!portfolio) return;

    var sectionTitle = textOf(portfolio.querySelector('.section-title')) ||
      'Featured Works';

    queryAll(portfolio, '.portfolio-card').forEach(function (card, i) {
      var info = card.querySelector('.card-info');
      if (!info) return;
      var status = textOf(info.querySelector('.date'));
      var title = textOf(info.querySelector('h3'));
      var desc = textOf(info.querySelector('p'));
      var linkEl = info.querySelector('a');
      var link = linkEl ? linkEl.getAttribute('href') || '' : '';
      var img = card.querySelector('.card-img img');
      var alt = img ? img.getAttribute('alt') || '' : '';

      if (!title) return;
      entries.push(makeEntry({
        id: 'project-' + i,
        category: 'project',
        sectionId: '#portfolio',
        sectionTitle: sectionTitle,
        title: title,
        content: desc || title,
        keywords: [title.toLowerCase()],
        entities: [title, alt].filter(Boolean),
        references: [status, alt, link].filter(Boolean),
        link: link,
        status: status || null,
        kind: 'project',
        meta: { index: i, alt: alt || null }
      }));
    });
  }

  function scanContact(entries) {
    var contact = document.getElementById('contact');
    if (!contact) return;

    var sectionTitle = textOf(contact.querySelector('.section-title')) ||
      "Let's Connect";

    queryAll(contact, '.info-item').forEach(function (item, i) {
      var label = textOf(item.querySelector('h4')) ||
        iconLabel(item.querySelector('i') ? item.querySelector('i').className : '') ||
        '';
      var value = textOf(item.querySelector('p'));
      if (!value) return;
      entries.push(makeEntry({
        id: 'contact-item-' + i,
        category: 'contact',
        sectionId: '#contact',
        sectionTitle: sectionTitle,
        title: label,
        content: label + ': ' + value,
        keywords: [label.toLowerCase(), 'contact', 'kontak'],
        entities: [label, value],
        references: [value],
        kind: 'contact',
        meta: { label: label, value: value }
      }));
    });
  }

  function scanWebsiteTech(entries) {
    var libs = [];
    queryAll(document, 'link[rel="stylesheet"]').forEach(function (link) {
      var href = link.getAttribute('href') || '';
      if (/fonts\.googleapis|fonts\.gstatic/i.test(href)) libs.push('Google Fonts');
      else if (/font-awesome/i.test(href)) libs.push('Font Awesome');
      else if (/aos/i.test(href)) libs.push('AOS');
    });
    queryAll(document, 'body script[src]').forEach(function (script) {
      var src = script.getAttribute('src') || '';
      if (/particles/i.test(src)) libs.push('particles.js');
      else if (/typed/i.test(src)) libs.push('Typed.js');
      else if (/vanilla-tilt/i.test(src)) libs.push('Vanilla Tilt');
      else if (/emailjs|email\.js/i.test(src)) libs.push('EmailJS');
      else if (/aos/i.test(src)) libs.push('AOS');
    });
    var unique = Array.from(new Set(libs));
    if (!unique.length) return;

    entries.push(makeEntry({
      id: 'site-tech',
      category: 'personal',
      sectionId: '#home',
      sectionTitle: 'Home',
      title: 'Website Technologies',
      content: 'This portfolio website is built with HTML, CSS, and JavaScript. Libraries used: ' +
        unique.join(', ') + '.',
      keywords: ['website', 'tech', 'technology', 'libraries', 'built']
        .concat(unique.map(function (l) { return l.toLowerCase(); })),
      entities: unique,
      references: ['Static site', 'No backend framework'],
      kind: 'site-tech'
    }));
  }

  /* ===== 4. KNOWLEDGE BASE BUILDER ===== */

  function collectEntries() {
    var entries = [];
    scanHero(entries);
    scanAbout(entries);
    scanSkills(entries);
    scanTimeline(entries, 'education', 'education');
    scanTimeline(entries, 'journey', 'experience');
    scanProjects(entries);
    scanContact(entries);
    scanWebsiteTech(entries);
    return entries;
  }

  function buildIdf(index) {
    var n = index.n;
    index.idf = {};
    index.df.forEach(function (count, token) {
      index.idf[token] = 1 + Math.log(n / (1 + count));
    });
  }

  function buildFromEntries(entries) {
    buildSynonymMap();
    categoryAliasTokens = categoryAliasTokens || {};
    Object.keys(CATEGORY_ALIASES).forEach(function (cat) {
      categoryAliasTokens[cat] = canonicalTokens(CATEGORY_ALIASES[cat]);
    });

    var index = {
      tf: new Map(),
      df: new Map(),
      norm: new Map(),
      idf: {},
      n: 0,
      vocab: new Set(),
      titleTokens: {}
    };
    var byCategory = {};
    var tokensPerEntry = {};

    entries.forEach(function (entry) {
      var weights = {};
      var alts = Array.isArray(entry.entities) ? entry.entities.join(' ')
        : String(entry.entities || '');
      var refs = Array.isArray(entry.references) ? entry.references.join(' ')
        : String(entry.references || '');

      index.titleTokens[entry.id] = canonicalTokens(meaningfulTokens(
        entry.title + ' ' + alts
      ));

      function addField(weight, text) {
        canonicalTokens(meaningfulTokens(text)).forEach(function (token) {
          weights[token] = (weights[token] || 0) + weight;
          index.vocab.add(token);
        });
      }

      addField(5, entry.title);
      addField(2.5, Array.isArray(entry.keywords) ? entry.keywords.join(' ')
        : String(entry.keywords || ''));
      addField(5, alts);
      addField(1, entry.content);
      addField(1, refs);
      if (entry.status) addField(1.5, String(entry.status));

      var aliases = categoryAliasTokens[entry.category] || [];
      aliases.forEach(function (token) {
        weights[token] = (weights[token] || 0) + 0.5;
        index.vocab.add(token);
      });

      var termFreq = new Map();
      var sumSq = 0;
      Object.keys(weights).forEach(function (token) {
        if (STOP_WORDS.has(token)) return;
        termFreq.set(token, weights[token]);
        sumSq += weights[token] * weights[token];
        index.df.set(token, (index.df.get(token) || 0) + 1);
      });

      tokensPerEntry[entry.id] = termFreq;
      var norm = Math.sqrt(sumSq) || 1;
      index.norm.set(entry.id, norm);
      (byCategory[entry.category] = byCategory[entry.category] || []).push(entry);
    });

    index.tf = tokensPerEntry;
    index.n = entries.length;
    buildIdf(index);

    return { entries: entries, index: index, byCategory: byCategory };
  }

  function buildFromDOM() {
    return buildFromEntries(collectEntries());
  }

  /* ===== 5. RETRIEVAL / SEARCH ===== */

  function fuzzyExpand(token, vocab, maxDist) {
    if (vocab.has(token)) return [token];
    if (token.length < 4) return [];
    var out = [];
    var limit = maxDist || (token.length >= 8 ? 2 : 1);
    vocab.forEach(function (candidate) {
      if (candidate.length < 4) return;
      if (Math.abs(candidate.length - token.length) > limit) return;
      if (levenshtein(token, candidate) <= limit) out.push(candidate);
    });
    return out.slice(0, 6);
  }

  /* weak tokens contribute half a routing hit */
  var WEAK_TOKENS = new Set(['who', 'what', 'how', 'siapa', 'apa', 'kapan',
    'kenapa', 'mengapa', 'mana', 'berapa', 'this', 'another', 'bisa', 'can',
    'where', 'dimana', 'location', 'about']);

  function aliasUniverse() {
    var set = new Set();
    Object.keys(CATEGORY_ALIASES).forEach(function (cat) {
      (categoryAliasTokens[cat] || []).forEach(function (t) { set.add(t); });
    });
    return set;
  }

  function neutralTokens(kb) {
    var set = new Set();
    kb.entries.forEach(function (entry) {
      if (entry.kind === 'bio') {
        (kb.index.titleTokens[entry.id] || []).forEach(function (t) {
          set.add(t);
        });
      }
    });
    return set;
  }

  function categoryHits(tokens, kb, neutral) {
    var hits = {};
    var strong = {};
    var byCategory = kb.byCategory;
    Object.keys(byCategory || {}).forEach(function (cat) {
      var aliasSet = new Set(
        (categoryAliasTokens[cat] || []).map(function (t) { return t; })
      );
      var total = 0;
      var strongCount = 0;
      tokens.forEach(function (token) {
        if (token in neutral) return;
        if (aliasSet.has(token)) {
          total += WEAK_TOKENS.has(token) ? 0.5 : 1;
          if (!WEAK_TOKENS.has(token)) strongCount++;
        }
      });
      if (total > 0) {
        hits[cat] = total;
        strong[cat] = strongCount;
      }
    });
    return { hits: hits, strong: strong };
  }

  function maxTitleHits(tokens, entries, index, skipSet) {
    var best = 0;
    entries.forEach(function (entry) {
      var titleSet = index.titleTokens[entry.id];
      if (!titleSet) return;
      var count = 0;
      tokens.forEach(function (token) {
        if (skipSet[token]) return;
        if (titleSet.indexOf(token) !== -1) count++;
      });
      if (count > best) best = count;
    });
    return best;
  }

  function isOffTopic(question) {
    var q = String(question || '').toLowerCase();
    return /(presiden|jokowi|prabowo|cuaca|harga iphone|harga hp|harga mobil|rekomendasi laptop|resep|puisi|translate|terjemahkan|berita terbaru|pacar naufal|agama naufal|ijazah|gaji programmer|messi|ronaldo|10 tambah|tambah 20|berapa kali|nasi goreng)/.test(q);
  }

  function search(question, kb) {
    if (isOffTopic(question)) {
      return {
        score: 0, category: null, isAvailable: false, entries: [],
        top: null, tokens: canonTokens(question)
      };
    }

    if (!kb || !kb.entries.length) {
      return { score: 0, category: null, entries: [], top: null, tokens: [] };
    }

    var exact = canonTokens(question);
    var totalQuery = exact.length;
    var tokens = exact.slice();
    var vocab = kb.index.vocab;

    exact.forEach(function (token) {
      if (!vocab.has(token)) {
        Array.prototype.push.apply(tokens, fuzzyExpand(token, vocab, null));
      }
    });

    var q = {};
    var known = 0;
    var knownExact = 0;
    tokens.forEach(function (token) {
      if (vocab.has(token) && !(token in q)) {
        q[token] = exact.indexOf(token) === -1 ? 0.9 : 1.4;
        known++;
        if (exact.indexOf(token) !== -1) knownExact++;
      }
    });

    if (!known) {
      return {
        score: 0, category: null, isAvailable: false, entries: [],
        top: null, tokens: tokens
      };
    }

    var qNorm = 0;
    Object.keys(q).forEach(function (token) {
      qNorm += Math.pow((kb.index.idf[token] || 1) * q[token], 2);
    });
    qNorm = Math.sqrt(qNorm) || 1;

    var scored = [];
    kb.entries.forEach(function (entry) {
      var termFreq = kb.index.tf[entry.id];
      if (!termFreq) return;
      var dot = 0;
      Object.keys(q).forEach(function (token) {
        var w = termFreq.get(token);
        if (w) dot += q[token] * (kb.index.idf[token] || 1) * w;
      });
      if (!dot) return;
      var sim = dot / (qNorm * (kb.index.norm.get(entry.id) || 1));
      scored.push({ entry: entry, score: sim });
    });

    scored.sort(function (a, b) { return b.score - a.score; });

    var neutral = {};
    neutralTokens(kb).forEach(function (t) { neutral[t] = true; });
    var skipTitle = {};
    aliasUniverse().forEach(function (t) { skipTitle[t] = true; });
    Object.keys(neutral).forEach(function (t) { skipTitle[t] = true; });

    var routing = categoryHits(exact, kb, neutral);
    var catScores = {};

    Object.keys(routing.hits).forEach(function (cat) {
      catScores[cat] = routing.hits[cat];
    });

    var contBest = {};
    scored.forEach(function (item) {
      var cat = item.entry.category;
      contBest[cat] = Math.max(contBest[cat] || 0, item.score);
    });
    Object.keys(routing.hits).forEach(function (cat) {
      var titleHits = maxTitleHits(exact, kb.byCategory[cat], kb.index,
        skipTitle);
      catScores[cat] += 0.5 * (contBest[cat] || 0) + 1.5 * titleHits;
    });
    Object.keys(contBest).forEach(function (cat) {
      if (!(cat in catScores)) catScores[cat] = 0.5 * contBest[cat];
    });

    var topCategory = null;
    var topCatScore = 0;
    Object.keys(catScores).forEach(function (cat) {
      if (catScores[cat] > topCatScore) {
        topCatScore = catScores[cat];
        topCategory = cat;
      }
    });

    var top = scored.length ? scored[0] : null;
    var bestContSim = top ? top.score : 0;
    var secondContSim = scored.length > 1 ? scored[1].score : 0;

    var weakUnknown = 0;
    exact.forEach(function (token) {
      if (WEAK_TOKENS.has(token) && !vocab.has(token)) weakUnknown++;
    });
    var recallBase = Math.max(1, totalQuery - weakUnknown);
    var recall = knownExact / recallBase;
    var strongHits = routing.strong[topCategory] || 0;

    var isAvailable = (strongHits >= 1 && recall >= 0.75) ||
      (bestContSim >= 0.35 && recall >= 0.6) ||
      (bestContSim >= 0.25 && recall >= 0.75);

    return {
      score: topCatScore,
      category: topCategory,
      hits: routing.hits[topCategory] || 0,
      strongHits: strongHits,
      recall: recall,
      isAvailable: isAvailable,
      entries: scored.slice(0, 12),
      top: top,
      topContSim: bestContSim,
      secondContSim: secondContSim,
      tokens: tokens
    };
  }

  function entriesByCategory(kb, category) {
    return (kb && kb.byCategory && kb.byCategory[category]) || [];
  }

  function canonicalize(text) {
    return canonTokens(text);
  }

  /* ===== 6. EXPORTS ===== */

  global.NaufalKnowledge = {
    build: buildFromDOM,
    buildFromEntries: buildFromEntries,
    collectEntries: collectEntries,
    search: search,
    entriesByCategory: entriesByCategory,
    canonicalize: canonicalize,
    normalizeText: normalizeText,
    tokenize: tokenize,
    meaningfulTokens: meaningfulTokens,
    buildSynonymMap: buildSynonymMap,
    _test: { levenshtein: levenshtein }
  };
})(typeof window !== 'undefined' ? window : globalThis);
