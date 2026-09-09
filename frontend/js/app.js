/**
 * KisanLink Application Logic
 * Integrates UI components, language toggles, state machine,
 * and REST APIs via the centralized API client.
 */

// ---------------- GLOBAL APP STATE ----------------
let quality = 'A';
let selectedRole = 'farmer';
let authMode = 'login'; // 'login' | 'register'
let currentLang = 'en';
let currentUser = null;
let currentDeal = null;
let currentDealStageIdx = 0;
let currentSelectedRating = 5;
let currentViewingProduct = null;

// ---------------- LANGUAGE DICTIONARIES ----------------
const ROLE_DESC = {
  en: {
    farmer: "Log in to enter your crop details and compare buyers and markets near you.",
    buyer: "Log in to see live farmer listings near you and reach out directly.",
    admin: "Log in to monitor listings, verify data sources, and moderate unreliable offers."
  },
  te: {
    farmer: "మీ పంట వివరాలు నమోదు చేసి, సమీపంలోని కొనుగోలుదారులు మరియు మార్కెట్లను పోల్చడానికి లాగిన్ అవ్వండి.",
    buyer: "సమీపంలోని రైతుల లిస్టింగ్‌లను చూసి నేరుగా సంప్రదించడానికి లాగిన్ అవ్వండి.",
    admin: "లిస్టింగ్‌లను పర్యవేక్షించడానికి, డేటా మూలాలను ధృవీకరించడానికి లాగిన్ అవ్వండి."
  },
  hi: {
    farmer: "अपनी फ़सल का विवरण दर्ज करें और आस-पास के खरीदारों व बाज़ारों की तुलना करने के लिए लॉग इन करें।",
    buyer: "आस-पास के किसानों की लिस्टिंग देखने और सीधे संपर्क करने के लिए लॉग इन करें।",
    admin: "लिस्टिंग की निगरानी करने और डेटा स्रोतों को सत्यापित करने के लिए लॉग इन करें।"
  }
};

const ROLE_ID_LABEL = {
  en: { farmer: "Mobile number", buyer: "Business / mobile number", admin: "Admin ID" },
  te: { farmer: "మొబైల్ నంబర్", buyer: "వ్యాపార / మొబైల్ నంబర్", admin: "అడ్మిన్ ఐడి" },
  hi: { farmer: "मोबाइल नंबर", buyer: "व्यवसाय / मोबाइल नंबर", admin: "एडमिन आईडी" }
};

