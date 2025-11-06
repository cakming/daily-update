import { IconButton } from '@chakra-ui/react';
import { useColorMode } from '@chakra-ui/react';

const ColorModeToggle = () => {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <IconButton
      aria-label="Toggle color mode"
      onClick={toggleColorMode}
      variant="ghost"
      size="sm"
    >
      {colorMode === 'light' ? '🌙' : '☀️'}
    </IconButton>
  );
};

export default ColorModeToggle;
