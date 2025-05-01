
import React, { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown, RotateCcw, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * A component that displays console logs in the UI for debugging
 */
const DebugConsole: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(true);
  const [hasErrors, setHasErrors] = useState(false);
  const [hasNewLogs, setHasNewLogs] = useState(false);
  
  useEffect(() => {
    // Always show debug console in development or on specific domains
    const isDevMode = process.env.NODE_ENV === 'development' || 
                      window.location.hostname === 'localhost' ||
                      window.location.hostname.includes('lovableproject.com');
    
    // Check if debug mode is explicitly enabled
    const debugEnabled = localStorage.getItem('debugConsoleEnabled') === 'true';
    
    setIsVisible(true); // Always make visible for now to help with debugging
    
    // Always restore minimized state from localStorage
    const minimizedState = localStorage.getItem('debugConsoleMinimized') === 'true';
    setIsMinimized(minimizedState);
    
    if (!(isDevMode || debugEnabled)) return;
    
    // Store the original console methods
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error
    };
    
    // Override console methods to capture logs
    console.log = (...args) => {
      originalConsole.log(...args);
      const timestamp = new Date().toLocaleTimeString();
      setHasNewLogs(true);
      setLogs(prev => [...prev, `[${timestamp}] LOG: ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')}`].slice(-100)); // Keep only most recent 100 logs
    };
    
    console.warn = (...args) => {
      originalConsole.warn(...args);
      const timestamp = new Date().toLocaleTimeString();
      setHasNewLogs(true);
      setLogs(prev => [...prev, `[${timestamp}] WARN: ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')}`].slice(-100));
    };
    
    console.error = (...args) => {
      originalConsole.error(...args);
      const timestamp = new Date().toLocaleTimeString();
      setHasErrors(true);
      setHasNewLogs(true);
      setLogs(prev => [...prev, `[${timestamp}] ERROR: ${args.map(arg => 
        arg instanceof Error 
          ? `${arg.name}: ${arg.message}\n${arg.stack}` 
          : typeof arg === 'object' 
            ? JSON.stringify(arg, null, 2) 
            : String(arg)
      ).join(' ')}`].slice(-100));
      setIsMinimized(false); // Auto-expand on errors
    };
    
    // Load any logs from localStorage
    const savedLogs = localStorage.getItem('debugConsoleLogs');
    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Could not load saved logs:", e);
      }
    }
    
    // Force a console message to test
    originalConsole.log("Debug console initialized and ready for logging");
    
    // Restore original console methods on cleanup
    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    };
  }, []);
  
  // Reset hasNewLogs when expanding the console
  useEffect(() => {
    if (!isMinimized) {
      setHasNewLogs(false);
    }
  }, [isMinimized]);
  
  // Save logs to localStorage when they change
  useEffect(() => {
    if (logs.length > 0) {
      localStorage.setItem('debugConsoleLogs', JSON.stringify(logs));
    }
  }, [logs]);
  
  // Save minimized state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('debugConsoleMinimized', isMinimized.toString());
  }, [isMinimized]);
  
  const toggleDebugConsole = () => {
    const newState = !isVisible;
    setIsVisible(newState);
    localStorage.setItem('debugConsoleEnabled', newState.toString());
  };
  
  const clearLogs = () => {
    setLogs([]);
    setHasErrors(false);
    setHasNewLogs(false);
    localStorage.setItem('debugConsoleLogs', JSON.stringify([]));
  };
  
  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'))
      .then(() => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev, `[${timestamp}] LOG: Logs copied to clipboard`]);
      })
      .catch(err => {
        console.error("Could not copy logs:", err);
      });
  };
  
  // Make sure the console is always visible and accessible
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isMinimized ? (
        <Button 
          onClick={() => setIsMinimized(false)}
          variant="outline"
          className={`bg-gray-800 text-white hover:bg-gray-700 flex items-center ${hasErrors ? 'border-red-500' : ''} ${hasNewLogs ? 'animate-pulse' : ''}`}
        >
          <Bug className={`h-4 w-4 mr-2 ${hasErrors ? 'text-red-500' : ''}`} />
          {hasErrors ? 'Show Errors' : 'Debug Console'}
          <span className={`ml-2 ${hasErrors ? 'bg-red-500' : 'bg-blue-500'} text-white rounded-full w-5 h-5 flex items-center justify-center text-xs`}>
            {logs.length > 0 ? (logs.length > 99 ? '99+' : logs.length) : 0}
          </span>
        </Button>
      ) : (
        <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg w-[90vw] md:w-[600px] max-h-[80vh] overflow-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Debug Console</h3>
            <div className="space-x-2 flex">
              <Button variant="ghost" size="sm" onClick={copyLogs} title="Copy logs to clipboard">
                Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={clearLogs} title="Clear logs">
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleDebugConsole} title="Hide console">
                <X className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsMinimized(true)} title="Minimize console">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-2 overflow-auto max-h-[calc(80vh-50px)]">
            {logs.length === 0 ? (
              <p className="text-gray-400 italic">No logs yet</p>
            ) : (
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                {logs.join('\n')}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugConsole;