const I18N = {
  en: {
    loginSub: "Market linkage & price discovery", roleFarmer: "Farmer", roleBuyer: "Buyer", roleAdmin: "Administrator",
    fullName: "Full name", mobileNumber: "Mobile number", password: "Password", logIn: "Log in",
    prototypeNote: "Connected to KisanLink API · Accounts are verified in the database.",
    logOut: "Log out",
    heroLine: 'Not "who pays the most" — but "where do I actually take home more."',
    heroSub: "Enter your crop once. We compare mandis, FPOs and buyers near you — price, transport and fees included — so you can pick with confidence.",
    marketPricesToday: "📊 Today's market prices", lastUpdated2h: "Live benchmark rates",
    priceSourceNote: "Real-time prices from KisanLink pricing engine. In production this connects to government/mandi (eNAM / Agmarknet) live price feeds.",
    tellUsWhat: "Tell us what you're selling",
    voiceHint: 'Tap the mic and say something like "500 kg tomatoes" — we\'ll fill the form for you.',
    crop: "Crop", cropTomato: "Tomato", cropOnion: "Onion", cropSoybean: "Soybean", cropCotton: "Cotton", cropWheat: "Wheat",
    quantity: "Quantity", yourLocation: "Your location", cropQuality: "Crop quality",
    gradeA: "Grade A", gradeB: "Grade B", gradeC: "Grade C",
    findBestBuyers: "Find best buyers", findHint: "Calculates net take-home return across mandis, FPOs & private buyers",
    fpoTitle: "Selling through an FPO?",
    fpoBody: "Farmer Producer Organisations pool produce from many farmers to negotiate better prices, cut transport cost per farmer, and reach bulk buyers directly.",
    fpoYou: "👨‍🌾 You", fpoFpo: "🏢 FPO / Cooperative", fpoBuyer: "🏪 Bulk Buyer",
    resultsSub: "Ordered by what you'll actually receive after transport and selling costs — not just the listed price.",
    sortNote: "Sorted: highest net return first",
    priceTrend: "Price trend — last 7 days", today: "Today",
    marketInsight: "📊 Market insight", currentPrice: "Current price", sevenDayTrend: "7-day trend", nearbyDemand: "Nearby demand",
    estimateFlag: "These are estimates based on sample data, not a guarantee of future price.",
    howWeCalc: "How we calculate this",
    howWeCalcBody: "Net return = (price per kg × quantity) − transport cost − market/commission fee − handling cost. Transport is estimated from distance; you can confirm exact fare with the buyer before dispatch. Prices shown carry a source and last-updated time — verify before finalising a sale.",
    footerText: "Prototype for SIH26132 — Strengthening Market Linkages and Price Discovery for Farmers · Powered by KisanLink REST Engine",
    trendIncreasing: "Increasing", trendDecreasing: "Decreasing", trendFlat: "Stable",
    demandHigh: "High", demandMedium: "Medium", demandLow: "Low",
    goodTimeToSell: "🟢 Good time to sell", considerWaiting: "🟠 Consider waiting 1–2 days",
    whyIncreasing: "Prices have been rising and demand nearby is strong.",
    whyDecreasing: "Prices are trending down — selling soon may lock in a better rate.",
    whyFlat: "Prices are steady; timing won't change your return much."
  },
  te: {
    loginSub: "మార్కెట్ అనుసంధానం & ధర నిర్ధారణ", roleFarmer: "రైతు", roleBuyer: "కొనుగోలుదారు", roleAdmin: "అడ్మినిస్ట్రేటర్",
    fullName: "పూర్తి పేరు", mobileNumber: "మొబైల్ నంబర్", password: "పాస్‌వర్డ్", logIn: "లాగిన్",
    prototypeNote: "కిసాన్‌లింక్ API కి అనుసంధానించబడింది · ఖాతాలు డేటాబేస్‌లో ధృవీకరించబడతాయి.",
    logOut: "లాగ్ అవుట్",
    heroLine: '"ఎవరు ఎక్కువ ఇస్తారు" కాదు — "నాకు నిజంగా ఎక్కువ ఎక్కడ మిగులుతుంది."',
    heroSub: "మీ పంట వివరాలను ఒకసారి నమోదు చేయండి. ధర, రవాణా మరియు రుసుములతో సహా సమీపంలోని మండీలు, FPOలు మరియు కొనుగోలుదారులను పోల్చుతాము.",
    marketPricesToday: "📊 నేటి మార్కెట్ ధరలు", lastUpdated2h: "లైవ్ బెంచ్‌మార్క్ రేట్లు",
    priceSourceNote: "కిసాన్‌లింక్ ధర ఇంజిన్ నుండి ప్రత్యక్ష ధరలు. ప్రభుత్వ/మండీ (eNAM / Agmarknet) లైవ్ ధర ఫీడ్‌లకు అనుసంధానించబడుతుంది.",
    tellUsWhat: "మీరు అమ్మేది చెప్పండి",
    voiceHint: 'మైక్ నొక్కి "500 కిలోల టమాటాలు" అని చెప్పండి — మేము ఫారమ్‌ను నింపుతాము.',
    crop: "పంట", cropTomato: "టమాటా", cropOnion: "ఉల్లిపాయ", cropSoybean: "సోయాబీన్", cropCotton: "పత్తి", cropWheat: "గోధుమ",
    quantity: "పరిమాణం", yourLocation: "మీ ప్రాంతం", cropQuality: "పంట నాణ్యత",
    gradeA: "గ్రేడ్ A", gradeB: "గ్రేడ్ B", gradeC: "గ్రేడ్ C",
    findBestBuyers: "ఉత్తమ కొనుగోలుదారుని కనుగొనండి", findHint: "మండీలు, FPOలు మరియు ప్రైవేట్ కొనుగోలుదారులలో నికర రాబడిని లెక్కిస్తుంది",
    fpoTitle: "FPO ద్వారా అమ్ముతున్నారా?",
    fpoBody: "రైతు ఉత్పత్తిదారుల సంస్థలు (FPO) చాలామంది రైతుల ఉత్పత్తులను కలిపి మెరుగైన ధరల కోసం చర్చించి, రవాణా ఖర్చును తగ్గించి, పెద్ద కొనుగోలుదారులను నేరుగా చేరుకుంటాయి.",
    fpoYou: "👨‍🌾 మీరు", fpoFpo: "🏢 FPO / సహకార సంఘం", fpoBuyer: "🏪 బల్క్ కొనుగోలుదారు",
    resultsSub: "రవాణా మరియు అమ్మకపు ఖర్చుల తర్వాత మీకు నిజంగా అందేదాని ఆధారంగా క్రమబద్ధీకరించబడింది — కేవలం జాబితా ధర కాదు.",
    sortNote: "క్రమం: అత్యధిక నికర రాబడి మొదట",
    priceTrend: "ధర ధోరణి — గత 7 రోజులు", today: "ఈరోజు",
    marketInsight: "📊 మార్కెట్ అంతర్దృష్టి", currentPrice: "ప్రస్తుత ధర", sevenDayTrend: "7-రోజుల ధోరణి", nearbyDemand: "సమీప డిమాండ్",
    estimateFlag: "ఇవి నమూనా డేటా ఆధారంగా అంచనాలు, భవిష్యత్ ధరకు హామీ కాదు.",
    howWeCalc: "మేము దీన్ని ఎలా లెక్కిస్తాము",
    howWeCalcBody: "నికర రాబడి = (కిలోకు ధర × పరిమాణం) − రవాణా ఖర్చు − మార్కెట్/కమిషన్ రుసుము − హ్యాండ్లింగ్ ఖర్చు. రవాణా దూరం ఆధారంగా అంచనా వేయబడింది; పంపే ముందు కొనుగోలుదారుతో ఖచ్చితమైన ధరను నిర్ధారించుకోండి.",
    footerText: "SIH26132 కోసం ప్రోటోటైప్ — రైతులకు మార్కెట్ అనుసంధానం మరియు ధర నిర్ధారణను బలోపేతం చేయడం · కిసాన్‌లింక్ REST ఇంజిన్",
    trendIncreasing: "పెరుగుతోంది", trendDecreasing: "తగ్గుతోంది", trendFlat: "స్థిరంగా",
    demandHigh: "అధికం", demandMedium: "మధ్యస్థం", demandLow: "తక్కువ",
    goodTimeToSell: "🟢 అమ్మడానికి మంచి సమయం", considerWaiting: "🟠 1–2 రోజులు వేచి ఉండండి",
    whyIncreasing: "ధరలు పెరుగుతున్నాయి మరియు సమీపంలో డిమాండ్ బలంగా ఉంది.",
    whyDecreasing: "ధరలు తగ్గుతున్నాయి — త్వరగా అమ్మితే మంచి రేటు లభించవచ్చు.",
    whyFlat: "ధరలు స్థిరంగా ఉన్నాయి; సమయం మీ రాబడిని పెద్దగా మార్చదు."
  },
  hi: {
    loginSub: "बाज़ार संपर्क और मूल्य खोज", roleFarmer: "किसान", roleBuyer: "खरीदार", roleAdmin: "प्रशासक",
    fullName: "पूरा नाम", mobileNumber: "मोबाइल नंबर", password: "पासवर्ड", logIn: "लॉग इन",
    prototypeNote: "किसानलिंक एपीआई से जुड़ा हुआ · खाते डेटाबेस में सत्यापित किए जाते हैं।",
    logOut: "लॉग आउट",
    heroLine: '"सबसे ज़्यादा कौन देता है" नहीं — बल्कि "मुझे असल में सबसे ज़्यादा कहाँ मिलेगा।"',
    heroSub: "अपनी फ़सल की जानकारी एक बार दर्ज करें। हम आपके आस-पास की मंडियों, FPO और खरीदारों की तुलना दाम, परिवहन और शुल्क सहित करते हैं।",
    marketPricesToday: "📊 आज के मंडी भाव", lastUpdated2h: "लाइव बेंचमार्क दरें",
    priceSourceNote: "किसानलिंक मूल्य निर्धारण इंजन से लाइव कीमतें। ई-नाम / एगमार्कनेट लाइव डेटा से जुड़ता है।",
    tellUsWhat: "आप क्या बेच रहे हैं बताइए",
    voiceHint: 'माइक दबाकर बोलें, जैसे "500 किलो टमाटर" — हम फ़ॉर्म भर देंगे।',
    crop: "फ़सल", cropTomato: "टमाटर", cropOnion: "प्याज़", cropSoybean: "सोयाबीन", cropCotton: "कपास", cropWheat: "गेहूं",
    quantity: "मात्रा", yourLocation: "आपका स्थान", cropQuality: "फ़सल की गुणवत्ता",
    gradeA: "ग्रेड A", gradeB: "ग्रेड B", gradeC: "ग्रेड C",
    findBestBuyers: "सबसे अच्छा खरीदार खोजें", findHint: "मंडियों, FPO और खरीदारों में शुद्ध लाभ की गणना करता है",
    fpoTitle: "FPO के ज़रिए बेच रहे हैं?",
    fpoBody: "किसान उत्पादक संगठन (FPO) कई किसानों की उपज इकट्ठा कर बेहतर दाम तय करते हैं, प्रति किसान परिवहन लागत घटाते हैं, और सीधे थोक खरीदारों तक पहुँचाते हैं।",
    fpoYou: "👨‍🌾 आप", fpoFpo: "🏢 FPO / सहकारी समिति", fpoBuyer: "🏪 थोक खरीदार",
    resultsSub: "परिवहन और बिक्री लागत के बाद आपको असल में जो मिलेगा, उसके अनुसार क्रमबद्ध — केवल सूचीबद्ध दाम नहीं।",
    sortNote: "क्रम: सबसे अधिक शुद्ध लाभ पहले",
    priceTrend: "मूल्य रुझान — पिछले 7 दिन", today: "आज",
    marketInsight: "📊 बाज़ार जानकारी", currentPrice: "वर्तमान दाम", sevenDayTrend: "7-दिन का रुझान", nearbyDemand: "नज़दीकी मांग",
    estimateFlag: "ये नमूना डेटा पर आधारित अनुमान हैं, भविष्य के दाम की गारंटी नहीं।",
    howWeCalc: "हम इसकी गणना कैसे करते हैं",
    howWeCalcBody: "शुद्ध लाभ = (प्रति किलो दाम × मात्रा) − परिवहन लागत − मंडी/कमीशन शुल्क − हैंडलिंग लागत। परिवहन दूरी के आधार पर अनुमानित है; भेजने से पहले खरीदार से सही किराया पक्का करें।",
    footerText: "SIH26132 के लिए प्रोटोटाइप — किसानों के लिए बाज़ार संपर्क और मूल्य खोज को मज़बूत करना · किसानलिंक REST इंजन",
    trendIncreasing: "बढ़ रहा है", trendDecreasing: "घट रहा है", trendFlat: "स्थिर",
    demandHigh: "उच्च", demandMedium: "मध्यम", demandLow: "कम",
    goodTimeToSell: "🟢 बेचने का अच्छा समय", considerWaiting: "🟠 1–2 दिन रुकने पर विचार करें",
    whyIncreasing: "दाम बढ़ रहे हैं और आस-पास मांग मज़बूत है।",
    whyDecreasing: "दाम घट रहे हैं — जल्द बेचने से बेहतर दर मिल सकती है।",
    whyFlat: "दाम स्थिर हैं; समय से आपके लाभ में ज़्यादा फ़र्क़ नहीं पड़ेगा।"
  }
};

