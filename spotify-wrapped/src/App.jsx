import { useState, useEffect, useRef } from 'react';
import { redirectToSpotifyAuth, getAccessToken } from './spotifyAuth';

function App() {
  //UseState is dynamic React memory which reloads page after the state changes
  const [token, setToken] = useState(null);
  //Avoiding bad request caused by using the same code twice
  const hasFetchedToken = useRef(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');

    if (hasFetchedToken.current || !authCode) return;

    hasFetchedToken.current = true;

    window.history.pushState({}, document.title, "/");

    const fetchToken = async () => {
      try {
        const accessToken = await getAccessToken(authCode);
        setToken(accessToken);
      } catch (error) {
        console.error("Błąd podczas pobierania tokenu:", error);
      }
    };

    fetchToken();
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Spotify Wrapped Clone</h1>
      
      {!token ? (
        <div>
          <p>Najpierw musisz połączyć się ze swoim kontem Spotify</p>
          <button 
            onClick={redirectToSpotifyAuth}
            style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
          >
            Zaloguj przez Spotify
          </button>
        </div>
      ) : (
        <div style={{ color: 'green' }}>
          <h2>🎉 Sukces! Połączono ze Spotify.</h2>
          <p>Twój Access Token został wygenerowany pomyślnie.</p>
          <div style={{ 
            background: '#f0f0f0', 
            padding: '10px', 
            borderRadius: '5px', 
            wordBreak: 'break-all',
            fontFamily: 'monospace',
            maxWidth: '600px',
            margin: '20px auto'
          }}>
            <strong>Twój Token:</strong> {token}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;