import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'hi' | 'bn' | 'te' | 'mr' | 'ta' | 'gu' | 'kn' | 'ml' | 'pa';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  languages: { value: Language; label: string }[];
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    "app.title": "CarePlus",
    "nav.home": "Home",
    "nav.dashboard": "Dashboard",
    "nav.appointments": "Appointments",
    "nav.medicines": "Medicines",
    "nav.shop": "Medicine Shop",
    "nav.chat": "Health Chat",
    "nav.hospitals": "Hospitals",
    "nav.medicalStores": "Medical Stores",
    "nav.bookTest": "Book Lab Test",
    "nav.logout": "Logout",
    "nav.login": "Login",
    "sos.emergency": "Emergency SOS",
    "doctor.register": "Register as Doctor",
    "patient.register": "Register as Patient",
    "chat.placeholder": "Describe your symptoms or ask a health question..."
  },
  hi: {
    "app.title": "चिकित्सा सेवा मंच",
    "nav.home": "होम",
    "nav.dashboard": "डैशबोर्ड",
    "nav.appointments": "अपॉइंटमेंट",
    "nav.medicines": "दवाइयां",
    "nav.shop": "मेडिसिन शॉप",
    "nav.chat": "स्वास्थ्य चैट",
    "nav.hospitals": "अस्पताल",
    "nav.medicalStores": "मेडिकल स्टोर",
    "nav.bookTest": "लैब टेस्ट बुकिंग",
    "nav.logout": "लॉग आउट",
    "nav.login": "लॉगिन",
    "sos.emergency": "आपातकालीन SOS",
    "doctor.register": "डॉक्टर के रूप में पंजीकरण",
    "patient.register": "मरीज के रूप में पंजीकरण",
    "chat.placeholder": "अपने लक्षणों का वर्णन करें या स्वास्थ्य प्रश्न पूछें..."
  },
  bn: {
    "app.title": "চিকিৎসা সেবা প্ল্যাটফর্ম",
    "nav.home": "হোম",
    "nav.dashboard": "ড্যাশবোর্ড",
    "nav.appointments": "অ্যাপয়েন্টমেন্ট",
    "nav.medicines": "ওষুধের তালিকা",
    "nav.shop": "ওষুধের দোকান",
    "nav.chat": "স্বাস্থ্য চ্যাট",
    "nav.hospitals": "হাসপাতাল",
    "nav.medicalStores": "মেডিকেল স্টোরস",
    "nav.logout": "লগ আউট",
    "nav.login": "লগইন",
    "sos.emergency": "জরুরি SOS",
    "doctor.register": "ডাক্তার হিসাবে নিবন্ধন",
    "patient.register": "রোগী হিসাবে নিবন্ধন"
  },
  te: {
    "app.title": "వైద్య సేవల వేదిక",
    "nav.home": "హోమ్",
    "nav.dashboard": "డాష్‌బోర్డ్",
    "nav.appointments": "అపాయింట్‌మెంట్లు",
    "nav.medicines": "మందులు",
    "nav.shop": "మందుల షాప్",
    "nav.chat": "ఆరోగ్య చాట్",
    "nav.hospitals": "ఆసుపత్రులు",
    "nav.medicalStores": "మెడికల్ స్టోర్స్",
    "nav.logout": "లాగ్ అవుట్",
    "nav.login": "లాగిన్",
    "sos.emergency": "అత్యవసర SOS",
    "doctor.register": "వైద్యునిగా నమోదు",
    "patient.register": "రోగిగా నమోదు"
  },
  mr: {
    "app.title": "वैद्यकीय सेवा व्यासपीठ",
    "nav.home": "होम",
    "nav.dashboard": "डॅशबोर्ड",
    "nav.appointments": "भेटी",
    "nav.medicines": "औषधे",
    "nav.shop": "औषधांचे दुकान",
    "nav.chat": "आरोग्य चॅट",
    "nav.hospitals": "रुग्णालये",
    "nav.medicalStores": "मेडिकल स्टोअर्स",
    "nav.logout": "लॉग आउट",
    "nav.login": "लॉगिन",
    "sos.emergency": "आणीबाणी SOS",
    "doctor.register": "डॉक्टर म्हणून नोंदणी",
    "patient.register": "रुग्ण म्हणून नोंदणी"
  },
  ta: {
    "app.title": "மருத்துவ சேவை தளம்",
    "nav.home": "முகப்பு",
    "nav.dashboard": "டாஷ்போர்டு",
    "nav.appointments": "சந்திப்புகள்",
    "nav.medicines": "மருந்துகள்",
    "nav.shop": "மருந்து கடை",
    "nav.chat": "சுகாதார அரட்டை",
    "nav.hospitals": "மருத்துவமனைகள்",
    "nav.medicalStores": "மருந்தகங்கள்",
    "nav.logout": "வெளியேறு",
    "nav.login": "உள்நுழைய",
    "sos.emergency": "அவசர SOS",
    "doctor.register": "மருத்துவராக பதிவு",
    "patient.register": "நோயாளியாக பதிவு"
  },
  gu: {
    "app.title": "તબીબી સેવા પ્લેટફોર્મ",
    "nav.home": "હોમ",
    "nav.dashboard": "ડેશબોર્ડ",
    "nav.appointments": "મુલાકાતો",
    "nav.medicines": "દવાઓ",
    "nav.shop": "દવાની દુકાન",
    "nav.chat": "આરોગ્ય ચેટ",
    "nav.hospitals": "હોસ્પિટલો",
    "nav.medicalStores": "મેડિકલ સ્ટોર્સ",
    "nav.logout": "લૉગ આઉટ",
    "nav.login": "લૉગિન",
    "sos.emergency": "કટોકટી SOS",
    "doctor.register": "ડૉક્ટર તરીકે નોંધણી",
    "patient.register": "દર્દી તરીકે નોંધણી"
  },
  kn: {
    "app.title": "ವೈದ್ಯಕೀಯ ಸೇವೆಗಳ ವೇದಿಕೆ",
    "nav.home": "ಮುಖಪುಟ",
    "nav.dashboard": "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    "nav.appointments": "ನೇಮಕಾತಿಗಳು",
    "nav.medicines": "ದವಾಖಾನೆ",
    "nav.shop": "ಔಷಧಿ ಅಂಗಡಿ",
    "nav.chat": "ಆರೋಗ್ಯ ಚಾಟ್",
    "nav.hospitals": "ಆಸ್ಪತ್ರೆಗಳು",
    "nav.medicalStores": "ಮೆಡಿಕಲ್ ಸ್ಟೋರ್ಸ್",
    "nav.logout": "ಲಾಗ್ ಔಟ್",
    "nav.login": "ಲಾಗಿನ್",
    "sos.emergency": "ತುರ್ತು SOS",
    "doctor.register": "ವೈದ್ಯರಾಗಿ ನೋಂದಣಿ",
    "patient.register": "ರೋಗಿಯಾಗಿ ನೋಂದಣಿ"
  },
  ml: {
    "app.title": "മെഡിക്കൽ സേവന പ്ലാറ്റ്ഫോം",
    "nav.home": "ഹോം",
    "nav.dashboard": "ഡാഷ്ബോർഡ്",
    "nav.appointments": "അപ്പോയിന്റ്മെന്റുകൾ",
    "nav.medicines": "മരുന്നുകൾ",
    "nav.shop": "മരുന്നു കട",
    "nav.chat": "ആരോഗ്യ ചാറ്റ്",
    "nav.hospitals": "ആശുപത്രികൾ",
    "nav.medicalStores": "മെഡിക്കൽ സ്റ്റോറുകൾ",
    "nav.logout": "ലോഗൗട്ട്",
    "nav.login": "ലോഗിൻ",
    "sos.emergency": "എമർജൻസി SOS",
    "doctor.register": "ഡോക്ടറായി രജിസ്റ്റർ",
    "patient.register": "രോഗിയായി രജിസ്റ്റർ"
  },
  pa: {
    "app.title": "ਮੈਡੀਕਲ ਸੇਵਾਵਾਂ ਪਲੇਟਫਾਰਮ",
    "nav.home": "ਮੁੱਖ ਪੰਨਾ",
    "nav.dashboard": "ਡੈਸ਼ਬੋਰਡ",
    "nav.appointments": "ਮੁਲਾਕਾਤਾਂ",
    "nav.medicines": "ਦਵਾਈਆਂ",
    "nav.shop": "ਦਵਾਈ ਦੀ ਦੁਕਾਨ",
    "nav.chat": "ਸਿਹਤ ਚੈਟ",
    "nav.hospitals": "ਹਸਪਤਾਲ",
    "nav.medicalStores": "ਮੈਡੀਕਲ ਸਟੋਰ",
    "nav.logout": "ਲੌਗ ਆਉਟ",
    "nav.login": "ਲੌਗਇਨ",
    "sos.emergency": "ਐਮਰਜੈਂਸੀ SOS",
    "doctor.register": "ਡਾਕਟਰ ਵਜੋਂ ਰਜਿਸਟਰ",
    "patient.register": "ਮਰੀਜ਼ ਵਜੋਂ ਰਜਿਸਟਰ"
  }
};

const languagesList = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'bn', label: 'বাংলা (Bengali)' },
  { value: 'te', label: 'తెలుగు (Telugu)' },
  { value: 'mr', label: 'मराठी (Marathi)' },
  { value: 'ta', label: 'தமிழ் (Tamil)' },
  { value: 'gu', label: 'ગુજરાતી (Gujarati)' },
  { value: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { value: 'ml', label: 'മലയാളം (Malayalam)' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' }
] as const;

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('care_lang');
    return (saved as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('care_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: languagesList as any }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