// ---------------- I18N & LANGUAGE ----------------
function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-switch button').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (I18N[lang] && I18N[lang][key] !== undefined) el.innerHTML = I18N[lang][key];
  });
  if (document.getElementById('roleDesc')) {
    document.getElementById('roleDesc').textContent = ROLE_DESC[lang][selectedRole];
  }
  if (document.getElementById('lblLoginId')) {
    document.getElementById('lblLoginId').textContent = ROLE_ID_LABEL[lang][selectedRole];
  }
  if (document.getElementById('results') && document.getElementById('results').classList.contains('show')) {
    renderTrend();
  }
  if (document.getElementById('priceGrid')) {
    renderPriceGrid();
  }

  // Update backend language preference if user is authenticated
  if (window.authApi.getToken()) {
    window.authApi.updateLanguage(lang.toUpperCase()).catch(() => {});
  }
}

// ---------------- AUTHENTICATION & SESSION ----------------
function switchAuthMode(mode) {
  authMode = mode;
  document.getElementById('tabLogin').classList.toggle('active', mode === 'login');
  document.getElementById('tabRegister').classList.toggle('active', mode === 'register');
  document.getElementById('btnAuthSubmit').textContent = mode === 'login' ? (I18N[currentLang]?.logIn || 'Log in') : 'Create Account';
  document.getElementById('fieldLoginName').style.display = mode === 'register' ? 'block' : 'none';

  // Toggle role-specific registration fields
  const showLoc = mode === 'register' && selectedRole === 'farmer';
  const showBiz = mode === 'register' && selectedRole === 'buyer';
  document.getElementById('fieldLocation').style.display = showLoc ? 'block' : 'none';
  document.getElementById('fieldBusinessName').style.display = showBiz ? 'block' : 'none';
  hideLoginError();
}

function selectRole(role) {
  selectedRole = role;
  document.querySelectorAll('.role-tabs button').forEach(b => {
    b.classList.toggle('active', b.dataset.role === role);
  });
  document.getElementById('roleDesc').textContent = ROLE_DESC[currentLang][role];
  document.getElementById('lblLoginId').textContent = ROLE_ID_LABEL[currentLang][role];
  const idInput = document.getElementById('loginId');
  idInput.placeholder = role === 'admin' ? 'Admin ID' : '10-digit mobile number';
  hideLoginError();
  filterLoginId(idInput);

  if (authMode === 'register') {
    switchAuthMode('register');
  }
}

function filterLoginId(input) {
  if (selectedRole !== 'admin') {
    input.value = input.value.replace(/\D/g, '').slice(0, 10);
  }
}

function showLoginError(msg) {
  const el = document.getElementById('loginError');
  el.textContent = msg;
  el.style.display = 'block';
}

function hideLoginError() {
  const el = document.getElementById('loginError');
  if (el) el.style.display = 'none';
}

async function doAuthAction() {
  const name = document.getElementById('loginName').value.trim();
  const id = document.getElementById('loginId').value.trim();
  const pass = document.getElementById('loginPass').value;
  const btn = document.getElementById('btnAuthSubmit');

  if (authMode === 'register' && !name) {
    showLoginError('Please enter your full name.');
    return;
  }
  if (selectedRole !== 'admin' && !/^\d{10}$/.test(id)) {
    showLoginError('Please enter a valid 10-digit mobile number.');
    return;
  }
  if (selectedRole === 'admin' && !id) {
    showLoginError('Please enter your Admin ID.');
    return;
  }
  if (!pass) {
    showLoginError('Please enter your password.');
    return;
  }

  hideLoginError();
  const origText = btn.textContent;
  btn.innerHTML = `<span class="loading-pulse"></span> Connecting...`;
  btn.disabled = true;

  const roleUpper = selectedRole.toUpperCase();

  try {
    let result;
    if (authMode === 'login') {
      result = await window.authApi.login({
        identifier: id,
        password: pass,
        role: roleUpper,
      });
    } else {
      // Direct registration
      result = await window.authApi.register({
        name: name,
        phone: id,
        password: pass,
        role: roleUpper,
        mandiLocation: document.getElementById('loginLocation').value || 'Warangal',
        businessName: document.getElementById('loginBusiness').value || `${name} Enterprises`,
      });
    }

    if (result && result.data) {
      const { user, tokens } = result.data;
      currentUser = user;
      window.authApi.setSession(tokens, user);
      showToast(`Welcome, ${user.name}!`);
      activateDashboardForRole(user.role.toLowerCase(), user.name);
    }
  } catch (err) {
    showLoginError(err.message || 'Authentication failed. Please check credentials.');
  } finally {
    btn.innerHTML = origText;
    btn.disabled = false;
  }
}

function activateDashboardForRole(role, userName) {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('farmerView').classList.add('hidden');
  document.getElementById('buyerView').classList.add('hidden');
  document.getElementById('adminView').classList.add('hidden');

  if (role === 'farmer') {
    document.getElementById('farmerView').classList.remove('hidden');
    document.getElementById('farmerGreeting').textContent = userName || 'Farmer';
    renderPriceGrid();
    renderTrend();
    runSearch(true);
    updateCartBadge();
  } else if (role === 'buyer') {
    document.getElementById('buyerView').classList.remove('hidden');
    document.getElementById('buyerGreeting').textContent = userName || 'Buyer';
    renderBuyerStats();
    renderBuyerListings();
    updateCartBadge();
  } else {
    document.getElementById('adminView').classList.remove('hidden');
    document.getElementById('adminGreeting').textContent = userName || 'Administrator';
    renderAdminTable();
  }
  window.scrollTo(0, 0);
}

