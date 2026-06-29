
//Generate random string for PKCE Flow. I use crypto.getRandomValues() 
const generateRandomString = (length) => {

    //There is 62 characters
    const possibleCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    //8-bit Integer so values 0-255
    const emptyByteArray = new Uint8Array(length);
    const randomBytes = crypto.getRandomValues(emptyByteArray);
    const randomBytesArray = Array.from(randomBytes);

    const charactersArray = [];
    for(let i = 0; i<randomBytesArray.length; i++){
        const randomNumber = randomBytesArray[i];
        const characterIndex = randomNumber % possibleCharacters.length;
        const chosenCharacter = possibleCharacters.charAt(characterIndex);
        charactersArray.push(chosenCharacter);
    }
    const finalRandomString = charactersArray.join('');
    return finalRandomString;
};

//Hashing with crypto digest() method
const hashWithSha256 = async (MyRandomString) => {
    const encoder = new TextEncoder();
    const textAsBytes = encoder.encode(MyRandomString);
    const hashedBuffer = await crypto.subtle.digest('SHA-256', textAsBytes);
    return hashedBuffer;
};

//Converting Hash into Base64URL
const Base64URL = (inputBuffer) => {
    const bytes = new Uint8Array(inputBuffer);
    let binaryString = '';
    
    for(let i = 0; i<bytes.length; i++){
        const currentByte = bytes[i];
        const character = String.fromCharCode(currentByte);
        binaryString = binaryString + character;
    }
    const standardBase64 = btoa(binaryString);

    let urlSafeBase64 = standardBase64;
    urlSafeBase64 = urlSafeBase64.replace(/\+/g, '-');
    urlSafeBase64 = urlSafeBase64.replace(/\//g, '_');
    urlSafeBase64 = urlSafeBase64.replace(/=/g, '');

    return urlSafeBase64;
};

export const redirectToSpotifyAuth = async () => {
    const clientId = '2e3e4c4db2fd470d9a914308c580ded1';
    const redirectUri = 'https://fr3dq.github.io/';
    const scope = 'user-top-read';
    const spotifyAuthUrl = 'https://accounts.spotify.com/authorize';

    const codeVerifier = generateRandomString(64);
    localStorage.setItem('spotify_code_verifier', codeVerifier);
    const hashedBuffer = await hashWithSha256(codeVerifier);
    const codeChallenge = Base64URL(hashedBuffer);
    const urlBuilder = new URL(spotifyAuthUrl);

    const urlParameters = {
        response_type: 'code',
        client_id: clientId,
        scope: scope,
        redirect_uri: redirectUri,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge
    };

    const formattedParamsString = new URLSearchParams(urlParameters).toString();
    urlBuilder.search = formattedParamsString;
    const finalRedirectUrl = urlBuilder.toString();
    window.location.href = finalRedirectUrl;
};

export const getAccessToken = async (authCode) => {
  const clientId = '2e3e4c4db2fd470d9a914308c580ded1';
  const redirectUri = 'https://fr3dq.github.io/';
  const tokenUrl = 'https://accounts.spotify.com/api/token';

  const codeVerifier = localStorage.getItem('spotify_code_verifier');

  const tokenParameters = {
    client_id: clientId,
    grant_type: 'authorization_code',
    code: authCode,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  };

  const formattedBody = new URLSearchParams(tokenParameters);

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formattedBody,
  });

  const responseData = await response.json();
  const finalAccessToken = responseData.access_token;
  return finalAccessToken;
};

export const getUserTopTracks = async (accessToken) => {
  const response = await fetch('https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error('Nie udało się pobrać top utworów');
  }

  const data = await response.json();
  return data.items;
};