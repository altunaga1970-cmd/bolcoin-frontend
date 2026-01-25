// ===========================================
// Geoblocking Configuration
// Countries blocked due to gambling regulations
// ===========================================

/**
 * Complete list of restricted jurisdictions
 * Synchronized with JurisdictionsPage.jsx
 * Categories:
 * - REGULATED: Requires specific gambling license
 * - PROHIBITED: Gambling is illegal
 * - SANCTIONED: International sanctions apply
 */
export const BLOCKED_COUNTRIES = {
  // Regulated markets requiring specific licenses
  US: {
    name: 'United States',
    code: 'US',
    reason: 'Federal and state gambling regulations',
    category: 'REGULATED'
  },
  ES: {
    name: 'Spain',
    code: 'ES',
    reason: 'DGOJ licensing requirements',
    category: 'REGULATED'
  },
  GB: {
    name: 'United Kingdom',
    code: 'GB',
    reason: 'UKGC licensing requirements',
    category: 'REGULATED'
  },
  FR: {
    name: 'France',
    code: 'FR',
    reason: 'ANJ licensing requirements',
    category: 'REGULATED'
  },
  DE: {
    name: 'Germany',
    code: 'DE',
    reason: 'Interstate Treaty on Gambling',
    category: 'REGULATED'
  },
  IT: {
    name: 'Italy',
    code: 'IT',
    reason: 'ADM licensing requirements',
    category: 'REGULATED'
  },
  NL: {
    name: 'Netherlands',
    code: 'NL',
    reason: 'KSA licensing requirements',
    category: 'REGULATED'
  },
  BE: {
    name: 'Belgium',
    code: 'BE',
    reason: 'Gaming Commission requirements',
    category: 'REGULATED'
  },
  PT: {
    name: 'Portugal',
    code: 'PT',
    reason: 'SRIJ licensing requirements',
    category: 'REGULATED'
  },
  CA: {
    name: 'Canada',
    code: 'CA',
    reason: 'Provincial gambling regulations',
    category: 'REGULATED'
  },
  AU: {
    name: 'Australia',
    code: 'AU',
    reason: 'Interactive Gambling Act',
    category: 'REGULATED'
  },
  SG: {
    name: 'Singapore',
    code: 'SG',
    reason: 'Remote Gambling Act',
    category: 'REGULATED'
  },
  MO: {
    name: 'Macau',
    code: 'MO',
    reason: 'DICJ licensing requirements',
    category: 'REGULATED'
  },
  UA: {
    name: 'Ukraine',
    code: 'UA',
    reason: 'Licensing requirements',
    category: 'REGULATED'
  },
  RU: {
    name: 'Russia',
    code: 'RU',
    reason: 'Gambling restrictions',
    category: 'REGULATED'
  },
  BY: {
    name: 'Belarus',
    code: 'BY',
    reason: 'Gambling restrictions',
    category: 'REGULATED'
  },

  // Countries where gambling is prohibited
  JP: {
    name: 'Japan',
    code: 'JP',
    reason: 'Gambling prohibition laws',
    category: 'PROHIBITED'
  },
  KR: {
    name: 'South Korea',
    code: 'KR',
    reason: 'Gambling prohibition laws',
    category: 'PROHIBITED'
  },
  TR: {
    name: 'Turkey',
    code: 'TR',
    reason: 'Gambling prohibition laws',
    category: 'PROHIBITED'
  },
  CN: {
    name: 'China',
    code: 'CN',
    reason: 'Gambling prohibition laws',
    category: 'PROHIBITED'
  },
  HK: {
    name: 'Hong Kong',
    code: 'HK',
    reason: 'Gambling Ordinance',
    category: 'PROHIBITED'
  },
  IL: {
    name: 'Israel',
    code: 'IL',
    reason: 'Gambling prohibition laws',
    category: 'PROHIBITED'
  },
  AE: {
    name: 'United Arab Emirates',
    code: 'AE',
    reason: 'Gambling prohibition laws',
    category: 'PROHIBITED'
  },
  SA: {
    name: 'Saudi Arabia',
    code: 'SA',
    reason: 'Gambling prohibition laws',
    category: 'PROHIBITED'
  },
  IR: {
    name: 'Iran',
    code: 'IR',
    reason: 'Gambling prohibition laws',
    category: 'PROHIBITED'
  },

  // Sanctioned countries
  KP: {
    name: 'North Korea',
    code: 'KP',
    reason: 'International sanctions',
    category: 'SANCTIONED'
  },
  CU: {
    name: 'Cuba',
    code: 'CU',
    reason: 'International sanctions',
    category: 'SANCTIONED'
  },
  SY: {
    name: 'Syria',
    code: 'SY',
    reason: 'International sanctions',
    category: 'SANCTIONED'
  }
};

// Array of all blocked country codes for quick lookup
export const BLOCKED_COUNTRY_CODES = Object.keys(BLOCKED_COUNTRIES);

