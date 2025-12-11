// Kopia av GlosaSearch.tsx från src/components
// Hanterar svenska input, sökord och sökfunktion

import React, { useState } from 'react';
import Loader from '../../src/components/Loader';

const GlosaSearch = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [glosaResult, setGlosaResult] = useState('');
  const [debugInput, setDebugInput] = useState('');

  const handleGlosa = async () => {
    setIsLoading(true);
    setGlosaResult('');
    setError('');
    setDebugInput(input);
    try {
      const { offlineEngine } = await import('../../src/modules/sts-glossing/offlineGlosaEngine');
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

  // Sökfunktion kan anpassas eller lämnas tom om lexikon ej behövs
  const handleSearch = async () => {
    setIsLoading(true);
    setError('');
    setResult(null);
    // Här kan du lägga till söklogik om du vill
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
            <h3>{result.word}</h3>
            {result.id && (
              <div style={{ color: '#666', fontSize: '0.95em' }}>
                ID: {result.id}
              </div>
            )}
          </div>
        )}
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
