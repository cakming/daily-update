# Frontend Utilities

This directory contains reusable utility functions and hooks for the Daily Update application.

## Overview

- **errorHandler.js** - Centralized error handling and toast notifications
- **validation.js** - Form validation utilities and rules
- **performance.js** - Performance optimization hooks and utilities
- **animations.js** - Reusable animation configurations

---

## errorHandler.js

Centralized error handling with user-friendly messages.

### Functions

#### `getErrorMessage(error)`
Extracts user-friendly error message from API error.

```javascript
import { getErrorMessage } from '@/utils/errorHandler';

try {
  await api.call();
} catch (error) {
  const message = getErrorMessage(error);
  console.log(message); // "Unable to connect to the server. Please check your internet connection."
}
```

#### `showErrorToast(toast, error, customMessage?)`
Display error toast notification.

```javascript
import { showErrorToast } from '@/utils/errorHandler';
import { useToast } from '@chakra-ui/react';

const toast = useToast();

try {
  await api.call();
} catch (error) {
  showErrorToast(toast, error);
  // or with custom message
  showErrorToast(toast, error, 'Failed to save changes');
}
```

#### `showSuccessToast(toast, title, description?)`
Display success toast notification.

```javascript
import { showSuccessToast } from '@/utils/errorHandler';

showSuccessToast(toast, 'Success', 'Data saved successfully');
```

#### `handleApiError(error, toast, defaultMessage?)`
Comprehensive API error handler.

```javascript
import { handleApiError } from '@/utils/errorHandler';

try {
  await api.call();
} catch (error) {
  const errorInfo = handleApiError(error, toast, 'Failed to load data');
  console.log(errorInfo.validationErrors); // { email: 'Invalid email' }
}
```

---

## validation.js

Form validation utilities with reusable validation rules.

### Usage

```javascript
import {
  validateEmail,
  validatePassword,
  validateForm,
  COMMON_VALIDATIONS
} from '@/utils/validation';

// Single field validation
const emailError = validateEmail('test@example.com'); // null (valid)
const passwordError = validatePassword('123'); // 'Password must be at least 6 characters'

// Form validation
const formValues = {
  email: 'test@example.com',
  password: '123456',
  name: 'John Doe'
};

const validationRules = {
  email: COMMON_VALIDATIONS.email, // [validateRequired, validateEmail]
  password: COMMON_VALIDATIONS.password,
  name: COMMON_VALIDATIONS.name
};

const errors = validateForm(formValues, validationRules);
// { email: null, password: null, name: null }
```

### Available Validators

- `validateRequired(value)` - Check if field is not empty
- `validateEmail(email)` - Validate email format
- `validatePassword(password)` - Check password length
- `validatePasswordMatch(password, confirmPassword)` - Verify passwords match
- `validateName(name)` - Validate name length
- `validateUrl(url)` - Validate URL format
- `validateDate(date)` - Validate date format
- `validateFutureDate(date)` - Ensure date is in future
- `validatePastDate(date)` - Ensure date is in past
- `validateTime(time)` - Validate time format (HH:MM)
- `validatePositiveNumber(value)` - Ensure positive number
- `validateInteger(value)` - Ensure integer

### Custom Validators

```javascript
import { createValidator, combineValidators } from '@/utils/validation';

// Create custom validator
const validateMinLength = createValidator(
  (value) => value.length >= 10,
  'Must be at least 10 characters'
);

// Combine multiple validators
const validateUsername = combineValidators(
  validateRequired,
  validateMinLength
);
```

---

## performance.js

Performance optimization utilities including debouncing, throttling, and responsive hooks.

### Debouncing

#### `useDebounce(value, delay)`
Debounce a value (useful for search inputs).

```javascript
import { useDebounce } from '@/utils/performance';

const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    // API call with debounced value
    fetchResults(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  return <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />;
};
```

#### `useDebouncedCallback(callback, delay, dependencies)`
Debounce a callback function.

```javascript
import { useDebouncedCallback } from '@/utils/performance';

const debouncedSearch = useDebouncedCallback(
  (query) => {
    fetchResults(query);
  },
  500,
  []
);
```

### Throttling

#### `useThrottle(value, limit)`
Throttle a value.

```javascript
import { useThrottle } from '@/utils/performance';

const ScrollComponent = () => {
  const [scrollY, setScrollY] = useState(0);
  const throttledScrollY = useThrottle(scrollY, 200);

  // Use throttledScrollY for expensive operations
};
```

### Responsive Hooks

#### `useIsMobile()`, `useIsTablet()`, `useIsDesktop()`
Detect viewport size.

```javascript
import { useIsMobile, useIsTablet, useIsDesktop } from '@/utils/performance';

const ResponsiveComponent = () => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  return (
    <Box>
      {isMobile && <MobileView />}
      {isTablet && <TabletView />}
      {isDesktop && <DesktopView />}
    </Box>
  );
};
```

#### `useMediaQuery(query)`
Custom media query hook.

```javascript
import { useMediaQuery } from '@/utils/performance';

const isLargeScreen = useMediaQuery('(min-width: 1200px)');
```

### Other Hooks

#### `useWindowSize()`
Get current window dimensions.

```javascript
import { useWindowSize } from '@/utils/performance';

const { width, height } = useWindowSize();
```

#### `usePrevious(value)`
Get previous value of state/prop.

```javascript
import { usePrevious } from '@/utils/performance';

const prevCount = usePrevious(count);
console.log(`Count changed from ${prevCount} to ${count}`);
```

#### `useIntersectionObserver(options)`
Lazy load with intersection observer.

