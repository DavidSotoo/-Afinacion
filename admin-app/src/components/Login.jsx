import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, AlertCircle, Eye, EyeOff, Delete, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login, loading } = useAuth();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // Focus the input automatically on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    
    if (!pin) {
      setError('Por favor, ingresa el PIN del negocio.');
      return;
    }

    const result = await login(pin);
    if (!result.success) {
      setError(result.message);
      setPin(''); // Clear PIN on error
    }
  };

  const handleKeyPress = (num) => {
    if (pin.length < 8) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  // Listen to keyboard press to trigger submission on Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex items-center justify-center p-4 overflow-hidden relative w-full">
      
      {/* Background neon ambient orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[130px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-500/10 blur-[130px] animate-pulse-slow pointer-events-none" />

      <div className="w-full max-w-md glass-panel rounded-3xl shadow-2xl p-8 relative overflow-hidden border border-slate-800/80 z-10 transition-all duration-300">
        
        {/* Top brand line gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-600 via-violet-500 to-violet-700" />

        {/* Brand / Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/25 flex items-center justify-center text-violet-500 mb-4 shadow-inner animate-float">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-wider text-white">
            +AFINACIÓN
          </h2>
          <p className="text-xs text-slate-400 font-medium tracking-wide uppercase mt-1.5">
            Consola de Control Local
          </p>
        </div>

        {/* Hidden Input to capture keystrokes */}
        <input
          ref={inputRef}
          type={showPin ? 'text' : 'password'}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
          onKeyDown={handleKeyDown}
          className="absolute opacity-0 pointer-events-none w-0 h-0"
          disabled={loading}
          autoFocus
        />

        <div className="space-y-6">
          {/* PIN Indicators Display */}
          <div 
            onClick={() => inputRef.current && inputRef.current.focus()}
            className="cursor-pointer space-y-3"
          >
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 text-center block">
              PIN de Acceso Interno
            </label>
            
            {/* Visual Dot Indicators */}
            <div className="flex items-center justify-center gap-4 py-3">
              {[...Array(6)].map((_, index) => {
                const isFilled = pin.length > index;
                const isCurrent = pin.length === index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                      isFilled
                        ? 'bg-violet-500 border-violet-400 shadow-md shadow-violet-500/30 scale-110'
                        : isCurrent
                        ? 'bg-slate-900 border-violet-500 animate-pulse scale-105'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  />
                );
              })}
            </div>
            
            {/* Plain text characters display (blurred/secure or peekable) */}
            <div className="h-6 flex items-center justify-center text-xs text-slate-500 font-mono">
              {pin.length > 0 ? (
                <div className="flex items-center gap-1">
                  <span>{showPin ? pin : '•'.repeat(pin.length)}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPin(!showPin);
                    }}
                    className="text-slate-500 hover:text-slate-300 ml-1.5 transition-colors"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <span className="text-slate-600 italic">Escribe o usa el teclado en pantalla</span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2.5 text-xs text-red-400 bg-red-500/5 border border-red-500/10 rounded-2xl p-3.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {/* Premium Screen Keypad (1 to 9, Clear, 0, Backspace) */}
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num.toString())}
                disabled={loading}
                className="h-14 rounded-2xl bg-slate-900/60 hover:bg-slate-800 active:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 text-lg font-bold text-white transition-all select-none cursor-pointer flex items-center justify-center active:scale-95 disabled:opacity-50"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              disabled={loading || pin.length === 0}
              className="h-14 rounded-2xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center select-none active:scale-95 disabled:opacity-30"
            >
              LIMPIAR
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              disabled={loading}
              className="h-14 rounded-2xl bg-slate-900/60 hover:bg-slate-850 active:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 text-lg font-bold text-white transition-all select-none cursor-pointer flex items-center justify-center active:scale-95 disabled:opacity-50"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              disabled={loading || pin.length === 0}
              className="h-14 rounded-2xl text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center justify-center select-none active:scale-95 disabled:opacity-30"
              title="Borrar"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => handleSubmit()}
            disabled={loading || pin.length === 0}
            className="w-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:bg-slate-800/50 disabled:text-slate-500 text-white font-semibold py-3.5 px-4 rounded-2xl transition-all duration-200 shadow-lg shadow-violet-600/15 flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Ingresar al Panel</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center border-t border-slate-800/60 pt-6">
          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            Consola Local del Establecimiento · v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
}
