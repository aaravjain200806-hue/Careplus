import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { AppProvider } from './context/AppContext';

// Import Components
import Navbar from './components/Navbar';
import SOSButton from './components/SOSButton';
import Footer from './components/Footer';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import Appointments from './pages/Appointments';
import Medicines from './pages/Medicines';
import MedicineShop from './pages/MedicineShop';
import Hospitals from './pages/Hospitals';
import MedicalStores from './pages/MedicalStores';
import Chat from './pages/Chat';
import TestBookingPage from './pages/TestBooking';
import NotFound from './pages/NotFound';

export const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
            {/* Header Navbar */}
            <Navbar />

            {/* Main Content Area */}
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<PatientDashboard />} />
                <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/doctor/:doctorId" element={<Appointments />} /> {/* Dynamic booking redirect */}
                <Route path="/medicines" element={<Medicines />} />
                <Route path="/medicine-shop" element={<MedicineShop />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/hospitals" element={<Hospitals />} />
                <Route path="/medical-stores" element={<MedicalStores />} />
                <Route path="/book-test" element={<TestBookingPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>

            {/* Floating SOS Distress Alarm Button */}
            <SOSButton />

            {/* Branding Footer */}
            <Footer />
          </div>
        </Router>
      </AppProvider>
    </LanguageProvider>
  );
};

export default App;
