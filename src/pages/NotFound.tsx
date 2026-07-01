import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: Tried accessing non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="bg-card border p-8 rounded-2xl shadow-elevated text-center max-w-md animate-fade-in">
        <div className="bg-destructive/15 text-destructive w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-destructive/20">
          <AlertCircle className="w-8 h-8 animate-pulse" />
        </div>
        
        <h1 className="text-3xl font-extrabold tracking-tight mb-2 text-foreground">404 - Page Not Found</h1>
        
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          The requested page at <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-xs">{location.pathname}</code> does not exist or has been relocated.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/"
            className="flex-1 py-2 px-4 bg-gradient-medical text-white font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all text-xs shadow-medical flex items-center justify-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="flex-1 py-2 px-4 border hover:bg-muted font-semibold text-foreground rounded-lg transition-all text-xs flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
