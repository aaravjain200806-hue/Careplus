import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { generateAIResponse, type Severity, type QuickAction } from '../services/aiService';
import {
  Send, Bot, User, Mic, MicOff, Trash2, Volume2, VolumeX,
  AlertTriangle, Info, Copy, Check, Sparkles, Stethoscope, Pill, Hospital as HospitalIcon,
  Lock, ShieldCheck, Download, RefreshCw, X, HeartHandshake, UserCheck,
  Navigation, Phone, MapPin, Star, Compass
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  severity?: Severity;
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

const SEVERITY_CONFIG: Record<Severity, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
  critical: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800', label: 'Critical', icon: <AlertTriangle className="w-3 h-3" /> },
  warning: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800', label: 'Warning', icon: <AlertTriangle className="w-3 h-3" /> },
  caution: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800', label: 'Caution', icon: <Info className="w-3 h-3" /> },
  info: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800', label: 'Advisory', icon: <Info className="w-3 h-3" /> }
};

export const Chat: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, addToCart, doctors, medicines, hospitals } = useAppContext();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [speakEnabled, setSpeakEnabled] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [hoveredChatHospitalId, setHoveredChatHospitalId] = useState<string | null>(null);

  // DPDPA Consent States
  const [dpdpaConsentGranted, setDpdpaConsentGranted] = useState(() => {
    const saved = localStorage.getItem('care_dpdpa_consent');
    return saved === 'granted';
  });
  const [dpdpaConsentModal, setDpdpaConsentModal] = useState(!dpdpaConsentGranted);
  const [consentSymptom, setConsentSymptom] = useState(true); // Mandatory
  const [consentWearable, setConsentWearable] = useState(false);
  const [consentLogs, setConsentLogs] = useState(false);

  // Emergency Lockout States
  const [emergencyLocked, setEmergencyLocked] = useState(false);
  const [lockedReason, setLockedReason] = useState('');

  // Psychiatric Handoff States
  const [crisisHandoffActive, setCrisisHandoffActive] = useState(false);
  const [crisisMessages, setCrisisMessages] = useState<any[]>([
    { id: 'c1', sender: 'system', text: 'Active mental health handoff to crisis intervention helpline.', timestamp: new Date() },
    { id: 'c2', sender: 'counselor', text: 'Hello, my name is Sarah. I am a certified clinical counselor with the crisis helpline. I can see you are going through a difficult time right now. Let\'s talk, I am here for you.', timestamp: new Date() }
  ]);
  const [crisisInput, setCrisisInput] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  const conversationContextRef = useRef<{ symptoms: Set<string>; lastSeverity: Severity; turnCount: number; lastTopic: string }>({
    symptoms: new Set(),
    lastSeverity: 'info',
    turnCount: 0,
    lastTopic: ''
  });

  const exportUserData = () => {
    const data = {
      chat_history: localStorage.getItem('care_chat_history'),
      reminders: localStorage.getItem('care_reminders'),
      appointments: localStorage.getItem('care_appointments'),
      telemetry: localStorage.getItem('care_telemetry'),
      health_nudges: localStorage.getItem('care_health_nudges'),
      consent_records: localStorage.getItem('care_consent_records'),
      fhir_logs: localStorage.getItem('care_fhir_logs')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `care_plus_personal_data_${user?.email || 'guest'}.json`;
    a.click();
  };

  const hardDeleteUserData = () => {
    if (confirm("Are you sure you want to delete all your personal data? This will clear all health records, reminders, chat history, and telemetry under the Right to be Forgotten (DPDPA 2023).")) {
      localStorage.clear();
      setMessages([]);
      setDpdpaConsentGranted(false);
      setDpdpaConsentModal(true);
      window.location.reload();
    }
  };

  const acceptConsent = () => {
    if (consentSymptom) {
      localStorage.setItem('care_dpdpa_consent', 'granted');
      setDpdpaConsentGranted(true);
      setDpdpaConsentModal(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('care_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const restored = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
          setMessages(restored);
          setShowWelcome(false);
        }
      } catch { /* ignore parse errors */ }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      const toSave = messages.map(m => ({ ...m, timestamp: m.timestamp.toISOString() }));
      localStorage.setItem('care_chat_history', JSON.stringify(toSave));
      setShowWelcome(false);
    }
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/\*\*/g, '').replace(/\n/g, ' '));
    utterance.rate = 0.95;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (englishVoice) utterance.voice = englishVoice;
    window.speechSynthesis.speak(utterance);
  };

  const processBotResponse = (text: string) => {
    const response = generateAIResponse(text, conversationContextRef.current, medicines, doctors, hospitals, language);
    conversationContextRef.current = response.updatedContext;
    const botMsg: Message = {
      id: `bot-${Date.now()}`,
      text: response.text,
      sender: 'bot',
      timestamp: new Date(),
      severity: response.severity as Severity,
      recommendations: response.recommendations,
      quickActions: response.quickActions,
      followUp: response.followUp,
      differentialDiagnoses: response.differentialDiagnoses,
      triageRoute: response.triageRoute,
      clinicalCodes: response.clinicalCodes,
      linguisticPipeline: response.linguisticPipeline,
      empathyEngine: response.empathyEngine,
      triageDetails: response.triageDetails,
      crisisHandoff: response.crisisHandoff,
      hospitalMapData: response.hospitalMapData
    };

    setMessages(prev => [...prev, botMsg]);

    if (response.crisisHandoff) {
      setCrisisHandoffActive(true);
    } else if (response.triageDetails?.level === 'emergency' || response.triageDetails?.level === 'emergency_ambulance') {
      setEmergencyLocked(true);
      setLockedReason(response.triageDetails.reason || 'Critical medical triage level flagged by safety engine.');
    }

    if (speakEnabled) speak(response.text);
    return botMsg;
  };

  const handleSendQuery = (textToSend: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setInput('');

    const delay = Math.min(400 + textToSend.length * 12, 1800);

    setTimeout(() => {
      processBotResponse(textToSend);
      setIsTyping(false);
    }, delay);
  };

  const handleSend = () => {
    const clean = input.trim();
    if (!clean) return;
    handleSendQuery(clean);
    inputRef.current?.focus();
  };

  const handleNewChat = () => {
    setMessages([]);
    setShowWelcome(true);
    localStorage.removeItem('care_chat_history');
    conversationContextRef.current = {
      symptoms: new Set(),
      turnCount: 0,
      lastSeverity: 'info',
      lastTopic: ''
    };
    setEmergencyLocked(false);
    setCrisisHandoffActive(false);
    setCrisisMessages([
      { id: 'c1', sender: 'system', text: 'Active mental health handoff to crisis intervention helpline.', timestamp: new Date() },
      { id: 'c2', sender: 'counselor', text: 'Hello, my name is Sarah. I am a certified clinical counselor with the crisis helpline. I can see you are going through a difficult time right now. Let\'s talk, I am here for you.', timestamp: new Date() }
    ]);
  };

  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.abort();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    const LANG_CODES: Record<string, string> = {
      en: 'en-US',
      hi: 'hi-IN',
      bn: 'bn-IN',
      te: 'te-IN',
      mr: 'mr-IN',
      ta: 'ta-IN',
      gu: 'gu-IN',
      kn: 'kn-IN',
      ml: 'ml-IN',
      pa: 'pa-IN'
    };
    recognition.lang = LANG_CODES[language] || 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}`.trim() : transcript);
      inputRef.current?.focus();
    };
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  const copyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text.replace(/\*\*/g, '').replace(/\n/g, ' '));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickAction = (action: QuickAction) => {
    switch (action.type) {
      case 'doctor': {
        if (action.data) {
          navigate('/appointments', { state: { preselectedDoctor: action.data } });
        } else {
          navigate('/appointments');
        }
        break;
      }
      case 'medicine': {
        if (action.data && addToCart) {
          addToCart(action.data);
        }
        break;
      }
      case 'hospital': {
        navigate('/hospitals');
        break;
      }
      case 'emergency': {
        if (action.data?.phone) {
          window.open(`tel:${action.data.phone}`);
        }
        break;
      }
    }
  };

  const renderMessageText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
      }
      if (part.includes('\n')) {
        return part.split('\n').map((line, j, arr) => (
          <React.Fragment key={`${i}-${j}`}>
            {line}
            {j < arr.length - 1 && <br />}
          </React.Fragment>
        ));
      }
      return part;
    });
  };

  const renderRecommendations = (recommendations: { type: string; header: string; items: any[] }[]) => {
    return (
      <div className="mt-3 space-y-2">
        {recommendations.map((rec, ri) => (
          <div key={ri} className="bg-white dark:bg-slate-800/60 rounded-xl border border-border p-3">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              {rec.type === 'doctor' && <Stethoscope className="w-3 h-3 text-primary" />}
              {rec.type === 'medicine' && <Pill className="w-3 h-3 text-primary" />}
              {rec.type === 'hospital' && <HospitalIcon className="w-3 h-3 text-primary" />}
              {rec.type === 'emergency' && <AlertTriangle className="w-3 h-3 text-red-500" />}
              {rec.header}
            </h4>
            <div className="space-y-2">
              {rec.items.slice(0, 3).map((item: any, idx: number) => {
                if (rec.type === 'doctor') {
                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuickAction({ label: `Consult ${item.name}`, type: 'doctor', data: item })}
                      className="w-full flex items-center gap-3 p-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Stethoscope className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-grow">
                        <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.specialty} · {item.hospitalName}</p>
                      </div>
                      <span className="text-[9px] bg-success/15 text-success border border-success/20 px-1.5 py-0.5 rounded-full font-bold shrink-0">★ {item.rating}</span>
                    </button>
                  );
                }
                if (rec.type === 'medicine') {
                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuickAction({ label: `Order ${item.name}`, type: 'medicine', data: item })}
                      className="w-full flex items-center gap-3 p-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-grow">
                        <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.genericName} · ₹{item.price}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${item.inStock ? 'bg-success/15 text-success border border-success/20' : 'bg-destructive/15 text-destructive border border-destructive/20'}`}>
                        {item.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </button>
                  );
                }
                if (rec.type === 'hospital') {
                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuickAction({ label: `View ${item.name}`, type: 'hospital', data: item })}
                      className="w-full flex items-center gap-3 p-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <HospitalIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-grow">
                        <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{item.address?.split(',')[0]} · {item.distance}</p>
                      </div>
                      {item.verified && (
                        <span className="text-[9px] bg-success/15 text-success border border-success/20 px-1.5 py-0.5 rounded-full font-bold shrink-0">Verified</span>
                      )}
                    </button>
                  );
                }
                if (rec.type === 'emergency') {
                  return (
                    <button
                      key={idx}
                      onClick={() => window.open(`tel:${item.phone || '108'}`)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-grow">
                        <p className="text-xs font-bold text-foreground truncate">Emergency Helpline</p>
                        <p className="text-[10px] text-muted-foreground">Call ambulance immediately</p>
                      </div>
                      <span className="text-[10px] bg-destructive text-destructive-foreground px-2 py-1 rounded-full font-bold shrink-0">108</span>
                    </button>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderHospitalMap = (msg: Message) => {
    if (!msg.hospitalMapData) return null;
    const data = msg.hospitalMapData;
    const userLat = data.latitude;
    const userLng = data.longitude;

    return (
      <div className="mt-3 bg-white dark:bg-slate-900/60 border border-border rounded-2xl p-4 shadow-sm animate-fade-in text-left space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Compass className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: '8s' }} />
            <span>Interactive Hospital Map (5km Radius)</span>
          </div>
          <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary font-bold px-2 py-0.5 rounded uppercase">
            Keyword: {data.keyword}
          </span>
        </div>

        {/* Mini SVG Map Grid */}
        <div className="relative bg-secondary/10 dark:bg-slate-950/40 border border-border/60 rounded-xl h-48 overflow-hidden shadow-inner flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" className="fill-primary/5 stroke-primary/20" strokeWidth="0.5" strokeDasharray="1,1" />
            <circle cx="50" cy="50" r="30" className="fill-none stroke-primary/10" strokeWidth="0.3" strokeDasharray="1,1" />
            <circle cx="50" cy="50" r="20" className="fill-none stroke-primary/10" strokeWidth="0.3" strokeDasharray="1,1" />
            <circle cx="50" cy="50" r="10" className="fill-none stroke-primary/10" strokeWidth="0.3" strokeDasharray="1,1" />
            
            <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" className="text-border/20" strokeWidth="0.1" />
            <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" className="text-border/20" strokeWidth="0.1" />

            {/* Styled vector map background elements */}
            <path d="M 0,90 Q 30,80 50,55 T 100,20" fill="none" stroke="#60a5fa" strokeWidth="1.0" opacity="0.2" />
            <ellipse cx="88" cy="18" rx="8" ry="4" className="fill-blue-500/5 stroke-blue-400/10" strokeWidth="0.2" />

            <path d="M 80,100 L 78,80 L 70,50 L 60,30 L 55,10" fill="none" stroke="currentColor" className="text-border/30" strokeWidth="0.6" />
            <path d="M 50,100 L 48,70 L 45,45 L 43,20 L 40,0" fill="none" stroke="currentColor" className="text-border/20" strokeWidth="0.4" />
            <path d="M 0,40 L 45,45 L 60,48 L 100,50" fill="none" stroke="currentColor" className="text-border/30" strokeWidth="0.6" />
            <path d="M 25,20 L 55,20 L 70,22 L 95,25" fill="none" stroke="currentColor" className="text-border/20" strokeWidth="0.4" />

            <circle cx="78" cy="84" r="5" className="fill-emerald-500/5 stroke-emerald-500/15" strokeWidth="0.15" />
            <polygon points="48,32 54,32 54,38 48,38" className="fill-emerald-500/5 stroke-emerald-500/15" strokeWidth="0.15" />

            <text x="45" y="18" className="fill-muted-foreground/30 font-bold select-none pointer-events-none" fontSize="2" letterSpacing="0.05">C-SCHEME</text>
            <text x="68" y="93" className="fill-muted-foreground/30 font-bold select-none pointer-events-none" fontSize="2" letterSpacing="0.05">MALVIYA</text>
            <text x="10" y="55" className="fill-muted-foreground/30 font-bold select-none pointer-events-none" fontSize="2" letterSpacing="0.05">MANSAROVAR</text>
            <text x="75" y="44" className="fill-muted-foreground/30 font-bold select-none pointer-events-none" fontSize="2" letterSpacing="0.05">JAWAHAR</text>
            <text x="20" y="10" className="fill-muted-foreground/30 font-bold select-none pointer-events-none" fontSize="2" letterSpacing="0.05">VIDHYADHAR</text>

            <g>
              <circle cx="50" cy="50" r="4.5" className="fill-primary animate-ping opacity-55" />
              <circle cx="50" cy="50" r="3" className="fill-primary stroke-background" strokeWidth="0.6" />
            </g>

            {data.hospitals.map(h => {
              const dx = (h.lng - userLng) * 99000;
              const dy = (h.lat - userLat) * 111000;
              const cx = 50 + (dx / 5000) * 40;
              const cy = 50 - (dy / 5000) * 40;
              const isHovered = hoveredChatHospitalId === h.id;

              return (
                <g
                  key={h.id}
                  onMouseEnter={() => setHoveredChatHospitalId(h.id)}
                  onMouseLeave={() => setHoveredChatHospitalId(null)}
                  className="cursor-pointer"
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? "5" : "3.5"}
                    className={h.verified ? "fill-amber-500 opacity-40 animate-pulse" : "fill-red-500 opacity-40"}
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? "2.5" : "1.8"}
                    className={h.verified ? "fill-amber-500 stroke-background" : "fill-red-500 stroke-background"}
                    strokeWidth="0.4"
                  />
                </g>
              );
            })}
          </svg>

          {hoveredChatHospitalId && (() => {
            const hosp = data.hospitals.find(h => h.id === hoveredChatHospitalId);
            if (!hosp) return null;
            const dx = (hosp.lng - userLng) * 99000;
            const dy = (hosp.lat - userLat) * 111000;
            const cx = 50 + (dx / 5000) * 40;
            const cy = 50 - (dy / 5000) * 40;

            return (
              <div
                className="absolute bg-card border rounded-lg p-2 text-[9px] shadow-elevated pointer-events-none animate-fade-in max-w-[150px] text-left"
                style={{
                  left: `${cx > 65 ? cx - 38 : cx + 2}%`,
                  top: `${cy > 75 ? cy - 15 : cy + 2}%`
                }}
              >
                <h5 className="font-extrabold text-foreground leading-none flex items-center gap-1">
                  {hosp.name}
                </h5>
                <span className="text-primary font-bold mt-1 block">Dist: {hosp.distanceText}</span>
                {hosp.verified && (
                  <span className="text-[8px] text-amber-600 dark:text-amber-400 font-extrabold block">✓ Verified NHA Facility</span>
                )}
              </div>
            );
          })()}

          <div className="absolute bottom-2 left-2 bg-card/85 backdrop-blur-sm border rounded px-1.5 py-0.5 text-[8px] flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-primary block shrink-0" />
              <span className="font-bold text-foreground">You</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 block shrink-0" />
              <span className="font-bold text-foreground">NHA Verified</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 block shrink-0" />
              <span className="font-bold text-foreground">Standard</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {data.hospitals.map((hosp) => (
            <div
              key={hosp.id}
              className={`border p-3 rounded-xl transition-all space-y-2 text-left ${
                hoveredChatHospitalId === hosp.id ? 'border-primary bg-primary/5' : 'border-border bg-card'
              }`}
              onMouseEnter={() => setHoveredChatHospitalId(hosp.id)}
              onMouseLeave={() => setHoveredChatHospitalId(null)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                    <HospitalIcon className="w-4 h-4 text-primary shrink-0" />
                    <span>{hosp.name}</span>
                  </h4>
                  {hosp.hfrId ? (
                    <span className="inline-flex items-center gap-1 mt-1 text-[8px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded font-extrabold">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      ABDM Facility ID: {hosp.hfrId}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 mt-1 text-[8px] bg-secondary text-muted-foreground border px-2 py-0.5 rounded font-semibold">
                      Standard Clinic
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-primary">{hosp.distanceText}</span>
                  <div className="text-[9px] text-amber-500 font-bold flex items-center gap-0.5 justify-end mt-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-500" />
                    <span>{hosp.rating}</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <span>{hosp.address}</span>
              </p>

              <div className="flex gap-2 pt-1">
                <a
                  href={`tel:${hosp.phone}`}
                  className="flex-1 py-1.5 px-3 border border-border hover:bg-muted text-foreground font-bold rounded-lg text-[9px] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Phone className="w-3 h-3 text-muted-foreground" />
                  <span>Call</span>
                </a>
                <button
                  onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${hosp.lat},${hosp.lng}`, '_blank')}
                  className="flex-1 py-1.5 px-3 bg-gradient-medical text-white font-bold rounded-lg text-[9px] shadow-medical hover:opacity-90 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Get Directions</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDifferentialDiagnosis = (msg: Message) => {
    if (!msg.differentialDiagnoses) return null;
    const triageColors = {
      'self-care': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      'teleconsultation': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'urgent-care': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      'emergency': 'bg-red-500/10 text-red-500 border-red-500/20'
    };

    return (
      <div className="mt-3 bg-white dark:bg-slate-900/60 border border-border rounded-2xl p-4 shadow-sm animate-fade-in text-left">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span>Ada-Validated Symptom Analysis</span>
          </div>
          {msg.triageRoute && (
            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border capitalize ${triageColors[msg.triageRoute]}`}>
              Triage: {msg.triageRoute.replace('-', ' ')}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {msg.differentialDiagnoses.map((diag, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-foreground">{diag.conditionName}</span>
                <span className="font-mono text-primary font-bold">{diag.confidence}% Match</span>
              </div>
              <div className="w-full bg-secondary dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-1000"
                  style={{ width: `${diag.confidence}%` }}
                />
              </div>
              {diag.riskFactors && diag.riskFactors.length > 0 && (
                <p className="text-[10px] text-muted-foreground font-medium">
                  <span className="text-primary/70">Risk factors:</span> {diag.riskFactors.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>

        {msg.clinicalCodes && msg.clinicalCodes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap gap-2">
            {msg.clinicalCodes.map((codeObj, idx) => (
              <span key={idx} className="text-[9px] bg-secondary dark:bg-slate-800/80 border border-border/50 px-2 py-0.5 rounded font-mono text-foreground" title={codeObj.desc}>
                <strong>{codeObj.type} {codeObj.code}</strong>: {codeObj.desc.slice(0, 26)}...
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const suggestedPrompts = [
    { text: 'I have a fever and body ache', icon: '🤒' },
    { text: 'Severe headache since morning', icon: '🤕' },
    { text: 'Skin rash and itching', icon: '🔴' },
    { text: 'Stomach pain and acidity', icon: '🤢' },
    { text: 'Chest pain and breathlessness', icon: '❤️' },
    { text: 'Find a doctor near me', icon: '🩺' }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto px-2 sm:px-4 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-gradient-medical flex items-center justify-center shadow-medical">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-foreground tracking-tight">CarePlus AI Doctor</h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Online & ready to help
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {user?.name && (
            <span className="hidden sm:block text-xs text-muted-foreground font-medium mr-2">
              Hi, {(user.fullname || user.name).split(' ')[0]}
            </span>
          )}
          <button
            onClick={() => setDpdpaConsentModal(true)}
            className="p-2 rounded-xl border border-border hover:bg-muted/50 text-muted-foreground transition-all flex items-center gap-1.5"
            title="Manage DPDPA Privacy Consent & Records"
          >
            <Lock className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline text-xs font-bold text-foreground">Privacy (DPDPA)</span>
          </button>
          <button
            onClick={() => setSpeakEnabled(!speakEnabled)}
            className={`p-2 rounded-xl border transition-all ${speakEnabled ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted/50 text-muted-foreground'}`}
            title="Toggle voice output"
          >
            {speakEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={handleNewChat}
            className="p-2 rounded-xl border border-border hover:bg-muted/50 text-muted-foreground transition-all"
            title="New conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chat Card */}
      <div className="flex-1 bg-card border border-border rounded-3xl shadow-elevated flex flex-col overflow-hidden">
        {/* Disclaimer Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-[10px] text-amber-700 dark:text-amber-300">
            This AI provides preliminary health guidance only. Always consult a qualified doctor for diagnosis and treatment. Call 108 for emergencies.
          </p>
        </div>

        {/* Emergency Lockout Banner */}
        {emergencyLocked && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-pulse">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="text-left">
                <h4 className="text-xs font-extrabold text-red-700 dark:text-red-400">EMERGENCY ACUITY WARNING MATCHED</h4>
                <p className="text-[10px] text-red-600 dark:text-red-300 leading-relaxed font-semibold">
                  {lockedReason} <strong>Clinical Safety Protocol:</strong> Text input is locked to prevent delayed triage. Call 108 immediately.
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0 w-full sm:w-auto">
              <a
                href="tel:108"
                className="flex-1 sm:flex-none text-center px-3 py-1.5 bg-red-600 text-white rounded-lg font-bold text-[10px] shadow hover:bg-red-700"
              >
                Call Ambulance (108)
              </a>
              <button
                onClick={() => setEmergencyLocked(false)}
                className="flex-1 sm:flex-none px-3 py-1.5 border border-red-500/30 text-red-600 dark:text-red-400 rounded-lg font-bold text-[10px] hover:bg-red-500/5 bg-background"
              >
                False Alarm (Unlock)
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div
          ref={chatContainerRef}
          className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-4"
        >
          {crisisHandoffActive ? (
            <div className="space-y-4 h-full flex flex-col justify-between">
              {/* Alert Header */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-left space-y-2">
                <h3 className="text-sm font-extrabold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 animate-bounce" />
                  Active Safety Protocol: Psychiatric Crisis Handoff
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  An active risk warning has disabled automated AI chat to ensure clinical safety. You are being connected to our 24/7 human counseling partner.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1.5">
                  <div className="border border-red-500/25 bg-card p-2.5 rounded-xl text-left space-y-1">
                    <p className="text-[10px] font-bold text-red-700 dark:text-red-400">AASRA Suicide Helpline</p>
                    <p className="text-xs font-mono font-bold text-foreground">+91-9820466726</p>
                    <p className="text-[9px] text-muted-foreground">Available 24 hours, free & confidential</p>
                  </div>
                  <div className="border border-red-500/25 bg-card p-2.5 rounded-xl text-left space-y-1">
                    <p className="text-[10px] font-bold text-red-700 dark:text-red-400">Vandrevala Foundation</p>
                    <p className="text-xs font-mono font-bold text-foreground">+91-9999666555</p>
                    <p className="text-[9px] text-muted-foreground">Immediate psychiatric distress support</p>
                  </div>
                </div>
              </div>

              {/* Crisis Chat Stream */}
              <div className="flex-1 overflow-y-auto space-y-3 min-h-[220px] py-4 border-y border-border/40 pr-1 text-left">
                {crisisMessages.map((cm) => (
                  <div key={cm.id} className={`flex ${cm.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-2 max-w-[85%] ${cm.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        cm.sender === 'user' ? 'bg-secondary text-primary' : 'bg-red-600 text-white'
                      }`}>
                        {cm.sender === 'user' ? 'U' : cm.sender === 'system' ? 'S' : 'C'}
                      </div>
                      <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        cm.sender === 'user'
                          ? 'bg-gradient-medical text-white'
                          : cm.sender === 'system'
                          ? 'bg-muted border border-border/50 text-muted-foreground italic'
                          : 'bg-red-50 dark:bg-red-950/20 border border-red-200/50 text-foreground'
                      }`}>
                        {cm.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Crisis Input Area */}
              <div className="pt-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={crisisInput}
                    onChange={(e) => setCrisisInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (!crisisInput.trim()) return;
                        const newMsg = { id: `c-${Date.now()}`, sender: 'user', text: crisisInput, timestamp: new Date() };
                        setCrisisMessages(prev => [...prev, newMsg]);
                        setCrisisInput('');
                        
                        setTimeout(() => {
                          const replies = [
                            "I hear you, and I want to help you through this. You are not alone. Please consider dialing our AASRA helpline directly or let me know if you would like me to call an emergency response for you.",
                            "Thank you for sharing that with me. It takes courage to talk about this. What kind of support do you have around you right now?",
                            "I am here for you. We can take this one breath at a time. Do you have a trusted family member or friend nearby whom we can contact?"
                          ];
                          const cReply = {
                            id: `c-rep-${Date.now()}`,
                            sender: 'counselor',
                            text: replies[Math.floor(Math.random() * replies.length)],
                            timestamp: new Date()
                          };
                          setCrisisMessages(prev => [...prev, cReply]);
                        }, 1200);
                      }
                    }}
                    placeholder="Type a message to the counselor..."
                    className="flex-grow px-3 py-2 border rounded-xl bg-card text-xs focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <button
                    onClick={() => {
                      if (!crisisInput.trim()) return;
                      const newMsg = { id: `c-${Date.now()}`, sender: 'user', text: crisisInput, timestamp: new Date() };
                      setCrisisMessages(prev => [...prev, newMsg]);
                      setCrisisInput('');
                      
                      setTimeout(() => {
                        const replies = [
                          "I hear you, and I want to help you through this. You are not alone. Please consider dialing our AASRA helpline directly or let me know if you would like me to call an emergency response for you.",
                          "Thank you for sharing that with me. It takes courage to talk about this. What kind of support do you have around you right now?",
                          "I am here for you. We can take this one breath at a time. Do you have a trusted family member or friend nearby whom we can contact?"
                        ];
                        const cReply = {
                          id: `c-rep-${Date.now()}`,
                          sender: 'counselor',
                          text: replies[Math.floor(Math.random() * replies.length)],
                          timestamp: new Date()
                        };
                        setCrisisMessages(prev => [...prev, cReply]);
                      }, 1200);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold"
                  >
                    Send
                  </button>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                    Connected with Crisis Service Counselor Sarah
                  </span>
                  <button
                    onClick={() => setCrisisHandoffActive(false)}
                    className="text-[10px] text-primary hover:underline font-bold"
                  >
                    Disconnect & Go Back
                  </button>
                </div>
              </div>
            </div>
          ) : showWelcome && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-medical flex items-center justify-center mb-6 shadow-medical animate-pulse-subtle">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-extrabold text-foreground mb-2">Welcome to CarePlus AI Doctor</h2>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Your intelligent health assistant. Describe symptoms, ask health questions, or choose a quick topic below to get started.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendQuery(prompt.text)}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
                  >
                    <span className="text-xl">{prompt.icon}</span>
                    <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`flex gap-3 max-w-[90%] sm:max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.sender === 'user'
                      ? 'bg-secondary text-primary border border-border'
                      : 'bg-gradient-medical text-white shadow-medical'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className="space-y-2 min-w-0">
                    <div className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed text-left ${
                      msg.sender === 'user'
                        ? 'bg-gradient-medical text-white rounded-tr-md'
                        : 'bg-secondary/70 dark:bg-slate-800/50 text-secondary-foreground rounded-tl-md border border-border/50'
                    }`}>
                      {renderMessageText(msg.text)}
                      <div className="flex items-center justify-end gap-2 mt-2">
                        <span className={`text-[9px] ${msg.sender === 'user' ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.sender === 'bot' && (
                          <button
                            onClick={() => copyMessage(msg.text, msg.id)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="Copy"
                          >
                            {copiedId === msg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Badges Column */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {/* Severity Badge */}
                      {msg.severity && msg.severity !== 'info' && (
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${SEVERITY_CONFIG[msg.severity].bg} ${SEVERITY_CONFIG[msg.severity].color}`}>
                          {SEVERITY_CONFIG[msg.severity].icon}
                          {SEVERITY_CONFIG[msg.severity].label}
                        </div>
                      )}

                      {/* Empathy sentiment indicator */}
                      {msg.empathyEngine && (
                        <div className="inline-flex items-center gap-1 bg-primary/10 text-primary border border-primary/25 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold select-none">
                          <HeartHandshake className="w-3 h-3 text-primary animate-pulse" />
                          <span>Empathy: <span className="capitalize text-foreground">{msg.empathyEngine.sentiment}</span></span>
                        </div>
                      )}

                      {/* Triage Tuple matched indicator */}
                      {msg.triageDetails?.tupleMatched && (
                        <div className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 border border-amber-500/25 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold">
                          <AlertTriangle className="w-3 h-3 text-amber-500" />
                          <span>{msg.triageDetails.tupleMatched}</span>
                        </div>
                      )}
                    </div>

                    {/* Linguistic translation steps drawer */}
                    {msg.linguisticPipeline && (
                      <details className="text-left text-xs bg-slate-50 dark:bg-slate-900 border border-border/40 p-3 rounded-2xl space-y-1.5 mt-2 font-sans select-none max-w-full overflow-hidden shadow-sm">
                        <summary className="cursor-pointer font-bold text-[10px] text-primary flex items-center gap-1.5 hover:opacity-85">
                          <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" style={{ animationDuration: '6s' }} />
                          <span>View Hinglish Transliterator & NLP Pipeline</span>
                        </summary>
                        <div className="mt-2 space-y-2 border-t border-border/30 pt-2 text-[10px] text-muted-foreground leading-normal">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>Detected Input:</span>
                            <span className="font-bold text-foreground">{msg.linguisticPipeline.detectedLang}</span>
                            <span className="ml-auto font-mono text-[9px] bg-secondary text-foreground px-1.5 py-0.2 rounded border border-border">
                              CMI: {msg.linguisticPipeline.cmi}
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-foreground block mb-0.5">Adversarial Normalization & Devanagari Transliteration:</span>
                            <div className="font-mono bg-background text-foreground p-2 rounded border border-border text-[9px] break-words">
                              {msg.linguisticPipeline.transliteratedText}
                            </div>
                          </div>
                          <div>
                            <span className="font-semibold text-foreground block mb-0.5">English Translation (COMET-Evaluated Quality Gate):</span>
                            <div className="font-mono bg-background text-foreground p-2 rounded border border-border text-[9px] break-words">
                              "{msg.linguisticPipeline.translatedText}"
                            </div>
                            <span className="text-[9px] text-success font-bold mt-1 block">COMET Quality Index: {msg.linguisticPipeline.cometScore} (Pass)</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[9px]">
                            <span>KB Search:</span>
                            <span className="font-bold text-foreground">{msg.linguisticPipeline.retrievalMethod}</span>
                          </div>
                        </div>
                      </details>
                    )}

                    {/* Differential Diagnoses */}
                    {msg.differentialDiagnoses && renderDifferentialDiagnosis(msg)}

                    {/* Recommendations */}
                    {msg.recommendations && renderRecommendations(msg.recommendations)}

                    {/* Hospital Map Visual Engine */}
                    {msg.hospitalMapData && renderHospitalMap(msg)}

                    {/* Quick Actions */}
                    {msg.quickActions && msg.quickActions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.quickActions.map((action, i) => (
                          <button
                            key={i}
                            onClick={() => handleQuickAction(action)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-[11px] font-bold border border-primary/20 hover:bg-primary/20 transition-all"
                          >
                            {action.type === 'doctor' && <Stethoscope className="w-3 h-3" />}
                            {action.type === 'medicine' && <Pill className="w-3 h-3" />}
                            {action.type === 'hospital' && <HospitalIcon className="w-3 h-3" />}
                            {action.type === 'emergency' && <AlertTriangle className="w-3 h-3" />}
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Follow-up Chip */}
                    {msg.followUp && msg.sender === 'bot' && (
                      <button
                        onClick={() => setInput(msg.followUp)}
                        className="text-[11px] text-primary hover:text-primary-glow font-medium flex items-center gap-1 transition-colors"
                      >
                        <span className="opacity-60">💡</span> {msg.followUp}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="flex gap-3 items-end max-w-[80%]">
                <div className="w-8 h-8 rounded-2xl bg-gradient-medical flex items-center justify-center shrink-0 text-white shadow-medical">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-secondary/70 dark:bg-slate-800/50 border border-border/50 rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">Analyzing</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions Bar */}
        {!showWelcome && messages.length > 0 && messages.length < 4 && !crisisHandoffActive && (
          <div className="px-4 sm:px-6 py-3 border-t border-border bg-muted/20 overflow-x-auto">
            <div className="flex gap-2">
              {['Book a doctor appointment', 'Suggest medicines', 'Find nearby hospital', 'I have a fever'].map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSendQuery(suggestion)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-border text-[11px] text-muted-foreground hover:text-primary hover:border-primary transition-all font-medium"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-3 sm:p-4 border-t border-border bg-background">
          <div className="flex gap-2">
            <button
              onClick={toggleSpeechRecognition}
              disabled={crisisHandoffActive || emergencyLocked}
              className={`p-3 rounded-2xl border transition-all shrink-0 ${
                isListening
                  ? 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-500 animate-pulse'
                  : 'border-border hover:bg-muted/50 text-muted-foreground'
              } disabled:opacity-50 disabled:pointer-events-none`}
              title={isListening ? 'Listening...' : 'Voice input'}
            >
              {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                emergencyLocked
                  ? 'Emergency Lockout Active - Call 108 immediately'
                  : crisisHandoffActive
                  ? 'Chat disabled - Connected to Crisis Counselor above'
                  : t('chat.placeholder') || 'Describe your symptoms or ask a health question...'
              }
              className="flex-grow px-4 py-3 rounded-2xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-60"
              disabled={isListening || emergencyLocked || crisisHandoffActive}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping || emergencyLocked || crisisHandoffActive}
              className="p-3 bg-gradient-medical text-white rounded-2xl shadow-medical hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* DPDPA 2023 Granular Consent Gate Modal */}
      {dpdpaConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in text-left">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-lg w-full shadow-elevated relative space-y-5">
            <div className="flex items-center gap-3 border-b border-border/40 pb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-foreground">DPDPA 2023 Consent Gate</h3>
                <p className="text-[10px] text-muted-foreground font-semibold">Digital Personal Data Protection Compliance • Data Fiduciary: Care+</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                To consult the <strong>Care+ AI Doctor</strong>, the Digital Personal Data Protection Act (DPDPA) of 2023 requires that you grant explicit, granular, and revocable consent for personal health data processing.
              </p>

              <div className="bg-muted/30 border border-border/50 rounded-xl p-3 space-y-2">
                <p className="font-bold text-foreground text-[10px] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  DPDPA Sovereignty Notice
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[9px]">
                  <li><strong>Data Minimization</strong>: We only collect clinical symptoms related to your immediate query. No unnecessary identifiers are processed.</li>
                  <li><strong>Right to Withdraw</strong>: You can revoke consent at any time via Settings.</li>
                  <li><strong>Right to Erasure (Forgotten)</strong>: You can purge all logs from our servers permanently.</li>
                  <li><strong>Right to Access</strong>: You can download your entire medical footprint instantly.</li>
                </ul>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 pt-1">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentSymptom}
                    readOnly
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-not-allowed"
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      Symptom Processing & AI Triage <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.2 rounded font-extrabold uppercase">Required</span>
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Allows the deterministic AI safety engine to evaluate symptoms, run differential matches, and code claims.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentWearable}
                    onChange={(e) => setConsentWearable(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground">Sync Passive Wearable Telemetry</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Allows the AI to access active smartwatch telemetry (HRV, glucose CGM, SpO2) from your profile for contextualized answers.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={consentLogs}
                    onChange={(e) => setConsentLogs(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground">Longitudinal Record Sync & Retention</span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Permits local history logging to track symptom progression across consultation sessions. If unchecked, logs are wiped immediately post-session.</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="border-t border-border/40 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={exportUserData}
                  className="flex-1 sm:flex-none px-3 py-1.5 border border-border hover:bg-muted text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 text-muted-foreground hover:text-foreground bg-background"
                  title="Download Data footprint"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
                <button
                  onClick={hardDeleteUserData}
                  className="flex-1 sm:flex-none px-3 py-1.5 border border-destructive/20 hover:bg-destructive/10 text-[10px] font-bold rounded-xl flex items-center justify-center gap-1 text-destructive bg-background"
                  title="Erase all records under DPDPA Right to Erasure"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Erase All</span>
                </button>
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                {dpdpaConsentGranted && (
                  <button
                    onClick={() => setDpdpaConsentModal(false)}
                    className="flex-1 sm:flex-none px-4 py-2 border border-border text-foreground rounded-xl text-xs font-bold bg-background"
                  >
                    Close
                  </button>
                )}
                <button
                  onClick={acceptConsent}
                  className="flex-1 sm:flex-none px-5 py-2 bg-gradient-medical text-white font-bold text-xs rounded-xl shadow-medical hover:opacity-90 active:scale-95 transition-all"
                >
                  Accept & Consult
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
