import React, { createContext, useContext, useState, useEffect } from 'react';
import defaultHospitalsData from '../data/hospitals.json';
import { secureStorage } from '../utils/security';

// Type definitions
export interface User {
  email: string;
  name: string;
  fullname: string;
  username: string;
  password?: string;
  abhaNumber?: string;
  userType: 'patient' | 'doctor' | 'hospital';
  specialization?: string;
  qualification?: string;
  hospitalName?: string;
  hospitalAddress?: string;
  hospitalPhone?: string;
  phoneNumber?: string;
  dob?: string;
  profilePicture?: string;
  fees?: number;
  startTime?: string;
  endTime?: string;
  category?: string;
  location?: { lat: number; lng: number };
}

export interface Doctor {
  id: number;
  name: string;
  specialty: string;
  qualification: string;
  hospitalName: string;
  rating: number;
  fullname?: string;
  category?: string;
  fees?: number;
  startTime?: string;
  endTime?: string;
  location?: { lat: number; lng: number };
}

export interface Hospital {
  id: number;
  name: string;
  address: string;
  phone: string;
  email?: string;
  registration_number?: string;
  distance?: string;
  lat: number;
  lng: number;
  specialties?: string[];
  verified?: boolean;
  hfrId?: string | null;
  ownership?: 'government' | 'private' | string;
  facilityType?: string;
  facilities?: string[];
  testMenu?: { testName: string; price: number }[];
}

export interface HealthDocument {
  id: string;
  abhaId: string;
  abhaAddress: string;
  title: string;
  documentType: 'prescription' | 'diagnostic_report' | 'clinical_note' | 'billing';
  facilityName: string;
  uploadedAt: string;
  fileUrl: string | null;
  fhirRecord: string;
  careContextId: string;
}

export interface ConsentRequest {
  id: string;
  doctorName: string;
  abhaId: string;
  abhaAddress: string;
  facility: string;
  dataTypes: string[];
  duration: string;
  status: 'Pending' | 'Approved' | 'Denied';
  requestedAt: string;
}

export interface MedicalStore {
  id: number;
  name: string;
  address: string;
  phone: string;
  open_24_hours: boolean;
  delivery_available: boolean;
  latitude: number;
  longitude: number;
}

export interface Medicine {
  id: number;
  name: string;
  genericName: string;
  category: string;
  price: number;
  manufacturer: string;
  inStock: boolean;
  description: string;
  vendorPrices?: {
    tata1mg: { price: number; discount: number };
    pharmeasy: { price: number; discount: number };
    netmeds: { price: number; discount: number };
  };
}

export interface MedicineReminder {
  id: string;
  user_id?: string;
  medicineId: number | string;
  name: string;
  dosage: string;
  time: string;
  last_taken_at?: string;
  stock_quantity: number;
}

export interface Appointment {
  id: string;
  user_id: string;
  doctor_id: number | string;
  doctor_name: string;
  specialty: string;
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  patient_name: string;
}

export interface CartItem {
  id: number;
  medicine: Medicine;
  quantity: number;
}

interface AppContextProps {
  user: User | null;
  hospitals: Hospital[];
  medicalStores: MedicalStore[];
  medicines: Medicine[];
  reminders: MedicineReminder[];
  appointments: Appointment[];
  cart: CartItem[];
  doctors: Doctor[];
  login: (identifier: string, password: string, userType: 'patient' | 'doctor' | 'hospital') => boolean;
  signup: (userData: User) => boolean;
  logout: () => void;
  registerHospital: (hospital: Omit<Hospital, 'id' | 'lat' | 'lng' | 'verified'>) => void;
  registerMedicalStore: (store: Omit<MedicalStore, 'id'>) => void;
  addReminder: (reminder: Omit<MedicineReminder, 'id' | 'last_taken_at'>) => void;
  takeMedicine: (reminderId: string) => void;
  deleteReminder: (reminderId: string) => void;
  bookAppointment: (doctorId: number | string, doctorName: string, specialty: string, date: string, time: string) => void;
  updateAppointmentStatus: (id: string, status: 'scheduled' | 'completed' | 'cancelled') => void;
  addToCart: (medicine: Medicine) => void;
  removeFromCart: (medicineId: number) => void;
  updateCartQuantity: (medicineId: number, quantity: number) => void;
  clearCart: () => void;
  
  // ABDM Sovereign Compliance State
  abhaId: string;
  abhaAddress: string;
  setAbhaDetails: (id: string, address: string) => void;
  consentRecords: { id: string; facility: string; dataTypes: string[]; duration: string; status: 'Active' | 'Revoked' }[];
  updateConsentStatus: (id: string, status: 'Active' | 'Revoked') => void;
  
  // Remote Patient Monitoring (IoMT) State
  telemetry: { hrv: number; restingHr: number; spo2: number; glucose: number; sleep: number };
  updateTelemetry: (newTelemetry: Partial<{ hrv: number; restingHr: number; spo2: number; glucose: number; sleep: number }>) => void;
  healthNudges: { id: string; type: 'critical' | 'warning' | 'info'; message: string; timestamp: string }[];
  addHealthNudge: (nudge: Omit<{ id: string; type: 'critical' | 'warning' | 'info'; message: string; timestamp: string }, 'id' | 'timestamp'>) => void;
  
  // Interoperability (HL7/FHIR Sync) Logs
  fhirLogs: { id: string; timestamp: string; event: string; type: 'info' | 'success' | 'payload'; payload?: string }[];
  addFhirLog: (event: string, type: 'info' | 'success' | 'payload', payload?: string) => void;

  // Human-in-the-Loop OCR Pharmacist Verification Queue
  hitlQueue: {
    id: string;
    patientName: string;
    filename: string;
    rawText: string;
    ocrConfidence: number;
    status: 'pending' | 'resolved';
    timestamp: string;
  }[];
  addToHitlQueue: (prescription: { id: string; patientName: string; filename: string; rawText: string; ocrConfidence: number }) => void;
  resolveHitlPrescription: (id: string, correctedName: string, correctedDosage: string, correctedTime: string) => void;

  // ABDM EMR & Document Management System
  healthDocuments: HealthDocument[];
  consentRequests: ConsentRequest[];
  triggerConsentRequest: (abhaId: string, doctorName: string, facility: string) => void;
  approveConsentRequest: (requestId: string) => void;
  denyConsentRequest: (requestId: string) => void;
  uploadHealthDocument: (doc: Omit<HealthDocument, 'id' | 'uploadedAt' | 'careContextId'>) => void;
  abhaRegistry: { abhaId: string; name: string; address: string }[];
  switchUserRole: (role: 'patient' | 'doctor' | 'hospital') => void;
  auditLogs: AuditLog[];
  addAuditLog: (userRole: string, actionType: string, abhaIdMatched: string, status: 'success' | 'failed') => void;
  updateUserProfile: (updatedFields: Partial<User>) => void;
  changePassword: (oldPassword: string, newPassword: string) => boolean;
  resetPassword: (emailAddress: string, newPass: string, userRole: 'patient' | 'doctor' | 'hospital') => boolean;
  updateHospitalDetails: (hospitalId: number, details: Partial<Hospital>) => void;
  bookedSlots: { [doctorId: string]: { [date: string]: string[] } };
  updateDoctorDetails: (doctorId: number, details: Partial<Doctor>) => void;
  testBookings: TestBooking[];
  bookTest: (hospitalId: number, testName: string, price: number, date: string, time: string) => void;
  updateTestBookingStatus: (id: string, status: 'scheduled' | 'completed' | 'cancelled') => void;
}

