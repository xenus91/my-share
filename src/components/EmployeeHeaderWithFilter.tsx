import { useState } from 'react';
import {
    Box, Typography, Button, TextField, Select, MenuItem, InputLabel, IconButton, Badge, Popover
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
];

const EmployeeHeaderWithFilter = (props: any) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const { onFilterChange } = props; // callback для обновления фильтра

    // Состояния для выбранного поля и текста фильтра
    const [selectedField, setSelectedField] = useState('Title');
    const [filterText, setFilterText] = useState('');

    // Состояние для управления popover
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    // Вызываем onFilterChange с объектом { field, value }
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

    // Открытие/закрытие popover
    const handleOpenFilterPopover = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleCloseFilterPopover = () => {
        setAnchorEl(null);
    };

    const isFilterActive = filterText.trim() !== '';

    return (
        <Box display="flex" flexDirection="column" width="100%" sx={{ p: 1 }}>
            {/* Верхняя строка – заголовок и кнопки */}
            <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    Сотрудник
                </Typography>
                <Box>
                    {/* Кнопка фильтрации с Badge */}
                    <Badge color="primary" variant="dot" invisible={!isFilterActive} sx={{
                        '& .MuiBadge-badge': {
                            top: 10,  // смещение сверху
                            right: 8, // смещение слева
                        }, '& .MuiBadge-dot': {
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                          },
                        mr: 2,
                    }} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                        <IconButton
                            onClick={handleOpenFilterPopover}
                            size="small"
                            // Если фильтр активен, меняем фон и цвет кнопки
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
                    {/* Кнопка добавления сотрудника */}
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
            {/* Всплывающее окно для фильтрации */}
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
                    <InputLabel id="employee-filter-field-label">Свойство для фильтрации</InputLabel>
                    <Select
                        labelId="employee-filter-field-label"
                        value={selectedField}
                        onChange={handleSelectChange}
                        fullWidth
                        variant="outlined"
                        size="small"
                        sx={{ mt: 1 }}
                    >
                        {filterableFields.map((field) => (
                            <MenuItem key={field.value} value={field.value}>
                                {field.label}
                            </MenuItem>
                        ))}
                    </Select>
                    <TextField
                        variant="outlined"
                        size="small"
                        placeholder="Введите значение..."
                        value={filterText}
                        onChange={handleTextChange}
                        fullWidth
                        sx={{ mt: 2 }}
                    />
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
