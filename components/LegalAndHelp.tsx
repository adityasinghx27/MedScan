import React, { useState } from 'react';

type Tab = 'FAQ' | 'PRIVACY' | 'TERMS';

const LegalAndHelp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('FAQ');

  const handleShare = async () => {
      const shareData = {
          title: 'MediScan AI',
          text: 'Help your family take medicines on time ❤️. Identify medicines and set voice reminders with MediScan AI.',
          url: window.location.href
      };
      try {
          if (navigator.share) await navigator.share(shareData);
          else alert("Link copied to clipboard!");
      } catch (e) {}
  };

  return (
    <div className="p-6 pb-24 animate-fade-in-up">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Help & Legal</h2>

      {/* Share Card */}
      <div className="bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl p-5 text-white shadow-lg mb-8 relative overflow-hidden">
         <div className="relative z-10">
             <h3 className="font-bold text-lg mb-1">Share with Family ❤️</h3>
             <p className="text-teal-100 text-sm mb-3">Help your parents or grandparents take medicines safely.</p>
             <button 
                onClick={handleShare}
                className="bg-white text-teal-700 px-4 py-2 rounded-lg font-bold text-sm shadow-md hover:bg-gray-100"
             >
                 Share App Link
             </button>
         </div>
         <div className="absolute -right-4 -bottom-4 opacity-20 text-8xl">🏥</div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b border-gray-200">
          {(['FAQ', 'PRIVACY', 'TERMS'] as Tab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-2 text-sm font-bold transition-colors ${activeTab === tab ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-400'}`}
              >
                  {tab === 'PRIVACY' ? 'Privacy' : tab === 'TERMS' ? 'Terms' : 'FAQ'}
              </button>
          ))}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 min-h-[300px]">
          
          {activeTab === 'FAQ' && (
              <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-3">
                      <h4 className="font-bold text-gray-800 text-sm">Is this app safe?</h4>
                      <p className="text-gray-600 text-xs mt-1">Yes. We use advanced AI to analyze medicine labels. However, AI can make mistakes, so always verify with a doctor.</p>
                  </div>
                  <div className="border-b border-gray-100 pb-3">
                      <h4 className="font-bold text-gray-800 text-sm">Is this free?</h4>
                      <p className="text-gray-600 text-xs mt-1">Scanning and basic alarms are free. Detailed side effects and voice features require a small one-time premium fee.</p>
                  </div>
                  <div className="border-b border-gray-100 pb-3">
                      <h4 className="font-bold text-gray-800 text-sm">Does this replace a doctor? ❌</h4>
                      <p className="text-gray-600 text-xs mt-1">No. This app is an information aid only. Never ignore professional medical advice because of something you read on this app.</p>
                  </div>
              </div>
          )}

          {activeTab === 'PRIVACY' && (
              <div className="text-xs text-gray-600 space-y-3 leading-relaxed">
                  <h4 className="font-bold text-gray-900">Privacy Policy</h4>
                  <p><strong>1. Data Collection:</strong> We collect images you upload solely for the purpose of analyzing medicine data. We do not store these images permanently on our servers.</p>
                  <p><strong>2. Local Storage:</strong> Your reminders and profile settings are stored locally on your device.</p>
                  <p><strong>3. Third Party:</strong> We use Google Gemini API for analysis. Data sent to the API is subject to Google's privacy terms.</p>
                  <p className="font-bold text-teal-600">🛡️ Your health data is private.</p>
              </div>
          )}

          {activeTab === 'TERMS' && (
              <div className="text-xs text-gray-600 space-y-3 leading-relaxed">
                  <h4 className="font-bold text-gray-900">Terms of Service</h4>
                  <p><strong>1. Disclaimer:</strong> MediScan AI provides information for educational purposes only. It is not a substitute for professional medical advice, diagnosis, or treatment.</p>
                  <p><strong>2. Accuracy:</strong> While we strive for accuracy, medicine packaging varies. The developers are not liable for any errors or misuse of medication.</p>
                  <p><strong>3. Emergency:</strong> In case of a medical emergency, call your local emergency number immediately.</p>
              </div>
          )}
      </div>

      <div className="mt-8 text-center">
          <p className="text-[10px] text-gray-400">
              MediScan AI v1.0.0 <br/>
              Made with ❤️ for safety.
          </p>
      </div>

    </div>
  );
};

export default LegalAndHelp;