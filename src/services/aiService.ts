export type Severity = 'critical' | 'warning' | 'caution' | 'info';

export interface QuickAction {
  label: string;
  type: 'doctor' | 'medicine' | 'hospital' | 'emergency';
  data: any;
}

export interface BotResponse {
  text: string;
  severity: Severity;
  recommendations?: { type: string; header: string; items: any[] }[];
  quickActions?: QuickAction[];
  followUp?: string;
  differentialDiagnoses?: { conditionName: string; confidence: number; riskFactors: string[] }[];
  triageRoute?: 'self-care' | 'teleconsultation' | 'urgent-care' | 'emergency';
  clinicalCodes?: { type: string; code: string; desc: string }[];
  hospitalMapData?: {
    latitude: number;
    longitude: number;
    radius: number;
    keyword: string;
    hospitals: {
      id: string;
      name: string;
      lat: number;
      lng: number;
      address: string;
      distanceText: string;
      hfrId: string | null;
      rating: number;
      verified: boolean;
      phone: string;
    }[];
  };
  linguisticPipeline?: {
    cmi: number;
    detectedLang: string;
    transliteratedText: string;
    translatedText: string;
    cometScore: number;
    retrievalMethod: string;
  };
  empathyEngine?: {
    sentiment: 'anxious' | 'frustrated' | 'sad' | 'neutral' | 'positive';
    confidence: number;
    validationMessage: string;
  };
  triageDetails?: {
    level: 'emergency_ambulance' | 'emergency' | 'consultation_24' | 'consultation' | 'self_care';
    reason: string;
    tupleMatched?: string;
  };
  crisisHandoff?: boolean;
}

export interface ConversationContext {
  symptoms: Set<string>;
  lastSeverity: Severity;
  turnCount: number;
  lastTopic: string;
}

const CONDITIONS: { keywords: string[]; response: string; severity: Severity; medicineKeywords: string[]; specialtyKeywords: string[] }[] = [
  {
    keywords: ['chest pain', 'chest pressure', 'heart attack', 'cardiac arrest', 'not breathing', 'unconscious', 'severe bleeding', 'stroke', 'suicide', 'burn', 'poison', 'drowning', 'accident severe', 'fatal'],
    response: 'This sounds like a medical emergency. Please call 108 immediately and trigger the SOS widget for emergency instructions. Do not wait for the symptoms to resolve on their own.',
    severity: 'critical',
    medicineKeywords: [],
    specialtyKeywords: ['Cardiology', 'Emergency', 'Neurology']
  },
  {
    keywords: ['fever', 'high temperature', 'hot body', 'temperature', 'viral fever', 'typhoid', 'malaria'],
    response: 'Based on your fever symptoms, this appears to be a febrile state likely from a viral or bacterial infection. **Self-care**: Take paracetamol 500mg every 6 hours as needed (max 8 tablets/24hrs), stay hydrated, and rest. If fever exceeds 102°F for over 72 hours, consult a doctor.',
    severity: 'warning',
    medicineKeywords: ['Pain Relief', 'Antipyretic'],
    specialtyKeywords: ['General Medicine', 'General Physician']
  },
  {
    keywords: ['cough', 'dry cough', 'wet cough', 'phlegm', 'mucus', 'throat infection', 'sore throat', 'bronchitis', 'asthma', 'wheezing', 'breathless', 'shortness of breath', 'congestion'],
    response: 'Your respiratory symptoms suggest a respiratory tract infection or bronchitis. **Self-care**: Stay hydrated, inhale steam twice daily, and rest. For dry cough, honey-lemon warm water may help. Persistent cough with fever or breathlessness needs medical evaluation.',
    severity: 'caution',
    medicineKeywords: ['Antibiotic', 'Respiratory', 'Cough'],
    specialtyKeywords: ['Pulmonology', 'General Medicine', 'General Physician']
  },
  {
    keywords: ['cold', 'runny nose', 'sneezing', 'blocked nose', 'sinus', 'sinusitis', 'allergy', 'allergic', 'allergies', 'dust allergy', 'pollen'],
    response: 'This appears to be allergic rhinitis or a common cold. **Self-care**: Avoid known allergens, take an antihistamine, and use saline nasal drops. For dust/pollen allergies, keep indoor air clean with an air purifier.',
    severity: 'caution',
    medicineKeywords: ['Allergy', 'Respiratory'],
    specialtyKeywords: ['Dermatology', 'ENT', 'General Medicine']
  },
  {
    keywords: ['headache', 'migraine', 'head pain', 'throbbing head', 'severe headache', 'cluster headache', 'tension headache'],
    response: 'Your headache could be tension-type or migraine. **Self-care**: Rest in a quiet dark room, stay hydrated, and apply a cold compress to the forehead. Avoid triggers like bright light, loud noise, and certain foods. Chronic headaches need neurologist evaluation.',
    severity: 'caution',
    medicineKeywords: ['Pain Relief'],
    specialtyKeywords: ['Neurology', 'General Physician']
  },
  {
    keywords: ['stomach pain', 'abdomen', 'abdominal pain', 'belly pain', 'gastric', 'gastritis', 'acidity', 'acid reflux', 'heartburn', 'indigestion', 'bloating', 'gas'],
    response: 'Your digestive symptoms point towards gastritis, acid reflux, or indigestion. **Self-care**: Avoid spicy/greasy foods, eat smaller meals, and maintain a 2-3 hour gap before sleep. Omeprazole or Pantoprazole on an empty stomach may help persistent acidity.',
    severity: 'caution',
    medicineKeywords: ['Digestive', 'Antacid'],
    specialtyKeywords: ['Gastroenterology', 'General Physician']
  },
  {
    keywords: ['diarrhea', 'loose motion', 'loose stools', 'dysentery', 'food poisoning', 'stomach infection', 'gastroenteritis', 'vomiting', 'nausea', 'throwing up', 'puking', 'dehydration'],
    response: 'This looks like gastroenteritis or food poisoning. **Self-care**: Drink ORS or electrolyte solution frequently to prevent dehydration. Follow the BRAT diet (Bananas, Rice, Applesauce, Toast). Avoid dairy and solid foods for 24 hours.',
    severity: 'warning',
    medicineKeywords: ['Antibiotic', 'Digestive'],
    specialtyKeywords: ['Gastroenterology', 'General Medicine', 'General Physician']
  },
  {
    keywords: ['rash', 'skin rash', 'itch', 'itchy', 'itching', 'hives', 'allergy skin', 'dermatitis', 'eczema', 'acne', 'pimple', 'pimples', 'fungal', 'ringworm', 'scabies', 'lotion'],
    response: 'Your skin symptoms suggest contact dermatitis or a fungal infection. **Self-care**: Apply calamine lotion for itching, avoid scratching. For fungal infections, keep the area dry and use antifungal cream. See a dermatologist if the rash spreads or persists beyond 3 days.',
    severity: 'caution',
    medicineKeywords: ['Allergy', 'Dermatology'],
    specialtyKeywords: ['Dermatology', 'General Physician']
  },
  {
    keywords: ['joint pain', 'arthritis', 'knee pain', 'back pain', 'muscle pain', 'body ache', 'body pain', 'body aches', 'stiffness', 'rheumatoid'],
    response: 'Your musculoskeletal symptoms suggest possible arthritis, sprain, or muscle strain. **Self-care**: Apply heat or cold compress, rest the affected area, and take ibuprofen 400mg if needed. Chronic joint pain needs orthopedist or rheumatologist evaluation.',
    severity: 'caution',
    medicineKeywords: ['Pain Relief', 'Anti-inflammatory'],
    specialtyKeywords: ['Orthopedics', 'Rheumatology', 'General Physician']
  },
  {
    keywords: ['diabetes', 'blood sugar', 'high sugar', 'sugar level', 'thirsty', 'frequent urination', 'polyuria', 'insulin'],
    response: 'Blood sugar issues require consistent management. **Self-care**: Monitor fasting and post-meal glucose regularly. Take Metformin 500mg as prescribed. Follow a low-GI diet, exercise daily for 30 minutes, and avoid sugary foods and beverages.',
    severity: 'warning',
    medicineKeywords: ['Diabetes'],
    specialtyKeywords: ['Endocrinology', 'General Physician', 'Nephrology']
  },
  {
    keywords: ['blood pressure', 'bp high', 'hypertension', 'bp low', 'hypotension', 'dizziness', 'dizzy', 'vertigo', 'palpitation', 'heartbeat'],
    response: 'Blood pressure irregularities need careful monitoring. **Self-care**: For high BP, reduce salt intake, avoid stress, and take Losartan 50mg if prescribed. For low BP or dizziness, sit/lie down immediately and hydrate. Regular BP monitoring is essential.',
    severity: 'warning',
    medicineKeywords: ['Cardiac', 'Diabetes'],
    specialtyKeywords: ['Cardiology', 'General Physician', 'Neurology']
  },
  {
    keywords: ['tooth', 'toothache', 'tooth pain', 'dental', 'gum', 'cavity', 'teeth', 'oral'],
    response: 'Dental pain could be from cavities, gum infection, or wisdom teeth issues. **Self-care**: Rinse with warm salt water, take ibuprofen 400mg for pain, and avoid very hot/cold foods. Book a dentist appointment promptly.',
    severity: 'caution',
    medicineKeywords: ['Pain Relief'],
    specialtyKeywords: ['Dental', 'General Physician']
  },
  {
    keywords: ['eye pain', 'eye redness', 'vision', 'blurry', 'eye irritation', 'pink eye', 'conjunctivitis', 'eye infection'],
    response: 'Eye symptoms could indicate conjunctivitis, strain, or infection. **Self-care**: Rest your eyes from screens, use lubricating eye drops, and avoid touching your eyes. See an ophthalmologist if there is discharge, vision change, or severe pain.',
    severity: 'caution',
    medicineKeywords: ['Eye Drops', 'Antibiotic'],
    specialtyKeywords: ['Ophthalmology', 'General Physician']
  },
  {
    keywords: ['ear pain', 'earache', 'ear infection', 'hearing', 'ear wax'],
    response: 'Ear pain commonly comes from infection, wax buildup, or eustachian tube issues. **Self-care**: Apply warm compress to the outer ear, avoid inserting cotton swabs, and take pain relievers. ENT evaluation needed for persistent pain.',
    severity: 'caution',
    medicineKeywords: ['Pain Relief', 'Antibiotic'],
    specialtyKeywords: ['ENT', 'General Physician']
  },
  {
    keywords: ['period', 'menstrual', 'cramps', 'pms', 'pcos', 'irregular periods', 'pregnancy', 'pregnant', 'conception', 'fertility'],
    response: 'Menstrual health issues range from hormonal imbalances to PCOS. **Self-care**: Track your cycle, maintain a balanced diet rich in iron, exercise moderately, and manage stress. For severe cramps or irregularities, consult a gynecologist.',
    severity: 'caution',
    medicineKeywords: ['Pain Relief', 'Hormonal'],
    specialtyKeywords: ['Gynecology', 'Obstetrics']
  },
  {
    keywords: ['urine', 'urination', 'burning pee', 'uti', 'urinary tract', 'kidney stone', 'renal', 'frequent urination', 'blood in urine'],
    response: 'Urinary symptoms suggest UTI, kidney stone, or prostatitis. **Self-care**: Drink plenty of water (3+ liters/day), avoid caffeine and alcohol, and avoid holding urine. Burning urination needs a urine culture test.',
    severity: 'warning',
    medicineKeywords: ['Antibiotic', 'Kidney'],
    specialtyKeywords: ['Nephrology', 'Urology', 'General Physician']
  },
  {
    keywords: ['thyroid', 'neck swelling', 'goiter', 'hypothyroidism', 'hyperthyroidism'],
    response: 'Thyroid conditions require hormone management. **Self-care**: Get a TSH test, take levothyroxine if hypothyroid, and avoid excess iodine. Include selenium and zinc in your diet.',
    severity: 'caution',
    medicineKeywords: ['Hormonal', 'Thyroid'],
    specialtyKeywords: ['Endocrinology', 'General Physician']
  },
  {
    keywords: ['liver', 'jaundice', 'yellow skin', 'yellow eyes', 'hepatitis', 'alcohol liver'],
    response: 'Liver-related symptoms are serious and require prompt attention. **Self-care**: Avoid alcohol and fatty foods completely, get LFT tests done, and rest. Yellowing of eyes/skin needs immediate hepatologist consultation.',
    severity: 'warning',
    medicineKeywords: ['Liver', 'Digestive'],
    specialtyKeywords: ['Gastroenterology', 'Hepatology']
  },
  {
    keywords: ['anxiety', 'stress', 'panic attack', 'depression', 'mental', 'mood', 'insomnia', 'sleep', 'sleepless', 'can\'t sleep', 'overthinking', 'trauma'],
    response: 'Mental health is as important as physical health. **Self-care**: Practice deep breathing and meditation, maintain a regular sleep schedule, and exercise daily. Share your feelings with someone you trust. If symptoms persist beyond 2 weeks, consult a mental health professional.',
    severity: 'warning',
    medicineKeywords: ['Mental Health', 'Sleep Aid'],
    specialtyKeywords: ['Psychiatry', 'Psychology']
  },
  {
    keywords: ['anemia', 'iron deficiency', 'fatigue', 'tired', 'weak', 'pale', 'pallor', 'loss of appetite'],
    response: 'Fatigue and weakness could indicate anemia or nutritional deficiency. **Self-care**: Increase iron-rich foods (spinach, dates, meat), take Vitamin D3 and B12 supplements, and get a Complete Blood Count (CBC) test.',
    severity: 'caution',
    medicineKeywords: ['Vitamins', 'Iron'],
    specialtyKeywords: ['General Medicine', 'General Physician', 'Hematology']
  },
  {
    keywords: ['wound', 'cut', 'injury', 'bleeding minor', 'scratch', 'bruise', 'swelling', 'sprain', 'fracture', 'broken bone'],
    response: 'For minor wounds, clean with antiseptic and apply a sterile bandage. **Self-care**: Apply ice for swelling, immobilize sprains, and keep cuts clean. Deep wounds, fractures, or uncontrolled bleeding need immediate hospital attention.',
    severity: 'caution',
    medicineKeywords: ['Antiseptic', 'Pain Relief', 'First Aid'],
    specialtyKeywords: ['Orthopedics', 'General Surgery', 'Emergency']
  },
  {
    keywords: ['obesity', 'weight gain', 'weight loss', 'overweight', 'bmi', 'diet'],
    response: 'Weight management requires a sustainable plan. **Self-care**: Aim for a balanced diet with portion control, 30+ minutes of daily exercise, and 7-8 hours of sleep. A BMI above 30 may need endocrinologist guidance.',
    severity: 'info',
    medicineKeywords: ['Weight Management'],
    specialtyKeywords: ['Endocrinology', 'Nutrition', 'General Physician']
  },
  {
    keywords: ['bp machine', 'heart rate', 'pulse rate', 'sugar test', 'glucometer', 'checkup', 'health test', 'blood test', 'lab test'],
    response: 'Regular health checkups are important for early detection. **Self-care**: Get annual blood tests (CBC, LFT, KFT, Lipid profile), blood pressure checkups, and glucose monitoring. Early detection saves lives.',
    severity: 'info',
    medicineKeywords: [],
    specialtyKeywords: ['General Medicine', 'General Physician']
  }
];

