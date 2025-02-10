//ShiftDialog.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from "@mui/material";
import { Shift, ShiftTypeDefinition } from "../types";
import { calculateShiftHours } from "../lib/utils";

interface ShiftDialogProps {
  shift?: Shift;
  /** Пришедший извне ID сотрудника – строка, а в Shift.EmployeeId нужен number */
  employeeId: string; 
  date: string;
  shiftTypes: ShiftTypeDefinition[];
  onSave: (shift: Omit<Shift, "ID">) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShiftDialog({
  shift,
  employeeId,
  date,
  shiftTypes,
  onSave,
  open,
  onOpenChange,
}: ShiftDialogProps) {
  // Сохраняем ShiftTypeId как число, поэтому если shiftTypes[0]?.ID отсутствует, подставим 0
  const [formData, setFormData] = useState({
    shiftTypeId: shift?.ShiftTypeId ?? shiftTypes[0]?.ID ?? 0,
    startTime: shift?.StartTime ?? shiftTypes[0]?.DefaultStartTime ?? "09:00",
    endTime: shift?.EndTime ?? shiftTypes[0]?.DefaultEndTime ?? "17:00",
    breakStart: shift?.BreakStart ?? shiftTypes[0]?.DefaultBreakStart ?? "13:00",
    breakEnd: shift?.BreakEnd ?? shiftTypes[0]?.DefaultBreakEnd ?? "14:00",
  });

  // Изменяем тип смены (ShiftTypeId), парсим значение как число
  const handleShiftTypeChange = (rawValue: string) => {
    const newShiftTypeId = Number(rawValue);
    const selectedType = shiftTypes.find((type) => type.ID === newShiftTypeId);
    if (!selectedType) return;

    setFormData({
      shiftTypeId: newShiftTypeId,
      startTime: selectedType.DefaultStartTime,
      endTime: selectedType.DefaultEndTime,
      breakStart: selectedType.DefaultBreakStart,
      breakEnd: selectedType.DefaultBreakEnd,
    });
  };

  // Отправка формы
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Считаем продолжительность смены
    const hours = calculateShiftHours(
      formData.startTime,
      formData.endTime,
      formData.breakStart,
      formData.breakEnd
    );

    // Определяем, что смена считается ночной, если время окончания меньше времени начала
    const isNightShift = formData.endTime < formData.startTime;

    // Вызываем onSave, передавая поля с заглавной буквы
    onSave({
      EmployeeId: Number(employeeId),
      Date: date,
      ShiftTypeId: formData.shiftTypeId,
      StartTime: formData.startTime,
      EndTime: formData.endTime,
      BreakStart: formData.breakStart,
      BreakEnd: formData.breakEnd,
      Hours: hours,
      IsNightShift: isNightShift,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} fullWidth maxWidth="sm">
      <DialogTitle>{shift ? "Изменить смену" : "Добавить смену"}</DialogTitle>
      <DialogContent>
        <DialogContentText>Выберите тип и введите время</DialogContentText>

        {/* Форма: тип смены и времена */}
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="shift-type-label">Тип смены</InputLabel>
            <Select
              labelId="shift-type-label"
              id="shift-type"
              value={formData.shiftTypeId}
              label="Тип смены"
              onChange={(e) => handleShiftTypeChange(e.target.value as string)}
            >
              {shiftTypes.map((type) => (
                <MenuItem key={type.ID} value={type.ID}>
                  {type.Name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                id="startTime"
                label="Начало смены"
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                id="endTime"
                label="Окончание смены"
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
                fullWidth
                required
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={6}>
              <TextField
                id="breakStart"
                label="Начало перерыва"
                type="time"
                value={formData.breakStart}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, breakStart: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                id="breakEnd"
                label="Окончание перерыва"
                type="time"
                value={formData.breakEnd}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, breakEnd: e.target.value }))
                }
                InputLabelProps={{ shrink: true }}
                inputProps={{ step: 300 }}
                fullWidth
                required
              />
            </Grid>
          </Grid>

          <DialogActions sx={{ mt: 2 }}>
            <Button onClick={() => onOpenChange(false)}>Отмена</Button>
            <Button type="submit" variant="contained">
              {shift ? "Обновить" : "Добавить"} смену
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
