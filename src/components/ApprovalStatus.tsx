import { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { useTotemGame } from '../hooks/useTotemGame';

const ApprovalStatus = () => {
    const [isApproved, setIsApproved] = useState(false);
    const { address, provider, isSignedUp } = useUser();
    const { checkTokenApproval, approveTokens } = useTotemGame();
 
    useEffect(() => {
        const checkApproval = async () => {
            const approved = await checkTokenApproval();
            console.log('Token Approval: ', approved);
            setIsApproved(approved);
        };
        console.log('Approval Status check: ', address, isSignedUp);
        if (address && provider && isSignedUp) {
            checkApproval();
        }
    }, [address, provider, isSignedUp, checkTokenApproval]);
 
    const handleApprove = async () => {
        const receipt = await approveTokens();
        const approved = await checkTokenApproval();
        console.log('Token Approval: ', approved, receipt);
        setIsApproved(approved);
    };

    if (isApproved) return <div className="mt-4">
        You're all set! Explore your My Totems gallery or jump straight to Game Controls. Start by buying your first Totem or purchasing more $TOTEM tokens.
    </div>;
 
    return (
        <div className="mt-4 p-4 bg-yellow-50 text-black rounded-lg shadow">
            <p className="mb-4">Congratulations! You've received 2,000 $TOTEM tokens to start your adventure. Now you'll need to complete a One-Time Approval to unlock your tokens for use in the game.</p>
            <button className="bg-green-500 text-white font-bold px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50" onClick={handleApprove}>
                Approve TOTEM Usage
            </button>
        </div>
    );
 };

 export default ApprovalStatus;