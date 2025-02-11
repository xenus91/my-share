import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  ButtonGroup, 
  InputLabel, 
  MenuItem, 
  Select, 
  TextField, 
  Typography 
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

// Интерфейс для правила чередования, где все поля соответствуют SharePoint
export interface ShiftPattern {
  ID: number;          // числовой идентификатор
  Name: string;
  Pattern: boolean[];  // массив для определения смен (true/false)
}

interface ShiftPatternFormProps {
  onSave: (pattern: ShiftPattern) => void;
  onUpdate: (pattern: ShiftPattern) => void;
  onDelete: (id: number) => void;
  existingPatterns: ShiftPattern[];
}

export default function ShiftPatternForm({
  onSave,
  onUpdate,
  onDelete,
  existingPatterns,
}: ShiftPatternFormProps) {
  // Если выбран существующий паттерн, его ID хранится здесь (0 означает новое правило)
  const [selectedPatternId, setSelectedPatternId] = useState<number>(0);
  const [pattern, setPattern] = useState<ShiftPattern>({
    ID: 0,
    Name: '',
    Pattern: [false], // Изначально правило на один день
  });

  // При изменении выбранного паттерна или списка существующих правил обновляем форму
  useEffect(() => {
    if (selectedPatternId !== 0) {
      const selected = existingPatterns.find((p) => p.ID === selectedPatternId);
      if (selected) {
        setPattern(selected);
      }
    } else {
      setPattern({ ID: 0, Name: '', Pattern: [false] });
    }
  }, [selectedPatternId, existingPatterns]);

  const toggleDay = (dayIndex: number) => {
    setPattern((prev) => ({
      ...prev,
      Pattern: prev.Pattern.map((isShift, index) =>
        index === dayIndex ? !isShift : isShift
      ),
    }));
  };

  const addDay = () => {
    setPattern((prev) => ({
      ...prev,
      Pattern: [...prev.Pattern, false],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Для нового правила (ID === 0) передаем ID = 0, чтобы SharePoint сгенерировал корректный ID
    const newPattern: ShiftPattern = { ...pattern, ID: pattern.ID !== 0 ? pattern.ID : 0 };
    if (newPattern.ID !== 0) {
      onUpdate(newPattern);
    } else {
      onSave(newPattern);
    }
    resetForm();
  };

  const handleDelete = () => {
    if (pattern.ID !== 0) {
      onDelete(pattern.ID);
      resetForm();
    }
  };

  const resetForm = () => {
    setPattern({ ID: 0, Name: '', Pattern: [false] });
    setSelectedPatternId(0);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ p: 3, bgcolor: 'grey.100', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Правило чередования
      </Typography>

      <Box sx={{ mb: 2 }}>
        <InputLabel id="pattern-select-label">Выберите правило</InputLabel>
        <Select
          fullWidth
          labelId="pattern-select-label"
          value={selectedPatternId}
          onChange={(e) => setSelectedPatternId(Number(e.target.value))}
        >
          <MenuItem value={0}>Новое правило чередования</MenuItem>
          {existingPatterns.map((p) => (
            <MenuItem key={p.ID} value={p.ID}>
              {p.Name}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <TextField
        fullWidth
        label="Название правила чередования"
        value={pattern.Name}
        onChange={(e) => setPattern((prev) => ({ ...prev, Name: e.target.value }))}
        required
        sx={{ mb: 2 }}
      />

      <Typography variant="subtitle1" gutterBottom>
        Паттерн (нажмите на кнопку для переключения)
      </Typography>
      <ButtonGroup variant="outlined" sx={{ mb: 2 }}>
        {pattern.Pattern.map((isShift, index) => {
          // Определяем порядковый номер для отмеченных (смена) и неотмеченных (вых)
          const trueOrdinal = pattern.Pattern.slice(0, index).filter(val => val).length + (isShift ? 1 : 0);
          const falseOrdinal = pattern.Pattern.slice(0, index).filter(val => !val).length + (!isShift ? 1 : 0);
          const label = isShift ? `смена ${trueOrdinal}` : `вых ${falseOrdinal}`;
          return (
            <Button
              key={index}
              onClick={() => toggleDay(index)}
              sx={{ flexDirection: 'column', minWidth: 60 }}
            >
              {isShift ? <CheckCircleIcon color="primary" /> : <CheckCircleOutlineIcon />}
              <Typography variant="caption">{label}</Typography>
            </Button>
          );
        })}
        <Button onClick={addDay} sx={{ flexDirection: 'column', minWidth: 60 }}>
          <AddCircleOutlineIcon color="success" />
          <Typography variant="caption">Добавить</Typography>
        </Button>
      </ButtonGroup>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button type="submit" variant="contained" color="success">
          {pattern.ID !== 0 ? 'Обновить' : 'Сохранить'} правило чередования
        </Button>
        {pattern.ID !== 0 && (
          <Button type="button" variant="contained" color="error" onClick={handleDelete}>
            Удалить правило чередования
          </Button>
        )}
      </Box>
    </Box>
  );
}
