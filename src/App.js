import { useState } from 'react';
import './App.css';

function App() {
  // Auth State
  const [token, setToken] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [isSignup, setIsSignup] = useState(false);

  // Navigation
  const [currentTab, setCurrentTab] = useState('search');

  // Search State
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  // History State
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Favorites State
  const [favorites, setFavorites] = useState([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  // Watch Provider State
  const [watchProviders, setWatchProviders] = useState(null);
  const [watchCountry, setWatchCountry] = useState('US');
  const [showWatch, setShowWatch] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);

  const API = 'http://localhost:8080';

  // Auth
  const handleAuth = async () => {
    setAuthError(null);
    const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';

    try {
      const response = await fetch(API + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setAuthError(data.message || 'Authentication failed');
        return;
      }

      setToken(data.token);
      setAuthEmail('');
      setAuthPassword('');
      setShowAuthModal(false);
    } catch (err) {
      setAuthError('Could not connect to server');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setHistory([]);
    setHistoryLoaded(false);
    setFavorites([]);
    setFavoritesLoaded(false);
    setWatchProviders(null);
    setShowWatch(false);
    setCurrentTab('search');
  };

  const requireAuth = (action) => {
    if (!token) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  // Search
  async function analyzeVideo(searchTerm) {
    try {
      const response = await fetch(API + '/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: searchTerm }),
      });
      if (response.status === 429) {
        return { message: 'Daily limit reached. Try again tomorrow.' };
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error analyzing video:', err);
      return null;
    }
  }

  const handleSearch = async () => {
    if (!videoUrl.trim()) {
      alert('Please paste a video link!');
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    setWatchProviders(null);
    setShowWatch(false);

    const data = await analyzeVideo(videoUrl.trim());
    if (!data || !data.title) {
      setError(data?.message || 'Something went wrong');
    } else {
      setResult(data);
    }
    setLoading(false);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleClear = () => {
    setVideoUrl('');
    setResult(null);
    setError(null);
    setUploadedFile(null);
    setWatchProviders(null);
    setShowWatch(false);
  };

  // Favorites
  const saveFavorite = async () => {
    if (!requireAuth()) return;
    try {
      const response = await fetch(API + '/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({
          title: result.title,
          type: result.type,
          year: result.year,
          overview: result.overview,
          posterUrl: result.posterUrl,
        }),
      });
      if (response.status === 409) {
        alert('Already in favorites!');
      } else {
        alert('Saved to favorites!');
      }
    } catch (err) {
      console.error('Error saving favorite:', err);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch(API + '/api/favorites', {
        headers: { 'Authorization': 'Bearer ' + token },
      });
      const data = await response.json();
      setFavorites(data || []);
      setFavoritesLoaded(true);
    } catch (err) {
      console.error('Error fetching favorites:', err);
    }
  };

  // History
  const fetchHistory = async () => {
    try {
      const response = await fetch(API + '/api/history', {
        headers: { 'Authorization': 'Bearer ' + token },
      });
      const data = await response.json();
      setHistory(data || []);
      setHistoryLoaded(true);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  // Watch Providers
  const fetchWatchProviders = async (tmdbId, type, country) => {
    setWatchLoading(true);
    try {
      const response = await fetch(
        API + '/api/watch/' + type.toLowerCase() + '/' + tmdbId + '?country=' + country,
        { headers: { 'Authorization': 'Bearer ' + token } }
      );
      const data = await response.json();
      setWatchProviders(data);
    } catch (err) {
      setWatchProviders({ message: 'Could not load streaming info' });
    }
    setWatchLoading(false);
  };

  const handleWatchClick = () => {
    if (!requireAuth()) return;
    if (showWatch) {
      setShowWatch(false);
    } else {
      setShowWatch(true);
      if (result && result.tmdbId) {
        fetchWatchProviders(result.tmdbId, result.type, watchCountry);
      }
    }
  };

  const handleCountryChange = (e) => {
    const country = e.target.value;
    setWatchCountry(country);
    if (result && result.tmdbId) {
      fetchWatchProviders(result.tmdbId, result.type, country);
    }
  };

  // Tab navigation
  const handleTabClick = (tab) => {
    if (tab === 'history' || tab === 'favorites' || tab === 'profile') {
      if (!requireAuth()) return;
    }
    setCurrentTab(tab);
    if (tab === 'history' && !historyLoaded) fetchHistory();
    if (tab === 'favorites' && !favoritesLoaded) fetchFavorites();
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>WhatsThatClip</h1>
        <p>Find any movie or TV show from short clips</p>

        {token ? (
          <button className="auth-top-button" onClick={handleLogout}>Log Out</button>
        ) : (
          <button className="auth-top-button" onClick={() => setShowAuthModal(true)}>Log In</button>
        )}

        {/* Auth Modal */}
        {showAuthModal && (
          <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>{isSignup ? 'Sign Up' : 'Log In'}</h2>
              <input
                type="email"
                placeholder="Email"
                className="modal-input"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="modal-input"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
              <button className="modal-button" onClick={handleAuth}>
                {isSignup ? 'Sign Up' : 'Log In'}
              </button>
              {authError && <div className="error-message">{authError}</div>}
              <button
                className="modal-switch"
                onClick={() => { setIsSignup(!isSignup); setAuthError(null); }}
              >
                {isSignup ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="tab-bar">
          <button
            className={currentTab === 'search' ? 'tab active' : 'tab'}
            onClick={() => handleTabClick('search')}
          >Search</button>
          <button
            className={currentTab === 'history' ? 'tab active' : 'tab'}
            onClick={() => handleTabClick('history')}
          >History</button>
          <button
            className={currentTab === 'favorites' ? 'tab active' : 'tab'}
            onClick={() => handleTabClick('favorites')}
          >Favorites</button>
          <button
            className={currentTab === 'profile' ? 'tab active' : 'tab'}
            onClick={() => handleTabClick('profile')}
          >Profile</button>
        </div>

        {/* Search Tab */}
        {currentTab === 'search' && (
          <div className="search-container">
            <input
              type="text"
              placeholder="Paste video link (TikTok, Instagram, YouTube) or search..."
              className="tiktok-input"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <button className="search-button" onClick={handleSearch} disabled={loading}>
              {loading && <span className="spinner"></span>}
              {loading ? 'Searching...' : 'Find Movie/Show'}
            </button>

            <div className="divider"><span>OR</span></div>

            <div className="upload-area">
              <input type="file" id="file-upload" accept="video/*" onChange={handleFileUpload} style={{ display: 'none' }} />
              <label htmlFor="file-upload" className="upload-label">📁 Upload a video file</label>
              {uploadedFile && <p className="file-name">Selected: {uploadedFile.name}</p>}
            </div>

            {result && (
              <div className="result">
                <div className="result-content">
                  {result.posterUrl && (
                    <img src={result.posterUrl} alt={result.title} className="poster" />
                  )}
                  <div className="result-info">
                    <h2>{result.title}</h2>
                    <p className="meta">{result.type} • {result.year}</p>
                    <p className="overview">{result.overview}</p>

                    <div className="result-actions">
                      <button className="action-button save-button" onClick={saveFavorite}>
                        ❤️ Save to Favorites
                      </button>
                      <button className="action-button watch-button" onClick={handleWatchClick}>
                        {showWatch ? 'Hide Streaming Info' : '📺 Where to Watch'}
                      </button>
                    </div>

                    {showWatch && (
                      <div className="watch-section">
                        <select value={watchCountry} onChange={handleCountryChange} className="country-select">
                          <option value="US">United States</option>
                          <option value="GB">United Kingdom</option>
                          <option value="CA">Canada</option>
                          <option value="AU">Australia</option>
                          <option value="DE">Germany</option>
                          <option value="FR">France</option>
                          <option value="ES">Spain</option>
                          <option value="IT">Italy</option>
                          <option value="BR">Brazil</option>
                          <option value="JP">Japan</option>
                          <option value="IN">India</option>
                          <option value="NL">Netherlands</option>
                          <option value="SE">Sweden</option>
                          <option value="TR">Turkey</option>
                        </select>

                        {watchLoading && <p>Loading...</p>}

                        {watchProviders && !watchProviders.message && !watchLoading && (
                          <div className="providers-list">
                            {watchProviders.link && (
                              <a href={watchProviders.link} target="_blank" rel="noopener noreferrer" className="justwatch-link">
                                View on JustWatch / TMDB →
                              </a>
                            )}
                            {watchProviders.flatrate && (
                              <div className="provider-group">
                                <h4>Stream</h4>
                                {watchProviders.flatrate.map((p) => (
                                  <div key={p.provider_id} className="provider-item">
                                    <img src={'https://image.tmdb.org/t/p/w45' + p.logo_path} alt={p.provider_name} className="provider-logo" />
                                    <span>{p.provider_name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {watchProviders.rent && (
                              <div className="provider-group">
                                <h4>Rent</h4>
                                {watchProviders.rent.map((p) => (
                                  <div key={p.provider_id} className="provider-item">
                                    <img src={'https://image.tmdb.org/t/p/w45' + p.logo_path} alt={p.provider_name} className="provider-logo" />
                                    <span>{p.provider_name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {watchProviders.buy && (
                              <div className="provider-group">
                                <h4>Buy</h4>
                                {watchProviders.buy.map((p) => (
                                  <div key={p.provider_id} className="provider-item">
                                    <img src={'https://image.tmdb.org/t/p/w45' + p.logo_path} alt={p.provider_name} className="provider-logo" />
                                    <span>{p.provider_name}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        {watchProviders && watchProviders.message && !watchLoading && (
                          <p className="no-providers">{watchProviders.message}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {error && <div className="error-message">{error}</div>}

            {(result || error) && (
              <button className="clear-button" onClick={handleClear}>Start New Search</button>
            )}
          </div>
        )}

        {/* History Tab */}
        {currentTab === 'history' && (
          <div className="search-container">
            <h2 className="tab-title">Search History</h2>
            {history.length === 0 && <p className="empty-state">No searches yet</p>}
            {history.map((item) => (
              <div key={item.id} className="list-card">
                {item.posterUrl && (
                  <img src={item.posterUrl} alt={item.title} className="list-poster" />
                )}
                <div className="list-info">
                  <h3>{item.title}</h3>
                  <p className="meta">{item.type} • {item.year}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Favorites Tab */}
        {currentTab === 'favorites' && (
          <div className="search-container">
            <h2 className="tab-title">Favorites</h2>
            {favorites.length === 0 && <p className="empty-state">No favorites yet</p>}
            {favorites.map((item) => (
              <div key={item.id} className="list-card">
                {item.posterUrl && (
                  <img src={item.posterUrl} alt={item.title} className="list-poster" />
                )}
                <div className="list-info">
                  <h3>{item.title}</h3>
                  <p className="meta">{item.type} • {item.year}</p>
                  <p className="overview">{item.overview}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Profile Tab */}
        {currentTab === 'profile' && (
          <div className="search-container">
            <h2 className="tab-title">Profile</h2>
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-number">{history.length}</span>
                <span className="stat-label">Searches</span>
              </div>
              <div className="stat">
                <span className="stat-number">{favorites.length}</span>
                <span className="stat-label">Favorites</span>
              </div>
            </div>
            <button className="logout-main-button" onClick={handleLogout}>Log Out</button>
          </div>
        )}

      </header>
    </div>
  );
}

export default App;