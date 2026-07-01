import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { Calendar, BellRing, MessageSquare, Hospital, ShieldAlert, Activity, ArrowRight, Store } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  const services = [
    {
      icon: Calendar,
      title: "Book Appointments",
      description: "Schedule consultations with verified specialists in your area instantly.",
      action: () => navigate("/appointments"),
      gradient: "from-blue-500 to-cyan-500",
      shadow: "shadow-blue-500/20"
    },
    {
      icon: BellRing,
      title: "Medicine Reminders",
      description: "Log your prescriptions, track stock quantity, and get smart intake alerts.",
      action: () => navigate("/medicines"),
      gradient: "from-green-500 to-emerald-500",
      shadow: "shadow-emerald-500/20"
    },
    {
      icon: MessageSquare,
      title: "AI Health Chat",
      description: "Ask queries 24/7 to our smart symptom analyzer and first aid virtual assistant.",
      action: () => navigate("/chat"),
      gradient: "from-purple-500 to-pink-500",
      shadow: "shadow-purple-500/20"
    },
    {
      icon: Hospital,
      title: "Find Hospitals",
      description: "Locate clinics, view operating specialties, and get instant routing coordinates.",
      action: () => navigate("/hospitals"),
      gradient: "from-orange-500 to-red-500",
      shadow: "shadow-red-500/20"
    },
    {
      icon: Store,
      title: "Find Medical Stores",
      description: "Find local pharmacies, check delivery status, and call verified numbers.",
      action: () => navigate("/medical-stores"),
      gradient: "from-teal-500 to-green-500",
      shadow: "shadow-teal-500/20"
    }
  ];

  const stats = [
    { value: "15+", label: "Verified Hospitals" },
    { value: "24/7", label: "AI Medical Support" },
    { value: "5,000+", label: "Registered Patients" },
    { value: "10", label: "Regional Languages" }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero pt-16">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>Multilingual Medical Services Portal</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Your Health, Our Priority <br />
          <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Accessible Anywhere, 24/7
          </span>
        </h1>
        
        <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg mb-8 leading-relaxed">
          Book appointments, manage prescription reminders, chat with an AI doctor, and locate emergency rooms in your local language. Supporting over 10 regional languages.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate('/appointments')}
            className="px-6 py-3 bg-gradient-medical text-white font-semibold rounded-xl hover:scale-105 active:scale-95 shadow-medical transition-all flex items-center gap-2 text-sm"
          >
            <span>Book Appointment</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => navigate('/chat')}
            className="px-6 py-3 bg-card border hover:bg-muted font-semibold text-foreground rounded-xl hover:scale-105 active:scale-95 transition-all text-sm"
          >
            Consult AI Doctor
          </button>
        </div>
      </section>

      {/* Quick Access Services */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-3">Our Services</h2>
          <p className="text-muted-foreground">Select a service below to manage your medical requirements</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={index}
                onClick={service.action}
                className="group relative cursor-pointer bg-card border rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-elevated hover:border-primary/20 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${service.gradient} text-white flex items-center justify-center mb-5 ${service.shadow} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors text-foreground">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {service.description}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-primary text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Open Service</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="bg-secondary/40 border-y py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <div key={i} className="space-y-1">
                <div className="text-3xl md:text-4xl font-extrabold text-primary">{stat.value}</div>
                <div className="text-xs md:text-sm text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Distress Spotlight */}
      <section className="container mx-auto px-4 py-16 text-center max-w-3xl">
        <div className="bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>
          
          <div className="bg-red-500/15 text-red-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
          
          <h3 className="text-2xl font-bold text-red-600 dark:text-red-500 mb-2">Emergency? Don't Wait.</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Click the floating red SOS icon in the bottom-right corner at any time to trigger a local siren, view first aid cards, or access direct ambulance dispatch simulations.
          </p>
          <a
            href="tel:108"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg transition-all"
          >
            <PhoneCallIcon className="w-4 h-4" />
            <span>Call Ambulance (108)</span>
          </a>
        </div>
      </section>
    </div>
  );
};

const PhoneCallIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

export default Home;
