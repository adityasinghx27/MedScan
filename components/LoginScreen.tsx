import React from 'react';

interface LoginScreenProps {
  onLogin: () => void;
  onGuest: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onGuest }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between relative overflow-hidden animate-fade-in">
      
      {/* Background Ambience */}
      <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[60%] rounded-full bg-gradient-to-br from-teal-400/20 to-emerald-400/20 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] rounded-full bg-gradient-to-tr from-indigo-400/20 to-blue-400/20 blur-[80px] pointer-events-none"></div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10 pt-12">
        {/* Logo / Icon */}
        <div className="w-28 h-28 bg-white rounded-[2.5rem] shadow-2xl shadow-teal-900/10 flex items-center justify-center mb-8 animate-float">
            <div className="text-6xl">💊</div>
        </div>

        <div className="text-center space-y-3 mb-12">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tighter">MedScan</h1>
            <p className="text-slate-500 font-medium text-sm max-w-[240px] mx-auto leading-relaxed">
                Your personal AI pharmacist for safe and smart medication.
            </p>
        </div>

        {/* Login Options */}
        <div className="w-full max-w-xs space-y-4">
            <button 
                onClick={onLogin}
                className="w-full bg-slate-900 text-white py-4 px-6 rounded-2xl font-bold text-sm shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center space-x-3 group"
            >
                <div className="bg-white p-1 rounded-full">
                    <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                </div>
                <span>Continue with Google</span>
            </button>
            
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button 
                onClick={onGuest}
                className="w-full bg-white text-slate-600 py-4 px-6 rounded-2xl font-bold text-sm border border-slate-100 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
            >
                Continue as Guest
            </button>
        </div>
      </div>

      <div className="p-8 pb-10 text-center relative z-10">
          <p className="text-[10px] text-slate-400 font-medium max-w-xs mx-auto">
              By continuing, you agree to our Terms of Service. <br/>
              Your health data is stored locally.
          </p>
      </div>
    </div>
  );
};

export default LoginScreen;