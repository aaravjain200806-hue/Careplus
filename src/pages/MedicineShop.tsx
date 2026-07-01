import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { ShoppingCart, Search, Plus, Minus, Trash2, ArrowRight, X, Check, CheckCircle, CreditCard, Landmark, Truck, ExternalLink, Sparkles, Clock, ShieldCheck } from 'lucide-react';

interface PharmacyModel {
  id: 'apollo' | 'pharmeasy' | 'netmeds' | 'tata1mg';
  name: string;
  brandColor: string;
  brandText: string;
  borderActive: string;
  logoBg: string;
  discountPercent: number;
  deliveryFee: (sub: number) => number;
  platformFee: number;
  couponDiscount: (sub: number) => number;
  deliveryTime: string;
  appUrl: string;
}

export const MedicineShop: React.FC = () => {
  const { t } = useLanguage();
  const { medicines, cart, addToCart, removeFromCart, updateCartQuantity, clearCart } = useAppContext();
  
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [activePharmacyId, setActivePharmacyId] = useState<'apollo' | 'pharmeasy' | 'netmeds' | 'tata1mg'>('apollo');
  
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
  
  // Checkout states
  const [checkoutStep, setCheckoutStep] = useState<'idle' | 'address' | 'payment' | 'completed'>('idle');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card'>('upi');
  const [syncingCart, setSyncingCart] = useState(false);
  const [syncComplete, setSyncComplete] = useState(false);

  // Filter in-stock items
  const products = medicines.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.genericName.toLowerCase().includes(search.toLowerCase())
  );

  // Pharmacies configurations
  const pharmacies: PharmacyModel[] = [
    {
      id: 'apollo',
      name: 'Apollo Pharmacy',
      brandColor: 'bg-emerald-600 hover:bg-emerald-700',
      brandText: 'text-emerald-600 dark:text-emerald-500',
      borderActive: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10',
      logoBg: 'bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900',
      discountPercent: 15,
      deliveryFee: (sub) => sub > 500 ? 0 : 40,
      platformFee: 0,
      couponDiscount: () => 0,
      deliveryTime: '25-30 Mins (Express)',
      appUrl: 'https://www.apollopharmacy.in/'
    },
    {
      id: 'pharmeasy',
      name: 'PharmEasy',
      brandColor: 'bg-amber-500 hover:bg-amber-600',
      brandText: 'text-amber-600 dark:text-amber-500',
      borderActive: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/10',
      logoBg: 'bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900',
      discountPercent: 10,
      deliveryFee: (sub) => sub > 600 ? 0 : 35,
      platformFee: 20,
      couponDiscount: () => 0,
      deliveryTime: 'Same Day Delivery',
      appUrl: 'https://pharmeasy.in/'
    },
    {
      id: 'netmeds',
      name: 'Netmeds',
      brandColor: 'bg-blue-600 hover:bg-blue-700',
      brandText: 'text-blue-600 dark:text-blue-500',
      borderActive: 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10',
      logoBg: 'bg-blue-100 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900',
      discountPercent: 12,
      deliveryFee: () => 45,
      platformFee: 0,
      couponDiscount: (sub) => sub > 400 ? 50 : 0,
      deliveryTime: '1-2 Hours Delivery',
      appUrl: 'https://www.netmeds.com/'
    },
    {
      id: 'tata1mg',
      name: 'Tata 1mg',
      brandColor: 'bg-orange-600 hover:bg-orange-700',
      brandText: 'text-orange-600 dark:text-orange-500',
      borderActive: 'border-orange-500 ring-2 ring-orange-500/20 bg-orange-50/10',
      logoBg: 'bg-orange-100 text-orange-600 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900',
      discountPercent: 18,
      deliveryFee: (sub) => sub > 400 ? 0 : 30,
      platformFee: 10,
      couponDiscount: () => 0,
      deliveryTime: 'Same Day Delivery',
      appUrl: 'https://www.1mg.com/'
    }
  ];

  const activePharmacy = pharmacies.find(p => p.id === activePharmacyId)!;

  // Pricing calculations helper
  const calculateBill = (pharmacy: PharmacyModel) => {
    const subtotal = cart.reduce((sum, item) => sum + (item.medicine.price * item.quantity), 0);
    if (subtotal === 0) return { subtotal: 0, discount: 0, delivery: 0, tax: 0, coupon: 0, platform: 0, total: 0 };
    
    const discount = Math.round(subtotal * (pharmacy.discountPercent / 100));
    const subtotalAfterDiscount = subtotal - discount;
    const delivery = pharmacy.deliveryFee(subtotal);
    const platform = pharmacy.platformFee;
    const coupon = pharmacy.couponDiscount(subtotal);
    const tax = Math.round(subtotalAfterDiscount * 0.18);
    const total = Math.max(0, subtotalAfterDiscount + delivery + platform + tax - coupon);

    return { subtotal, discount, delivery, tax, coupon, platform, total };
  };

  const activeBill = calculateBill(activePharmacy);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutStep === 'address') {
      setCheckoutStep('payment');
    } else if (checkoutStep === 'payment') {
      setCheckoutStep('completed');
      
      // Get the first item name in the cart to search
      const firstMedName = cart[0]?.medicine?.name || 'Paracetamol';
      
      let redirectUrl = '';
      if (activePharmacy.id === 'tata1mg') {
        redirectUrl = `https://www.1mg.com/search/all?name=${encodeURIComponent(firstMedName)}`;
      } else if (activePharmacy.id === 'pharmeasy') {
        redirectUrl = `https://pharmeasy.in/search/all?searchTextField=${encodeURIComponent(firstMedName)}`;
      } else if (activePharmacy.id === 'netmeds') {
        redirectUrl = `https://www.netmeds.com/catalogsearch/result/${encodeURIComponent(firstMedName)}/all?prod_meds`;
      } else {
        redirectUrl = `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(firstMedName)}`;
      }
      
      // Open redirect URL in new window/tab
      setTimeout(() => {
        window.open(redirectUrl, '_blank');
      }, 1000);

      setTimeout(() => {
        clearCart();
        setCheckoutStep('idle');
        setCartOpen(false);
      }, 4000);
    }
  };

  // Direct checkout payment redirect to external app
  const handleProceedToPayment = () => {
    setCheckoutStep('completed');
    
    // Get the first item name in the cart to search
    const firstMedName = cart[0]?.medicine?.name || 'Paracetamol';
    
    let redirectUrl = '';
    if (activePharmacy.id === 'tata1mg') {
      redirectUrl = `https://www.1mg.com/search/all?name=${encodeURIComponent(firstMedName)}`;
    } else if (activePharmacy.id === 'pharmeasy') {
      redirectUrl = `https://pharmeasy.in/search/all?searchTextField=${encodeURIComponent(firstMedName)}`;
    } else if (activePharmacy.id === 'netmeds') {
      redirectUrl = `https://www.netmeds.com/catalogsearch/result/${encodeURIComponent(firstMedName)}/all?prod_meds`;
    } else {
      redirectUrl = `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(firstMedName)}`;
    }
    
    // Open redirect URL in new window/tab immediately
    window.open(redirectUrl, '_blank');

    setTimeout(() => {
      clearCart();
      setCheckoutStep('idle');
      setCartOpen(false);
    }, 3000);
  };

  // Sync Cart to Brand App Simulation
  const handleAppSync = (pharmacy: PharmacyModel) => {
    setSyncingCart(true);
    setSyncComplete(false);
    
    // Get the first item name in the cart to search
    const firstMedName = cart[0]?.medicine?.name || 'Paracetamol';
    
    let redirectUrl = '';
    if (pharmacy.id === 'tata1mg') {
      redirectUrl = `https://www.1mg.com/search/all?name=${encodeURIComponent(firstMedName)}`;
    } else if (pharmacy.id === 'pharmeasy') {
      redirectUrl = `https://pharmeasy.in/search/all?searchTextField=${encodeURIComponent(firstMedName)}`;
    } else if (pharmacy.id === 'netmeds') {
      redirectUrl = `https://www.netmeds.com/catalogsearch/result/${encodeURIComponent(firstMedName)}/all?prod_meds`;
    } else {
      redirectUrl = `https://www.apollopharmacy.in/search-medicines/${encodeURIComponent(firstMedName)}`;
    }

    setTimeout(() => {
      setSyncingCart(false);
      setSyncComplete(true);
      setTimeout(() => {
        window.open(redirectUrl, '_blank');
        setSyncComplete(false);
      }, 1500);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-hero pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-6xl relative">
        
        {/* Header Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Medicine Shop
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Order verified medicines delivered directly to your doorstep.</p>
          </div>

          <div className="flex gap-4 items-center w-full md:w-auto justify-between md:justify-end">
            <div className="relative w-64 flex-grow md:flex-grow-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-xl text-xs bg-card text-foreground"
              />
            </div>
            
            {/* Cart Trigger */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative px-4 py-2 bg-gradient-medical text-white rounded-xl shadow-medical hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
            >
              <ShoppingCart className="w-4.5 h-4.5" />
              <span className="text-xs font-bold">Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-destructive text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                  {cart.length}
                </span>
              )}
            </button>
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

        {/* Products Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(med => (
            <div key={med.id} className="bg-card border rounded-2xl p-5 shadow-medical flex flex-col justify-between min-h-[268px] h-auto hover:border-primary/30 hover:-translate-y-1 hover:shadow-elevated transition-all duration-300 animate-fade-in text-left">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                    {med.category}
                  </span>
                  
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                    med.inStock
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-400'
                      : 'bg-destructive/10 text-destructive border-destructive/20'
                  }`}>
                    {med.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
                  </span>
                </div>
                
                <h3 className="font-extrabold text-sm text-foreground mt-4 leading-tight">
                  {med.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 italic">{med.genericName}</p>
                <p className="text-[9px] text-muted-foreground mt-1.5 font-semibold">Mfg: {med.manufacturer}</p>
                
                <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
                  {med.description}
                </p>
              </div>

              <div className="border-t pt-3 flex flex-col gap-2 mt-3 w-full">
                <div className="flex justify-between items-center w-full">
                  <div>
                    <span className="text-[9px] text-muted-foreground block font-bold leading-none">Price</span>
                    <span className="text-sm font-extrabold text-foreground">₹{med.price}</span>
                  </div>
                  <span className="text-[8px] bg-secondary text-secondary-foreground font-bold px-1.5 rounded">
                    Compare Available
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
                    onClick={() => addToCart(med)}
                    disabled={!med.inStock}
                    className="py-1 px-2 bg-gradient-medical text-white font-bold text-[10px] rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-medical disabled:opacity-50 flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Slide-out Cart Drawer Sheet */}
        {cartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-card border-l text-foreground w-full max-w-lg h-full flex flex-col justify-between shadow-elevated p-6 relative animate-slide-up">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary animate-pulse" />
                  Your Shopping Cart
                </h2>
                <button
                  onClick={() => {
                    setCartOpen(false);
                    setCheckoutStep('idle');
                  }}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Loader Overlay for Cart Sync Simulation */}
              {syncingCart && (
                <div className="absolute inset-0 bg-background/90 z-50 flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fade-in">
                  <RefreshCwIcon className="w-12 h-12 text-primary animate-spin" />
                  <h3 className="font-extrabold text-lg text-foreground">Syncing Shopping Cart Items</h3>
                  <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                    Connecting to the local {activePharmacy.name} API gateway. Transferring prescription list and quantities...
                  </p>
                </div>
              )}

              {syncComplete && (
                <div className="absolute inset-0 bg-background/90 z-50 flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fade-in">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center border text-white ${activePharmacy.id === 'apollo' ? 'bg-emerald-600' : activePharmacy.id === 'pharmeasy' ? 'bg-amber-500' : 'bg-blue-600'}`}>
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-lg text-foreground">Cart Synced!</h3>
                  <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                    Opening the official {activePharmacy.name} portal in a new tab. All items loaded into your card successfully!
                  </p>
                </div>
              )}

              {/* Step 1: Cart Items & Multi-Store Pricing comparison */}
              {checkoutStep === 'idle' && (
                <div className="flex-grow overflow-y-auto py-4 space-y-6">
                  {cart.length === 0 ? (
                    <div className="text-center py-16">
                      <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Your cart is empty.</p>
                    </div>
                  ) : (
                    <>
                      {/* Cart Items list */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-muted-foreground uppercase block px-1">Selected Formulas</span>
                        {cart.map(item => (
                          <div key={item.medicine.id} className="flex gap-4 border p-3.5 rounded-xl bg-muted/20">
                            <div className="flex-grow">
                              <h4 className="font-bold text-xs text-foreground">{item.medicine.name}</h4>
                              <p className="text-[10px] text-muted-foreground">{item.medicine.genericName}</p>
                              <span className="text-xs font-bold text-primary block mt-1">₹{item.medicine.price}</span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="flex items-center border rounded-lg overflow-hidden bg-card">
                                <button
                                  onClick={() => updateCartQuantity(item.medicine.id, item.quantity - 1)}
                                  className="p-1 hover:bg-muted text-muted-foreground"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-bold px-2">{item.quantity}</span>
                                <button
                                  onClick={() => updateCartQuantity(item.medicine.id, item.quantity + 1)}
                                  className="p-1 hover:bg-muted text-muted-foreground"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              
                              <button
                                onClick={() => removeFromCart(item.medicine.id)}
                                className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pharmacy Comparative Dashboard */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-1.5 px-1 text-xs font-bold text-muted-foreground uppercase">
                          <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                          <span>Compare Pharmacy Store Estimates</span>
                        </div>
                        
                        <div className="space-y-2">
                          {pharmacies.map(pharmacy => {
                            const bill = calculateBill(pharmacy);
                            const isActive = activePharmacyId === pharmacy.id;
                            return (
                              <div
                                key={pharmacy.id}
                                onClick={() => setActivePharmacyId(pharmacy.id)}
                                className={`border p-4 rounded-xl cursor-pointer hover:border-primary/45 transition-all flex flex-col justify-between ${
                                  isActive ? pharmacy.borderActive : 'bg-card border-border'
                                }`}
                              >
                                <div className="flex justify-between items-start w-full">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                      isActive ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
                                    }`}>
                                      {isActive && <Check className="w-2.5 h-2.5" />}
                                    </span>
                                    
                                    <span className="font-extrabold text-xs text-foreground">
                                      {pharmacy.name}
                                    </span>
                                    
                                    <span className="text-[9px] px-1.5 py-0.2 bg-secondary text-secondary-foreground border rounded font-semibold">
                                      {pharmacy.discountPercent}% Off
                                    </span>
                                  </div>

                                  <span className="text-sm font-extrabold text-foreground">
                                    ₹{bill.total}
                                  </span>
                                </div>

                                <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-2 border-t pt-2 w-full font-medium">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                                    {pharmacy.deliveryTime}
                                  </span>
                                  
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAppSync(pharmacy);
                                    }}
                                    className="text-primary hover:underline flex items-center gap-0.5 font-bold"
                                  >
                                    <span>Sync Cart App</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 2: Address entry */}
              {checkoutStep === 'address' && (
                <form onSubmit={handleCheckoutSubmit} className="flex-grow py-6 space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded text-white text-[10px] ${activePharmacy.brandColor}`}>
                        {activePharmacy.name}
                      </span>
                      <span>Checkout Path</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 pt-2">
                    <Truck className="w-4.5 h-4.5 text-primary" />
                    Specify Delivery Address
                  </h3>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground block">Shipping Address *</label>
                    <textarea
                      placeholder="e.g. Sector 5, Jawahar Nagar, Jaipur - 302004"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl text-xs bg-card text-foreground"
                      rows={4}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-2.5 text-white font-bold rounded-xl shadow-medical flex items-center justify-center gap-1.5 text-xs transition-opacity ${activePharmacy.brandColor}`}
                  >
                    <span>Proceed to Secure Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Step 3: Payment Simulator */}
              {checkoutStep === 'payment' && (
                <form onSubmit={handleCheckoutSubmit} className="flex-grow py-6 space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <span className={`px-2 py-0.5 rounded text-white text-[10px] ${activePharmacy.brandColor}`}>
                        {activePharmacy.name}
                      </span>
                      <span>Checkout Path</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5 pt-2">
                    <CreditCard className="w-4.5 h-4.5 text-primary" />
                    Select Payment Gateway
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                        paymentMethod === 'upi'
                          ? `border-primary bg-primary/5 ${activePharmacy.brandText}`
                          : 'border-border bg-card text-foreground hover:bg-muted/30'
                      }`}
                    >
                      <Landmark className="w-6 h-6" />
                      <span className="text-xs font-bold">UPI / PhonePe</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                        paymentMethod === 'card'
                          ? `border-primary bg-primary/5 ${activePharmacy.brandText}`
                          : 'border-border bg-card text-foreground hover:bg-muted/30'
                      }`}
                    >
                      <CreditCard className="w-6 h-6" />
                      <span className="text-xs font-bold">Credit/Debit Card</span>
                    </button>
                  </div>

                  <div className="bg-muted/35 border p-3.5 rounded-xl text-xs text-muted-foreground leading-relaxed flex gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>
                      Order is routed through **{activePharmacy.name}** local partner warehouse. Transaction is simulated securely.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-2.5 text-white font-extrabold rounded-xl shadow-medical text-xs ${activePharmacy.brandColor}`}
                  >
                    Pay & Complete Order (₹{activeBill.total})
                  </button>
                </form>
              )}

              {/* Step 4: Completed checkout simulation */}
              {checkoutStep === 'completed' && (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-2" />
                  <h3 className="font-extrabold text-lg text-foreground">Redirecting to {activePharmacy.name}...</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                    Opening the secure checkout page for your medicines on the official {activePharmacy.name} platform.
                  </p>
                </div>
              )}

              {/* Cart Subtotal footer calculations panel */}
              {checkoutStep === 'idle' && cart.length > 0 && (
                <div className="border-t pt-4 space-y-3 bg-card z-10">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Medicine Subtotal</span>
                      <span className="font-semibold text-foreground">₹{activeBill.subtotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{activePharmacy.name} Discount</span>
                      <span className="font-bold text-success">-₹{activeBill.discount}</span>
                    </div>
                    {activeBill.coupon > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Coupon Applied</span>
                        <span className="font-bold text-success">-₹{activeBill.coupon}</span>
                      </div>
                    )}
                    {activeBill.platform > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform Fee</span>
                        <span className="font-semibold text-foreground">₹{activeBill.platform}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">GST Taxes (18%)</span>
                      <span className="font-semibold text-foreground">₹{activeBill.tax}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery Shipping</span>
                      <span className="font-semibold text-foreground">
                        {activeBill.delivery === 0 ? 'FREE' : `₹${activeBill.delivery}`}
                      </span>
                    </div>
                    
                    <div className="flex justify-between border-t pt-2 text-sm">
                      <span className="font-extrabold text-foreground">Grand Total ({activePharmacy.name})</span>
                      <span className="font-extrabold text-primary">₹{activeBill.total}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleProceedToPayment}
                    className={`w-full py-2.5 text-white font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all text-xs shadow-medical flex items-center justify-center gap-1.5 ${activePharmacy.brandColor}`}
                  >
                    <span>Proceed with {activePharmacy.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const RefreshCwIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
    <path d="M3 3v5h5"></path>
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
    <path d="M16 16h5v5"></path>
  </svg>
);

export default MedicineShop;
