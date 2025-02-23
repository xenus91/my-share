import { useState } from 'react';
import { Box, Typography, Button, TextField, Select, MenuItem, InputLabel } from '@mui/material';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { EmployeeDialog } from './EmployeeDialog';

// Определяем список фильтруемых свойств сотрудника
const filterableFields = [
  { value: 'Title', label: 'Имя' },
  { value: 'JobTitle', label: 'Должность' },
  { value: 'Department', label: 'Отдел' },
  { value: 'Office', label: 'Офис' },
];

const EmployeeHeaderWithFilter = (props: any) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  // Callback для обновления фильтра передается через props (например, onFilterChange)
  const { onFilterChange } = props;

  // Состояние выбранного свойства для фильтрации и текстового значения фильтра
  const [selectedField, setSelectedField] = useState('Title');
  const [filterText, setFilterText] = useState('');

  // При изменении любого из параметров вызываем onFilterChange с объектом { field, value }
  const handleFilterChange = (field: string, value: string) => {
    if (onFilterChange) {
      onFilterChange({ field, value });
    }
  };

  const handleSelectChange = (event: any) => {
    const newField = event.target.value;
    setSelectedField(newField);
    handleFilterChange(newField, filterText);
  };

  const handleTextChange = (event: any) => {
    const newValue = event.target.value;
    setFilterText(newValue);
    handleFilterChange(selectedField, newValue);
  };

  return (
    <Box display="flex" flexDirection="column" width="100%" sx={{ p: 1 }}>
      {/* Верхняя часть – заголовок и кнопка добавления сотрудника */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
          Сотрудник
        </Typography>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            setDialogOpen(true);
          }}
          sx={{ minWidth: 0, padding: 0 }}
        >
          <PersonAddAltIcon fontSize="small" />
        </Button>
      </Box>
      {/* Select для выбора свойства сотрудника для фильтрации */}
      <Box sx={{ mt: 1 }}>
        <InputLabel id="employee-filter-field-label">Свойство для фильтрации</InputLabel>
        <Select
          labelId="employee-filter-field-label"
          value={selectedField}
          onChange={handleSelectChange}
          fullWidth
          variant="outlined"
          size="small"
        >
          {filterableFields.map((field) => (
            <MenuItem key={field.value} value={field.value}>
              {field.label}
            </MenuItem>
          ))}
        </Select>
      </Box>
      {/* Поле для ввода текста фильтра */}
      <Box sx={{ mt: 1 }}>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Введите значение для фильтрации..."
          value={filterText}
          onChange={handleTextChange}
          fullWidth
        />
      </Box>
      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={(data: any) => {
          props.context.handleAddEmployee(data);
          setDialogOpen(false);
        }}
      />
    </Box>
  );
};

export default EmployeeHeaderWithFilter;
