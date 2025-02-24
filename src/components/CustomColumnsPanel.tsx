import React, { useState } from 'react';
import {
  Box,
  TextField,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  IconButton,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

interface CustomColumnsPanelProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onReset: () => void;
}

const CustomColumnsPanel: React.FC<CustomColumnsPanelProps> = ({ options, selected, onChange, onReset }) => {
  const [search, setSearch] = useState('');

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (option: string) => {
    const currentIndex = selected.indexOf(option);
    let newSelected: string[] = [];
    if (currentIndex === -1) {
      newSelected = [...selected, option];
    } else {
      newSelected = selected.filter(item => item !== option);
    }
    onChange(newSelected);
  };

  return (
    <Box sx={{ width: 250, p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <SearchIcon sx={{ fontSize: '0.75rem' }} />
        <TextField
          variant="outlined"
          size="small"
          placeholder="Поиск"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            ml: 1,
            flex: 1,
            '& .MuiInputBase-input': { fontSize: '0.6rem' }
          }}
        />
        {search && (
          <IconButton size="small" onClick={() => setSearch('')}>
            <ClearIcon sx={{ fontSize: '0.75rem' }} />
          </IconButton>
        )}
      </Box>
      <Box sx={{ maxHeight: 250, overflowY: 'auto' }}>
        <List dense>
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <ListItemButton 
                key={option} 
                onClick={() => handleToggle(option)}
                sx={{ py: 0.25 }}
              >
                <ListItemIcon sx={{ minWidth: 24 }}>
                  <Checkbox
                    edge="start"
                    checked={selected.indexOf(option) !== -1}
                    tabIndex={-1}
                    disableRipple
                    sx={{
                      transform: 'scale(0.7)' // уменьшаем размер чекбокса
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={option}
                  primaryTypographyProps={{ variant: 'caption', fontSize: '0.6rem' }}
                />
              </ListItemButton>
            ))
          ) : (
            <ListItem>
              <ListItemText
                primary="Нет значений"
                primaryTypographyProps={{ variant: 'caption', fontSize: '0.6rem' }}
              />
            </ListItem>
          )}
        </List>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
        <Button variant="outlined" size="small" onClick={onReset} sx={{ fontSize: '0.6rem', minWidth: 60 }}>
          Сбросить
        </Button>
      </Box>
    </Box>
  );
};

export default CustomColumnsPanel;
