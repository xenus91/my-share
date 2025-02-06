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
  employeeId: string;
  date: string;
  shiftTypes: ShiftTypeDefinition[];
  onSave: (shift: Omit<Shift, "id">) => void;
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
  const [formData, setFormData] = useState({
    shiftTypeId: shift?.shiftTypeId || shiftTypes[0]?.id || "",
    startTime: shift?.startTime || shiftTypes[0]?.defaultStartTime || "09:00",
    endTime: shift?.endTime || shiftTypes[0]?.defaultEndTime || "17:00",
    breakStart: shift?.breakStart || shiftTypes[0]?.defaultBreakStart || "13:00",
    breakEnd: shift?.breakEnd || shiftTypes[0]?.defaultBreakEnd || "14:00",
  });

  const handleShiftTypeChange = (shiftTypeId: string) => {
    const selectedType = shiftTypes.find((type) => type.id === shiftTypeId);
    if (!selectedType) return;
    setFormData({
      shiftTypeId,
      startTime: selectedType.defaultStartTime,
      endTime: selectedType.defaultEndTime,
      breakStart: selectedType.defaultBreakStart,
      breakEnd: selectedType.defaultBreakEnd,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const hours = calculateShiftHours(
      formData.startTime,
      formData.endTime,
      formData.breakStart,
      formData.breakEnd
    );

    const isNightShift = formData.endTime < formData.startTime;

    onSave({
      employeeId,
      date,
      shiftTypeId: formData.shiftTypeId,
      startTime: formData.startTime,
      endTime: formData.endTime,
      breakStart: formData.breakStart,
      breakEnd: formData.breakEnd,
      hours,
      isNightShift,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} fullWidth maxWidth="sm">
      <DialogTitle>{shift ? "Изменить смену" : "Добавить смену"}</DialogTitle>
      <DialogContent>
        <DialogContentText>Выберите тип и введите время</DialogContentText>
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
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
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
                  setFormData({ ...formData, startTime: e.target.value })
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
                  setFormData({ ...formData, endTime: e.target.value })
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
                  setFormData({ ...formData, breakStart: e.target.value })
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
                  setFormData({ ...formData, breakEnd: e.target.value })
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
