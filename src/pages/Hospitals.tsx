import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, Hospital as HospitalIcon, Phone, MapPin, Navigation, Plus, Sparkles, X, HeartPulse, ShieldAlert, Star, Compass } from 'lucide-react';

export const Hospitals: React.FC = () => {
  const { t } = useLanguage();
  const { hospitals, registerHospital } = useAppContext();
  
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [list, setList] = useState<any[]>([]);
  const [hoveredHospitalId, setHoveredHospitalId] = useState<number | null>(null);
  const [expandedHospId, setExpandedHospId] = useState<number | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(5000); // in km, default 5000 (Pan-India)
  const [hoveredClusterIndex, setHoveredClusterIndex] = useState<number | null>(null);

  // Register clinic modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [regName, setRegName] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRegNum, setRegRegNum] = useState('');
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [regSpecialties, setRegSpecialties] = useState<string[]>([]);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Simulated Geospatial HFR & Places Search States
  const [isSearchingBackend, setIsSearchingBackend] = useState(false);
  const [backendQueryInfo, setBackendQueryInfo] = useState<string | null>(null);

  // Specialties filters list - CGHS and Health Facility Registry recognized
  const specialtiesFilters = [
    "All",
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
  const matchSpecialty = (hospitalSpecialties: string[], selected: string): boolean => {
    if (selected === 'All') return true;
    
    const selLower = selected.toLowerCase();
    
    // Custom mappings for CGHS / HFR official medical specialties to raw dataset keys
    const mappings: Record<string, string[]> = {
      "general medicine": ["general medicine", "internal medicine"],
      "family medicine": ["general medicine", "family medicine", "internal medicine"],
      "emergency medicine": ["emergency", "emergency medicine", "trauma"],
      "cardiology": ["cardiology", "cardiologist"],
      "neurology": ["neurology", "neurologist"],
      "neurosurgery": ["neurosurgery", "neurology", "general surgery"],
      "pediatrics": ["pediatrics", "pediatrician", "neonatology"],
      "obstetrics & gynecology": ["gynecology", "obstetrics", "obgyn"],
      "orthopedic surgery": ["orthopedics", "orthopedic", "general surgery"],
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
    
    return hospitalSpecialties.some(s => {
      const sLower = s.toLowerCase();
      return targetSpecs.some(target => sLower.includes(target) || target.includes(sLower));
    });
  };

  // Request user geolocation
  const handleGPSLookup = () => {
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLoadingLocation(false);
        },
        (err) => {
          console.error("GPS access blocked:", err);
          setUserCoords({ lat: 21.1458, lng: 79.0882 }); // default center of India (Nagpur)
          setLoadingLocation(false);
        }
      );
    } else {
      setUserCoords({ lat: 21.1458, lng: 79.0882 });
      setLoadingLocation(false);
    }
  };

  useEffect(() => {
    handleGPSLookup();
  }, []);

  // Haversine distance calculator
  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return 6371 * c; 
  };

  // Map Geolocation coordinates boundaries to 0-100% SVG coordinates dynamically
  // based on the currently filtered list of hospitals across India
  const mapCoordinates = (lat: number, lng: number) => {
    let minLat = 8.0; // India bounds fallback
    let maxLat = 37.0;
    let minLng = 68.0;
    let maxLng = 97.0;

    if (list && list.length > 0) {
      const lats = list.map(h => h.lat).filter(l => typeof l === 'number' && !isNaN(l));
      const lngs = list.map(h => h.lng).filter(l => typeof l === 'number' && !isNaN(l));
      if (lats.length > 0 && lngs.length > 0) {
        const minL = Math.min(...lats);
        const maxL = Math.max(...lats);
        const minG = Math.min(...lngs);
        const maxG = Math.max(...lngs);
        
        // Add padding (at least 0.05 deg to avoid division by zero)
        const latPad = (maxL - minL) * 0.15 || 0.05;
        const lngPad = (maxG - minG) * 0.15 || 0.05;
        
        minLat = minL - latPad;
        maxLat = maxL + latPad;
        minLng = minG - lngPad;
        maxLng = maxG + lngPad;
      }
    }

    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;

    const x = lngRange === 0 ? 50 : ((lng - minLng) / lngRange) * 100;
    const y = latRange === 0 ? 50 : 100 - ((lat - minLat) / latRange) * 100;

    return { 
      x: Math.max(8, Math.min(92, x)), 
      y: Math.max(8, Math.min(92, y)) 
    };
  };

  // Process and filter list with Google Places & HFR geospatial routing engine simulation
  useEffect(() => {
    setIsSearchingBackend(true);
    
    // Construct dynamic API query parameters matching our geospatial search interface
    const queryParams = `lat=${userCoords?.lat?.toFixed(5) || '21.14580'}&lng=${userCoords?.lng?.toFixed(5) || '79.08820'}&radius=${searchRadius === 5000 ? '5000' : searchRadius}&keyword=${encodeURIComponent(selectedSpecialty)}`;
    setBackendQueryInfo(queryParams);

    // Simulate geospatial lookup latency from Google Places API / HFR Registry backend
    const timeoutId = setTimeout(() => {
      let processed = hospitals.map(hospital => {
        let distanceText = hospital.distance || '2.0 km';
        if (userCoords) {
          const d = getDistance(userCoords.lat, userCoords.lng, hospital.lat, hospital.lng);
          distanceText = `${d.toFixed(1)} km`;
        }
        return { ...hospital, computedDistance: distanceText };
      });

      // Viewport Radius filter
      if (userCoords && searchRadius < 5000) {
        processed = processed.filter(h => {
          const d = getDistance(userCoords.lat, userCoords.lng, h.lat, h.lng);
          return d <= searchRadius;
        });
      }

      // Specialty filter (integrated with Google Places & HFR keyword categorization matcher)
      if (selectedSpecialty !== 'All') {
        processed = processed.filter(h => 
          h.specialties && matchSpecialty(h.specialties, selectedSpecialty)
        );
      }

      // Search query filter
      processed = processed.filter(h =>
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.address.toLowerCase().includes(search.toLowerCase())
      );

      // Sort by proximity
      processed.sort((a, b) => parseFloat(a.computedDistance) - parseFloat(b.computedDistance));

      setList(processed);
      setIsSearchingBackend(false);
    }, 250); // Fast 250ms premium transition delay

    return () => clearTimeout(timeoutId);
  }, [hospitals, search, selectedSpecialty, userCoords, searchRadius]);

  // Compute clusters dynamically on the 100x100 SVG coordinate grid
  const clusters = React.useMemo(() => {
    const computedClusters: { x: number; y: number; count: number; name: string; hospitals: any[] }[] = [];
    const clusterRadius = 6; // distance threshold in SVG coordinates

    list.forEach(h => {
      const pos = mapCoordinates(h.lat, h.lng);
      
      // Find a cluster close enough
      let found = computedClusters.find(c => {
        const dist = Math.sqrt(Math.pow(c.x - pos.x, 2) + Math.pow(c.y - pos.y, 2));
        return dist < clusterRadius;
      });

      if (found) {
        found.hospitals.push(h);
        found.count += 1;
        // Shift cluster center to average position
        found.x = (found.x * (found.count - 1) + pos.x) / found.count;
        found.y = (found.y * (found.count - 1) + pos.y) / found.count;
      } else {
        computedClusters.push({
          x: pos.x,
          y: pos.y,
          count: 1,
          name: h.name,
          hospitals: [h]
        });
      }
    });

    return computedClusters;
  }, [list]);

  // Modal handlers
  const handleAddSpecialty = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = specialtyInput.trim();
    if (clean && !regSpecialties.includes(clean)) {
      setRegSpecialties(prev => [...prev, clean]);
      setSpecialtyInput('');
    }
  };

  const handleRemoveSpecialty = (spec: string) => {
    setRegSpecialties(prev => prev.filter(s => s !== spec));
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regAddress || !regPhone || !regEmail) return;

    registerHospital({
      name: regName,
      address: regAddress,
      phone: regPhone,
      email: regEmail,
      registration_number: regRegNum || undefined,
      specialties: regSpecialties
    });

    setRegistrationSuccess(true);
    setTimeout(() => {
      setModalOpen(false);
      setRegistrationSuccess(false);
      setRegName('');
      setRegAddress('');
      setRegPhone('');
      setRegEmail('');
      setRegRegNum('');
      setRegSpecialties([]);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-hero pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-7xl">
        
        {/* Title */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-extrabold tracking-tight mb-3 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Care+ National Health Facility Directory
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            Compare nearest verified clinics and hospitals across India powered by the verified national Health Facility Registry.
          </p>
        </div>

        {/* 2-Column Map & Directory Layout */}
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Column 1: Left Specialties & Coordinates filters */}
          <div className="lg:col-span-3 space-y-6 animate-fade-in">
            {/* Search */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by clinic name or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-xl text-xs bg-card text-foreground"
              />
            </div>

            {/* GPS Trigger */}
            <div className="border p-4 rounded-2xl bg-card shadow-medical space-y-3">
              <h3 className="font-extrabold text-xs text-foreground flex items-center gap-1.5 uppercase border-b pb-2">
                <Compass className="w-4 h-4 text-primary animate-spin" />
                GPS Coordinates
              </h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Retrieve live coordinate maps dynamically sorting neighboring facilities.
              </p>
              
              {userCoords && (
                <div className="bg-muted/30 text-[10px] p-2.5 rounded-lg border font-mono text-muted-foreground text-center">
                  LAT: {userCoords.lat.toFixed(5)} | LNG: {userCoords.lng.toFixed(5)}
                </div>
              )}

              <button
                onClick={handleGPSLookup}
                disabled={loadingLocation}
                className="w-full py-2 bg-gradient-medical text-white font-semibold rounded-lg text-xs shadow-medical hover:opacity-90 transition-all"
              >
                {loadingLocation ? 'Acquiring GPS...' : 'Sync Device GPS Location'}
              </button>
            </div>

            {/* Viewport search radius filter */}
            <div className="border p-4 rounded-2xl bg-card shadow-medical space-y-3">
              <h3 className="font-extrabold text-xs text-foreground uppercase border-b pb-2 flex items-center justify-between">
                <span>Search Radius</span>
                <span className="text-primary font-mono text-[10px]">
                  {searchRadius === 5000 ? 'Pan-India' : `${searchRadius} km`}
                </span>
              </h3>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Filter healthcare facilities based on maximum distance from your device GPS location.
              </p>
              <input
                type="range"
                min="5"
                max="5000"
                step="5"
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[8px] text-muted-foreground font-bold">
                <span>5 km</span>
                <span>100 km</span>
                <span>500 km</span>
                <span>Pan-India</span>
              </div>
            </div>

            {/* Specialty Categories Filters */}
            <div className="border p-4 rounded-2xl bg-card shadow-medical space-y-3">
              <h3 className="font-extrabold text-xs text-foreground uppercase border-b pb-2">
                Specialty Domains
              </h3>
              <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1 text-xs scrollbar-thin">
                {specialtiesFilters.map((spec, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSpecialty(spec)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-all font-semibold ${
                      selectedSpecialty === spec
                        ? 'bg-primary text-primary-foreground font-extrabold shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/40'
                    }`}
                  >
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setModalOpen(true)}
              className="w-full py-2.5 border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Register Hospital/Clinic</span>
            </button>
          </div>

          {/* Column 2: Center Interactive Map Grid */}
          <div className="lg:col-span-5 space-y-4 animate-fade-in">
            {/* Live API Routing Debug Console Banner */}
            {backendQueryInfo && (
              <div className="bg-card border border-primary/20 px-3.5 py-2.5 rounded-2xl shadow-medical flex items-center justify-between text-[9px] font-mono animate-fade-in transition-all">
                <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${isSearchingBackend ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                  <span className="font-extrabold text-[8px] uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded shrink-0">
                    {isSearchingBackend ? 'PLACES REQ' : 'HFR ROUTER'}
                  </span>
                  <span className="truncate text-muted-foreground font-semibold">
                    api/v2/geospatial?{backendQueryInfo}
                  </span>
                </div>
                <span className="text-primary font-black shrink-0 ml-2">200 OK</span>
              </div>
            )}

            <div className="bg-card border rounded-3xl p-4 shadow-elevated relative overflow-hidden flex flex-col justify-between">
              
              {/* Map Title banner */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span>Interactive Health Facility Grid</span>
                  {isSearchingBackend && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />}
                </span>
                <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary font-bold px-2 py-0.5 rounded">
                  {list.length} Facilities Plotted
                </span>
              </div>

              {/* Responsive SVG Map */}
              <div className="relative bg-secondary/15 dark:bg-muted/20 border rounded-2xl h-80 overflow-hidden shadow-inner flex items-center justify-center">
                {isSearchingBackend && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center gap-2.5 animate-fade-in">
                    <div className="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-[9px] font-black text-primary font-mono tracking-wider animate-pulse">
                      GEOSPATIAL LOOKUP ACTIVE...
                    </span>
                  </div>
                )}
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Grid Lines for Advanced aesthetic */}
                  <line x1="20" y1="0" x2="20" y2="100" stroke="currentColor" className="text-border/20" strokeWidth="0.15" strokeDasharray="2,2" />
                  <line x1="40" y1="0" x2="40" y2="100" stroke="currentColor" className="text-border/20" strokeWidth="0.15" strokeDasharray="2,2" />
                  <line x1="60" y1="0" x2="60" y2="100" stroke="currentColor" className="text-border/20" strokeWidth="0.15" strokeDasharray="2,2" />
                  <line x1="80" y1="0" x2="80" y2="100" stroke="currentColor" className="text-border/20" strokeWidth="0.15" strokeDasharray="2,2" />
                  
                  <line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" className="text-border/20" strokeWidth="0.15" strokeDasharray="2,2" />
                  <line x1="0" y1="40" x2="100" y2="40" stroke="currentColor" className="text-border/20" strokeWidth="0.15" strokeDasharray="2,2" />
                  <line x1="0" y1="60" x2="100" y2="60" stroke="currentColor" className="text-border/20" strokeWidth="0.15" strokeDasharray="2,2" />
                  <line x1="0" y1="80" x2="100" y2="80" stroke="currentColor" className="text-border/20" strokeWidth="0.15" strokeDasharray="2,2" />

                  {/* Dynamic Map Vector Details based on Zoom/Viewport State */}
                  {(() => {
                    // Pan-India National Zones rendering
                    return (
                      <g>
                        {/* Indian Coastline & Major River Simulation */}
                        <path d="M 10,75 L 30,85 L 50,90 L 70,80 L 80,60 L 90,40" fill="none" stroke="#60a5fa" strokeWidth="1.0" opacity="0.15" />
                        <path d="M 20,40 Q 40,35 60,38 T 95,25" fill="none" stroke="#60a5fa" strokeWidth="0.8" opacity="0.15" />
                        
                        {/* National Zone Labels */}
                        <text x="50" y="25" className="fill-muted-foreground/30 font-black select-none pointer-events-none" fontSize="3.0" textAnchor="middle" letterSpacing="0.15">NORTH ZONE</text>
                        <text x="25" y="52" className="fill-muted-foreground/30 font-black select-none pointer-events-none" fontSize="3.0" textAnchor="middle" letterSpacing="0.15">WEST ZONE</text>
                        <text x="50" y="80" className="fill-muted-foreground/30 font-black select-none pointer-events-none" fontSize="3.0" textAnchor="middle" letterSpacing="0.15">SOUTH ZONE</text>
                        <text x="75" y="52" className="fill-muted-foreground/30 font-black select-none pointer-events-none" fontSize="3.0" textAnchor="middle" letterSpacing="0.15">EAST ZONE</text>
                        <text x="50" y="52" className="fill-muted-foreground/30 font-black select-none pointer-events-none" fontSize="3.0" textAnchor="middle" letterSpacing="0.15">CENTRAL ZONE</text>
                      </g>
                    );
                  })()}

                  {/* Plot user device GPS coords if active */}
                  {userCoords && (() => {
                    const pos = mapCoordinates(userCoords.lat, userCoords.lng);
                    return (
                      <g>
                        <circle cx={pos.x} cy={pos.y} r="3" className="fill-primary animate-ping opacity-60" />
                        <circle cx={pos.x} cy={pos.y} r="2.2" className="fill-primary stroke-background" strokeWidth="0.5" />
                      </g>
                    );
                  })()}

                  {/* Plot Clusters / Pins */}
                  {clusters.map((cluster, ci) => {
                    const isSingle = cluster.count === 1;
                    const h = cluster.hospitals[0];
                    const isHovered = !isSingle 
                      ? hoveredClusterIndex === ci
                      : hoveredHospitalId === h.id;

                    if (isSingle) {
                      return (
                        <g 
                          key={`hosp-${h.id}`}
                          onMouseEnter={() => setHoveredHospitalId(h.id)}
                          onMouseLeave={() => setHoveredHospitalId(null)}
                          className="cursor-pointer"
                        >
                          <circle 
                            cx={cluster.x} 
                            cy={cluster.y} 
                            r={isHovered ? 5.5 : 3.8} 
                            className={`fill-red-500 opacity-40 transition-all ${isHovered ? 'animate-pulse' : ''}`} 
                          />
                          <circle 
                            cx={cluster.x} 
                            cy={cluster.y} 
                            r={isHovered ? 2.8 : 2.0} 
                            className="fill-red-500 stroke-background transition-all" 
                            strokeWidth="0.5"
                          />
                          {h.verified && (
                            <circle
                              cx={cluster.x + 1.2}
                              cy={cluster.y - 1.2}
                              r="1"
                              className="fill-amber-500 stroke-background"
                              strokeWidth="0.2"
                            />
                          )}
                        </g>
                      );
                    } else {
                      // Multi-hospital cluster
                      return (
                        <g
                          key={`cluster-${ci}`}
                          onMouseEnter={() => setHoveredClusterIndex(ci)}
                          onMouseLeave={() => setHoveredClusterIndex(null)}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={cluster.x}
                            cy={cluster.y}
                            r={isHovered ? 8.5 : 6.5}
                            className="fill-primary/25 stroke-primary/30 animate-pulse"
                            strokeWidth="0.5"
                          />
                          <circle
                            cx={cluster.x}
                            cy={cluster.y}
                            r={isHovered ? 6.5 : 5.0}
                            className="fill-primary stroke-background"
                            strokeWidth="1.0"
                          />
                          <text
                            x={cluster.x}
                            y={cluster.y + 1.2}
                            textAnchor="middle"
                            className="fill-primary-foreground font-black pointer-events-none select-none text-[3.5px]"
                          >
                            {cluster.count}
                          </text>
                        </g>
                      );
                    }
                  })}
                </svg>

                {/* Tooltip Overlay */}
                {hoveredHospitalId && (() => {
                  const hosp = list.find(h => h.id === hoveredHospitalId);
                  if (!hosp) return null;
                  const pos = mapCoordinates(hosp.lat, hosp.lng);
                  return (
                    <div 
                      className="absolute bg-card border rounded-lg p-2.5 text-[9px] shadow-elevated pointer-events-none animate-fade-in max-w-[160px] text-left"
                      style={{ 
                        left: `${pos.x > 70 ? pos.x - 40 : pos.x + 3}%`, 
                        top: `${pos.y > 70 ? pos.y - 18 : pos.y + 3}%` 
                      }}
                    >
                      <h4 className="font-extrabold text-foreground leading-none flex items-center gap-1">
                        <span>{hosp.name}</span>
                        {hosp.verified && <span className="text-amber-500 font-extrabold text-[8px]">✓</span>}
                      </h4>
                      <span className="text-primary font-bold mt-1 block">Dist: {hosp.computedDistance}</span>
                      <span className="text-muted-foreground block truncate mt-0.5">{hosp.address}</span>
                      {hosp.hfrId && (
                        <span className="text-[7px] text-amber-600 dark:text-amber-400 font-extrabold block mt-0.5">ABDM ID: {hosp.hfrId}</span>
                      )}
                    </div>
                  );
                })()}

                {/* Cluster Tooltip Overlay */}
                {hoveredClusterIndex !== null && (() => {
                  const cluster = clusters[hoveredClusterIndex];
                  if (!cluster) return null;
                  return (
                    <div 
                      className="absolute bg-card border rounded-lg p-2.5 text-[9px] shadow-elevated pointer-events-none animate-fade-in max-w-[185px] text-left z-10"
                      style={{ 
                        left: `${cluster.x > 70 ? cluster.x - 45 : cluster.x + 3}%`, 
                        top: `${cluster.y > 70 ? cluster.y - 25 : cluster.y + 3}%` 
                      }}
                    >
                      <h4 className="font-extrabold text-primary leading-none mb-1.5 border-b pb-1 flex justify-between">
                        <span>Cluster Location</span>
                        <span>{cluster.count} Facilities</span>
                      </h4>
                      <div className="space-y-1 max-h-[100px] overflow-y-auto pr-1">
                        {cluster.hospitals.map((h, i) => (
                          <div key={i} className="text-[8px] truncate font-medium text-foreground">
                            {i+1}. {h.name} <span className="text-primary font-bold">({h.computedDistance})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Map Legend */}
                <div className="absolute bottom-2 left-2 bg-card/85 backdrop-blur-sm border rounded px-2 py-1 text-[8px] flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary block shrink-0" />
                    <span className="font-bold text-foreground">User GPS</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 block shrink-0" />
                    <span className="font-bold text-foreground">Hospitals</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Right Hospitals listings cards */}
          <div className="lg:col-span-4 space-y-4 animate-fade-in max-h-[550px] overflow-y-auto pr-1">
            <span className="text-xs font-bold text-muted-foreground uppercase block px-1">Plotted Facilities ({list.length})</span>
            {isSearchingBackend ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="border p-4.5 rounded-2xl bg-card animate-pulse h-44 flex flex-col justify-between border-border/60">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-2/3" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </div>
                    <div className="h-8 bg-muted rounded w-full" />
                  </div>
                ))}
              </div>
            ) : list.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-2xl bg-card">
                <ShieldAlert className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No clinics matching specialty filters.</p>
              </div>
            ) : (
              list.map((hosp) => {
                const isHovered = hoveredHospitalId === hosp.id;
                return (
                  <div
                    key={hosp.id}
                    onMouseEnter={() => setHoveredHospitalId(hosp.id)}
                    onMouseLeave={() => setHoveredHospitalId(null)}
                    className={`border p-4.5 rounded-2xl hover:shadow-elevated transition-all flex flex-col justify-between min-h-[176px] h-auto cursor-pointer bg-card ${
                      isHovered ? 'border-primary shadow-medical bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-xs text-foreground flex items-center gap-1">
                          <HospitalIcon className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate max-w-[180px]">{hosp.name}</span>
                        </h4>
                        
                        <span className="text-xs font-extrabold text-primary shrink-0 leading-none">
                          {hosp.computedDistance}
                        </span>
                      </div>

                      <p className="text-[10px] text-muted-foreground mt-2 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{hosp.address}</span>
                      </p>

                      <div className="flex gap-1 flex-wrap mt-2.5">
                        {hosp.specialties && hosp.specialties.slice(0, 3).map((s: string, idx: number) => (
                          <span key={idx} className="text-[8px] bg-secondary text-secondary-foreground border px-1.5 py-0.2 rounded font-bold">
                            {s}
                          </span>
                        ))}
                      </div>

                      {/* Active Facilities Badges */}
                      {hosp.facilities && hosp.facilities.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          {hosp.facilities.map((fac: string, idx: number) => (
                            <span 
                              key={idx} 
                              className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-extrabold"
                            >
                              {fac}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Collapsible Accordion Tab */}
                      <div className="mt-3 border-t pt-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedHospId(expandedHospId === hosp.id ? null : hosp.id);
                          }}
                          className="w-full flex justify-between items-center text-[10px] font-extrabold text-primary hover:underline cursor-pointer"
                        >
                          <span>Available Tests & Pricing</span>
                          <span>{expandedHospId === hosp.id ? '▲' : '▼'}</span>
                        </button>
                        
                        {expandedHospId === hosp.id && (
                          <div className="mt-2 space-y-1.5 animate-fade-in bg-muted/20 p-2 rounded-lg border text-[9px] text-left animate-none">
                            {!hosp.testMenu || hosp.testMenu.length === 0 ? (
                              <p className="text-muted-foreground text-center">No tests configured.</p>
                            ) : (
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-border/60">
                                    <th className="pb-1 font-bold text-muted-foreground uppercase text-[8px]">Test</th>
                                    <th className="pb-1 font-bold text-muted-foreground uppercase text-[8px] text-right">Price</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {hosp.testMenu.map((test: any, tIdx: number) => (
                                    <tr key={tIdx} className="hover:bg-muted/10">
                                      <td className="py-1 font-semibold text-foreground">{test.testName}</td>
                                      <td className="py-1 font-mono font-bold text-primary text-right">₹{test.price}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 border-t pt-3 w-full mt-3">
                      <a
                        href={`tel:${hosp.phone}`}
                        className="flex-1 py-1 px-3 border border-primary/20 hover:bg-secondary/40 text-primary font-bold rounded-lg text-[10px] flex items-center justify-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                      
                      <button
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${hosp.lat},${hosp.lng}`, '_blank')}
                        className="flex-1 py-1 px-3 bg-gradient-medical text-white font-bold rounded-lg text-[10px] shadow-medical hover:opacity-90 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Directions</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Register Hospital Modal dialog */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-card text-foreground rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-border shadow-elevated p-6 relative">
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
                  <h3 className="font-extrabold text-lg">Register Your Hospital / Clinic</h3>
                  <p className="text-xs text-muted-foreground">Submit credential records to register in coordinate mappings.</p>
                </div>
              </div>

              {registrationSuccess ? (
                <div className="text-center py-8 animate-fade-in">
                  <div className="bg-success/15 text-success w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 border border-success/20">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <p className="text-sm font-bold text-success">Clinic Registered! Reloading lists...</p>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground block">Hospital Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. City General Clinic"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-card text-foreground text-xs"
                      required
                    />
                  </div>

                  {/* Reg number */}
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground block">MCI / License Registration Number</label>
                    <input
                      type="text"
                      placeholder="e.g. MCI-12345-2024"
                      value={regRegNum}
                      onChange={(e) => setRegRegNum(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-card text-foreground text-xs"
                    />
                  </div>

                  {/* Address */}
                  <div className="space-y-1">
                    <label className="font-semibold text-muted-foreground block">Complete Address *</label>
                    <input
                      type="text"
                      placeholder="e.g. Sector 5, Jawahar Nagar, Jaipur"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg bg-card text-foreground text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Phone */}
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground block">Contact Phone *</label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 141..."
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-card text-foreground text-xs"
                        required
                      />
                    </div>
                    
                    {/* Email */}
                    <div className="space-y-1">
                      <label className="font-semibold text-muted-foreground block">Email Address *</label>
                      <input
                        type="email"
                        placeholder="hospital@example.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-card text-foreground text-xs"
                        required
                      />
                    </div>
                  </div>

                  {/* Specialties tags manager */}
                  <div className="space-y-2 border-t pt-3">
                    <label className="font-semibold text-muted-foreground block">Specialty Fields Supported</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Cardiology, Pediatrics"
                        value={specialtyInput}
                        onChange={(e) => setSpecialtyInput(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-card text-foreground text-xs"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddSpecialty(e as any)}
                      />
                      <button
                        type="button"
                        onClick={handleAddSpecialty as any}
                        className="px-3 border rounded-lg hover:bg-muted text-xs font-bold"
                      >
                        Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {regSpecialties.map((s, idx) => (
                        <span
                          key={idx}
                          onClick={() => handleRemoveSpecialty(s)}
                          className="flex items-center gap-1 bg-secondary text-secondary-foreground border px-2 py-1 rounded cursor-pointer hover:bg-destructive/15 hover:text-destructive hover:border-destructive/20 font-semibold"
                        >
                          <span>{s}</span>
                          <X className="w-3 h-3 shrink-0" />
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-medical text-white font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all text-xs shadow-medical mt-4"
                  >
                    Submit Hospital Verification
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

export default Hospitals;
