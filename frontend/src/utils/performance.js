import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Debounce function
 * Delays the execution of a function until after a specified wait time
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function
 * Limits the execution of a function to once per specified time period
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;

  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * useDebounce hook
 * Returns a debounced value
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} Debounced value
 */
export const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * useThrottle hook
 * Returns a throttled value
 * @param {any} value - Value to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {any} Throttled value
 */
export const useThrottle = (value, limit = 300) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

/**
 * useDebouncedCallback hook
 * Returns a debounced callback function
 * @param {Function} callback - Callback function
 * @param {number} delay - Delay in milliseconds
 * @param {Array} dependencies - Dependencies array
 * @returns {Function} Debounced callback
 */
export const useDebouncedCallback = (callback, delay = 300, dependencies = []) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay, ...dependencies]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * useThrottledCallback hook
 * Returns a throttled callback function
 * @param {Function} callback - Callback function
 * @param {number} limit - Time limit in milliseconds
 * @param {Array} dependencies - Dependencies array
 * @returns {Function} Throttled callback
 */
export const useThrottledCallback = (callback, limit = 300, dependencies = []) => {
  const inThrottle = useRef(false);

  const throttledCallback = useCallback((...args) => {
    if (!inThrottle.current) {
      callback(...args);
      inThrottle.current = true;
      setTimeout(() => {
        inThrottle.current = false;
      }, limit);
    }
  }, [callback, limit, ...dependencies]);

  return throttledCallback;
};

/**
 * Lazy load images
 * @param {string} src - Image source
 * @param {string} placeholder - Placeholder image
 * @returns {Object} {src, loading}
 */
export const useLazyImage = (src, placeholder = '') => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.src = src;

    img.onload = () => {
      setImageSrc(src);
      setLoading(false);
    };

    img.onerror = () => {
      setLoading(false);
    };
  }, [src]);

  return { src: imageSrc, loading };
};

/**
 * Intersection Observer hook for lazy loading
 * @param {Object} options - IntersectionObserver options
 * @returns {Array} [ref, isIntersecting]
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    const currentTarget = targetRef.current;

    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [options]);

  return [targetRef, isIntersecting];
};

/**
 * useMediaQuery hook
 * Detects media query matches
 * @param {string} query - Media query string
 * @returns {boolean} Whether the query matches
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

/**
 * useIsMobile hook
 * Detects if viewport is mobile-sized
 * @returns {boolean} Whether viewport is mobile
 */
export const useIsMobile = () => {
  return useMediaQuery('(max-width: 768px)');
};

/**
 * useIsTablet hook
 * Detects if viewport is tablet-sized
 * @returns {boolean} Whether viewport is tablet
 */
export const useIsTablet = () => {
  return useMediaQuery('(min-width: 769px) and (max-width: 1024px)');
};

/**
 * useIsDesktop hook
 * Detects if viewport is desktop-sized
 * @returns {boolean} Whether viewport is desktop
 */
export const useIsDesktop = () => {
  return useMediaQuery('(min-width: 1025px)');
};

/**
 * Memoize expensive computations
 * @param {Function} fn - Function to memoize
 * @param {Array} deps - Dependencies
 * @returns {any} Memoized result
 */
export const useMemoizedValue = (fn, deps) => {
  const [value, setValue] = useState(() => fn());

  useEffect(() => {
    setValue(fn());
  }, deps);

  return value;
};

/**
 * localStorage with expiry
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @param {number} ttl - Time to live in milliseconds
 */
export const setWithExpiry = (key, value, ttl) => {
  const now = new Date();
  const item = {
    value: value,
    expiry: now.getTime() + ttl,
  };
  localStorage.setItem(key, JSON.stringify(item));
};

/**
 * Get from localStorage with expiry check
 * @param {string} key - Storage key
 * @returns {any} Stored value or null if expired
 */
export const getWithExpiry = (key) => {
  const itemStr = localStorage.getItem(key);

  if (!itemStr) {
    return null;
  }

  const item = JSON.parse(itemStr);
  const now = new Date();

  if (now.getTime() > item.expiry) {
    localStorage.removeItem(key);
    return null;
  }

  return item.value;
};

/**
 * Batch update state
 * @param {Array} updates - Array of [setter, value] pairs
 */
export const batchUpdate = (updates) => {
  updates.forEach(([setter, value]) => {
    setter(value);
  });
};

/**
 * Request idle callback wrapper
 * @param {Function} callback - Callback to execute
 * @param {Object} options - requestIdleCallback options
 */
export const runWhenIdle = (callback, options = {}) => {
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(callback, options);
  } else {
    setTimeout(callback, 1);
  }
};

/**
 * Prefetch data
 * @param {Function} fetcher - Data fetching function
 * @param {string} key - Cache key
 */
export const prefetchData = async (fetcher, key) => {
  try {
    const data = await fetcher();
    setWithExpiry(key, data, 5 * 60 * 1000); // Cache for 5 minutes
    return data;
  } catch (error) {
    console.error('Prefetch error:', error);
    return null;
  }
};

/**
 * usePrevious hook
 * Get previous value of a state or prop
 * @param {any} value - Current value
 * @returns {any} Previous value
 */
export const usePrevious = (value) => {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
};

/**
 * useWindowSize hook
 * Get window dimensions
 * @returns {Object} {width, height}
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = throttle(() => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, 200);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

export default {
  debounce,
  throttle,
  useDebounce,
  useThrottle,
  useDebouncedCallback,
  useThrottledCallback,
  useLazyImage,
  useIntersectionObserver,
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useMemoizedValue,
  setWithExpiry,
  getWithExpiry,
  batchUpdate,
  runWhenIdle,
  prefetchData,
  usePrevious,
  useWindowSize,
};
