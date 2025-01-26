import { useUser } from '../contexts/UserContext';
import ApprovalStatus from './ApprovalStatus';

export const UserInfoPanel = () => {
    const { isSignedUp, totemBalance, polBalance, address, isConnected } = useUser();
    
    console.log('UserInfoPanel Render Conditions:', { 
        isConnected, 
        hasAddress: !!address, 
        isSignedUp 
    });

    // Early return if not connected or not signed up
    if (!isConnected || !address || !isSignedUp) {
        console.log('UserInfoPanel: Not showing', { isConnected, isSignedUp });
        return null;
    }

    return (
        <div className="mt-8 p-4 bg-gray-200 rounded-lg shadow">
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-white rounded border border-gray-200">
                    <div className="text-sm text-gray-600">TOTEM Balance</div>
                    <div className="text-lg font-bold">{Number(totemBalance).toLocaleString()} TOTEM</div>
                </div>
                <div className="p-3 bg-white rounded border border-gray-200">
                    <div className="text-sm text-gray-600">POL Balance</div>
                    <div className="text-lg font-bold">{Number(polBalance).toLocaleString()} POL</div>
                </div>
            </div>
            <ApprovalStatus />
        </div>
    );
};

export default UserInfoPanel;