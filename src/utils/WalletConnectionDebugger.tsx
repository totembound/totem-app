import { useUser } from '../contexts/UserContext';

const StateDebugger = () => {
    const { isSignedUp, isConnected, provider, signer, polBalance, totemBalance, address } = useUser();
    const displayAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'None';

    return (
        <div className="mt-8 bg-white">
            <h3 className="font-bold">Debug Panel</h3>
            <div className="space-y-4">
                {/* MetaMask State */}
                <div className="border rounded p-4">
                    <h3 className="font-bold mb-2">MetaMask State</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Connected:</div>
                    <div className={isConnected ? "text-green-600" : "text-red-600"}>
                        {isConnected ? "Yes" : "No"}
                    </div>
                    <div>Address:</div>
                    <div className="truncate">{displayAddress || "None"}</div>
                    <div>Provider:</div>
                    <div className={provider ? "text-green-600" : "text-red-600"}>
                        {provider ? "Available" : "Missing"}
                    </div>
                    <div>Signer:</div>
                    <div className={signer ? "text-green-600" : "text-red-600"}>
                        {signer ? "Available" : "Missing"}
                    </div>
                    </div>
                </div>

                {/* UserContext State */}
                <div className="border rounded p-4">
                    <h3 className="font-bold mb-2">UserContext State</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Signed Up:</div>
                    <div className={isSignedUp ? "text-green-600" : "text-red-600"}>
                        {isSignedUp ? "Yes" : "No"}
                    </div>
                    <div>TOTEM Balance:</div>
                    <div>{totemBalance}</div>
                    <div>POL Balance:</div>
                    <div>{polBalance}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StateDebugger;