
import React from 'react';
import { ScanHistoryItem, MedicineData } from '../types';

interface HistoryProps {
  history: ScanHistoryItem[];
  onSelectItem: (data: MedicineData) => void;
  onClearHistory: () => void;
}

const History: React.FC<HistoryProps> = ({ history, onSelectItem, onClearHistory }) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getRiskColor = (score: string) => {
    switch (score) {
      case 'High': return 'text-rose-500 bg-rose-50 border-rose-100';
      case 'Medium': return 'text-amber-500 bg-amber-50 border-amber-100';
      default: return 'text-teal-600 bg-teal-50 border-teal-100';
    }
  };

  return (
    <div className="p-8 pb-40 animate-fade-in max-w-lg mx-auto">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tighter">History</h2>
          <p className="text-indigo-600 text-[10px] font-black uppercase tracking-[0.4em] mt-2 opacity-60">Past Analysis</p>
        </div>
        {history.length > 0 && (
          <button 
            onClick={() => confirm("Clear all history?") && onClearHistory()}
            className="text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-600 transition-colors bg-rose-50 px-4 py-2 rounded-xl"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectItem(item.data)}
            className="w-full text-left bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-50 flex items-center justify-between group active:scale-95 transition-all"
          >
            <div className="flex items-center space-x-5">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-50 transition-colors">
                📦
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg leading-tight tracking-tight">{item.medicineName}</h3>
                <div className="flex items-center mt-1.5 space-x-3">
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${getRiskColor(item.data.riskScore)}`}>
                    {item.data.riskScore} Risk
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">{formatDate(item.timestamp)}</span>
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        ))}

        {history.length === 0 && (
          <div className="text-center py-32 opacity-40">
            <div className="w-32 h-32 bg-white rounded-[3.5rem] flex items-center justify-center mx-auto mb-8 text-slate-100 shadow-xl border border-slate-50">
               <svg className="w-14 h-14 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-slate-900 font-black text-2xl tracking-tighter">No Scans Yet</h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Start by scanning a medicine box</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