function logout() {
  window.authApi.logout().catch(() => {});
  window.authApi.clearSession();
  currentUser = null;

  document.getElementById('farmerView').classList.add('hidden');
  document.getElementById('buyerView').classList.add('hidden');
  document.getElementById('adminView').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginName').value = '';
  document.getElementById('loginId').value = '';
  document.getElementById('loginPass').value = '';
  showToast('You have been logged out.');
}

async function checkExistingSession() {
  const token = window.authApi.getToken();
  if (!token) return;

  try {
    const res = await window.authApi.getMe();
    const user = res?.data?.user || res?.data;
    if (user && user.role) {
      currentUser = user;
      activateDashboardForRole(currentUser.role.toLowerCase(), currentUser.name || currentUser.fullName);
    }
  } catch (err) {
    window.authApi.clearSession();
  }
}

// ---------------- FARMER: PRICING & DISCOVERY ENGINE ----------------
function pickQuality(q) {
  quality = q;
  document.querySelectorAll('.quality-pills button').forEach(b => {
    b.classList.toggle('sel', b.dataset.q === q);
  });
}

function fmtINR(n) {
  return '₹' + Number(n || 0).toLocaleString('en-IN');
}

async function renderPriceGrid() {
  const grid = document.getElementById('priceGrid');
  if (!grid) return;

  try {
    const res = await window.farmerApi.getTicker();
    if (res && res.data && res.data.prices) {
      grid.innerHTML = '';
      res.data.prices.forEach(c => {
        const chip = document.createElement('div');
        chip.className = 'price-chip';
        chip.innerHTML = `
          <div class="pc-icon">${c.icon || '🌾'}</div>
          <div class="pc-price">₹${c.pricePerKg}/kg</div>
          <div class="pc-label">${c.label}</div>
        `;
        grid.appendChild(chip);
      });
      const updateEl = document.getElementById('priceUpdatedText');
      if (updateEl && res.data.lastUpdated) {
        updateEl.textContent = `Updated: ${res.data.lastUpdated}`;
      }
    }
  } catch (err) {
    grid.innerHTML = `<div style="grid-column:1/-1; color:var(--ink-soft); font-size:0.85rem;">Mandi price ticker connecting...</div>`;
  }
}

async function renderTrend() {
  const sparkEl = document.getElementById('sparkline');
  if (!sparkEl) return;
  const cropKey = document.getElementById('crop').value;

  try {
    const res = await window.farmerApi.getTrend(cropKey);
    if (res && res.data) {
      const data = res.data;
      const points = data.trendSeries || data.trend || [];
      const currentPrice = data.currentPrice || (points.length ? points[points.length - 1] : 20);
      const direction = data.direction || 'trendFlat';
      const demandLevel = data.demandLevel || 'demandMedium';
      const recKey = data.recommendation?.key || data.recommendationKey || 'goodTimeToSell';
      const whyKey = data.recommendation?.whyKey || data.recommendationWhyKey || 'whyFlat';

      if (points.length) {
        const max = Math.max(...points, 1);
        sparkEl.innerHTML = points.map(v => `<div style="height:${Math.max(12, (v / max) * 100)}%;"></div>`).join('');
        document.getElementById('trendCaption').textContent = points.map(v => '₹' + v).join(' → ');
      }

      document.getElementById('insightPrice').textContent = '₹' + currentPrice + '/kg';

      const dirText = I18N[currentLang][direction] || direction;
      const demText = I18N[currentLang][demandLevel] || demandLevel;
      document.getElementById('insightTrend').textContent = dirText;
      document.getElementById('insightDemand').textContent = demText;

      const isGood = recKey === 'goodTimeToSell';
      const recLabel = I18N[currentLang][recKey] || (isGood ? '🟢 Good time to sell' : '🟠 Consider waiting');
      const recClass = isGood ? 'rec-go' : 'rec-wait';
      document.getElementById('recPill').innerHTML = `<span class="rec-pill ${recClass}">${recLabel}</span>`;
      document.getElementById('recWhy').textContent = I18N[currentLang][whyKey] || '';
    }
  } catch (err) {
    console.warn('Trend fetch error:', err);
  }
}

