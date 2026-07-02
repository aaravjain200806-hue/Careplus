import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { 
  Calendar, Stethoscope, ClipboardList, Check, X, UserCheck, 
  Plus, Sparkles, AlertTriangle, FileCode, Activity, Info, ShieldAlert,
  Camera, RefreshCw, CheckCircle2, Lock, Trash2, Sliders, Hospital as HospitalIcon, Clock
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const { 
    user, appointments, updateAppointmentStatus, medicines, addReminder, addFhirLog, hitlQueue, resolveHitlPrescription,
    healthDocuments, consentRequests, triggerConsentRequest, uploadHealthDocument, abhaRegistry, addAuditLog,
    hospitals, updateHospitalDetails, updateUserProfile, testBookings, updateTestBookingStatus
  } = useAppContext();

  // Selected appointment for AI Decision Support
  const [selectedApp, setSelectedApp] = useState<any>(null);

  // Prescription creation form state
  const [patientName, setPatientName] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [dosage, setDosage] = useState('1 Tablet Daily');
  const [time, setTime] = useState('09:00');
  const [duration, setDuration] = useState('7 days');
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // NMC Telemedicine compliance rules states
  const [complianceError, setComplianceError] = useState('');
  const [videoConsultCompleted, setVideoConsultCompleted] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoStatus, setVideoStatus] = useState<'idle' | 'connecting' | 'active' | 'completed'>('idle');
  const [videoSeconds, setVideoSeconds] = useState(4);

  // Human-in-the-Loop edit form states
  const [editingHitlId, setEditingHitlId] = useState<string | null>(null);
  const [correctedName, setCorrectedName] = useState('');
  const [correctedDosage, setCorrectedDosage] = useState('');
  const [correctedTime, setCorrectedTime] = useState('14:00');

  // ABDM EMR portal states
  const [searchAbhaId, setSearchAbhaId] = useState('');
  const [searchedAbhaId, setSearchedAbhaId] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [consentStatus, setConsentStatus] = useState<'Unrequested' | 'Pending' | 'Approved' | 'Denied'>('Unrequested');
  const [showFhirPayloadModal, setShowFhirPayloadModal] = useState<any | null>(null);

  // New EMR document upload form states
  const [newDocType, setNewDocType] = useState<'prescription' | 'diagnostic_report' | 'clinical_note' | 'billing'>('prescription');
  const [newDocTitle, setNewDocTitle] = useState('');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');
  const [newDocAmount, setNewDocAmount] = useState('500');
  const [newDocDosage, setNewDocDosage] = useState('1 Tablet');
  const [newDocFrequency, setNewDocFrequency] = useState('09:00 AM');
  const [newDocDaysOfWeek, setNewDocDaysOfWeek] = useState('Everyday');
  const [newDocIntervalHours, setNewDocIntervalHours] = useState('24');
  const [newDocStock, setNewDocStock] = useState('30');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);

  // Hospital Configurator States
  const [newTestName, setNewTestName] = useState('');
  const [newTestPrice, setNewTestPrice] = useState('');
  const [editingTestIdx, setEditingTestIdx] = useState<number | null>(null);
  const [editingTestName, setEditingTestName] = useState('');
  const [editingTestPrice, setEditingTestPrice] = useState('');

  // Doctor profile settings states
  const [docCategory, setDocCategory] = useState(user?.category || user?.specialization || 'General Physician');
  const [docFees, setDocFees] = useState(user?.fees || 500);
  const [docStartTime, setDocStartTime] = useState(user?.startTime || '09:00');
  const [docEndTime, setDocEndTime] = useState(user?.endTime || '13:00');
  const [docSaveSuccess, setDocSaveSuccess] = useState('');

  const handleAbhaLookup = () => {
    if (!searchAbhaId) return;
    setSearchedAbhaId(searchAbhaId);
    const normalize = (id: string) => id.replace(/[\s-]/g, "");
    const found = abhaRegistry.find(r => normalize(searchAbhaId) === normalize(r.abhaId));
    setLookupResult(found || null);

    // Audit Log for ABDM EMR fetch attempt (DPDP Act Compliance)
    addAuditLog(
      user?.userType || 'doctor',
      'VIEW_EMR_RECORD',
      searchAbhaId,
      found ? 'success' : 'failed'
    );
  };

  const handleRequestConsent = () => {
    if (!searchedAbhaId) return;
    triggerConsentRequest(searchedAbhaId, user?.name || "GP", user?.hospitalName || "Sawai Man Singh Hospital");
  };

  useEffect(() => {
    if (searchedAbhaId) {
      const activeReq = consentRequests.find(r => r.abhaId === searchedAbhaId);
      if (activeReq) {
        setConsentStatus(activeReq.status);
      } else {
        setConsentStatus('Unrequested');
      }
    }
  }, [consentRequests, searchedAbhaId]);

  const handleUploadDocument = () => {
    if (!searchedAbhaId || !newDocTitle || !lookupResult) return;
    
    // Generate structured compliance record JSON matching prompt criteria
    let fhirRecord = '';
    const recordId = `rec-${Date.now()}`;
    const facilityName = user?.hospitalName || user?.name || "Sawai Man Singh Hospital";
    const dateStr = new Date().toISOString().split('T')[0];

    if (newDocType === 'diagnostic_report') {
      fhirRecord = JSON.stringify({
        id: recordId,
        name: newDocTitle,
        facility: facilityName,
        date: dateStr,
        fhirType: 'DiagnosticReport'
      }, null, 2);
    } else if (newDocType === 'billing') {
      fhirRecord = JSON.stringify({
        id: recordId,
        name: newDocTitle,
        facility: facilityName,
        date: dateStr,
        amount: Number(newDocAmount),
        fhirType: 'Billing'
      }, null, 2);
    } else if (newDocType === 'prescription') {
      fhirRecord = JSON.stringify({
        id: recordId,
        name: newDocTitle,
        dosage: newDocDosage,
        frequency: newDocFrequency,
        daysOfWeek: newDocDaysOfWeek,
        intervalHours: Number(newDocIntervalHours),
        stock: Number(newDocStock),
        fhirType: 'Prescription'
      }, null, 2);

      // Auto-trigger reminder registration so patient gets it in their timeline schedule
      addReminder({
        medicineId: newDocTitle.toLowerCase().includes('paracetamol') ? 1 : 4,
        name: newDocTitle,
        dosage: newDocDosage,
        time: newDocFrequency,
        stock_quantity: Number(newDocStock),
        daysOfWeek: newDocDaysOfWeek.includes(',') ? newDocDaysOfWeek.split(',').map((s: string) => s.trim()) : [newDocDaysOfWeek],
        durationDays: 30,
        intervalHours: Number(newDocIntervalHours),
        lastTakenTime: null,
        startDate: new Date().toISOString()
      });
    } else {
      fhirRecord = JSON.stringify({
        id: recordId,
        name: newDocTitle,
        facility: facilityName,
        date: dateStr,
        fhirType: 'ClinicalNote'
      }, null, 2);
    }

    uploadHealthDocument({
      abhaId: searchedAbhaId,
      abhaAddress: lookupResult.address,
      title: newDocTitle,
      documentType: newDocType,
      facilityName: facilityName,
      fileUrl: selectedFile ? selectedFile.name : `${newDocTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_file.pdf`,
      fhirRecord
    });

    // Audit Log for HIP Document Upload (DPDP Act Compliance)
    addAuditLog(
      user?.userType || 'doctor',
      'UPLOAD_EMR_DOCUMENT',
      searchedAbhaId,
      'success'
    );

    setUploadSuccessMsg(`Document linked and care context created successfully for ${lookupResult.name}!`);
    setNewDocTitle('');
    setSelectedFile(null);
    setFilePreviewUrl(null);
    
    setTimeout(() => {
      setUploadSuccessMsg('');
    }, 3000);
  };

  // Billing code states
  const [icdCode, setIcdCode] = useState('R50.9');
  const [icdDesc, setIcdDesc] = useState('Fever, unspecified');
  const [cptCode, setCptCode] = useState('99213');
  const [cptDesc, setCptDesc] = useState('Outpatient telehealth visit, 15-29m');

  // Filter scheduled appointments
  const pendingAppointments = appointments.filter(a => a.status === 'scheduled');
  const completedAppointments = appointments.filter(a => a.status === 'completed');

  // Auto-select first appointment in queue if not set
  useEffect(() => {
    if (pendingAppointments.length > 0 && !selectedApp) {
      setSelectedApp(pendingAppointments[0]);
    } else if (pendingAppointments.length === 0) {
      setSelectedApp(null);
    }
  }, [pendingAppointments, selectedApp]);

  // Sync patient name and suggest billing codes based on selected appointment
  useEffect(() => {
    if (selectedApp) {
      setPatientName(selectedApp.patient_name);
      setComplianceError('');
      setVideoConsultCompleted(false);
      
      // Auto-code depending on patient specialty/symptoms
      if (selectedApp.specialty === 'Cardiologist' || selectedApp.specialty === 'Cardiology') {
        setIcdCode('I25.11');
        setIcdDesc('Atherosclerotic heart disease with unstable angina');
        setCptCode('99285');
        setCptDesc('Emergency department visit, high severity');
      } else if (selectedApp.specialty === 'Pediatrician' || selectedApp.specialty === 'Pediatrics') {
        setIcdCode('R50.9');
        setIcdDesc('Fever, unspecified (Pediatric)');
        setCptCode('99213');
        setCptDesc('Outpatient telehealth visit, 15-29m');
      } else if (selectedApp.specialty === 'Neurologist' || selectedApp.specialty === 'Neurology') {
        setIcdCode('G43.909');
        setIcdDesc('Migraine, unspecified, not intractable');
        setCptCode('99214');
        setCptDesc('Outpatient office visit, 30-39m');
      } else {
        setIcdCode('J06.9');
        setIcdDesc('Acute upper respiratory infection, unspecified');
        setCptCode('99213');
        setCptDesc('Outpatient telehealth visit, 15-29m');
      }
    }
  }, [selectedApp]);

  // Sync billing codes when medicine changes
  const handleMedicineChange = (medName: string) => {
    setSelectedMedicine(medName);
    setComplianceError('');
    if (!medName) return;

    const med = medicines.find(m => m.name === medName);
    if (!med) return;

    // NMC guidelines checks
    const prohibitedDrugs = ['Alprazolam 0.5mg', 'Morphine 10mg'];
    const listADrugs = ['Amoxicillin 500mg', 'Azithromycin 500mg', 'Metformin 500mg', 'Losartan 50mg'];

    if (prohibitedDrugs.includes(medName)) {
      setComplianceError(`NMC COMPLIANCE BLOCK: ${medName} is on the Prohibited Narcotics List. Online e-prescribing is permanently banned. Breach will trigger a compliance audit.`);
    } else if (listADrugs.includes(medName) && !videoConsultCompleted) {
      setComplianceError(`NMC COMPLIANCE BLOCK: ${medName} is a List A prescription drug. Under Telemedicine Guidelines 2020, List A drugs require identity confirmation via High-Fidelity Video Call before prescription transmission.`);
    }

    // Apply coding mappings based on medicine category
    switch (med.category) {
      case 'Pain Relief':
        setIcdCode('M25.50');
        setIcdDesc('Pain in unspecified joint');
        break;
      case 'Antibiotic':
        setIcdCode('J20.9');
        setIcdDesc('Acute bronchitis, unspecified');
        break;
      case 'Allergy':
        setIcdCode('L23.9');
        setIcdDesc('Allergic contact dermatitis, unspecified');
        break;
      case 'Diabetes':
        setIcdCode('E11.9');
        setIcdDesc('Type 2 diabetes mellitus without complications');
        break;
      case 'Cardiac':
        setIcdCode('I10');
        setIcdDesc('Essential (primary) hypertension');
        break;
      case 'Digestive':
        setIcdCode('K21.9');
        setIcdDesc('Gastro-esophageal reflux disease without esophagitis');
        break;
      default:
        setIcdCode('Z00.00');
        setIcdDesc('Encounter for general adult examination');
    }
  };

  const handleCreatePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !selectedMedicine) return;

    const prohibitedDrugs = ['Alprazolam 0.5mg', 'Morphine 10mg'];
    const listADrugs = ['Amoxicillin 500mg', 'Azithromycin 500mg', 'Metformin 500mg', 'Losartan 50mg'];

    if (prohibitedDrugs.includes(selectedMedicine)) {
      setComplianceError(`NMC COMPLIANCE BLOCK: Transmit blocked. Prohibited substance.`);
      addFhirLog(
        `NMC COMPLIANCE WARN: Blocked practitioner attempt to e-prescribe narcotic ${selectedMedicine} to ${patientName}`,
        'payload',
        JSON.stringify({
          practitioner: user?.name,
          patient: patientName,
          substance: selectedMedicine,
          icd10: icdCode,
          action: "BLOCKED_AUDITED",
          regulation: "NMC Telemedicine Guidelines 2020 (Prohibited List)"
        }, null, 2)
      );
      return;
    }

    if (listADrugs.includes(selectedMedicine) && !videoConsultCompleted) {
      setComplianceError(`NMC COMPLIANCE BLOCK: List A requires High-Fidelity Video Consultation.`);
      return;
    }

    // Send prescription alert to patient
    const medObj = medicines.find(m => m.name === selectedMedicine);
    const mId = medObj ? medObj.id : Date.now();

    addReminder({
      medicineId: mId,
      name: `${selectedMedicine} (${duration})`,
      dosage: dosage,
      time: time,
      stock_quantity: 14 // standard week duration
    });

    // Create FHIR interop record log
    addFhirLog(
      `Prescription generated for ${patientName}. Transmitting Claim.`,
      'success',
      JSON.stringify({
        resourceType: "Claim",
        id: `claim-${Date.now()}`,
        status: "active",
        type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/claim-type", code: "professional" }] },
        use: "claim",
        patient: { reference: `Patient/${patientName.toLowerCase().replace(/ /g, '-')}` },
        provider: { reference: `Practitioner/dr-${user?.name?.toLowerCase().replace(/ /g, '-') || 'gp'}` },
        diagnosis: [{ sequence: 1, diagnosisCodeableConcept: { coding: [{ system: "http://hl7.org/fhir/sid/icd-10", code: icdCode, display: icdDesc }] } }],
        item: [{ sequence: 1, productOrService: { coding: [{ system: "http://www.ama-assn.org/go/cpt", code: cptCode, display: cptDesc }] } }]
      }, null, 2)
    );

    // If an appointment was active, auto-complete it
    if (selectedApp && selectedApp.patient_name === patientName) {
      updateAppointmentStatus(selectedApp.id, 'completed');
      addFhirLog(`Encounter completed for ${patientName}`, 'success');
    }

    setSuccessMsg(`Prescription & billing code ${cptCode}/${icdCode} dispatched successfully for ${patientName}!`);
    setPatientName('');
    setSelectedMedicine('');
    setNotes('');
    
    setTimeout(() => {
      setSuccessMsg('');
    }, 4500);
  };

  const handleSaveDoctorSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    // Save to global user profile and update doctors list state
    updateUserProfile({
      category: docCategory,
      specialization: docCategory,
      fees: Number(docFees),
      startTime: docStartTime,
      endTime: docEndTime
    });

    setDocSaveSuccess("Consultation settings and operating hours saved successfully!");
    setTimeout(() => {
      setDocSaveSuccess('');
    }, 4000);
  };

  // Find matching hospital in directory state
  const activeHospital = hospitals.find(h => 
    h.email?.toLowerCase() === user?.email?.toLowerCase() ||
    h.name.toLowerCase() === user?.hospitalName?.toLowerCase()
  ) || hospitals.find(h => h.name.toLowerCase().includes('sawai man singh'));

  const handleFacilityToggle = (facilityName: string) => {
    if (!activeHospital) return;
    const currentFacilities = activeHospital.facilities || [];
    const updatedFacilities = currentFacilities.includes(facilityName)
      ? currentFacilities.filter(f => f !== facilityName)
      : [...currentFacilities, facilityName];
    
    updateHospitalDetails(activeHospital.id, { facilities: updatedFacilities });
  };

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHospital || !newTestName || !newTestPrice) return;
    const currentMenu = activeHospital.testMenu || [];
    
    if (currentMenu.some(t => t.testName.toLowerCase() === newTestName.toLowerCase())) {
      alert("A test with this name already exists in the menu.");
      return;
    }

    const updatedMenu = [...currentMenu, { testName: newTestName, price: Number(newTestPrice) }];
    updateHospitalDetails(activeHospital.id, { testMenu: updatedMenu });
    setNewTestName('');
    setNewTestPrice('');
  };

  const handleUpdateTest = (idx: number) => {
    if (!activeHospital || !editingTestName || !editingTestPrice) return;
    const currentMenu = activeHospital.testMenu || [];
    const updatedMenu = currentMenu.map((t, i) => 
      i === idx 
        ? { testName: editingTestName, price: Number(editingTestPrice) } 
        : t
    );
    updateHospitalDetails(activeHospital.id, { testMenu: updatedMenu });
    setEditingTestIdx(null);
  };

  const handleDeleteTest = (idx: number) => {
    if (!activeHospital) return;
    const currentMenu = activeHospital.testMenu || [];
    const updatedMenu = currentMenu.filter((_, i) => i !== idx);
    updateHospitalDetails(activeHospital.id, { testMenu: updatedMenu });
  };

  if (user?.userType === 'hospital') {
    return (
      <div className="min-h-screen bg-gradient-hero pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl space-y-8">
          
          {/* Hospital Header card */}
          <div className="bg-card border rounded-2xl p-6 shadow-medical flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in text-left">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-inner shrink-0">
                <HospitalIcon className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {activeHospital?.name || user.fullname || user.name}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeHospital?.address}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-success/10 text-success rounded text-xs font-bold border border-success/20">
                    <span>Verified HFR Provider</span>
                  </div>
                  {activeHospital?.hfrId && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-bold border border-primary/20">
                      <span>ABDM HFR ID: {activeHospital.hfrId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Left: Facilities Configurator */}
            <div className="bg-card border rounded-2xl p-6 shadow-medical space-y-4 h-fit text-left">
              <h2 className="text-sm font-extrabold uppercase border-b pb-2 text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Active Facilities
              </h2>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Toggle the active facilities offered at your center to display them on the patient search directory.
              </p>
              
              <div className="space-y-3 pt-2">
                {[
                  "24x7 Emergency",
                  "ICU",
                  "Operation Theatre",
                  "Dialysis Unit",
                  "Blood Bank",
                  "Radiology & Imaging"
                ].map((fac) => {
                  const isActive = activeHospital?.facilities?.includes(fac) || false;
                  return (
                    <label 
                      key={fac} 
                      className="flex items-center gap-2.5 text-xs font-semibold text-foreground cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => handleFacilityToggle(fac)}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                      />
                      <span>{fac}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Right/Center: Dynamic Diagnostic test configurator */}
            <div className="md:col-span-2 bg-card border rounded-2xl p-6 shadow-medical space-y-6 text-left">
              <h2 className="text-sm font-extrabold uppercase border-b pb-2 text-foreground flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                Diagnostic Tests & Pricing Configurator
              </h2>

              {/* Add test form */}
              <form onSubmit={handleAddTest} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end border bg-muted/5 p-4 rounded-xl">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Diagnostic Test Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. CBC, HbA1c, Thyroid"
                    value={newTestName}
                    onChange={(e) => setNewTestName(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs bg-card text-foreground font-semibold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase">Rate (INR) *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 350"
                    value={newTestPrice}
                    onChange={(e) => setNewTestPrice(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-lg text-xs bg-card text-foreground font-semibold"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="py-1.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-lg shadow-medical transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Test</span>
                </button>
              </form>

              {/* Tests list */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase">Configured Diagnostics Menu</h3>
                
                {!activeHospital?.testMenu || activeHospital.testMenu.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-xl">
                    <p className="text-xs text-muted-foreground">No diagnostic tests configured for this hospital yet.</p>
                  </div>
                ) : (
                  <div className="border rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/40 border-b">
                          <th className="p-3 font-bold text-muted-foreground uppercase text-[10px]">Test Name</th>
                          <th className="p-3 font-bold text-muted-foreground uppercase text-[10px] w-32">Price (INR)</th>
                          <th className="p-3 font-bold text-muted-foreground uppercase text-[10px] w-28 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {activeHospital.testMenu.map((test, idx) => (
                          <tr key={idx} className="hover:bg-muted/10">
                            <td className="p-3 font-semibold text-foreground">
                              {editingTestIdx === idx ? (
                                <input
                                  type="text"
                                  value={editingTestName}
                                  onChange={(e) => setEditingTestName(e.target.value)}
                                  className="w-full px-2 py-1 border rounded bg-card text-xs font-semibold"
                                />
                              ) : (
                                test.testName
                              )}
                            </td>
                            <td className="p-3 font-mono font-bold text-primary">
                              {editingTestIdx === idx ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={editingTestPrice}
                                  onChange={(e) => setEditingTestPrice(e.target.value)}
                                  className="w-24 px-2 py-1 border rounded bg-card text-xs font-bold font-mono"
                                />
                              ) : (
                                `₹${test.price}`
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {editingTestIdx === idx ? (
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => handleUpdateTest(idx)}
                                    className="p-1 text-emerald-600 hover:text-emerald-500 hover:bg-emerald-500/10 rounded"
                                    title="Save"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingTestIdx(null)}
                                    className="p-1 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => {
                                      setEditingTestIdx(idx);
                                      setEditingTestName(test.testName);
                                      setEditingTestPrice(test.price.toString());
                                    }}
                                    className="p-1.5 text-primary hover:bg-primary/10 rounded-lg cursor-pointer"
                                    title="Edit Price"
                                  >
                                    <Sliders className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTest(idx)}
                                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                                    title="Delete Test"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Diagnostic Test Bookings Received Section */}
          <div className="bg-card border rounded-2xl p-6 shadow-medical space-y-4 text-left">
            <h2 className="text-sm font-extrabold uppercase border-b pb-2 text-foreground flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-primary" />
              Incoming Lab Diagnostic Bookings ({testBookings.filter(b => b.hospitalId === activeHospital?.id).length})
            </h2>

            {testBookings.filter(b => b.hospitalId === activeHospital?.id).length === 0 ? (
              <p className="text-xs text-muted-foreground py-8 text-center">No incoming test appointments received for this hospital care context.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="p-3 font-semibold text-muted-foreground">Patient Name</th>
                      <th className="p-3 font-semibold text-muted-foreground">Diagnostic Test</th>
                      <th className="p-3 font-semibold text-muted-foreground">Scheduled Date / Time</th>
                      <th className="p-3 font-semibold text-muted-foreground">Rate</th>
                      <th className="p-3 font-semibold text-muted-foreground">Status</th>
                      <th className="p-3 font-semibold text-muted-foreground text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {testBookings.filter(b => b.hospitalId === activeHospital?.id).map((booking) => (
                      <tr key={booking.id} className="hover:bg-muted/10">
                        <td className="p-3 font-bold text-foreground">{booking.patientName}</td>
                        <td className="p-3 font-semibold text-primary">{booking.testName}</td>
                        <td className="p-3 text-muted-foreground">{booking.bookingDate} at {booking.bookingTime}</td>
                        <td className="p-3 font-mono font-bold text-primary">₹{booking.price}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            booking.status === 'scheduled'
                              ? 'bg-blue-500/10 text-blue-500 border border-blue-500/15'
                              : booking.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/15'
                              : 'bg-red-500/10 text-red-500 border border-red-500/15'
                          }`}>
                            {booking.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {booking.status === 'scheduled' && (
                            <div className="flex gap-2 justify-center">
                              <button
                                onClick={() => updateTestBookingStatus(booking.id, 'completed')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] transition-all cursor-pointer"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() => updateTestBookingStatus(booking.id, 'cancelled')}
                                className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-[10px] transition-all cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Doctor Header card */}
        <div className="bg-card border rounded-2xl p-6 shadow-medical flex flex-col md:flex-row items-center justify-between gap-6 mb-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-inner">
              <Stethoscope className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Dr. {user.fullname || user.name} {user.username ? `(@${user.username})` : ''}</h1>
              <p className="text-xs text-primary font-bold mt-0.5">{user.qualification} • {user.specialization}</p>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-2 bg-success/10 text-success rounded text-xs font-bold border border-success/20">
                <span>Verified Practitioner</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Left Column: Queues and Decision Support */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Ayushman Bharat Digital Mission (ABDM) EMR Portal */}
            <div className="bg-card border rounded-2xl p-6 shadow-medical space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  <h2 className="text-sm font-bold text-foreground">ABDM Consent & EMR Vault</h2>
                </div>
                <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary font-bold px-2 py-0.5 rounded">
                  HIU & HIP Compliance Gate
                </span>
              </div>

              {/* Patient ABHA Lookup form */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block uppercase">Lookup Patient by 14-digit ABHA Number *</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 91-4562-1049-3825"
                      value={searchAbhaId}
                      onChange={(e) => setSearchAbhaId(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-xl text-xs bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={handleAbhaLookup}
                      className="px-4 py-2 bg-gradient-medical text-white font-bold rounded-xl text-xs shadow-medical hover:opacity-90 transition-all cursor-pointer"
                    >
                      Fetch EMR
                    </button>
                  </div>
                </div>
              </div>

              {searchedAbhaId && (
                <div className="pt-2 space-y-4 animate-fade-in text-xs text-left">
                  {/* Status Banner */}
                  {lookupResult ? (
                    <div className="border rounded-xl p-4 space-y-3.5 bg-card">
                      <div className="flex justify-between items-center border-b pb-2">
                        <div>
                          <h3 className="font-extrabold text-foreground">{lookupResult.name}</h3>
                          <span className="text-[10px] text-muted-foreground font-semibold">Address: {lookupResult.address}</span>
                        </div>
                        <span className={`text-[10px] font-black border px-2 py-0.5 rounded-full ${
                          consentStatus === 'Approved'
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25'
                            : consentStatus === 'Pending'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/25 animate-pulse'
                            : consentStatus === 'Denied'
                            ? 'bg-red-500/10 text-red-500 border-red-500/25'
                            : 'bg-secondary text-muted-foreground'
                        }`}>
                          {consentStatus === 'Approved' ? 'CONSENT PERMITTED' : consentStatus === 'Pending' ? 'CONSENT PENDING' : consentStatus === 'Denied' ? 'CONSENT DENIED' : 'CONSENT UNREQUESTED'}
                        </span>
                      </div>

                      {/* Consent gated render flow */}
                      {consentStatus === 'Approved' ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <h4 className="font-extrabold text-xs text-foreground uppercase tracking-wider text-primary">Decrypted Longitudinal Health Records</h4>
                            
                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                              {healthDocuments.filter(d => d.abhaId === searchedAbhaId).length === 0 ? (
                                <p className="text-xs text-muted-foreground py-4 text-center">No EMR records uploaded for this care context.</p>
                              ) : (
                                healthDocuments.filter(d => d.abhaId === searchedAbhaId).map((doc) => (
                                  <div key={doc.id} className="border p-3 rounded-lg bg-card/50 flex justify-between items-center">
                                    <div>
                                      <div className="font-bold text-foreground text-xs">{doc.title}</div>
                                      <div className="text-[9px] text-muted-foreground font-semibold mt-0.5">
                                        Type: {doc.documentType.replace('_', ' ').toUpperCase()} | Facility: {doc.facilityName}
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        setShowFhirPayloadModal({
                                          id: doc.id,
                                          event: `ABDM Decrypted FHIR Record: ${doc.title}`,
                                          payload: doc.fhirRecord
                                        });
                                      }}
                                      className="px-2.5 py-1 text-[10px] font-bold border border-primary/20 text-primary hover:bg-primary/5 rounded-lg flex items-center gap-1 cursor-pointer"
                                    >
                                      <FileCode className="w-3.5 h-3.5" />
                                      <span>FHIR JSON</span>
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      ) : consentStatus === 'Pending' ? (
                        <div className="bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 p-4 rounded-xl space-y-2 text-center">
                          <AlertTriangle className="w-6 h-6 mx-auto animate-pulse text-amber-500" />
                          <p className="font-extrabold text-xs">EMR ACCESS GATE: LOCKED</p>
                          <p className="text-[10px] leading-relaxed font-semibold">
                            Longitudinal medical records are encrypted. Consent request is pending patient approval on their PHR dashboard.
                          </p>
                        </div>
                      ) : consentStatus === 'Denied' ? (
                        <div className="bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 p-4 rounded-xl space-y-3 text-center">
                          <ShieldAlert className="w-6 h-6 mx-auto animate-bounce text-red-500" />
                          <p className="font-extrabold text-xs">EMR ACCESS GATE: DENIED</p>
                          <p className="text-[10px] leading-relaxed font-semibold">
                            Patient has explicitly denied consent for Dr. {user?.name || 'GP'} to view past records.
                          </p>
                          <button
                            onClick={handleRequestConsent}
                            className="w-full py-2 bg-gradient-medical text-white font-bold text-xs rounded-lg shadow-medical hover:opacity-90 transition-all cursor-pointer"
                          >
                            Re-Request Consent
                          </button>
                        </div>
                      ) : (
                        <div className="bg-slate-500/10 border border-slate-500/25 text-muted-foreground p-4 rounded-xl space-y-3 text-center">
                          <Lock className="w-6 h-6 mx-auto text-primary" />
                          <p className="font-extrabold text-xs">EMR ACCESS GATE: LOCKED</p>
                          <p className="text-[10px] leading-relaxed">
                            Clinical records require active authorization under the ABDM framework. Trigger a consent request to the patient's dashboard.
                          </p>
                          <button
                            onClick={handleRequestConsent}
                            className="w-full py-2 bg-gradient-medical text-white font-bold text-xs rounded-lg shadow-medical hover:opacity-90 transition-all cursor-pointer"
                          >
                            Request Access Consent
                          </button>
                        </div>
                      )}

                      {/* HIP EMR Upload Portal */}
                      <div className="border-t pt-4 space-y-3">
                        <h4 className="font-extrabold text-xs text-foreground uppercase tracking-wider text-primary">HIP Document Upload & Link Care Context</h4>
                        
                        {uploadSuccessMsg && (
                          <div className="bg-success/15 border border-success/35 text-success text-[10px] p-2.5 rounded-lg font-bold animate-pulse">
                            {uploadSuccessMsg}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase block text-left">Document Type *</label>
                            <select
                              value={newDocType}
                              onChange={(e) => setNewDocType(e.target.value as any)}
                              className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-card text-foreground font-semibold"
                            >
                              <option value="prescription">Prescription (Schedules)</option>
                              <option value="diagnostic_report">Diagnostic Lab Report</option>
                              <option value="clinical_note">Clinical / Discharge Note</option>
                              <option value="billing">Billing Document / Invoice</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase block text-left">Document Title *</label>
                            <input
                              type="text"
                              placeholder="e.g. Lung Scan, Paracetamol Rx"
                              value={newDocTitle}
                              onChange={(e) => setNewDocTitle(e.target.value)}
                              className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-card text-foreground font-semibold"
                            />
                          </div>

                          {/* Conditional Ingestion Fields for Prescriptions */}
                          {newDocType === 'prescription' && (
                            <>
                              <div className="space-y-1 text-left">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase block">Dosage *</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 1 Tablet"
                                  value={newDocDosage}
                                  onChange={(e) => setNewDocDosage(e.target.value)}
                                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-card text-foreground font-semibold"
                                />
                              </div>
                              <div className="space-y-1 text-left">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase block">Intake Time *</label>
                                <input
                                  type="text"
                                  placeholder="e.g. 09:00 AM"
                                  value={newDocFrequency}
                                  onChange={(e) => setNewDocFrequency(e.target.value)}
                                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-card text-foreground font-semibold"
                                />
                              </div>
                              <div className="space-y-1 text-left">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase block">Days of Week (comma-separated) *</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Everyday OR Monday, Wednesday, Friday"
                                  value={newDocDaysOfWeek}
                                  onChange={(e) => setNewDocDaysOfWeek(e.target.value)}
                                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-card text-foreground font-semibold"
                                />
                              </div>
                              <div className="space-y-1 col-span-1 text-left">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase block">Interval Hours *</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 24"
                                  value={newDocIntervalHours}
                                  onChange={(e) => setNewDocIntervalHours(e.target.value)}
                                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-card text-foreground font-semibold"
                                />
                              </div>
                              <div className="space-y-1 col-span-1 text-left">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase block">Initial Pill Stock *</label>
                                <input
                                  type="number"
                                  placeholder="e.g. 30"
                                  value={newDocStock}
                                  onChange={(e) => setNewDocStock(e.target.value)}
                                  className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-card text-foreground font-semibold"
                                />
                              </div>
                            </>
                          )}

                          {/* Conditional Ingestion Fields for Billing */}
                          {newDocType === 'billing' && (
                            <div className="space-y-1 text-left">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Bill Amount (₹) *</label>
                              <input
                                type="number"
                                placeholder="e.g. 500"
                                value={newDocAmount}
                                onChange={(e) => setNewDocAmount(e.target.value)}
                                className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-card text-foreground font-semibold"
                              />
                            </div>
                          )}

                          {/* File Selector for Doctor/Hospital Upload */}
                          <div className="space-y-1 col-span-1 sm:col-span-2 text-left">
                            <label className="text-[10px] font-bold text-muted-foreground block uppercase font-semibold">Upload Scanned Document / Photo (PDF, JPG, PNG) *</label>
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
                              <Plus className="w-5 h-5 text-primary mb-1 animate-pulse" />
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
                                  <span className="text-[10px] text-primary font-bold">Choose Scan File (PDF, JPEG, or PNG)</span>
                                  <span className="text-[8px] text-muted-foreground mt-0.5">Maximum size: 10MB</span>
                                </>
                              )}
                            </label>
                          </div>
                        </div>

                        <button
                          onClick={handleUploadDocument}
                          className="w-full py-3 bg-gradient-medical text-white font-bold text-xs rounded-xl shadow-medical hover:opacity-90 flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[48px]"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Link Document to Care Context (on_carecontext)</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 p-3 rounded-lg text-center font-bold">
                      ABHA ID not found in ABDM Patient Directory.
                    </div>
                  )}
                </div>
              )}

              {/* Consultation Request Queue */}
              <div className="bg-card border rounded-2xl p-5 shadow-medical flex flex-col h-80 justify-between">
                <div>
                  <h2 className="text-sm font-bold flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-primary" />
                    Consultation Request Queue
                  </h2>

                  <div className="overflow-y-auto h-52 space-y-2.5 pr-1 scrollbar-thin">
                    {pendingAppointments.length === 0 ? (
                      <div className="text-center py-8 border border-dashed rounded-xl h-full flex items-center justify-center">
                        <p className="text-xs text-muted-foreground">No pending consultation requests</p>
                      </div>
                    ) : (
                      pendingAppointments.map((app) => (
                        <div 
                          key={app.id} 
                          onClick={() => setSelectedApp(app)}
                          className={`p-3 rounded-xl border cursor-pointer text-left transition-all ${
                            selectedApp?.id === app.id 
                              ? 'border-primary bg-primary/5 shadow-sm' 
                              : 'border-border hover:bg-muted/40'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <h3 className="font-bold text-xs text-foreground truncate">{app.patient_name}</h3>
                            <span className="text-[8px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-1.5 py-0.2 rounded font-bold uppercase shrink-0">
                              PENDING
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{app.specialty} Consult</p>
                          <div className="flex gap-3 text-[9px] text-muted-foreground mt-1.5 font-semibold">
                            <span>Date: {app.appointment_date}</span>
                            <span>Time: {app.appointment_time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* AI Decision Support Panel */}
              <div className="bg-card border rounded-2xl p-5 shadow-medical flex flex-col h-80 justify-between">
                <div>
                  <h2 className="text-sm font-bold flex items-center gap-2 text-primary mb-3">
                    <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                    AI Clinical Decision Support
                  </h2>

                  {!selectedApp ? (
                    <div className="text-center py-8 border border-dashed rounded-xl h-full flex items-center justify-center">
                      <p className="text-xs text-muted-foreground px-4">Select a patient request in the queue to load diagnostics guidelines.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs overflow-y-auto h-56 pr-1 scrollbar-thin">
                      
                      {/* Patient Context summary */}
                      <div className="bg-secondary/20 rounded-lg p-2.5 space-y-1">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">Chief Complaint / Summary</p>
                        <p className="font-semibold text-foreground text-[10px]">
                          Patient {selectedApp.patient_name} reports symptoms aligned with {selectedApp.specialty} specialty. 
                          Triage recommends virtual consultation.
                        </p>
                      </div>

                      {/* Differential Diagnoses list */}
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-primary" />
                          Top Differential Diagnoses
                        </p>
                        
                        <div className="space-y-1">
                          {selectedApp.specialty === 'Cardiologist' || selectedApp.specialty === 'Cardiology' ? (
                            <>
                              <div className="flex justify-between text-[10px]">
                                <span className="font-semibold text-foreground">Angina Pectoris</span>
                                <span className="font-mono text-primary font-bold">75% Match</span>
                              </div>
                              <div className="flex justify-between text-[10px]">
                                <span className="font-semibold text-foreground">GERD / Heartburn</span>
                                <span className="font-mono text-primary font-bold">15% Match</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between text-[10px]">
                                <span className="font-semibold text-foreground">Acute Viral Febrile Illness</span>
                                <span className="font-mono text-primary font-bold">68% Match</span>
                              </div>
                              <div className="flex justify-between text-[10px]">
                                <span className="font-semibold text-foreground">Pharyngitis / URTI</span>
                                <span className="font-mono text-primary font-bold">18% Match</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Guideline actions */}
                      <div className="space-y-1">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-primary" />
                          Evidence-Based Care Guidelines
                        </p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          Monitor temperature. Standard hydration protocols. Suggest OTC antipyretics or evaluate for bacterial cultures.
                        </p>
                      </div>

                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Completed consultations logs */}
            <div className="bg-card border rounded-2xl p-6 shadow-medical">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <UserCheck className="w-5 h-5 text-primary" />
                Completed Sessions History
              </h2>

              {completedAppointments.length === 0 ? (
                <div className="text-center py-8 border border-dashed rounded-xl">
                  <p className="text-sm text-muted-foreground">No completed sessions logged</p>
                </div>
              ) : (
                <div className="divide-y space-y-3">
                  {completedAppointments.map((app) => (
                    <div key={app.id} className="pt-3 first:pt-0 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-foreground">{app.patient_name}</span>
                        <span className="text-muted-foreground ml-2">Consultation Completed on {app.appointment_date}</span>
                      </div>
                      <span className="bg-success/10 text-success border border-success/20 px-2 py-0.5 rounded-full font-bold text-[10px]">
                        COMPLETED
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pharmacist Verification (HITL) Queue */}
            <div className="bg-card border rounded-2xl p-6 shadow-medical mt-6">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-2 text-primary">
                <ClipboardList className="w-5 h-5 text-primary animate-pulse" />
                Pharmacist Verification (HITL) Queue
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Clinical safety gate for low-confidence prescription scans. Verify details to approve patient schedule reminders.
              </p>

              {hitlQueue.filter(q => q.status === 'pending').length === 0 ? (
                <div className="text-center py-6 border border-dashed rounded-xl bg-muted/10">
                  <p className="text-xs text-muted-foreground">No low-confidence scans awaiting pharmacist validation</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {hitlQueue.filter(q => q.status === 'pending').map((item) => (
                    <div key={item.id} className="border border-border/80 rounded-xl p-4 bg-muted/5 text-xs text-left space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-foreground">Patient: {item.patientName}</h4>
                          <span className="text-[10px] text-muted-foreground block font-mono">File: {item.filename}</span>
                        </div>
                        <span className="bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded text-[8px] font-bold uppercase">
                          Confidence: {item.ocrConfidence}%
                        </span>
                      </div>

                      <div className="bg-secondary/40 p-2.5 rounded-lg border font-mono text-[10px] text-muted-foreground break-all">
                        <span className="text-[9px] uppercase font-bold text-primary block mb-1">OCR Raw Extracted Text:</span>
                        {item.rawText}
                      </div>

                      {editingHitlId === item.id ? (
                        <div className="space-y-3 pt-2 border-t">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-muted-foreground block uppercase">Corrected Medicine *</label>
                              <input
                                type="text"
                                value={correctedName}
                                onChange={(e) => setCorrectedName(e.target.value)}
                                className="w-full px-2.5 py-1.5 border rounded-lg bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-muted-foreground block uppercase">Corrected Dosage *</label>
                              <input
                                type="text"
                                value={correctedDosage}
                                onChange={(e) => setCorrectedDosage(e.target.value)}
                                className="w-full px-2.5 py-1.5 border rounded-lg bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              onClick={() => setEditingHitlId(null)}
                              className="px-3 py-1.5 border rounded-lg text-[10px] font-bold hover:bg-muted cursor-pointer text-foreground"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                resolveHitlPrescription(item.id, correctedName, correctedDosage, correctedTime);
                                setEditingHitlId(null);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 cursor-pointer"
                            >
                              Verify & Dispatch
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingHitlId(item.id);
                            setCorrectedName("Paracetamol 500mg");
                            setCorrectedDosage("1 Tablet TDS");
                            setCorrectedTime("14:00");
                          }}
                          className="w-full py-2 border border-primary/20 hover:border-primary/50 text-primary font-bold rounded-xl text-center transition-all bg-primary/5 cursor-pointer"
                        >
                          Review & Digitally Sign Note
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right sidebar column: Digital Prescription form & billing coder */}
          <div>
            {/* Doctor Consultation & Availability Settings Card */}
            <div className="bg-card border rounded-2xl p-6 shadow-medical relative space-y-4 mb-6 text-left">
              <div className="absolute top-4 right-4 text-primary opacity-10">
                <Clock className="w-16 h-16" />
              </div>
              
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Consultation & Hours Setup
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Configure your specialty category, consultation fees, and active slot timing range.
                </p>
              </div>

              {docSaveSuccess && (
                <div className="bg-success/10 border border-success/20 text-success text-xs p-3 rounded-lg font-medium flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-success shrink-0 font-bold" />
                  <span>{docSaveSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSaveDoctorSettings} className="space-y-4">
                {/* Specialty Category */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground block">Specialty Category *</label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-card text-foreground"
                    required
                  >
                    <option value="Cardiologist">Cardiology</option>
                    <option value="Pediatrician">Pediatrics</option>
                    <option value="Neurologist">Neurology</option>
                    <option value="Gynecologist">Gynecology</option>
                    <option value="General Physician">General Medicine</option>
                    <option value="Dermatologist">Dermatology</option>
                    <option value="Orthopedic">Orthopedics</option>
                  </select>
                </div>

                {/* Consultation Fees */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground block">Consultation Fees (INR) *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 500"
                    value={docFees}
                    onChange={(e) => setDocFees(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-card text-foreground font-semibold"
                    required
                  />
                </div>

                {/* Operating Hours (Start and End Time) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground block">Start Time (24h) *</label>
                    <input
                      type="time"
                      value={docStartTime}
                      onChange={(e) => setDocStartTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-card text-foreground font-semibold"
                      required
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground block">End Time (24h) *</label>
                    <input
                      type="time"
                      value={docEndTime}
                      onChange={(e) => setDocEndTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-card text-foreground font-semibold"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-medical text-white font-bold text-xs rounded-lg shadow-medical hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Config & Availability</span>
                </button>
              </form>
            </div>

            <div className="bg-card border rounded-2xl p-6 shadow-medical relative space-y-4">
              <div className="absolute top-4 right-4 text-primary opacity-10">
                <ClipboardList className="w-16 h-16" />
              </div>
              
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Issue Prescription
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Formulate digital prescriptions and push claims directly to patient health wallets.
                </p>
              </div>

              {successMsg && (
                <div className="bg-success/10 border border-success/20 text-success text-xs p-3 rounded-lg font-medium flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-success shrink-0 font-bold" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreatePrescription} className="space-y-4">
                {/* Patient Name */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground block">Patient Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Aaravomen"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-card text-foreground"
                    required
                  />
                </div>

                {/* Medicine Selector */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground block">Medicine Formula *</label>
                  <select
                    value={selectedMedicine}
                    onChange={(e) => handleMedicineChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-card text-foreground"
                    required
                  >
                    <option value="">Select Prescription Medicine</option>
                    {medicines.map((m) => (
                      <option key={m.id} value={m.name}>{m.name} ({m.genericName})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Dosage */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground block">Dosage *</label>
                    <input
                      type="text"
                      placeholder="e.g. 1 Tablet"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-card text-foreground"
                      required
                    />
                  </div>
                  {/* Intake Time */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground block">Time *</label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-card text-foreground"
                      required
                    />
                  </div>
                </div>

                {/* Duration */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground block">Duration *</label>
                  <input
                    type="text"
                    placeholder="e.g. 7 Days / 2 Weeks"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-card text-foreground"
                    required
                  />
                </div>

                {/* Automated Medical Billing CPT/ICD Assistant */}
                <div className="border border-border/60 bg-secondary/15 rounded-xl p-3.5 space-y-2 text-xs">
                  <h4 className="text-[10px] font-bold text-foreground flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5 text-primary" />
                    Automated Revenue Cycle Coder (AMA CPT & ICD-10)
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="space-y-0.5">
                      <span className="font-semibold text-muted-foreground block">Diagnosis (ICD-10)</span>
                      <span className="font-mono text-primary font-bold bg-primary/5 px-1 py-0.5 rounded border border-primary/10 block text-center" title={icdDesc}>
                        {icdCode}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-semibold text-muted-foreground block">Encounter (CPT)</span>
                      <span className="font-mono text-primary font-bold bg-primary/5 px-1 py-0.5 rounded border border-primary/10 block text-center" title={cptDesc}>
                        {cptCode}
                      </span>
                    </div>
                  </div>
                  <p className="text-[9px] text-muted-foreground font-semibold">
                    * Codes generated dynamically based on care context.
                  </p>
                </div>
                
                {/* Clinical Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground block">Clinical Notes (Optional)</label>
                  <textarea
                    placeholder="e.g. Take after meal."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-card text-foreground"
                    rows={2}
                  />
                </div>

                {/* Compliance Warnings Box */}
                {complianceError && (
                  <div className="bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 text-xs p-3.5 rounded-xl text-left space-y-2 animate-pulse">
                    <div className="flex gap-1.5 items-start">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="font-semibold leading-normal">{complianceError}</p>
                    </div>
                    {complianceError.includes("List A") && !videoConsultCompleted && (
                      <button
                        type="button"
                        onClick={() => {
                          setVideoModalOpen(true);
                          setVideoStatus('connecting');
                          setVideoSeconds(4);
                        }}
                        className="w-full mt-2 py-1.5 bg-primary text-white font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 text-[11px] shadow-medical"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Start High-Fidelity Video Consultation</span>
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!!complianceError && !videoConsultCompleted}
                  className="w-full py-2.5 bg-gradient-medical text-white font-semibold rounded-lg hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all text-xs shadow-medical flex items-center justify-center gap-1.5"
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Transmit Digital Prescription</span>
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>

      {/* High-Fidelity Video Consult Modal */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in text-left">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-elevated relative space-y-5 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <h3 className="text-xs font-mono font-extrabold uppercase text-slate-400">High-Fidelity Telemedicine Link</h3>
              </div>
              {videoStatus === 'completed' && (
                <button
                  onClick={() => setVideoModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col items-center justify-center shadow-inner">
              {/* Background gradient video simulator */}
              {videoStatus === 'connecting' && (
                <div className="text-center space-y-2">
                  <RefreshCw className="w-8 h-8 text-primary mx-auto animate-spin" />
                  <p className="text-xs font-mono text-slate-400">Connecting secure peer-to-peer WebRTC line...</p>
                </div>
              )}
              {videoStatus === 'active' && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/60 to-slate-950/90 animate-pulse-subtle" />
                  <div className="absolute top-3 right-3 bg-slate-900/80 px-2 py-0.5 rounded text-[8px] font-mono text-emerald-400 border border-emerald-500/20">
                    Secure 1080p WebRTC
                  </div>
                  {/* Styled avatar profile */}
                  <div className="z-10 text-center space-y-2 animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary text-white flex items-center justify-center mx-auto text-xl font-bold uppercase shadow-elevated">
                      {patientName ? patientName.slice(0, 2) : 'PT'}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{patientName || 'Consultation Patient'}</p>
                      <p className="text-[10px] text-emerald-400 font-mono">Live Video Link Active</p>
                    </div>
                  </div>
                </>
              )}
              {videoStatus === 'completed' && (
                <div className="text-center space-y-2 p-4 z-10 animate-fade-in">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                  <p className="text-xs font-bold text-foreground">Consultation Successfully Verified</p>
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    Identity confirmed and clinical video record synced to HL7 telemetry. List A restrictions unlocked.
                  </p>
                </div>
              )}
            </div>

            {/* Video footer */}
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1">
              <span>Codec: AV1 P2P</span>
              {videoStatus === 'connecting' && <span>Resolving STUN/TURN...</span>}
              {videoStatus === 'active' && <span>Session Duration: {videoSeconds}s</span>}
              {videoStatus === 'completed' && <span className="text-emerald-400 font-bold">Verified Compliant</span>}
            </div>

            {videoStatus === 'connecting' && (
              <button
                type="button"
                onClick={() => {
                  setVideoStatus('active');
                  // start timer
                  const interval = setInterval(() => {
                    setVideoSeconds(prev => {
                      if (prev <= 1) {
                        clearInterval(interval);
                        setVideoStatus('completed');
                        setVideoConsultCompleted(true);
                        setComplianceError('');
                        addFhirLog(
                          `High-fidelity video consultation completed for ${patientName}`,
                          'success',
                          JSON.stringify({
                            resourceType: "Encounter",
                            id: `enc-video-${Date.now()}`,
                            status: "finished",
                            class: {
                              system: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                              code: "VR",
                              display: "virtual"
                            },
                            subject: { display: patientName },
                            participant: [{ type: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ParticipationType", code: "PPRF" }] }] }],
                            period: {
                              start: new Date(Date.now() - 4000).toISOString(),
                              end: new Date().toISOString()
                            }
                          }, null, 2)
                        );
                        return 0;
                      }
                      return prev - 1;
                    });
                  }, 1000);
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all text-center"
              >
                Establish P2P Connection
              </button>
            )}

            {videoStatus === 'completed' && (
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="w-full py-2 bg-primary text-white text-xs font-bold rounded-xl transition-all text-center"
              >
                Proceed to Prescribe List A Drug
              </button>
            )}
          </div>
        </div>
      )}
      <EMRModalsWrapper showFhirPayloadModal={showFhirPayloadModal} setShowFhirPayloadModal={setShowFhirPayloadModal} />
    </div>
  );
};

export default DoctorDashboard;

// Add this wrapper component at the bottom of DoctorDashboard.tsx to display FHIR modals cleanly
const EMRModalsWrapper: React.FC<{ showFhirPayloadModal: any; setShowFhirPayloadModal: (val: any) => void }> = ({ showFhirPayloadModal, setShowFhirPayloadModal }) => {
  if (!showFhirPayloadModal) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in text-left">
      <div className="bg-slate-950 border border-slate-800 text-slate-100 rounded-3xl p-6 max-w-2xl w-full shadow-elevated relative flex flex-col justify-between font-mono max-h-[85vh]">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-primary animate-pulse" />
            <span>FHIR RESOURCE: COMPLIANT DECRYPTED VIEW</span>
          </span>
          <button
            onClick={() => setShowFhirPayloadModal(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl p-4 text-[10px] text-emerald-400 break-all leading-relaxed select-text pr-1 scrollbar-thin max-h-[60vh]">
          <pre className="whitespace-pre-wrap">{showFhirPayloadModal.payload}</pre>
        </div>
        
        <div className="mt-4 border-t border-slate-900 pt-3 flex justify-between items-center text-[8px] text-slate-500">
          <span>Security: AES-GCM Encryption Resolved</span>
          <span>Compliant with ABDM Sandbox v3</span>
        </div>
      </div>
    </div>
  );
};
