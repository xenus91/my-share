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
import { format, parseISO } from 'date-fns';
import SearchIcon from "@mui/icons-material/Search";
import DeleteIcon from "@mui/icons-material/Delete";
import { Employee, WorkloadPeriod } from "../types";
import {
  getUserIdByLoginName,
  getUserPropertiesByAccountName,
  createEmployee,
  updateEmployee,
  createWorkloadPeriod,
  updateWorkloadPeriod,
  deleteWorkloadPeriod,
} from "../services/userService";

interface EmployeeDialogProps {
  employee?: Employee;
  onSave: (employee: Employee) => void; // ✅ Теперь можно передавать ID
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

  // Поле для логина (используется только для поиска)
  const [login, setLogin] = useState("");

  // Состояние формы соответствует интерфейсу Employee (без поля ID)
  const [formData, setFormData] = useState({
    Title: "",
    EmployeeID:"",
    JobTitle: "",
    Department: "",
    Office: "",
    workloadPeriods: [] as WorkloadPeriod[],
  });

  // Здесь будем хранить корректный lookup‑ID сотрудника (его основной ID из SharePoint)
  const [lookupEmployeeId, setLookupEmployeeId] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // При редактировании заполняем форму данными сотрудника;
  // теперь используем всегда employee.ID в качестве lookup‑ID
  useEffect(() => {
    if (employee) {
      setLookupEmployeeId(employee.ID);
      setFormData({
        Title: employee.Title,
        EmployeeID: employee.EmployeeID,
        JobTitle: employee.JobTitle,
        Department: employee.Department,
        Office: employee.Office,
        // Форматируем даты для корректного отображения в input type="date"
        workloadPeriods: employee.workloadPeriods.map((p) => ({
          ...p,
          StartDate: p.StartDate ? format(parseISO(p.StartDate), "yyyy-MM-dd") : "",
          EndDate: p.EndDate ? format(parseISO(p.EndDate), "yyyy-MM-dd") : "",
        })),
      });
      //console.log("Employee loaded:", employee);
    } else {
      setFormData({
        Title: "",
        EmployeeID:"",
        JobTitle: "",
        Department: "",
        Office: "",
        workloadPeriods: [],
      });
      setLookupEmployeeId(null);
    }
  }, [employee, isOpen]);

  // При добавлении нового периода присваиваем временный отрицательный числовой ID
  const handleAddWorkloadPeriod = () => {
    if (!lookupEmployeeId) {
      alert("Ошибка: ID сотрудника отсутствует. Сохраните сотрудника перед добавлением периода.");
      return;
    }
    const newPeriod: WorkloadPeriod = {
      ID: -Math.floor(Math.random() * 1000000),
      StartDate: "",
      EndDate: "",
      Fraction: 1,
      EmployeeId: lookupEmployeeId,
    };
    const updatedPeriods = [...formData.workloadPeriods, newPeriod];
    setFormData((prev) => ({ ...prev, workloadPeriods: updatedPeriods }));
  };

  // Функция удаления периода: если период уже сохранён (ID >= 0), вызывается API, иначе просто удаляется из состояния
  const handleDeleteWorkloadPeriod = async (ID: number) => {
    if (ID >= 0) {
      try {
        await deleteWorkloadPeriod(ID);
      } catch (error: any) {
        alert(error.message || "Ошибка при удалении периода");
        return;
      }
    }
    const updatedPeriods = formData.workloadPeriods.filter((p) => p.ID !== ID);
    setFormData((prev) => ({ ...prev, workloadPeriods: updatedPeriods }));
    // Передаём обновлённые данные сотрудника в родительский компонент
    if (employee) {
      onSave({ ...employee, workloadPeriods: updatedPeriods });
    }
  };

  const handleChangeWorkloadPeriod = (
    ID: number,
    key: keyof WorkloadPeriod,
    value: string | number
  ) => {
    const updatedPeriods = formData.workloadPeriods.map((p) =>
      p.ID === ID ? { ...p, [key]: value } : p
    );
    setFormData((prev) => ({ ...prev, workloadPeriods: updatedPeriods }));
  };

  // Функция сохранения (создания или обновления) периода занятости
  const handleSavePeriod = async (period: WorkloadPeriod) => {
    if (lookupEmployeeId === null) {
      alert("Сначала сохраните сотрудника, затем редактируйте периоды.");
      return;
    }
    try {
      let updatedPeriod: WorkloadPeriod;
      if (period.ID < 0) {
        // Создание нового периода
        const newID = await createWorkloadPeriod(lookupEmployeeId, period);
        updatedPeriod = { ...period, ID: newID, EmployeeId: lookupEmployeeId };
        alert("Период успешно сохранён.");
      } else {
        await updateWorkloadPeriod(period.ID, period);
        updatedPeriod = { ...period };
        alert("Период успешно обновлён.");
      }
      const updatedPeriods = formData.workloadPeriods.map((p) =>
        p.ID === period.ID ? updatedPeriod : p
      );
      setFormData((prev) => ({ ...prev, workloadPeriods: updatedPeriods }));
      if (employee) {
        onSave({ ...employee, workloadPeriods: updatedPeriods });
      }
    } catch (error: any) {
      alert(error.message || "Ошибка при сохранении периода");
    }
  };
  
