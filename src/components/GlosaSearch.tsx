import React, { useState } from 'react';
import Loader from './Loader';

// Ladda in genuina_tecken.json (kräver att du använder t.ex. import assertion eller fetch beroende på setup)
// Här används dynamisk import för enkelhet

const GlosaSearch = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [glosaResult, setGlosaResult] = useState('');
  // Glosa-knappens logik
  const [debugInput, setDebugInput] = useState('');
  const handleGlosa = async () => {
    setIsLoading(true);
    setGlosaResult('');
    setError('');
    setDebugInput(input); // Spara vad som skickas till glossningsmotorn
    try {
      const { offlineEngine } = await import('../modules/sts-glossing/offlineGlosaEngine');
      if (offlineEngine.initializeLists) {
        await offlineEngine.initializeLists();
      }
      const glossed = offlineEngine.translateToGlosaOffline(input);
      setGlosaResult(glossed);
    } catch (e) {
      setError('Fel vid glossning.');
    }
    setIsLoading(false);
  };

  const handleSearch = async () => {
    setIsLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await fetch('/data/glosa/god_glossing.json').then(res => res.json());
      // Om filen har genuinaTecken, använd den
      const teckenData = data.genuinaTecken || [];
      // Sök på tecken eller synonymer (case-insensitive)
      const match = teckenData.find(entry => {
        if (!entry.tecken) return false;
        const all = [entry.tecken, ...(entry.synonymer || [])].map(s => s.toLowerCase());
        return all.some(s => s.includes(input.toLowerCase()));
      });
      setResult(match || null);
      if (!match) setError('Ingen träff på genuina tecken.');
    } catch (e) {
      setError('Fel vid sökning.');
    }
    setIsLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: '2em auto', textAlign: 'center' }}>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Skriv tecken eller synonym..."
        style={{ padding: '0.5em', width: '70%' }}
      />
      <button onClick={handleSearch} style={{ marginLeft: 8, padding: '0.5em 1em' }}>Sök</button>
      <button onClick={handleGlosa} style={{ marginLeft: 8, padding: '0.5em 1em', background: '#e0e0ff' }}>Glosa</button>
      <div style={{ margin: '2em 0' }}>
        {isLoading && <Loader />}
        {result && !isLoading && (
          <div style={{ marginTop: 16 }}>
            <h3>{result.tecken}</h3>
            {result.synonymer && result.synonymer.length > 0 && (
              <div style={{ color: '#666', fontSize: '0.95em' }}>
                Synonymer: {result.synonymer.join(', ')}
              </div>
            )}
            {result.video && (
              <video src={result.video} controls style={{ marginTop: 16, maxWidth: '100%' }} />
            )}
          </div>
        )}
        {/* Visa glossningsresultat */}
        {/* Debug: visa input som skickas till glossningsmotorn */}
        {debugInput && !isLoading && (
          <div style={{ marginTop: 8, color: '#888', fontSize: '0.9em' }}>
            <div><b>Debug input till glossning:</b> "{debugInput}"</div>
          </div>
        )}
        {!isLoading && (
          <div style={{ marginTop: 16, color: glosaResult ? '#2a2' : '#a22', fontWeight: 'bold' }}>
            <div>Glossning:</div>
            <div>{glosaResult ? glosaResult : 'Ingen glossning kunde genereras.'}</div>
          </div>
        )}
        {error && !isLoading && <div style={{ color: 'red', marginTop: 16 }}>{error}</div>}
      </div>
    </div>
  );
};

export default GlosaSearch;
