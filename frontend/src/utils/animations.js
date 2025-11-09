/**
 * Animation Utilities
 * Reusable animation configs for Chakra UI motion components
 */

/**
 * Fade in animation
 */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
};

/**
 * Fade in from top
 */
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.3 },
};

/**
 * Fade in from bottom
 */
export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
};

/**
 * Fade in from left
 */
export const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3 },
};

/**
 * Fade in from right
 */
export const fadeInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.3 },
};

/**
 * Scale in animation
 */
export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.2 },
};

/**
 * Slide in from right
 */
export const slideInRight = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: { type: 'spring', damping: 20 },
};

/**
 * Slide in from left
 */
export const slideInLeft = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
  transition: { type: 'spring', damping: 20 },
};

/**
 * Stagger children animation
 */
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/**
 * Stagger item animation
 */
export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

/**
 * Bounce animation
 */
export const bounce = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatDelay: 1,
    },
  },
};

/**
 * Pulse animation
 */
export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
    },
  },
};

/**
 * Shake animation (for errors)
 */
export const shake = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
    },
  },
};

/**
 * Rotate animation
 */
export const rotate = {
  animate: {
    rotate: 360,
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * Page transition variants
 */
export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.2 },
};

/**
 * Modal transition variants
 */
export const modalTransition = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2 },
};

/**
 * Notification toast animation
 */
export const toastAnimation = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
  transition: { type: 'spring', damping: 20 },
};

/**
 * Card hover animation (for use with whileHover prop)
 */
export const cardHover = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

/**
 * Button press animation (for use with whileTap prop)
 */
export const buttonPress = {
  scale: 0.95,
};

/**
 * Loading pulse animation
 */
export const loadingPulse = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Success checkmark animation
 */
export const successCheckmark = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: { duration: 0.5, ease: 'easeOut' },
};

/**
 * Error cross animation
 */
export const errorCross = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

/**
 * List item animation (for use in lists)
 */
export const listItem = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.2 },
};

/**
 * Collapse animation
 */
export const collapse = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.3 },
};

/**
 * Expand animation
 */
export const expand = {
  initial: { scaleY: 0, opacity: 0 },
  animate: { scaleY: 1, opacity: 1 },
  exit: { scaleY: 0, opacity: 0 },
  transition: { duration: 0.3 },
};

/**
 * Get stagger delay based on index
 * @param {number} index - Item index
 * @param {number} delay - Base delay in seconds
 * @returns {number} Calculated delay
 */
export const getStaggerDelay = (index, delay = 0.05) => {
  return index * delay;
};

/**
 * Create custom animation
 * @param {Object} initial - Initial state
 * @param {Object} animate - Animate state
 * @param {Object} exit - Exit state
 * @param {Object} transition - Transition config
 * @returns {Object} Animation config
 */
export const createAnimation = (initial, animate, exit = null, transition = {}) => {
  return {
    initial,
    animate,
    ...(exit && { exit }),
    transition: {
      duration: 0.3,
      ease: 'easeOut',
      ...transition,
    },
  };
};

/**
 * Hover lift effect (CSS object)
 */
export const hoverLift = {
  transition: 'all 0.2s ease-in-out',
  _hover: {
    transform: 'translateY(-4px)',
    shadow: 'lg',
  },
};

/**
 * Hover glow effect (CSS object)
 */
export const hoverGlow = {
  transition: 'all 0.2s ease-in-out',
  _hover: {
    boxShadow: '0 0 20px rgba(66, 153, 225, 0.5)',
  },
};

/**
 * Smooth transitions (CSS object)
 */
export const smoothTransition = {
  transition: 'all 0.2s ease-in-out',
};

/**
 * Fast transition (CSS object)
 */
export const fastTransition = {
  transition: 'all 0.1s ease-in-out',
};

/**
 * Slow transition (CSS object)
 */
export const slowTransition = {
  transition: 'all 0.4s ease-in-out',
};

export default {
  fadeIn,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  slideInRight,
  slideInLeft,
  staggerContainer,
  staggerItem,
  bounce,
  pulse,
  shake,
  rotate,
  pageTransition,
  modalTransition,
  toastAnimation,
  cardHover,
  buttonPress,
  loadingPulse,
  successCheckmark,
  errorCross,
  listItem,
  collapse,
  expand,
  getStaggerDelay,
  createAnimation,
  hoverLift,
  hoverGlow,
  smoothTransition,
  fastTransition,
  slowTransition,
};
