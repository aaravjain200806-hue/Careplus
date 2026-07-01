import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Search, Store, Phone, Navigation, Clock, Truck, Plus, Sparkles, X, HeartPulse } from 'lucide-react';

export const MedicalStores: React.FC = () => {
  const { medicalStores, registerMedicalStore } = useAppContext();
  
  const [search, setSearch] = useState('');
  
  // Register store modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [open24, setOpen24] = useState(false);
  const [delivery, setDelivery] = useState(false);
  const [success, setSuccess] = useState(false);

  // Filter stores
  const filtered = medicalStores.filter(store =>
    store.name.toLowerCase().includes(search.toLowerCase()) ||
    store.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !storeAddress || !storePhone) return;

    registerMedicalStore({
      name: storeName,
      address: storeAddress,
      phone: storePhone,
      open_24_hours: open24,
      delivery_available: delivery,
      latitude: 26.9000 + (Math.random() - 0.5) * 0.1,
      longitude: 75.8000 + (Math.random() - 0.5) * 0.1
    });

    setSuccess(true);
    setTimeout(() => {
      setModalOpen(false);
      setSuccess(false);
      setStoreName('');
      setStoreAddress('');
      setStorePhone('');
      setOpen24(false);
      setDelivery(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-hero pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header Title */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Find Medical Stores
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            Locate nearby pharmacies, contact verified retail pharmacists, or request deliveries.
          </p>

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-gradient-medical text-white text-xs font-semibold rounded-lg shadow-medical hover:opacity-90 active:scale-95 transition-all flex items-center gap-1.5 mx-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Register Pharmacy / Store</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-8">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Search stores by pharmacy name, address, sector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 border rounded-xl bg-card text-foreground"
          />
        </div>

        {/* Stores Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 border border-dashed rounded-2xl bg-card">
              <Store className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No pharmacies found matching search criteria.</p>
            </div>
          ) : (
            filtered.map((store) => (
              <div key={store.id} className="bg-card border rounded-2xl p-5 shadow-medical hover:shadow-elevated transition-all flex flex-col justify-between h-64 animate-fade-in">
                <div>
                  <h3 className="font-extrabold text-sm text-foreground flex items-start gap-1.5">
                    <Store className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
                    <span>{store.name}</span>
                  </h3>
                  
                  <p className="text-xs text-muted-foreground leading-relaxed mt-2 flex items-start gap-1">
                    <MapPinIcon className="w-3.5 h-3.5 shrink-0 text-primary mt-0.5" />
                    <span>{store.address}</span>
                  </p>

                  <div className="flex gap-2 flex-wrap mt-3">
                    {store.open_24_hours && (
                      <span className="bg-success/10 text-success border border-success/20 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3 text-success" />
                        24/7 Open
                      </span>
                    )}
                    {store.delivery_available && (
                      <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Truck className="w-3 h-3 text-primary" />
                        Home Delivery
                      </span>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4 mt-4 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground font-semibold">
                    <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{store.phone}</span>
                  </div>

                  <div className="flex gap-2 pt-1 w-full">
                    <a
                      href={`tel:${store.phone}`}
                      className="flex-1 py-1.5 border border-primary/20 text-primary hover:bg-secondary/40 font-semibold rounded-lg flex items-center justify-center gap-1 text-[11px]"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                    
                    <button
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`, '_blank')}
                      className="flex-1 py-1.5 bg-gradient-medical text-white font-semibold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1 text-[11px] shadow-medical"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Directions</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Register Pharmacy Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-card text-foreground rounded-2xl w-full max-w-md border border-border shadow-elevated p-6 relative">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Register Your Pharmacy</h3>
                  <p className="text-xs text-muted-foreground">List retail pharmacy records in index map coordinates.</p>
                </div>
              </div>

              {success ? (
                <div className="text-center py-8 animate-fade-in">
                  <div className="bg-success/15 text-success w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 border border-success/20 animate-pulse">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-success">Pharmacy Registered! Reloading stores...</p>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground block">Pharmacy Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Life Care Chemist"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-card text-foreground text-xs"
                      required
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground block">Complete Address *</label>
                    <input
                      type="text"
                      placeholder="e.g. Sector 1, Malviya Nagar, Jaipur"
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-card text-foreground text-xs"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground block">Contact Phone *</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 141..."
                      value={storePhone}
                      onChange={(e) => setStorePhone(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-card text-foreground text-xs"
                      required
                    />
                  </div>

                  {/* Checkbox features */}
                  <div className="flex gap-6 py-2">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={open24}
                        onChange={(e) => setOpen24(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                      />
                      <span>Open 24/7</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={delivery}
                        onChange={(e) => setDelivery(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                      />
                      <span>Home Delivery</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-medical text-white font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all text-xs shadow-medical mt-2"
                  >
                    Submit Pharmacy Registration
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const MapPinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

export default MedicalStores;
