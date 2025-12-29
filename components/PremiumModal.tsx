
import React, { useState, useEffect } from 'react';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (txnId?: string) => void;
}

type Step = 'INFO' | 'PAYMENT' | 'VERIFY' | 'RESTORE';

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  const [step, setStep] = useState<Step>('INFO');
  const [txnId, setTxnId] = useState('');
  const [restoreId, setRestoreId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [alreadyPremium, setAlreadyPremium] = useState(false);

  useEffect(() => {
    if (isOpen) {
        if (localStorage.getItem('mediScan_premium') === 'true') {
            setAlreadyPremium(true);
        } else {
            setAlreadyPremium(false);
            setStep('INFO');
        }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePayNow = () => {
    window.location.href = "upi://pay?pa=7542076420@fam&pn=MedScanAI&am=99.00&cu=INR";
  };

  const verifyPayment = () => {
    if (txnId.length < 6) { setError("Invalid ID. Please check."); return; }
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false); 
      onUpgrade(txnId); 
      setStep('INFO'); 
      setTxnId('');
    }, 2000);
  };

  const handleRestore = () => {
      if (restoreId.length < 3) { setError("Invalid ID"); return; }
      setIsVerifying(true);
      setTimeout(() => {
          setIsVerifying(false);
          onUpgrade(restoreId);
          setStep('INFO');
          setRestoreId('');
      }, 1500);
  };
  
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/90 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      <div className="bg-[#0f172a] sm:rounded-[2.5rem] rounded-t-[2.5rem] w-full max-w-sm overflow-hidden relative shadow-2xl border border-slate-800">
        <button onClick={onClose} className="absolute top-5 right-5 z-20 text-slate-500 hover:text-white bg-white/10 p-2 rounded-full transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Premium Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-48 bg-gradient-to-b from-indigo-500/20 to-transparent pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[60px]"></div>

        <div className="p-8 pb-10 relative z-10 text-center">
            {alreadyPremium ? (
                 <div className="space-y-6 py-10">
                     <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6 animate-pulse-soft">
                        <span className="text-5xl">👑</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Premium Active</h2>
                    <p className="text-slate-400 font-medium">You are a lifetime member. Enjoy safe medication.</p>
                    <button onClick={onClose} className="w-full bg-white text-slate-900 font-bold py-4 rounded-2xl shadow-lg mt-4 hover:bg-slate-100 transition-colors">Okay, Close</button>
                 </div>
            ) : (
                <>
                {step === 'INFO' && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 bg-gradient-to-br from-yellow-300 to-amber-600 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-amber-500/20 mb-2 rotate-3 hover:rotate-6 transition-transform">
                            <span className="text-4xl drop-shadow-md">👑</span>
                        </div>
                        <div>
                            <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">MedScan Premium</h2>
                            <p className="text-slate-400 text-sm font-medium">Lifetime protection for your family.</p>
                        </div>

                        <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700/50 text-left space-y-4">
                            {[
                                { t: 'Side Effects & Risks', i: '⚠️' }, 
                                { t: 'Food & Lifestyle Guide', i: '🥗' },
                                { t: 'Pregnancy Alerts', i: '🤰' },
                                { t: 'PDF Health Reports', i: '📄' }
                            ].map((f, i) => (
                                <div key={i} className="flex items-center text-sm text-slate-200 font-medium">
                                    <span className="mr-3 text-lg">{f.i}</span>
                                    {f.t}
                                </div>
                            ))}
                        </div>

                        <div className="pt-2 space-y-3">
                            <div className="flex items-end justify-center space-x-2 mb-2">
                                <span className="text-4xl font-extrabold text-white">₹99</span>
                                <span className="text-sm font-bold text-slate-500 mb-1.5 uppercase tracking-wider">/ Lifetime</span>
                            </div>
                            <button onClick={() => setStep('PAYMENT')} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-slate-900 font-bold py-4 rounded-2xl shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all text-lg">Unlock Forever</button>
                            <button onClick={() => setStep('RESTORE')} className="text-xs text-slate-500 hover:text-white underline font-medium">Restore Purchase</button>
                        </div>
                    </div>
                )}

                {step === 'PAYMENT' && (
                    <div className="space-y-6 animate-slide-up">
                        <h2 className="text-2xl font-bold text-white">Payment Method</h2>
                        <div className="bg-slate-800 p-5 rounded-2xl border border-dashed border-slate-600 relative overflow-hidden">
                             <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg">PREFERRED</div>
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-2">UPI ID</p>
                            <p className="text-lg font-mono text-white select-all bg-black/30 p-2 rounded-lg break-all">7542076420@fam</p>
                        </div>
                        <div className="text-center text-yellow-400 font-bold text-xl">Pay ₹99</div>
                        <button onClick={handlePayNow} className="w-full bg-white text-slate-900 font-bold py-4 rounded-2xl flex items-center justify-center hover:bg-slate-100 transition-colors">
                            Pay via UPI App 
                            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        </button>
                        <button onClick={() => setStep('VERIFY')} className="w-full border border-slate-600 text-slate-300 font-bold py-4 rounded-2xl hover:bg-slate-800 transition-colors">I Have Paid</button>
                    </div>
                )}

                {step === 'VERIFY' && (
                    <div className="space-y-6 animate-slide-up">
                        <h2 className="text-2xl font-bold text-white">Verify Payment</h2>
                        <p className="text-slate-400 text-sm">Enter the Transaction ID (UTR) from your payment app.</p>
                        <input type="text" placeholder="Example: 3245xxxxxx" value={txnId} onChange={(e) => setTxnId(e.target.value)} className="w-full bg-slate-800 border border-slate-600 text-white p-4 rounded-2xl text-center font-mono focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder-slate-600" />
                        {error && <p className="text-rose-400 text-xs font-bold bg-rose-400/10 py-2 rounded-lg">{error}</p>}
                        <button onClick={verifyPayment} disabled={isVerifying} className="w-full bg-yellow-500 text-slate-900 font-bold py-4 rounded-2xl hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                            {isVerifying ? "Verifying..." : "Unlock Premium"}
                        </button>
                        <button onClick={() => setStep('PAYMENT')} className="text-slate-500 text-sm">Back</button>
                    </div>
                )}

                {step === 'RESTORE' && (
                    <div className="space-y-6 animate-slide-up">
                        <h2 className="text-2xl font-bold text-white">Restore</h2>
                        <p className="text-slate-400 text-sm">Enter previous Transaction ID or Device ID to restore.</p>
                        <input type="text" placeholder="ID / Code" value={restoreId} onChange={(e) => setRestoreId(e.target.value)} className="w-full bg-slate-800 border border-slate-600 text-white p-4 rounded-2xl text-center font-mono focus:border-blue-500 outline-none" />
                        {error && <p className="text-rose-400 text-xs">{error}</p>}
                        <button onClick={handleRestore} disabled={isVerifying} className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-500 transition-all">
                            {isVerifying ? "Checking..." : "Restore Purchase"}
                        </button>
                        <button onClick={() => setStep('INFO')} className="text-slate-500 text-sm hover:text-white">Cancel</button>
                    </div>
                )}
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;