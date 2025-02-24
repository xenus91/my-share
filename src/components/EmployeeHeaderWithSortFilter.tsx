import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  IconButton,
  Badge,
  Popover,
} from '@mui/material';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import FilterListIcon from '@mui/icons-material/FilterList';
import { EmployeeDialog } from './EmployeeDialog';

// Список фильтруемых свойств сотрудника
const filterableFields = [
  { value: 'Title', label: 'Имя' },
  { value: 'JobTitle', label: 'Должность' },
  { value: 'Department', label: 'Отдел' },
  { value: 'Office', label: 'Офис' },
  { value: 'EmployeeID', label: 'Табельный номер' },
  { value: 'ShiftNumber', label: 'Номер смены' },
  { value: 'ShiftTimeType', label: 'Время смены' },
];

interface HeaderProps {
  context: any;
  onFilterChange: (filter: { field: string; value: string }) => void;
  // Sorting props (передаются ag‑grid)
  sort?: 'asc' | 'desc' | null;
  setSort?: (sort: 'asc' | 'desc' | null) => void;
  onSortPropertyChange?: (newProp: string) => void;
  enableSorting?: boolean;
  displayName?: string;
}

const EmployeeHeaderWithSortFilter = (props: HeaderProps) => {
  const { onFilterChange, sort, setSort, onSortPropertyChange, enableSorting, displayName } = props;
  const [dialogOpen, setDialogOpen] = useState(false);

  // ========== START sort filter: Состояния для выбранного свойства сортировки и текстового фильтра ==========
  const [selectedField, setSelectedField] = useState('Title');
  const [filterText, setFilterText] = useState('');
  // ========== END sort filter ==========

  // ===================== START: Обновление фильтра =====================
  const handleFilterChange = (field: string, value: string) => {
    console.log("[handleFilterChange] Фильтр изменён:", { field, value });
    if (onFilterChange) {
      onFilterChange({ field, value });
    }
  };
  // ===================== END: Обновление фильтра =====================

  // ===================== START: Обработчик для изменения выбранного свойства (Select) =====================
  const handleSelectChange = (event: any) => {
    const newField = event.target.value;
    console.log("[handleSelectChange] Новое свойство сортировки:", newField);
    setSelectedField(newField);
    handleFilterChange(newField, filterText);
    if (onSortPropertyChange) {
      console.log("[handleSelectChange] Вызываем onSortPropertyChange с новым свойством:", newField);
      onSortPropertyChange(newField);
    }
  };
  // ===================== END: Обработчик для изменения выбранного свойства =====================

  // ===================== START: Обработчик для изменения текста фильтра (в popover) =====================
  const handleTextChange = (event: any) => {
    const newValue = event.target.value;
    console.log("[handleTextChange] Новое значение фильтра:", newValue);
    setFilterText(newValue);
    handleFilterChange(selectedField, newValue);
  };
  // ===================== END: Обработчик для изменения текста фильтра =====================

  // ===================== START: Кнопка сброса фильтра =====================
  const handleResetFilter = () => {
    console.log("[handleResetFilter] Сброс фильтра для свойства:", selectedField);
    setFilterText('');
    handleFilterChange(selectedField, '');
  };
  // ===================== END: Кнопка сброса фильтра =====================

  // ===================== START: Управление отображением popover =====================
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const handleOpenFilterPopover = (event: React.MouseEvent<HTMLElement>) => {
    console.log("[handleOpenFilterPopover] Открытие popover");
    setAnchorEl(event.currentTarget);
  };
  const handleCloseFilterPopover = () => {
    console.log("[handleCloseFilterPopover] Закрытие popover");
    setAnchorEl(null);
  };
  // ===================== END: Управление popover =====================

  const isFilterActive = filterText.trim() !== '';

  // ===================== START: Функциональность сортировки =====================
  // Функция переключения порядка сортировки при клике по заголовку
  const toggleSort = () => {
    if (!enableSorting || !setSort) {
      console.log("[toggleSort] Сортировка не включена или setSort не предоставлена");
      return;
    }
    let newSort: 'asc' | 'desc' | null;
    if (!sort) {
      newSort = 'asc';
    } else if (sort === 'asc') {
      newSort = 'desc';
    } else {
      newSort = null;
    }
    console.log("[toggleSort] Переключение сортировки: старый порядок:", sort, "новый порядок:", newSort);
    setSort(newSort);
  };
  // ===================== END: Функциональность сортировки =====================

  return (
    <Box display="flex" flexDirection="column" width="100%" sx={{ p: 1 }}>
      {/* ========== START sort filter: Select для выбора свойства сортировки (расположен над заголовком) ========== */}
      <Box display="flex" alignItems="center" sx={{ mb: 0.5 }}>
        <Select
          value={selectedField}
          onChange={handleSelectChange}
          variant="outlined"
          size="small"
          sx={{
            fontSize: '0.8rem',
            height: '30px',
            borderRadius: '16px', // овальные края
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
      {/* ========== END sort filter ========== */}
      
      {/* Верхняя строка – заголовок "Сотрудник" и кнопки */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        {/* Заголовок, по клику на который происходит переключение сортировки */}
        <Box onClick={toggleSort} sx={{ cursor: enableSorting ? 'pointer' : 'default' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
            {displayName || 'Сотрудник'}
          </Typography>
          {sort === 'asc' && (
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center' }}>↑</Typography>
          )}
          {sort === 'desc' && (
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center' }}>↓</Typography>
          )}
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
                '&:hover': {
                  backgroundColor: isFilterActive ? 'rgba(25, 118, 210, 0.3)' : 'inherit'
                },
                borderRadius: 1,
              }}
            >
              <FilterListIcon color={isFilterActive ? 'primary' : 'action'} />
            </IconButton>
          </Badge>
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
      </Box>

      {/* ========== START filter popover: Всплывающее окно содержит только текстовое поле и кнопку сброса ========== */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleCloseFilterPopover}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, width: 250 }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Введите значение..."
            value={filterText}
            onChange={handleTextChange}
            fullWidth
            sx={{
              fontSize: '0.8rem',
              '& .MuiInputBase-input': { padding: '4px 8px' },
              borderRadius: '16px',
            }}
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" size="small" onClick={handleResetFilter} sx={{ fontSize: '0.8rem' }}>
              Сбросить
            </Button>
          </Box>
        </Box>
      </Popover>
      {/* ========== END filter popover ========== */}

      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={(data: any) => {
          console.log("[EmployeeDialog] Сохранение сотрудника:", data);
          props.context.handleAddEmployee(data);
          setDialogOpen(false);
        }}
      />
    </Box>
  );
};

export default EmployeeHeaderWithSortFilter;
