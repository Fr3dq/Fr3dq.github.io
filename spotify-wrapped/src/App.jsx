import { useState, useEffect, useRef } from 'react';
import { redirectToSpotifyAuth, getAccessToken } from './spotifyAuth';

// Helper: ms -> "3:45"
const formatDuration = (ms) => {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

// Helper: 1234567 -> "1 234 567"
const formatNumber = (n) =>
  (n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

const TIME_RANGES = [
  { key: 'short_term', label: 'Ostatnie 4 tygodnie' },
  { key: 'medium_term', label: 'Ostatnie 6 miesięcy' },
  { key: 'long_term', label: 'Cały czas' },
];

function App() {
  const [token, setToken] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [topTracks, setTopTracks] = useState([]);
  const [topArtists, setTopArtists] = useState([]);

  const [activeTab, setActiveTab] = useState('tracks');
  const [timeRange, setTimeRange] = useState('medium_term');
  const [loading, setLoading] = useState(false);

  const hasFetchedToken = useRef(false);

  // 1. EFEKT: Pobieranie tokenu
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');

    if (hasFetchedToken.current || !authCode) return;
    hasFetchedToken.current = true;
    window.history.pushState({}, document.title, '/');

    const fetchToken = async () => {
      try {
        const accessToken = await getAccessToken(authCode);
        setToken(accessToken);
      } catch (error) {
        console.error('Błąd podczas pobierania tokenu:', error);
      }
    };

    fetchToken();
  }, []);

  // 2. EFEKT: Pobieranie danych — reaguje też na zmianę zakresu czasu
  useEffect(() => {
    if (!token) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [profileRes, tracksRes, artistsRes] = await Promise.all([
          fetch('https://api.spotify.com/v1/me', { headers }),
          fetch(
            `https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=${timeRange}`,
            { headers }
          ),
          fetch(
            `https://api.spotify.com/v1/me/top/artists?limit=20&time_range=${timeRange}`,
            { headers }
          ),
        ]);

        const profileJson = await profileRes.json();
        const tracksJson = await tracksRes.json();
        const artistsJson = await artistsRes.json();

        setUserProfile(profileJson);
        setTopTracks(tracksJson.items || []);
        setTopArtists(artistsJson.items || []);
      } catch (error) {
        console.error('Błąd podczas pobierania danych muzycznych:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [token, timeRange]);

  // Drobna statystyka: łączny czas trwania top utworów
  const totalMs = topTracks.reduce((sum, t) => sum + (t.duration_ms || 0), 0);
  const totalMinutes = Math.round(totalMs / 60000);

  return (
    <div
      style={{
        padding: '20px 10px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: 'linear-gradient(180deg, #1a1a1a 0%, #121212 300px)',
        color: 'white',
        minHeight: '100vh',
      }}
    >
      {/* ----------------- EKRAN LOGOWANIA ----------------- */}
      {!token ? (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <h1 style={{ color: '#1DB954', fontSize: '3rem', marginBottom: '10px' }}>
            Spotify Wrapped
          </h1>
          <p style={{ color: '#b3b3b3', fontSize: '1.2rem' }}>
            Odkryj swoje muzyczne podsumowanie
          </p>
          <button
            onClick={redirectToSpotifyAuth}
            style={{
              padding: '16px 40px',
              fontSize: '16px',
              cursor: 'pointer',
              backgroundColor: '#1DB954',
              color: 'white',
              border: 'none',
              borderRadius: '30px',
              fontWeight: 'bold',
              marginTop: '30px',
              boxShadow: '0 4px 20px rgba(29, 185, 84, 0.4)',
            }}
          >
            Połącz ze Spotify
          </button>
        </div>
      ) : (
        // ----------------- GŁÓWNY PANEL -----------------
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {/* Nagłówek z mini-profilem */}
          <header
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px',
              borderBottom: '1px solid #282828',
              paddingBottom: '20px',
            }}
          >
            <h1 style={{ color: '#1DB954', margin: 0 }}>My Wrapped</h1>
            {userProfile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={userProfile.images?.[0]?.url || 'https://via.placeholder.com/150'}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                  alt="avatar"
                />
                <span style={{ fontWeight: 'bold' }}>{userProfile.display_name}</span>
              </div>
            )}
          </header>

          {/* PRZEŁĄCZNIK ZAKRESU CZASU */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '20px',
              flexWrap: 'wrap',
            }}
          >
            {TIME_RANGES.map((range) => (
              <button
                key={range.key}
                onClick={() => setTimeRange(range.key)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '16px',
                  border: '1px solid #404040',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  backgroundColor: timeRange === range.key ? '#fff' : 'transparent',
                  color: timeRange === range.key ? '#121212' : '#b3b3b3',
                  transition: 'all 0.2s',
                }}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* NAWIGACJA (TABS) */}
          <nav style={{ display: 'flex', gap: '10px', margin: '20px 0' }}>
            {[
              { key: 'tracks', label: '🎵 Top Utwory' },
              { key: 'artists', label: '🎤 Top Wykonawcy' },
              { key: 'profile', label: '👤 Profil' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '20px',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  backgroundColor: activeTab === tab.key ? '#1DB954' : '#282828',
                  color: activeTab === tab.key ? 'white' : '#b3b3b3',
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {!userProfile || loading ? (
            <p style={{ textAlign: 'center', color: '#b3b3b3', marginTop: '50px' }}>
              Generowanie Twojego Wrapped...
            </p>
          ) : (
            <main>
              {/* ZAKŁADKA 1: TOP UTWORY */}
              {activeTab === 'tracks' && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: '20px',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <h2 style={{ margin: 0 }}>Twoje najpopularniejsze utwory</h2>
                    <span style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>
                      {topTracks.length} utworów · {formatNumber(totalMinutes)} min łącznie
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {topTracks.map((track, index) => (
                      <a
                        key={track.id}
                        href={track.external_urls?.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: '#181818',
                          padding: '12px',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          color: 'inherit',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = '#282828')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = '#181818')
                        }
                      >
                        <span
                          style={{
                            width: '35px',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color: '#1DB954',
                            fontSize: '1.2rem',
                          }}
                        >
                          {index + 1}
                        </span>
                        <img
                          src={track.album?.images?.[2]?.url}
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '4px',
                            margin: '0 15px',
                          }}
                          alt="cover"
                        />
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 'bold',
                              fontSize: '1.05rem',
                              marginBottom: '2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '100%',
                            }}
                          >
                            {track.name}
                          </div>
                          <div style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
                            {track.artists?.map((a) => a.name).join(', ')}
                          </div>
                        </div>
                        {/* Pasek popularności + czas trwania */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '6px',
                            marginLeft: '10px',
                          }}
                        >
                          <span style={{ color: '#b3b3b3', fontSize: '0.85rem' }}>
                            {formatDuration(track.duration_ms)}
                          </span>
                          <div
                            title={`Popularność: ${track.popularity}/100`}
                            style={{
                              width: '60px',
                              height: '4px',
                              backgroundColor: '#404040',
                              borderRadius: '2px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${track.popularity}%`,
                                height: '100%',
                                backgroundColor: '#1DB954',
                              }}
                            />
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* ZAKŁADKA 2: TOP WYKONAWCY */}
              {activeTab === 'artists' && (
                <div>
                  <h2 style={{ marginBottom: '20px' }}>Twoi ulubieni artyści</h2>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: '20px',
                    }}
                  >
                    {topArtists.map((artist, index) => (
                      <a
                        key={artist.id}
                        href={artist.external_urls?.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          backgroundColor: '#181818',
                          padding: '15px',
                          borderRadius: '10px',
                          textAlign: 'center',
                          textDecoration: 'none',
                          color: 'inherit',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = '#282828')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = '#181818')
                        }
                      >
                        <div
                          style={{
                            position: 'relative',
                            width: '120px',
                            height: '120px',
                            margin: '0 auto 15px',
                          }}
                        >
                          <img
                            src={
                              artist.images?.[0]?.url ||
                              'https://via.placeholder.com/150'
                            }
                            style={{
                              width: '100%',
                              height: '100%',
                              borderRadius: '50%',
                              objectFit: 'cover',
                            }}
                            alt={artist.name}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              backgroundColor: '#1DB954',
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '0.9rem',
                            }}
                          >
                            #{index + 1}
                          </span>
                        </div>
                        <div
                          style={{
                            fontWeight: 'bold',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {artist.name}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* ZAKŁADKA 3: PROFIL */}
              {activeTab === 'profile' && (
                <div>
                  <h2 style={{ marginBottom: '20px' }}>Twój profil</h2>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      backgroundColor: '#181818',
                      padding: '25px',
                      borderRadius: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <img
                      src={
                        userProfile.images?.[0]?.url ||
                        'https://via.placeholder.com/150'
                      }
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                      alt="avatar"
                    />
                    <div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>
                        {userProfile.display_name}
                      </div>
                      <div style={{ color: '#b3b3b3', marginTop: '4px' }}>
                        {userProfile.email}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '20px',
                          marginTop: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
                          👥 {formatNumber(userProfile.followers?.total)} obserwujących
                        </span>
                        {userProfile.country && (
                          <span style={{ color: '#b3b3b3', fontSize: '0.9rem' }}>
                            🌍 {userProfile.country}
                          </span>
                        )}
                        {userProfile.product && (
                          <span
                            style={{
                              color: '#1DB954',
                              fontSize: '0.9rem',
                              fontWeight: 'bold',
                              textTransform: 'capitalize',
                            }}
                          >
                            ⭐ {userProfile.product}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </main>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
