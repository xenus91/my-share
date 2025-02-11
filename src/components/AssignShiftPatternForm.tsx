import React, { useState } from "react";
import { format, addDays } from "date-fns";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { ShiftPattern, ShiftTypeDefinition } from "../types";

interface AssignShiftPatternFormProps {
  employees: { id: string; name: string }[];
  shiftPatterns: ShiftPattern[];
  shiftTypes: ShiftTypeDefinition[];
  onAssign: (
    assignments: {
      employeeId: string;
      shiftTypeId: number;
      date: string;
    }[]
  ) => void;
}

export default function AssignShiftPatternForm({
  employees,
  shiftPatterns,
  shiftTypes,
  onAssign,
}: AssignShiftPatternFormProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [shiftPatternId, setShiftPatternId] = useState<number | "">("");
  const [shiftTypeId, setShiftTypeId] = useState<number | "">("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const spId = typeof shiftPatternId === "number" ? shiftPatternId : 0;
    const stId = typeof shiftTypeId === "number" ? shiftTypeId : 0;

    const selectedPattern = shiftPatterns.find((p) => p.ID === spId);
    const selectedShiftType = shiftTypes.find((type) => type.ID === stId);

    if (!selectedPattern || !selectedShiftType || !startDate || !endDate) {
      alert("Заполните все поля");
      return;
    }

    const assignments: {
      employeeId: string;
      shiftTypeId: number;
      date: string;
    }[] = [];

    selectedEmployees.forEach((employeeId) => {
      let currentDate = new Date(startDate);
      let dayIndex = 0;

      while (currentDate <= new Date(endDate)) {
        // Если по циклу правило чередования возвращает true, создаём назначение
        if (selectedPattern.Pattern[dayIndex % selectedPattern.Pattern.length]) {
          assignments.push({
            employeeId,
            shiftTypeId: selectedShiftType.ID,
            date: format(currentDate, "yyyy-MM-dd"),
          });
        }
        currentDate = addDays(currentDate, 1);
        dayIndex++;
      }
    });

    onAssign(assignments);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ p: 3, bgcolor: "grey.100", borderRadius: 2 }}
    >
      <Typography variant="h6" sx={{ mb: 2 }}>
        Назначить график сотрудникам
      </Typography>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="employees-label">Сотрудники</InputLabel>
        <Select
          labelId="employees-label"
          multiple
          value={selectedEmployees}
          onChange={(e) =>
            setSelectedEmployees(
              typeof e.target.value === "string"
                ? e.target.value.split(",")
                : e.target.value
            )
          }
          label="Сотрудники"
        >
          {employees.map((employee) => (
            <MenuItem key={employee.id} value={employee.id}>
              {employee.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="shift-pattern-label">Правило чередования</InputLabel>
        <Select
          labelId="shift-pattern-label"
          value={shiftPatternId}
          onChange={(e) => setShiftPatternId(Number(e.target.value))}
          label="Правило чередования"
        >
          <MenuItem value="">
            <em>Выберите правило чередования</em>
          </MenuItem>
          {shiftPatterns.map((pattern) => (
            <MenuItem key={pattern.ID} value={pattern.ID}>
              {pattern.Name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="shift-type-label">Тип смены</InputLabel>
        <Select
          labelId="shift-type-label"
          value={shiftTypeId}
          onChange={(e) => setShiftTypeId(Number(e.target.value))}
          label="Тип смены"
        >
          <MenuItem value="">
            <em>Выберите тип смены</em>
          </MenuItem>
          {shiftTypes.map((type) => (
            <MenuItem key={type.ID} value={type.ID}>
              {type.Name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label="Дата начала"
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        sx={{ mb: 2 }}
        InputLabelProps={{ shrink: true }}
      />

      <TextField
        fullWidth
        label="Дата окончания"
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        sx={{ mb: 2 }}
        InputLabelProps={{ shrink: true }}
      />

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button type="submit" variant="contained" color="primary">
          Назначить
        </Button>
      </Box>
    </Box>
  );
}
