import { Github } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = ({ githubUrl = "https://github.com/totembound", discordUrl = "https://discord.gg/MhKQC5E6xe",  xUrl = "https://x.com/totemboundhq", companyName = "TotemBound" }) => {
  return (
    <footer className="h-10 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 border-t border-gray-200/20 dark:border-gray-700/20">
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
        <p>© {new Date().getFullYear()}</p>
        <Link 
          to="/"
          className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors">
          <div className="flex gap-1">
            <img 
              src="/tb-logo-180.png" 
              alt="Totembound Logo" 
              className="h-5 w-5"
            /><span className="hidden sm:inline">TotemBound</span>
          </div>
        </Link>
        <span className="hidden sm:inline">•</span>
        <Link 
          to="/about"
          className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
        >
          About
        </Link>
        <span className="hidden sm:inline">•</span>
        <Link 
          to="/terms"
          className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
        >
          Terms
        </Link>
        <span className="hidden sm:inline">•</span>
        <Link 
          to="/privacy"
          className="hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
        >
          Privacy
        </Link>
        <span className="hidden sm:inline">•</span>
        <a 
          href={discordUrl} 
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"></path>
            </svg>
            <span className="hidden sm:inline">Discord</span>
        </a>
        <span className="hidden sm:inline">•</span>
        <a 
          href={githubUrl} 
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
        >
          <Github size={16} />
          <span className="hidden sm:inline">GitHub</span>
        </a>
        <span className="hidden sm:inline">•</span>
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
          <span className="hidden sm:inline">X</span>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