export interface TestBooking {
  id: string;
  patientId: string;
  patientName: string;
  hospitalId: number;
  hospitalName: string;
  testName: string;
  price: number;
  bookingDate: string;
  bookingTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface AuditLog {
  timestamp: string;
  userRole: string;
  actionType: string;
  abhaIdMatched: string;
  status: 'success' | 'failed';
}

// Initial Mock Data with Geographic Ingestion Rule Enforced
// Rule: ALL facilities for Top Cities + Dausa, and ONLY Major Hospitals for the rest of India.
const defaultHospitalsRaw: Hospital[] = defaultHospitalsData as Hospital[];
const topCities = ["delhi", "mumbai", "jaipur", "bengaluru", "bangalore", "chennai", "kolkata", "hyderabad", "pune", "ahmedabad", "dausa"];

const defaultHospitals = defaultHospitalsRaw.filter(h => {
  const addressLower = h.address.toLowerCase();
  const nameLower = h.name.toLowerCase();
  const facilityTypeLower = h.facilityType?.toLowerCase() || '';

  const isTopCity = topCities.some(city => addressLower.includes(city));
  if (isTopCity) {
    return true; // Keep everything
  } else {
    // Rest of India: Keep only Major Hospitals (Super/Multi specialty, Medical College, or Govt)
    const isMajor = 
      facilityTypeLower.includes('hospital') || 
      facilityTypeLower.includes('college') ||
      nameLower.includes('hospital') ||
      nameLower.includes('institute') ||
      h.ownership === 'government';
    return isMajor;
  }
}).map((h, i) => ({
  ...h,
  facilities: h.facilities || (
    i % 3 === 0 
      ? ["24x7 Emergency", "ICU", "Operation Theatre", "Radiology & Imaging"]
      : i % 3 === 1
        ? ["24x7 Emergency", "ICU", "Dialysis Unit", "Blood Bank", "Radiology & Imaging"]
        : ["24x7 Emergency", "Radiology & Imaging"]
  ),
  testMenu: h.testMenu || [
    { testName: "CBC (Complete Blood Count)", price: 350 },
    { testName: "LFT (Liver Function Test)", price: 800 },
    { testName: "KFT (Kidney Function Test)", price: 900 },
    { testName: "HbA1c (Glycated Haemoglobin)", price: 440 },
    { testName: "Lipid Profile", price: 600 },
    { testName: "Thyroid Profile (T3, T4, TSH)", price: 550 },
    { testName: "Blood Glucose (Fasting & PP)", price: 150 },
    { testName: "Urine Routine & Microscopy", price: 200 },
    { testName: "Vitamin D (25-Hydroxy)", price: 1200 },
    { testName: "Vitamin B12", price: 990 },
    { testName: "CRP (C-Reactive Protein)", price: 450 },
    { testName: "Double Marker Study (Pregnancy)", price: 2500 },
    { testName: "Widal Test (Typhoid)", price: 300 },
    { testName: "HbsAg (Hepatitis B)", price: 400 },
    { testName: "Dengue NS1 Antigen", price: 600 }
  ]
}));

const defaultMedicines: Medicine[] = [
  { 
    id: 1, 
    name: "Paracetamol 500mg", 
    genericName: "Acetaminophen", 
    category: "Pain Relief", 
    price: 25, 
    manufacturer: "Sun Pharma", 
    inStock: true, 
    description: "For fever and mild pain relief",
    vendorPrices: {
      tata1mg: { price: 20, discount: 20 },
      pharmeasy: { price: 24, discount: 4 },
      netmeds: { price: 22, discount: 12 }
    }
  },
  { 
    id: 2, 
    name: "Amoxicillin 500mg", 
    genericName: "Amoxicillin", 
    category: "Antibiotic", 
    price: 120, 
    manufacturer: "Cipla", 
    inStock: true, 
    description: "Broad-spectrum antibiotic for bacterial infections",
    vendorPrices: {
      tata1mg: { price: 96, discount: 20 },
      pharmeasy: { price: 108, discount: 10 },
      netmeds: { price: 102, discount: 15 }
    }
  },
  { 
    id: 3, 
    name: "Cetirizine 10mg", 
    genericName: "Cetirizine", 
    category: "Allergy", 
    price: 45, 
    manufacturer: "Dr. Reddy's", 
    inStock: true, 
    description: "Antihistamine for allergy symptoms like sneezing, runny nose",
    vendorPrices: {
      tata1mg: { price: 36, discount: 20 },
      pharmeasy: { price: 40, discount: 11 },
      netmeds: { price: 38, discount: 15 }
    }
  },
  { 
    id: 4, 
    name: "Metformin 500mg", 
    genericName: "Metformin HCL", 
    category: "Diabetes", 
    price: 85, 
    manufacturer: "Sun Pharma", 
    inStock: true, 
    description: "For blood sugar management in type 2 diabetes",
    vendorPrices: {
      tata1mg: { price: 68, discount: 20 },
      pharmeasy: { price: 76, discount: 10 },
      netmeds: { price: 72, discount: 15 }
    }
  },
  { 
    id: 5, 
    name: "Aspirin 75mg", 
    genericName: "Acetylsalicylic Acid", 
    category: "Cardiac", 
    price: 30, 
    manufacturer: "Bayer", 
    inStock: true, 
    description: "Low-dose blood thinner for heart attack prevention",
    vendorPrices: {
      tata1mg: { price: 24, discount: 20 },
      pharmeasy: { price: 27, discount: 10 },
      netmeds: { price: 25, discount: 16 }
    }
  },
  { 
    id: 6, 
    name: "Omeprazole 20mg", 
    genericName: "Omeprazole", 
    category: "Digestive", 
    price: 95, 
    manufacturer: "Cipla", 
    inStock: true, 
    description: "For acid reflux, heartburn, and stomach ulcers",
    vendorPrices: {
      tata1mg: { price: 76, discount: 20 },
      pharmeasy: { price: 85, discount: 10 },
      netmeds: { price: 80, discount: 15 }
    }
  },
  { 
    id: 7, 
    name: "Azithromycin 500mg", 
    genericName: "Azithromycin", 
    category: "Antibiotic", 
    price: 180, 
    manufacturer: "Lupin", 
    inStock: false, 
    description: "For respiratory and skin bacterial infections",
    vendorPrices: {
      tata1mg: { price: 144, discount: 20 },
      pharmeasy: { price: 162, discount: 10 },
      netmeds: { price: 153, discount: 15 }
    }
  },
  { 
    id: 8, 
    name: "Ibuprofen 400mg", 
    genericName: "Ibuprofen", 
    category: "Pain Relief", 
    price: 55, 
    manufacturer: "Abbott", 
    inStock: true, 
    description: "Anti-inflammatory pain relief for muscles and joints",
    vendorPrices: {
      tata1mg: { price: 44, discount: 20 },
      pharmeasy: { price: 49, discount: 10 },
      netmeds: { price: 46, discount: 16 }
    }
  },
  { 
    id: 9, 
    name: "Losartan 50mg", 
    genericName: "Losartan Potassium", 
    category: "Cardiac", 
    price: 110, 
    manufacturer: "Torrent", 
    inStock: true, 
    description: "For high blood pressure management",
    vendorPrices: {
      tata1mg: { price: 88, discount: 20 },
      pharmeasy: { price: 99, discount: 10 },
      netmeds: { price: 93, discount: 15 }
    }
  },
  { 
    id: 10, 
    name: "Vitamin D3 60000 IU", 
    genericName: "Cholecalciferol", 
    category: "Vitamins", 
    price: 75, 
    manufacturer: "Sun Pharma", 
    inStock: true, 
    description: "Vitamin D supplement for bone and immune support",
    vendorPrices: {
      tata1mg: { price: 60, discount: 20 },
      pharmeasy: { price: 67, discount: 10 },
      netmeds: { price: 63, discount: 16 }
    }
  },
  { 
    id: 11, 
    name: "Montelukast 10mg", 
    genericName: "Montelukast", 
    category: "Respiratory", 
    price: 140, 
    manufacturer: "Cipla", 
    inStock: true, 
    description: "For asthma control and seasonal allergy relief",
    vendorPrices: {
      tata1mg: { price: 112, discount: 20 },
      pharmeasy: { price: 126, discount: 10 },
      netmeds: { price: 119, discount: 15 }
    }
  },
  { 
    id: 12, 
    name: "Pantoprazole 40mg", 
    genericName: "Pantoprazole", 
    category: "Digestive", 
    price: 105, 
    manufacturer: "Alkem", 
    inStock: true, 
    description: "Acid reducer for GERD and gastrointestinal protection",
    vendorPrices: {
      tata1mg: { price: 84, discount: 20 },
      pharmeasy: { price: 94, discount: 10 },
      netmeds: { price: 89, discount: 15 }
    }
  },
  { 
    id: 13, 
    name: "Alprazolam 0.5mg", 
    genericName: "Alprazolam", 
    category: "Anxiolytic (Psychotropic)", 
    price: 60, 
    manufacturer: "Sun Pharma", 
    inStock: true, 
    description: "Anxiolytic substance - prohibited for telemedicine",
    vendorPrices: {
      tata1mg: { price: 48, discount: 20 },
      pharmeasy: { price: 54, discount: 10 },
      netmeds: { price: 51, discount: 15 }
    }
  },
  { 
    id: 14, 
    name: "Morphine 10mg", 
    genericName: "Morphine Sulfate", 
    category: "Analgesic (Narcotic)", 
    price: 150, 
    manufacturer: "Cipla", 
    inStock: true, 
    description: "Narcotic opioid analgesic - prohibited for telemedicine",
    vendorPrices: {
      tata1mg: { price: 120, discount: 20 },
      pharmeasy: { price: 135, discount: 10 },
      netmeds: { price: 127, discount: 15 }
    }
  }
];

const defaultMedicalStores: MedicalStore[] = [
  { id: 1, name: "Rajasthan Medical Store", address: "J.L.N. Marg, Near SMS Hospital, Jaipur - 302004", phone: "+91 141 2568899", open_24_hours: true, delivery_available: true, latitude: 26.9056, longitude: 75.8155 },
  { id: 2, name: "Apollo Pharmacy C-Scheme", address: "Ashok Marg, C-Scheme, Jaipur - 302001", phone: "+91 141 2365544", open_24_hours: true, delivery_available: true, latitude: 26.9124, longitude: 75.7894 },
  { id: 3, name: "Netmeds Store Malviya Nagar", address: "Sector 3, Near Eternal Hospital, Jaipur - 302017", phone: "+91 141 4001122", open_24_hours: false, delivery_available: true, latitude: 26.8532, longitude: 75.8092 },
  { id: 4, name: "Medkart Pharmacy Mansarovar", address: "Opposite Metro Station, Mansarovar, Jaipur - 302020", phone: "+91 141 2781122", open_24_hours: true, delivery_available: false, latitude: 26.8624, longitude: 75.7567 },
  { id: 5, name: "Soni Medical Store Jawahar Nagar", address: "Sector 3, Jawahar Nagar, Jaipur - 302004", phone: "+91 141 2654321", open_24_hours: false, delivery_available: false, latitude: 26.9156, longitude: 75.7923 }
];

const mockDoctors = [
  { id: 1, name: "Dr. Rajesh Sharma", specialty: "Cardiologist", qualification: "MD, DM (Cardiology)", hospitalName: "SMS Hospital", rating: 4.8 },
  { id: 2, name: "Dr. Anita Gupta", specialty: "Pediatrician", qualification: "MBBS, MD (Pediatrics)", hospitalName: "Fortis Hospital", rating: 4.9 },
  { id: 3, name: "Dr. Vikram Aditya", specialty: "Neurologist", qualification: "MD, DNB (Neurology)", hospitalName: "Manipal Hospital", rating: 4.7 },
  { id: 4, name: "Dr. Priya Sen", specialty: "Gynecologist", qualification: "MS, OBGYN", hospitalName: "Eternal Hospital", rating: 4.8 },
  { id: 5, name: "Dr. Sanjay Mehta", specialty: "General Physician", qualification: "MBBS, MD (Internal Medicine)", hospitalName: "Apex Hospital", rating: 4.6 },
  { id: 6, name: "Dr. Ritu Malhotra", specialty: "Dermatologist", qualification: "MBBS, DDVL", hospitalName: "Rukmani Birla Hospital", rating: 4.7 },
  { id: 7, name: "Dr. Alok Trivedi", specialty: "Orthopedic", qualification: "MS (Orthopedics)", hospitalName: "Santokba Durlabhji Hospital", rating: 4.8 }
];

const AppContext = createContext<AppContextProps | undefined>(undefined);

// EMR Default Mock Data for Aaravomen
const defaultHealthDocuments: HealthDocument[] = [
  {
    id: "doc-1",
    abhaId: "91-4562-1049-3825",
    abhaAddress: "aaravomen@gmail.com",
    title: "Complete Blood Count (CBC) Lab Report",
    documentType: "diagnostic_report",
    facilityName: "Apollo Diagnostics",
    uploadedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    fileUrl: "cbc_report_apollo.pdf",
    fhirRecord: JSON.stringify({
      resourceType: "DiagnosticReport",
      id: "cbc-report-1",
      status: "final",
      code: { coding: [{ system: "http://loinc.org", code: "58410-2", display: "Complete Blood Count panel" }] },
      subject: { reference: "Patient/91-4562-1049-3825", display: "Aaravomen" },
      issued: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      performer: [{ display: "Apollo Diagnostics" }],
      result: [
        { display: "Hemoglobin: 14.2 g/dL (Normal)" },
        { display: "White Blood Cells: 6,500 /uL (Normal)" },
        { display: "Platelets: 250,000 /uL (Normal)" }
      ]
    }, null, 2),
    careContextId: "CC-APOLLO-98213"
  },
  {
    id: "doc-2",
    abhaId: "91-4562-1049-3825",
    abhaAddress: "aaravomen@gmail.com",
    title: "Metformin 500mg Diabetes Prescription",
    documentType: "prescription",
    facilityName: "Sawai Man Singh Hospital",
    uploadedAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    fileUrl: "metformin_prescription_sms.pdf",
    fhirRecord: JSON.stringify({
      resourceType: "MedicationRequest",
      id: "medreq-metformin-1",
      status: "active",
      intent: "order",
      medicationCodeableConcept: { coding: [{ system: "http://snomed.info/sct", code: "387584000", display: "Metformin 500mg" }] },
      subject: { reference: "Patient/91-4562-1049-3825", display: "Aaravomen" },
      authoredOn: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      requester: { display: "Dr. Rajesh Sharma" },
      dosageInstruction: [{ text: "Take 1 tablet daily after breakfast" }]
    }, null, 2),
    careContextId: "CC-SMS-10492"
  },
  {
    id: "doc-3",
    abhaId: "91-4562-1049-3825",
    abhaAddress: "aaravomen@gmail.com",
    title: "Telehealth Consultation Bill Invoice",
    documentType: "billing",
    facilityName: "Eternal Hospital",
    uploadedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    fileUrl: "billing_invoice_eternal.pdf",
    fhirRecord: JSON.stringify({
      resourceType: "ExplanationOfBenefit",
      id: "eob-eternal-1",
      status: "active",
      type: { coding: [{ system: "http://terminology.hl7.org/CodeSystem/claim-type", code: "professional" }] },
      use: "claim",
      patient: { reference: "Patient/91-4562-1049-3825", display: "Aaravomen" },
      insurer: { display: "Care+ Insurance Corp" },
      provider: { display: "Eternal Hospital (EHCC)" },
      outcome: "queued",
      total: [{ category: { coding: [{ code: "submitted" }] }, amount: { value: 850.0, currency: "INR" } }]
    }, null, 2),
    careContextId: "CC-ETERNAL-48210"
  }
];

// ABHA Patients registry lookup directory
const defaultAbhaRegistry = [
  { abhaId: "91-4562-1049-3825", name: "Aaravomen", address: "aaravomen@gmail.com" },
  { abhaId: "91-1111-2222-3333", name: "Priya Patel", address: "priya@abdm" },
  { abhaId: "91-9999-8888-7777", name: "Rajesh Kumar", address: "rajesh@abdm" }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = secureStorage.getItem('care_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [registeredUsers, setRegisteredUsers] = useState<User[]>(() => {
    const saved = secureStorage.getItem('care_registered_users');
    if (saved) return JSON.parse(saved);
    return [
      {
        email: "aaravomen@gmail.com",
        fullname: "Aaravomen",
        name: "Aaravomen",
        username: "aaravomen",
        password: "password123",
        abhaNumber: "91-4562-1049-3825",
        userType: "patient"
      },
      {
        email: "doctor@sms.abdm",
        fullname: "Rajesh Sharma",
        name: "Rajesh Sharma",
        username: "dr_rajesh",
        password: "password123",
        userType: "doctor",
        specialization: "Cardiologist",
        qualification: "MBBS, MD"
      },
      {
        email: "admin@clinic.abdm",
        fullname: "Sawai Man Singh Hospital",
        name: "Sawai Man Singh Hospital",
        username: "sms_hospital",
        password: "password123",
        userType: "hospital",
        hospitalName: "Sawai Man Singh Hospital",
        hospitalAddress: "JLN Marg, Jaipur",
        hospitalPhone: "+91 141 5556666"
      }
    ];
  });

