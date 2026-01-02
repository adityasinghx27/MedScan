import React, { useState } from 'react';
import { FamilyMember, AgeGroup, Gender, Language } from '../types';

interface ProfileProps {
  isPremium: boolean;
  familyMembers: FamilyMember[];
  setFamilyMembers: (members: FamilyMember[]) => void;
}

const Profile: React.FC<ProfileProps> = ({ isPremium, familyMembers, setFamilyMembers }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState<AgeGroup>('adult');
  const [newGender, setNewGender] = useState<Gender>('male');
  const [newLang, setNewLang] = useState<Language>('english');

  const addMember = () => {
    if (!newName) return;
    const avatars = ['🧑', '👧', '👶', '👵', '👴', '👲'];
    const newMember: FamilyMember = {
      id: crypto.randomUUID(),
      name: newName,
      ageGroup: newAge,
      gender: newGender,
      isPregnant: false,
      isBreastfeeding: false,
      language: newLang,
      avatar: avatars[Math.floor(Math.random() * avatars.length)]
    };
    setFamilyMembers([...familyMembers, newMember]);
    setShowAddModal(false);
    setNewName('');
  };

  const removeMember = (id: string) => {
    if (id === 'me') return;
    if (confirm("Remove this profile?")) {
      setFamilyMembers(familyMembers.filter(m => m.id !== id));
    }
  };

  return (
    <div className="p-6 pb-24 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Health Profile</h2>

        <div className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 mb-8 text-center relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-28 bg-gradient-to-r ${isPremium ? 'from-yellow-400 to-orange-500' : 'from-teal-500 to-emerald-600'}`}></div>
            <div className="relative z-10 -mt-2">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg mx-auto bg-gray-200 flex items-center justify-center text-3xl">
                    👤 {isPremium && <span className="absolute -bottom-2 -right-2 text-2xl">👑</span>}
                </div>
                <h3 className="text-xl font-bold mt-3 text-gray-800">Guest User</h3>
                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-gray-100 text-gray-500 font-bold text-sm mt-4">
                     <span>{isPremium ? 'Premium Plan' : 'Free Plan'}</span>
                </div>
            </div>
        </div>

        <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">Family Profiles</h4>
              <button onClick={() => setShowAddModal(true)} className="text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100">+ Add</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {familyMembers.map(member => (
                <div key={member.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative group">
                  <div className="text-3xl mb-2">{member.avatar}</div>
                  <h5 className="font-bold text-slate-800 text-sm truncate">{member.name}</h5>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">{member.ageGroup} • {member.gender}</p>
                  {member.id !== 'me' && (
                    <button onClick={() => removeMember(member.id)} className="absolute top-2 right-2 p-1 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
        </div>

        {showAddModal && (
          <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-slide-up">
              <h3 className="text-xl font-black text-slate-900 mb-6">New Profile</h3>
              <div className="space-y-6">
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Grandma" className="w-full bg-slate-50 p-4 rounded-xl border border-slate-100 font-bold" />
                <div className="grid grid-cols-2 gap-4">
                  <select value={newAge} onChange={(e) => setNewAge(e.target.value as AgeGroup)} className="bg-slate-50 p-4 rounded-xl font-bold">
                    <option value="child">Child</option><option value="adult">Adult</option><option value="senior">Senior</option>
                  </select>
                  <select value={newGender} onChange={(e) => setNewGender(e.target.value as Gender)} className="bg-slate-50 p-4 rounded-xl font-bold">
                    <option value="male">Male</option><option value="female">Female</option>
                  </select>
                </div>
                <div className="flex space-x-3 pt-4">
                  <button onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase">Cancel</button>
                  <button onClick={addMember} className="flex-[2] bg-teal-600 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-teal-600/20">Save</button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default Profile;