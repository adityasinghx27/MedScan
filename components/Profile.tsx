import React from 'react';

interface ProfileProps {
  isPremium: boolean;
}

const Profile: React.FC<ProfileProps> = ({ isPremium }) => {
  const deviceId = localStorage.getItem('mediScan_deviceId') || 'Guest';
  const txnId = localStorage.getItem('mediScan_txnId');

  return (
    <div className="p-6 pb-24 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile</h2>

        {/* User Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 mb-6 text-center relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-28 bg-gradient-to-r ${isPremium ? 'from-yellow-400 to-orange-500' : 'from-teal-500 to-emerald-600'}`}></div>
            
            <div className="relative z-10 -mt-2">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg mx-auto bg-gray-200 flex items-center justify-center text-3xl relative">
                    👤
                    {isPremium && <span className="absolute -bottom-2 -right-2 text-2xl drop-shadow-md">👑</span>}
                </div>
                
                <h3 className="text-xl font-bold mt-3 text-gray-800">Guest User</h3>
                <p className="text-gray-400 text-xs mb-4 break-all opacity-70">
                    ID: {deviceId.substring(0, 12)}...
                </p>

                {isPremium ? (
                     <div className="flex flex-col items-center">
                        <div className="inline-flex items-center px-6 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-extrabold text-sm shadow-lg shadow-orange-500/20 mb-2 border border-white/20">
                            <span>PREMIUM MEMBER</span>
                        </div>
                        {txnId && <span className="text-[10px] text-gray-400">Txn: {txnId}</span>}
                     </div>
                ) : (
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-gray-100 text-gray-500 font-bold text-sm">
                         <span>Free Plan</span>
                     </div>
                )}
            </div>
        </div>

        <div className="mt-8">
            <h4 className="text-sm font-bold text-gray-400 uppercase mb-4 tracking-wider">Settings</h4>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                <div className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer">
                    <span className="text-sm font-medium text-gray-700">App Version</span>
                    <span className="text-xs text-gray-400">1.0.1</span>
                </div>
                <div className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer">
                     <span className="text-sm font-medium text-gray-700">Notifications</span>
                     <span className="text-xs text-green-500 font-bold">On</span>
                </div>
                <div className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer">
                     <span className="text-sm font-medium text-gray-700">Data Storage</span>
                     <span className="text-xs text-gray-400">Local Only</span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Profile;