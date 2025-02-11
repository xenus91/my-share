import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import NightsStayIcon from '@mui/icons-material/NightsStay';

interface ThemeToggleProps {
  mode: 'light' | 'dark';
  onChange: (mode: 'light' | 'dark') => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ mode, onChange }) => {
  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'light' | 'dark' | null
  ) => {
    if (newMode !== null) {
      onChange(newMode);
    }
  };

  return (
    <ToggleButtonGroup
      value={mode}
      exclusive
      onChange={handleChange}
      aria-label="theme mode"
    >
      <ToggleButton value="light" aria-label="light mode">
        <WbSunnyIcon />
      </ToggleButton>
      <ToggleButton value="dark" aria-label="dark mode">
        <NightsStayIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export default ThemeToggle;