// Set for O(1) lookup performance
export const BLOCKED_COUNTRY_SET = new Set(BLOCKED_COUNTRY_CODES);

/**
 * Check if a country code is blocked
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {boolean} True if blocked
 */
export const isCountryBlocked = (countryCode) => {
  if (!countryCode) return false;
  return BLOCKED_COUNTRY_SET.has(countryCode.toUpperCase());
};

/**
 * Get blocked message for a specific country
 * @param {string} countryCode - ISO 3166-1 alpha-2 country code
 * @returns {Object|null} Blocked message object or null if not blocked
 */
export const getBlockedMessage = (countryCode) => {
  if (!countryCode) return null;

  const country = BLOCKED_COUNTRIES[countryCode.toUpperCase()];
  if (!country) return null;

  const messages = {
    REGULATED: `La Bolita is not available in ${country.name} due to local gambling licensing requirements.`,
    PROHIBITED: `La Bolita is not available in ${country.name} as online gambling is prohibited by local laws.`,
    SANCTIONED: `La Bolita is not available in ${country.name} due to international sanctions.`
  };

  return {
    title: 'Access Restricted',
    message: messages[country.category] || `La Bolita is not available in ${country.name} due to regulatory restrictions.`,
    country: country.name,
    countryCode: country.code,
    reason: country.reason,
    category: country.category
  };
};

/**
 * Get all blocked countries grouped by category
 * @returns {Object} Countries grouped by category
 */
export const getBlockedCountriesByCategory = () => {
  return Object.values(BLOCKED_COUNTRIES).reduce((acc, country) => {
    if (!acc[country.category]) {
      acc[country.category] = [];
    }
    acc[country.category].push(country);
    return acc;
  }, {});
};

// ===========================================
// Geolocation API Configuration
// ===========================================

// Primary API (ip-api.com - free, no key required)
export const GEO_API_URL = 'https://ip-api.com/json/?fields=status,country,countryCode,regionName,city';

// Fallback API (ipapi.co - free tier available)
export const GEO_API_URL_ALT = 'https://ipapi.co/json/';

// Third fallback (ipinfo.io - free tier with token)
export const GEO_API_URL_FALLBACK = 'https://ipinfo.io/json';

// Cache configuration
export const GEO_CACHE_KEY = 'lb_geo_check';
export const GEO_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch user's geolocation with fallback APIs
 * @returns {Promise<Object>} Geolocation result
 */
export const fetchGeolocation = async () => {
  // Check cache first
  const cached = getCachedGeolocation();
  if (cached) return cached;

  // Try primary API
  try {
    const response = await fetch(GEO_API_URL);
    const data = await response.json();

    if (data.status === 'success' || data.countryCode) {
      const result = {
        countryCode: data.countryCode,
        country: data.country,
        region: data.regionName || data.region,
        city: data.city,
        isBlocked: isCountryBlocked(data.countryCode),
        timestamp: Date.now()
      };
      cacheGeolocation(result);
      return result;
    }
  } catch (error) {
    console.warn('Primary geo API failed:', error);
  }

  // Try fallback API
  try {
    const response = await fetch(GEO_API_URL_ALT);
    const data = await response.json();

    if (data.country_code) {
      const result = {
        countryCode: data.country_code,
        country: data.country_name,
        region: data.region,
        city: data.city,
        isBlocked: isCountryBlocked(data.country_code),
        timestamp: Date.now()
      };
      cacheGeolocation(result);
      return result;
    }
  } catch (error) {
    console.warn('Fallback geo API failed:', error);
  }

  // Return unknown if all APIs fail
  return {
    countryCode: null,
    country: null,
    isBlocked: false, // Don't block if we can't determine location
    timestamp: Date.now(),
    error: 'Unable to determine location'
  };
};

/**
 * Get cached geolocation if valid
 * @returns {Object|null} Cached data or null
 */
export const getCachedGeolocation = () => {
  try {
    const cached = localStorage.getItem(GEO_CACHE_KEY);
    if (!cached) return null;

    const data = JSON.parse(cached);
    const age = Date.now() - data.timestamp;

    if (age < GEO_CACHE_DURATION) {
      return data;
    }

    // Cache expired
    localStorage.removeItem(GEO_CACHE_KEY);
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Cache geolocation result
 * @param {Object} data - Geolocation data to cache
 */
export const cacheGeolocation = (data) => {
  try {
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to cache geolocation:', error);
  }
};

/**
 * Clear geolocation cache (useful for testing)
 */
export const clearGeolocationCache = () => {
  try {
    localStorage.removeItem(GEO_CACHE_KEY);
  } catch (error) {
    // Ignore errors
  }
};

// Export count for reference
export const TOTAL_BLOCKED_COUNTRIES = BLOCKED_COUNTRY_CODES.length;
