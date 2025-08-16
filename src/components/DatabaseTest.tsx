import React, { useState, useEffect } from 'react';
import { testDatabaseConnection } from '../services/authService';
import { supabase } from '../lib/supabase';

export const DatabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'failed'>('testing');
  const [showCount, setShowCount] = useState<number | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Debug environment variables
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        setDebugInfo(`URL: ${url ? 'Set' : 'Missing'}, Key: ${key ? 'Set' : 'Missing'}`);
        
        if (!url || !key) {
          setConnectionStatus('failed');
          return;
        }
        
        // Test basic connection
        const isConnected = await testDatabaseConnection();
        
        if (isConnected) {
          // Get show count
          const { data, error } = await supabase
            .from('tbl_show_queue')
            .select('id', { count: 'exact' });
          
          if (!error) {
            setShowCount(data?.length || 0);
            setConnectionStatus('connected');
          } else {
            console.error('Error counting shows:', error);
            setDebugInfo(prev => `${prev} - DB Error: ${error.message}`);
            setConnectionStatus('failed');
          }
        } else {
          setConnectionStatus('failed');
        }
      } catch (error) {
        console.error('Connection test failed:', error);
        setDebugInfo(prev => `${prev} - Exception: ${error}`);
        setConnectionStatus('failed');
      }
    };

    testConnection();
  }, []);

  return (
    <div style={{ 
      padding: '1rem', 
      margin: '1rem', 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Database Connection Test</h3>
      
      {connectionStatus === 'testing' && (
        <p style={{ color: 'blue' }}>🔄 Testing connection...</p>
      )}
      
      {connectionStatus === 'connected' && (
        <div>
          <p style={{ color: 'green' }}>✅ Database connected successfully!</p>
          <p>Found {showCount} show(s) in tbl_show_queue</p>
        </div>
      )}
      
      {connectionStatus === 'failed' && (
        <div>
          <p style={{ color: 'red' }}>❌ Database connection failed</p>
          <p>Check your .env file and Supabase credentials</p>
          <p style={{ fontSize: '0.8rem', color: '#666' }}>Debug: {debugInfo}</p>
        </div>
      )}
    </div>
  );
};