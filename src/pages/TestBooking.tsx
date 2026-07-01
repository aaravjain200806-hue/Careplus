import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, Hospital as HospitalIcon, Calendar as CalendarIcon, Clock, CheckCircle, ArrowLeft, ArrowRight, UserCircle, Star, ShieldCheck, ShieldAlert, HeartPulse, Sparkles } from 'lucide-react';

export const TestBookingPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { hospitals, bookTest, user, abhaId } = useAppContext();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHospital, setSelectedHospital] = useState<any | null>(null);
  const [selectedTest, setSelectedTest] = useState<{ testName: string; price: number } | null>(null);
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Select Hosp/Test, 2: Scheduling, 3: Confirmation
  const [successInfo, setSuccessInfo] = useState<any | null>(null);

  const times = ["08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"];

  // Filter hospitals by search query matching hospital name or test names
  const filteredHospitals = hospitals.filter(h => {
    const matchesHospName = h.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTestMenu = h.testMenu?.some(test => 
      test.testName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesHospName || matchesTestMenu;
  });

  const handleSelectHospitalTest = (hospital: any, test: { testName: string; price: number }) => {
    setSelectedHospital(hospital);
    setSelectedTest(test);
    setStep(2);
  };

  const handleBookTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospital || !selectedTest || !date || !timeSlot) return;

    if (!user) {
      alert("Please login as a patient to book diagnostic tests.");
      navigate('/login');
      return;
    }

    // Call context bookTest
    bookTest(selectedHospital.id, selectedTest.testName, selectedTest.price, date, timeSlot);

    // Set success info for the Step 3 render
    setSuccessInfo({
      hospitalName: selectedHospital.name,
      testName: selectedTest.testName,
      price: selectedTest.price,
      date,
      time: timeSlot
    });
    setStep(3);
  };

  const handleReset = () => {
    setSelectedHospital(null);
    setSelectedTest(null);
    setDate('');
    setTimeSlot('');
    setStep(1);
    setSuccessInfo(null);
  };

  return (
    <div className="min-h-screen bg-gradient-hero pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Breadcrumb Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={() => setStep(prev => (prev - 1) as any)}
                className="p-1.5 hover:bg-card border rounded-lg text-foreground transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Diagnostic Lab Test Booking</h1>
              <p className="text-xs text-muted-foreground">Book clinical tests, diagnostic screening, and scans at verified hospitals</p>
            </div>
          </div>
          <span className="text-[10px] bg-primary/10 border border-primary/20 text-primary font-bold px-3 py-1 rounded-full flex items-center gap-1 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5" />
            ABDM Compliant Booking
          </span>
        </div>

        {/* STEP 1: SELECT HOSPITAL & TEST */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            {/* Search Bar */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by test name (e.g. CBC, HbA1c, Thyroid) or hospital name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-2xl text-xs bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-medical"
              />
            </div>

            {/* Hospitals List */}
            <div className="space-y-4">
              {filteredHospitals.length === 0 ? (
                <div className="text-center py-16 border border-dashed rounded-2xl bg-card">
                  <ShieldAlert className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">No hospitals or tests match your search query</p>
                  <p className="text-xs text-muted-foreground mt-1">Try entering another keyword like "CBC", "Thyroid" or "Fortis"</p>
                </div>
              ) : (
                filteredHospitals.map((hosp) => (
                  <div key={hosp.id} className="bg-card border rounded-2xl p-5 shadow-medical space-y-4 text-left">
                    <div className="flex justify-between items-start border-b pb-3.5">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl border border-primary/10">
                          <HospitalIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-foreground">{hosp.name}</h3>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{hosp.address}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 text-right">
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-0.5 rounded border border-emerald-500/15">
                          Verified Diagnostics
                        </span>
                        <div className="flex items-center gap-0.5 text-yellow-500 font-bold text-[10px]">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>4.7</span>
                        </div>
                      </div>
                    </div>

                    {/* Test Menu Grid */}
                    <div className="space-y-2">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Available Diagnostic Tests</p>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {hosp.testMenu?.map((test: any, idx: number) => (
                          <div 
                            key={idx} 
                            onClick={() => handleSelectHospitalTest(hosp, test)}
                            className="border p-3.5 rounded-xl bg-secondary/5 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer flex flex-col justify-between h-20 text-left relative group overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-8 h-8 bg-primary/5 rounded-bl-full flex items-center justify-center translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:-translate-y-0 transition-transform">
                              <PlusIcon className="w-3 h-3 text-primary" />
                            </div>
                            <span className="font-bold text-xs text-foreground line-clamp-1 group-hover:text-primary transition-colors">{test.testName}</span>
                            <span className="font-mono text-primary font-bold text-xs mt-1.5">₹{test.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP 2: SCHEDULING DETAILS */}
        {step === 2 && selectedHospital && selectedTest && (
          <form onSubmit={handleBookTestSubmit} className="bg-card border p-6 rounded-2xl shadow-medical space-y-6 animate-fade-in text-left">
            {/* Selected Test Summary Banner */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4.5 flex justify-between items-center">
              <div>
                <span className="text-[9px] bg-primary/15 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full font-bold uppercase">
                  Selected Lab Test
                </span>
                <h3 className="font-extrabold text-sm text-foreground mt-2">{selectedTest.testName}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Facility: {selectedHospital.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Payable</p>
                <p className="font-mono font-black text-xl text-primary mt-1">₹{selectedTest.price}</p>
              </div>
            </div>

            {/* Date Selection */}
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

            {/* Time Slot Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-2">
                <Clock className="w-4 h-4 text-primary" />
                Select Preferred Hours Slot *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {times.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setTimeSlot(slot)}
                    className={`py-2 border rounded-xl font-bold text-xs transition-all ${
                      timeSlot === slot
                        ? 'border-primary bg-primary text-white shadow-medical'
                        : 'border-border bg-card text-foreground hover:bg-muted/40'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!date || !timeSlot}
              className="w-full py-3 bg-gradient-medical text-white font-bold text-xs rounded-xl shadow-medical hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Confirm & Book Lab Appointment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {step === 3 && successInfo && (
          <div className="bg-card border p-8 rounded-2xl shadow-medical text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-success/10 text-success border border-success/20 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h2 className="font-extrabold text-xl text-foreground">Lab Appointment Scheduled!</h2>
              <p className="text-xs text-muted-foreground">
                Your diagnostic service request is registered with ABDM Gateway care context.
              </p>
            </div>

            {/* Booking Summary Box */}
            <div className="bg-secondary/15 border rounded-xl p-5 text-left space-y-3.5 max-w-md mx-auto">
              <div className="flex justify-between items-start border-b pb-2 text-xs">
                <div>
                  <p className="font-bold text-foreground">{successInfo.testName}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{successInfo.hospitalName}</p>
                </div>
                <span className="font-mono font-bold text-primary">₹{successInfo.price}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-muted-foreground">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Booking Date</p>
                  <p className="text-foreground mt-1">{successInfo.date}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Booking Time</p>
                  <p className="text-foreground mt-1">{successInfo.time}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2.5 border border-primary/20 text-primary hover:bg-primary/5 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Go to Dashboard
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-gradient-medical text-white text-xs font-bold rounded-xl shadow-medical hover:opacity-95 transition-all cursor-pointer"
              >
                Book Another Test
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M5 12h14"></path>
    <path d="M12 5v14"></path>
  </svg>
);

export default TestBookingPage;
