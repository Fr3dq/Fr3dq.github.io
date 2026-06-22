import { redirectToSpotifyAuth } from './spotifyAuth';

function App() {
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Spotify Wrapped Clone</h1>
      <p>Najpierw musisz połączyć się ze swoim kontem Spotify.</p>
      
      {}
      <button 
        onClick={redirectToSpotifyAuth}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
      >
        Zaloguj przez Spotify
      </button>
    </div>
  );
}

export default App;