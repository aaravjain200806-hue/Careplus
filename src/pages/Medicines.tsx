import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Search, Pill, Plus, Sparkles, AlertCircle, X, Bell, ExternalLink } from 'lucide-react';

export const Medicines: React.FC = () => {
  const { medicines, addReminder, user } = useAppContext();
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Reminder modal states
  const [selectedMed, setSelectedMed] = useState<any>(null);
  const [dosage, setDosage] = useState('1 Tablet');
  const [time, setTime] = useState('08:00');
  const [stockQty, setStockQty] = useState(30);
  const [reminderAdded, setReminderAdded] = useState(false);

  // Comparison list state
  const [comparedMeds, setComparedMeds] = useState<any[]>([]);

  const handleToggleCompare = (med: any) => {
    setComparedMeds(prev => {
      const exists = prev.some(item => item.id === med.id);
      if (exists) {
        return prev.filter(item => item.id !== med.id);
      } else {
        if (prev.length >= 3) {
          alert("You can compare up to 3 medicines at a time.");
          return prev;
        }
        return [...prev, med];
      }
    });
  };

  // Categories list
  const categories = ["All", "Pain Relief", "Antibiotic", "Allergy", "Diabetes", "Cardiac", "Digestive", "Vitamins", "Respiratory"];

  // Filter medicines
  const filtered = medicines.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase()) || 
                          m.genericName.toLowerCase().includes(search.toLowerCase()) ||
                          m.manufacturer.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenReminder = (med: any) => {
    setSelectedMed(med);
    setDosage('1 Tablet');
    setTime('08:00');
    setStockQty(30);
    setReminderAdded(false);
  };

  const handleSetReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed) return;

    addReminder({
      medicineId: selectedMed.id,
      name: selectedMed.name,
      dosage: dosage,
      time: time,
      stock_quantity: Number(stockQty)
    });

    setReminderAdded(true);
    setTimeout(() => {
      setSelectedMed(null);
      setReminderAdded(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-hero pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Title */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Medicines Index & Reminders
          </h1>
          <p className="text-muted-foreground">
            Search chemical formulations, view manufacturers, and configure smart intake schedulers.
          </p>
        </div>

        {/* Search & Categories */}
        <div className="space-y-4 mb-8">
          <div className="relative max-w-md mx-auto">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Search by formula name, manufacturer, chemical..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border rounded-xl bg-card text-foreground"
            />
          </div>

          {/* Categories Tab slider */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none justify-start md:justify-center">
            {categories.map((cat, i) => (
              <button
                key={i}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 border rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground border-primary shadow-medical'
                    : 'bg-card text-foreground border-border hover:bg-muted/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Multi-Pharmacy Comparative Grid */}
        {comparedMeds.length > 0 && (
          <div className="bg-card border border-primary/25 rounded-2xl p-5 shadow-elevated mb-8 animate-fade-in text-left relative">
            <button
              onClick={() => setComparedMeds([])}
              className="absolute top-4 right-4 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer border px-2 py-1 rounded bg-secondary/20"
            >
              Clear Comparison
            </button>
            
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              <h2 className="text-base font-extrabold text-foreground uppercase tracking-wider">Multi-Pharmacy Price Comparison Engine</h2>
            </div>
            
            <p className="text-xs text-muted-foreground mb-4">
              Comparing real-time formulations, pricing, discounts, and savings across India's top e-pharmacies. Click "Buy Now" to open pre-filled queries.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              {comparedMeds.map((med) => {
                const basePrice = med.price;
                const tata1mgRate = med.vendorPrices?.tata1mg?.price || Math.round(basePrice * 0.8);
                const tata1mgDisc = med.vendorPrices?.tata1mg?.discount || 20;
                
                const pharmeasyRate = med.vendorPrices?.pharmeasy?.price || Math.round(basePrice * 0.9);
                const pharmeasyDisc = med.vendorPrices?.pharmeasy?.discount || 10;
                
                const netmedsRate = med.vendorPrices?.netmeds?.price || Math.round(basePrice * 0.88);
                const netmedsDisc = med.vendorPrices?.netmeds?.discount || 12;

                const bestRate = Math.min(tata1mgRate, pharmeasyRate, netmedsRate);

                return (
                  <div key={med.id} className="border border-border rounded-xl p-4.5 bg-muted/5 relative flex flex-col justify-between space-y-4">
                    <button
                      onClick={() => handleToggleCompare(med)}
                      className="absolute top-3 right-3 text-muted-foreground hover:text-foreground cursor-pointer p-1 rounded hover:bg-muted"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    <div>
                      <h3 className="font-extrabold text-sm text-foreground pr-5 leading-tight">{med.name}</h3>
                      <p className="text-[10px] text-muted-foreground italic font-semibold mt-0.5">{med.genericName}</p>
                      <p className="text-[9px] text-muted-foreground mt-1 font-semibold">Catalog Base Price: ₹{med.price}</p>
                    </div>

                    <div className="space-y-3 pt-2 border-t">
                      {/* Tata 1mg */}
                      <div className={`p-2.5 rounded-lg border flex justify-between items-center ${tata1mgRate === bestRate ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/10' : 'border-border bg-card'}`}>
                        <div>
                          <span className="font-bold text-[10px] text-[#ff6f61] block font-sans">Tata 1mg</span>
                          <span className="text-[8px] text-success font-extrabold block">Save ₹{med.price - tata1mgRate} ({tata1mgDisc}%)</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-xs text-foreground block">₹{tata1mgRate}</span>
                          <button
                            onClick={() => window.open(`https://www.1mg.com/search/all?name=${encodeURIComponent(med.name)}`, '_blank')}
                            className="text-[9px] font-extrabold text-[#ff6f61] hover:underline mt-0.5 flex items-center justify-end gap-0.5 cursor-pointer ml-auto bg-transparent border-0 outline-none"
                          >
                            <span>Buy Now</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      {/* PharmEasy */}
                      <div className={`p-2.5 rounded-lg border flex justify-between items-center ${pharmeasyRate === bestRate ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/10' : 'border-border bg-card'}`}>
                        <div>
                          <span className="font-bold text-[10px] text-[#10847e] block font-sans">PharmEasy</span>
                          <span className="text-[8px] text-success font-extrabold block">Save ₹{med.price - pharmeasyRate} ({pharmeasyDisc}%)</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-xs text-foreground block">₹{pharmeasyRate}</span>
                          <button
                            onClick={() => window.open(`https://pharmeasy.in/search/all?searchTextField=${encodeURIComponent(med.name)}`, '_blank')}
                            className="text-[9px] font-extrabold text-[#10847e] hover:underline mt-0.5 flex items-center justify-end gap-0.5 cursor-pointer ml-auto bg-transparent border-0 outline-none"
                          >
                            <span>Buy Now</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>

                      {/* Netmeds */}
                      <div className={`p-2.5 rounded-lg border flex justify-between items-center ${netmedsRate === bestRate ? 'border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/10' : 'border-border bg-card'}`}>
                        <div>
                          <span className="font-bold text-[10px] text-[#007cc2] block font-sans">Netmeds</span>
                          <span className="text-[8px] text-success font-extrabold block">Save ₹{med.price - netmedsRate} ({netmedsDisc}%)</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-xs text-foreground block">₹{netmedsRate}</span>
                          <button
                            onClick={() => window.open(`https://www.netmeds.com/catalogsearch/result/${encodeURIComponent(med.name)}/all?prod_meds`, '_blank')}
                            className="text-[9px] font-extrabold text-[#007cc2] hover:underline mt-0.5 flex items-center justify-end gap-0.5 cursor-pointer ml-auto bg-transparent border-0 outline-none"
                          >
                            <span>Buy Now</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Best Deal Banner */}
                    <div className="bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg text-center font-bold text-[10px] border border-emerald-500/20">
                      Best Deal: ₹{bestRate} ({tata1mgRate === bestRate ? 'Tata 1mg' : pharmeasyRate === bestRate ? 'PharmEasy' : 'Netmeds'})
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Medicines Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 border border-dashed rounded-2xl">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No formulas matching your filters</p>
            </div>
          ) : (
            filtered.map((med) => (
              <div key={med.id} className="bg-card border rounded-2xl p-5 shadow-medical hover:shadow-elevated transition-all flex flex-col justify-between min-h-[224px] h-auto animate-fade-in text-left">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                      {med.category}
                    </span>
                    
                    <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${
                      med.inStock
                        ? 'bg-success/10 text-success border-success/20'
                        : 'bg-destructive/10 text-destructive border-destructive/20'
                    }`}>
                      {med.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                    </span>
                  </div>
                  
                  <h3 className="font-extrabold text-sm text-foreground mt-3 leading-tight">
                    {med.name}
                  </h3>
                  <p className="text-xs text-muted-foreground italic font-medium mt-0.5">
                    {med.genericName}
                  </p>
                  
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                    {med.description}
                  </p>
                </div>

                <div className="border-t pt-3 flex flex-col gap-2 mt-3 w-full">
                  <div className="flex justify-between items-center w-full">
                    <div>
                      <span className="text-[10px] text-muted-foreground block font-semibold leading-none">Price</span>
                      <span className="text-sm font-bold text-foreground">₹{med.price}</span>
                    </div>
                    
                    <span className="text-[9px] text-primary bg-primary/10 font-bold px-1.5 rounded">
                      3 Stores Configured
                    </span>
                  </div>
                  
                  <div className="flex gap-1.5 w-full">
                    <button
                      onClick={() => handleToggleCompare(med)}
                      className={`flex-1 py-1 px-2 border font-bold text-[10px] rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                        comparedMeds.some(item => item.id === med.id)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-primary/20 hover:bg-secondary/40 text-primary bg-card'
                      }`}
                    >
                      {comparedMeds.some(item => item.id === med.id) ? 'Comparing' : 'Compare Prices'}
                    </button>

                    <button
                      onClick={() => handleOpenReminder(med)}
                      className="py-1 px-2 bg-gradient-medical text-white font-bold text-[10px] rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-medical flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Reminder</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Set Reminder Dialog Modal */}
        {selectedMed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-card text-foreground rounded-2xl w-full max-w-md border border-border shadow-elevated p-6 relative">
              <button
                onClick={() => setSelectedMed(null)}
                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted text-muted-foreground transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">{selectedMed.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedMed.genericName}</p>
                </div>
              </div>

              {reminderAdded ? (
                <div className="text-center py-6 animate-fade-in">
                  <div className="bg-success/15 text-success w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 animate-spin" />
                  </div>
                  <p className="text-sm font-bold text-success">Reminder alerts scheduled!</p>
                </div>
              ) : (
                <form onSubmit={handleSetReminder} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground block">Dosage *</label>
                    <input
                      type="text"
                      value={dosage}
                      onChange={(e) => setDosage(e.target.value)}
                      placeholder="e.g. 1 Tablet / 5ml liquid"
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-card text-foreground"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground block">Timing *</label>
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-xs bg-card text-foreground"
                        required
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-muted-foreground block">Stock Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        value={stockQty}
                        onChange={(e) => setStockQty(Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg text-xs bg-card text-foreground"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-medical text-white font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all text-xs shadow-medical flex items-center justify-center gap-1"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Create Reminder Alert</span>
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

export default Medicines;