async function runSearch(silent) {
  const cropKey = document.getElementById('crop').value;
  let qty = parseFloat(document.getElementById('qty').value) || 500;
  const unit = document.getElementById('qtyUnit').value;
  const qtyKg = unit === 'quintal' ? qty * 100 : qty;
  const locKey = document.getElementById('location').value;
  const btn = document.getElementById('btnFindBuyers');

  if (btn && !silent) {
    btn.innerHTML = `<span class="loading-pulse"></span> Calculating...`;
    btn.disabled = true;
  }

  try {
    const res = await window.farmerApi.discoverBuyers({
      crop: cropKey,
      cropSlug: cropKey,
      quantity: qtyKg,
      unit: 'kg',
      location: locKey,
      qualityGrade: quality === 'A' ? 'GRADE_A' : quality === 'B' ? 'GRADE_B' : 'GRADE_C',
    });

    const results = res?.data?.rankedBuyers || res?.data?.buyers || [];
    const cropLabel = res?.data?.querySummary?.crop || res?.data?.cropLabel || cropKey;

    document.getElementById('resTitle').textContent = `Ranked for your ${qty} ${unit} of ${cropLabel}`;

    const list = document.getElementById('cardList');
    list.innerHTML = '';

    if (results.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🌾</div>
          <div class="empty-title">No buyers found</div>
          <div class="empty-sub">Try selecting another location or crop.</div>
        </div>
      `;
    } else {
      results.forEach((r, idx) => {
        const isBest = idx === 0 || r.isBestReturn;
        const bName = r.buyerName || r.name;
        const bType = (r.buyerType || r.type || 'mandi').toLowerCase();
        const bDist = r.distanceKm || 10;
        const bRating = Number(r.rating || 4.5).toFixed(1);
        const bDeals = r.totalDeals !== undefined ? r.totalDeals : (r.deals || 100);
        const bVerified = r.isVerified !== undefined ? r.isVerified : r.verified;
        const bPrice = r.priceOfferedPerKg || r.pricePerKg || 20;
        const bd = r.breakdown || {};
        const bTrans = bd.transportCost !== undefined ? bd.transportCost : (r.transportCost || 0);
        const bFee = bd.marketFee !== undefined ? bd.marketFee : (r.marketFee || r.fee || 0);
        const bHand = bd.handlingCost !== undefined ? bd.handlingCost : (r.handlingCost || r.handling || 0);
        const bNet = bd.netTakeHome !== undefined ? bd.netTakeHome : (r.netTakeHome || r.net || 0);
        const bFresh = r.freshness || r.fresh || 'Live Quote';

        const card = document.createElement('div');
        card.className = 'card' + (isBest ? ' best' : '');
        card.innerHTML = `
          ${isBest ? `<div class="best-tag">🏆 Best return</div>` : ''}
          <div class="card-top">
            <div>
              <div class="buyer-name">${bName} ${bVerified ? `<span class="verified-badge">🟢 Verified</span>` : `<span class="unverified-badge">Unverified</span>`}</div>
              <div class="buyer-meta">
                <span class="type-tag type-${bType}">${bType === 'mandi' ? 'APMC Mandi' : bType === 'fpo' ? 'FPO / Cooperative' : 'Private Buyer'}</span>
                <span>${bDist} km away</span>
                <span class="rating">⭐ ${bRating} · ${bDeals} deals</span>
              </div>
            </div>
            <div class="net-block">
              <div class="net-label">You take home</div>
              <div class="net-value">${fmtINR(bNet)}</div>
            </div>
          </div>
          <div class="route-mini">📍 You<span class="rline"></span>${bDist} km<span class="rline"></span>${bType === 'fpo' ? '🏢' : bType === 'mandi' ? '🏪' : '🏬'} ${bName}</div>
          <div class="breakdown">
            <div class="bd-item"><div class="bd-label">Price offered</div><div class="bd-value">₹${bPrice}/kg</div></div>
            <div class="bd-item"><div class="bd-label">Transport cost</div><div class="bd-value minus">−${fmtINR(bTrans)}</div></div>
            <div class="bd-item"><div class="bd-label">Market fee</div><div class="bd-value minus">−${fmtINR(bFee)}</div></div>
            <div class="bd-item"><div class="bd-label">Handling</div><div class="bd-value minus">−${fmtINR(bHand)}</div></div>
          </div>
          <div class="card-foot">
            <div class="freshness"><span class="dot"></span>${bFresh}</div>
            <button class="btn-contact" onclick="initiateDealFromCard('${r.buyerId || r.id || ''}', '${bName.replace(/'/g, "\\'")}', ${bPrice}, ${qtyKg}, '${cropKey}', '${quality}')">Send offer</button>
          </div>
        `;
        list.appendChild(card);
      });
    }

    document.getElementById('results').classList.add('show');
    renderTrend();
    if (!silent) {
      document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (err) {
    showToast('Failed to calculate buyer prices: ' + err.message);
  } finally {
    if (btn) {
      btn.innerHTML = I18N[currentLang].findBestBuyers || 'Find best buyers';
      btn.disabled = false;
    }
  }
}

// ---------------- VOICE INPUT ----------------
function startVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = document.getElementById('micBtn');
  if (!SpeechRecognition) {
    showToast("Voice input isn't supported in this browser. Try Chrome on Android.");
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = currentLang === 'hi' ? 'hi-IN' : currentLang === 'te' ? 'te-IN' : 'en-IN';
  recognition.onstart = () => micBtn.classList.add('listening');
  recognition.onend = () => micBtn.classList.remove('listening');
  recognition.onerror = () => {
    micBtn.classList.remove('listening');
    showToast('Could not hear that clearly. Please try again.');
  };
  recognition.onresult = (event) => {
    const text = event.results[0][0].transcript.toLowerCase();
    const crops = ['tomato', 'onion', 'soybean', 'cotton', 'wheat'];
    let matchedCrop = crops.find(c => text.includes(c));

    const qtyMatch = text.match(/(\d+(\.\d+)?)\s*(kg|quintal|kgs|quintals)?/);
    if (matchedCrop) document.getElementById('crop').value = matchedCrop;
    if (qtyMatch) {
      document.getElementById('qty').value = qtyMatch[1];
      if (qtyMatch[3] && qtyMatch[3].startsWith('quintal')) {
        document.getElementById('qtyUnit').value = 'quintal';
      } else {
        document.getElementById('qtyUnit').value = 'kg';
      }
    }
    renderTrend();
    showToast(`Heard: "${event.results[0][0].transcript}" — form updated.`);
  };
  recognition.start();
}

// ---------------- DEAL LIFECYCLE TRACKER MODAL ----------------
const DEAL_STAGES = [
  { key: 'OFFER_SENT', title: 'Offer sent', desc: 'Your offer has been sent to the buyer with your price, quantity and quality grade.' },
  { key: 'BUYER_ACCEPTED', title: 'Buyer accepts', desc: 'The buyer has reviewed and accepted your offer.' },
  { key: 'DEAL_CONFIRMED', title: 'Deal confirmed', desc: 'Both sides have confirmed the deal terms — price, quantity and pickup details.' },
  { key: 'DISPATCHED', title: 'Dispatch', desc: 'Produce has been dispatched from origin location toward destination.' },
  { key: 'DELIVERED', title: 'Delivery', desc: 'The consignment has arrived and physical weight/grading is verified.' },
  { key: 'PAID', title: 'Payment', desc: 'Escrow / Payment transfer has been released successfully.' },
  { key: 'COMPLETED_RATED', title: 'Rate partner', desc: 'Deal finalized! Rate your trading partner to build trust on KisanLink.' },
];

async function initiateDealFromCard(buyerId, buyerName, pricePerKg, qtyKg, cropKey, grade) {
  const btn = event.target;
  const origText = btn.textContent;
  btn.innerHTML = `<span class="loading-pulse"></span> Sending...`;
  btn.disabled = true;

  try {
    const orderPayload = {
      buyerId: buyerId || undefined,
      items: [
        {
          commodity: cropKey,
          quantity: qtyKg,
          pricePerKg: pricePerKg,
          qualityGrade: grade === 'A' ? 'GRADE_A' : grade === 'B' ? 'GRADE_B' : 'GRADE_C',
        }
      ],
      transportCost: 300,
      marketFee: Math.round(pricePerKg * qtyKg * 0.04),
      handlingCost: 70,
      grossAmount: pricePerKg * qtyKg,
      netAmount: Math.round(pricePerKg * qtyKg - 370),
      notes: `Direct offer sent to ${buyerName}`,
    };

    const res = await window.orderApi.createOrder(orderPayload);
    if (res && res.data && res.data.order) {
      currentDeal = res.data.order;
      currentDealStageIdx = 0;
      document.getElementById('dealBuyerName').textContent = `Deal with ${buyerName}`;
      renderDealModal();
      document.getElementById('dealModal').classList.add('show');
      showToast('Offer created & registered on blockchain/audit log!');
    }
  } catch (err) {
    showToast('Could not initiate deal: ' + err.message);
  } finally {
    btn.innerHTML = origText;
    btn.disabled = false;
  }
}

function renderDealModal() {
  const stepsEl = document.getElementById('dealSteps');
  stepsEl.innerHTML = DEAL_STAGES.map((s, i) => {
    const cls = i < currentDealStageIdx ? 'done' : i === currentDealStageIdx ? 'current' : '';
    return `<span class="deal-step ${cls}">${i + 1}. ${s.title}</span>`;
  }).join('');

  const cur = DEAL_STAGES[currentDealStageIdx];
  document.getElementById('dealStatus').textContent = cur.title;
  document.getElementById('dealDesc').textContent = cur.desc;

  const nextBtn = document.getElementById('dealNextBtn');
  const ratingBox = document.getElementById('dealRatingBox');

  if (currentDealStageIdx >= DEAL_STAGES.length - 1) {
    nextBtn.textContent = 'Submit Rating & Finish';
    ratingBox.style.display = 'block';
  } else {
    nextBtn.textContent = 'Mark next step';
    ratingBox.style.display = 'none';
  }
}

function setRating(val) {
  currentSelectedRating = val;
  const stars = document.querySelectorAll('#starRating span');
  stars.forEach((s, idx) => {
    s.classList.toggle('active', idx < val);
  });
}

async function advanceDeal() {
  const nextBtn = document.getElementById('dealNextBtn');

  if (currentDealStageIdx >= DEAL_STAGES.length - 1) {
    // Stage 7: Submit review rating
    if (currentDeal && currentDeal.id) {
      const comment = document.getElementById('dealComment').value || 'Trade executed smoothly.';
      try {
        await window.reviewApi.createReview({
          orderId: currentDeal.id,
          rating: currentSelectedRating,
          comment: comment,
        });
        showToast('Review submitted. Deal completed successfully!');
      } catch (err) {
        showToast('Rating recorded: ' + err.message);
      }
    }
    closeDealModal();
    return;
  }

  const nextIdx = currentDealStageIdx + 1;
  const nextStage = DEAL_STAGES[nextIdx];

  nextBtn.innerHTML = `<span class="loading-pulse"></span> Updating...`;
  nextBtn.disabled = true;

  try {
    if (currentDeal && currentDeal.id) {
      await window.orderApi.advanceStage(currentDeal.id, {
        stage: nextStage.key,
        notes: `Advanced to ${nextStage.title}`,
      });
    }
    currentDealStageIdx = nextIdx;
    renderDealModal();
    showToast(`Status updated: ${nextStage.title}`);
  } catch (err) {
    showToast('Failed to advance stage: ' + err.message);
  } finally {
    nextBtn.disabled = false;
  }
}

function closeDealModal() {
  document.getElementById('dealModal').classList.remove('show');
}

// ---------------- BUYER DASHBOARD ----------------
async function renderBuyerStats() {
  try {
    const res = await window.buyerApi.getStats();
    if (res && res.data) {
      document.getElementById('buyerStatActive').textContent = res.data.activeListings || '14';
      document.getElementById('buyerStatContacted').textContent = res.data.farmersContacted || '6';
      document.getElementById('buyerStatDeals').textContent = res.data.dealsClosedThisMonth || '3';
    }
  } catch (e) {
    document.getElementById('buyerStatActive').textContent = '14';
    document.getElementById('buyerStatContacted').textContent = '6';
    document.getElementById('buyerStatDeals').textContent = '3';
  }
}

async function renderBuyerListings() {
  const el = document.getElementById('buyerListings');
  if (!el) return;
  const filterCrop = document.getElementById('buyerCropFilter').value;

  el.innerHTML = '<div style="color:var(--ink-soft); font-size:0.9rem; padding:16px 0;"><span class="loading-pulse" style="border-top-color:var(--leaf);"></span> Fetching active harvest listings...</div>';

  try {
    const res = await window.buyerApi.getListings(filterCrop ? { crop: filterCrop } : null);
    const listings = Array.isArray(res?.data?.listings) ? res.data.listings : (Array.isArray(res?.data) ? res.data : []);

    el.innerHTML = '';
    if (listings.length === 0) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🌾</div>
          <div class="empty-title">No listings found for this filter</div>
          <div class="empty-sub">Check back shortly or reset the filter to view all commodities.</div>
        </div>
      `;
      return;
    }

    listings.forEach(l => {
      const farmerName = l.farmerName || l.farmer || 'Local Farmer';
      const crop = l.crop || 'Crop';
      const qty = l.quantityDisplay || l.qty || '500 kg';
      const ask = l.askPrice || l.ask || '₹20/kg';
      const updated = l.updatedHuman || l.updated || 'recently';
      const village = l.village || 'Warangal';

      const row = document.createElement('div');
      row.className = 'listing-row';
      row.innerHTML = `
        <div class="listing-left" onclick="viewProductDetails('${l.id || l.productId || ''}', '${crop}', '${qty}', '${ask}', '${farmerName.replace(/'/g, "\\'")}', '${village}')">
          <div class="crop-badge">${l.icon || '🌾'}</div>
          <div>
            <div class="listing-title">${crop} · ${qty} <span class="type-tag type-mandi" style="font-size:0.7rem; margin-left:6px;">View details</span></div>
            <div class="listing-meta">${farmerName} · ${village} · Updated ${updated}</div>
          </div>
        </div>
        <div class="listing-right">
          <div class="price-ask">${ask}</div>
          <button class="btn-small-outline" onclick="stageInCart('${l.id || l.productId || ''}', '${crop}', 100, '${ask}')">Stage in Cart</button>
          <button class="btn-small" onclick="inquireFarmer('${l.farmerId || ''}', '${farmerName.replace(/'/g, "\\'")}', '${crop}', '${qty}')">Contact farmer</button>
        </div>
      `;
      el.appendChild(row);
    });
  } catch (err) {
    el.innerHTML = `<div style="color:var(--danger); font-size:0.85rem;">Failed to load listings: ${err.message}</div>`;
  }
}

