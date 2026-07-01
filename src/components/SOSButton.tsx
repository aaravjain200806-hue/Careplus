import React, { useState, useEffect, useRef } from 'react';
import { AlertOctagon, PhoneCall, Volume2, VolumeX, ShieldAlert, HeartPulse, Sparkles, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const SOSButton: React.FC = () => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [bloodGroup, setBloodGroup] = useState(() => localStorage.getItem('care_blood_group') || '');
  const [allergies, setAllergies] = useState(() => localStorage.getItem('care_allergies') || '');
  const [sosStatus, setSosStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Audio Context refs for synthesis
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (coords === null && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setCoords({ lat: 21.1458, lng: 79.0882 }) // default center of India (Nagpur)
      );
    }
  }, []);

  // Save emergency data
  useEffect(() => {
    localStorage.setItem('care_blood_group', bloodGroup);
  }, [bloodGroup]);

  useEffect(() => {
    localStorage.setItem('care_allergies', allergies);
  }, [allergies]);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      stopSiren();
    };
  }, []);

  const startSiren = () => {
    try {
      // Create audio context if not initialized
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Setup Nodes
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, ctx.currentTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);

      // Connect nodes
      osc.connect(gain);
      gain.connect(ctx.destination);

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;

      osc.start();
      setIsAlarmPlaying(true);

      // Program frequency sweep for siren effect
      let goingUp = true;
      let freq = 600;

      timerRef.current = window.setInterval(() => {
        if (!oscillatorRef.current || !audioCtxRef.current) return;
        
        if (goingUp) {
          freq += 40;
          if (freq >= 1100) goingUp = false;
        } else {
          freq -= 40;
          if (freq <= 500) goingUp = true;
        }
        
        oscillatorRef.current.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
      }, 50) as any;

    } catch (err) {
      console.error("Failed to generate distress siren:", err);
    }
  };

  const stopSiren = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {}
      oscillatorRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    setIsAlarmPlaying(false);
  };

  const toggleSiren = () => {
    if (isAlarmPlaying) {
      stopSiren();
    } else {
      startSiren();
    }
  };

  const handleTriggerSOS = () => {
    setSosStatus('sending');
    setTimeout(() => {
      setSosStatus('sent');
      // Auto disable alarm/siren or notify
      startSiren();
    }, 2000);
  };

  const closeSOS = () => {
    stopSiren();
    setIsOpen(false);
    setSosStatus('idle');
  };

  return (
    <>
      {/* Floating SOS Trigger Widget */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-emergency text-white flex items-center justify-center shadow-elevated hover:scale-110 active:scale-95 transition-all z-40 animate-pulse"
        aria-label="Emergency SOS"
      >
        <AlertOctagon className="w-7 h-7" />
      </button>

      {/* SOS Dialog overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card text-foreground rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border shadow-elevated flex flex-col p-6 gap-6 relative">
            
            {/* Close Button */}
            <button
              onClick={closeSOS}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-muted text-muted-foreground transition-all"
            >
              <XIcon className="w-5 h-5" />
            </button>

            {/* Title / Banner */}
            <div className="text-center">
              <div className="bg-emergency/10 text-emergency w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-emergency">
                {t('sos.emergency')}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Distress command center. Access quick resources or dispatch mock alerts.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column: Sirens & Alerts */}
              <div className="space-y-4">
                {/* 1. Alarm Sound Synthesizer */}
                <div className="border p-4 rounded-xl flex items-center justify-between bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-lg ${isAlarmPlaying ? 'bg-emergency text-white animate-pulse' : 'bg-secondary text-primary'}`}>
                      {isAlarmPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Emergency Alarm</h3>
                      <p className="text-xs text-muted-foreground">Sound alarm locally to alert others</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleSiren}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                      isAlarmPlaying 
                        ? 'bg-muted border border-border hover:bg-muted/70 text-foreground' 
                        : 'bg-emergency text-white hover:bg-emergency/90 shadow-medical'
                    }`}
                  >
                    {isAlarmPlaying ? 'Mute' : 'Play Siren'}
                  </button>
                </div>

                {/* 2. Dispatch Coordinator */}
                <div className="border p-4 rounded-xl bg-muted/30 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                    <MapPin className="w-4 h-4 text-emergency" />
                    Coordinate Dispatch
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Simulate sending emergency SMS with GPS coordinates to closest responders.
                  </p>
                  
                  {coords && (
                    <div className="bg-card text-xs p-2 rounded border font-mono text-muted-foreground flex justify-between">
                      <span>LAT: {coords.lat.toFixed(5)}</span>
                      <span>LNG: {coords.lng.toFixed(5)}</span>
                    </div>
                  )}

                  <button
                    onClick={handleTriggerSOS}
                    disabled={sosStatus !== 'idle'}
                    className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      sosStatus === 'idle' 
                        ? 'bg-emergency text-white hover:bg-emergency/95 shadow-medical' 
                        : sosStatus === 'sending'
                        ? 'bg-muted border border-border text-muted-foreground'
                        : 'bg-success text-white'
                    }`}
                  >
                    {sosStatus === 'idle' && 'Trigger Rescue Services'}
                    {sosStatus === 'sending' && 'Transmitting Coordinates...'}
                    {sosStatus === 'sent' && 'Alert Received! Ambulance Dispatched'}
                  </button>
                </div>

                {/* 3. Personal Medical Profile */}
                <div className="border p-4 rounded-xl bg-card space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-primary" />
                    First Responder Info
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-muted-foreground block font-medium">Blood Group</label>
                      <input
                        type="text"
                        placeholder="e.g. O+ / AB-"
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-card text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-muted-foreground block font-medium">Allergies/Meds</label>
                      <input
                        type="text"
                        placeholder="e.g. Penicillin"
                        value={allergies}
                        onChange={(e) => setAllergies(e.target.value)}
                        className="w-full px-2.5 py-1.5 border rounded-lg bg-card text-foreground"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: First Aid & Helpline numbers */}
              <div className="space-y-4">
                {/* 4. Hotline Contacts */}
                <div className="border p-4 rounded-xl space-y-3">
                  <h3 className="font-semibold text-sm">Emergency Hotlines</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <a
                      href="tel:108"
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-secondary/40 transition-all text-foreground"
                    >
                      <span className="font-medium">Ambulance</span>
                      <span className="bg-emergency/15 text-emergency font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <PhoneCall className="w-3 h-3" />
                        108
                      </span>
                    </a>
                    <a
                      href="tel:102"
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-secondary/40 transition-all text-foreground"
                    >
                      <span className="font-medium">Medical Help</span>
                      <span className="bg-emergency/15 text-emergency font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <PhoneCall className="w-3 h-3" />
                        102
                      </span>
                    </a>
                    <a
                      href="tel:100"
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-secondary/40 transition-all text-foreground"
                    >
                      <span className="font-medium">Police</span>
                      <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <PhoneCall className="w-3 h-3" />
                        100
                      </span>
                    </a>
                    <a
                      href="tel:104"
                      className="flex items-center justify-between p-2 border rounded-lg hover:bg-secondary/40 transition-all text-foreground"
                    >
                      <span className="font-medium">Blood Bank</span>
                      <span className="bg-success/15 text-success font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <PhoneCall className="w-3 h-3" />
                        104
                      </span>
                    </a>
                  </div>
                </div>

                {/* 5. First Aid Guidelines Carousel/Details */}
                <div className="border p-4 rounded-xl bg-secondary/20 space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                    <Sparkles className="w-4 h-4 text-primary" />
                    First Aid Basics
                  </h3>
                  <div className="h-40 overflow-y-auto space-y-3 text-xs pr-1">
                    <div className="border-b pb-2">
                      <h4 className="font-bold text-primary flex items-center gap-1">
                        <span>• CPR (Cardiopulmonary Resuscitation)</span>
                      </h4>
                      <p className="text-muted-foreground mt-1 leading-relaxed">
                        Push hard and fast in the center of the chest (100-120 compressions per minute). After 30 compressions, give 2 rescue breaths. Repeat until help arrives.
                      </p>
                    </div>
                    <div className="border-b pb-2">
                      <h4 className="font-bold text-primary flex items-center gap-1">
                        <span>• Severe Bleeding</span>
                      </h4>
                      <p className="text-muted-foreground mt-1 leading-relaxed">
                        Apply firm, direct pressure on the wound using a clean cloth/bandage. Elevate the injured limb above heart level if possible.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-bold text-primary flex items-center gap-1">
                        <span>• Choking (Heimlich Maneuver)</span>
                      </h4>
                      <p className="text-muted-foreground mt-1 leading-relaxed">
                        Stand behind the person, wrap your arms around their waist. Make a fist with one hand, place it just above the navel. Press hard into the abdomen with a quick upward thrust.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Internal mini close icon
const XIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default SOSButton;
