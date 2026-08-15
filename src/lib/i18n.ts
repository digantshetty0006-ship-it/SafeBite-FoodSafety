export type Lang = "en" | "hi" | "mr";

export const LANGS: Lang[] = ["en", "hi", "mr"];

export const LANG_NAMES: Record<Lang, string> = {
  en: "English",
  hi: "हिन्दी",
  mr: "मराठी",
};

const IDX: Record<Lang, number> = { en: 0, hi: 1, mr: 2 };

const dict: Record<string, [string, string, string]> = {
  // ---- common ----
  "common.backHome": ["Back to home", "होम पेज पर वापस जाएँ", "मुख्यपृष्ठावर परत जा"],
  "common.signOut": ["Sign out", "साइन आउट", "साइन आउट"],
  "common.menu": ["Menu", "मेनू", "मेनू"],
  "common.loading": ["Loading…", "लोड हो रहा है…", "लोड होत आहे…"],
  "common.viewAll": ["View all", "सभी देखें", "सर्व पहा"],
  "common.tryDemo": ["Try demo", "डेमो आज़माएँ", "डेमो वापरून पहा"],

  // ---- public header / footer ----
  "nav.home": ["Home", "होम", "मुख्यपृष्ठ"],
  "nav.news": ["News", "समाचार", "बातम्या"],
  "nav.leadership": ["Leadership", "नेतृत्व", "नेतृत्व"],
  "nav.guide": ["Judges' Guide", "निर्णायक मार्गदर्शिका", "निर्णायक मार्गदर्शक"],
  "header.tagline": ["Know what's safe to eat", "जानिए क्या खाना सुरक्षित है", "काय खाणे सुरक्षित आहे ते जाणून घ्या"],
  "header.signIn": ["Sign in", "साइन इन", "साइन इन"],
  "theme.label": ["Display", "डिस्प्ले", "प्रदर्शन"],
  "theme.light": ["Light", "लाइट", "लाइट"],
  "theme.dark": ["Dark", "डार्क", "डार्क"],
  "theme.system": ["System", "सिस्टम", "सिस्टम"],
  "footer.quickLinks": ["Quick links", "त्वरित लिंक", "त्वरित दुवे"],
  "footer.helpline": ["Food safety helpline", "खाद्य सुरक्षा हेल्पलाइन", "अन्न सुरक्षा हेल्पलाइन"],
  "footer.copyright": [
    "© 2026 SafeBite · Hackathon prototype built for FSSAI & Maharashtra FDA",
    "© 2026 SafeBite · FSSAI और महाराष्ट्र FDA के लिए हैकाथॉन प्रोटोटाइप",
    "© 2026 SafeBite · FSSAI आणि महाराष्ट्र FDA साठी हैकाथॉन प्रोटोटाइप",
  ],
  "news.points": ["Key points", "मुख्य बिंदु", "मुख्य मुद्दे"],
  "news.readMore": ["Read full article", "पूरा लेख पढ़ें", "संपूर्ण लेख वाचा"],

  // ---- roles ----
  "role.officer": ["Food Safety Officer", "खाद्य सुरक्षा अधिकारी", "अन्न सुरक्षा अधिकारी"],
  "role.citizen": ["Citizen", "नागरिक", "नागरिक"],
  "role.owner": ["Business Owner", "व्यवसाय स्वामी", "व्यवसाय मालक"],
  "role.officerD": [
    "Command center with risk-ranked businesses, heat maps, scheduling and analytics, plus your prioritised inspection queue, checklists, photo evidence and AI reports.",
    "जोखिम-क्रमित व्यवसायों, हीट मैप, अनुसूची और एनालिटिक्स वाला कमांड सेंटर, साथ में प्राथमिकता वाली निरीक्षण कतार, चेकलिस्ट, फोटो साक्ष्य और AI रिपोर्ट।",
    "जोखीम-क्रमित व्यवसाय, हीट नकाशे, वेळापत्रक आणि विश्लेषण असलेले कमांड सेंटर, तसेच प्राधान्यक्रमित तपासणी यादी, चेकलिस्ट, फोटो पुरावे आणि AI अहवाल.",
  ],
  "role.citizenD": [
    "Report unsafe food, track complaints, and look up nearby business safety grades.",
    "असुरक्षित भोजन की रिपोर्ट करें, शिकायतें ट्रैक करें और आसपास के व्यवसायों की सुरक्षा ग्रेड देखें।",
    "असुरक्षित अन्नाची नोंद करा, तक्रारी ट्रॅक करा आणि जवळच्या व्यवसायांचे सुरक्षा ग्रेड पहा.",
  ],
  "role.ownerD": [
    "See your safety grade, manage compliance documents, and get plain-language improvement tips.",
    "अपनी सुरक्षा ग्रेड देखें, अनुपालन दस्तावेज़ प्रबंधित करें और सरल भाषा में सुधार सुझाव पाएँ।",
    "तुमचा सुरक्षा ग्रेड पहा, अनुपालन कागदपत्रे व्यवस्थापित करा आणि सोप्या भाषेत सुधारणा सूचना मिळवा.",
  ],

  // ---- home: hero ----
  "home.badge": ["Your food-safety shield · FSSAI & Maharashtra FDA", "आपकी खाद्य-सुरक्षा ढाल · FSSAI और महाराष्ट्र FDA", "तुमची अन्न-सुरक्षा ढाल · FSSAI आणि महाराष्ट्र FDA"],
  "home.title": ["Know what's safe to eat — before you take a bite.", "खाने से पहले जानिए — क्या सुरक्षित है।", "खाण्यापूर्वी जाणून घ्या — काय सुरक्षित आहे."],
  "home.sub": [
    "SafeBite puts FSSAI and Maharashtra FDA safety grades, live food-safety news and a two-minute complaint channel in your pocket. Check any business, report unsafe food, and follow your complaint to resolution — in English, Hindi or Marathi.",
    "SafeBite आपकी जेब में FSSAI और महाराष्ट्र FDA के सुरक्षा ग्रेड, लाइव खाद्य-सुरक्षा समाचार और दो मिनट की शिकायत सुविधा पहुँचाता है। किसी भी व्यवसाय की जाँच करें, असुरक्षित भोजन की रिपोर्ट करें और अपनी शिकायत का समाधान ट्रैक करें — हिंदी, मराठी या अंग्रेज़ी में।",
    "SafeBite तुमच्या खिशात FSSAI आणि महाराष्ट्र FDA चे सुरक्षा ग्रेड, थेट अन्न-सुरक्षा बातम्या आणि दोन मिनिटांची तक्रार सुविधा पोहोचवते. कोणताही व्यवसाय तपासा, असुरक्षित अन्नाची तक्रार नोंदवा आणि तक्रारीचे निराकरण ट्रॅक करा — हिंदी, मराठी किंवा इंग्रजीत.",
  ],
  "home.ctaCommand": ["Check a business", "व्यवसाय जाँचें", "व्यवसाय तपासा"],
  "home.ctaReport": ["Report unsafe food", "असुरक्षित भोजन की रिपोर्ट करें", "असुरक्षित अन्न नोंदवा"],
  "home.ctaRoles": ["Explore roles", "भूमिकाएँ देखें", "भूमिका पहा"],
  "home.demoCreds": [
    "Demo credentials: officer@demo.in · citizen@demo.in · owner@demo.in — password",
    "डेमो लॉगिन: officer@demo.in · citizen@demo.in · owner@demo.in — पासवर्ड",
    "डेमो लॉगिन: officer@demo.in · citizen@demo.in · owner@demo.in — पासवर्ड",
  ],

  // ---- home: stats ----
  "home.s1l": ["businesses safety-checked", "सुरक्षा-जाँचे गए व्यवसाय", "सुरक्षा-तपासलेले व्यवसाय"],
  "home.s2l": ["districts covered", "कवर किए गए जिले", "कव्हर केलेले जिल्हे"],
  "home.s3l": ["complaint-to-action window", "शिकायत से कार्रवाई की अवधि", "तक्रार ते कारवाई अवधी"],
  "home.s4l": ["explainable safety grades", "समझने योग्य सुरक्षा ग्रेड", "स्पष्ट सुरक्षा ग्रेड"],

  // ---- home: features ----
  "home.featsTitle": ["From reactive to predictive food safety", "प्रतिक्रियात्मक से भविष्यसूचक खाद्य सुरक्षा तक", "प्रतिक्रियात्मक ते भविष्यसूचक अन्न सुरक्षा"],
  "home.featsSub": [
    "One platform that turns scattered complaints, inspections, lab results, and registration data into a single dynamic risk picture.",
    "एक प्लेटफ़ॉर्म जो बिखरी शिकायतों, निरीक्षणों, प्रयोगशाला परिणामों और पंजीकरण डेटा को एक गतिशील जोखिम चित्र में बदलता है।",
    "एकच व्यासपीठ जी विखुरलेल्या तक्रारी, तपासण्या, प्रयोगशाळा निकाल आणि नोंदणी डेटा एका गतिशील जोखीम चित्रात बदलते.",
  ],
  "home.f1t": ["Predictive Risk Scoring", "भविष्यसूचक जोखिम स्कोरिंग", "भविष्यसूचक जोखीम गुणांकन"],
  "home.f1b": [
    "Every registered business gets a live, explainable 0–100 Food Safety Risk Score computed from violations, complaints, inspection gaps, and document compliance.",
    "हर पंजीकृत व्यवसाय को उल्लंघन, शिकायतों, निरीक्षण कमियों और दस्तावेज़ अनुपालन से बना 0–100 का लाइव, व्याख्या योग्य खाद्य सुरक्षा जोखिम स्कोर मिलता है।",
    "प्रत्येक नोंदणीकृत व्यवसायाला उल्लंघने, तक्रारी, तपासणी त्रुटी आणि कागदपत्र अनुपालनावरून 0–100 चा थेट, स्पष्टीकरणक्षम अन्न सुरक्षा जोखीम गुण मिळतो.",
  ],
  "home.f2t": ["District Heat Maps", "जिला हीट मैप", "जिल्हा हीट नकाशे"],
  "home.f2b": [
    "Colour-coded risk heat maps across Maharashtra districts, drillable into individual business records for field teams.",
    "महाराष्ट्र के जिलों में रंग-कोडित जोखिम हीट मैप, फील्ड टीमों के लिए व्यक्तिगत व्यवसाय रिकॉर्ड में ड्रिल-डाउन करने योग्य।",
    "महाराष्ट्राच्या जिल्ह्यांमध्ये रंग-कोडित जोखीम हीट नकाशे, क्षेत्रीय पथकांसाठी वैयक्तिक व्यवसाय नोंदींपर्यंत तपशील पाहता येण्याजोगे.",
  ],
  "home.f3t": ["Outbreak Network Detection", "प्रकोप नेटवर्क का पता लगाना", "प्रादुर्भाव साखळी शोध"],
  "home.f3b": [
    "Rule-based heuristics group businesses by shared suppliers and geographic/temporal violation clusters to flag suspected outbreak networks early.",
    "नियम-आधारित ह्यूरिस्टिक्स साझा आपूर्तिकर्ताओं और भौगोलिक/समय-आधारित उल्लंघन समूहों के आधार पर व्यवसायों को जोड़कर संदिग्ध प्रकोप नेटवर्क को जल्दी चिह्नित करते हैं।",
    "नियम-आधारित ह्युरिस्टिक्स सामायिक पुरवठादार आणि भौगोलिक/कालानुसार उल्लंघन गटांवरून व्यवसाय जोडून संशयास्पद प्रादुर्भाव साखळ्या लवकर चिन्हांकित करतात.",
  ],
  "home.f4t": ["Checklist-Based Inspections", "चेकलिस्ट आधारित निरीक्षण", "चेकलिस्ट आधारित तपासणी"],
  "home.f4b": [
    "Food Safety Officers complete FSSAI-style checklists, attach photos, and generate structured AI reports with recommended risk deltas.",
    "खाद्य सुरक्षा अधिकारी FSSAI-शैली चेकलिस्ट पूरी करते हैं, फोटो जोड़ते हैं और अनुशंसित जोखिम बदलावों के साथ संरचित AI रिपोर्ट बनाते हैं।",
    "अन्न सुरक्षा अधिकारी FSSAI-शैली चेकलिस्ट पूर्ण करतात, फोटो जोडतात आणि शिफारस केलेल्या जोखीम बदलांसह संरचित AI अहवाल तयार करतात.",
  ],
  "home.f5t": ["Citizen Reporting", "नागरिक शिकायत", "नागरिक तक्रार"],
  "home.f5b": [
    "Citizens report unsafe food with photos and map pinning, then track their complaint from submission through to resolution.",
    "नागरिक फोटो और मैप पिन के साथ असुरक्षित भोजन की रिपोर्ट करते हैं, फिर अपनी शिकायत को समाधान तक ट्रैक करते हैं।",
    "नागरिक फोटो आणि नकाशा पिनसह असुरक्षित अन्नाची नोंद करतात, मग तक्रारीचा निकाल होईपर्यंत मागोवा घेतात.",
  ],
  "home.f6t": ["Transparent & Auditable", "पारदर्शी और ऑडिट योग्य", "पारदर्शी व लेखापरीक्षणक्षम"],
  "home.f6b": [
    "The scoring model is a deterministic weighted function — every point can be explained to a regulator or challenged in public.",
    "स्कोरिंग मॉडल एक निश्चित भारित फ़ंक्शन है — हर अंक नियामक को समझाया जा सकता है या सार्वजनिक रूप से चुनौती दी जा सकती है।",
    "गुणांकन मॉडेल हे निश्चित भारित कार्य आहे — प्रत्येक गुण नियामकाला समजावता येतो किंवा सार्वजनिकपणे आव्हान देता येते.",
  ],

  // ---- home: how it works ----
  "home.howTitle": ["A complaint reaches an officer in minutes", "शिकायत मिनटों में अधिकारी तक पहुँचती है", "तक्रार मिनिटांत अधिकाऱ्यापर्यंत पोहोचते"],
  "home.howSub": [
    "Three simple steps — modelled on the Maharashtra FDA grievance flow, rebuilt with live tracking, SLA clocks and automatic escalation.",
    "तीन सरल चरण — महाराष्ट्र FDA शिकायत प्रवाह पर आधारित, लाइव ट्रैकिंग, SLA टाइमर और स्वचालित एस्केलेशन के साथ।",
    "तीन सोपी पायरी — महाराष्ट्र FDA तक्रार प्रक्रियेवर आधारित, थेट ट्रॅकिंग, SLA काउंटर आणि स्वयंचलित एस्केलेशनसह.",
  ],
  "home.h1t": ["Describe it", "विवरण दें", "वर्णन करा"],
  "home.h1b": [
    "Type or speak in Marathi, Hindi, or English. Add photos and pin the exact location on the map.",
    "मराठी, हिंदी या अंग्रेज़ी में टाइप करें या बोलें। फोटो जोड़ें और नक्शे पर सटीक स्थान चिह्नित करें।",
    "मराठी, हिंदी किंवा इंग्रजीत टाइप करा किंवा बोला. फोटो जोडा आणि नकाशावर अचूक ठिकाण चिन्हांकित करा.",
  ],
  "home.h2t": ["AI structures & routes it", "AI संरचना करके रूट करता है", "AI रचना करून रूट करते"],
  "home.h2b": [
    "Our explainable assistant classifies the complaint, assigns it to the right Food Safety Officer, and opens a 7-day SLA.",
    "हमारा व्याख्या योग्य सहायक शिकायत को वर्गीकृत करता है, सही खाद्य सुरक्षा अधिकारी को सौंपता है और 7-दिवसीय SLA शुरू करता है।",
    "आमचा स्पष्टीकरणक्षम सहाय्यक तक्रारीचे वर्गीकरण करतो, योग्य अन्न सुरक्षा अधिकाऱ्याला नियुक्त करतो आणि 7-दिवसीय SLA सुरू करतो.",
  ],
  "home.h3t": ["Officer acts, you track", "अधिकारी कार्य करता है, आप ट्रैक करते हैं", "अधिकारी कारवाई करतो, तुम्ही ट्रॅक करता"],
  "home.h3b": [
    "The officer inspects and acts. You watch the status and auto-escalation — in real time.",
    "अधिकारी निरीक्षण करके कार्रवाई करता है। आप स्थिति और स्वचालित एस्केलेशन वास्तविक समय में देखते हैं।",
    "अधिकारी तपासणी करून कारवाई करतो. तुम्ही स्थिती आणि स्वयंचलित एस्केलेशन थेट पाहता.",
  ],

  // ---- home: roles ----
  "home.rolesTitle": ["One platform, three roles", "एक प्लेटफ़ॉर्म, तीन भूमिकाएँ", "एक व्यासपीठ, तीन भूमिका"],
  "home.r1b": [
    "Command center with risk-ranked businesses, heat maps, scheduling and analytics, plus your prioritised inspection queue, checklists, photo evidence and AI reports.",
    "जोखिम-क्रमित व्यवसायों, हीट मैप, अनुसूची और एनालिटिक्स वाला कमांड सेंटर, साथ में प्राथमिकता वाली निरीक्षण कतार, चेकलिस्ट, फोटो साक्ष्य और AI रिपोर्ट।",
    "जोखीम-क्रमित व्यवसाय, हीट नकाशे, वेळापत्रक आणि विश्लेषण असलेले कमांड सेंटर, तसेच प्राधान्यक्रमित तपासणी यादी, चेकलिस्ट, फोटो पुरावे आणि AI अहवाल.",
  ],
  "home.r2b": [
    "Report unsafe food, track complaints, and look up nearby business safety grades.",
    "असुरक्षित भोजन की रिपोर्ट करें, शिकायतें ट्रैक करें और आसपास के व्यवसायों की सुरक्षा ग्रेड देखें।",
    "असुरक्षित अन्नाची नोंद करा, तक्रारी ट्रॅक करा आणि जवळच्या व्यवसायांचे सुरक्षा ग्रेड पहा.",
  ],
  "home.r3b": [
    "See your safety grade, manage compliance documents, and get plain-language improvement tips.",
    "अपनी सुरक्षा ग्रेड देखें, अनुपालन दस्तावेज़ प्रबंधित करें और सरल भाषा में सुधार सुझाव पाएँ।",
    "तुमचा सुरक्षा ग्रेड पहा, अनुपालन कागदपत्रे व्यवस्थापित करा आणि सोप्या भाषेत सुधारणा सूचना मिळवा.",
  ],

  // ---- home: helpline ----
  "home.helpTitle": ["Prefer to talk to someone?", "किसी से बात करना पसंद करेंगे?", "एखाद्याशी बोलणे आवडेल?"],
  "home.helpBody": [
    "Toll-free helpline 1800-222-365 · 24×7, all days · Marathi, Hindi and English",
    "टोल-फ्री हेल्पलाइन 1800-222-365 · 24×7 · मराठी, हिंदी और अंग्रेज़ी",
    "टोल-फ्री हेल्पलाइन 1800-222-365 · 24×7 · मराठी, हिंदी आणि इंग्रजी",
  ],
  "home.reportIssue": ["Report an issue", "समस्या रिपोर्ट करें", "समस्या नोंदवा"],

  // ---- home: news / actions ----
  "home.newsTitle": ["Food safety news — live", "खाद्य सुरक्षा समाचार — लाइव", "अन्न सुरक्षा बातम्या — थेट"],
  "home.newsSub": [
    "Latest headlines for Maharashtra and India, refreshed from Google News.",
    "महाराष्ट्र और भारत के ताज़ा समाचार, Google News से रीफ्रेश होते हैं।",
    "महाराष्ट्र आणि भारतातील ताज्या बातम्या, Google News वरून रिफ्रेश होतात.",
  ],
  "home.viewAllNews": ["All news", "सभी समाचार", "सर्व बातम्या"],
  "home.recentActions": ["Recent actions taken", "हाल की गई कार्रवाइयाँ", "अलीकडील कारवाया"],
  "home.unsafeNear": ["Highly unsafe spots near you", "आपके पास के अत्यंत असुरक्षित स्थान", "तुमच्या जवळील अत्यंत असुरक्षित ठिकाणे"],
  "home.leadership": ["Leadership", "नेतृत्व", "नेतृत्व"],

  // ---- home: footer ----
  "home.footPrototype": ["· Hackathon prototype", "· हैकाथॉन प्रोटोटाइप", "· हैकाथॉन प्रोटोटाइप"],
  "home.footMocked": [
    "Demo data is mocked. Not a government system.",
    "डेमो डेटा नकली है। यह सरकारी प्रणाली नहीं है।",
    "डेमो डेटा कृत्रिम आहे. ही शासकीय यंत्रणा नाही.",
  ],
  "home.footGuide": ["Judges' guide to the charts", "चार्ट के लिए निर्णायक मार्गदर्शिका", "चार्टसाठी निर्णायक मार्गदर्शक"],

  // ---- login ----
  "login.title": ["Official sign-in", "आधिकारिक साइन-इन", "अधिकृत साइन-इन"],
  "login.sub": [
    "Restricted to food safety officers, officials and demo accounts. Public visitors can browse SafeBite freely.",
    "केवल खाद्य सुरक्षा अधिकारियों, अधिकारियों और डेमो खातों के लिए। आम आगंतुक SafeBite स्वतंत्र रूप से देख सकते हैं।",
    "केवळ अन्न सुरक्षा अधिकारी, अधिकारी आणि डेमो खात्यांसाठी. सामान्य अभ्यागत SafeBite मुक्तपणे ब्राउझ करू शकतात.",
  ],
  "login.demoAccounts": ["Demo accounts — tap to fill", "डेमो खाते — भरने के लिए टैप करें", "डेमो खाती — भरण्यासाठी टॅप करा"],
  "login.manualTitle": ["Sign in with email", "ईमेल से साइन इन करें", "ईमेलने साइन इन करा"],
  "login.manualDesc": [
    "Use any demo account — password is",
    "कोई भी डेमो खाता उपयोग करें — पासवर्ड है",
    "कोणतेही डेमो खाते वापरा — पासवर्ड आहे",
  ],

  // ---- shell ----
  "shell.hOfficer": ["Food Safety Command Center", "खाद्य सुरक्षा कमांड सेंटर", "अन्न सुरक्षा कमांड सेंटर"],
  "shell.hCitizen": ["Citizen Safety Portal", "नागरिक सुरक्षा पोर्टल", "नागरिक सुरक्षा पोर्टल"],
  "shell.hOwner": ["Business Compliance Portal", "व्यवसाय अनुपालन पोर्टल", "व्यवसाय अनुपालन पोर्टल"],
  "nav.dashboard": ["Dashboard", "डैशबोर्ड", "डॅशबोर्ड"],
  "nav.queue": ["My Queue", "मेरी कतार", "माझी यादी"],
  "nav.history": ["Inspection History", "निरीक्षण इतिहास", "तपासणी इतिहास"],
  "nav.map": ["District Risk Map", "जिला जोखिम मैप", "जिल्हा जोखीम नकाशा"],
  "nav.schedule": ["Inspection Schedule", "निरीक्षण अनुसूची", "तपासणी वेळापत्रक"],
  "nav.analytics": ["Analytics & Outbreaks", "एनालिटिक्स और प्रकोप", "विश्लेषण व प्रादुर्भाव"],
  "nav.report": ["Report Unsafe Food", "असुरक्षित भोजन रिपोर्ट करें", "असुरक्षित अन्न नोंदवा"],
  "nav.track": ["Track Complaints", "शिकायत ट्रैक करें", "तक्रार ट्रॅक करा"],
  "nav.lookup": ["Business Lookup", "व्यवसाय खोज", "व्यवसाय शोध"],
  "nav.myBusiness": ["My Business", "मेरा व्यवसाय", "माझा व्यवसाय"],
  "nav.documents": ["Compliance Documents", "अनुपालन दस्तावेज़", "अनुपालन कागदपत्रे"],
  "nav.tips": ["Improvement Tips", "सुधार सुझाव", "सुधारणा सूचना"],

  // ---- news page ----
  "news.title": ["Food Safety News", "खाद्य सुरक्षा समाचार", "अन्न सुरक्षा बातम्या"],
  "news.sub": [
    "Live headlines per state · Google News RSS · click through to the source",
    "प्रत्येक राज्य के लाइव समाचार · Google News RSS",
    "प्रत्येक राज्याच्या थेट बातम्या · Google News RSS",
  ],
  "news.disclaimer": [
    "Headlines are pulled live from Google News RSS. SafeBite is a hackathon prototype, not a government system.",
    "समाचार Google News RSS से लाइव आते हैं। SafeBite एक हैकाथॉन प्रोटोटाइप है, सरकारी प्रणाली नहीं।",
    "बातम्या Google News RSS वरून थेट येतात. SafeBite हे हैकाथॉन प्रोटोटाइप आहे, शासकीय यंत्रणा नाही.",
  ],
  "news.allIndia": ["All India", "पूरा भारत", "संपूर्ण भारत"],
  "news.openSource": ["Open source", "स्रोत खोलें", "स्रोत उघडा"],
  "news.noNews": [
    "No headlines found for this state right now. Try another state.",
    "इस राज्य के लिए अभी कोई समाचार नहीं मिला। दूसरा राज्य चुनें।",
    "या राज्यासाठी सध्या बातम्या सापडल्या नाहीत. दुसरा राज्य निवडा.",
  ],
  "news.loading": ["Loading headlines…", "समाचार लोड हो रहे हैं…", "बातम्या लोड होत आहेत…"],
  "news.error": ["Could not fetch news. Please try again.", "समाचार नहीं मिल सके। कृपया पुनः प्रयास करें।", "बातम्या मिळू शकल्या नाहीत. कृपया पुन्हा प्रयत्न करा."],
  "news.retry": ["Try again", "पुनः प्रयास करें", "पुन्हा प्रयत्न करा"],
  "news.unsafeSub": [
    "Based on risk scores and your location",
    "जोखिम स्कोर और आपके स्थान पर आधारित",
    "जोखीम गुण आणि तुमच्या स्थानावर आधारित",
  ],
  "news.shareLoc": ["Share location for exact distance", "सटीक दूरी के लिए स्थान साझा करें", "अचूक अंतरासाठी स्थान शेअर करा"],
  "news.km": ["km away", "किमी दूर", "किमी अंतरावर"],
  "news.published": ["Published {t} ago", "प्रकाशित {t} पहले", "प्रकाशित {t} आधी"],

  // ---- leadership ----
  "lead.title": ["Leadership", "नेतृत्व", "नेतृत्व"],
  "lead.sub": [
    "The real people behind India's food safety",
    "भारत की खाद्य सुरक्षा के असली चेहरे",
    "भारताच्या अन्न सुरक्षेमागील वास्तविक व्यक्ती",
  ],
  "lead.fssai": ["FSSAI — Food Safety and Standards Authority of India", "FSSAI — भारतीय खाद्य सुरक्षा एवं मानक प्राधिकरण", "FSSAI — भारतीय अन्न सुरक्षा व मानके प्राधिकरण"],
  "lead.maharashtra": ["Maharashtra Food & Drug Administration", "महाराष्ट्र खाद्य एवं औषध प्रशासन", "महाराष्ट्र अन्न व औषध प्रशासन"],
  "lead.chair": ["Chairperson, FSSAI · Secretary, MoHFW", "अध्यक्ष, FSSAI · सचिव, MoHFW", "अध्यक्ष, FSSAI · सचिव, MoHFW"],
  "lead.ceo": ["Chief Executive Officer, FSSAI", "मुख्य कार्यकारी अधिकारी, FSSAI", "मुख्य कार्यकारी अधिकारी, FSSAI"],
  "lead.comm": ["Commissioner, Maharashtra FDA", "आयुक्त, महाराष्ट्र FDA", "आयुक्त, महाराष्ट्र FDA"],
  "lead.note": [
    "Portraits are official photographs from FSSAI (Food Safety & Standards Digest) and Wikimedia Commons.",
    "चित्र FSSAI (खाद्य सुरक्षा एवं मानक डाइजेस्ट) और Wikimedia Commons के आधिकारिक फोटो हैं।",
    "छायाचित्रे FSSAI (अन्न सुरक्षा व मानके डायजेस्ट) आणि Wikimedia Commons ची अधिकृत आहेत.",
  ],

  // ---- dashboards ----
  "dash.title": ["Regulatory Dashboard", "नियामक डैशबोर्ड", "नियामक डॅशबोर्ड"],
  "dash.sub": ["Live risk picture across Maharashtra", "महाराष्ट्र की लाइव जोखिम स्थिति", "महाराष्ट्रातील थेट जोखीम स्थिती"],
  "kpi.registered": ["Registered businesses", "पंजीकृत व्यवसाय", "नोंदणीकृत व्यवसाय"],
  "kpi.highRisk": ["High-risk (C+D)", "उच्च जोखिम (C+D)", "उच्च जोखीम (C+D)"],
  "kpi.open": ["Open complaints", "खुली शिकायतें", "प्रलंबित तक्रारी"],
  "kpi.scheduled": ["Scheduled inspections", "निर्धारित निरीक्षण", "नियोजित तपासण्या"],
  "kpi.avg": ["Avg risk score", "औसत जोखिम स्कोर", "सरासरी जोखीम गुण"],
  "kpi.awaiting": ["Awaiting action", "कार्रवाई की प्रतीक्षा", "कारवाईची प्रतीक्षा"],
  "kpi.overdue": ["Overdue", "विलंबित", "विलंबित"],
  "kpi.completed": ["Completed", "पूर्ण", "पूर्ण झालेल्या"],
  "dash.latest": ["Latest open complaints", "नवीनतम खुली शिकायतें", "नवीनतम प्रलंबित तक्रारी"],
  "dash.awaiting": ["Awaiting action", "कार्रवाई की प्रतीक्षा", "कारवाईची प्रतीक्षा"],
  "queue.title": ["My Inspection Queue", "मेरा निरीक्षण कतार", "माझी तपासणी यादी"],
  "queue.sub": ["Prioritised by risk score and SLA", "जोखिम स्कोर और SLA द्वारा प्राथमिकता", "जोखीम गुण आणि SLA नुसार प्राधान्य"],
  "analytics.title": ["Analytics & Outbreak Detection", "एनालिटिक्स और प्रकोप पहचान", "विश्लेषण व प्रादुर्भाव शोध"],
  "analytics.explain": ["Explain these charts", "इन चार्ट को समझाएँ", "हे चार्ट समजावून घ्या"],
  "my.title": ["Track My Complaints", "मेरी शिकायतें ट्रैक करें", "माझ्या तक्रारी ट्रॅक करा"],
  "my.pdf": ["Download PDF", "पीडीएफ डाउनलोड करें", "PDF डाउनलोड करा"],
  "map.title": ["District Risk Heat Map", "जिला जोखिम हीट मैप", "जिल्हा जोखीम हीट नकाशा"],
  "history.title": ["Inspection History", "निरीक्षण इतिहास", "तपासणी इतिहास"],
  "schedule.title": ["Inspection Scheduling", "निरीक्षण अनुसूची", "तपासणी वेळापत्रक"],
  "docs.title": ["Compliance Documents", "अनुपालन दस्तावेज़", "अनुपालन कागदपत्रे"],
  "tips.title": ["AI Improvement Suggestions", "AI सुधार सुझाव", "AI सुधारणा सूचना"],
  "lookup.title": ["Business Safety Lookup", "व्यवसाय सुरक्षा खोज", "व्यवसाय सुरक्षा शोध"],
  "report.title": ["Report Unsafe Food", "असुरक्षित भोजन रिपोर्ट करें", "असुरक्षित अन्न नोंदवा"],
  "owner.title": ["My Business Compliance", "मेरा व्यवसाय अनुपालन", "माझे व्यवसाय अनुपालन"],
};

export function tr(lang: Lang, key: string, vars?: Record<string, string>): string {
  let s = dict[key]?.[IDX[lang]] ?? dict[key]?.[0] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  }
  return s;
}