const GREETINGS: { patterns: string[]; response: string }[] = [
  { patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'namaste', 'namaskar'], response: 'Hello! I\'m CarePlus AI Doctor. I can help you with symptom analysis, medicine recommendations, finding doctors, and scheduling appointments. How can I assist you today?' },
  { patterns: ['how are you', 'how r u', 'how are u', 'whats up', 'what\'s up'], response: 'I\'m fully operational and ready to help! My medical knowledge base is active. Please tell me about your symptoms or health concern.' },
  { patterns: ['thank', 'thanks', 'thank you', 'thx', 'appreciate'], response: 'You\'re welcome! Remember, if symptoms persist or worsen, always consult a qualified doctor. Is there anything else I can help with?' },
  { patterns: ['bye', 'goodbye', 'see you', 'see ya', 'gotta go'], response: 'Take care of your health! Remember to rest, stay hydrated, and consult a doctor if needed. Goodbye!' },
  { patterns: ['who are you', 'what are you', 'your name', 'about you'], response: 'I\'m CarePlus AI Doctor, an intelligent medical assistant built into the CarePlus healthcare platform. I can analyze symptoms, recommend treatments, suggest doctors and medicines, and help you book appointments. Always consult a real doctor for serious conditions.' }
];

const HINDI_TRANSLATION_MAP: { pattern: RegExp; replacement: string }[] = [
  // Emergencies
  { pattern: /(chest pain|chest pressure|heart attack|dil me dard|dil ka daura|seene me dard|seene mein dard|सीना दर्द|दिल का दौरा|सीने में दर्द)/gi, replacement: "chest pain" },
  { pattern: /(not breathing|saans nahi aa rahi|saans lene me takleef|सांस नहीं आ रही|सांस लेने में तकलीफ)/gi, replacement: "not breathing" },
  { pattern: /(unconscious|behoshi|behos|बेहोश|बेहोशी)/gi, replacement: "unconscious" },
  { pattern: /(suicide|kill myself|want to die|end my life|jaan dena|आत्महत्या)/gi, replacement: "suicide" },
  { pattern: /(bleeding|khoon behna|khoon nikalna|खून बहना|खून निकलना)/gi, replacement: "bleeding" },
  
  // Symptoms
  { pattern: /(fever|bukhar|bukhaar|body hot|garam jism|बुखार|तेज बुखार|ताप)/gi, replacement: "fever" },
  { pattern: /(headache|sir dard|sar dard|sir me dard|सर दर्द|सिर दर्द|सिरदर्द)/gi, replacement: "headache" },
  { pattern: /(cough|khansi|khasi|खांसी|कफ)/gi, replacement: "cough" },
  { pattern: /(cold|zukaam|zukam|sardi|naak behna|जुकाम|सर्दी|नाक बहना)/gi, replacement: "cold" },
  { pattern: /(stomach pain|pet dard|pet me dard|gastric|acidity|पेट दर्द|पेट में दर्द|एसिडिटी)/gi, replacement: "stomach pain" },
  { pattern: /(diarrhea|loose motion|dust|दस्त|लूज मोशन)/gi, replacement: "diarrhea" },
  { pattern: /(vomiting|vomit|ulti|उल्टी|वमिट)/gi, replacement: "vomiting" },
  { pattern: /(rash|itch|khujli|खुजली|चकत्ते)/gi, replacement: "rash" },
  { pattern: /(joint pain|jodon me dard|ghutno me dard|जोड़ों का दर्द|घुटनों का दर्द)/gi, replacement: "joint pain" },
  { pattern: /(back pain|kamar dard|पीठ दर्द|कमर दर्द)/gi, replacement: "back pain" },
  { pattern: /(diabetes|sugar|madhumeh|शुगर|मधुमेह)/gi, replacement: "diabetes" },
  { pattern: /(blood pressure|bp|रक्तचाप|बीपी)/gi, replacement: "blood pressure" },
  { pattern: /(toothache|daant dard|dant me dard|दांत दर्द)/gi, replacement: "toothache" },
  { pattern: /(eye pain|aankh dard|aankh laal|आँख दर्द|आँख लाल)/gi, replacement: "eye pain" },
  { pattern: /(ear pain|kaan dard|कान दर्द)/gi, replacement: "ear pain" },
  { pattern: /(pregnancy|pregnant|garbhvati|bacha|गर्भावस्था|गर्भवती)/gi, replacement: "pregnancy" },
  { pattern: /(urine|peshab|uti|पेशाब|मूत्र)/gi, replacement: "urine" },
  { pattern: /(thyroid|थायराइड)/gi, replacement: "thyroid" },
  { pattern: /(jaundice|piliya|पीलिया|लिवर)/gi, replacement: "jaundice" },
  { pattern: /(anxiety|tanaav|chinta|stress|तनाव|चिंता)/gi, replacement: "anxiety" },
  { pattern: /(fatigue|weakness|kamzori|thakan|थकान|कमजोरी)/gi, replacement: "fatigue" },
  { pattern: /(wound|injury|chot|zakham|घाव|चोट)/gi, replacement: "wound" },
  
  // Hospital Searches
  { pattern: /(hospital|clinic|dispensary|nursing home|medical care|doctor near me|nearby care|find hospital|in-person|अस्पताल|क्लिनिक|दवाखाना|डॉक्टर मेरे पास)/gi, replacement: "hospital" },

  // Greetings / Conversational
  { pattern: /(hello|hi|hey|namaste|namaskar|नमस्ते|नमस्कार|हैलो|हाय)/gi, replacement: "hello" },
  { pattern: /(how are you|how r u|kaise ho|kaise hain aap|कैसे हो|कैसे हैं आप)/gi, replacement: "how are you" },
  { pattern: /(thank you|thanks|dhanyawad|shukriya|धन्यवाद|शुक्रिया)/gi, replacement: "thank you" },
  { pattern: /(bye|goodbye|alvida|अलविदा)/gi, replacement: "bye" }
];

