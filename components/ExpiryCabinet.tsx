
import React, { useState } from 'react';
import { CabinetItem } from '../types';

interface ExpiryCabinetProps {
  items: CabinetItem[];
  onDeleteItem: (id: string) => void;
  onClearExpired: () => void;
}

const ExpiryCabinet: React.FC<ExpiryCabinetProps> = ({ items, onDeleteItem, onClearExpired }) => {
  const [filter, setFilter] = useState<'all' | 'expired' | 'safe'>('all');

  const getDaysRemaining = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  const getStatusColor = (days: number) => {
    if (days < 0) return 'bg-rose-50 border-rose-100 text-rose-600'; // Expired
    if (days <= 7) return 'bg-orange-50 border-orange-100 text-orange-600'; // Critical (1 week)
    if (days <= 30) return 'bg-amber-50 border-amber-100 text-amber-600'; // Warning
    return 'bg-emerald-50 border-emerald-100 text-emerald-600'; // Safe
  };

  const sortedItems = [...items].sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  
  const filteredItems = sortedItems.filter(item => {
      const days = getDaysRemaining(item.expiryDate);
      if (filter === 'expired') return days < 0;
      if (filter === 'safe') return days >= 0;
      return true;
  });

  const expiredCount = items.filter(i => getDaysRemaining(i.expiryDate) < 0).length;

  return (
    <div className="p-8 pb-40 animate-fade-in max-w-lg mx-auto bg-slate-50 min-h-screen">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tighter">My Cabinet</h2>
          <p className="text-teal-600 text-[10px] font-black uppercase tracking-[0.4em] mt-2 opacity-60">Expiry Tracker</p>
        </div>
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
             <span className="text-2xl">💊</span>
        </div>
      </div>

      {expiredCount > 0 && (
          <div className="bg-rose-500 text-white p-5 rounded-[2rem] shadow-xl shadow-rose-500/20 mb-8 flex justify-between items-center animate-pulse-soft">
              <div>
                  <h3 className="font-black text-lg tracking-tight">Warning: Toxic Meds!</h3>
                  <p className="text-rose-100 text-xs font-bold mt-1">{expiredCount} medicines have expired.</p>
              </div>
              <button 
                onClick={onClearExpired}
                className="bg-white text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-colors"
              >
                  Clean Up
              </button>
          </div>
      )}

      {/* Filter Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 mb-6">
          {(['all', 'safe', 'expired'] as const).map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  {f}
              </button>
          ))}
      </div>

      <div className="space-y-4">
          {filteredItems.map(item => {
              const days = getDaysRemaining(item.expiryDate);
              const isExpired = days < 0;
              const isCritical = days >= 0 && days <= 7;
              
              return (
                <div key={item.id} className={`bg-white p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border flex items-center justify-between group relative overflow-hidden ${getStatusColor(days).replace('text-', 'border-')}`}>
                    {/* Status Indicator Bar */}
                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${getStatusColor(days).replace('border-', 'bg-').split(' ')[0]}`}></div>
                    
                    <div className="pl-4">
                        <h3 className="font-black text-slate-800 text-lg leading-none">{item.medicineName}</h3>
                        <p className={`text-[10px] font-bold mt-2 uppercase tracking-widest ${getStatusColor(days).split(' ').pop()}`}>
                            {isExpired ? `Expired ${Math.abs(days)} days ago` : isCritical ? `Expires in ${days} days!` : `Expires in ${days} days`}
                        </p>
                        <p className="text-[9px] text-slate-300 font-bold mt-1">
                             EXP: {new Date(item.expiryDate).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="flex flex-col items-center justify-center space-y-2">
                        {isExpired || isCritical ? (
                            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-xl animate-bounce">
                                🗑️
                            </div>
                        ) : (
                            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-xl">
                                ✅
                            </div>
                        )}
                        <button 
                            onClick={() => onDeleteItem(item.id)}
                            className="text-slate-300 hover:text-rose-500 transition-colors p-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>
              );
          })}

          {filteredItems.length === 0 && (
              <div className="text-center py-20 opacity-40">
                  <div className="text-6xl mb-4">🩺</div>
                  <h3 className="font-black text-slate-900 text-xl">Cabinet Empty</h3>
                  <p className="text-xs text-slate-500 mt-2">Scan medicines to track expiry.</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default ExpiryCabinet;
