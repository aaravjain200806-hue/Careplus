import React from 'react';

interface Hospital {
  id: number;
  name: string;
  address: string;
  phone: string;
  email?: string;
  verified?: boolean;
  lat: number;
  lng: number;
  hfrId?: string;
  computedDistance?: string;
  distance?: string;
  specialties?: string[];
  facilities?: string[];
  testMenu?: { testName: string; price: number }[];
}

interface Cluster {
  x: number;
  y: number;
  count: number;
  name: string;
  hospitals: Hospital[];
}

interface InteractiveMapProps {
  list: Hospital[];
  clusters: Cluster[];
  userCoords: { lat: number; lng: number } | null;
  mapCoordinates: (lat: number, lng: number) => { x: number; y: number };
  hoveredHospitalId: number | null;
  setHoveredHospitalId: (id: number | null) => void;
  hoveredClusterIndex: number | null;
  setHoveredClusterIndex: (idx: number | null) => void;
  isSearchingBackend: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = React.memo(({
  list,
  clusters,
  userCoords,
  mapCoordinates,
  hoveredHospitalId,
  setHoveredHospitalId,
  hoveredClusterIndex,
  setHoveredClusterIndex,
  isSearchingBackend
}) => {
  return (
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

        {/* Indian Coastline & Major River Simulation */}
        <path d="M 10,75 L 30,85 L 50,90 L 70,80 L 80,60 L 90,40" fill="none" stroke="#60a5fa" strokeWidth="1.0" opacity="0.15" />
        <path d="M 20,40 Q 40,35 60,38 T 95,25" fill="none" stroke="#60a5fa" strokeWidth="0.8" opacity="0.15" />
        
        {/* National Zone Labels */}
        <text x="50" y="25" className="fill-muted-foreground/30 font-black select-none pointer-events-none" fontSize="3.0" textAnchor="middle" letterSpacing="0.15">NORTH ZONE</text>
        <text x="25" y="52" className="fill-muted-foreground/30 font-black select-none pointer-events-none" fontSize="3.0" textAnchor="middle" letterSpacing="0.15">WEST ZONE</text>
        <text x="50" y="80" className="fill-muted-foreground/30 font-black select-none pointer-events-none" fontSize="3.0" textAnchor="middle" letterSpacing="0.15">SOUTH ZONE</text>
        <text x="75" y="52" className="fill-muted-foreground/30 font-black select-none pointer-events-none" fontSize="3.0" textAnchor="middle" letterSpacing="0.15">EAST ZONE</text>
        <text x="50" y="52" className="fill-muted-foreground/30 font-black select-none pointer-events-none" fontSize="3.0" textAnchor="middle" letterSpacing="0.15">CENTRAL ZONE</text>

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
            className="absolute bg-card border rounded-lg p-2.5 text-[9px] shadow-elevated pointer-events-none animate-fade-in max-w-[160px] text-left z-30"
            style={{ 
              left: `${pos.x > 70 ? pos.x - 40 : pos.x + 3}%`, 
              top: `${pos.y > 70 ? pos.y - 18 : pos.y + 3}%` 
            }}
          >
            <h4 className="font-extrabold text-foreground leading-none flex items-center gap-1">
              <span>{hosp.name}</span>
              {hosp.verified && <span className="text-amber-500 font-extrabold text-[8px]">✓</span>}
            </h4>
            <span className="text-primary font-bold mt-1 block">Dist: {hosp.computedDistance || hosp.distance}</span>
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
            className="absolute bg-card border rounded-lg p-2.5 text-[9px] shadow-elevated pointer-events-none animate-fade-in max-w-[185px] text-left z-30"
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
                  {i+1}. {h.name} <span className="text-primary font-bold">({h.computedDistance || h.distance})</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Map Legend */}
      <div className="absolute bottom-2 left-2 bg-card/85 backdrop-blur-sm border rounded px-2 py-1 text-[8px] flex items-center gap-2 z-10">
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
  );
});

export default InteractiveMap;
