import React, { useState, useEffect } from 'react';
import { useParams as getParams, useNavigate as useNav } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { Calendar as CalendarIcon, Clock, Stethoscope, User, MapPin, CheckCircle, ArrowLeft, ArrowRight, UserCircle, Star, ShieldCheck, RefreshCw, ShieldAlert } from 'lucide-react';

export const Appointments: React.FC = () => {
  const { doctorId } = getParams();
  const navigate = useNav();
  const { doctors, bookAppointment, user, bookedSlots } = useAppContext();

  // Booking states
  const [step, setStep] = useState(1);
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [success, setSuccess] = useState(false);

  // User GPS Coordinates for Doctor Distance Calculations
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Fallback to Jaipur coords
          setUserCoords({ lat: 26.9124, lng: 75.7873 });
        }
      );
    } else {
      setUserCoords({ lat: 26.9124, lng: 75.7873 });
    }
  }, []);

  // Haversine Distance Formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d.toFixed(1);
  };

  // Generates 20-minute slot intervals based on doctor visiting hours
  const getDoctorSlots = (doc: any) => {
    const startStr = doc.startTime || "09:00";
    const endStr = doc.endTime || "13:00";
    
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    
    const startTimeMins = startH * 60 + startM;
    const endTimeMins = endH * 60 + endM;
    
    const listSlots: string[] = [];
    for (let time = startTimeMins; time < endTimeMins; time += 20) {
      const h = Math.floor(time / 60);
      const m = time % 60;
      
      const period = h >= 12 ? "PM" : "AM";
      const formattedHour = h % 12 === 0 ? 12 : h % 12;
      const formattedMin = m.toString().padStart(2, '0');
      const displayHour = formattedHour.toString().padStart(2, '0');
      
      listSlots.push(`${displayHour}:${formattedMin} ${period}`);
    }
    return listSlots;
  };

  // Insurance verification state
  const [insuranceProvider, setInsuranceProvider] = useState('');
  const [insuranceMemberId, setInsuranceMemberId] = useState('');
  const [verifyingInsurance, setVerifyingInsurance] = useState(false);
  const [insuranceVerified, setInsuranceVerified] = useState<boolean | null>(null);
  const [insuranceDetails, setInsuranceDetails] = useState<any | null>(null);

  const handleVerifyInsurance = () => {
    if (!insuranceProvider || !insuranceMemberId) return;
    setVerifyingInsurance(true);
    setInsuranceVerified(null);
    setTimeout(() => {
      setVerifyingInsurance(false);
      setInsuranceVerified(true);
      setInsuranceDetails({
        status: 'Active Coverage',
        coPay: insuranceProvider === 'Star Health' ? '₹250' : '$15',
        deductibleMet: 'Yes',
        planName: `${insuranceProvider} Gold Telehealth Care`
      });
    }, 2000);
  };

  // Pre-select doctor if doctorId is in path parameters
  useEffect(() => {
    if (doctorId) {
      const doc = doctors.find(d => d.id === parseInt(doctorId, 10));
      if (doc) {
        setSelectedDoctor(doc);
        setSelectedSpecialty(doc.specialty);
        setStep(3); // skip directly to scheduling
      }
    }
  }, [doctorId, doctors]);

  // Available slots list
  const slots = ["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];

  // Synchronized list of specialties matching the Hospital Directory map page
  const specialties = [
    "General Medicine",
    "Family Medicine",
    "Emergency Medicine",
    "Cardiology",
    "Neurology",
    "Neurosurgery",
    "Pediatrics",
    "Obstetrics & Gynecology",
    "Orthopedic Surgery",
    "Dermatology",
    "Gastroenterology",
    "Oncology (Cancer Treatment)",
    "Psychiatry",
    "Pulmonology / Respiratory Medicine",
    "Endocrinology",
    "Nephrology & Dialysis",
    "Urology",
    "ENT",
    "Ophthalmology",
    "Dental Sciences"
  ];

  // Helper matching function for specialty categorization mapping
  const matchSpecialty = (docSpecialty: string, selected: string): boolean => {
    const docLower = docSpecialty.toLowerCase();
    const selLower = selected.toLowerCase();

    // Custom mappings for CGHS / HFR recognized medical specialties to raw database values
    const mappings: Record<string, string[]> = {
      "general medicine": ["general medicine", "family medicine", "general physician", "internal medicine"],
      "family medicine": ["general medicine", "family medicine", "general physician", "internal medicine"],
      "emergency medicine": ["emergency", "emergency medicine", "trauma"],
      "cardiology": ["cardiology", "cardiologist"],
      "neurology": ["neurology", "neurologist"],
      "neurosurgery": ["neurosurgery", "neurology", "general surgery"],
      "pediatrics": ["pediatrics", "pediatrician", "neonatology"],
      "obstetrics & gynecology": ["gynecology", "obstetrics", "obgyn", "gynecologist"],
      "orthopedic surgery": ["orthopedics", "orthopedic", "general surgery", "orthopedic surgery"],
      "dermatology": ["dermatology", "dermatologist"],
      "gastroenterology": ["gastroenterology", "gastroenterologist"],
      "oncology (cancer treatment)": ["oncology", "oncologist", "cancer"],
      "psychiatry": ["psychiatry", "psychiatrist", "psychology", "mental health"],
      "pulmonology / respiratory medicine": ["pulmonology", "pulmonologist", "respiratory"],
      "endocrinology": ["endocrinology", "endocrinologist", "thyroid"],
      "nephrology & dialysis": ["nephrology", "nephrologist", "dialysis", "kidney"],
      "urology": ["urology", "urologist"],
      "ent": ["ent", "ear pain", "ear infection"],
      "ophthalmology": ["ophthalmology", "ophthalmologist", "eye pain", "eye redness"],
      "dental sciences": ["dentistry", "dental", "tooth", "toothache"]
    };

    const targetSpecs = mappings[selLower] || [selLower];
    return targetSpecs.some(target => docLower.includes(target) || target.includes(docLower));
  };

  // Filtered doctors by specialty using the matcher
  const filteredDoctors = doctors.filter(d => matchSpecialty(d.specialty, selectedSpecialty));

  const handleSelectSpecialty = (spec: string) => {
    setSelectedSpecialty(spec);
    setStep(2);
  };

  const handleSelectDoctor = (doc: any) => {
    setSelectedDoctor(doc);
    setStep(3);
  };

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !date || !timeSlot) return;

    if (!user) {
      // Direct login redirect or error prompt
      navigate('/login');
      return;
    }

    bookAppointment(
      selectedDoctor.id,
      selectedDoctor.name,
      selectedDoctor.specialty,
      date,
      timeSlot
    );

    setSuccess(true);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="bg-card border p-8 rounded-2xl shadow-elevated text-center max-w-sm animate-fade-in">
          <div className="bg-success/15 text-success w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-success/20 animate-pulse">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Your consultation with <strong>{selectedDoctor?.name}</strong> has been successfully booked for <strong>{date}</strong> at <strong>{timeSlot}</strong>.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-2.5 bg-gradient-medical text-white font-semibold rounded-lg hover:opacity-90 transition-all text-sm shadow-medical"
          >
            Go to Patient Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        
        {/* Title */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Schedule a Consultation
          </h1>
          <p className="text-sm text-muted-foreground">
            {step === 1 && "Select a medical specialty field"}
            {step === 2 && "Choose your preferred specialist doctor"}
            {step === 3 && "Pick appointment date and available hours slot"}
          </p>
        </div>

        {/* Back and Progress tracker */}
        <div className="flex justify-between items-center mb-6">
          {step > 1 && !doctorId ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-xs text-primary font-bold hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}
          
          <div className="text-xs text-muted-foreground font-bold">
            Step {step} of 3
          </div>
        </div>

        {/* Step 1: Select Specialty */}
        {step === 1 && (
          <div className="grid sm:grid-cols-2 gap-4 animate-fade-in">
            {specialties.map((spec, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSpecialty(spec)}
                className="bg-card border p-5 rounded-xl text-left hover:border-primary/45 hover:-translate-y-1 hover:shadow-medical transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Stethoscope className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm text-foreground">{spec}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Select Doctor */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-xs bg-secondary/30 border p-3 rounded-lg flex items-center gap-2 mb-2">
              <span className="font-semibold">Specialty selected:</span>
              <span className="bg-primary/15 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold">{selectedSpecialty}</span>
            </div>

            {filteredDoctors.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-2xl bg-card p-6">
                <ShieldAlert className="w-8 h-8 text-primary mx-auto mb-3" />
                <h4 className="font-extrabold text-sm text-foreground">No Registered Practitioners Yet</h4>
                <p className="text-xs text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
                  There are currently no active consult doctors listed under <span className="text-primary font-bold">{selectedSpecialty}</span>. You can choose a different category or search for general consults.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedSpecialty("General Medicine")}
                  className="mt-4 px-4 py-2 bg-gradient-medical text-white text-xs font-bold rounded-xl shadow-medical hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                >
                  Show General Medicine Doctors
                </button>
              </div>
            ) : (
              filteredDoctors.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => handleSelectDoctor(doc)}
                  className="bg-card border p-5 rounded-xl cursor-pointer hover:border-primary/45 hover:-translate-y-1 hover:shadow-medical transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center border">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-sm text-foreground">{doc.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{doc.qualification}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-muted-foreground mt-2 font-semibold">
                        <span className="flex items-center gap-0.5 text-yellow-500 font-extrabold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          {doc.rating}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3 text-primary shrink-0" />
                          {doc.hospitalName} ({userCoords && doc.location ? `${calculateDistance(userCoords.lat, userCoords.lng, doc.location.lat, doc.location.lng)} km` : '3.5 km'})
                        </span>
                        <span className="text-primary font-bold">
                          Fees: ₹{doc.fees || 500}
                        </span>
                        <span className="bg-primary/5 text-primary border border-primary/10 px-1 rounded text-[9px] font-mono">
                          {doc.startTime || "09:00"} - {doc.endTime || "13:00"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))
            )}
          </div>
        )}

        {/* Step 3: Date & Slots */}
        {step === 3 && selectedDoctor && (
          <form onSubmit={handleBook} className="bg-card border p-6 rounded-2xl shadow-medical space-y-6 animate-fade-in">
            {/* Selected Summary */}
            <div className="flex items-center gap-4 border-b pb-4 text-left">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center border shrink-0">
                <UserCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">{selectedDoctor.name}</h3>
                <p className="text-xs text-primary font-bold">{selectedDoctor.qualification} • {selectedDoctor.category || selectedDoctor.specialty}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[10px] text-muted-foreground font-semibold">
                  <span>Hospital: {selectedDoctor.hospitalName}</span>
                  <span className="text-primary font-bold">Fees: ₹{selectedDoctor.fees || 500}</span>
                  <span className="bg-primary/5 text-primary border border-primary/10 px-1.5 py-0.2 rounded text-[9px] font-mono">
                    Visiting Hours: {selectedDoctor.startTime || "09:00"} - {selectedDoctor.endTime || "13:00"}
                  </span>
                  {userCoords && selectedDoctor.location && (
                    <span>Distance: {calculateDistance(userCoords.lat, userCoords.lng, selectedDoctor.location.lat, selectedDoctor.location.lng)} km</span>
                  )}
                </div>
              </div>
            </div>

            {/* Date Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <CalendarIcon className="w-4 h-4 text-primary" />
                Select Appointment Date *
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-card text-foreground"
                required
              />
            </div>

            {/* Time Slot Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                Select Available Hours Slot *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {getDoctorSlots(selectedDoctor).map((slot, index) => {
                  const docIdStr = selectedDoctor.id.toString();
                  const isBooked = bookedSlots[docIdStr]?.[date]?.includes(slot) || false;
                  
                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={isBooked}
                      onClick={() => setTimeSlot(slot)}
                      className={`py-2 px-3 border rounded-lg text-xs font-semibold transition-all relative ${
                        isBooked
                          ? 'bg-secondary/40 border-secondary text-muted-foreground/60 cursor-not-allowed opacity-60'
                          : timeSlot === slot
                            ? 'bg-primary text-primary-foreground border-primary shadow-medical'
                            : 'bg-card text-foreground border-border hover:bg-muted/40'
                      }`}
                    >
                      <span>{slot}</span>
                      {isBooked && (
                        <span className="absolute -top-1.5 -right-1 text-[7px] bg-red-500 text-white font-extrabold px-1 rounded shadow-sm border border-red-400">
                          Booked
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Insurance Verification Widget */}
            <div className="border border-border/80 rounded-xl p-4 bg-secondary/20 space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Insurance Eligibility Verification
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Optional: Enter your insurance policy to verify coverage and co-pays.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground block">Payer / Insurance Provider</label>
                  <select
                    value={insuranceProvider}
                    onChange={(e) => {
                      setInsuranceProvider(e.target.value);
                      setInsuranceVerified(null);
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-card text-foreground"
                  >
                    <option value="">Select Payer / Cash-Pay</option>
                    <option value="Star Health">Star Health Insurance (India)</option>
                    <option value="HDFC Ergo">HDFC Ergo Health (India)</option>
                    <option value="Blue Cross">Blue Cross Blue Shield (US)</option>
                    <option value="UnitedHealthcare">UnitedHealthcare (US)</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-muted-foreground block">Member / Policy ID</label>
                  <input
                    type="text"
                    placeholder="e.g. MB-9821-4320"
                    value={insuranceMemberId}
                    onChange={(e) => {
                      setInsuranceMemberId(e.target.value);
                      setInsuranceVerified(null);
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-card text-foreground"
                  />
                </div>
              </div>

              {insuranceProvider && insuranceMemberId && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleVerifyInsurance}
                    disabled={verifyingInsurance}
                    className="px-3 py-1.5 bg-card hover:bg-muted text-primary border border-primary/20 font-bold rounded-lg text-[10px] transition-all flex items-center gap-1.5"
                  >
                    {verifyingInsurance ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Verifying Policy...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Check Real-Time Eligibility (RTE)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {insuranceVerified && insuranceDetails && (
                <div className="bg-success/15 border border-success/35 text-success rounded-lg p-3 text-xs flex flex-col gap-1 animate-fade-in font-medium">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 shrink-0 text-success" />
                    <span className="font-bold">{insuranceDetails.status}</span>
                  </div>
                  <p className="text-[10px] text-success/90">
                    Plan: {insuranceDetails.planName} | Co-pay: {insuranceDetails.coPay}
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!date || !timeSlot || verifyingInsurance}
              className="w-full py-2.5 bg-gradient-medical text-white font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all text-sm shadow-medical disabled:opacity-50 disabled:pointer-events-none"
            >
              Confirm Appointment Booking
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

export default Appointments;