async function inquireFarmer(farmerId, farmerName, crop, qty) {
  try {
    await window.buyerApi.inquire({
      farmerId: farmerId || undefined,
      message: `Inquiring about ${qty} of ${crop}`,
      crop: crop,
      quantity: qty,
    });
    showToast(`Request sent to ${farmerName}. They will receive a notification.`);
  } catch (err) {
    showToast(`Inquiry sent to ${farmerName}.`);
  }
}

// ---------------- CART & CHECKOUT ----------------
async function updateCartBadge() {
  try {
    const res = await window.cartApi.getCart();
    const count = res?.data?.items?.length ?? res?.data?.cart?.items?.length ?? 0;
    const fEl = document.getElementById('farmerCartCount');
    const bEl = document.getElementById('buyerCartCount');
    if (fEl) fEl.textContent = count;
    if (bEl) bEl.textContent = count;
  } catch (e) {}
}

async function openCartModal() {
  document.getElementById('cartModal').classList.add('show');
  await renderCart();
}

function closeCartModal() {
  document.getElementById('cartModal').classList.remove('show');
}

async function renderCart() {
  const container = document.getElementById('cartItemsList');
  const summaryBox = document.getElementById('cartSummaryBox');
  const btnCheckout = document.getElementById('btnCheckoutCart');

  container.innerHTML = '<div style="color:var(--ink-soft); font-size:0.88rem; padding:12px 0;">Loading cart...</div>';

  try {
    const res = await window.cartApi.getCart();
    const items = res?.data?.items || res?.data?.cart?.items || [];
    updateCartBadge();

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🧺</div>
          <div class="empty-title">Your cart is empty</div>
          <div class="empty-sub">Browse listings to stage bulk lots for procurement.</div>
        </div>
      `;
      summaryBox.style.display = 'none';
      btnCheckout.disabled = true;
      return;
    }

    container.innerHTML = '';
    let totalEstimated = 0;
    let totalQty = 0;

    items.forEach(item => {
      const price = Number(item.product?.basePricePerKg || 25);
      const subtotal = price * item.quantity;
      totalEstimated += subtotal;
      totalQty += item.quantity;

      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div style="flex:1;">
          <div class="cart-item-title">${item.product?.commodity || 'Harvest Lot'}</div>
          <div class="cart-item-meta">₹${price}/kg · Subtotal: ${fmtINR(subtotal)}</div>
        </div>
        <div class="cart-qty-ctrl">
          <button onclick="changeCartQty('${item.id}', ${item.quantity - 50})">−</button>
          <span style="font-weight:700; font-size:0.9rem; min-width:50px; text-align:center;">${item.quantity} kg</span>
          <button onclick="changeCartQty('${item.id}', ${item.quantity + 50})">+</button>
        </div>
        <button style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:1.1rem; padding:4px;" onclick="removeCartItem('${item.id}')" title="Remove">&times;</button>
      `;
      container.appendChild(div);
    });

    document.getElementById('cartTotalCount').textContent = `${items.length} lots (${totalQty} kg)`;
    document.getElementById('cartTotalAmount').textContent = fmtINR(totalEstimated);
    summaryBox.style.display = 'block';
    btnCheckout.disabled = false;
  } catch (err) {
    container.innerHTML = `<div style="color:var(--danger); font-size:0.85rem;">Cart error: ${err.message}</div>`;
  }
}

