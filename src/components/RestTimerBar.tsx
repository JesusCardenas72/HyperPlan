import React, { useState, useEffect } from 'react';
import { cn } from '../lib/utils';

interface RestTimerBarProps {
  duration: number; // seconds
  onDurationChange: (newDuration: number) => void;
  fontSize: number; // pixels
  autoStart?: boolean;
  onComplete?: () => void;
}

export const RestTimerBar: React.FC<RestTimerBarProps> = ({ duration, onDurationChange, fontSize, autoStart = false, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(autoStart);

  useEffect(() => {
    setTimeLeft(duration);
    setIsActive(autoStart);
  }, [duration, autoStart]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      if (onComplete) {
        onComplete();
      }
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft, onComplete]);

  const [showKeypad, setShowKeypad] = useState(false);
  const [keypadValue, setKeypadValue] = useState('');

  const progress = duration > 0 ? (timeLeft / duration) * 100 : 0;

  const handleKeypadSubmit = () => {
    if (keypadValue.length > 0) {
      let seconds = 0;
      if (keypadValue.length <= 2) {
        seconds = parseInt(keypadValue);
      } else {
        const s = parseInt(keypadValue.slice(-2));
        const m = parseInt(keypadValue.slice(0, -2));
        seconds = m * 60 + s;
      }
      if (!isNaN(seconds)) {
        onDurationChange(seconds);
        setTimeLeft(seconds);
      }
    }
    setShowKeypad(false);
    setKeypadValue('');
  };

  const handleKeyPress = (num: string) => {
    if (keypadValue.length < 4) {
      setKeypadValue(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    setKeypadValue(prev => prev.slice(0, -1));
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeStr = mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;

  // Format keypad value for display (e.g., 230 -> 2'30")
  const formatKeypadDisplay = (val: string) => {
    if (!val) return "00'00\"";
    if (val.length <= 2) return `00'${val.padStart(2, '0')}"`;
    const s = val.slice(-2);
    const m = val.slice(0, -2);
    return `${m.padStart(2, '0')}'${s.padStart(2, '0')}"`;
  };

  return (
    <>
      <div 
        className="w-full bg-black/10 rounded-full overflow-hidden cursor-pointer relative"
        style={{ height: `${Math.max(fontSize, 20)}px` }}
        onClick={() => setShowKeypad(true)}
      >
        <div 
          className={cn("h-full transition-all duration-1000 ease-linear", isActive ? "bg-blue-400" : "bg-teal-brand")}
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white drop-shadow-md pointer-events-none">
          {timeStr}
        </div>
      </div>

      {showKeypad && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Ajustar Descanso</h3>
              <button onClick={() => setShowKeypad(false)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>

            <div className="bg-gray-100 rounded-2xl p-4 mb-6 text-center">
              <div className="text-4xl font-black text-teal-brand font-mono">
                {formatKeypadDisplay(keypadValue)}
              </div>
              <div className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-wider">Minutos' Segundos"</div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => handleKeyPress(num.toString())}
                  className="h-16 rounded-xl bg-gray-50 hover:bg-gray-100 text-2xl font-bold text-gray-800 transition-colors active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={handleBackspace}
                className="h-16 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
              </button>
              <button
                onClick={() => handleKeyPress('0')}
                className="h-16 rounded-xl bg-gray-50 hover:bg-gray-100 text-2xl font-bold text-gray-800 transition-colors active:scale-95"
              >
                0
              </button>
              <button
                onClick={handleKeypadSubmit}
                className="h-16 rounded-xl bg-teal-brand hover:bg-teal-600 text-white flex items-center justify-center transition-colors active:scale-95"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              </button>
            </div>

            <button
              onClick={handleKeypadSubmit}
              className="w-full py-4 bg-teal-brand text-white rounded-xl font-bold text-lg shadow-lg shadow-teal-brand/20 hover:bg-teal-600 transition-colors"
            >
              Confirmar Tiempo
            </button>
          </div>
        </div>
      )}
    </>
  );
};