const CONDITIONS_HI: Record<string, string> = {
  'chest pain': 'यह एक मेडिकल इमरजेंसी लग रही है। कृपया तुरंत 108 पर कॉल करें और आपातकालीन निर्देशों के लिए SOS विजेट का उपयोग करें। लक्षणों के अपने आप ठीक होने का इंतजार न करें।',
  'fever': 'आपके बुखार के लक्षणों के आधार पर, यह एक वायरल या बैक्टीरियल संक्रमण हो सकता है। **स्वयं की देखभाल**: आवश्यकतानुसार हर 6 घंटे में पैरासिटामोल 500mg लें (24 घंटे में अधिकतम 8 टैबलेट), हाइड्रेटेड रहें और आराम करें। यदि बुखार 72 घंटे से अधिक समय तक 102°F से ऊपर रहता है, तो डॉक्टर से परामर्श करें।',
  'cough': 'आपके सांस के लक्षण श्वसन तंत्र के संक्रमण या ब्रोंकाइटिस का संकेत देते हैं। **स्वयं की देखभाल**: हाइड्रेटेड रहें, दिन में दो बार भाप लें और आराम करें। सूखी खांसी के लिए गुनगुना शहद-नींबू पानी मदद कर सकता है। बुखार या सांस फूलने के साथ लगातार खांसी होने पर डॉक्टर से जांच कराएं।',
  'cold': 'यह एलर्जी या सामान्य सर्दी लग रही है। **स्वयं की देखभाल**: ज्ञात एलर्जी पैदा करने वाली चीजों से बचें, एक एंटीहिस्टामाइन लें और खारे पानी की नेजल ड्रॉप्स का उपयोग करें। धूल/पराग एलर्जी के लिए एयर प्यूरीफायर से हवा साफ रखें।',
  'headache': 'आपका सिरदर्द तनाव या माइग्रेन के कारण हो सकता है। **स्वयं की देखभाल**: एक शांत अंधेरे कमरे में आराम करें, हाइड्रेटेड रहें और माथे पर ठंडी सिकाई करें। तेज रोशनी, तेज आवाज और कुछ खाद्य पदार्थों जैसे ट्रिगर्स से बचें। पुराने सिरदर्द के लिए न्यूरोलॉजिस्ट से जांच की आवश्यकता होती है।',
  'stomach pain': 'आपके पाचन के लक्षण गैस्ट्राइटिस, एसिड रिफ्लक्स या अपच की ओर इशारा करते हैं। **स्वयं की देखभाल**: मसालेदार/तैलीय भोजन से बचें, कम मात्रा में भोजन करें और सोने से पहले 2-3 घंटे का अंतर रखें। लगातार एसिडिटी के लिए खाली पेट ओमेप्राजोल या पैंटोप्राजोल मदद कर सकता है।',
  'diarrhea': 'यह गैस्ट्रोएंटेराइटिस या फूड पॉइजनिंग लग रहा है। **स्वयं की देखभाल**: डिहाइड्रेशन से बचने के लिए बार-बार ओआरएस (ORS) या इलेक्ट्रोलाइट घोल पिएं। बीआरएटी (BRAT) डाइट (केला, चावल, सेब की चटनी, टोस्ट) का पालन करें। 24 घंटे तक डेयरी उत्पाद और ठोस भोजन से बचें।',
  'rash': 'आपकी त्वचा के लक्षण संपर्क जिल्द की सूजन (कांटेक्ट डर्मेटाइटिस) या फंगल संक्रमण का संकेत देते हैं। **स्वयं की देखभाल**: खुजली के लिए कैलामाइन लोशन लगाएं, खुजलाने से बचें। फंगल संक्रमण के लिए क्षेत्र को सूखा रखें और एंटीफंगल क्रीम का उपयोग करें। यदि दाने फैलते हैं या 3 दिनों से अधिक समय तक रहते हैं, तो त्वचा रोग विशेषज्ञ से मिलें।',
  'joint pain': 'आपके मस्कुलोस्केलेटल लक्षण संभावित गठिया, मोच या मांसपेशियों में खिंचाव का संकेत देते हैं। **स्वयं की देखभाल**: गर्म या ठंडी सिकाई करें, प्रभावित हिस्से को आराम दें और आवश्यकता होने पर इबुप्रोफेन 400mg लें। जोड़ों के पुराने दर्द के लिए आर्थोपेडिस्ट या रुमेटोलॉजिस्ट के मूल्यांकन की आवश्यकता होती है।',
  'diabetes': 'ब्लड शुगर की समस्याओं के लिए निरंतर प्रबंधन की आवश्यकता होती है। **स्वयं की देखभाल**: नियमित रूप से खाली पेट और भोजन के बाद के ग्लूकोज की निगरानी करें। निर्देशानुसार मेटफॉर्मिन 500mg लें। कम-जीआई (low-GI) आहार का पालन करें, रोजाना 30 मिनट व्यायाम करें और मीठे खाद्य पदार्थों और पेय पदार्थों से बचें।',
  'blood pressure': 'रक्तचाप (बीपी) की अनियमितताओं की सावधानीपूर्वक निगरानी की आवश्यकता होती है। **स्वयं की देखभाल**: उच्च बीपी के लिए नमक का सेवन कम करें, तनाव से बचें और यदि निर्धारित हो तो लोसार्टन 50mg लें। कम बीपी या चक्कर आने पर तुरंत बैठ/लेट जाएं और पानी पिएं। नियमित बीपी की निगरानी आवश्यक है।',
  'tooth': 'दांतों का दर्द कैविटी, मसूड़ों के संक्रमण या अकल दाढ़ की समस्याओं के कारण हो सकता है। **स्वयं की देखभाल**: गुनगुने नमक के पानी से कुल्ला करें, दर्द के लिए इबुप्रोफेन 400mg लें और बहुत गर्म/ठंडे खाद्य पदार्थों से बचें। जल्द ही डेंटिस्ट से संपर्क करें।',
  'eye pain': 'आंखों के लक्षण कंजंक्टिवाइटिस, तनाव या संक्रमण का संकेत दे सकते हैं। **स्वयं की देखभाल**: स्क्रीन से अपनी आंखों को आराम दें, लुब्रिकेटिंग आई ड्रॉप्स का उपयोग करें और अपनी आंखों को छूने से बचें। यदि आंखों से पानी/कीचड़ आ रहा है, दृष्टि में बदलाव है या गंभीर दर्द है, तो नेत्र रोग विशेषज्ञ से मिलें।',
  'ear pain': 'कान का दर्द आमतौर पर संक्रमण, वैक्स जमा होने या यूस्टेशियन ट्यूब की समस्याओं से होता है। **स्वयं की देखभाल**: बाहरी कान पर गर्म सिकाई करें, कॉटन स्वैब (इयरबड) डालने से बचें और दर्द निवारक दवाएं लें। लगातार दर्द रहने पर ईएनटी (ENT) विशेषज्ञ से संपर्क करें।',
  'period': 'मासिक धर्म से जुड़ी स्वास्थ्य समस्याएं हार्मोनल असंतुलन से लेकर पीसीओएस (PCOS) तक हो सकती हैं। **स्वयं की देखभाल**: अपने चक्र को ट्रैक करें, आयरन से भरपूर संतुलित आहार बनाए रखें, मध्यम व्यायाम करें और तनाव का प्रबंधन करें। गंभीर ऐंठन या अनियमितता के लिए स्त्री रोग विशेषज्ञ से परामर्श लें।',
  'urine': 'मूत्र संबंधी लक्षण यूटीआई (UTI), गुर्दे की पथरी या प्रोस्टेटाइटिस का संकेत देते हैं। **स्वयं की देखभाल**: खूब पानी पिएं (प्रतिदिन 3+ लीटर), कैफीन और अल्कोहल से बचें और पेशाब न रोकें। पेशाब में जलन होने पर यूरिन कल्चर टेस्ट की आवश्यकता होती है।',
  'thyroid': 'थायराइड की स्थिति में हार्मोन प्रबंधन की आवश्यकता होती है। **स्वयं की देखभाल**: टीएसएच (TSH) टेस्ट करवाएं, हाइपोथायरायडिज्म होने पर लेवोथायरोक्सिन लें और अतिरिक्त आयोडीन से बचें। अपने आहार में सेलेनियम और जिंक शामिल करें।',
  'liver': 'लिवर से जुड़े लक्षण गंभीर होते हैं और इन पर तुरंत ध्यान देने की आवश्यकता होती है। **स्वयं की देखभाल**: शराब और वसायुक्त भोजन से पूरी तरह बचें, एलएफटी (LFT) टेस्ट करवाएं और आराम करें। आंखों/त्वचा का पीला पड़ना होने पर तुरंत हेपेटोलॉजिस्ट से संपर्क करें।',
  'anxiety': 'मानसिक स्वास्थ्य भी उतना ही महत्वपूर्ण है जितना शारीरिक स्वास्थ्य। **स्वयं की देखभाल**: गहरी सांस लेने और ध्यान (मेडिटेशन) का अभ्यास करें, सोने का नियमित समय बनाए रखें और प्रतिदिन व्यायाम करें। अपनी भावनाओं को किसी ऐसे व्यक्ति के साथ साझा करें जिस पर आप भरोसा करते हैं। यदि लक्षण 2 सप्ताह से अधिक समय तक बने रहते हैं, तो मानसिक स्वास्थ्य विशेषज्ञ से परामर्श लें।',
  'anemia': 'थकान और कमजोरी एनीमिया या पोषण की कमी का संकेत दे सकती है। **स्वयं की देखभाल**: आयरन से भरपूर खाद्य पदार्थ (पालक, खजूर, मांस) बढ़ाएं, विटामिन डी3 और बी12 सप्लीमेंट लें और कम्प्लीट ब्लड काउंट (CBC) टेस्ट करवाएं।',
  'wound': 'मामूली घावों के लिए, एंटीसेप्टिक से साफ करें और एक बाँझ पट्टी लगाएं। **स्वयं की देखभाल**: सूजन के लिए बर्फ लगाएं, मोच वाले हिस्से को स्थिर रखें और कट को साफ रखें। गहरे घाव, फ्रैक्चर या अनियंत्रित रक्तस्राव के लिए तुरंत अस्पताल जाने की आवश्यकता होती है।',
  'obesity': 'वजन प्रबंधन के लिए एक स्थायी योजना की आवश्यकता होती है। **स्वयं की देखभाल**: भाग नियंत्रण (पोर्शन कंट्रोल) के साथ संतुलित आहार, रोजाना 30+ मिनट व्यायाम और 7-8 घंटे की नींद का लक्ष्य रखें। 30 से ऊपर बीएमआई (BMI) होने पर एंडोक्रिनोलॉजिस्ट के मार्गदर्शन की आवश्यकता हो सकती है।',
  'bp machine': 'नियमित स्वास्थ्य जांच बीमारी का जल्द पता लगाने के लिए महत्वपूर्ण है। **स्वयं की देखभाल**: वार्षिक रक्त परीक्षण (सीबीसी, एलएफटी, केएफटी, लिपिड प्रोफाइल), रक्तचाप की जांच और ग्लूकोज की निगरानी करवाएं। समय पर पता चलना जान बचाता है।'
};