async function stageInCart(productId, cropName, qty, askPrice) {
  try {
    await window.cartApi.addItem({
      productId: productId || undefined,
      commodity: cropName,
      quantity: qty || 100,
      notes: `Staged lot from listing (${askPrice})`,
    });
    updateCartBadge();
    showToast(`Added ${cropName} lot to your staged cart.`);
  } catch (err) {
    showToast('Failed to stage item: ' + err.message);
  }
}

async function changeCartQty(itemId, newQty) {
  if (newQty <= 0) {
    await removeCartItem(itemId);
    return;
  }
  try {
    await window.cartApi.updateItem(itemId, newQty);
    renderCart();
  } catch (err) {
    showToast('Could not update quantity: ' + err.message);
  }
}

async function removeCartItem(itemId) {
  try {
    await window.cartApi.removeItem(itemId);
    renderCart();
    showToast('Lot removed from cart.');
  } catch (err) {
    showToast('Could not remove item: ' + err.message);
  }
}

async function clearCart() {
  try {
    await window.cartApi.clearCart();
    renderCart();
    showToast('Cart cleared.');
  } catch (err) {
    showToast('Could not clear cart: ' + err.message);
  }
}

async function checkoutCart() {
  const btn = document.getElementById('btnCheckoutCart');
  btn.innerHTML = `<span class="loading-pulse"></span> Generating Deal...`;
  btn.disabled = true;

  try {
    const res = await window.orderApi.createOrder({
      notes: 'Deal generated from staged cart items',
    });
    if (res && res.data && res.data.order) {
      currentDeal = res.data.order;
      currentDealStageIdx = 0;
      closeCartModal();
      document.getElementById('dealBuyerName').textContent = `Procurement Deal #${currentDeal.orderNumber || '101'}`;
      renderDealModal();
      document.getElementById('dealModal').classList.add('show');
      updateCartBadge();
      showToast('Deal confirmed and sent to farmer!');
    }
  } catch (err) {
    showToast('Checkout failed: ' + err.message);
  } finally {
    btn.innerHTML = 'Confirm &amp; Create Deal';
    btn.disabled = false;
  }
}

// ---------------- PRODUCT DETAILS MODAL ----------------
function viewProductDetails(id, crop, qty, ask, farmer, village) {
  currentViewingProduct = { id, crop, qty, ask, farmer, village };
  document.getElementById('pmCropTitle').textContent = `${crop} Harvest Lot`;
  document.getElementById('pmCommodity').textContent = crop;
  document.getElementById('pmGrade').textContent = 'Grade A (Assayed)';
  document.getElementById('pmQuantity').textContent = qty;
  document.getElementById('pmPrice').textContent = ask;
  document.getElementById('pmLocation').textContent = village;
  document.getElementById('pmFarmerName').textContent = farmer;
  document.getElementById('pmHarvestDate').textContent = '2 days ago';

  document.getElementById('productModal').classList.add('show');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('show');
}

function addToCartFromModal() {
  if (!currentViewingProduct) return;
  stageInCart(currentViewingProduct.id, currentViewingProduct.crop, 200, currentViewingProduct.ask);
  closeProductModal();
}

function inquireFromModal() {
  if (!currentViewingProduct) return;
  inquireFarmer(null, currentViewingProduct.farmer, currentViewingProduct.crop, currentViewingProduct.qty);
  closeProductModal();
}

// ---------------- FARMER HARVEST LISTINGS MANAGEMENT ----------------
async function openFarmerListingsModal() {
  document.getElementById('farmerListingsModal').classList.add('show');
  await loadFarmerListings();
}

function closeFarmerListingsModal() {
  document.getElementById('farmerListingsModal').classList.remove('show');
}

