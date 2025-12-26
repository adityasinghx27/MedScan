import React, { useState } from 'react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

type Step = 'INFO' | 'PAYMENT' | 'VERIFY';

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  const [step, setStep] = useState<Step>('INFO');
  const [txnId, setTxnId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handlePayNow = () => {
    window.location.href = "upi://pay?pa=7542076420@fam&pn=MediScanAI&am=49.00&cu=INR";
  };

  const verifyPayment = () => {
    if (txnId.length < 6) { setError("Invalid ID"); return; }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false); onUpgrade(); setStep('INFO'); setTxnId('');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#111] rounded-[2rem] w-full max-w-sm overflow-hidden relative shadow-2xl border border-gray-800">
        <button onClick={onClose} className="absolute top-4 right-4 z-20 text-gray-500 hover:text-white bg-black/20 p-2 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Golden Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-yellow-500/20 blur-[80px] pointer-events-none"></div>

        <div className="p-8 relative z-10 text-center">
            {step === 'INFO' && (
                <div className="space-y-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-orange-500/20 mb-2">
                        <span className="text-3xl">👑</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Go Premium</h2>
                        <p className="text-gray-400 text-sm">One-time payment. Lifetime safety.</p>
                    </div>

                    <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800 text-left space-y-3">
                        {['Voice Reminders 🗣️', 'Drug Interactions ⚠️', 'Pregnancy Alerts 🤰', 'PDF Reports 📄', 'Unlimited Alarms ⏰'].map((f, i) => (
                            <div key={i} className="flex items-center text-sm text-gray-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mr-3"></div>
                                {f}
                            </div>
                        ))}
                    </div>

                    <div className="pt-2">
                        <div className="text-3xl font-bold text-white mb-4">₹49 <span className="text-sm font-normal text-gray-500">/ forever</span></div>
                        <button onClick={() => setStep('PAYMENT')} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-4 rounded-xl shadow-lg hover:scale-105 transition-transform">Unlock Now</button>
                    </div>
                </div>
            )}

            {step === 'PAYMENT' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white">Payment</h2>
                    <div className="bg-gray-900 p-4 rounded-xl border border-dashed border-gray-700">
                        <p className="text-xs text-gray-500 uppercase">UPI ID</p>
                        <p className="text-lg font-mono text-white select-all">7542076420@fam</p>
                    </div>
                    <button onClick={handlePayNow} className="w-full bg-white text-black font-bold py-3 rounded-xl flex items-center justify-center">Open Payment App</button>
                    <button onClick={() => setStep('VERIFY')} className="w-full border border-gray-700 text-white font-bold py-3 rounded-xl hover:bg-gray-900">I have paid</button>
                </div>
            )}

            {step === 'VERIFY' && (
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white">Verify</h2>
                    <input type="text" placeholder="Enter UTR / Txn ID" value={txnId} onChange={(e) => setTxnId(e.target.value)} className="w-full bg-gray-900 border border-gray-700 text-white p-4 rounded-xl text-center font-mono focus:border-yellow-500 outline-none" />
                    {error && <p className="text-red-400 text-xs">{error}</p>}
                    <button onClick={verifyPayment} disabled={isVerifying} className="w-full bg-yellow-500 text-black font-bold py-4 rounded-xl opacity-90 hover:opacity-100">
                        {isVerifying ? "Checking..." : "Verify & Unlock"}
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;