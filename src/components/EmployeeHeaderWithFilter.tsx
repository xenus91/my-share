import { useState } from 'react';
import { Box, Typography, Button, TextField } from '@mui/material';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { EmployeeDialog } from './EmployeeDialog';

const EmployeeHeaderWithFilter = (props: any) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { onFilterChange } = props; // получаем callback для фильтра

  return (
    <Box display="flex" flexDirection="column" width="100%" sx={{ p: 1 }}>
      {/* Верхняя часть – заголовок и кнопка */}
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
      {/* Поле для ввода фильтра */}
      <TextField
        variant="outlined"
        size="small"
        placeholder="Фильтр сотрудника..."
        onChange={(e) => onFilterChange(e.target.value)}
        style={{ width: '100%' }}
      />
      <EmployeeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={(data) => {
          props.context.handleAddEmployee(data);
          setDialogOpen(false);
        }}
      />
    </Box>
  );
};

export default EmployeeHeaderWithFilter;
