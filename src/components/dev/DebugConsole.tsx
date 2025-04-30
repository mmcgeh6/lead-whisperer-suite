
import React, { useState, useEffect } from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * A component that displays console logs in the UI for debugging
 */
const DebugConsole: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true); // Default to visible
  const [isMinimized, setIsMinimized] = useState(false);
  
  useEffect(() => {
    // Always show debug console in development or on specific domains
    const isDevMode = process.env.NODE_ENV === 'development' || 
                      window.location.hostname === 'localhost' ||
                      window.location.hostname.includes('lovableproject.com');
    
    setIsVisible(isDevMode);
    
    if (!isDevMode) return;
    
    // Store the original console methods
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error
    };
    
    // Override console methods to capture logs
    console.log = (...args) => {
      originalConsole.log(...args);
      setLogs(prev => [...prev, `LOG: ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')}`].slice(-100)); // Keep only most recent 100 logs
    };
    
    console.warn = (...args) => {
      originalConsole.warn(...args);
      setLogs(prev => [...prev, `WARN: ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')}`].slice(-100));
    };
    
    console.error = (...args) => {
      originalConsole.error(...args);
      setLogs(prev => [...prev, `ERROR: ${args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
      ).join(' ')}`].slice(-100));
    };
    
    // Load any logs from localStorage
    const savedLogs = localStorage.getItem('debugConsoleLogs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
    
    // Restore original console methods on cleanup
    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    };
  }, []);
  
  // Save logs to localStorage when they change
  useEffect(() => {
    if (logs.length > 0) {
      localStorage.setItem('debugConsoleLogs', JSON.stringify(logs));
    }
  }, [logs]);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isMinimized ? (
        <Button 
          onClick={() => setIsMinimized(false)}
          variant="outline"
          className="bg-gray-800 text-white hover:bg-gray-700 flex items-center"
        >
          <ChevronUp className="h-4 w-4 mr-2" />
          Show Debug Logs
          <span className="ml-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {logs.length > 0 ? (logs.length > 99 ? '99+' : logs.length) : 0}
          </span>
        </Button>
      ) : (
        <div className="bg-gray-800 text-white p-4 rounded-lg shadow-lg w-[600px] max-h-[500px] overflow-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Debug Console</h3>
            <div className="space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setLogs([])}>
                Clear
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsMinimized(true)}>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-2">
            {logs.length === 0 ? (
              <p className="text-gray-400 italic">No logs yet</p>
            ) : (
              <pre className="text-xs font-mono whitespace-pre-wrap">
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
