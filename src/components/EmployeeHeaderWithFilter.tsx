import React, { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  IconButton,
  Badge,
  Popover,
  Checkbox,
  ListItemText,
  OutlinedInput
} from '@mui/material';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { EmployeeDialog } from './EmployeeDialog';

const filterableFields = [
  { value: 'Title', label: 'Имя' },
  { value: 'JobTitle', label: 'Должность' },
  { value: 'Department', label: 'Отдел' },
  { value: 'Office', label: 'Офис' },
  { value: 'EmployeeID', label: 'Табельный номер' },
  { value: 'ShiftNumber', label: 'Номер смены' },
  { value: 'ShiftTimeType', label: 'Время смены' },
];

interface EmployeeHeaderWithFilterProps {
  onFilterChange: (filter: { field: string; value: string[] }) => void;
  onSortChange: (sort: { field: string; order: 'asc' | 'desc' | null }) => void;
  employees: any[]; // массив сотрудников
  // остальные props от ag‑grid
  [key: string]: any;
}

const EmployeeHeaderWithFilter: React.FC<EmployeeHeaderWithFilterProps> = (props) => {
  const { onFilterChange, employees, onSortChange } = props;
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    console.log('Employees object:', employees);
  }, [employees]);

  const [selectedField, setSelectedField] = useState('Title');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  const uniqueOptions = useMemo(() => {
    if (!employees || !Array.isArray(employees)) {
      console.log('Employees array is empty or invalid.');
      return [];
    }
    const values = employees
      .map(emp => emp[selectedField])
      .filter(val => val != null);
    const uniqueVals = Array.from(new Set(values));
    console.log(`Field "${selectedField}": values =`, values, 'unique =', uniqueVals);
    return uniqueVals;
  }, [employees, selectedField]);

  useEffect(() => {
    if (uniqueOptions.length === 0) {
      console.log('Select options are empty for field:', selectedField);
    }
  }, [uniqueOptions, selectedField]);

  const handleFilterChange = (field: string, values: string[]) => {
    console.log(`Filter changed: field "${field}", selected options =`, values);
    onFilterChange({ field, value: values });
  };

  const handleSelectChange = (event: any) => {
    const newField = event.target.value;
    console.log('Selected new field:', newField);
    setSelectedField(newField);
    setSelectedOptions([]);
    handleFilterChange(newField, []);
  };

  const handleOptionsChange = (event: any) => {
    const { target: { value } } = event;
    const newOptions = typeof value === 'string' ? value.split(',') : value;
    console.log('New selected options:', newOptions);
    setSelectedOptions(newOptions);
    handleFilterChange(selectedField, newOptions);
  };

  const handleResetFilter = () => {
    console.log('Reset filter for field:', selectedField);
    setSelectedOptions([]);
    handleFilterChange(selectedField, []);
  };

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleOpenFilterPopover = (event: React.MouseEvent<HTMLElement>) => {
    console.log('Open filter popover');
    setAnchorEl(event.currentTarget);
  };
  const handleCloseFilterPopover = () => {
    console.log('Close filter popover');
    setAnchorEl(null);
  };

  const isFilterActive = selectedOptions.length > 0;

  // Обработка клика по заголовку для сортировки
  const handleSortChange = () => {
    let newSort: 'asc' | 'desc' | null;
    if (!sortOrder) newSort = 'asc';
    else if (sortOrder === 'asc') newSort = 'desc';
    else newSort = null;
    setSortOrder(newSort);
    // Передаём выбранное поле (из селекта) и новый порядок сортировки
    onSortChange({ field: selectedField, order: newSort });
  };

  return (
    <Box display="flex" flexDirection="column" width="100%" sx={{ p: 1 }}>
      {/* Верхняя часть: выбор поля для фильтрации/сортировки */}
      <Box display="flex" alignItems="center" sx={{ mb: 0.5 }}>
        <Select
          value={selectedField}
          onChange={handleSelectChange}
          variant="outlined"
          size="small"
          sx={{
            fontSize: '0.8rem',
            height: '30px',
            borderRadius: '16px',
            '& .MuiSelect-select': { padding: '4px 8px' },
          }}
        >
          {filterableFields.map((field) => (
            <MenuItem key={field.value} value={field.value}>
              {field.label}
            </MenuItem>
          ))}
        </Select>
      </Box>
      {/* Заголовок с сортировкой по выбранному полю */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }} onClick={handleSortChange}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            Сотрудник
          </Typography>
          {sortOrder === 'asc' && <ArrowUpwardIcon fontSize="small" />}
          {sortOrder === 'desc' && <ArrowDownwardIcon fontSize="small" />}
        </Box>
        <Box>
          <Badge
            color="primary"
            variant="dot"
            invisible={!isFilterActive}
            sx={{
              '& .MuiBadge-badge': { top: 10, right: 8 },
              '& .MuiBadge-dot': { width: '10px', height: '10px', borderRadius: '50%' },
              mr: 2,
            }}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <IconButton
              onClick={handleOpenFilterPopover}
              size="small"
              sx={{
                backgroundColor: isFilterActive ? 'rgba(25, 118, 210, 0.2)' : 'inherit',
                '&:hover': { backgroundColor: isFilterActive ? 'rgba(25, 118, 210, 0.3)' : 'inherit' },
                borderRadius: 1,
              }}
            >
              <FilterListIcon color={isFilterActive ? 'primary' : 'action'} />
            </IconButton>
          </Badge>
          <Button onClick={(e) => { e.stopPropagation(); setDialogOpen(true); }} sx={{ minWidth: 0, padding: 0 }}>
            <PersonAddAltIcon fontSize="small" />
          </Button>
        </Box>
      </Box>
      {/* Popover для выбора значений фильтра */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseFilterPopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ p: 2, width: 250 }}>
          <Select
            multiple
            value={selectedOptions}
            onChange={handleOptionsChange}
            input={<OutlinedInput label="Выберите" />}
            renderValue={(selected) => (selected as string[]).join(', ')}
            fullWidth
            sx={{ fontSize: '0.8rem', '& .MuiSelect-select': { padding: '4px 8px' }, borderRadius: '16px' }}
          >
            {uniqueOptions.length > 0 ? (
              uniqueOptions.map((option: string) => (
                <MenuItem key={option} value={option}>
                  <Checkbox checked={selectedOptions.indexOf(option) > -1} />
                  <ListItemText primary={option} />
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>Нет значений</MenuItem>
            )}
          </Select>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" size="small" onClick={handleResetFilter} sx={{ fontSize: '0.8rem' }}>
              Сбросить
            </Button>
          </Box>
        </Box>
      </Popover>

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
