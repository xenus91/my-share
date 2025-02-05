'use client';

import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Typography,
  Grid,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import { v4 as uuidv4 } from "uuid";
import { Employee, WorkloadPeriod } from "../types";
import {
  getUserIdByLoginName,
  getUserPropertiesByAccountName,
  createEmployee,
} from "../services/userService";

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
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  // Форма для базовых данных сотрудника
  const [formData, setFormData] = useState({
    winName: "",       // Имя пользователя win (логин)
    preferredName: "", // Имя, полученное из PeopleManager (PreferredName)
    position: "",      // Должность (SPS-JobTitle)
    department: "",    // Подразделение (Department)
    office: "",        // Офис (Office)
    workloadPeriods: [] as WorkloadPeriod[],
  });

  // Состояние для хранения ошибок
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setFormData({
        winName: employee.name || "",
        position: employee.position || "",
        department: employee.department || "",
        office: "",
        workloadPeriods: employee.workloadPeriods?.map((p) => ({ ...p })) || [],
        preferredName: "",
      });
    } else {
      setFormData({
        winName: "",
        position: "",
        department: "",
        office: "",
        workloadPeriods: [],
        preferredName: "",
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

  // Функция для поиска пользователя по логину и заполнения расширенных полей
  const handleSearch = async () => {
    if (!formData.winName) {
      setError("Введите логин пользователя");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const id = await getUserIdByLoginName(formData.winName);
      if (!id) {
        throw new Error("Пользователь с таким логином не найден");
      }
      setUserId(id);
      const accountName = `i:0#.w|retail\\${formData.winName}`;
      const props = await getUserPropertiesByAccountName(accountName);
      if (props) {
        setFormData((prev) => ({
          ...prev,
          preferredName: props.preferredName,
          position: props.jobTitle,
          department: props.department,
          office: props.office,
        }));
      } else {
        setError("Не удалось получить расширенные свойства пользователя");
      }
    } catch (err: any) {
      setError(err.message || "Ошибка при поиске пользователя");
    } finally {
      setLoading(false);
    }
  };

  // Обработчик отправки формы – создание сотрудника
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.winName) return;
    if (!userId) {
      setError("Сначала выполните поиск пользователя");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        preferredName: formData.preferredName,
        employeeId: userId,
        jobTitle: formData.position,
        department: formData.department,
        office: formData.office,
      };
      const createdEmployee: any = await createEmployee(payload);
      console.log("Создан сотрудник:", createdEmployee);
      onSave({
        name: createdEmployee.Title, // PreferredName
        position: createdEmployee.JobTitle,
        department: createdEmployee.Department,
        office: createdEmployee.Office, // Email убираем
        workloadPeriods: formData.workloadPeriods,
      });
      setIsOpen(false);
      setFormData({
        winName: "",
        preferredName: "",
        position: "",
        department: "",
        office: "",
        workloadPeriods: [],
      });
      setUserId(null);
    } catch (err: any) {
      setError(err.message || "Ошибка при создании сотрудника");
    } finally {
      setLoading(false);
    }
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
        <DialogTitle>{employee ? "Редактировать сотрудника" : "Добавить сотрудника"}</DialogTitle>
        <DialogContent>
          <DialogContentText variant="body2" gutterBottom>
            Введите данные сотрудника. Введите "Имя пользователя win" и нажмите "Поиск"
            для автоматического заполнения полей: Имя (PreferredName), Должность, Подразделение и Офис.
          </DialogContentText>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* Левая колонка – данные пользователя */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Имя пользователя win"
                  fullWidth
                  margin="normal"
                  value={formData.winName}
                  onChange={(e) => setFormData({ ...formData, winName: e.target.value })}
                  required
                />
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Button variant="outlined" onClick={handleSearch} startIcon={<SearchIcon />}>
                    {loading ? "Поиск..." : "Поиск"}
                  </Button>
                </Box>
                <TextField
                  label="Имя"
                  fullWidth
                  margin="normal"
                  value={formData.preferredName}
                  onChange={(e) => setFormData({ ...formData, preferredName: e.target.value })}
                />
                <TextField
                  label="Должность"
                  fullWidth
                  margin="normal"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                />
                <TextField
                  label="Подразделение"
                  fullWidth
                  margin="normal"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                />
                <TextField
                  label="Офис"
                  fullWidth
                  margin="normal"
                  value={formData.office}
                  onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                />
              </Grid>
              {/* Правая колонка – периоды занятости */}
              <Grid item xs={12} sm={6}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
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
                            handleChangeWorkloadPeriod(period.id, "startDate", e.target.value)
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
                            handleChangeWorkloadPeriod(period.id, "endDate", e.target.value)
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
                      <Grid item xs={6} container alignItems="center" justifyContent="flex-end">
                        <IconButton onClick={() => handleDeleteWorkloadPeriod(period.id)}>
                          <DeleteIcon color="error" />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Grid>
              <Grid item xs={12}>
                {error && (
                  <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                    {error}
                  </Typography>
                )}
                <DialogActions sx={{ mt: 2 }}>
                  <Button onClick={() => setIsOpen(false)}>Отмена</Button>
                  <Button type="submit" variant="contained">
                    {employee ? "Обновить сотрудника" : "Добавить сотрудника"}
                  </Button>
                </DialogActions>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
}