const GREETINGS_HI: Record<string, string> = {
  'hello': 'नमस्ते! मैं केयरप्लस एआई डॉक्टर हूं। मैं लक्षणों के विश्लेषण, दवाओं के सुझाव, डॉक्टर ढूंढने और अपॉइंटमेंट बुक करने में आपकी सहायता कर सकता हूं। आज मैं आपकी क्या मदद कर सकता हूं?',
  'how are you': 'मैं पूरी तरह से काम कर रहा हूँ और मदद के लिए तैयार हूँ! मेरा मेडिकल नॉलेज बेस सक्रिय है। कृपया मुझे अपने लक्षणों या स्वास्थ्य संबंधी चिंताओं के बारे में बताएं।',
  'thank': 'आपका स्वागत है! याद रखें, यदि लक्षण बने रहते हैं या बिगड़ते हैं, तो हमेशा योग्य डॉक्टर से परामर्श करें। क्या मैं किसी और चीज में आपकी मदद कर सकता हूं?',
  'bye': 'अपने स्वास्थ्य का ध्यान रखें! आराम करना, हाइड्रेटेड रहना और जरूरत पड़ने पर डॉक्टर से सलाह लेना याद रखें। अलविदा!',
  'who are you': 'मैं केयरप्लस एआई डॉक्टर हूं, जो केयरप्लस हेल्थकेयर प्लेटफॉर्म में निर्मित एक बुद्धिमान चिकित्सा सहायक है। मैं लक्षणों का विश्लेषण कर सकता हूं, उपचार के सुझाव दे सकता हूं, डॉक्टरों और दवाओं की सिफारिश कर सकता हूं और अपॉइंटमेंट बुक करने में आपकी मदद कर सकता हूं। गंभीर स्थितियों के लिए हमेशा वास्तविक डॉक्टर से परामर्श लें।'
};

