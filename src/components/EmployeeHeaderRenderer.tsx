// EmployeeHeaderRenderer.tsx
import React, { useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import { EmployeeDialog } from "./EmployeeDialog";

// Определяем интерфейс пропсов для компонента
interface EmployeeHeaderRendererProps {
  context: {
    handleAddEmployee: (employeeData: any) => void;
  };
}

const EmployeeHeaderRenderer: React.FC<EmployeeHeaderRendererProps> = (props) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      width="100%"
      sx={{ pl: 1, pr: 1, height: "100%" }}
    >
      <Typography variant="subtitle2"  sx={{ fontWeight: "bold" }}>Сотрудник</Typography>
      <Button
        onClick={(e) => {
          e.stopPropagation(); // предотвращаем запуск сортировки/фильтрации
          setDialogOpen(true);
        }}
        sx={{ minWidth: 0, padding: 0 }}
      >
        <PersonAddAltIcon fontSize="small" />
      </Button>
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

export default EmployeeHeaderRenderer;
