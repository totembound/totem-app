import { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { ComingSoon } from '../ComingSoon';

const Challenges = () => {
    const { isTokenApproved } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const disabledStyle = !isTokenApproved ? 'opacity-50 cursor-not-allowed' : '';

    return (
        <div className="p-6 bg-white dark:bg-gray-900 rounded-lg">

            {/* Welcome */}
            <div className="border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-grow">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Challenges
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            
                        </p>
                    </div>
                </div>

                <ComingSoon />
            </div>
        </div>
    );
};

export default Challenges;