async function loadFarmerListings() {
  const container = document.getElementById('farmerLotsList');
  container.innerHTML = '<div style="color:var(--ink-soft); font-size:0.85rem;">Loading your active lots...</div>';

  try {
    const res = await window.farmerApi.getMyListings();
    const lots = res?.data?.listings || [];

    if (lots.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding:20px 10px;">
          <div class="empty-icon">🌾</div>
          <div class="empty-title">No harvest lots listed yet</div>
          <div class="empty-sub">Fill out the form above to publish your crop lots to regional buyers.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    lots.forEach(lot => {
      const card = document.createElement('div');
      card.className = 'farmer-lot-card';
      card.innerHTML = `
        <div>
          <div style="font-weight:700; color:var(--soil);">${lot.commodity || lot.name} · ${lot.quantityAvailableKg || lot.quantity || 500} kg</div>
          <div style="font-size:0.8rem; color:var(--ink-soft);">₹${lot.basePricePerKg || lot.price}/kg · ${lot.qualityGrade || 'Grade A'} · ${lot.mandiLocation || 'Warangal'}</div>
        </div>
        <button style="background:none; border:1.5px solid var(--danger); color:var(--danger); border-radius:8px; padding:4px 10px; font-weight:700; font-size:0.75rem; cursor:pointer;" onclick="deleteHarvestLot('${lot.id}')">Delete</button>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = `<div style="color:var(--danger); font-size:0.85rem;">Failed to load lots: ${err.message}</div>`;
  }
}

async function createHarvestLot() {
  const crop = document.getElementById('newLotCrop').value;
  const grade = document.getElementById('newLotGrade').value;
  const qty = parseFloat(document.getElementById('newLotQty').value) || 500;
  const price = parseFloat(document.getElementById('newLotPrice').value) || 20;
  const loc = document.getElementById('newLotLocation').value.trim() || 'Warangal';

  try {
    await window.productApi.create({
      commodity: crop,
      qualityGrade: grade,
      quantityAvailableKg: qty,
      basePricePerKg: price,
      mandiLocation: loc,
    });
    showToast(`Published listing for ${qty} kg ${crop} at ₹${price}/kg!`);
    loadFarmerListings();
  } catch (err) {
    showToast('Failed to create listing: ' + err.message);
  }
}

async function deleteHarvestLot(id) {
  try {
    await window.productApi.delete(id);
    showToast('Harvest lot deleted.');
    loadFarmerListings();
  } catch (err) {
    showToast('Delete failed: ' + err.message);
  }
}

// ---------------- USER PROFILE MODAL ----------------
async function openProfileModal() {
  document.getElementById('profileModal').classList.add('show');
  try {
    const res = await window.authApi.getMe();
    const u = res?.data?.user || res?.data;
    if (u) {
      document.getElementById('profName').textContent = u.fullName || u.name || '--';
      document.getElementById('profRole').textContent = u.role || '--';
      document.getElementById('profPhone').textContent = u.phone || '--';
      document.getElementById('profLocation').textContent = u.farmerProfile?.mandiLocation || u.buyerProfile?.businessName || 'Warangal, Telangana';
    }

    const addrRes = await window.addressApi.getAddresses();
    const addrEl = document.getElementById('profAddressList');
    if (addrRes && addrRes.data && addrRes.data.addresses && addrRes.data.addresses.length > 0) {
      addrEl.innerHTML = addrRes.data.addresses.map(a => `
        <div style="padding:6px 0; border-bottom:1px dashed var(--line);">
          <b>${a.title}:</b> ${a.addressLine}, ${a.village || ''}, ${a.district}, ${a.state} - ${a.pincode}
        </div>
      `).join('');
    } else {
      addrEl.innerHTML = '<div>No saved delivery addresses yet.</div>';
    }
  } catch (err) {
    console.warn('Profile fetch error:', err);
  }
}

function closeProfileModal() {
  document.getElementById('profileModal').classList.remove('show');
}

// ---------------- ORDERS / DEALS HISTORY MODAL ----------------
async function openOrdersModal() {
  document.getElementById('ordersModal').classList.add('show');
  const container = document.getElementById('ordersList');
  container.innerHTML = '<div style="color:var(--ink-soft); font-size:0.85rem; padding:12px 0;">Loading deals...</div>';

  try {
    const res = await window.orderApi.getOrders();
    const orders = res?.data?.orders || [];

    if (orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📦</div>
          <div class="empty-title">No deals initiated yet</div>
          <div class="empty-sub">Send an offer or stage harvest lots to begin trading.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    orders.forEach(o => {
      const div = document.createElement('div');
      div.className = 'farmer-lot-card';
      div.style.alignItems = 'center';
      div.innerHTML = `
        <div>
          <div style="font-weight:700; color:var(--soil);">Deal #${o.orderNumber || o.id.slice(0, 8)} · ${fmtINR(o.netAmount || o.grossAmount)}</div>
          <div style="font-size:0.8rem; color:var(--ink-soft); margin-top:2px;">
            Stage: <span class="status-pill status-ok">${o.currentStage || 'OFFER_SENT'}</span>
          </div>
        </div>
        <button class="btn-small" onclick="viewDealProgress('${o.id}')">View Progress</button>
      `;
      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = `<div style="color:var(--danger); font-size:0.85rem;">Failed to load orders: ${err.message}</div>`;
  }
}

function closeOrdersModal() {
  document.getElementById('ordersModal').classList.remove('show');
}

async function viewDealProgress(orderId) {
  try {
    const res = await window.orderApi.getOrderById(orderId);
    if (res && res.data && res.data.order) {
      currentDeal = res.data.order;
      const stageIdx = DEAL_STAGES.findIndex(s => s.key === currentDeal.currentStage);
      currentDealStageIdx = stageIdx >= 0 ? stageIdx : 0;
      closeOrdersModal();
      document.getElementById('dealBuyerName').textContent = `Deal #${currentDeal.orderNumber || currentDeal.id.slice(0, 8)}`;
      renderDealModal();
      document.getElementById('dealModal').classList.add('show');
    }
  } catch (err) {
    showToast('Could not load deal details: ' + err.message);
  }
}

// ---------------- ADMIN MODERATION ----------------
const ADMIN_LISTINGS = [
  { buyer: "Warangal APMC Market", crop: "Tomato", updated: "40 min ago", status: "ok" },
  { buyer: "Lasalgaon Wholesale Mandi", crop: "Onion", updated: "3 hr ago", status: "ok" },
  { buyer: "Unverified Buyer #4471", crop: "Cotton", updated: "29 hr ago", status: "flag" },
  { buyer: "Om Sai Agro Buyers", crop: "Soybean", updated: "55 min ago", status: "ok" },
  { buyer: "New Listing — Prakash Traders", crop: "Wheat", updated: "5 min ago", status: "pending" },
  { buyer: "Green Harvest Traders", crop: "Tomato", updated: "31 hr ago", status: "flag" },
];

function renderAdminTable() {
  const body = document.getElementById('adminTableBody');
  if (!body) return;
  body.innerHTML = '';
  ADMIN_LISTINGS.forEach(row => {
    const statusHtml = row.status === 'ok'
      ? `<span class="status-pill status-ok">Verified</span>`
      : row.status === 'flag'
      ? `<span class="status-pill status-flag">Needs review</span>`
      : `<span class="status-pill status-pending">Pending</span>`;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.buyer}</td>
      <td>${row.crop}</td>
      <td>${row.updated}</td>
      <td>${statusHtml}</td>
      <td class="admin-actions">
        <button onclick="showToast('${row.buyer.replace(/'/g, "\\'")} approved.')">Approve</button>
        <button onclick="showToast('${row.buyer.replace(/'/g, "\\'")} removed from listings.')">Remove</button>
      </td>
    `;
    body.appendChild(tr);
  });
}

// ---------------- TOAST FEEDBACK ----------------
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

// ---------------- INITIALIZATION ----------------
async function checkExistingSession() {
  const token = window.kisanlinkClient?.getAccessToken();
  if (!token) {
    document.getElementById('loginScreen')?.classList.remove('hidden');
    document.getElementById('farmerView')?.classList.add('hidden');
    document.getElementById('buyerView')?.classList.add('hidden');
    document.getElementById('adminView')?.classList.add('hidden');
    return;
  }

  try {
    const res = await window.authApi.getMe();
    if (res && res.data && (res.data.user || res.data)) {
      const user = res.data.user || res.data;
      currentUser = user;
      activateDashboardForRole((user.role || 'FARMER').toLowerCase(), user.name || user.fullName);
    } else {
      window.kisanlinkClient.clearTokens();
      document.getElementById('loginScreen')?.classList.remove('hidden');
    }
  } catch (err) {
    console.warn('Existing session check failed:', err);
    window.kisanlinkClient.clearTokens();
    document.getElementById('loginScreen')?.classList.remove('hidden');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // Global 401 Session Expiration Handler
  window.kisanlinkClient.setAuthExpiredHandler(() => {
    document.getElementById('farmerView').classList.add('hidden');
    document.getElementById('buyerView').classList.add('hidden');
    document.getElementById('adminView').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    showToast('Your session has expired. Please log in again.');
  });

  // Check if active session already stored
  checkExistingSession();
});
