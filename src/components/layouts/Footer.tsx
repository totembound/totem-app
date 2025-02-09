import React from 'react';
import { Github } from 'lucide-react';

const Footer = ({ githubUrl = "https://github.com/totembound",  xUrl = "https://x.com/totemboundhq", companyName = "TotemBound" }) => {
  return (
    <footer className="h-10 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 border-t border-gray-200/20 dark:border-gray-700/20">
      <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm">
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
          className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
        >
          <Github size={16} />
          GitHub
        </a>
        <span>•</span>
        <a 
          href={xUrl} 
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
        >
          <svg 
            viewBox="0 0 24 24" 
            className="w-4 h-4 fill-current"
            aria-hidden="true"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span>X</span>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
