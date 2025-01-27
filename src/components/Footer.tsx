import React from 'react';
import { Github } from 'lucide-react';

const Footer = ({ githubUrl = "https://github.com/totembound/totem-app", companyName = "TotemBound" }) => {
  return (
    <footer className="text-center text-white text-sm">
      <div className="flex items-center justify-center gap-2">
        <p>© {new Date().getFullYear()}</p>
        <img 
          src="/tb-logo-180.png" 
          alt="Totembound Logo" 
          className="h-5 w-5"
        />
        <p>{companyName}</p>
        <span>•</span>
        <a 
          href={githubUrl} 
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-purple-800 transition-colors inline-flex items-center gap-1"
        >
          <Github size={16} />
          GitHub
        </a>
      </div>
    </footer>
  );
};

export default Footer;
