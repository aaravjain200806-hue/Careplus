import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Calendar, Bell, Pill, FileText, Upload, RefreshCw, Trash2, 
  CheckCircle2, AlertTriangle, ArrowRight, UserCircle, Activity, 
  Camera, ShieldCheck, Database, Share2, Eye, EyeOff, Lock, Heart, 
  FileCode, Check, X, Sparkles, Sliders, Plus
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { 
    user, appointments, reminders, takeMedicine, markAsTaken, deleteReminder, 
    updateAppointmentStatus, addReminder,
    abhaId, abhaAddress, setAbhaDetails, consentRecords, updateConsentStatus,
    telemetry, updateTelemetry, healthNudges, fhirLogs, addFhirLog,
    medicines, addToCart, hitlQueue, addToHitlQueue,
    healthDocuments, consentRequests, approveConsentRequest, denyConsentRequest, uploadHealthDocument,
    addAuditLog, updateUserProfile, changePassword, testBookings, updateTestBookingStatus
  } = useAppContext();

  // Dashboard layout tabs
  const [activeTab, setActiveTab] = useState<'records' | 'abdm' | 'rpm' | 'reports'>('records');

  // Modal triggers
  const [showScanShareModal, setShowScanShareModal] = useState(false);
  const [showFaceScanModal, setShowFaceScanModal] = useState(false);
  const [showFhirPayloadModal, setShowFhirPayloadModal] = useState<any | null>(null);

  // Scan & Share simulation states
  const [selectedClinic, setSelectedClinic] = useState('Sawai Man Singh Hospital');
  const [scanShareSuccess, setScanShareSuccess] = useState(false);

  // Face Scan simulation states
  const [faceScanStep, setFaceScanStep] = useState<'idle' | 'scanning' | 'success'>('idle');
  const [faceScanProgress, setFaceScanProgress] = useState(0);
  const [liveHr, setLiveHr] = useState(70);

  // Manual telemetry controls
  const [manualGlucose, setManualGlucose] = useState(110);
  const [manualHrv, setManualHrv] = useState(58);

  // Live ticking clock for countdown timers
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio Alert Engine State
  const [audioActive, setAudioActive] = useState(false);
  const audioRef = React.useRef<{ audioCtx: AudioContext | null; gainNode: GainNode | null; intervalId: any }>({
    audioCtx: null,
    gainNode: null,
    intervalId: null
  });

  // Filter and check reminders that are currently due/alerting
  const dueReminders = React.useMemo(() => {
    return reminders.filter(r => {
      if (r.user_id && r.user_id !== user?.email) return false;
      
      // 1. Day Guard Check
      const todayName = new Date(now).toLocaleDateString('en-US', { weekday: 'long' });
      const daysArray = Array.isArray(r.daysOfWeek)
        ? r.daysOfWeek
        : typeof r.daysOfWeek === 'string'
          ? (r.daysOfWeek.startsWith('[') ? JSON.parse(r.daysOfWeek) : [r.daysOfWeek])
          : ['Everyday'];
      const isScheduled = daysArray.includes('Everyday') || daysArray.includes(todayName);
      if (!isScheduled) return false;

      // 2. Interval Lockout Check
      const lastTaken = r.lastTakenTime || r.last_taken_at;
      if (!lastTaken) return true; // Never taken, so it is due
      const intervalHours = r.intervalHours ?? 24;
      const elapsed = now - new Date(lastTaken).getTime();
      return elapsed >= intervalHours * 3600 * 1000;
    });
  }, [reminders, user?.email, now]);

  const cleanupAudio = React.useCallback(() => {
    if (audioRef.current.intervalId) {
      clearInterval(audioRef.current.intervalId);
    }
    if (audioRef.current.audioCtx) {
      try {
        audioRef.current.audioCtx.close();
      } catch (e) {
        console.error(e);
      }
    }
    audioRef.current = { audioCtx: null, gainNode: null, intervalId: null };
    setAudioActive(false);
  }, []);

  useEffect(() => {
    const isAnyDue = dueReminders.length > 0;
    
    if (isAnyDue && !audioActive) {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          const audioCtx = new AudioCtxClass();
          const osc = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880Hz
          
          gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
          osc.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          osc.start();
          
          const tick = () => {
            if (audioCtx.state === 'suspended') {
              audioCtx.resume();
            }
            const nowTime = audioCtx.currentTime;
            // Pulse sound: 1.0 for 200ms, then 0.0
            gainNode.gain.setValueAtTime(1.0, nowTime);
            gainNode.gain.setValueAtTime(0.0, nowTime + 0.2);
          };
          
          tick();
          const intervalId = setInterval(tick, 1000);
          
          audioRef.current = {
            audioCtx,
            gainNode,
            intervalId
          };
          setAudioActive(true);
        }
      } catch (e) {
        console.error("Web Audio API failed to load", e);
      }
    } else if (!isAnyDue && audioActive) {
      cleanupAudio();
    }
  }, [dueReminders.length, audioActive, cleanupAudio]);

  useEffect(() => {
    return () => {
      if (audioRef.current.intervalId) {
        clearInterval(audioRef.current.intervalId);
      }
      if (audioRef.current.audioCtx) {
        audioRef.current.audioCtx.close();
      }
    };
  }, []);

  // Patient Upload states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadDocType, setUploadDocType] = useState<'prescription' | 'diagnostic_report' | 'clinical_note' | 'billing'>('prescription');
  const [uploadDocTitle, setUploadDocTitle] = useState('');
  const [uploadFacilityName, setUploadFacilityName] = useState('');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  const handlePatientUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocTitle || !uploadFacilityName) return;

    // Generate mock FHIR payload for patient self-upload
    let fhirRecord = '';
    if (uploadDocType === 'prescription') {
      fhirRecord = JSON.stringify({
        resourceType: "MedicationRequest",
        id: `medreq-patient-${Date.now()}`,
        status: "active",
        intent: "order",
        medicationCodeableConcept: { coding: [{ system: "http://snomed.info/sct", code: "387584000", display: uploadDocTitle }] },
        subject: { reference: `Patient/${abhaId}`, display: user?.name || 'Aaravomen' },
        authoredOn: new Date().toISOString(),
        note: [{ text: "Patient self-uploaded prescription record." }]
      }, null, 2);
    } else if (uploadDocType === 'diagnostic_report') {
      fhirRecord = JSON.stringify({
        resourceType: "DiagnosticReport",
        id: `diagrep-patient-${Date.now()}`,
        status: "final",
        code: { coding: [{ system: "http://loinc.org", code: "55233-1", display: uploadDocTitle }] },
        subject: { reference: `Patient/${abhaId}`, display: user?.name || 'Aaravomen' },
        issued: new Date().toISOString(),
        conclusion: "Patient self-uploaded lab report."
      }, null, 2);
    } else if (uploadDocType === 'billing') {
      fhirRecord = JSON.stringify({
        resourceType: "ExplanationOfBenefit",
        id: `eob-patient-${Date.now()}`,
        status: "active",
        use: "claim",
        patient: { reference: `Patient/${abhaId}` },
        provider: { display: uploadFacilityName },
        note: [{ text: "Patient self-uploaded medical bill." }]
      }, null, 2);
    } else {
      fhirRecord = JSON.stringify({
        resourceType: "DocumentReference",
        id: `docref-patient-${Date.now()}`,
        status: "current",
        subject: { reference: `Patient/${abhaId}` },
        date: new Date().toISOString(),
        description: uploadDocTitle
      }, null, 2);
    }

    uploadHealthDocument({
      abhaId,
      abhaAddress,
      title: uploadDocTitle,
      documentType: uploadDocType,
      facilityName: uploadFacilityName,
      fileUrl: selectedFile ? selectedFile.name : `${uploadDocTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_locker.pdf`,
      fhirRecord
    });

    // Audit Log for patient uploading self EMR documents (DPDP Act Compliance)
    addAuditLog(
      user?.userType || 'patient',
      'UPLOAD_EMR_DOCUMENT',
      abhaId,
      'success'
    );

    setUploadSuccessMsg('Document securely uploaded to your ABDM Health Locker!');
    setUploadDocTitle('');
    setUploadFacilityName('');
    setSelectedFile(null);
    setFilePreviewUrl(null);
    
    setTimeout(() => {
      setUploadSuccessMsg('');
      setIsUploadModalOpen(false);
    }, 2000);
  };

  // Mock prescription parsing state
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedReminders, setParsedReminders] = useState<any[] | null>(null);

  // Multi-phase OCR simulation states
  const [ocrStep, setOcrStep] = useState<'idle' | 'preprocessing' | 'crnn' | 'ner' | 'validation' | 'done'>('idle');
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrLogs, setOcrLogs] = useState<string[]>([]);
  const [ocrSafetyAlerts, setOcrSafetyAlerts] = useState<string[]>([]);

  // ABHA ID & OCR HITL States
  const [abhaModalOpen, setAbhaModalOpen] = useState(false);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [abhaOtpStep, setAbhaOtpStep] = useState<'aadhaar' | 'otp'>('aadhaar');
  const [ocrQuality, setOcrQuality] = useState<'high' | 'low'>('high');
  const [ocrQueuedStatus, setOcrQueuedStatus] = useState(false);

  // Profile settings state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [profileFullname, setProfileFullname] = useState(user?.fullname || '');
  const [profileUsername, setProfileUsername] = useState(user?.username || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState(user?.phoneNumber || '');
  const [profileDob, setProfileDob] = useState(user?.dob || '');
  
  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  // Profile settings form states
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // Keep state synced when user changes
  useEffect(() => {
    if (user) {
      setProfileFullname(user.fullname || user.name || '');
      setProfileUsername(user.username || '');
      setProfileEmail(user.email || '');
      setProfilePhone(user.phoneNumber || '');
      setProfileDob(user.dob || '');
    }
  }, [user]);

  useEffect(() => {
    let interval: any;
    if (faceScanStep === 'scanning') {
      interval = setInterval(() => {
        setFaceScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setFaceScanStep('success');
            // Mock vitals generation
            const finalHr = Math.floor(Math.random() * 15) + 68; // 68-83 bpm
            const finalSpo2 = Math.floor(Math.random() * 3) + 97; // 97-99%
            const finalHrv = Math.floor(Math.random() * 20) + 50; // 50-70 ms
            updateTelemetry({ hrv: finalHrv, restingHr: finalHr, spo2: finalSpo2 });
            
            // Add interop logs
            addFhirLog(
              `Smartphone Vital Scan complete. Telemetry synchronized.`, 
              'success', 
              JSON.stringify({
                resourceType: "Observation",
                id: "face-ppg-scan",
                status: "final",
                category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "vital-signs" }] }],
                code: { coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart rate" }] },
                subject: { reference: `Patient/${user?.name?.toLowerCase().replace(/ /g, '-')}` },
                effectiveDateTime: new Date().toISOString(),
                component: [
                  { code: { coding: [{ system: "http://loinc.org", code: "8867-4", display: "Heart Rate" }] }, valueQuantity: { value: finalHr, unit: "bpm" } },
                  { code: { coding: [{ system: "http://loinc.org", code: "2708-6", display: "Oxygen Saturation" }] }, valueQuantity: { value: finalSpo2, unit: "%" } }
                ]
              }, null, 2)
            );
            return 100;
          }
          // Fluctuate live heart rate reading
          setLiveHr(Math.floor(Math.random() * 10) + 70);
          return prev + 10;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [faceScanStep]);

  // Audit Log when patient views EMR reports tab (DPDP Act Compliance)
  useEffect(() => {
    if (activeTab === 'reports') {
      addAuditLog(
        user?.userType || 'patient',
        'VIEW_EMR_RECORD',
        abhaId,
        'success'
      );
    }
  }, [activeTab]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size is too large. Maximum size is 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      updateUserProfile({ profilePicture: base64String });
    };
    reader.readAsDataURL(file);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center p-4">
        <div className="bg-card border p-8 rounded-2xl shadow-elevated text-center max-w-sm">
          <AlertTriangle className="w-12 h-12 text-emergency mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Please log in as a patient to view your medical dashboard.
          </p>
          <Link
            to="/login"
            className="inline-block w-full py-2.5 bg-gradient-medical text-white font-semibold rounded-lg hover:opacity-90 transition-all text-sm"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // Filter appointments for this user
  const patientAppointments = appointments.filter(a => a.user_id === user.email);

  // File Drag-Drop simulation
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateParsing(e.dataTransfer.files[0].name);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      simulateParsing(e.target.files[0].name);
    }
  };

  const generateFhirConsent = (facilityName: string, id: string, status: 'Active' | 'Revoked') => {
    return JSON.stringify({
      resourceType: "Consent",
      id: `consent-${id}`,
      status: status === 'Active' ? 'active' : 'rejected',
      scope: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/consentscope",
          code: "patient-privacy",
          display: "Privacy Consent"
        }]
      },
      category: [{
        coding: [{
          system: "http://loinc.org",
          code: "59284-0",
          display: "Consent Document"
        }]
      }],
      patient: {
        reference: `Patient/${user?.name?.toLowerCase().replace(/ /g, '-')}`,
        display: user?.name
      },
      dateTime: new Date().toISOString(),
      organization: [{
        reference: `Organization/${facilityName.toLowerCase().replace(/ /g, '-')}`,
        display: facilityName
      }],
      sourceAttachment: {
        title: `${facilityName} Digital Privacy Consent Agreement`
      },
      policyRule: {
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
          code: "OPTOUT",
          display: "opt-out"
        }]
      },
      provision: {
        type: status === 'Active' ? 'permit' : 'deny',
        period: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        actor: [{
          role: {
            coding: [{
              system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType",
              code: "IRSP",
              display: "information recipient"
            }]
          },
          reference: {
            reference: `Practitioner/dr-${facilityName.toLowerCase().replace(/ /g, '-')}`,
            display: `Clinical Practitioners at ${facilityName}`
          }
        }],
        purpose: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-ActReason",
          code: "TREAT",
          display: "treatment"
        }],
        securityLabel: [{
          system: "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
          code: "N",
          display: "normal"
        }],
        class: [{
          system: "http://hl7.org/fhir/resource-types",
          code: "DocumentReference"
        }]
      }
    }, null, 2);
  };

  const simulateParsing = (filename: string) => {
    setUploading(true);
    setOcrStep('preprocessing');
    setOcrProgress(0);
    setOcrLogs(["OCR Pipeline triggered for file: " + filename]);
    setOcrSafetyAlerts([]);
    setParsedReminders(null);
    setOcrQueuedStatus(false);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setOcrProgress(progress);

      if (progress === 20) {
        setOcrLogs(prev => [...prev, "Preprocessing: Applying bilateral noise filtering & contrast stretch...", "Preprocessing: Deskew angle corrected (0.43° skew resolved)."]);
        setOcrStep('crnn');
      } else if (progress === 40) {
        setOcrLogs(prev => [...prev, "OCR Engine (CRNN+Attention): Initializing handwritten character segmentation grid...", "OCR Engine: Deciphering cursor line 1 -> 'Para 500mg TDS'", "OCR Engine: Deciphering cursor line 2 -> 'Ibu 400mg BD'"]);
        setOcrStep('ner');
      } else if (progress === 60) {
        setOcrLogs(prev => [...prev, "Clinical NLP NER: Extracting drug entities...", "NER Match: Identified 'Paracetamol 500mg' - Frequency: TDS (Three Times Daily)", "NER Match: Identified 'Ibuprofen 400mg' - Frequency: BD (Two Times Daily)"]);
        setOcrStep('validation');

        if (ocrQuality === 'low') {
          clearInterval(interval);
          setUploading(false);
          setOcrStep('done');
          setOcrLogs(prev => [
            ...prev,
            "OCR Warning: Character segmentation confidence drops to 52.4% (Below 60% threshold).",
            "Human-in-the-Loop protocol triggered: Prescription routed to Human Pharmacist Verification Console."
          ]);
          setOcrQueuedStatus(true);
          
          addToHitlQueue({
            id: `ocr-${Date.now()}`,
            patientName: user?.name || 'Aaravomen',
            filename: filename,
            rawText: "Rx:\nPara 500mg TDS\nIbu 400mg BD (Unclear scribbling)",
            ocrConfidence: 52.4
          });
          return;
        }
      } else if (progress === 80) {
        setOcrLogs(prev => [...prev, "Clinical Safety Module: Cross-referencing drug interaction database...", "Validation Warning: NSAID duplicative therapy check triggered.", "Validation Warning: Both Paracetamol and Ibuprofen are therapeutic analgesics. Combined usage increases NSAID exposure risk."]);
        setOcrSafetyAlerts(["SAFETY WARNING: Duplicate therapeutic class (NSAIDs) detected. Both Paracetamol and Ibuprofen provide pain/fever relief. Co-administration increases risk of gastrointestinal or renal toxicity."]);
        setOcrStep('done');
      } else if (progress === 90) {
        setOcrLogs(prev => [...prev, "Standardization Coder: Mapping SNOMED CT & ICD-10-CM...", "Matched Paracetamol -> SNOMED: 387584000", "Matched Ibuprofen -> SNOMED: 387207008", "Mapped claim diagnostic code -> ICD-10: R50.9 (Fever, unspecified)"]);
      } else if (progress >= 100) {
        clearInterval(interval);
        setUploading(false);
        setOcrStep('done');
        setParsedReminders([
          { name: "Paracetamol 500mg (TDS)", dosage: "1 Tablet", time: "14:00", stock_quantity: 15 },
          { name: "Ibuprofen 400mg (BD)", dosage: "1 Tablet", time: "20:00", stock_quantity: 14 }
        ]);

        addFhirLog(
          `Document OCR parsed: prescription digitised.`, 
          'success', 
          JSON.stringify({
            resourceType: "DocumentReference",
            id: `ocr-doc-${Date.now()}`,
            status: "current",
            type: { coding: [{ system: "http://loinc.org", code: "57133-1", display: "Referral note" }] },
            subject: { reference: `Patient/${user?.name?.toLowerCase().replace(/ /g, '-')}` },
            date: new Date().toISOString(),
            description: "Digitized prescription text via CRNN-OCR handwriting engine.",
            content: [{
              attachment: {
                contentType: "text/plain",
                data: btoa(`Rx:\nParacetamol 500mg TDS\nIbuprofen 400mg BD\nDiagnosis: Unspecified fever and joint pain`),
                title: filename
              }
            }]
          }, null, 2)
        );
      }
    }, 150);
  };

  const handleAddParsed = (item: any) => {
    addReminder({
      medicineId: item.name.includes("Paracetamol") ? 1 : 8,
      name: item.name,
      dosage: item.dosage,
      time: item.time,
      stock_quantity: item.stock_quantity
    });
    setParsedReminders(prev => prev ? prev.filter(r => r.name !== item.name) : null);
    addFhirLog(`New medicine reminder registered: ${item.name}`, 'info');
  };

  const handleTransmitScanShare = () => {
    setScanShareSuccess(true);
    addFhirLog(
      `ABDM Scan & Share demographic token transmitted to ${selectedClinic}`,
      'success',
      JSON.stringify({
        abhaId,
        abhaAddress,
        patientName: user.name,
        email: user.email,
        transmissionTime: new Date().toISOString(),
        registrationDeskToken: `ABDM-TKN-${Math.floor(Math.random() * 900000 + 100000)}`
      }, null, 2)
    );
    setTimeout(() => {
      setScanShareSuccess(false);
      setShowScanShareModal(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-hero pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Profile Banner */}
        <div className="bg-card border rounded-2xl p-6 shadow-medical flex flex-col md:flex-row items-center justify-between gap-6 mb-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <div 
              onClick={() => setIsSettingsModalOpen(true)}
              title="Click to manage profile and settings"
              className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-inner overflow-hidden cursor-pointer hover:opacity-90 transition-all shrink-0"
            >
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user.fullname || user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircle className="w-12 h-12" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{user.fullname || user.name}</h1>
                <button
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="text-primary hover:text-primary-glow p-1 rounded-lg hover:bg-secondary/40 transition-colors cursor-pointer"
                  title="Profile Settings"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{user.email}{user.username ? ` • @${user.username}` : ''}</p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold border border-primary/20">
                  <span>Patient Account</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded text-[10px] font-bold border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  <span>ABHA: {abhaId}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Link
              to="/appointments"
              className="px-4 py-2 border hover:bg-muted text-sm font-semibold rounded-lg transition-all"
            >
              Book New Appointment
            </Link>
            <Link
              to="/medicine-shop"
              className="px-4 py-2 bg-gradient-medical text-white text-sm font-semibold rounded-lg shadow-medical hover:opacity-90 transition-all"
            >
              Order Medicines
            </Link>
          </div>
        </div>

      {/* Premium Dashboard Segmented Tabs */}
      <div className="flex gap-2 border-b pb-4 mb-6 overflow-x-auto scrollbar-none scroll-touch-accelerated whitespace-nowrap">
        <button
          onClick={() => setActiveTab('records')}
          className={`shrink-0 px-4 py-3 min-h-[48px] rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
            activeTab === 'records'
              ? 'bg-primary text-primary-foreground border-primary shadow-medical'
              : 'bg-card text-muted-foreground border-border hover:bg-muted/40'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Consultations & Alerts</span>
        </button>
        <button
          onClick={() => setActiveTab('rpm')}
          className={`shrink-0 px-4 py-3 min-h-[48px] rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
            activeTab === 'rpm'
              ? 'bg-primary text-primary-foreground border-primary shadow-medical'
              : 'bg-card text-muted-foreground border-border hover:bg-muted/40'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Connected Health Sensors (IoMT)</span>
        </button>
        <button
          onClick={() => setActiveTab('abdm')}
          className={`shrink-0 px-4 py-3 min-h-[48px] rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
            activeTab === 'abdm'
              ? 'bg-primary text-primary-foreground border-primary shadow-medical'
              : 'bg-card text-muted-foreground border-border hover:bg-muted/40'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>ABDM Compliance Hub</span>
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`shrink-0 px-4 py-3 min-h-[48px] rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
            activeTab === 'reports'
              ? 'bg-primary text-primary-foreground border-primary shadow-medical'
              : 'bg-card text-muted-foreground border-border hover:bg-muted/40'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>My Reports (PHR Vault)</span>
        </button>
      </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Main Content Column (Left Side 2-Cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tab 1: Records & reminders */}
            {activeTab === 'records' && (
              <div className="space-y-6">
                
                {/* Active Consultations */}
                <div className="bg-card border rounded-2xl px-4 py-4 md:p-6 shadow-medical">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-primary" />
                    Active Consultations
                  </h2>

                  {patientAppointments.length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-xl">
                      <p className="text-sm text-muted-foreground mb-4">No appointments scheduled</p>
                      <Link
                        to="/appointments"
                        className="inline-flex items-center justify-center gap-1.5 text-xs text-primary font-bold hover:underline min-h-[48px] px-4 py-2"
                      >
                        <span>Book a doctor now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y space-y-4">
                      {patientAppointments.map((app) => (
                        <div key={app.id} className="flex justify-between items-start pt-4 first:pt-0">
                          <div>
                            <h3 className="font-semibold text-sm">{app.doctor_name}</h3>
                            <p className="text-xs text-primary font-medium">{app.specialty}</p>
                            <div className="flex gap-4 text-xs text-muted-foreground mt-2 font-medium">
                              <span>Date: {app.appointment_date}</span>
                              <span>Time: {app.appointment_time}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                              app.status === 'scheduled' 
                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                : app.status === 'cancelled'
                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                : 'bg-success/10 text-success border-success/20'
                            }`}>
                              {app.status.toUpperCase()}
                            </span>
                            
                            {app.status === 'scheduled' && (
                              <button
                                onClick={() => {
                                  updateAppointmentStatus(app.id, 'cancelled');
                                  addFhirLog(`Appointment with ${app.doctor_name} cancelled.`, 'info');
                                }}
                                className="min-h-[48px] px-3.5 py-2 flex items-center text-xs font-bold text-destructive hover:bg-destructive/5 rounded-xl border border-transparent hover:border-destructive/20 cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Diagnostic Lab Bookings */}
                <div className="bg-card border rounded-2xl px-4 py-4 md:p-6 shadow-medical">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Activity className="w-5 h-5 text-primary" />
                    Diagnostic Lab Bookings
                  </h2>

                  {testBookings.filter(b => b.patientId === abhaId || b.patientName === user?.fullname || b.patientName === user?.name).length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-xl">
                      <p className="text-sm text-muted-foreground mb-4">No diagnostic test appointments scheduled</p>
                      <Link
                        to="/book-test"
                        className="inline-flex items-center justify-center gap-1.5 text-xs text-primary font-bold hover:underline min-h-[48px] px-4 py-2"
                      >
                        <span>Book a lab test now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y space-y-4">
                      {testBookings.filter(b => b.patientId === abhaId || b.patientName === user?.fullname || b.patientName === user?.name).map((booking) => (
                        <div key={booking.id} className="flex justify-between items-start pt-4 first:pt-0">
                          <div>
                            <h3 className="font-semibold text-sm">{booking.testName}</h3>
                            <p className="text-xs text-primary font-medium">{booking.hospitalName}</p>
                            <div className="flex gap-4 text-xs text-muted-foreground mt-2 font-medium">
                              <span>Date: {booking.bookingDate}</span>
                              <span>Time: {booking.bookingTime}</span>
                              <span className="text-primary font-bold">Price: ₹{booking.price}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                              booking.status === 'scheduled' 
                                ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                : booking.status === 'cancelled'
                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                : 'bg-success/10 text-success border-success/20'
                            }`}>
                              {booking.status.toUpperCase()}
                            </span>
                            
                            {booking.status === 'scheduled' && (
                              <button
                                onClick={() => {
                                  updateTestBookingStatus(booking.id, 'cancelled');
                                }}
                                className="min-h-[48px] px-3.5 py-2 flex items-center text-xs font-bold text-destructive hover:bg-destructive/5 rounded-xl border border-transparent hover:border-destructive/20 cursor-pointer"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reminders & Schedules */}
                <div className="bg-card border rounded-2xl px-4 py-4 md:p-6 shadow-medical">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Pill className="w-5 h-5 text-primary" />
                    Prescription Schedules & Intake Alerts
                  </h2>

                  {reminders.filter(r => !r.user_id || r.user_id === user.email).length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-xl">
                      <p className="text-sm text-muted-foreground mb-4">No medicine reminders configured</p>
                      <Link
                        to="/medicines"
                        className="inline-flex items-center justify-center gap-1.5 text-xs text-primary font-bold hover:underline min-h-[48px] px-4 py-2"
                      >
                        <span>Configure reminders</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reminders.filter(r => !r.user_id || r.user_id === user.email).map((reminder) => {
                        const lowStock = reminder.stock_quantity < 5;
                        
                        // Step 1: Check Days of Week (Weekly Day Guard)
                        const todayName = new Date(now).toLocaleDateString('en-US', { weekday: 'long' });
                        const daysArray = Array.isArray(reminder.daysOfWeek)
                          ? reminder.daysOfWeek
                          : typeof reminder.daysOfWeek === 'string'
                            ? (reminder.daysOfWeek.startsWith('[') ? JSON.parse(reminder.daysOfWeek) : [reminder.daysOfWeek])
                            : ['Everyday'];
                        const isScheduledToday = daysArray.includes('Everyday') || daysArray.includes(todayName);

                        // Step 2: Check Time Elapsed (Interval Lockout Guard)
                        const lastTaken = reminder.lastTakenTime || reminder.last_taken_at;
                        const intervalHours = reminder.intervalHours ?? 24;
                        const intervalMs = intervalHours * 3600 * 1000;
                        const isLockedOut = lastTaken ? (now - new Date(lastTaken).getTime() < intervalMs) : false;

                        // Calculate live countdown timer values if locked out
                        let formattedTimeLeft = '';
                        if (lastTaken && isLockedOut) {
                          const timeLeftMs = intervalMs - (now - new Date(lastTaken).getTime());
                          const hoursLeft = Math.floor(timeLeftMs / (3600 * 1000));
                          const minsLeft = Math.floor((timeLeftMs % (3600 * 1000)) / (60 * 1000));
                          const secsLeft = Math.floor((timeLeftMs % (60 * 1000)) / 1000);
                          formattedTimeLeft = `Next Dose in ${hoursLeft.toString().padStart(2, '0')}h ${minsLeft.toString().padStart(2, '0')}m ${secsLeft.toString().padStart(2, '0')}s`;
                        }

                        // Determine button status
                        let btnDisabled = false;
                        let btnText = 'Mark Taken';
                        let btnPulseClass = '';
                        let btnColorClass = 'bg-gradient-medical text-white';

                        if (!isScheduledToday) {
                          btnDisabled = true;
                          btnText = `Not Scheduled Today (Next: ${daysArray.filter(d => d !== 'Everyday').join(', ') || 'Scheduled Days'})`;
                          btnColorClass = 'bg-muted/50 text-muted-foreground/60 border border-border/40';
                        } else if (isLockedOut) {
                          btnDisabled = true;
                          btnText = formattedTimeLeft;
                          btnColorClass = 'bg-muted/30 text-muted-foreground/50 border border-border/20';
                        } else {
                          // Both guards passed: alarm sounding!
                          btnPulseClass = 'animate-pulse shadow-medical';
                          btnText = 'Take Now! (Sounding Alarm)';
                          btnColorClass = 'bg-gradient-medical text-white font-black hover:opacity-90';
                        }

                        return (
                          <div key={reminder.id} className="border px-4 py-4 rounded-xl space-y-3 relative flex flex-col justify-between bg-card hover:shadow-elevated transition-all scroll-touch-accelerated">
                            <button
                              onClick={() => deleteReminder(reminder.id)}
                              className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors min-h-[30px] p-1.5 rounded-lg hover:bg-muted"
                              aria-label="Delete Reminder"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            <div>
                              <h3 className="font-bold text-sm text-foreground">{reminder.name}</h3>
                              <div className="flex justify-between text-xs text-muted-foreground mt-1 font-semibold">
                                <span>Dosage: {reminder.dosage}</span>
                                <span>Time: {reminder.time}</span>
                              </div>
                              <div className="text-[10px] text-muted-foreground/80 mt-1 font-semibold flex justify-between">
                                <span>Schedule: {daysArray.join(', ')}</span>
                                <span>Interval: {reminder.intervalHours ?? 24}h</span>
                              </div>
                              
                              <div className="mt-2 text-xs flex justify-between items-center font-medium">
                                <span className={lowStock ? 'text-destructive font-semibold flex items-center gap-0.5' : 'text-muted-foreground'}>
                                  {lowStock && <AlertTriangle className="w-3.5 h-3.5" />}
                                  Stock: {reminder.stock_quantity} left
                                </span>
                                
                                {lastTaken && (
                                  <span className="text-[10px] bg-success/15 text-success border border-success/20 px-1.5 py-0.5 rounded font-mono">
                                    Taken: {new Date(lastTaken).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 flex gap-2">
                              <button
                                onClick={() => {
                                  markAsTaken(reminder.id);
                                  cleanupAudio();
                                }}
                                disabled={btnDisabled || reminder.stock_quantity === 0}
                                className={`flex-1 py-3 min-h-[48px] rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${btnColorClass} ${btnPulseClass} disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{btnText}</span>
                              </button>
                              
                              {lowStock && (
                                <Link
                                  to="/medicine-shop"
                                  className="px-4 py-2.5 min-h-[48px] border border-primary/20 text-primary hover:bg-secondary/40 text-xs font-bold rounded-xl flex items-center justify-center cursor-pointer"
                                >
                                  Refill
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 4: My Reports PHR Vault */}
            {activeTab === 'reports' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-card border rounded-2xl px-4 py-4 md:p-6 shadow-medical">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 border-b pb-4 gap-4">
                    <div>
                      <h2 className="text-lg font-bold flex items-center gap-2 text-primary">
                        <FileText className="w-5 h-5 text-primary" />
                        My Longitudinal Reports Vault (PHR)
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Historical health records linked to your ABHA address ({abhaAddress}) in real-time.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] bg-primary/15 border border-primary/25 text-primary px-3 py-1 rounded-full font-bold">
                        {healthDocuments.filter(doc => doc.abhaId === abhaId).length} Records Linked
                      </span>
                      <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="py-2.5 px-4 min-h-[48px] bg-gradient-medical text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-medical hover:opacity-95 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Upload New Record</span>
                      </button>
                    </div>
                  </div>

                  {healthDocuments.filter(doc => doc.abhaId === abhaId).length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-2xl">
                      <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-2 animate-pulse" />
                      <p className="text-sm text-muted-foreground">No reports found linked to your ABHA address.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {healthDocuments.filter(doc => doc.abhaId === abhaId).map((doc) => (
                        <div key={doc.id} className="border px-4 py-4 sm:p-5 rounded-xl bg-card space-y-3.5 relative flex flex-col justify-between hover:shadow-elevated transition-all scroll-touch-accelerated">
                          <div>
                            <div className="flex justify-between items-start">
                              <span className={`text-[9px] font-black uppercase border px-2 py-0.5 rounded-full ${
                                doc.documentType === 'prescription'
                                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/25'
                                  : doc.documentType === 'diagnostic_report'
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                                  : doc.documentType === 'billing'
                                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/25'
                                  : 'bg-primary/10 text-primary border-primary/20'
                              }`}>
                                {doc.documentType.replace('_', ' ')}
                              </span>
                              <span className="text-[9px] font-mono text-muted-foreground font-semibold">
                                {new Date(doc.uploadedAt).toLocaleDateString()}
                              </span>
                            </div>

                            <h3 className="font-extrabold text-xs text-foreground mt-2 line-clamp-1">{doc.title}</h3>
                            <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1 font-medium">
                              <span className="font-bold text-foreground">Facility:</span> {doc.facilityName}
                            </p>
                            
                            {/* Dynamically parsed FHIR payload attributes */}
                            {(() => {
                              try {
                                if (doc.fhirRecord) {
                                  const parsed = JSON.parse(doc.fhirRecord);
                                  if (parsed.fhirType === 'Billing' && parsed.amount) {
                                    return (
                                      <p className="text-[10px] text-success font-bold mt-1">
                                        Total Bill Amount: ₹{parsed.amount}
                                      </p>
                                    );
                                  }
                                  if (parsed.fhirType === 'Prescription') {
                                    return (
                                      <div className="text-[9px] bg-secondary/30 rounded p-1.5 mt-1 border border-border/20 text-muted-foreground font-semibold space-y-0.5">
                                        <p><span className="text-foreground">Dosage:</span> {parsed.dosage}</p>
                                        <p><span className="text-foreground">Time:</span> {parsed.frequency}</p>
                                        <p><span className="text-foreground">Schedule:</span> {parsed.daysOfWeek}</p>
                                        <p><span className="text-foreground">Interval:</span> {parsed.intervalHours}h</p>
                                      </div>
                                    );
                                  }
                                }
                              } catch (e) {}
                              return null;
                            })()}

                            <p className="text-[9px] text-amber-600 dark:text-amber-400 font-mono mt-1 font-bold">
                              Care Context Reference: {doc.careContextId}
                            </p>
                          </div>

                          <div className="flex gap-2 pt-2 border-t text-[10px] sm:text-xs">
                            <button
                              onClick={() => {
                                setShowFhirPayloadModal({
                                  id: doc.id,
                                  event: `ABDM Linked Care Context EMR File: ${doc.title}`,
                                  payload: doc.fhirRecord
                                });
                              }}
                              className="flex-1 py-3 min-h-[48px] border border-primary/20 text-primary hover:bg-primary/5 font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <FileCode className="w-3.5 h-3.5" />
                              <span>FHIR Record</span>
                            </button>
                            {doc.fileUrl && (
                              <button
                                onClick={() => alert(`Simulating file download: ${doc.fileUrl}`)}
                                className="flex-1 py-3 min-h-[48px] bg-gradient-medical text-white font-bold rounded-xl shadow-medical hover:opacity-95 flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Download PDF</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Remote Patient Monitoring (IoMT) */}
            {activeTab === 'rpm' && (
              <div className="space-y-6">
                
                {/* Vitals Telemetry Grid */}
                <div className="bg-card border rounded-2xl px-4 py-4 md:p-6 shadow-medical">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary animate-pulse" />
                      Passive Wearable Telemetry (Apple HealthKit)
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success bg-success/10 border border-success/25 px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 bg-success rounded-full animate-ping"></span>
                      Device Online
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    
                    {/* HRV */}
                    <div className="border rounded-xl p-4 space-y-1.5 bg-secondary/10">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Heart Rate Variability</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-foreground">{telemetry.hrv}</span>
                        <span className="text-xs text-muted-foreground font-semibold">ms</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${telemetry.hrv < 40 ? 'bg-amber-500' : 'bg-success'}`} />
                        <span>{telemetry.hrv < 40 ? 'High Stress Detected' : 'Healthy Status'}</span>
                      </div>
                    </div>

                    {/* Resting HR */}
                    <div className="border rounded-xl p-4 space-y-1.5 bg-secondary/10">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Resting Heart Rate</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-foreground">{telemetry.restingHr}</span>
                        <span className="text-xs text-muted-foreground font-semibold">bpm</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />
                        <span>Baseline Normal</span>
                      </div>
                    </div>

                    {/* SpO2 */}
                    <div className="border rounded-xl p-4 space-y-1.5 bg-secondary/10">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Oxygen Saturation</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-foreground">{telemetry.spo2}</span>
                        <span className="text-xs text-muted-foreground font-semibold">%</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />
                        <span>Optimal Oxygenation</span>
                      </div>
                    </div>

                    {/* Glucose CGM */}
                    <div className="border rounded-xl p-4 space-y-1.5 bg-secondary/10">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Blood Glucose (CGM)</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-foreground">{telemetry.glucose}</span>
                        <span className="text-xs text-muted-foreground font-semibold">mg/dL</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${telemetry.glucose > 180 ? 'bg-destructive' : 'bg-success'}`} />
                        <span>{telemetry.glucose > 180 ? 'Elevated Hyperglycemia' : 'Stable Range'}</span>
                      </div>
                    </div>

                    {/* Sleep */}
                    <div className="border rounded-xl p-4 space-y-1.5 bg-secondary/10">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Sleep Quality</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-foreground">{telemetry.sleep}</span>
                        <span className="text-xs text-muted-foreground font-semibold">/100</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" />
                        <span>Excellent Architecture</span>
                      </div>
                    </div>

                    {/* Smartphone Face Scanner Trigger Card */}
                    <button
                      onClick={() => {
                        setShowFaceScanModal(true);
                        setFaceScanStep('idle');
                        setFaceScanProgress(0);
                      }}
                      className="border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 rounded-xl p-4 text-left flex flex-col justify-between transition-all"
                    >
                      <div className="p-1 bg-primary/10 rounded-lg text-primary self-start">
                        <Camera className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-primary uppercase">Face Scanner</p>
                        <p className="text-[9px] text-muted-foreground font-semibold">Scan Vitals via Camera</p>
                      </div>
                    </button>

                  </div>

                  {/* Manual Telemetry Controls for Demo Simulation */}
                  <div className="mt-6 border-t pt-4 space-y-4">
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-muted-foreground" />
                      Connected Wearable Device Emulator (Demo Sandbox)
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Use the sliders to simulate changes in biometric signals and trigger the automated **AI+AI Health Nudges**.
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span>Simulate CGM Blood Glucose:</span>
                          <span className="font-mono text-primary font-bold">{manualGlucose} mg/dL</span>
                        </div>
                        <input
                          type="range"
                          min="70"
                          max="250"
                          value={manualGlucose}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setManualGlucose(val);
                            updateTelemetry({ glucose: val });
                          }}
                          className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span>Simulate Heart Rate Variability:</span>
                          <span className="font-mono text-primary font-bold">{manualHrv} ms</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="100"
                          value={manualHrv}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setManualHrv(val);
                            updateTelemetry({ hrv: val });
                          }}
                          className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Health Nudges Feed */}
                <div className="bg-card border rounded-2xl p-6 shadow-medical">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-primary" />
                    AI+AI Real-Time Health Nudges & Interventions
                  </h2>

                  <div className="space-y-3">
                    {healthNudges.map((nudge) => (
                      <div 
                        key={nudge.id} 
                        className={`border rounded-xl p-3 text-xs flex items-start gap-2.5 ${
                          nudge.type === 'critical' 
                            ? 'bg-red-500/10 border-red-500/25 text-red-600 dark:text-red-400' 
                            : nudge.type === 'warning'
                            ? 'bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400'
                            : 'bg-primary/5 border-primary/10 text-foreground'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="font-medium">{nudge.message}</p>
                          <span className="text-[9px] text-muted-foreground block font-mono">
                            Logged: {new Date(nudge.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Tab 3: ABDM Compliance Hub */}
            {activeTab === 'abdm' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* ABDM Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* ABHA National Card */}
                  <div className="bg-gradient-to-br from-blue-700 to-indigo-900 text-white rounded-2xl px-4 py-4 md:p-6 shadow-elevated relative overflow-hidden flex flex-col justify-between h-58 border border-white/10 scroll-touch-accelerated">
                    <div className="absolute right-0 top-0 w-28 h-28 bg-white/5 rounded-full -mr-6 -mt-6"></div>
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] font-bold tracking-widest text-blue-200 uppercase">National Health ID Card</p>
                        <p className="text-xs font-bold text-white mt-1">Ayushman Bharat Digital Mission</p>
                      </div>
                      <div className="bg-white/15 px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border border-white/20">
                        Govt of India
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="font-mono font-bold text-lg tracking-wider">{abhaId}</p>
                      <div className="text-xs">
                        <div className="flex justify-between font-semibold">
                          <span>Name: {user.fullname || user.name}</span>
                          <span>Address: {abhaAddress}</span>
                        </div>
                        <p className="text-[9px] text-blue-200 mt-1">Authorized health repository user link</p>
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-3 flex justify-between items-center text-[10px]">
                      <button
                        onClick={() => {
                          setAbhaModalOpen(true);
                          setAbhaOtpStep('aadhaar');
                          setAadhaarNumber('');
                          setAadhaarOtp('');
                        }}
                        className="text-blue-200 hover:text-white font-bold underline cursor-pointer min-h-[48px] flex items-center"
                      >
                        Generate / Link ABHA Card
                      </button>
                      <button
                        onClick={() => setShowScanShareModal(true)}
                        className="px-3.5 py-2.5 bg-white text-indigo-950 font-bold rounded hover:opacity-90 flex items-center gap-1 transition-all min-h-[48px] justify-center cursor-pointer"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>Scan & Share (OPD)</span>
                      </button>
                    </div>
                  </div>

                  {/* ABDM QR Code Details info */}
                  <div className="border border-border rounded-2xl px-4 py-4 md:p-6 bg-card space-y-4 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                        <Share2 className="w-4 h-4 text-primary" />
                        Clinic Queue Bypass (Scan & Share)
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Scan the ABDM registration counter QR code at government and private hospitals to securely share demographics. This skips outpatient (OPD) queue booking desks instantly.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowScanShareModal(true)}
                      className="w-full py-3 min-h-[48px] bg-gradient-medical text-white font-bold text-xs rounded-xl shadow-medical flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Bypass Waiting Room Queue Now</span>
                    </button>
                  </div>

                </div>

                {/* Incoming Consent Requests */}
                <div className="bg-card border rounded-2xl px-4 py-4 md:p-6 shadow-medical">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-2 text-primary">
                    <Bell className="w-5 h-5 text-primary animate-bounce" />
                    Incoming Doctor Consent Requests (HIU Role)
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    Clinical practitioners requesting read permission to fetch your long-term EMR records. Granting access allows them to pull diagnostic results, prescriptions, and billing notes.
                  </p>

                  {consentRequests.filter(req => req.abhaId === abhaId && req.status === 'Pending').length === 0 ? (
                    <div className="text-center py-6 border border-dashed rounded-xl bg-muted/10">
                      <p className="text-xs text-muted-foreground">No pending clinical consent requests</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {consentRequests.filter(req => req.abhaId === abhaId && req.status === 'Pending').map((req) => (
                        <div key={req.id} className="border px-4 py-4 rounded-xl bg-card relative text-left flex flex-col justify-between gap-4 scroll-touch-accelerated">
                          <div>
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-xs text-foreground">HIU Facility: {req.facility}</h3>
                              <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/25 px-1.5 py-0.2 rounded font-black uppercase animate-pulse">
                                AWAITING ACTION
                              </span>
                            </div>
                            <p className="text-[10px] text-primary font-bold mt-1">Requested by: Dr. {req.doctorName}</p>
                            
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {req.dataTypes.map((type, idx) => (
                                <span key={idx} className="text-[8px] bg-secondary border px-1.5 py-0.2 rounded font-bold text-foreground">
                                  {type}
                                </span>
                              ))}
                            </div>
                            
                            <span className="text-[9px] text-muted-foreground font-semibold mt-2 block">
                              Duration requested: {req.duration}
                            </span>
                          </div>

                          <div className="flex gap-2 border-t pt-3 text-xs">
                            <button
                              onClick={() => denyConsentRequest(req.id)}
                              className="flex-1 py-3 min-h-[48px] border border-destructive/20 text-destructive hover:bg-destructive/5 font-bold rounded-xl cursor-pointer flex items-center justify-center"
                            >
                              Deny Access
                            </button>
                            <button
                              onClick={() => approveConsentRequest(req.id)}
                              className="flex-1 py-3 min-h-[48px] bg-gradient-medical text-white font-bold rounded-xl shadow-medical hover:opacity-95 cursor-pointer flex items-center justify-center"
                            >
                              Approve Access
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ABDM Consent Manager */}
                <div className="bg-card border rounded-2xl px-4 py-4 md:p-6 shadow-medical">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <Lock className="w-5 h-5 text-primary" />
                    ABDM Patient Consent Manager Console
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    As an ABDM compliant user, you maintain complete ownership of your health records. Approve or revoke permissions for clinics and specialists to pull diagnoses, prescriptions, and lab values.
                  </p>

                  <div className="divide-y space-y-4">
                    {consentRecords.filter(rec => !rec.abhaId || rec.abhaId === abhaId).map((rec) => (
                      <div key={rec.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 first:pt-0 gap-4">
                        <div>
                          <h3 className="font-bold text-sm text-foreground">{rec.facility}</h3>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {rec.dataTypes.map((t: string, idx: number) => (
                              <span key={idx} className="text-[9px] bg-secondary px-2 py-0.5 rounded font-medium border text-foreground">
                                {t}
                              </span>
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1.5 block font-semibold">
                            Validity: {rec.duration}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${
                            rec.status === 'Active' 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                              : 'bg-destructive/10 text-destructive border-destructive/25'
                          }`}>
                            {rec.status.toUpperCase()}
                          </span>

                          <button
                            onClick={() => {
                              const fhirConsentJson = generateFhirConsent(rec.facility, rec.id, rec.status);
                              setShowFhirPayloadModal({
                                id: `consent-${rec.id}`,
                                event: `ABDM Consent Resource (${rec.status}): ${rec.facility}`,
                                payload: fhirConsentJson
                              });
                            }}
                            className="px-3 py-2 text-[10px] font-bold border border-primary/20 text-primary hover:bg-primary/5 rounded-xl flex items-center gap-1 min-h-[48px] justify-center cursor-pointer"
                          >
                            <FileCode className="w-3.5 h-3.5" />
                            <span>FHIR JSON</span>
                          </button>

                          <button
                            onClick={() => {
                              const nextStatus = rec.status === 'Active' ? 'Revoked' : 'Active';
                              updateConsentStatus(rec.id, nextStatus);
                              const fhirConsentJson = generateFhirConsent(rec.facility, rec.id, nextStatus);
                              addFhirLog(`ABDM Consent for ${rec.facility} status set to ${nextStatus}`, 'payload', fhirConsentJson);
                            }}
                            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all min-h-[48px] flex items-center justify-center cursor-pointer ${
                              rec.status === 'Active'
                                ? 'text-destructive hover:bg-destructive/10 border-destructive/20'
                                : 'text-primary hover:bg-primary/10 border-primary/20'
                            }`}
                          >
                            {rec.status === 'Active' ? 'Revoke Access' : 'Approve Access'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* Right Sidebar Column (All Tabs) */}
          <div className="space-y-6">
            
            {/* FHIR / HL7 Interoperability Console */}
            <div className="bg-slate-950 text-slate-100 rounded-2xl p-5 shadow-elevated border border-slate-800 font-mono">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <h3 className="text-xs font-bold flex items-center gap-1.5 text-primary">
                  <Database className="w-4 h-4 animate-pulse" />
                  FHIR / HL7 Interop Console
                </h3>
                <span className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-emerald-500 font-bold bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded">
                  FHIR v4.0.1
                </span>
              </div>

              <div className="h-64 overflow-y-auto space-y-2.5 text-[10px] pr-1 scrollbar-thin">
                {fhirLogs.map((log) => (
                  <div key={log.id} className="border-b border-slate-900 pb-2 last:border-0 space-y-1">
                    <div className="flex justify-between items-center text-slate-500">
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <span className={`px-1.5 py-0.2 rounded-[3px] text-[8px] font-bold ${
                        log.type === 'success' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'
                      }`}>
                        {log.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-300 font-semibold">{log.event}</p>
                    {log.payload && (
                      <button
                        onClick={() => setShowFhirPayloadModal(log)}
                        className="text-[9px] text-primary hover:underline flex items-center gap-1 mt-1 cursor-pointer font-bold"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>View Resource JSON</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-slate-900 pt-3 flex justify-between items-center text-[9px] text-slate-500">
                <span>Receiver: EPIC/CERNER API</span>
                <span className="text-[10px]">Secure HL7 Engine</span>
              </div>
            </div>

            {/* Prescription Scanning Simulator Card */}
            <div className="bg-card border rounded-2xl p-6 shadow-medical">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-primary" />
                Scan Prescription
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                Drag-and-drop or select a file (PDF/Image) to parse doctor notes and register dosage reminders instantly.
              </p>

              {/* Quality Select Dropdown */}
              <div className="mb-4 text-left">
                <label className="text-[10px] font-extrabold text-muted-foreground uppercase block mb-1">OCR Quality Profile</label>
                <select
                  value={ocrQuality}
                  onChange={(e) => setOcrQuality(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                  disabled={uploading}
                >
                  <option value="high">High Quality Print / Clean Scan (Auto-parse)</option>
                  <option value="low">Handwritten Doctor Script / Low Contrast (Human-in-the-Loop Fallback)</option>
                </select>
              </div>

              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
                }`}
              >
                <input
                  type="file"
                  id="prescription-file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,application/pdf"
                  disabled={uploading}
                />
                
                {uploading ? (
                  <div className="space-y-4 text-left">
                    <div className="flex justify-between items-center text-xs font-bold text-primary">
                      <span className="capitalize animate-pulse flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Phase: {ocrStep} Processing...
                      </span>
                      <span className="font-mono">{ocrProgress}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-secondary dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-300" style={{ width: `${ocrProgress}%` }} />
                    </div>

                    {/* Step log list */}
                    <div className="bg-slate-950 text-slate-100 rounded-xl p-3 font-mono text-[9px] h-32 overflow-y-auto space-y-1.5 scrollbar-thin">
                      {ocrLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-1 leading-normal">
                          <span className="text-primary shrink-0">&gt;</span>
                          <span className="break-words">{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <label htmlFor="prescription-file" className="cursor-pointer block py-4">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2 group-hover:scale-115 transition-transform" />
                    <span className="text-xs font-bold text-primary hover:underline">Choose File</span>
                    <span className="text-[10px] text-muted-foreground block mt-1">or drag & drop here</span>
                  </label>
                )}
              </div>

              {/* Human in the loop queued notice */}
              {ocrQueuedStatus && !uploading && (
                <div className="mt-4 bg-blue-500/10 border border-blue-500/25 text-blue-600 dark:text-blue-400 p-3.5 rounded-xl text-left space-y-1.5 animate-fade-in">
                  <h4 className="text-[10px] font-extrabold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary animate-pulse" />
                    HUMAN-IN-THE-LOOP SAFETIES ENFORCED
                  </h4>
                  <p className="text-[9px] leading-relaxed font-semibold">
                    OCR confidence (52.4%) fell below the 60% legal safety gate. The prescription image has been safely routed to the **Pharmacist Verification Queue**. A certified pharmacist will review the notes and approve your dosage reminders shortly.
                  </p>
                </div>
              )}

              {/* Safety alerts */}
              {ocrSafetyAlerts.length > 0 && !uploading && (
                <div className="mt-4 bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 p-3 rounded-xl text-left space-y-1 animate-fade-in">
                  <h4 className="text-[10px] font-extrabold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Clinical Safety Warnings (Drug Validation Engine)
                  </h4>
                  {ocrSafetyAlerts.map((alert, idx) => (
                    <p key={idx} className="text-[9px] leading-relaxed font-semibold">
                      {alert}
                    </p>
                  ))}
                </div>
              )}

              {/* Parsed reminders drawer lists */}
              {parsedReminders && parsedReminders.length > 0 && !uploading && (
                <div className="mt-6 border-t pt-4 space-y-3 animate-fade-in">
                  <h3 className="text-xs font-bold text-foreground text-left">Detected Medicines & Reminders:</h3>
                  <div className="space-y-2">
                    {parsedReminders.map((item, idx) => (
                      <div key={idx} className="border p-2.5 rounded-lg flex items-center justify-between text-xs bg-muted/25 text-left">
                        <div>
                          <div className="font-semibold text-foreground">{item.name}</div>
                          <div className="text-[10px] text-muted-foreground">Dosage: {item.dosage} | Time: {item.time}</div>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              const searchName = item.name.split(' ')[0];
                              const med = medicines.find(m => m.name.toLowerCase().includes(searchName.toLowerCase()));
                              if (med) {
                                addToCart(med);
                                addFhirLog(`Added medicine to cart from parsed prescription: ${med.name}`, 'info');
                                alert(`${med.name} added to shopping cart!`);
                              } else {
                                alert(`Could not locate ${searchName} in current pharmacy catalog.`);
                              }
                            }}
                            className="px-2 py-1 bg-secondary text-foreground border border-border font-semibold rounded hover:bg-muted text-[10px]"
                          >
                            Buy
                          </button>
                          <button
                            onClick={() => handleAddParsed(item)}
                            className="px-2 py-1 bg-gradient-medical text-white font-semibold rounded hover:opacity-90 text-[10px]"
                          >
                            Add Alert
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Consultation Badge */}
            <div className="bg-gradient-medical p-6 rounded-2xl text-white shadow-elevated relative overflow-hidden flex flex-col justify-between h-48">
              <div className="absolute -right-4 -bottom-4 opacity-15">
                <Bell className="w-32 h-32" />
              </div>
              
              <div>
                <h3 className="font-bold text-lg">Need Immediate Guidance?</h3>
                <p className="text-xs text-white/80 mt-1 leading-relaxed">
                  Start an online chat session with our AI medical bot for instant relief suggestions.
                </p>
              </div>

              <Link
                to="/chat"
                className="self-start px-4 py-2 bg-white text-primary font-bold rounded-lg text-xs hover:scale-105 active:scale-95 transition-all shadow-md mt-4"
              >
                Launch Chat Screen
              </Link>
            </div>

          </div>
        </div>

      </div>

      {/* MODAL 1: ABDM Scan & Share Simulator */}
      {showScanShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card border rounded-3xl p-6 max-w-sm w-full shadow-elevated relative space-y-4 text-center">
            <button
              onClick={() => setShowScanShareModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground flex items-center justify-center gap-1.5">
                <Share2 className="w-5 h-5 text-primary" />
                ABDM QR Code Registry
              </h3>
              <p className="text-xs text-muted-foreground">
                Display this QR Code at the registration desk.
              </p>
            </div>

            {/* Styled Realistic QR Code Graphic */}
            <div className="w-48 h-48 mx-auto border-2 border-primary/20 rounded-2xl p-4 bg-white flex items-center justify-center shadow-inner relative">
              <svg className="w-full h-full text-indigo-950" viewBox="0 0 100 100">
                <rect x="5" y="5" width="20" height="20" fill="currentColor" />
                <rect x="9" y="9" width="12" height="12" fill="white" />
                <rect x="11" y="11" width="8" height="8" fill="currentColor" />
                
                <rect x="75" y="5" width="20" height="20" fill="currentColor" />
                <rect x="79" y="9" width="12" height="12" fill="white" />
                <rect x="81" y="11" width="8" height="8" fill="currentColor" />
                
                <rect x="5" y="75" width="20" height="20" fill="currentColor" />
                <rect x="9" y="79" width="12" height="12" fill="white" />
                <rect x="11" y="81" width="8" height="8" fill="currentColor" />
                
                <path d="M 35 15 h 5 v 10 h -5 z M 45 10 h 10 v 5 h -10 z M 60 20 h 5 v 20 h -5 z M 15 35 h 15 v 5 h -15 z M 20 45 h 5 v 15 h -5 z M 30 55 h 10 v 5 h -10 z M 50 50 h 10 v 10 h -10 z M 40 70 h 20 v 5 h -20 z M 75 40 h 10 v 5 h -10 z M 80 50 h 15 v 10 h -15 z M 70 70 h 10 v 15 h -10 z" fill="currentColor" />
              </svg>
              {/* ABDM Center overlay logo */}
              <div className="absolute inset-0 m-auto w-10 h-10 bg-white rounded-xl shadow border border-primary/10 flex items-center justify-center text-primary font-bold text-[9px] tracking-tighter">
                ABDM
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground block text-left">Select Registration Desk Counter:</label>
                <select
                  value={selectedClinic}
                  onChange={(e) => setSelectedClinic(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-card text-foreground"
                >
                  <option value="Sawai Man Singh Hospital">Sawai Man Singh Hospital Registration Desk</option>
                  <option value="Fortis Escorts Hospital">Fortis Escorts Hospital Registration Desk</option>
                  <option value="Apex Hospital">Apex Hospital Registration Desk</option>
                </select>
              </div>

              {scanShareSuccess ? (
                <div className="bg-success/15 border border-success/30 text-success text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Demographics Sent Successfully!</span>
                </div>
              ) : (
                <button
                  onClick={handleTransmitScanShare}
                  className="w-full py-2 bg-gradient-medical text-white font-semibold text-xs rounded-xl shadow-medical"
                >
                  Transmit Demographic Token
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Smartphone Vitals Scan Simulator */}
      {showFaceScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-card border rounded-3xl p-6 max-w-sm w-full shadow-elevated relative space-y-5 text-center">
            <button
              onClick={() => {
                setFaceScanStep('idle');
                setShowFaceScanModal(false);
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground flex items-center justify-center gap-1.5">
                <Camera className="w-5 h-5 text-primary" />
                AI Smartphone PPG Vitals Scan
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Uses remote photoplethysmography (rPPG) via skin color modifications to capture heart and respiration metrics.
              </p>
            </div>

            {/* Mock Camera Feed Area */}
            <div className="w-64 h-64 mx-auto rounded-full bg-slate-950 border-4 border-primary/20 relative overflow-hidden flex items-center justify-center shadow-lg">
              
              {/* Pulsing Face Outline overlay */}
              <div className={`absolute w-44 h-52 border-2 border-dashed rounded-full flex items-center justify-center transition-all ${
                faceScanStep === 'scanning' ? 'border-primary animate-pulse scale-105' : 'border-slate-800'
              }`}>
                {faceScanStep === 'idle' && (
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Align Face Here</span>
                )}
              </div>

              {/* Scanning Laser animation */}
              {faceScanStep === 'scanning' && (
                <div className="absolute w-full h-1.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-beam" />
              )}

              {/* Web-camera mock graphic inside */}
              {faceScanStep === 'scanning' && (
                <div className="space-y-1 text-center z-10">
                  <span className="text-2xl font-bold font-mono text-white animate-pulse">{liveHr}</span>
                  <span className="text-[9px] text-slate-400 block font-semibold">Measuring Heart Rate...</span>
                </div>
              )}

              {faceScanStep === 'success' && (
                <div className="space-y-1.5 text-center z-10 animate-fade-in">
                  <div className="w-10 h-10 rounded-full bg-success/20 border border-success/35 text-success flex items-center justify-center mx-auto mb-2 animate-bounce">
                    <Check className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-success font-bold block">Scan Verified</span>
                </div>
              )}
            </div>

            {/* Progress / Status controls */}
            <div className="space-y-4">
              {faceScanStep === 'scanning' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                    <span>Capturing raw telemetry...</span>
                    <span>{faceScanProgress}%</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${faceScanProgress}%` }} />
                  </div>
                </div>
              )}

              {faceScanStep === 'idle' && (
                <button
                  onClick={() => {
                    setFaceScanStep('scanning');
                    setFaceScanProgress(0);
                  }}
                  className="w-full py-2.5 bg-gradient-medical text-white font-semibold text-xs rounded-xl shadow-medical"
                >
                  Start 5-Sec Vitals Scan
                </button>
              )}

              {faceScanStep === 'success' && (
                <button
                  onClick={() => {
                    setFaceScanStep('idle');
                    setShowFaceScanModal(false);
                  }}
                  className="w-full py-2.5 bg-success text-white font-semibold text-xs rounded-xl shadow-medical"
                >
                  Save Results to Telemetry
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: FHIR Payload Viewer Modal */}
      {showFhirPayloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-elevated relative space-y-4 font-mono text-slate-100 flex flex-col h-[80vh]">
            <button
              onClick={() => setShowFhirPayloadModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1.5 border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-primary flex items-center gap-1.5">
                <FileCode className="w-4 h-4" />
                FHIR Resource Schema (JSON)
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold">
                Event: {showFhirPayloadModal.event}
              </p>
            </div>

            <div className="flex-1 overflow-auto bg-slate-900 border border-slate-800/60 rounded-xl p-4 text-[10px] text-emerald-400 select-all scrollbar-thin">
              <pre className="whitespace-pre-wrap">{showFhirPayloadModal.payload || `{ "info": "Standard HL7 log message. No payload payload attached." }`}</pre>
            </div>

            <div className="flex justify-between items-center text-[9px] text-slate-500 pt-2 border-t border-slate-800/60">
              <span>Standard: HL7 FHIR v4.0.1</span>
              <span>Encoding: UTF-8 Application/JSON</span>
            </div>
          </div>
        </div>
      )}

      {/* ABHA Aadhaar Registration Modal */}
      {abhaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in text-left">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-elevated relative space-y-5">
            <button
              onClick={() => setAbhaModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-foreground">ABHA ID Registration</h3>
                <p className="text-[10px] text-muted-foreground font-semibold">ABDM Sandbox Gateway v2.0</p>
              </div>
            </div>

            {abhaOtpStep === 'aadhaar' ? (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Enter your 12-digit UIDAI Aadhaar number to verify your identity with the National Health Authority gateway.
                </p>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase">Aadhaar Number *</label>
                  <input
                    type="text"
                    maxLength={14}
                    placeholder="e.g. 5240-9856-1120"
                    value={aadhaarNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const formatted = val.match(/.{1,4}/g)?.join('-') || val;
                      setAadhaarNumber(formatted.slice(0, 14));
                    }}
                    className="w-full px-3 py-2 border rounded-xl bg-card text-xs font-mono text-foreground"
                  />
                </div>
                <button
                  type="button"
                  disabled={aadhaarNumber.length < 14}
                  onClick={() => {
                    setAbhaOtpStep('otp');
                    addFhirLog(`OTP generated for Aadhaar ending in ${aadhaarNumber.slice(-4)}`, 'info');
                  }}
                  className="w-full py-2 bg-gradient-medical text-white font-bold text-xs rounded-xl shadow-medical disabled:opacity-50 hover:opacity-95"
                >
                  Send Verification SMS OTP
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A verification code has been dispatched to Aadhaar registered phone +91-******9824. Enter the code below.
                </p>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase">SMS OTP *</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. 123456"
                    value={aadhaarOtp}
                    onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3 py-2 border rounded-xl bg-card text-xs font-mono text-foreground text-center tracking-widest text-lg"
                  />
                </div>
                <button
                  type="button"
                  disabled={aadhaarOtp.length < 6}
                  onClick={() => {
                    const newId = `91-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`;
                    const addressHandle = `${user?.name.split(' ')[0].toLowerCase()}${Math.floor(Math.random() * 90 + 10)}@sbx`;
                    setAbhaDetails(newId, addressHandle);
                    setAbhaModalOpen(false);
                    alert(`ABHA Health Card Successfully Issued!\nID: ${newId}\nAddress: ${addressHandle}`);
                  }}
                  className="w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-medical disabled:opacity-50 hover:bg-emerald-700"
                >
                  Confirm & Link ABHA Account
                </button>
                <button
                  type="button"
                  onClick={() => setAbhaOtpStep('aadhaar')}
                  className="w-full text-center text-[10px] text-primary hover:underline font-bold"
                >
                  Go Back
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Patient Health Record Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in text-left">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-sm w-full shadow-elevated relative space-y-5">
            <button
              onClick={() => setIsUploadModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Upload Health Record</h3>
                <p className="text-[10px] text-muted-foreground font-semibold">ABDM Personal Health Locker</p>
              </div>
            </div>

            {uploadSuccessMsg ? (
              <div className="bg-success/15 border border-success/30 text-success text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>{uploadSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handlePatientUpload} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase">Document Type *</label>
                  <select
                    value={uploadDocType}
                    onChange={(e) => setUploadDocType(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-xl bg-card text-foreground"
                    required
                  >
                    <option value="prescription">Prescription</option>
                    <option value="diagnostic_report">Diagnostic Lab Report</option>
                    <option value="clinical_note">Clinical Note / Discharge Summary</option>
                    <option value="billing">Hospital Invoice / Medical Bill</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase">Record Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Apollo Blood Panel, Paracetamol Rx"
                    value={uploadDocTitle}
                    onChange={(e) => setUploadDocTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-card text-foreground font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase">Facility / Provider Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Fortis Hospital, Self-uploaded"
                    value={uploadFacilityName}
                    onChange={(e) => setUploadFacilityName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-card text-foreground font-semibold"
                    required
                  />
                </div>

                {/* Real File Selection with Image Preview */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase">Select Record File (PDF, JPG, PNG) *</label>
                  <label className="border border-dashed border-border p-4 rounded-xl text-center bg-muted/10 cursor-pointer hover:bg-muted/20 transition-all flex flex-col items-center justify-center min-h-[90px]">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setSelectedFile(file);
                          if (file.type.startsWith('image/')) {
                            setFilePreviewUrl(URL.createObjectURL(file));
                          } else {
                            setFilePreviewUrl(null);
                          }
                        }
                      }}
                      required
                    />
                    <Upload className="w-5 h-5 text-primary mb-1 animate-pulse" />
                    {selectedFile ? (
                      <div className="space-y-1 text-center">
                        <span className="text-[10px] text-foreground font-extrabold break-all">{selectedFile.name}</span>
                        <span className="text-[8px] text-muted-foreground block">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                        {filePreviewUrl && (
                          <img src={filePreviewUrl} alt="Preview" className="w-10 h-10 object-cover mx-auto rounded border border-border mt-1" />
                        )}
                      </div>
                    ) : (
                      <>
                        <span className="text-[10px] text-primary font-bold">Select PDF, JPEG, or PNG</span>
                        <span className="text-[8px] text-muted-foreground mt-0.5">Maximum size: 10MB</span>
                      </>
                    )}
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-medical text-white font-bold text-xs rounded-xl shadow-medical hover:opacity-95 cursor-pointer"
                >
                  Save to ABDM Locker
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-card border w-full max-w-2xl rounded-2xl shadow-elevated overflow-hidden p-6 my-8 space-y-6 text-left relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-primary animate-pulse" />
                Profile Settings
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsSettingsModalOpen(false);
                  setSettingsError('');
                  setSettingsSuccess('');
                  setPasswordError('');
                  setPasswordSuccess('');
                  setOldPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {settingsError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-2.5 rounded-lg font-medium">
                {settingsError}
              </div>
            )}

            {settingsSuccess && (
              <div className="bg-success/15 border border-success/35 text-success text-xs p-2.5 rounded-lg font-medium">
                {settingsSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Avatar upload */}
              <div className="flex flex-col items-center space-y-3 p-4 border rounded-xl bg-muted/5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase text-center">Profile Picture</label>
                <div className="relative group cursor-pointer w-24 h-24 rounded-full overflow-hidden border border-primary/20 bg-primary/5 flex items-center justify-center shadow-inner">
                  {user.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt={user.fullname || user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle className="w-16 h-16 text-primary/40" />
                  )}
                  <label className="absolute inset-0 bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold cursor-pointer">
                    <Camera className="w-5 h-5 mb-0.5" />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-[9px] text-muted-foreground text-center">
                  Click inside the avatar to upload a PNG or JPG (max 2MB)
                </p>
              </div>

              {/* Right Column: Profile details form */}
              <div className="md:col-span-2 space-y-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSettingsError('');
                    setSettingsSuccess('');
                    
                    // Username validation: lowercase, no spaces, only alphanumeric and underscores
                    const usernameRegex = /^[a-z0-9_]+$/;
                    if (profileUsername && !usernameRegex.test(profileUsername)) {
                      setSettingsError("Username must be lowercase, containing only letters, numbers, and underscores.");
                      return;
                    }
                    
                    try {
                      updateUserProfile({
                        fullname: profileFullname,
                        username: profileUsername,
                        email: profileEmail,
                        phoneNumber: profilePhone,
                        dob: profileDob
                      });
                      setSettingsSuccess("Profile details updated successfully!");
                    } catch (err: any) {
                      setSettingsError(err.message || "Failed to update profile.");
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Full Name *</label>
                      <input
                        type="text"
                        value={profileFullname}
                        onChange={(e) => setProfileFullname(e.target.value)}
                        className="w-full px-3 py-1.5 border rounded-lg text-xs bg-card text-foreground font-semibold"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Username *</label>
                      <input
                        type="text"
                        value={profileUsername}
                        onChange={(e) => setProfileUsername(e.target.value)}
                        className="w-full px-3 py-1.5 border rounded-lg text-xs bg-card text-foreground font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Email Address *</label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg text-xs bg-card text-foreground font-semibold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Phone Number</label>
                      <input
                        type="text"
                        placeholder="e.g. +91 9876543210"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full px-3 py-1.5 border rounded-lg text-xs bg-card text-foreground font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Date of Birth</label>
                      <input
                        type="date"
                        value={profileDob}
                        onChange={(e) => setProfileDob(e.target.value)}
                        className="w-full px-3 py-1.5 border rounded-lg text-xs bg-card text-foreground font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-medical cursor-pointer transition-colors"
                  >
                    Save Changes
                  </button>
                </form>
              </div>
            </div>

            {/* Change Password Section */}
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-extrabold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Change Password
              </h4>

              {passwordError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs p-2.5 rounded-lg font-medium">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-success/15 border border-success/35 text-success text-xs p-2.5 rounded-lg font-medium">
                  {passwordSuccess}
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPasswordError('');
                  setPasswordSuccess('');

                  if (!oldPassword) {
                    setPasswordError('Old password is required.');
                    return;
                  }

                  if (newPassword.length < 6) {
                    setPasswordError('New password must be at least 6 characters.');
                    return;
                  }

                  if (newPassword !== confirmPassword) {
                    setPasswordError('New passwords do not match.');
                    return;
                  }

                  try {
                    const success = changePassword(oldPassword, newPassword);
                    if (success) {
                      setPasswordSuccess('Password updated successfully!');
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }
                  } catch (err: any) {
                    setPasswordError(err.message || 'Password update failed.');
                  }
                }}
                className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Old Password *</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs bg-card text-foreground focus:outline-none animate-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">New Password *</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs bg-card text-foreground focus:outline-none animate-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase">Confirm New Password *</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs bg-card text-foreground focus:outline-none animate-none"
                    required
                  />
                </div>

                <div className="md:col-span-3 pt-2">
                  <button
                    type="submit"
                    className="w-full py-2 bg-primary text-white font-bold text-xs rounded-xl shadow-medical hover:opacity-90 cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PatientDashboard;