  useEffect(() => {
    secureStorage.setItem('care_registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  // Health Documents state
  const [healthDocuments, setHealthDocuments] = useState<HealthDocument[]>(() => {
    const saved = secureStorage.getItem('care_health_documents');
    return saved ? JSON.parse(saved) : defaultHealthDocuments;
  });

  // Consent Requests state
  const [consentRequests, setConsentRequests] = useState<ConsentRequest[]>(() => {
    const saved = secureStorage.getItem('care_consent_requests');
    return saved ? JSON.parse(saved) : [];
  });

  // Registry state
  const [abhaRegistry, setAbhaRegistry] = useState(defaultAbhaRegistry);

  const [hospitals, setHospitals] = useState<Hospital[]>(() => {
    const saved = secureStorage.getItem('care_hospitals');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migration helper: force refresh if defaults list is larger
      if (parsed.length < defaultHospitals.length) {
        secureStorage.setItem('care_hospitals', JSON.stringify(defaultHospitals));
        return defaultHospitals;
      }
      // Migration helper: ensure all saved hospitals have the default facilities and testMenu if missing
      return parsed.map((h: any, i: number) => {
        const defaultMenu = defaultHospitals[i]?.testMenu || defaultHospitals[0]?.testMenu;
        const currentMenu = h.testMenu || [];
        return {
          ...h,
          facilities: h.facilities || (
            i % 3 === 0 
              ? ["24x7 Emergency", "ICU", "Operation Theatre", "Radiology & Imaging"]
              : i % 3 === 1
                ? ["24x7 Emergency", "ICU", "Dialysis Unit", "Blood Bank", "Radiology & Imaging"]
                : ["24x7 Emergency", "Radiology & Imaging"]
          ),
          testMenu: currentMenu.length <= 4 ? defaultMenu : currentMenu
        };
      });
    }
    return defaultHospitals;
  });

  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const saved = secureStorage.getItem('care_doctors');
    if (saved) return JSON.parse(saved);
    
    // Map default mock doctors with fees, categories, coordinates, and visiting hours
    return mockDoctors.map((doc, i) => ({
      ...doc,
      fullname: doc.name + " (" + doc.qualification + ")",
      category: doc.specialty,
      fees: 400 + (i % 3) * 200, // 400, 600, 800
      startTime: "09:00",
      endTime: "13:00",
      location: {
        lat: 26.905641 + (i - 3) * 0.01,
        lng: 75.815549 + (i - 3) * 0.01
      }
    }));
  });

