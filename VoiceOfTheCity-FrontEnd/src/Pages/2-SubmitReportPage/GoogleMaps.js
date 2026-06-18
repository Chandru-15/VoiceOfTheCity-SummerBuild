// googleMaps.js
//
// Maps JavaScript API — bootstrap loader (GOOGLE_MAPS_API_KEY).
// Geocoding — REST API (GEOCODING_API_KEY), separate key.

import { GOOGLE_MAPS_API_KEY, GEOCODING_API_KEY } from '../../../../Configuration/Configuration.js';

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';

let loaderReady = null;

function installBootstrapLoader() {
  if (loaderReady) return loaderReady;

  loaderReady = new Promise((resolve, reject) => {
    if (typeof window.google?.maps?.importLibrary === 'function') {
      window.google.maps.importLibrary('maps').then(resolve).catch(reject);
      return;
    }

    const config = { key: GOOGLE_MAPS_API_KEY, v: 'weekly' };

    /* eslint-disable no-async-promise-executor -- Google's official loader snippet */
    ((g) => {
      var h;
      var a;
      var k;
      var p = 'The Google Maps JavaScript API';
      var c = 'google';
      var l = 'importLibrary';
      var q = '__ib__';
      var m = document;
      var b = window;
      b = b[c] || (b[c] = {});
      var d = b.maps || (b.maps = {});
      var r = new Set();
      var e = new URLSearchParams();
      var u = () =>
        h ||
        (h = new Promise(async (f, n) => {
          a = m.createElement('script');
          e.set('libraries', [...r] + '');
          for (k in g) e.set(k.replace(/[A-Z]/g, (t) => '_' + t[0].toLowerCase()), g[k]);
          e.set('callback', c + '.maps.' + q);
          a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
          d[q] = f;
          a.onerror = () => {
            h = n(Error(p + ' could not load.'));
          };
          a.nonce = m.querySelector('script[nonce]')?.nonce || '';
          m.head.append(a);
        }));
      if (d[l]) {
        console.warn(p + ' only loads once. Ignoring:', g);
      } else {
        d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n));
      }
    })(config);
    /* eslint-enable no-async-promise-executor */

    window.google.maps.importLibrary('maps').then(resolve).catch(reject);
  });

  return loaderReady;
}

export async function loadGoogleMaps() {
  await installBootstrapLoader();
  return window.google.maps;
}

const SG_TYPO_FIXES = [
  [/\bsenkang\b/i, 'Sengkang'],
  [/\bcompassvale lane\b/i, 'Compassvale Lane'],
];

function normalizeAddressQuery(query) {
  let text = query.trim().replace(/\s+/g, ' ');
  for (const [pattern, replacement] of SG_TYPO_FIXES) {
    text = text.replace(pattern, replacement);
  }
  return text;
}

function buildGeocodeAttempts(query) {
  const normalized = normalizeAddressQuery(query);
  const attempts = [];
  const seen = new Set();

  const add = (params) => {
    const key = JSON.stringify(params);
    if (seen.has(key)) return;
    seen.add(key);
    attempts.push(params);
  };

  const sgPostal = normalized.match(/\b(\d{6})\b/);
  const hasSingapore = /\bsingapore\b/i.test(normalized);
  const sgExtra = sgPostal ? { region: 'sg', components: 'country:SG' } : {};

  add({ address: normalized, ...sgExtra });

  if (sgPostal) {
    const postal = sgPostal[1];
    const streetPart = normalized
      .replace(new RegExp(`[,\\s]*${postal}\\s*$`), '')
      .replace(/,\s*$/, '')
      .trim();

    if (!hasSingapore && streetPart) {
      add({ address: `${streetPart}, Singapore ${postal}`, region: 'sg', components: 'country:SG' });
      add({ address: `Block ${streetPart}, Singapore ${postal}`, region: 'sg', components: 'country:SG' });
    }

    add({
      address: `Singapore ${postal}`,
      region: 'sg',
      components: `country:SG|postal_code:${postal}`,
    });
  }

  return attempts;
}

async function geocodeRest(params) {
  const url = new URL(GEOCODE_URL);
  url.searchParams.set('key', GEOCODING_API_KEY);

  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') url.searchParams.set(key, value);
  }

  const response = await fetch(url);
  const data = await response.json();

  if (data.status === 'OK' && data.results?.[0]) {
    const result = data.results[0];
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      address: result.formatted_address,
    };
  }

  throw new Error(data.status || 'UNKNOWN');
}

export async function geocodeAddress(query) {
  const trimmed = query?.trim();
  if (!trimmed) throw new Error('Enter an address first.');

  const attempts = buildGeocodeAttempts(trimmed);
  let lastStatus = 'ZERO_RESULTS';

  for (const params of attempts) {
    try {
      return await geocodeRest(params);
    } catch (err) {
      lastStatus = err.message;
    }
  }

  if (lastStatus === 'REQUEST_DENIED') {
    throw new Error('Geocoding API is not enabled for GEOCODING_API_KEY. Enable it in Google Cloud Console.');
  }
  if (lastStatus === 'OVER_QUERY_LIMIT') {
    throw new Error('Geocoding quota exceeded. Try again later.');
  }

  throw new Error(
    'Could not find that address. For Singapore, try: "50 Nanyang Ave, Singapore 639798".'
  );
}

export async function reverseGeocode(lat, lng) {
  try {
    const result = await geocodeRest({ latlng: `${lat},${lng}` });
    return result.address;
  } catch {
    return null;
  }
}
