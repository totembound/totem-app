import { PartyPopper, Sparkles, X } from 'lucide-react';

interface TutorialCompleteModalProps {
  onClose: () => void;
}

export default function TutorialCompleteModal({ onClose }: TutorialCompleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-start sm:items-center justify-center pt-8 sm:pt-0 overflow-y-auto">
      <div className="relative w-full max-w-sm mx-4 mb-4 animate-fade-in">
        <div className="absolute -inset-1">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-30 animate-pulse" />
        </div>

        <div className="relative bg-white dark:bg-gray-800 rounded-xl border-2 border-purple-300 dark:border-purple-600 p-6">
          <button
            onClick={onClose}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>

          <div className="text-center space-y-4">
            <div className="flex justify-center gap-2">
              <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
              <PartyPopper className="w-8 h-8 text-purple-500" />
              <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Tutorial Complete!
            </h2>

            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Great job! You've learned the basics of raising totems, earning rewards, and going on expeditions. You're ready to explore on your own!
            </p>

            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Let's Go!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