  useEffect(() => {
    secureStorage.setItem('care_doctors', JSON.stringify(doctors));
  }, [doctors]);

  const [bookedSlots, setBookedSlots] = useState<{ [doctorId: string]: { [date: string]: string[] } }>(() => {
    const saved = secureStorage.getItem('care_booked_slots');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    secureStorage.setItem('care_booked_slots', JSON.stringify(bookedSlots));
  }, [bookedSlots]);

  const [medicalStores, setMedicalStores] = useState<MedicalStore[]>(() => {
    const saved = secureStorage.getItem('care_stores');
    return saved ? JSON.parse(saved) : defaultMedicalStores;
  });

  const [medicines] = useState<Medicine[]>(defaultMedicines);

  const [reminders, setReminders] = useState<MedicineReminder[]>(() => {
    const saved = secureStorage.getItem('care_reminders');
    return saved ? JSON.parse(saved) : [];
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = secureStorage.getItem('care_appointments');
    return saved ? JSON.parse(saved) : [];
  });

  const [testBookings, setTestBookings] = useState<TestBooking[]>(() => {
    const saved = secureStorage.getItem('care_test_bookings');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "tb-1",
        patientId: "91-4562-1049-3825",
        patientName: "Aaravomen",
        hospitalId: 1,
        hospitalName: "Sawai Man Singh Hospital",
        testName: "CBC (Complete Blood Count)",
        price: 350,
        bookingDate: new Date().toISOString().split('T')[0],
        bookingTime: "10:00 AM",
        status: "scheduled"
      }
    ];
  });

  useEffect(() => {
    secureStorage.setItem('care_test_bookings', JSON.stringify(testBookings));
  }, [testBookings]);

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = secureStorage.getItem('care_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // ABDM Sovereign Compliance State
  const [abhaId, setAbhaId] = useState(() => {
    const savedUser = secureStorage.getItem('care_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed.userType === 'patient' && parsed.abhaNumber) {
        return parsed.abhaNumber;
      }
    }
    return secureStorage.getItem('care_abha_id') || "";
  });
  const [abhaAddress, setAbhaAddress] = useState(() => {
    const savedUser = secureStorage.getItem('care_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed.userType === 'patient' && parsed.abhaNumber) {
        const savedAddr = secureStorage.getItem('care_abha_address');
        return savedAddr || `${parsed.username || 'patient'}@abdm`;
      }
    }
    return secureStorage.getItem('care_abha_address') || "";
  });

  const setAbhaDetails = (id: string, address: string) => {
    setAbhaId(id);
    setAbhaAddress(address);
    secureStorage.setItem('care_abha_id', id);
    secureStorage.setItem('care_abha_address', address);
    
    if (user) {
      const updatedUser = { ...user, abhaNumber: id };
      setUser(updatedUser);
      setRegisteredUsers(prev => prev.map(u => 
        u.email.toLowerCase() === user.email.toLowerCase() && u.userType === user.userType
          ? { ...u, abhaNumber: id }
          : u
      ));
    }

    addFhirLog(
      `ABDM Health ABHA ID linked & verified. (ABHA: ${id})`,
      'success',
      JSON.stringify({ abhaId: id, abhaAddress: address, syncTime: new Date().toISOString() }, null, 2)
    );
  };

  // Human-in-the-Loop OCR Pharmacist Verification Queue State
  const [hitlQueue, setHitlQueue] = useState<any[]>(() => {
    const saved = secureStorage.getItem('care_hitl_queue');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    secureStorage.setItem('care_hitl_queue', JSON.stringify(hitlQueue));
  }, [hitlQueue]);

  const addToHitlQueue = (prescription: any) => {
    const newEntry = {
      ...prescription,
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    setHitlQueue(prev => [newEntry, ...prev]);
    addFhirLog(
      `OCR prescription routed to human pharmacist verification (ID: ${prescription.id})`,
      'info',
      JSON.stringify(newEntry, null, 2)
    );
  };

  const resolveHitlPrescription = (id: string, correctedName: string, correctedDosage: string, correctedTime: string) => {
    setHitlQueue(prev => prev.map(item => item.id === id ? { ...item, status: 'resolved' } : item));
    
    // Register the reminder for patient
    addReminder({
      medicineId: correctedName.toLowerCase().includes('paracetamol') ? 1 : 8,
      name: `${correctedName} (Pharmacist Verified)`,
      dosage: correctedDosage,
      time: correctedTime,
      stock_quantity: 14
    });

    addFhirLog(
      `Human-in-the-Loop Pharmacist verification complete (ID: ${id})`,
      'success',
      JSON.stringify({
        prescriptionId: id,
        pharmacistVerifiedDrug: correctedName,
        dosage: correctedDosage,
        time: correctedTime,
        status: "resolved",
        timestamp: new Date().toISOString()
      }, null, 2)
    );
  };
  const [consentRecords, setConsentRecords] = useState<any[]>(() => {
    const saved = secureStorage.getItem('care_consent_records');
    return saved ? JSON.parse(saved) : [
      { id: 'c1', facility: 'Sawai Man Singh Hospital', dataTypes: ['Prescriptions', 'Diagnostic Reports'], duration: '1 Year (Until 2027-06-28)', status: 'Active' },
      { id: 'c2', facility: 'Fortis Escorts Hospital', dataTypes: ['Discharge Summaries'], duration: '3 Days (Until 2026-07-01)', status: 'Active' },
      { id: 'c3', facility: 'Apex Hospital', dataTypes: ['Immunization Records'], duration: '1 Month (Until 2026-07-28)', status: 'Revoked' }
    ];
  });

  const updateConsentStatus = (id: string, status: 'Active' | 'Revoked') => {
    setConsentRecords(prev => prev.map(rec => rec.id === id ? { ...rec, status } : rec));
  };

  // Remote Patient Monitoring (IoMT) State
  const [telemetry, setTelemetry] = useState(() => {
    const saved = secureStorage.getItem('care_telemetry');
    return saved ? JSON.parse(saved) : { hrv: 58, restingHr: 68, spo2: 98, glucose: 110, sleep: 82 };
  });

  const [healthNudges, setHealthNudges] = useState<any[]>(() => {
    const saved = secureStorage.getItem('care_health_nudges');
    return saved ? JSON.parse(saved) : [
      { id: 'n1', type: 'info', message: 'Apple HealthKit integration is active. Synced 2 hours ago.', timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 'n2', type: 'info', message: 'Resting Heart Rate is stable within your normal baseline range.', timestamp: new Date(Date.now() - 3600000).toISOString() }
    ];
  });

  const addHealthNudge = (nudge: any) => {
    setHealthNudges(prev => [
      {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...nudge
      },
      ...prev
    ]);
  };

  const updateTelemetry = (newTelemetry: Partial<typeof telemetry>) => {
    setTelemetry(prev => {
      const updated = { ...prev, ...newTelemetry };
      // Check for thresholds and trigger notifications (AI+AI Health Nudges)
      if (newTelemetry.glucose && newTelemetry.glucose > 180) {
        addHealthNudge({
          type: 'warning',
          message: `Elevated Glucose Level Alert: Glucose spike detected at ${newTelemetry.glucose} mg/dL. Consider reducing carb intake and drink a glass of water.`
        });
      }
      if (newTelemetry.hrv && newTelemetry.hrv < 40) {
        addHealthNudge({
          type: 'caution',
          message: `Low Heart Rate Variability (HRV) detected (${newTelemetry.hrv} ms). High stress signal detected. Recommend a 2-minute breathing exercise.`
        });
      }
      if (newTelemetry.spo2 && newTelemetry.spo2 < 95) {
        addHealthNudge({
          type: 'critical',
          message: `Oxygen Desaturation Alert: SpO2 levels dropped to ${newTelemetry.spo2}%. If persistent or accompanied by dyspnea, contact a clinician immediately.`
        });
      }
      return updated;
    });
  };

  // FHIR / HL7 Interop logs
  const [fhirLogs, setFhirLogs] = useState<any[]>(() => {
    const saved = secureStorage.getItem('care_fhir_logs');
    return saved ? JSON.parse(saved) : [
      { id: 'l1', timestamp: new Date(Date.now() - 300000).toISOString(), event: 'Epic EHR Sync Channel Initialized', type: 'info' },
      { id: 'l2', timestamp: new Date(Date.now() - 280000).toISOString(), event: 'Bidirectional FHIR Resource Pipeline established', type: 'success' },
      { id: 'l3', timestamp: new Date(Date.now() - 100000).toISOString(), event: 'FHIR Patient Resource synchronized (FHIR-ID: 8329-a)', type: 'success' }
    ];
  });

  const addFhirLog = (event: string, type: 'info' | 'success' | 'payload', payload?: string) => {
    setFhirLogs(prev => [
      {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        event,
        type,
        payload
      },
      ...prev
    ]);
  };

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = secureStorage.getItem('care_audit_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const addAuditLog = (userRole: string, actionType: string, abhaIdMatched: string, status: 'success' | 'failed') => {
    const newLog: AuditLog = {
      timestamp: new Date().toISOString(),
      userRole,
      actionType,
      abhaIdMatched,
      status
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Sync state to LocalStorage
  useEffect(() => {
    if (user) secureStorage.setItem('care_user', JSON.stringify(user));
    else secureStorage.removeItem('care_user');
  }, [user]);

  useEffect(() => {
    secureStorage.setItem('care_consent_records', JSON.stringify(consentRecords));
  }, [consentRecords]);

  useEffect(() => {
    secureStorage.setItem('care_telemetry', JSON.stringify(telemetry));
  }, [telemetry]);

  useEffect(() => {
    secureStorage.setItem('care_health_nudges', JSON.stringify(healthNudges));
  }, [healthNudges]);

  useEffect(() => {
    secureStorage.setItem('care_fhir_logs', JSON.stringify(fhirLogs));
  }, [fhirLogs]);

  useEffect(() => {
    secureStorage.setItem('care_hospitals', JSON.stringify(hospitals));
  }, [hospitals]);

  useEffect(() => {
    secureStorage.setItem('care_stores', JSON.stringify(medicalStores));
  }, [medicalStores]);

  useEffect(() => {
    secureStorage.setItem('care_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    secureStorage.setItem('care_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    secureStorage.setItem('care_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    secureStorage.setItem('care_health_documents', JSON.stringify(healthDocuments));
  }, [healthDocuments]);

  useEffect(() => {
    secureStorage.setItem('care_consent_requests', JSON.stringify(consentRequests));
  }, [consentRequests]);

  useEffect(() => {
    secureStorage.setItem('care_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Session Inactivity Timeout (15 minutes)
  useEffect(() => {
    if (!user) return;

    let timeoutId: any;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
        addFhirLog("Session expired due to inactivity.", "info");
        alert("Your session has expired due to 15 minutes of inactivity. For your security, you have been logged out.");
      }, 15 * 60 * 1000);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user]);

  // ABDM Operations
  const triggerConsentRequest = (abhaId: string, doctorName: string, facility: string) => {
    const registryEntry = abhaRegistry.find(r => r.abhaId === abhaId);
    const abhaAddress = registryEntry ? registryEntry.address : `${abhaId.slice(-4)}@abdm`;
    
    const newRequest: ConsentRequest = {
      id: `req-${Date.now()}`,
      doctorName,
      abhaId,
      abhaAddress,
      facility,
      dataTypes: ["Prescriptions", "Diagnostic Reports", "Discharge Summaries", "Billing Invoice"],
      duration: "1 Year (Until 2027-07-01)",
      status: "Pending",
      requestedAt: new Date().toISOString()
    };
    
    setConsentRequests(prev => [newRequest, ...prev]);
    addFhirLog(`ABDM HIU Consent Request created (Patient: ${abhaId})`, 'info', JSON.stringify(newRequest, null, 2));
  };

  const approveConsentRequest = (requestId: string) => {
    setConsentRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        // Create an active consent record in the patient's records list
        const newConsentRecord = {
          id: `c-${req.id}`,
          abhaId: req.abhaId,
          facility: req.facility,
          dataTypes: req.dataTypes,
          duration: req.duration,
          status: 'Active' as const
        };
        setConsentRecords(prevRecs => [newConsentRecord, ...prevRecs]);

        addFhirLog(
          `ABDM Consent request approved by patient. FHIR Consent Resource: permit status confirmed.`,
          'success',
          JSON.stringify({
            resourceType: "Consent",
            id: `consent-${req.id}`,
            status: "active",
            patient: { display: req.abhaAddress },
            organization: [{ display: req.facility }],
            policyRule: { coding: [{ code: "OPTOUT", display: "opt-out" }] },
            provision: { 
              type: "permit", // Patient "permit" state strictly confirmed
              period: {
                start: new Date().toISOString(),
                end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
              }
            }
          }, null, 2)
        );

        return { ...req, status: 'Approved' as const };
      }
      return req;
    }));
  };

  const denyConsentRequest = (requestId: string) => {
    setConsentRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        addFhirLog(
          `ABDM Consent request denied by patient. FHIR Consent Resource: deny status confirmed.`,
          'success',
          JSON.stringify({
            resourceType: "Consent",
            id: `consent-${req.id}`,
            status: "rejected",
            patient: { display: req.abhaAddress },
            organization: [{ display: req.facility }],
            provision: { 
              type: "deny" // Patient "deny" state strictly confirmed
            }
          }, null, 2)
        );
        return { ...req, status: 'Denied' as const };
      }
      return req;
    }));
  };

  const uploadHealthDocument = (doc: Omit<HealthDocument, 'id' | 'uploadedAt' | 'careContextId'>) => {
    const careContextId = `CC-${doc.facilityName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}-${Math.floor(10000 + Math.random() * 90000)}`;
    const newDoc: HealthDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      careContextId
    };

    setHealthDocuments(prev => [newDoc, ...prev]);

    // Simulate link carecontext routing: on_carecontext call
    addFhirLog(
      `ABDM HIP: Linking Care Context ${careContextId} to ABHA ${doc.abhaAddress}`,
      'info',
      JSON.stringify({
        endpoint: "/api/v3/link/on_carecontext",
        requestId: `req-context-${Date.now()}`,
        timestamp: new Date().toISOString(),
        linking: {
          abhaAddress: doc.abhaAddress,
          careContext: {
            referenceNumber: careContextId,
            display: doc.title
          }
        }
      }, null, 2)
    );
  };

  const switchUserRole = (role: 'patient' | 'doctor' | 'hospital') => {
    // Attempt to find a registered user with this role
    const foundUser = registeredUsers.find(u => u.userType === role);
    if (foundUser) {
      setUser(foundUser);
      addFhirLog(`ABDM User Role switched to: ${role.toUpperCase()}`, 'info', JSON.stringify(foundUser, null, 2));
      return;
    }

    const defaultEmail = role === 'doctor' ? 'doctor@sms.abdm' : role === 'hospital' ? 'admin@clinic.abdm' : 'aaravomen@gmail.com';
    const defaultName = role === 'doctor' ? 'Rajesh Sharma' : role === 'hospital' ? 'Sawai Man Singh Hospital' : 'Aaravomen';
    const defaultUsername = role === 'doctor' ? 'dr_rajesh' : role === 'hospital' ? 'sms_hospital' : 'aaravomen';
    
    const updatedUser: User = {
      email: defaultEmail,
      name: defaultName,
      fullname: defaultName,
      username: defaultUsername,
      userType: role,
      specialization: role === 'doctor' ? (user?.specialization || 'Cardiologist') : undefined,
      qualification: role === 'doctor' ? (user?.qualification || 'MBBS, MD') : undefined,
      hospitalName: role === 'hospital' ? (user?.hospitalName || 'Sawai Man Singh Hospital') : undefined,
      hospitalAddress: role === 'hospital' ? (user?.hospitalAddress || 'JLN Marg, Jaipur') : undefined,
      hospitalPhone: role === 'hospital' ? (user?.hospitalPhone || '+91 141 5556666') : undefined,
    };
    
    setUser(updatedUser);
    addFhirLog(`ABDM User Role switched to: ${role.toUpperCase()}`, 'info', JSON.stringify(updatedUser, null, 2));
  };

  // Auth Operations
  const login = (identifier: string, password: string, userType: 'patient' | 'doctor' | 'hospital'): boolean => {
    const idLower = identifier.toLowerCase();
    
    // Load lockout state
    const lockoutsStr = secureStorage.getItem('care_auth_lockout');
    const lockouts: Record<string, { failedAttempts: number; lockoutUntil: number }> = 
      lockoutsStr ? JSON.parse(lockoutsStr) : {};
    
    const userLock = lockouts[idLower];
    
    if (userLock && userLock.lockoutUntil > Date.now()) {
      const remainingTime = userLock.lockoutUntil - Date.now();
      const remainingHours = Math.ceil(remainingTime / (1000 * 60 * 60));
      throw new Error(`Account locked due to excessive failed attempts. Please try again after ${remainingHours} hours.`);
    }

    const foundUser = registeredUsers.find(
      u => (u.email.toLowerCase() === idLower || u.username.toLowerCase() === idLower)
           && u.userType === userType
    );

    const trackFailedAttempt = () => {
      if (!lockouts[idLower]) {
        lockouts[idLower] = { failedAttempts: 0, lockoutUntil: 0 };
      }
      lockouts[idLower].failedAttempts += 1;
      if (lockouts[idLower].failedAttempts >= 5) {
        lockouts[idLower].lockoutUntil = Date.now() + 24 * 60 * 60 * 1000; // 24 hour lockout
      }
      secureStorage.setItem('care_auth_lockout', JSON.stringify(lockouts));
    };
    
    if (!foundUser) {
      trackFailedAttempt();
      throw new Error("No user found with the given credentials and role.");
    }
    
    if (foundUser.password !== password) {
      trackFailedAttempt();
      throw new Error("Incorrect password. Please try again.");
    }
    
    // Clear failed attempts on successful login
    if (lockouts[idLower]) {
      delete lockouts[idLower];
      secureStorage.setItem('care_auth_lockout', JSON.stringify(lockouts));
    }
    
    setUser(foundUser);
    
    if (foundUser.userType === 'patient') {
      if (foundUser.abhaNumber) {
        setAbhaId(foundUser.abhaNumber);
        secureStorage.setItem('care_abha_id', foundUser.abhaNumber);
        
        const registryEntry = abhaRegistry.find(r => r.abhaId === foundUser.abhaNumber);
        const address = registryEntry ? registryEntry.address : `${foundUser.username}@abdm`;
        setAbhaAddress(address);
        secureStorage.setItem('care_abha_address', address);
      } else {
        setAbhaId("");
        setAbhaAddress("");
        secureStorage.removeItem('care_abha_id');
        secureStorage.removeItem('care_abha_address');
      }
    } else {
      setAbhaId("");
      setAbhaAddress("");
      secureStorage.removeItem('care_abha_id');
      secureStorage.removeItem('care_abha_address');
    }
    
    return true;
  };

  const signup = (userData: User): boolean => {
    const exists = registeredUsers.some(
      u => u.email.toLowerCase() === userData.email.toLowerCase() || u.username.toLowerCase() === userData.username.toLowerCase()
    );
    if (exists) {
      throw new Error("A user with this email or username already exists.");
    }
    
    const newUser = {
      ...userData,
      name: userData.fullname, // ensure backward compatibility
      // Set defaults for doctors
      fees: userData.userType === 'doctor' ? 500 : undefined,
      startTime: userData.userType === 'doctor' ? "09:00" : undefined,
      endTime: userData.userType === 'doctor' ? "13:00" : undefined,
      category: userData.userType === 'doctor' ? (userData.specialization || "General Physician") : undefined,
      location: userData.userType === 'doctor' ? { lat: 26.905641, lng: 75.815549 } : undefined
    };
    
    setRegisteredUsers(prev => [...prev, newUser]);
    setUser(newUser);
    
    if (newUser.userType === 'doctor') {
      const newDoc: Doctor = {
        id: Date.now(),
        name: "Dr. " + newUser.fullname,
        specialty: newUser.specialization || "General Physician",
        qualification: newUser.qualification || "MBBS",
        hospitalName: newUser.hospitalName || "Care+ Telehealth",
        rating: 5.0,
        fullname: "Dr. " + newUser.fullname + " (" + (newUser.qualification || "MBBS") + ")",
        category: newUser.specialization || "General Physician",
        fees: 500,
        startTime: "09:00",
        endTime: "13:00",
        location: { lat: 26.905641, lng: 75.815549 }
      };
      setDoctors(prev => [...prev, newDoc]);
    }
    
    if (newUser.userType === 'patient') {
      if (newUser.abhaNumber) {
        setAbhaId(newUser.abhaNumber);
        secureStorage.setItem('care_abha_id', newUser.abhaNumber);
        
        const normalize = (id: string) => id.replace(/[\s-]/g, "");
        const abhaExists = abhaRegistry.some(r => normalize(r.abhaId) === normalize(newUser.abhaNumber || ''));
        if (!abhaExists && newUser.abhaNumber) {
          const address = `${newUser.username}@abdm`;
          setAbhaAddress(address);
          secureStorage.setItem('care_abha_address', address);
          setAbhaRegistry(prev => [...prev, { abhaId: newUser.abhaNumber!, name: newUser.fullname, address }]);
        }
      } else {
        setAbhaId("");
        setAbhaAddress("");
        secureStorage.removeItem('care_abha_id');
        secureStorage.removeItem('care_abha_address');
      }
    } else {
      setAbhaId("");
      setAbhaAddress("");
      secureStorage.removeItem('care_abha_id');
      secureStorage.removeItem('care_abha_address');
    }
    
    return true;
  };

  const logout = () => {
    setUser(null);
    setAbhaId("");
    setAbhaAddress("");
    setCart([]);
    secureStorage.removeItem('care_user');
    secureStorage.removeItem('care_abha_id');
    secureStorage.removeItem('care_abha_address');
    secureStorage.removeItem('care_cart');
  };

  const updateUserProfile = (updatedFields: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      ...updatedFields,
      name: updatedFields.fullname !== undefined ? updatedFields.fullname : user.name
    };
    
    setUser(updatedUser);
    
    setRegisteredUsers(prev => prev.map(u => 
      u.email.toLowerCase() === user.email.toLowerCase() && u.userType === user.userType
        ? { ...u, ...updatedFields, name: updatedFields.fullname !== undefined ? updatedFields.fullname : u.name }
        : u
    ));

    // Keep Doctor profile entry in sync if active user is a doctor
    if (user.userType === 'doctor') {
      setDoctors(prev => prev.map(d => {
        const isMatch = d.name.toLowerCase() === `dr. ${user.fullname}`.toLowerCase() ||
                        d.name.toLowerCase() === `dr. ${user.name}`.toLowerCase() ||
                        d.name.toLowerCase() === user.fullname.toLowerCase() ||
                        d.name.toLowerCase() === user.name.toLowerCase();
        if (isMatch) {
          return {
            ...d,
            name: "Dr. " + (updatedFields.fullname || user.fullname || user.name),
            specialty: updatedFields.specialization || updatedFields.category || d.specialty,
            qualification: updatedFields.qualification || d.qualification,
            fullname: "Dr. " + (updatedFields.fullname || user.fullname || user.name) + " (" + (updatedFields.qualification || d.qualification) + ")",
            category: updatedFields.specialization || updatedFields.category || d.category,
            fees: updatedFields.fees !== undefined ? Number(updatedFields.fees) : d.fees,
            startTime: updatedFields.startTime !== undefined ? updatedFields.startTime : d.startTime,
            endTime: updatedFields.endTime !== undefined ? updatedFields.endTime : d.endTime,
            location: updatedFields.location !== undefined ? updatedFields.location : d.location
          };
        }
        return d;
      }));
    }
    
    addFhirLog(`User profile updated: ${updatedFields.fullname || user.fullname}`, 'success');
  };

  const changePassword = (oldPassword: string, newPassword: string): boolean => {
    if (!user) return false;
    
    const found = registeredUsers.find(
      u => u.email.toLowerCase() === user.email.toLowerCase() && u.userType === user.userType
    );
    
    if (!found || found.password !== oldPassword) {
      throw new Error("Old password does not match.");
    }
    
    setRegisteredUsers(prev => prev.map(u => 
      u.email.toLowerCase() === user.email.toLowerCase() && u.userType === user.userType
        ? { ...u, password: newPassword }
        : u
    ));
    
    setUser(prev => prev ? { ...prev, password: newPassword } : null);
    
    addFhirLog(`User password changed successfully for ${user.fullname}`, 'success');
    return true;
  };

  const resetPassword = (emailAddress: string, newPass: string, userRole: 'patient' | 'doctor' | 'hospital'): boolean => {
    const found = registeredUsers.some(
      u => u.email.toLowerCase() === emailAddress.toLowerCase() && u.userType === userRole
    );
    
    if (!found) {
      throw new Error("No user found with the registered email for this role.");
    }
    
    setRegisteredUsers(prev => prev.map(u => 
      u.email.toLowerCase() === emailAddress.toLowerCase() && u.userType === userRole
        ? { ...u, password: newPass }
        : u
    ));
    
    if (user && user.email.toLowerCase() === emailAddress.toLowerCase() && user.userType === userRole) {
      setUser(prev => prev ? { ...prev, password: newPass } : null);
    }
    
    addFhirLog(`Password reset successful for ${emailAddress} (Role: ${userRole})`, 'success');
    return true;
  };

  // Hospital Registrations
  const registerHospital = (hospital: Omit<Hospital, 'id' | 'lat' | 'lng' | 'verified'>) => {
    const newHospital: Hospital = {
      ...hospital,
      id: Date.now(),
      lat: 26.9000 + (Math.random() - 0.5) * 0.1, // Random nearby coords
      lng: 75.8000 + (Math.random() - 0.5) * 0.1,
      verified: true,
      facilities: ["24x7 Emergency", "Radiology & Imaging"],
      testMenu: [
        { testName: "CBC (Complete Blood Count)", price: 350 },
        { testName: "LFT (Liver Function Test)", price: 800 },
        { testName: "HbA1c (Glycated Haemoglobin)", price: 440 },
        { testName: "Lipid Profile", price: 600 }
      ]
    };
    setHospitals(prev => [newHospital, ...prev]);
  };

  const updateHospitalDetails = (hospitalId: number, details: Partial<Hospital>) => {
    setHospitals(prev => prev.map(h => 
      h.id === hospitalId
        ? { ...h, ...details }
        : h
    ));
    addFhirLog(`Hospital credentials/menu updated: ID ${hospitalId}`, 'success');
  };

  const updateDoctorDetails = (doctorId: number, details: Partial<Doctor>) => {
    setDoctors(prev => prev.map(d => 
      d.id === doctorId ? { ...d, ...details } : d
    ));
    addFhirLog(`Doctor profile details updated: ID ${doctorId}`, 'success');
  };

  // Medical Stores Registrations
  const registerMedicalStore = (store: Omit<MedicalStore, 'id'>) => {
    const newStore: MedicalStore = {
      ...store,
      id: Date.now()
    };
    setMedicalStores(prev => [newStore, ...prev]);
  };

  // Medicine Reminders Operations
  const addReminder = (reminder: Omit<MedicineReminder, 'id' | 'last_taken_at'>) => {
    const newReminder: MedicineReminder = {
      ...reminder,
      id: Date.now().toString(),
      user_id: user?.email || 'guest'
    };
    setReminders(prev => [newReminder, ...prev]);
  };

  const takeMedicine = (reminderId: string) => {
    setReminders(prev => prev.map(reminder => {
      if (reminder.id === reminderId) {
        return {
          ...reminder,
          last_taken_at: new Date().toISOString(),
          stock_quantity: Math.max(0, reminder.stock_quantity - 1)
        };
      }
      return reminder;
    }));
  };

  const deleteReminder = (reminderId: string) => {
    setReminders(prev => prev.filter(r => r.id !== reminderId));
  };

  // Appointments Booking Operations
  const bookAppointment = (doctorId: number | string, doctorName: string, specialty: string, date: string, time: string) => {
    const newAppointment: Appointment = {
      id: Date.now().toString(),
      user_id: user?.email || 'guest',
      doctor_id: doctorId,
      doctor_name: doctorName,
      specialty,
      appointment_date: date,
      appointment_time: time,
      status: 'scheduled',
      patient_name: user?.name || 'Guest Patient'
    };
    setAppointments(prev => [newAppointment, ...prev]);

    // Track booked time slots in state dictionary
    const docIdStr = doctorId.toString();
    setBookedSlots(prev => {
      const docSlots = prev[docIdStr] || {};
      const dateSlots = docSlots[date] || [];
      if (!dateSlots.includes(time)) {
        return {
          ...prev,
          [docIdStr]: {
            ...docSlots,
            [date]: [...dateSlots, time]
          }
        };
      }
      return prev;
    });
  };

  const updateAppointmentStatus = (id: string, status: 'scheduled' | 'completed' | 'cancelled') => {
    setAppointments(prev => prev.map(app => {
      if (app.id === id) {
        return { ...app, status };
      }
      return app;
    }));
  };

  // Diagnostic Lab Test Booking Operations
  const bookTest = (hospitalId: number, testName: string, price: number, date: string, time: string) => {
    const hosp = hospitals.find(h => h.id === hospitalId);
    const hospitalName = hosp ? hosp.name : "Sawai Man Singh Hospital";
    
    const newBooking: TestBooking = {
      id: `tb-${Date.now()}`,
      patientId: abhaId || "91-4562-1049-3825",
      patientName: user?.fullname || user?.name || "Aaravomen",
      hospitalId,
      hospitalName,
      testName,
      price,
      bookingDate: date,
      bookingTime: time,
      status: "scheduled"
    };

    setTestBookings(prev => [newBooking, ...prev]);

    // Create a mock FHIR log for service request
    const fhirPayload = JSON.stringify({
      resourceType: "ServiceRequest",
      id: `srvreq-lab-${Date.now()}`,
      status: "active",
      intent: "order",
      code: { coding: [{ system: "http://loinc.org", display: testName }] },
      subject: { reference: `Patient/${abhaId || "91-4562-1049-3825"}`, display: user?.fullname || user?.name },
      occurrenceDateTime: `${date}T10:00:00Z`,
      authoredOn: new Date().toISOString(),
      performer: [{ display: hospitalName }]
    }, null, 2);

    addFhirLog(`Lab diagnostic test booked: ${testName} at ${hospitalName}`, 'success', fhirPayload);
    addAuditLog('patient', 'BOOK_DIAGNOSTIC_TEST', abhaId || "91-4562-1049-3825", 'success');
  };

  const updateTestBookingStatus = (id: string, status: 'scheduled' | 'completed' | 'cancelled') => {
    setTestBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
    addFhirLog(`Diagnostic test booking ${id} status updated to ${status}`, 'info');
  };

  // Shopping Cart Operations
  const addToCart = (medicine: Medicine) => {
    setCart(prev => {
      const existing = prev.find(item => item.medicine.id === medicine.id);
      if (existing) {
        return prev.map(item => 
          item.medicine.id === medicine.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { id: Date.now(), medicine, quantity: 1 }];
    });
  };

  const removeFromCart = (medicineId: number) => {
    setCart(prev => prev.filter(item => item.medicine.id !== medicineId));
  };

  const updateCartQuantity = (medicineId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(medicineId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.medicine.id === medicineId 
        ? { ...item, quantity }
        : item
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <AppContext.Provider value={{
      user, hospitals, medicalStores, medicines, reminders, appointments, cart, doctors,
      login, signup, logout, registerHospital, registerMedicalStore,
      addReminder, takeMedicine, deleteReminder, bookAppointment, updateAppointmentStatus,
      addToCart, removeFromCart, updateCartQuantity, clearCart,
      
      // ABDM Sovereign Compliance State
      abhaId,
      abhaAddress,
      setAbhaDetails,
      consentRecords,
      updateConsentStatus,
      
      // ABDM EMR & Document Management System
      healthDocuments,
      consentRequests,
      triggerConsentRequest,
      approveConsentRequest,
      denyConsentRequest,
      uploadHealthDocument,
      abhaRegistry,
      switchUserRole,

      // Remote Patient Monitoring (IoMT) State
      telemetry,
      updateTelemetry,
      healthNudges,
      addHealthNudge,
      
      // Interoperability (HL7/FHIR Sync) Logs
      fhirLogs,
      addFhirLog,

      // Human-in-the-Loop OCR Pharmacist Verification Queue
      hitlQueue,
      addToHitlQueue,
      resolveHitlPrescription,

      // Audit Logs
      auditLogs,
      addAuditLog,

      // Profile settings
      updateUserProfile,
      changePassword,
      resetPassword,
      updateHospitalDetails,
      bookedSlots,
      updateDoctorDetails,
      testBookings,
      bookTest,
      updateTestBookingStatus
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