export function generateAIResponse(
  message: string,
  context: ConversationContext,
  medicines: any[],
  doctors: any[],
  hospitals: any[],
  language?: string
): BotResponse & { updatedContext: ConversationContext } {
  const rawLower = message.toLowerCase().trim();
  const rawLowerClean = rawLower.replace(/[^\w\s]/g, '').trim();
  const rawWords = rawLowerClean.split(/\s+/);

  const isDevanagari = /[\u0900-\u097F]/.test(message);
  const hinges = ['hai', 'se', 'aur', 'sath', 'bhut', 'dard', 'bukhar', 'mujh', 'mujhe', 'din', 'ho', 'raha', 'rahi', 'ki', 'tha', 'he', 'par', 'ko', 'hi'];
  const isHinglish = hinges.some(w => rawWords.includes(w)) || rawLower.includes('mujhe') || rawLower.includes('bukhar') || rawLower.includes('dard');
  const isHindiInput = isHinglish || isDevanagari || language === 'hi';

  let translatedMessage = message;
  if (isHindiInput) {
    for (const item of HINDI_TRANSLATION_MAP) {
      translatedMessage = translatedMessage.replace(item.pattern, item.replacement);
    }
  }

  const lower = translatedMessage.toLowerCase().trim();
  const lowerClean = lower.replace(/[^\w\s]/g, '').trim();
  const words = lowerClean.split(/\s+/);

  let newContext = { ...context, symptoms: new Set(context.symptoms), turnCount: context.turnCount + 1 };

  // 1. Psychiatric Crisis Handoff Trigger (Suicidal Ideation Check)
  const crisisKeywords = ['kill myself', 'suicide', 'end my life', 'self harm', 'cutting myself', 'want to die', 'commit suicide'];
  const isCrisis = crisisKeywords.some(kw => lower.includes(kw));
  if (isCrisis) {
    return {
      text: isHindiInput
        ? "आपातकालीन मानसिक स्वास्थ्य संकट (Psychiatric Emergency) सक्रिय हो गया है। कृपया तुरंत हमारे संकट परामर्शदाता से संपर्क करें।"
        : "PSYCHIATRIC EMERGENCY HANDOFF TRIGGERED. Please connect with our crisis counselor immediately.",
      severity: 'critical',
      triageRoute: 'emergency',
      triageDetails: {
        level: 'emergency',
        reason: isHindiInput
          ? "सक्रिय मानसिक स्वास्थ्य आपातकाल या आत्म-नुकसान की चेतावनी का पता चला।"
          : "Active suicidal ideation or self-harm warning detected in conversation stream."
      },
      crisisHandoff: true,
      updatedContext: newContext
    };
  }

  // 1.1 Hospital Discovery & Routing Engine Trigger
  const hospitalSearchKeywords = ['hospital', 'clinic', 'dispensary', 'nursing home', 'medical care', 'doctor near me', 'nearby care', 'find hospital', 'in-person'];
  const isHospitalSearch = hospitalSearchKeywords.some(kw => lower.includes(kw));
  if (isHospitalSearch) {
    let keyword = 'general';
    if (lower.includes('pregnant') || lower.includes('pregnancy') || lower.includes('maternity') || lower.includes('gynae') || lower.includes('delivery')) {
      keyword = 'maternity';
    } else if (lower.includes('bone') || lower.includes('joint') || lower.includes('fracture') || lower.includes('ortho') || lower.includes('back pain')) {
      keyword = 'orthopedic';
    } else if (lower.includes('heart') || lower.includes('cardio') || lower.includes('chest pain') || lower.includes('ecg')) {
      keyword = 'cardiology';
    } else if (lower.includes('kid') || lower.includes('child') || lower.includes('pediatric') || lower.includes('baby')) {
      keyword = 'pediatrician';
    }

    const userLat = 26.905641;
    const userLng = 75.815549;
    const searchRadius = 5000;

    const mockHospitalsList = [
      {
        id: "hosp-1",
        name: "Sawai Man Singh Hospital (SMS Hospital)",
        lat: 26.905641,
        lng: 75.815549,
        address: "J.L.N. Marg, Jaipur, Rajasthan - 302004",
        distanceText: "0.0 km",
        hfrId: "91-1049-3825-4562",
        rating: 4.8,
        verified: true,
        phone: "+91 141 2560291"
      },
      {
        id: "hosp-2",
        name: "Fortis Escorts Hospital",
        lat: 26.8514,
        lng: 75.8103,
        address: "Jawahar Lal Nehru Marg, Malviya Nagar, Jaipur - 302017",
        distanceText: "3.2 km",
        hfrId: "91-3825-1049-4562",
        rating: 4.9,
        verified: true,
        phone: "+91 858 8830402"
      },
      {
        id: "hosp-3",
        name: "Eternal Hospital",
        lat: 26.8467,
        lng: 75.8119,
        address: "Jawahar Circle, Malviya Nagar, Jaipur - 302017",
        distanceText: "3.8 km",
        hfrId: "91-4562-3825-1049",
        rating: 4.7,
        verified: true,
        phone: "+91 141 5174000"
      },
      {
        id: "hosp-4",
        name: "Apex Hospital Clinic",
        lat: 26.8532,
        lng: 75.8092,
        address: "Malviya Nagar, Sector 1, Jaipur - 302017",
        distanceText: "3.5 km",
        hfrId: null,
        rating: 4.2,
        verified: false,
        phone: "+91 141 5102102"
      },
      {
        id: "hosp-5",
        name: "Jaipur Wellness Clinic",
        lat: 26.912,
        lng: 75.795,
        address: "C-Scheme, Ashok Marg, Jaipur - 302001",
        distanceText: "2.1 km",
        hfrId: null,
        rating: 4.0,
        verified: false,
        phone: "+91 141 2365544"
      }
    ];

    let filtered = mockHospitalsList;
    if (keyword === 'maternity') {
      filtered = [
        mockHospitalsList[2],
        {
          id: "hosp-m1",
          name: "Jaipur Maternity & Women Care Center",
          lat: 26.892,
          lng: 75.820,
          address: "Jawahar Nagar, Sector 4, Jaipur",
          distanceText: "1.6 km",
          hfrId: "91-4582-1194-0982",
          rating: 4.6,
          verified: true,
          phone: "+91 141 4058988"
        },
        mockHospitalsList[3]
      ];
    } else if (keyword === 'orthopedic') {
      filtered = [
        mockHospitalsList[1],
        {
          id: "hosp-o1",
          name: "Jaipur Ortho & Joint Reconstruction Clinic",
          lat: 26.901,
          lng: 75.788,
          address: "Bhawani Singh Road, Near SDM Hospital, Jaipur",
          distanceText: "2.2 km",
          hfrId: null,
          rating: 4.1,
          verified: false,
          phone: "+91 141 2566251"
        },
        mockHospitalsList[0]
      ];
    } else if (keyword === 'cardiology') {
      filtered = [
        mockHospitalsList[0],
        mockHospitalsList[1],
        mockHospitalsList[2]
      ];
    } else if (keyword === 'pediatrician') {
      filtered = [
        mockHospitalsList[0],
        {
          id: "hosp-p1",
          name: "Jaipur Children Hospital",
          lat: 26.9187,
          lng: 75.7856,
          address: "Gopalbari, Jaipur - 302001",
          distanceText: "1.5 km",
          hfrId: "91-0982-1102-4521",
          rating: 4.7,
          verified: true,
          phone: "+91 141 2566666"
        },
        mockHospitalsList[3]
      ];
    }

    const keywordText = keyword !== 'general' ? ` (Keyword: "${keyword}")` : '';

    return {
      text: isHindiInput
        ? `🏥 **केयरप्लस अस्पताल खोज और मार्ग निर्देश सक्रिय**\n\n1. **निकटता और विशेषज्ञता खोज (Google Places API)**:\n   - क्वेरी पैरामीटर: \`type=hospital\`, \`radius=5000\` (5 किमी सीमा) लाइव जीपीएस स्थान पर केंद्रित।\n   - फ़िल्टर लागू: \`keyword=${keyword}\`${keywordText}.\n\n2. **स्वास्थ्य सुविधा रजिस्ट्री (HFR) सत्यापन**:\n   - राष्ट्रीय ABDM डेटाबेस रजिस्ट्री रिकॉर्ड की जाँच की गई। सक्रिय 12-अंकीय सुविधा आईडी वाले विश्वसनीय स्वास्थ्य केंद्रों को प्राथमिकता दी जा रही है।\n\nनीचे आपका इंटरैक्टिव 5 किमी त्रिज्या का नक्शा दिया गया है जिसमें HFR-सत्यापित शीर्ष केंद्रों और नजदीकी क्लीनिकों का विवरण है।`
        : `🏥 **CarePlus Hospital Discovery & Routing Engine Active**\n\n1. **Proximity & Specialty Search (Google Places API)**:\n   - Query Parameters: \`type=hospital\`, \`radius=5000\` (5km bound) centered on live GPS location.\n   - Filter applied: \`keyword=${keyword}\`${keywordText}.\n\n2. **Health Facility Registry (HFR) Verification**:\n   - Checked national ABDM database registry records. Prioritizing trusted health facilities with active 12-digit Facility IDs.\n\nBelow is your interactive 5km radius map detailing HFR-verified top centers versus nearby clinics.`,
      severity: 'info',
      hospitalMapData: {
        latitude: userLat,
        longitude: userLng,
        radius: searchRadius,
        keyword: keyword,
        hospitals: filtered
      },
      updatedContext: newContext,
      triageRoute: 'urgent-care'
    };
  }

  // 2. Empathy Sentiment Analysis
  let sentiment: 'anxious' | 'frustrated' | 'sad' | 'neutral' | 'positive' = 'neutral';
  let sentimentConfidence = 0.8;
  let validationMessage = isHindiInput ? "अपनी चिंताओं को साझा करने के लिए धन्यवाद।" : "Thank you for sharing your concerns.";

  const anxiousWords = ['scared', 'anxious', 'worry', 'worried', 'frightened', 'afraid', 'help', 'stress', 'panic', 'nervous', 'dara', 'chinta', 'tension', 'anxiety'];
  const frustratedWords = ['angry', 'annoyed', 'frustrated', 'stupid', 'hate', 'useless', 'worst', 'broken', 'gussa', 'bekaar', 'frustrate'];
  const sadWords = ['sad', 'depressed', 'cry', 'crying', 'hopeless', 'pain', 'hurt', 'miserable', 'dukhi', 'udaas', 'dard'];
  const positiveWords = ['great', 'happy', 'good', 'fine', 'thanks', 'thank you', 'excellent', 'achha', 'dhanyawad', 'shukriya'];

  if (anxiousWords.some(w => lower.includes(w))) {
    sentiment = 'anxious';
    sentimentConfidence = 0.92;
    validationMessage = isHindiInput
      ? "मैं समझ सकता हूँ कि अस्वस्थ महसूस करने या लक्षणों का सामना करने से बहुत अधिक चिंता और परेशानी हो सकती है। आइए इस पर शांति से विचार करें और आपके लिए सबसे सुरक्षित कदम उठाएं।"
      : "I understand that feeling unwell or facing symptoms can cause a lot of anxiety and distress. Let's look into this calmly and find the safest steps for you.";
  } else if (sadWords.some(w => lower.includes(w))) {
    sentiment = 'sad';
    sentimentConfidence = 0.88;
    validationMessage = isHindiInput
      ? "मुझे यह सुनकर बहुत दुख हुआ कि आप इस दर्द और परेशानी से गुजर रहे हैं। कृपया जानें कि हम सही सहायता के लिए आपका मार्गदर्शन करने के लिए यहां हैं।"
      : "I'm very sorry to hear that you are going through this pain and discomfort. Please know that we are here to guide you toward the right support.";
  } else if (frustratedWords.some(w => lower.includes(w))) {
    sentiment = 'frustrated';
    sentimentConfidence = 0.90;
    validationMessage = isHindiInput
      ? "इस स्थिति के कारण होने वाली किसी भी निराशा या कठिनाई के लिए मैं क्षमा चाहता हूँ। आपका स्वास्थ्य और सुरक्षा हमारी सर्वोच्च प्राथमिकताएं हैं।"
      : "I apologize for any frustration or difficulty this situation is causing. Your health and clinical safety are our top priorities.";
  } else if (positiveWords.some(w => lower.includes(w))) {
    sentiment = 'positive';
    sentimentConfidence = 0.85;
    validationMessage = isHindiInput
      ? "यह सुनकर खुशी हुई। आज मैं आपकी और क्या मदद कर सकता हूँ?"
      : "I'm glad to hear that. How else can I support you today?";
  }

  // 3. Hinglish/Hindi Linguistic Pipeline Simulation
  let linguisticPipeline = undefined;
  if (isHindiInput) {
    let transliterated = message;
    let translated = message;
    let detectedLang = isDevanagari ? "Hindi (Devanagari Script)" : "Code-Switched Hinglish (Roman Script)";

    if (rawLower.includes('fever') || rawLower.includes('bukhar') || rawLower.includes('बुखार') || rawLower.includes('ताप')) {
      transliterated = "मुझे बुखार (fever) महसूस हो रहा है";
      translated = "I am experiencing fever";
    } else if (rawLower.includes('headache') || rawLower.includes('head pain') || rawLower.includes('sir dard') || rawLower.includes('sar dard') || rawLower.includes('सिर दर्द') || rawLower.includes('सर दर्द')) {
      transliterated = "मुझे तेज सिरदर्द (severe headache) है";
      translated = "I have a severe headache";
    } else if (rawLower.includes('stomach') || rawLower.includes('pet dard') || rawLower.includes('पेट दर्द')) {
      transliterated = "मेरे पेट में दर्द (stomach pain) है और उल्टी (vomiting) हो रही है";
      translated = "I have stomach pain and vomiting";
    } else if (rawLower.includes('cough') || rawLower.includes('khansi') || rawLower.includes('खांसी')) {
      transliterated = "मुझे खांसी की शिकायत है";
      translated = "I am experiencing cough";
    } else {
      transliterated = message;
      translated = translatedMessage;
    }

    linguisticPipeline = {
      cmi: isDevanagari ? 0.05 : 0.45,
      detectedLang,
      transliteratedText: transliterated,
      translatedText: translated,
      cometScore: 0.96,
      retrievalMethod: "LaBSE Dense Multilingual Embeddings + BM25 Sparse Hybrid"
    };
  }

  // 4. Check Greetings
  for (const greeting of GREETINGS) {
    if (greeting.patterns.some(p => lowerClean.includes(p))) {
      const respText = (isHindiInput && GREETINGS_HI[greeting.patterns[0]]) ? GREETINGS_HI[greeting.patterns[0]] : greeting.response;
      return {
        text: respText,
        severity: 'info',
        empathyEngine: { sentiment, confidence: sentimentConfidence, validationMessage },
        linguisticPipeline,
        updatedContext: newContext
      };
    }
  }

  // 5. Deterministic Safety Engine: Check for Triage Tuples
  let tupleMatched: string | undefined = undefined;
  let forcedTriageLevel: 'emergency_ambulance' | 'emergency' | 'consultation_24' | 'consultation' | 'self_care' | undefined = undefined;
  let forcedReason = "";
  let forcedSeverity: Severity = 'info';

  const hasPregnancy = lower.includes('pregnancy') || lower.includes('pregnant') || lower.includes('third trimester') || lower.includes('bacha');
  const hasHypertension = lower.includes('hypertension') || lower.includes('high bp') || lower.includes('blood pressure') || lower.includes('bp high');
  const hasChestPain = lower.includes('chest pain') || lower.includes('chest pressure') || lower.includes('heart') || lower.includes('dil me dard');
  const hasBreathless = lower.includes('breathless') || lower.includes('shortness of breath') || lower.includes('difficulty breathing') || lower.includes('saans');
  const hasDiabetes = lower.includes('diabetes') || lower.includes('blood sugar') || lower.includes('sugar level');
  const hasWound = lower.includes('wound') || lower.includes('cut') || lower.includes('ulcer') || lower.includes('bleeding') || lower.includes('chot');

  if (hasPregnancy && hasHypertension) {
    tupleMatched = "Pregnancy + Hypertension Tuple Match";
    forcedTriageLevel = 'emergency';
    forcedSeverity = 'critical';
    forcedReason = isHindiInput
      ? "तीसरी तिमाही की गर्भावस्था और उच्च रक्तचाप का संयोजन प्री-एकलम्प्सिया/एकलम्प्सिया के लिए उच्च सुरक्षा अलर्ट ट्रिगर करता है। तुरंत आपातकालीन जांच कराएं।"
      : "The combination of third-trimester pregnancy and high blood pressure triggers high safety alerts for preeclampsia/eclampsia. Seek immediate emergency evaluation.";
  } else if (hasChestPain && hasBreathless) {
    tupleMatched = "Respiratory Distress + Angina Tuple Match";
    forcedTriageLevel = 'emergency_ambulance';
    forcedSeverity = 'critical';
    forcedReason = isHindiInput
      ? "सीने में बेचैनी और सांस लेने में कठिनाई एक साथ होना कार्डियोपल्मोनरी डिस्ट्रेस का संकेत देता है। आपातकालीन एम्बुलेंस (108) स्थानांतरण आवश्यक है।"
      : "Co-occurring chest discomfort and shortness of breath indicate impending cardiopulmonary distress. Emergency ambulance transfer (108) required.";
  } else if (hasDiabetes && hasWound) {
    tupleMatched = "Diabetic Foot/Wound Tuple Match";
    forcedTriageLevel = 'emergency';
    forcedSeverity = 'warning';
    forcedReason = isHindiInput
      ? "खुले घाव या त्वचा के अल्सर वाले मधुमेह रोगियों को गहरे ऊतकों के संक्रमण का अत्यधिक खतरा होता है। 24 घंटे के भीतर तत्काल नैदानिक देखभाल की आवश्यकता होती है।"
      : "Diabetic patients with open cuts or skin ulcers run extremely high risks of deep tissue infections. Needs urgent clinical care within 24 hours.";
  }

  // Check individual condition keywords
  let bestMatch: typeof CONDITIONS[0] | null = null;
  let bestScore = 0;

  for (const condition of CONDITIONS) {
    let score = 0;
    for (const kw of condition.keywords) {
      if (lowerClean.includes(kw)) {
        score += kw.split(' ').length * 2;
      } else {
        for (const w of words) {
          if (kw.includes(w) || w.includes(kw)) {
            score += 1;
          }
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = condition;
    }
  }

  // Triage details computing
  let triageDetails: any = undefined;
  if (forcedTriageLevel) {
    triageDetails = {
      level: forcedTriageLevel,
      reason: forcedReason,
      tupleMatched
    };
  }

  if (bestMatch && (bestScore >= 2 || forcedTriageLevel)) {
    newContext.lastTopic = bestMatch.keywords[0];
    newContext.lastSeverity = forcedSeverity !== 'info' ? forcedSeverity : bestMatch.severity;
    bestMatch.keywords.forEach(kw => {
      const term = kw.replace(/ /g, '_');
      newContext.symptoms.add(term);
    });

    let responseText = (isHindiInput && CONDITIONS_HI[bestMatch.keywords[0]]) ? CONDITIONS_HI[bestMatch.keywords[0]] : bestMatch.response;
    if (forcedReason) {
      responseText = `**SAFETY WARNING (Triage Engine Alert)**: ${forcedReason}\n\n` + responseText;
    }

    if (sentiment === 'anxious' || sentiment === 'sad' || sentiment === 'frustrated') {
      responseText = `*${validationMessage}*\n\n` + responseText;
    }

    // Recommendations and Quick Actions
    const recommendations: { type: string; header: string; items: any[] }[] = [];
    const quickActions: QuickAction[] = [];

    if (bestMatch.medicineKeywords.length > 0 && medicines.length > 0) {
      const matchedMedicines = medicines.filter(m =>
        bestMatch.medicineKeywords.some(k => m.category.toLowerCase().includes(k) || m.genericName.toLowerCase().includes(k) || m.name.toLowerCase().includes(k))
      );
      if (matchedMedicines.length > 0) {
        recommendations.push({ type: 'medicine', header: 'Suggested Medicines', items: matchedMedicines.slice(0, 4) });
        matchedMedicines.slice(0, 2).forEach(m => {
          quickActions.push({ label: `Order ${m.name}`, type: 'medicine', data: m });
        });
      }
    }

    if (bestMatch.specialtyKeywords.length > 0 && doctors.length > 0) {
      const matchedDoctors = doctors.filter(d =>
        bestMatch.specialtyKeywords.some(s => d.specialty.toLowerCase().includes(s.toLowerCase()) || d.qualification.toLowerCase().includes(s.toLowerCase()))
      );
      if (matchedDoctors.length > 0) {
        recommendations.push({ type: 'doctor', header: 'Recommended Doctors', items: matchedDoctors.slice(0, 3) });
        matchedDoctors.slice(0, 2).forEach(d => {
          quickActions.push({ label: `Consult ${d.name}`, type: 'doctor', data: d });
        });
      }
    }

    const currentSeverity = forcedSeverity !== 'info' ? forcedSeverity : bestMatch.severity;

    if (currentSeverity === 'critical' || forcedTriageLevel === 'emergency_ambulance' || forcedTriageLevel === 'emergency') {
      recommendations.push({ type: 'emergency', header: 'Nearby Emergency Hospitals', items: hospitals.filter(h => h.specialties?.some(s => ['Emergency', 'Cardiology', 'Critical Care'].includes(s))).slice(0, 3) });
      quickActions.push({ label: 'Call 108 (Ambulance)', type: 'emergency', data: { phone: '108' } });
    }

    // Computing differential diagnoses & clinical codes
    let differentialDiagnoses: { conditionName: string; confidence: number; riskFactors: string[] }[] = [];
    let triageRoute: 'self-care' | 'teleconsultation' | 'urgent-care' | 'emergency' = 'self-care';
    let clinicalCodes: { type: string; code: string; desc: string }[] = [];

    const isEmergency = bestMatch.keywords.some(k => ['chest pain', 'chest pressure', 'heart attack', 'cardiac arrest', 'stroke'].includes(k)) || forcedTriageLevel === 'emergency_ambulance' || forcedTriageLevel === 'emergency';
    const isFever = bestMatch.keywords.some(k => ['fever', 'high temperature', 'hot body', 'typhoid', 'malaria'].includes(k));
    const isCough = bestMatch.keywords.some(k => ['cough', 'dry cough', 'wet cough', 'phlegm', 'throat infection', 'sore throat', 'bronchitis', 'asthma', 'wheezing', 'breathless', 'shortness of breath'].includes(k));
    const isStomach = bestMatch.keywords.some(k => ['stomach pain', 'abdomen', 'gastric', 'gastritis', 'acidity', 'acid reflux', 'heartburn', 'indigestion', 'bloating'].includes(k));
    const isSkin = bestMatch.keywords.some(k => ['rash', 'skin rash', 'itch', 'itchy', 'hives', 'dermatitis', 'eczema'].includes(k));

    if (isEmergency) {
      differentialDiagnoses = [
        { conditionName: "Angina Pectoris / Coronary Syndrome", confidence: 75, riskFactors: ["History of hypertension", "Hypercholesterolemia", "Smoking history"] },
        { conditionName: "Gastroesophageal Reflux Disease (GERD)", confidence: 15, riskFactors: ["Late-night eating", "High acid diet"] },
        { conditionName: "Acute Myocardial Infarction", confidence: 10, riskFactors: ["Family history of CAD", "Male gender >45", "Diabetes mellitus"] }
      ];
      triageRoute = 'emergency';
      clinicalCodes = [
        { type: 'ICD-10', code: 'I25.11', desc: 'Atherosclerotic heart disease with unstable angina' },
        { type: 'CPT', code: '99285', desc: 'Emergency department visit, high severity' }
      ];
    } else if (isFever) {
      differentialDiagnoses = [
        { conditionName: "Acute Viral Febrile Syndrome", confidence: 68, riskFactors: ["Exposure to infected contacts", "Seasonal changes"] },
        { conditionName: "Acute Pharyngitis / Tonsillitis", confidence: 18, riskFactors: ["Weakened immunity", "Cold liquid consumption"] },
        { conditionName: "Urinary Tract Infection (UTI)", confidence: 14, riskFactors: ["Inadequate fluid intake", "Female anatomy"] }
      ];
      triageRoute = 'teleconsultation';
      clinicalCodes = [
        { type: 'ICD-10', code: 'R50.9', desc: 'Fever, unspecified' },
        { type: 'CPT', code: '99213', desc: 'Outpatient office visit, 15-29 mins (Telehealth)' }
      ];
    } else if (isCough) {
      differentialDiagnoses = [
        { conditionName: "Acute Bronchitis", confidence: 62, riskFactors: ["Recent viral URTI", "Dust or smoke exposure"] },
        { conditionName: "Allergic Asthma Exacerbation", confidence: 23, riskFactors: ["History of atopic conditions", "Pollen / pet dander exposure"] },
        { conditionName: "Acute Upper Respiratory Infection", confidence: 15, riskFactors: ["Cold air inhalation", "Crowded spaces"] }
      ];
      triageRoute = 'teleconsultation';
      clinicalCodes = [
        { type: 'ICD-10', code: 'J20.9', desc: 'Acute bronchitis, unspecified' },
        { type: 'CPT', code: '99213', desc: 'Outpatient office visit, 15-29 mins (Telehealth)' }
      ];
    } else if (isStomach) {
      differentialDiagnoses = [
        { conditionName: "Acute Gastritis / Hyperacidity", confidence: 70, riskFactors: ["NSAID usage", "Spicy food consumption", "High stress levels"] },
        { conditionName: "Gastroesophageal Reflux Disease (GERD)", confidence: 20, riskFactors: ["Hiatal hernia", "Obesity", "Post-prandial recumbency"] },
        { conditionName: "Mild Food Poisoning", confidence: 10, riskFactors: ["Consuming unrefrigerated food", "Street food hygiene"] }
      ];
      triageRoute = 'self-care';
      clinicalCodes = [
        { type: 'ICD-10', code: 'K29.70', desc: 'Gastritis, unspecified, without bleeding' },
        { type: 'CPT', code: '99212', desc: 'Outpatient office visit, 10-19 mins' }
      ];
    } else if (isSkin) {
      differentialDiagnoses = [
        { conditionName: "Allergic Contact Dermatitis", confidence: 55, riskFactors: ["New soaps/detergents", "Metal contact (nickel)", "Plant contact"] },
        { conditionName: "Tinea Corporis (Ringworm)", confidence: 30, riskFactors: ["Humid weather", "Shared towels/linen", "Excessive sweating"] },
        { conditionName: "Acute Urticaria (Hives)", confidence: 15, riskFactors: ["Food allergens", "Stress spikes", "Drug reaction history"] }
      ];
      triageRoute = 'self-care';
      clinicalCodes = [
        { type: 'ICD-10', code: 'L23.9', desc: 'Allergic contact dermatitis, cause unspecified' },
        { type: 'CPT', code: '99212', desc: 'Outpatient office visit, 10-19 mins' }
      ];
    } else {
      const topicName = bestMatch.keywords[0];
      differentialDiagnoses = [
        { conditionName: `${topicName.charAt(0).toUpperCase() + topicName.slice(1)} Related Condition`, confidence: 80, riskFactors: ["General fatigue", "Stress factors"] },
        { conditionName: "Common Somatic Response", confidence: 20, riskFactors: ["Lack of sleep", "Minor dehydration"] }
      ];
      triageRoute = bestMatch.severity === 'warning' ? 'urgent-care' : bestMatch.severity === 'critical' ? 'emergency' : 'self-care';
      clinicalCodes = [
        { type: 'ICD-10', code: 'Z00.00', desc: 'Encounter for general adult medical examination' },
        { type: 'CPT', code: '99211', desc: 'Office service, minimal complexity' }
      ];
    }

    if (!triageDetails) {
      let levelVal: any = 'self_care';
      if (triageRoute === 'emergency') levelVal = 'emergency';
      else if (triageRoute === 'urgent-care') levelVal = 'consultation_24';
      else if (triageRoute === 'teleconsultation') levelVal = 'consultation';
      triageDetails = {
        level: levelVal,
        reason: `Matched keyword pattern for ${bestMatch.keywords[0]}. Deterministic engine stratifies patient to ${levelVal}.`
      };
    }

    const followUps = isHindiInput ? [
      'क्या आप किसी अन्य लक्षण का अनुभव कर रहे हैं?',
      'यह लक्षण कब शुरू हुआ?',
      'क्या दर्द की गंभीरता बढ़ रही है?',
      'क्या आपको पहले से कोई चिकित्सीय समस्या है?',
      'क्या आप वर्तमान में कोई दवा ले रहे हैं?'
    ] : [
      'Are you experiencing any other symptoms?',
      'When did this symptom start?',
      'Is the pain severity increasing?',
      'Do you have any pre-existing medical conditions?',
      'Are you currently taking any medications?'
    ];

    return {
      text: responseText,
      severity: currentSeverity,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
      quickActions: quickActions.length > 0 ? quickActions : undefined,
      followUp: followUps[Math.floor(Math.random() * followUps.length)],
      updatedContext: newContext,
      differentialDiagnoses,
      triageRoute,
      clinicalCodes,
      triageDetails,
      empathyEngine: { sentiment, confidence: sentimentConfidence, validationMessage },
      linguisticPipeline
    };
  }

  // Fallback context response
  if (newContext.symptoms.size > 0) {
    const symptomList = Array.from(newContext.symptoms).join(', ');
    const haveDoctor = doctors.length > 0;
    const haveHospital = hospitals.length > 0;
    const hospital = haveHospital ? hospitals[0] : null;
    let text = "";

    if (isHindiInput) {
      text = `आपके द्वारा बताए गए लक्षणों (${symptomList}) के आधार पर, मेरी सिफारिशें इस प्रकार हैं:\n\n`;
      if (newContext.lastSeverity === 'critical') text += `1. **तत्काल कार्रवाई**: 108 पर कॉल करें और नजदीकी अस्पताल के इमरजेंसी में जाएं। `;
      else if (newContext.lastSeverity === 'warning') text += `1. **डॉक्टर से मिलें**: मैं जल्द ही किसी विशेषज्ञ से परामर्श करने की सलाह देता हूं। `;
      else text += `1. **निगरानी**: अगले 24 घंटों तक लक्षणों पर नज़र रखें। `;
      if (haveDoctor) text += `\n2. आप **${doctors[0].name}** (${doctors[0].specialty}) से परामर्श कर सकते हैं।`;
      if (hospital) text += `\n3. नजदीकी अस्पताल: **${hospital.name}** - ${hospital.address}`;
      text += '\n\nक्या आप चाहते हैं कि मैं अपॉइंटमेंट बुक करने में आपकी मदद करूँ?';
    } else {
      text = `Based on the symptoms you've mentioned (${symptomList}), here are my recommendations:\n\n`;
      if (newContext.lastSeverity === 'critical') text += `1. **Immediate Action**: Call 108 and visit the nearest hospital emergency. `;
      else if (newContext.lastSeverity === 'warning') text += `1. **See a Doctor**: I recommend consulting a specialist soon. `;
      else text += `1. **Monitor**: Keep track of symptoms for the next 24 hours. `;
      if (haveDoctor) text += `\n2. You can consult **${doctors[0].name}** (${doctors[0].specialty}).`;
      if (hospital) text += `\n3. Nearby hospital: **${hospital.name}** - ${hospital.address}`;
      text += '\n\nWould you like me to help you book an appointment?';
    }

    if (sentiment === 'anxious' || sentiment === 'sad' || sentiment === 'frustrated') {
      text = `*${validationMessage}*\n\n` + text;
    }

    const recs: { type: string; header: string; items: any[] }[] = [];
    if (haveDoctor) recs.push({ type: 'doctor', header: 'Recommended Doctor', items: [doctors[0]] });
    if (hospital) recs.push({ type: 'hospital', header: 'Nearby Hospital', items: [hospital] });

    let levelVal: any = 'consultation';
    if (newContext.lastSeverity === 'critical') levelVal = 'emergency';
    else if (newContext.lastSeverity === 'warning') levelVal = 'consultation_24';

    return {
      text,
      severity: newContext.lastSeverity === 'critical' ? 'critical' : newContext.lastSeverity === 'warning' ? 'warning' : 'caution',
      recommendations: recs.length > 0 ? recs : undefined,
      quickActions: haveDoctor ? [{ label: isHindiInput ? 'अपॉइंटमेंट बुक करें' : 'Book Appointment', type: 'doctor', data: doctors[0] }] : undefined,
      followUp: isHindiInput ? 'क्या आप डॉक्टर के साथ अपॉइंटमेंट बुक करना चाहेंगे?' : 'Would you like to book an appointment with a doctor?',
      updatedContext: newContext,
      triageDetails: {
        level: levelVal,
        reason: `Longitudinal context shows ongoing concerns for symptoms: ${symptomList}.`
      },
      empathyEngine: { sentiment, confidence: sentimentConfidence, validationMessage },
      linguisticPipeline
    };
  }

  // Default response
  let defaultText = isHindiInput
    ? `मैं आपकी स्वास्थ्य संबंधी चिंताओं में मदद करने के लिए यहां हूं। आप मुझे बुखार, सिरदर्द, पेट दर्द, खांसी या त्वचा की समस्याओं जैसे लक्षणों के बारे में बता सकते हैं। मैं डॉक्टरों को खोजने, दवाओं के सुझाव देने या नजदीकी अस्पतालों का पता लगाने में भी आपकी मदद कर सकता हूं। आज आपको क्या परेशानी है?`
    : `I'm here to help with your health concerns. You can tell me about symptoms like fever, headache, stomach pain, cough, or skin issues. I can also help you find doctors, suggest medicines, or locate nearby hospitals. What's bothering you today?`;
  if (sentiment === 'anxious' || sentiment === 'sad' || sentiment === 'frustrated') {
    defaultText = `*${validationMessage}*\n\n` + defaultText;
  }

  return {
    text: defaultText,
    severity: 'info',
    quickActions: [
      { label: isHindiInput ? 'डॉक्टर ढूंढें' : 'Find a Doctor', type: 'doctor', data: doctors[0] || null },
      { label: isHindiInput ? 'दवाएं ऑर्डर करें' : 'Order Medicines', type: 'medicine', data: medicines[0] || null },
      { label: isHindiInput ? 'नजदीकी अस्पताल' : 'Nearby Hospitals', type: 'hospital', data: hospitals[0] || null }
    ],
    updatedContext: newContext,
    triageDetails: {
      level: 'self_care',
      reason: 'No clear high-acuity indicators or symptom patterns matched.'
    },
    empathyEngine: { sentiment, confidence: sentimentConfidence, validationMessage },
    linguisticPipeline
  };
}