```javascript
import { useIntersectionObserver } from '@/utils/performance';

const [ref, isIntersecting] = useIntersectionObserver({
  threshold: 0.5
});

return (
  <div ref={ref}>
    {isIntersecting && <HeavyComponent />}
  </div>
);
```

---

## animations.js

Reusable animation configurations for Framer Motion and Chakra UI.

### Basic Animations

```javascript
import { fadeIn, fadeInUp, scaleIn } from '@/utils/animations';

// With Chakra UI motion components
<Box
  initial={fadeIn.initial}
  animate={fadeIn.animate}
  exit={fadeIn.exit}
  transition={fadeIn.transition}
>
  Content
</Box>
```

### Available Animations

- `fadeIn` - Simple fade in
- `fadeInUp` - Fade in from bottom
- `fadeInDown` - Fade in from top
- `fadeInLeft` - Fade in from left
- `fadeInRight` - Fade in from right
- `scaleIn` - Scale in animation
- `slideInRight` - Slide in from right
- `slideInLeft` - Slide in from left
- `shake` - Shake animation (for errors)
- `pulse` - Pulse animation
- `bounce` - Bounce animation

### Stagger Animations

```javascript
import { staggerContainer, staggerItem } from '@/utils/animations';

<VStack {...staggerContainer}>
  {items.map((item, index) => (
    <Box key={index} {...staggerItem}>
      {item}
    </Box>
  ))}
</VStack>
```

### Hover Effects (CSS)

```javascript
import { hoverLift, hoverGlow } from '@/utils/animations';

<Card sx={hoverLift}>
  Content
</Card>
```

### Custom Animations

```javascript
import { createAnimation } from '@/utils/animations';

const customAnimation = createAnimation(
  { opacity: 0, scale: 0.8 }, // initial
  { opacity: 1, scale: 1 },   // animate
  { opacity: 0, scale: 0.8 }, // exit
  { duration: 0.5 }            // transition
);
```

---

## Best Practices

### Error Handling

1. Always use `showErrorToast` for user-facing errors
2. Log detailed errors to console for debugging
3. Provide context-specific error messages

```javascript
// ✅ Good
try {
  await saveData(data);
  showSuccessToast(toast, 'Success', 'Data saved successfully');
} catch (error) {
  console.error('Save data error:', error);
  showErrorToast(toast, error, 'Failed to save data. Please try again.');
}

// ❌ Bad
try {
  await saveData(data);
  toast({ title: 'Success' });
} catch (error) {
  toast({ title: 'Error' });
}
```

### Form Validation

1. Validate on blur for better UX
2. Show validation errors inline
3. Disable submit button when form has errors

```javascript
// ✅ Good
const [errors, setErrors] = useState({});

const handleBlur = (field) => {
  const error = validators[field](formValues[field]);
  setErrors(prev => ({ ...prev, [field]: error }));
};

const handleSubmit = () => {
  const validationErrors = validateForm(formValues, validationRules);
  if (hasErrors(validationErrors)) {
    setErrors(validationErrors);
    return;
  }
  // Submit form
};
```

### Performance

1. Always debounce search inputs
2. Use lazy loading for images and heavy components
3. Implement code splitting for routes
4. Use responsive hooks instead of window.innerWidth

```javascript
// ✅ Good
const debouncedSearch = useDebounce(searchTerm, 500);

useEffect(() => {
  if (debouncedSearch) {
    fetchResults(debouncedSearch);
  }
}, [debouncedSearch]);

// ❌ Bad
useEffect(() => {
  fetchResults(searchTerm); // Triggers on every keystroke
}, [searchTerm]);
```

### Animations

1. Keep animations subtle and fast (< 300ms)
2. Use consistent animation timing across the app
3. Avoid animations on mobile for better performance

```javascript
// ✅ Good
const isMobile = useIsMobile();

<Box {...(!isMobile && fadeInUp)}>
  Content
</Box>

// ❌ Bad - heavy animations on mobile
<Box {...fadeInUp}>
  Content
</Box>
```

---

## Examples

### Complete Form with Validation and Error Handling

```javascript
import { useState } from 'react';
import { useToast } from '@chakra-ui/react';
import {
  validateForm,
  COMMON_VALIDATIONS,
  hasErrors
} from '@/utils/validation';
import {
  showErrorToast,
  showSuccessToast
} from '@/utils/errorHandler';

const MyForm = () => {
  const toast = useToast();
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validationRules = {
    email: COMMON_VALIDATIONS.email,
    password: COMMON_VALIDATIONS.password,
    name: COMMON_VALIDATIONS.name
  };

  const handleBlur = (field) => {
    const validators = validationRules[field];
    const error = validators.reduce((err, validator) => {
      return err || validator(formValues[field], formValues);
    }, null);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const validationErrors = validateForm(formValues, validationRules);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      showErrorToast(toast, { message: 'Please fix validation errors' });
      return;
    }

    try {
      setLoading(true);
      await api.submitForm(formValues);
      showSuccessToast(toast, 'Success', 'Form submitted successfully');
    } catch (error) {
      showErrorToast(toast, error, 'Failed to submit form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields with error display */}
    </form>
  );
};
```

### Debounced Search with Loading State

```javascript
import { useState, useEffect } from 'react';
import { useDebounce } from '@/utils/performance';

const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (!debouncedSearch) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const data = await api.search(debouncedSearch);
        setResults(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedSearch]);

  return (
    <Box>
      <Input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
      />
      {loading && <Spinner />}
      {results.map(result => <ResultItem key={result.id} {...result} />)}
    </Box>
  );
};
```

---

## Contributing

When adding new utilities:

1. Add comprehensive JSDoc comments
2. Include usage examples
3. Update this README
4. Add unit tests (future)
5. Follow existing patterns and naming conventions