  // Поиск пользователя по логину
  const handleSearch = async () => {
    if (!login) {
      setError("Введите логин пользователя");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const id = await getUserIdByLoginName(login);
      if (!id) throw new Error("Пользователь с таким логином не найден");
      setUserId(id);
      const accountName = `i:0#.w|retail\\${login}`;
      const props = await getUserPropertiesByAccountName(accountName);
      if (props) {
        setFormData(prev => ({
          ...prev,
          Title: props.preferredName,
          EmployeeID: props.employeeID,
          JobTitle: props.jobTitle,
          Department: props.department,
          Office: props.office,
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

  // Отправка формы – создание сотрудника в SharePoint
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Title || !formData.JobTitle || !formData.Department) {
      setError("Заполните все обязательные поля");
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      if (employee) {
        // ✅ Обновляем сотрудника
        await updateEmployee(employee.ID, {
          preferredName: formData.Title,
          employeeID: formData.EmployeeID,
          jobTitle: formData.JobTitle,
          department: formData.Department,
          office: formData.Office,
        });
  
        //console.log(`✅ Сотрудник (ID: ${employee.ID}) обновлён`);
  
        // 🔹 Локально обновляем состояние, чтобы UI сразу изменился
        onSave({
          ...employee,
          Title: formData.Title,
          EmployeeID:formData.EmployeeID,
          JobTitle: formData.JobTitle,
          Department: formData.Department,
          Office: formData.Office,
        });
      } else {
        // ✅ Создаём нового сотрудника
        if (!userId) {
          setError("Ошибка: Не найден userId.");
          return;
        }
  
        const payload = {
          preferredName: formData.Title,
          EmployeeID: formData.EmployeeID,
          employeeId: userId.toString(), // ✅ Преобразуем `userId` в `string`
          jobTitle: formData.JobTitle,
          department: formData.Department,
          office: formData.Office,
        };
  
        const createdEmployee: any = await createEmployee(payload);
        //console.log("✅ Создан новый сотрудник:", createdEmployee);
  
        setLookupEmployeeId(createdEmployee.ID);
  
        onSave({
          ID: createdEmployee.ID,
          EmployeeID:createdEmployee.EmployeeID,
          Title: createdEmployee.Title,
          JobTitle: createdEmployee.JobTitle,
          Department: createdEmployee.Department,
          Office: createdEmployee.Office,
          workloadPeriods: formData.workloadPeriods,
        });
      }
  
      setIsOpen(false);
      setLogin("");
      setUserId(null);
    } catch (err: any) {
      setError(err.message || "Ошибка при сохранении сотрудника");
    } finally {
      setLoading(false);
    }
  };
  
  
  // Добавляем вывод логов (например, в консоль) при открытии формы, чтобы отобразить параметры сотрудника
  useEffect(() => {
    if (isOpen) {
      //console.log("Форма открыта. Employee:", employee);
      //console.log("LookupEmployeeId =", lookupEmployeeId);
    }
  }, [isOpen, employee, lookupEmployeeId]);

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
          <DialogContentText variant="body2" gutterBottom>
            Введите данные сотрудника. Укажите логин пользователя и нажмите "Поиск" для
            автозаполнения полей: Title, JobTitle, Department и Office.
          </DialogContentText>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              {/* Левая колонка – данные сотрудника */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Логин пользователя"
                  fullWidth
                  margin="normal"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  
                />
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Button variant="outlined" onClick={handleSearch} startIcon={<SearchIcon />}>
                    {loading ? "Поиск..." : "Поиск"}
                  </Button>
                </Box>
                <TextField
                  label="Title"
                  fullWidth
                  margin="normal"
                  value={formData.Title}
                  onChange={(e) =>
                    setFormData({ ...formData, Title: e.target.value })
                  }
                />
                <TextField
                  label="JobTitle"
                  fullWidth
                  margin="normal"
                  value={formData.JobTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, JobTitle: e.target.value })
                  }
                  required
                />
                 <TextField
                  label="EmployeeID"
                  fullWidth
                  margin="normal"
                  value={formData.EmployeeID}
                  onChange={(e) =>
                    setFormData({ ...formData, EmployeeID: e.target.value })
                  }
                  required
                />
                <TextField
                  label="Department"
                  fullWidth
                  margin="normal"
                  value={formData.Department}
                  onChange={(e) =>
                    setFormData({ ...formData, Department: e.target.value })
                  }
                  required
                />
                <TextField
                  label="Office"
                  fullWidth
                  margin="normal"
                  value={formData.Office}
                  onChange={(e) =>
                    setFormData({ ...formData, Office: e.target.value })
                  }
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
                    key={period.ID}
                    border={1}
                    borderColor="grey.300"
                    borderRadius={1}
                    p={2}
                    mb={2}
                  >
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={6}>
                        <TextField
                          label="Дата начала"
                          type="date"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          value={period.StartDate}
                          onChange={(e) =>
                            handleChangeWorkloadPeriod(period.ID, "StartDate", e.target.value)
                          }
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Дата окончания"
                          type="date"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                          value={period.EndDate}
                          onChange={(e) =>
                            handleChangeWorkloadPeriod(period.ID, "EndDate", e.target.value)
                          }
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Процент занятости"
                          type="number"
                          fullWidth
                          inputProps={{ min: 0, max: 100, step: 1 }}
                          value={(period.Fraction * 100).toString()}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            const fraction = Math.max(0, Math.min(1, val / 100));
                            handleChangeWorkloadPeriod(period.ID, "Fraction", fraction);
                          }}
                        />
                      </Grid>
                      <Grid item xs={6} container spacing={1} justifyContent="flex-end">
                        <Grid item>
                          <IconButton onClick={() => handleDeleteWorkloadPeriod(period.ID)}>
                            <DeleteIcon color="error" />
                          </IconButton>
                        </Grid>
                        {employee && (
                          <Grid item>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleSavePeriod(period)}
                            >
                              {period.ID < 0 ? "Сохранить" : "Обновить"}
                            </Button>
                          </Grid>
                        )}
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
