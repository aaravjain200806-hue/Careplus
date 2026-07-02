import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import logoMark from '../assets/logo_mark.png';

export const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-secondary/30 border-t py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src={logoMark} alt="CarePlus Logo" className="w-7 h-7 object-contain" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              {t('app.title')}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            © 2026 CarePlus Healthcare. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
