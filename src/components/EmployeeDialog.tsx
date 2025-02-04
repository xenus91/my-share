'use client';

import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Grid,
  Box,
  Typography,
  IconButton,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import { v4 as uuidv4 } from "uuid";
import { Employee, WorkloadPeriod } from "../types";

interface EmployeeDialogProps {
  employee?: Employee;
  onSave: (employee: Omit<Employee, "id">) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EmployeeDialog({
  employee,
  onSave,
  trigger,
  open: externalOpen,
  onOpenChange,
}: EmployeeDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    position: "",
    department: "",
    email: "",
    workloadPeriods: [] as WorkloadPeriod[],
  });

  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || "",
        position: employee.position || "",
        department: employee.department || "",
        email: employee.email || "",
        workloadPeriods: employee.workloadPeriods?.map((p) => ({ ...p })) || [],
      });
    } else {
      setFormData({
        name: "",
        position: "",
        department: "",
        email: "",
        workloadPeriods: [],
      });
    }
  }, [employee, isOpen]);

  const handleAddWorkloadPeriod = () => {
    const newPeriod: WorkloadPeriod = {
      id: uuidv4(),
      startDate: "",
      endDate: "",
      fraction: 1,
    };
    setFormData((prev) => ({
      ...prev,
      workloadPeriods: [...prev.workloadPeriods, newPeriod],
    }));
  };

  const handleDeleteWorkloadPeriod = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      workloadPeriods: prev.workloadPeriods.filter((p) => p.id !== id),
    }));
  };

  const handleChangeWorkloadPeriod = (
    id: string,
    key: keyof WorkloadPeriod,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      workloadPeriods: prev.workloadPeriods.map((p) =>
        p.id === id ? { ...p, [key]: value } : p
      ),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: formData.name,
      position: formData.position,
      department: formData.department,
      email: formData.email,
      workloadPeriods: formData.workloadPeriods,
    });
    setIsOpen(false);
  };

  return (
    <>
      {trigger && (
        <Box
          component="span"
          onClick={() => setIsOpen(true)}
          sx={{ cursor: "pointer" }}
        >
          {trigger}
        </Box>
      )}
      <Dialog open={isOpen} onClose={() => setIsOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>
          {employee ? "Редактировать сотрудника" : "Добавить сотрудника"}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            {employee
              ? "Обновите информацию о сотруднике и его периоды занятости."
              : "Введите информацию для нового сотрудника."}
          </Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Имя"
                  fullWidth
                  margin="normal"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
                <TextField
                  label="Должность"
                  fullWidth
                  margin="normal"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  required
                />
                <TextField
                  label="Отдел"
                  fullWidth
                  margin="normal"
                  value={formData.department}
                  onChange={(e) =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  required
                />
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mb={2}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    Периоды занятости
                  </Typography>
                  <Button variant="outlined" onClick={handleAddWorkloadPeriod}>
                    + Добавить период
                  </Button>
                </Box>
                {formData.workloadPeriods.map((period) => (
                  <Box
                    key={period.id}
                    border={1}
                    borderColor="grey.300"
                    borderRadius={1}
                    p={2}
                    mb={2}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          label="Дата начала"
                          type="date"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          value={period.startDate}
                          onChange={(e) =>
                            handleChangeWorkloadPeriod(
                              period.id,
                              "startDate",
                              e.target.value
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Дата окончания"
                          type="date"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          value={period.endDate}
                          onChange={(e) =>
                            handleChangeWorkloadPeriod(
                              period.id,
                              "endDate",
                              e.target.value
                            )
                          }
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Процент занятости"
                          type="number"
                          fullWidth
                          inputProps={{ min: 0, max: 100, step: 1 }}
                          value={(period.fraction * 100).toString()}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            const fraction = Math.max(0, Math.min(1, val / 100));
                            handleChangeWorkloadPeriod(period.id, "fraction", fraction);
                          }}
                        />
                      </Grid>
                      <Grid
                        item
                        xs={6}
                        container
                        alignItems="center"
                        justifyContent="flex-end"
                      >
                        <IconButton onClick={() => console.log("Сохранён период:", period.id)}>
                          <CheckCircleIcon color="success" />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteWorkloadPeriod(period.id)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Grid>
              <Grid item xs={12}>
                <Box mt={2}>
                  <Button type="submit" variant="contained" fullWidth>
                    {employee ? "Обновить сотрудника" : "Добавить сотрудника"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
