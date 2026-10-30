/* ===== NAUFAL AI - PORTFOLIO ASSISTANT =====
 * Client-side conversational engine for the portfolio website.
 *
 * The assistant automatically builds its knowledge base from the actual
 * website content (see knowledge.js) instead of predefined question-answer
 * pairs. On every page load it:
 *   1. waits for the DOM,
 *   2. scans the visible page content,
 *   3. normalizes the collected information,
 *   4. applies keyword / synonym indexing,
 *   5. marks the assistant as ready.
 *
 * Questions are normalized, expanded with synonyms, and matched against the
 * knowledge base using lightweight TF-IDF relevance scoring. No question is
 * sent to any external AI service.
 */
(function () {
  'use strict';

  if (typeof NaufalKnowledge === 'undefined') return;

  /* ===== STATUS ===== */

  var state = {
    kb: null,
    ready: false,
    initPromise: null,
    statusText: 'Initializing AI...'
  };

  var onStatus = function () {};

  function setStatus(text, ready) {
    state.statusText = text;
    state.ready = !!ready;
    try {
      onStatus(text, state.ready);
    } catch (err) {
      /* UI callback must never break the engine */
    }
  }

  function scheduleIdle(fn) {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(fn, { timeout: 400 });
    } else if (typeof setTimeout === 'function') {
      setTimeout(fn, 200);
    }
  }

  /* ===== INITIALIZATION LIFECYCLE ===== */

  function startInit() {
    if (state.initPromise) return state.initPromise;

    setStatus('Initializing AI...', false);

    state.initPromise = new Promise(function (resolve) {
      scheduleIdle(function () {
        try {
          setStatus('Scanning portfolio content...', false);
          var kb = NaufalKnowledge.build();
          setStatus('Processing website knowledge...', false);

          setTimeout(function () {
            state.kb = kb;
            setStatus('AI is ready.', true);
            console.log(
              'Naufal AI initialized: %d knowledge entries, %d unique terms.',
              kb.entries.length,
              kb.index.vocab.size
            );
            resolve(kb);
          }, 30);
        } catch (err) {
          console.error('Naufal AI initialization failed:', err);
          setStatus('AI unavailable.', false);
          resolve(null);
        }
      });
    });

    return state.initPromise;
  }

  function retrain() {
    state.kb = null;
    if (state.initPromise && !state.ready) return state.initPromise;
    state.initPromise = null;
    return startInit();
  }

  /* ===== SMALLTALK (conversational scaffolding, not website data) ===== */

  var GREET_TOKENS = ['halo', 'hai', 'hi', 'hello', 'hey', 'yo', 'pagi',
    'siang', 'sore', 'malam', 'selamat', 'kabar', 'howdy', 'salam',
    'assalamualaikum'];
  var THANKS_TOKENS = ['thanks', 'thank', 'thx', 'tks', 'makasih',
    'terima', 'syukron'];
  var BYE_TOKENS = ['bye', 'dadah', 'jumpa', 'sampai', 'daah', 'selamat'];
  var CAPABLE_TOKENS = ['help', 'bantu', 'bantuan', 'fitur', 'capable',
    'coba', 'tes', 'test', 'gunakan', 'pakai'];

  var RESPONSES = {
    greeting: {
      id: [
        'Halo! Saya Naufal AI. Ada yang ingin kamu ketahui tentang Naufal?',
        'Halo! Kamu bisa bertanya soal project, pengalaman, skill, pendidikan, atau kontak Naufal.',
        'Hi! Mau kenal lebih dekat dengan Naufal? Silakan tanya apa saja.'
      ],
      en: [
        "Hello! I'm Naufal AI. What would you like to know about Naufal?",
        "Hi! Ask me about Naufal's projects, experience, skills, education, or contact.",
        'Hello! Feel free to ask me anything about this portfolio.'
      ]
    },
    thanks: {
      id: [
        'Sama-sama! Senang bisa membantu. Ada lagi yang ingin ditanyakan?',
        'Siap, kapan saja! Jangan ragu bertanya lagi.'
      ],
      en: [
        "You're welcome! Anything else you want to know?",
        'My pleasure! Feel free to ask again.'
      ]
    },
    bye: {
      id: ['Dadah! Semoga harimu menyenangkan.'],
      en: ['Bye! Have a nice day.']
    },
    capabilities: {
      id: [
        'Saya bisa menjawab pertanyaan seputar isi website ini, misalnya profil Naufal, skill dan tech stack, pengalaman kerja, pendidikan, project, sampai cara menghubunginya. Mau tanya apa?'
      ],
      en: [
        'I can answer questions about this website, like Naufal profile, skills and tech stack, work experience, education, featured projects, and how to contact him. What would you like to know?'
      ]
    },
    botSelf: {
      id: [
        "Saya Naufal AI, asisten virtual dari portfolio ini. Saya sudah memahami seluruh isi website ini - profil, pengalaman, skill, pendidikan, project, dan kontak Naufal. Semua diproses langsung di browser kamu."
      ],
      en: [
        "I'm Naufal AI, the assistant of this portfolio. I've read the entire website, so I can answer questions about Naufal's profile, skills, experience, education, projects, and contact info. Everything runs in your browser."
      ]
    }
  };

  var INTENT_WORDS = {
    project: /project|projek|karya|featured|works|aplikasi|aplikasi/,
    skill: /skill|keahlian|tech|stack|teknologi|framework|bahasa|programming|coding/,
    experience: /experience|pengalaman|karir|work|job|kerja/,
    education: /education|pendidikan|sekolah|kuliah|belajar|bootcamp/,
    contact: /contact|kontak|hubungi|email|whatsapp|telepon/,
    about: /profil|profile|about|tentang|nama|siapa|owner/,
    website: /website|web|situs|site|portfolio|portofolio/
  };

  function tokenizeRaw(text) {
    return NaufalKnowledge.normalizeText(text).split(/\s+/).filter(Boolean);
  }

  function hasIntentWords(text) {
    for (var key in INTENT_WORDS) {
      if (INTENT_WORDS[key].test(text)) return true;
    }
    return false;
  }

  function matchSmalltalk(question, lang) {
    var lower = question.toLowerCase();
    var raw = tokenizeRaw(question);
    var text = ' ' + lower + ' ';

    if (/(how are you|apa kabar|gimana kabar|kabar)/.test(lower)) {
      return smalltalkAnswer('greeting', lang);
    }

    function hasAny(tokens) {
      return raw.some(function (token) {
        return tokens.indexOf(token) !== -1;
      });
    }

    if (hasAny(THANKS_TOKENS) && !hasIntentWords(text)) {
      return smalltalkAnswer('thanks', lang);
    }
    if (hasAny(BYE_TOKENS) && /(bye|dadah|jumpa|sampai)/.test(lower)) {
      return smalltalkAnswer('bye', lang);
    }
    if (/(\bbot\b|assistant|chatbot|artificial)/.test(text) ||
        (/(\bai\b)/.test(text) && /(you|kamu|anda|are)/.test(text))) {
      return smalltalkAnswer('botSelf', lang);
    }
    if (hasAny(CAPABLE_TOKENS) && !hasIntentWords(text)) {
      return smalltalkAnswer('capabilities', lang);
    }
    if (hasAny(GREET_TOKENS) && !hasIntentWords(text)) {
      return smalltalkAnswer('greeting', lang);
    }
    return null;
  }

  function randomOf(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function smalltalkAnswer(type, lang) {
    var variants = RESPONSES[type];
    var text = randomOf(variants[lang] || variants.id);
    return { text: text, action: null, label: null, confidence: 1 };
  }

  /* ===== LANGUAGE DETECTION ===== */

  var ID_MARKERS = /(siapa|apa|bagaimana|dimana|kenapa|kapan|berapa|yang|dengan|untuk|pengalaman|skill|keahlian|kontak|hubungi|pendidikan|bisa|kerja|tahun|punya|saya|kamu|gimana|profil|project|tentang)/gi;
  var EN_MARKERS = /(who|what|how|where|when|why|which|the|and|you|your|with|for|from|tell|about|have|has|his|him|he|is|are|can|does|did|please)/gi;

  function detectLanguage(question) {
    var idCount = (question.match(ID_MARKERS) || []).length;
    var enCount = (question.match(EN_MARKERS) || []).length;
    return enCount > idCount ? 'en' : 'id';
  }

  /* ===== ANSWER BUILDERS (based on scanned website content only) ===== */

  var CATEGORY_META = {
    personal: { action: '#about', label: 'About Naufal' },
    skill: { action: '#skills', label: 'View tech stack' },
    experience: { action: '#journey', label: 'View journey' },
    education: { action: '#education', label: 'View education' },
    project: { action: '#portfolio', label: 'View works' },
    contact: { action: '#contact', label: 'Contact Naufal' }
  };

  function withMeta(answer, category) {
    var meta = CATEGORY_META[category];
    if (meta) {
      answer.action = meta.action;
      answer.label = meta.label;
    }
    return answer;
  }

  function entriesByKind(kb, kind) {
    return kb.entries.filter(function (entry) {
      return entry.kind === kind;
    });
  }

  function findStat(kb, kind) {
    var list = entriesByKind(kb, kind);
    return list.length ? list[0] : null;
  }

  function listItems(list, lang) {
    return list.map(function (item, i) {
      return (i + 1) + '. ' + item.title +
        (item.status ? ' (' + item.status + ')' : '');
    }).join('\n');
  }

  function bioAnswer(kb, lang) {
    var nameEntry = entriesByKind(kb, 'bio')[0];
    var name = nameEntry ? nameEntry.title : 'Naufal Dawam Dzikrilah';
    var roles = (nameEntry && nameEntry.meta && nameEntry.meta.roles) || [];
    var descEntry = entriesByKind(kb, 'bio')[0];
    var desc = descEntry ? descEntry.content : '';

    var years = findStat(kb, 'stat-experience');
    var projects = findStat(kb, 'stat-projects');
    var companies = findStat(kb, 'stat-companies');

    var parts = [];
    if (lang === 'en') {
      parts.push('This portfolio belongs to ' + name + '.');
      if (roles.length) {
        parts.push('Naufal works as ' + roles.join(', ') + '.');
      }
      if (desc) parts.push(desc.replace(/\s+/g, ' ').trim() + '.');
      if (years && projects && companies) {
        parts.push('According to the website, he has ' + years.meta.value +
          ' years of experience, ' + projects.meta.value + ' completed projects, ' +
          'and has worked at ' + companies.meta.value + ' companies.');
      }
      parts.push('You can explore his skills, experience, education, and projects in the sections below.');
    } else {
      parts.push('Portfolio ini milik ' + name + '.');
      if (roles.length) {
        parts.push('Naufal berperan sebagai ' + roles.join(', ') + '.');
      }
      if (desc) parts.push(desc.replace(/\s+/g, ' ').trim() + '.');
      if (years && projects && companies) {
        parts.push('Berdasarkan website ini, Naufal memiliki pengalaman ' +
          years.meta.value + ' tahun, ' + projects.meta.value +
          ' project selesai, dan pernah bekerja di ' + companies.meta.value +
          ' perusahaan.');
      }
      parts.push('Section Skills, Journey, Education, dan Works menampilkan detailnya.');
    }
    return withMeta({ text: parts.join(' '), confidence: 0.9 }, 'personal');
  }

  function siteAnswer(kb, lang) {
    var nameEntry = entriesByKind(kb, 'bio')[0];
    var name = nameEntry ? nameEntry.title : 'Naufal Dawam Dzikrilah';
    var roles = (nameEntry && nameEntry.meta && nameEntry.meta.roles) || [];

    if (lang === 'en') {
      return withMeta({
        text: 'This is the interactive portfolio website of ' + name +
          (roles.length ? ', showcasing his work as ' + roles.join(', ') : '') +
          '. It contains sections for his profile, skills, education, journey, featured works, and contact information. It is a static site built with HTML, CSS, and JavaScript, and runs entirely in the browser.',
        confidence: 0.9
      }, 'personal');
    }
    return withMeta({
      text: 'Ini adalah website portfolio interaktif milik ' + name +
        (roles.length ? ', menampilkan perannya sebagai ' + roles.join(', ') : '') +
        '. Terdapat section profil, skill, pendidikan, perjalanan karier, featured works, dan kontak. Website ini dibuat dengan HTML, CSS, dan JavaScript, serta berjalan sepenuhnya di browser.',
      confidence: 0.9
    }, 'personal');
  }

  function skillsSummary(kb, lang) {
    var skills = entriesByKind(kb, 'skill');
    if (!skills.length) return unavailableAnswer(lang);

    var groups = {};
    skills.forEach(function (skill) {
      var group = (skill.meta && skill.meta.group) || 'Skills';
      (groups[group] = groups[group] || []).push(skill);
    });

    var lines = [];
    Object.keys(groups).forEach(function (group) {
      lines.push(group + ': ' + groups[group].map(function (s) {
        return s.title + ' (' + s.meta.level + '%)';
      }).join(', ') + '.');
    });

    var text = (lang === 'en'
      ? "Here is Naufal's tech stack from the website:\n"
      : 'Berikut tech stack Naufal berdasarkan website ini:\n') + lines.join('\n');

    var answer = { text: text, confidence: 0.85 };
    return withMeta(answer, 'skill');
  }

  function skillDetail(entry, lang) {
    var level = entry.meta ? entry.meta.level : 0;
    var group = entry.meta ? entry.meta.group : '';
    var text;
    if (lang === 'en') {
      text = 'Yes - Naufal knows ' + entry.title + ' (' + group +
        ') at ' + level + '%.';
    } else {
      text = 'Bisa! Naufal menguasai ' + entry.title + ' di kategori ' +
        group + ', dengan level ' + level + '%.';
    }
    return withMeta({ text: text, confidence: 0.85 }, 'skill');
  }

  function experienceSummary(kb, lang) {
    var roles = entriesByKind(kb, 'role');
    if (!roles.length) return unavailableAnswer(lang);

    var lines = roles.map(function (entry) {
      var meta = entry.meta || {};
      return '- ' + entry.title + (meta.place ? ' at ' + meta.place : '') +
        (meta.date ? ' (' + meta.date + ')' : '');
    });

    var years = findStat(kb, 'stat-experience');
    var yearsLine = '';
    if (years) {
      yearsLine = (lang === 'en'
        ? '\nOverall, the website states ' + years.meta.value + ' years of experience.'
        : '\nSecara keseluruhan, website menyebutkan pengalaman ' +
          years.meta.value + ' tahun.');
    }

    var text = (lang === 'en'
      ? "Here is Naufal's career journey:\n"
      : 'Berikut perjalanan karier Naufal:\n') + lines.join('\n') + yearsLine;

    return withMeta({ text: text, confidence: 0.85 }, 'experience');
  }

  function roleDetail(entry, lang) {
    var meta = entry.meta || {};
    var text;
    if (lang === 'en') {
      text = entry.title + (meta.place ? ' at ' + meta.place : '') +
        (meta.date ? ' (' + meta.date + ')' : '') +
        '. That is part of the journey listed on this page.';
    } else {
      text = entry.title + (meta.place ? ' di ' + meta.place : '') +
        (meta.date ? ' (' + meta.date + ')' : '') +
        '. Ini tercantum di bagian Journey portfolio.';
    }
    return withMeta({ text: text, confidence: 0.85 }, 'experience');
  }

  function yearsAnswer(kb, lang) {
    var years = findStat(kb, 'stat-experience');
    if (!years) return unavailableAnswer(lang);
    var value = years.meta.value;
    var text = lang === 'en'
      ? 'According to the website, Naufal has ' + value + ' years of professional experience.'
      : 'Berdasarkan website ini, Naufal memiliki pengalaman profesional ' + value + ' tahun.';
    return withMeta({ text: text, confidence: 0.9 }, 'experience');
  }

  function educationSummary(kb, lang) {
    var list = entriesByKind(kb, 'education');
    if (!list.length) return unavailableAnswer(lang);

    var lines = list.map(function (entry) {
      var meta = entry.meta || {};
      var degree = meta.title || entry.title;
      return '- ' + degree + (meta.place ? ' at ' + meta.place : '') +
        (meta.date ? ', ' + meta.date : '');
    });

    var text = (lang === 'en'
      ? "Here is Naufal's educational background:\n"
      : 'Berikut latar belakang pendidikan Naufal:\n') + lines.join('\n');

    return withMeta({ text: text, confidence: 0.85 }, 'education');
  }

  function educationDetail(entry, lang) {
    var meta = entry.meta || {};
    var degree = meta.title || entry.title;
    var text;
    if (lang === 'en') {
      text = degree + (meta.place ? ' at ' + meta.place : '') +
        (meta.date ? ' (' + meta.date + ')' : '') +
        '. This is listed in the Education section.';
    } else {
      text = degree + (meta.place ? ' di ' + meta.place : '') +
        (meta.date ? ' (' + meta.date + ')' : '') +
        '. Informasi ini ada di section Education.';
    }
    return withMeta({ text: text, confidence: 0.85 }, 'education');
  }

  function projectsSummary(kb, lang) {
    var projects = entriesByKind(kb, 'project');
    if (!projects.length) return unavailableAnswer(lang);

    var list = listItems(projects, lang);
    var stat = findStat(kb, 'stat-projects');

    var text;
    if (lang === 'en') {
      text = 'Here are the featured works on this portfolio:\n' + list;
      if (stat) {
        text += '\nThe website also mentions ' + stat.meta.value +
          ' completed projects in total.';
      }
    } else {
      text = 'Berikut featured works yang ada di portfolio ini:\n' + list;
      if (stat) {
        text += '\nWebsite ini juga menyebutkan total ' + stat.meta.value +
          ' project yang sudah selesai.';
      }
    }

    return withMeta({ text: text, confidence: 0.85 }, 'project');
  }

  function projectDetail(entry, lang, asksTech) {
    var parts = [];
    if (lang === 'en') {
      parts.push('\u27A4 ' + entry.title + '. ' + entry.content);
      if (entry.status) parts.push('Status: ' + entry.status + '.');
      if (entry.link) parts.push('Link: ' + entry.link);
      if (asksTech) {
        parts.push('This portfolio does not list the specific technologies used in this project.');
      }
    } else {
      parts.push('\u27A4 ' + entry.title + '. ' + entry.content);
      if (entry.status) parts.push('Status: ' + entry.status + '.');
      if (entry.link) parts.push('Link: ' + entry.link);
      if (asksTech) {
        parts.push('Portfolio ini tidak mencantumkan teknologi spesifik yang dipakai di project tersebut.');
      }
    }
    return withMeta({ text: parts.join(' '), confidence: 0.9 }, 'project');
  }

  function contactSummary(kb, lang) {
    var items = entriesByKind(kb, 'contact');
    var socials = entriesByKind(kb, 'social');

    var map = {};
    items.forEach(function (item) {
      if (item.meta && item.meta.label) map[item.meta.label] = item.meta.value;
    });

    var lines = [];
    if (map['WhatsApp']) lines.push('WhatsApp: ' + map['WhatsApp']);
    if (map['Email']) lines.push('Email: ' + map['Email']);
    if (map['Location']) lines.push('Location: ' + map['Location']);
    socials.forEach(function (s) {
      if (s.link) lines.push(s.title + ': ' + s.link);
    });

    if (!lines.length) return unavailableAnswer(lang);

    var text = (lang === 'en'
      ? 'You can reach Naufal at:\n'
      : 'Kamu bisa menghubungi Naufal melalui:\n') + lines.join('\n');

    return withMeta({ text: text, confidence: 0.9 }, 'contact');
  }

  function unavailableAnswer(lang) {
    var text = lang === 'en'
      ? "Sorry, I couldn't find that information in this portfolio. I can answer about Naufal's profile, skills, experience, education, projects, and contact details."
      : 'Maaf, saya tidak menemukan informasi tersebut di portfolio ini. Saya bisa membantu seputar profil, skill, pengalaman, pendidikan, project, dan kontak Naufal.';
    return { text: text, action: null, label: null, confidence: 0.05 };
  }

  function ageUnavailableAnswer(lang) {
    var text = lang === 'en'
      ? "Naufal's age is not mentioned on this portfolio website. I can tell you about his profile, skills, experience, education, projects, or contact details."
      : 'Umur Naufal tidak dicantumkan di website portfolio ini. Saya bisa bantu soal profil, skill, pengalaman, pendidikan, project, atau kontak Naufal.';
    return { text: text, action: null, label: null, confidence: 0.2 };
  }

  /* ===== QUESTION UNDERSTANDING ===== */

  var TECH_TOKENS = null;

  function techTokens() {
    if (TECH_TOKENS) return TECH_TOKENS;
    TECH_TOKENS = {};
    NaufalKnowledge.canonicalize(
      'technologi tech stack framework language bahasa programming coding ' +
      'skill tools use pake pakai'
    ).forEach(function (t) { TECH_TOKENS[t] = true; });
    return TECH_TOKENS;
  }

  function buildAnswer(result, kb, lang) {
    var top = result.top;
    if (!top) return unavailableAnswer(lang);

    var category = result.category;
    var kind = top.entry.kind;
    var topContSim = result.topContSim || 0;
    var secondContSim = result.secondContSim || 0;
    var isolated = topContSim >= 0.28 &&
      topContSim - secondContSim >= 0.18;
    var asksTech = result.tokens.some(function (t) {
      return techTokens()[t];
    });

    var answer = null;

    switch (kind) {
      case 'site':
        answer = siteAnswer(kb, lang);
        break;
      case 'stat-experience':
        answer = yearsAnswer(kb, lang);
        break;
      case 'cv':
        answer = cvAnswer(lang);
        break;
      default:
        break;
    }

    if (!answer && isolated) {
      if (category === 'project' && kind === 'project') {
        answer = projectDetail(top.entry, lang, asksTech);
      } else if (category === 'skill' && kind === 'skill') {
        answer = skillDetail(top.entry, lang);
      } else if (category === 'experience' && kind === 'role') {
        answer = roleDetail(top.entry, lang);
      } else if (category === 'education' && kind === 'education') {
        answer = educationDetail(top.entry, lang);
      }
    }

    if (!answer) {
      switch (category) {
        case 'personal':
          answer = bioAnswer(kb, lang);
          break;
        case 'project':
          answer = projectsSummary(kb, lang);
          break;
        case 'skill':
          answer = skillsSummary(kb, lang);
          break;
        case 'experience':
          answer = experienceSummary(kb, lang);
          break;
        case 'education':
          answer = educationSummary(kb, lang);
          break;
        case 'contact':
          answer = contactSummary(kb, lang);
          break;
        default:
          answer = unavailableAnswer(lang);
      }
    }

    if (answer && answer.confidence === undefined) answer.confidence = topContSim;
    return answer;
  }

  function cvAnswer(lang) {
    var text = lang === 'en'
      ? "Naufal's CV is available in the About section of this page, ready to download."
      : 'CV Naufal tersedia di section About pada halaman ini dan bisa diunduh.';
    return withMeta({ text: text, confidence: 0.85 }, 'personal');
  }

  async function ask(question) {
    var q = String(question || '').trim();
    if (!q) return unavailableAnswer('id');

    await startInit();
    if (!state.kb) return unavailableAnswer('id');

    if (/(umur|usia|\bage\b|how old)/i.test(q) &&
        !/(pengalaman|experience|kerja|career)/i.test(q)) {
      return ageUnavailableAnswer(detectLanguage(q));
    }

    var lang = detectLanguage(q);
    var small = matchSmalltalk(q, lang);
    if (small) return small;

    var result = NaufalKnowledge.search(q, state.kb);
    if (!result.category || !result.isAvailable) {
      return unavailableAnswer(lang);
    }

    return buildAnswer(result, state.kb, lang);
  }

  /* ===== PUBLIC API ===== */

  window.portfolioAI = {
    init: startInit,
    train: startInit,
    retrain: retrain,
    rebuild: retrain,
    ask: ask,
    get ready() {
      return state.ready;
    },
    get statusText() {
      return state.statusText;
    },
    get status() {
      return state.ready ? 'ready' : 'working';
    },
    set onStatus(fn) {
      onStatus = typeof fn === 'function' ? fn : function () {};
    }
  };

  startInit();
})();
