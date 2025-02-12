//TimeSheet.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridOptions, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import {
  format,
  startOfWeek,
  addDays,
  addMonths,
  addYears,
  startOfMonth,
  startOfYear,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Employee,
  productionCalendar2025,
  Shift,
  ShiftTypeDefinition,
  ShiftPattern,
  CalendarDay,
} from '../types';
import { getDayNorm, calculateHolidayHours, calculateShiftHours } from '../lib/utils';
import ShiftPatternForm from './ShiftPatternForm';
import AssignShiftPatternForm from './AssignShiftPatternForm';
import { ShiftCellRenderer } from './ShiftCellRenderer';
import { EmployeeDialog } from './EmployeeDialog';
import { ShiftTypeDialog } from './ShiftTypeDialog';
import { getEmployee, deleteEmployee, getWorkloadPeriods } from "../services/userService";
import { createShiftType, deleteShiftType, getShiftTypes, updateShiftType } from "../services/shiftTypeService"; 
import { createShift, deleteShift, getShifts, updateShift } from '../services/shiftService';
import { createShiftPattern, deleteShiftPattern, getShiftPatterns, updateShiftPattern } from '../services/shiftPatternService';

type ViewPeriod = 'week' | 'month' | 'year';

// Расширяем Employee, добавляя словарь смен
interface TimeSheetEntry extends Employee {
  shifts: { [key: string]: Shift[] };
}

interface FilterState {
  date: string;
  shiftTypeId: number; // лучше сразу number
}

export default function TimeSheet() {
  const [activeFilter, setActiveFilter] = useState<FilterState | null>(null);
  const gridRef = useRef<AgGridReact>(null);

  const [shiftPatterns, setShiftPatterns] = useState<ShiftPattern[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isCreatePatternDialogOpen, setIsCreatePatternDialogOpen] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('week');

  useEffect(() => {
    async function loadShiftPatterns() {
      try {
        const patterns = await getShiftPatterns();
        console.log("✅ Получены паттерны смен:", patterns);
        setShiftPatterns(patterns);
      } catch (error) {
        console.error("❌ Ошибка загрузки паттернов смен:", error);
      }
    }
    loadShiftPatterns();
  }, []);
  



  useEffect(() => {
    async function loadEmployeesAndWorkloadPeriods() {
      try {
        // Загружаем сотрудников и периоды занятости параллельно
        const [employees, periods] = await Promise.all([
          getEmployee(),
          getWorkloadPeriods()
        ]);
        console.log("✅ Загружены сотрудники:", employees);
        console.log("✅ Загружены периоды занятости:", periods);
  
        // Для каждого сотрудника фильтруем периоды, соответствующие его ID
        const entries: TimeSheetEntry[] = employees.map((emp: Employee) => ({
          ...emp,
          shifts: {},
          workloadPeriods: periods.filter((p) => p.EmployeeId === emp.ID) || [],
        }));
  
        setTimeData(entries);
      } catch (error) {
        console.error("❌ Ошибка загрузки сотрудников или периодов занятости:", error);
      }
    }
    loadEmployeesAndWorkloadPeriods();
  }, []);

  // Типы смен (ID — число)
  const [shiftTypes, setShiftTypes] = useState<ShiftTypeDefinition[]>([
   /* {
      ID: 1,
      Name: 'день',
      BackgroundColor: 'gray',
      TextColor: 'white',
      AffectsWorkingNorm: false,
      RequiredStartEndTime: true,
      Description: 'д',
      DefaultStartTime: '08:00',
      DefaultEndTime: '20:00',
      DefaultBreakStart: '12:00',
      DefaultBreakEnd: '13:00',
    },
    {
      ID: 2,
      Name: 'ночь',
      BackgroundColor: 'black',
      TextColor: 'white',
      AffectsWorkingNorm: false,
      RequiredStartEndTime: true,
      Description: 'н',
      DefaultStartTime: '20:00',
      DefaultEndTime: '08:00',
      DefaultBreakStart: '21:00',
      DefaultBreakEnd: '22:00',
    },
    {
      ID: 3,
      Name: 'ГПХ',
      BackgroundColor: 'yellow',
      TextColor: 'black',
      AffectsWorkingNorm: false,
      RequiredStartEndTime: true,
      Description: 'аф',
      DefaultStartTime: '00:00',
      DefaultEndTime: '00:00',
      DefaultBreakStart: '00:00',
      DefaultBreakEnd: '00:00',
    },*/
  ]);

 

  // Загрузка типов смен
  useEffect(() => {
    async function loadShiftTypes() {
      try {
        const types = await getShiftTypes();
        console.log("✅ Получены типы смен:", types);
        setShiftTypes(types);
      } catch (error) {
        console.error("❌ Ошибка загрузки типов смен:", error);
      }
    }
    loadShiftTypes();
  }, []);

  // Список сотрудников. ID — число
  const [timeData, setTimeData] = useState<TimeSheetEntry[]>([
   
  ]);

  useEffect(() => {
    // Если сотрудников ещё нет, ничего не делаем.
    if (timeData.length === 0) return;
  
    async function loadShifts() {
      try {
        const shifts = await getShifts();
        console.log("Запрос getShifts выполнен", shifts);
        // Обновляем timeData, добавляя смены к каждому сотруднику
        setTimeData((prevData) =>
          prevData.map((employee) => {
            // Фильтруем смены для данного сотрудника
            const employeeShifts = shifts.filter(
              (shift) => shift.EmployeeId === employee.ID
            );
            // Группируем смены по дате
            const shiftsByDate = employeeShifts.reduce(
              (acc, shift) => {
                const formattedDate = format(new Date(shift.Date), 'yyyy-MM-dd');
                if (!acc[formattedDate]) {
                  acc[formattedDate] = [];
                }
                acc[formattedDate].push(shift);
                return acc;
              },
              {} as { [date: string]: Shift[] }
            );
            return {
              ...employee,
              shifts: shiftsByDate,
            };
          })
        );
      } catch (error) {
        console.error("Ошибка загрузки смен:", error);
      }
    }
    loadShifts();
  }, [timeData.length]); // зависимость от количества сотрудников
  

 // ===========================
// Shift Pattern management
// ===========================
// Создание нового паттерна
const handleSavePattern = async (pattern: ShiftPattern): Promise<void> => {
  if (pattern.ID === 0) {
    const patternData = {
      Name: pattern.Name,
      Pattern: pattern.Pattern,
    };
    try {
      const newId = await createShiftPattern(patternData);
      const newPattern: ShiftPattern = { ...pattern, ID: newId };
      setShiftPatterns((prev) => [...prev, newPattern]);
    } catch (error) {
      console.error("Ошибка создания паттерна:", error);
    }
  }
};

// Обновление существующего паттерна
const handleUpdatePattern = async (pattern: ShiftPattern): Promise<void> => {
  if (pattern.ID !== 0) {
    const patternData = {
      Name: pattern.Name,
      Pattern: pattern.Pattern,
    };
    try {
      await updateShiftPattern(pattern.ID, patternData);
      setShiftPatterns((prev) =>
        prev.map((p) => (p.ID === pattern.ID ? pattern : p))
      );
    } catch (error) {
      console.error("Ошибка обновления паттерна:", error);
    }
  }
};

// Удаление паттерна
const handleDeletePattern = async (patternId: number): Promise<void> => {
  try {
    await deleteShiftPattern(patternId);
    setShiftPatterns((prev) => prev.filter((p) => p.ID !== patternId));
  } catch (error) {
    console.error("Ошибка удаления паттерна:", error);
  }
};


  // ===========================
  // Assign shift patterns
  // ===========================
  // В AssignShiftPatternForm приходят значения shiftTypeId как string,
  // поэтому парсим в number, прежде чем создавать смену.
  const handleAssignPattern = (
    assignments: { employeeId: string; shiftTypeId: number; date: string }[]
  ) => {
    assignments.forEach(({ employeeId, shiftTypeId, date }) => {
      const shiftType = shiftTypes.find((type) => type.ID === shiftTypeId);
      if (!shiftType) {
        console.warn(`ShiftType с ID=${shiftTypeId} не найден.`);
        return;
      }
      const hours = calculateShiftHours(
        shiftType.DefaultStartTime,
        shiftType.DefaultEndTime,
        shiftType.DefaultBreakStart,
        shiftType.DefaultBreakEnd,
        shiftType.RequiredStartEndTime ?? true
      );      
      handleAddShift(
        parseInt(employeeId, 10),
        date,
        {
          ShiftTypeId: shiftTypeId,
          Date: date,
          EmployeeId: parseInt(employeeId, 10),
          StartTime: shiftType.DefaultStartTime,
          EndTime: shiftType.DefaultEndTime,
          BreakStart: shiftType.DefaultBreakStart,
          BreakEnd: shiftType.DefaultBreakEnd,
          Hours: hours,
          IsNightShift: shiftType.Name.toLowerCase().includes('ноч') || false,
        }
      );
    });
  };

  // ===========================
  // Period generation
  // ===========================
  function generateDays(date: Date, period: ViewPeriod): Date[] {
    let start: Date;
    let end: Date;
    switch (period) {
      case 'week':
        start = startOfWeek(date, { weekStartsOn: 1 });
        end = addDays(start, 6);
        break;
      case 'month':
        start = startOfMonth(date);
        end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        break;
      case 'year':
        start = startOfYear(date);
        end = new Date(date.getFullYear(), 11, 31);
        break;
      default:
        return [];
    }
    const days: Date[] = [];
    for (let current = start; current <= end; current = addDays(current, 1)) {
      days.push(current);
    }
    return days;
  }
  const days = useMemo(() => generateDays(currentDate, viewPeriod), [currentDate, viewPeriod]);

  const handlePrevPeriod = () => {
    switch (viewPeriod) {
      case 'week':
        setCurrentDate(addDays(currentDate, -7));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, -1));
        break;
      case 'year':
        setCurrentDate(addYears(currentDate, -1));
        break;
    }
  };

  const handleNextPeriod = () => {
    switch (viewPeriod) {
      case 'week':
        setCurrentDate(addDays(currentDate, 7));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'year':
        setCurrentDate(addYears(currentDate, 1));
        break;
    }
  };

  const formatPeriodLabel = () => {
    switch (viewPeriod) {
      case 'week':
        return `Неделя ${format(currentDate, 'w', { locale: ru })} - ${format(
          currentDate,
          'LLLL yyyy',
          { locale: ru }
        )}`;
      case 'month':
        return format(currentDate, 'LLLL yyyy', { locale: ru });
      case 'year':
        return format(currentDate, 'yyyy');
    }
  };

  // ===========================
  // Employees management
  // ===========================
  const handleAddEmployee = (employeeData: Employee) => { // Теперь принимаем полный объект с ID
    const newEmployee: TimeSheetEntry = {
      ...employeeData,
      shifts: {},
      workloadPeriods: employeeData.workloadPeriods || [],
    };
    setTimeData((prev) => [...prev, newEmployee]);
  };
  

  const handleUpdateEmployee = (ID: number, employeeData: Omit<Employee, 'ID'>) => {
    setTimeData((prev) =>
      prev.map((emp) => {
        if (emp.ID === ID) {
          return {
            ...emp,
            ...employeeData,
            workloadPeriods: employeeData.workloadPeriods ?? emp.workloadPeriods,
          };
        }
        return emp;
      })
    );
  };

  const handleDeleteEmployee = async (ID: number) => {
    try {
      await deleteEmployee(ID);
      setTimeData((prev) => prev.filter((emp) => emp.ID !== ID));
      console.log("✅ Сотрудник успешно удалён.");
    } catch (error) {
      console.error("❌ Ошибка при удалении сотрудника:", error);
    }
  };
  

 // ===========================
// ShiftType management
// ===========================
const handleAddShiftType = async (
  shiftTypeData: Omit<ShiftTypeDefinition, 'ID'>
): Promise<void> => {
  try {
    // Вызываем сервис создания типа смены, который возвращает новый ID из SharePoint
    const newId = await createShiftType(shiftTypeData);
    const newShiftType: ShiftTypeDefinition = {
      ...shiftTypeData,
      ID: newId,
    };
    setShiftTypes((prev) => [...prev, newShiftType]);
  } catch (error) {
    console.error("Ошибка создания типа смены:", error);
  }
};

const handleUpdateShiftType = async (
  ID: number,
  shiftTypeData: Omit<ShiftTypeDefinition, 'ID'>
): Promise<void> => {
  try {
    await updateShiftType(ID, shiftTypeData);
    setShiftTypes((prev) =>
      prev.map((type) => (type.ID === ID ? { ...shiftTypeData, ID } : type))
    );
  } catch (error) {
    console.error("Ошибка обновления типа смены:", error);
  }
};

const handleDeleteShiftType = async (ID: number): Promise<void> => {
  // Проверяем, используется ли тип смены
  const isInUse = timeData.some((employee) =>
    Object.values(employee.shifts).flat().some((shift) => shift.ShiftTypeId === ID)
  );
  if (isInUse) {
    alert("Нельзя удалить тип смены, который уже используется");
    return;
  }
  try {
    await deleteShiftType(ID);
    setShiftTypes((prev) => prev.filter((type) => type.ID !== ID));
  } catch (error) {
    console.error("Ошибка удаления типа смены:", error);
  }
};


 // ===========================
// Shifts management
// ===========================

// Добавить смену
const handleAddShift = async (
  employeeId: number,
  date: string,
  shiftData: Omit<Shift, 'ID'>
): Promise<void> => {
  try {
    // Создаем смену через сервис, получая новый ID из SharePoint
    const newId = await createShift(shiftData);
    const newShift: Shift = {
      ...shiftData,
      ID: newId,
    };
    setTimeData((prevData) =>
      prevData.map((employee) => {
        if (employee.ID === employeeId) {
          return {
            ...employee,
            shifts: {
              ...employee.shifts,
              [date]: [...(employee.shifts[date] || []), newShift],
            },
          };
        }
        return employee;
      })
    );
  } catch (error) {
    console.error("Ошибка при добавлении смены:", error);
  }
};

// Обновить смену
const handleUpdateShift = async (
  employeeId: number,
  date: string,
  shiftId: number,
  shiftData: Omit<Shift, 'ID'>
): Promise<void> => {
  try {
    await updateShift(shiftId, shiftData);
    setTimeData((prevData) =>
      prevData.map((employee) => {
        if (employee.ID === employeeId) {
          return {
            ...employee,
            shifts: {
              ...employee.shifts,
              [date]: employee.shifts[date].map((shift) =>
                shift.ID === shiftId ? { ...shiftData, ID: shiftId } : shift
              ),
            },
          };
        }
        return employee;
      })
    );
  } catch (error) {
    console.error("Ошибка при обновлении смены:", error);
  }
};

// Удалить смену
const handleDeleteShift = async (
  employeeId: number,
  date: string,
  shiftId: number
): Promise<void> => {
  try {
    await deleteShift(shiftId);
    setTimeData((prevData) =>
      prevData.map((employee) => {
        if (employee.ID === employeeId) {
          return {
            ...employee,
            shifts: {
              ...employee.shifts,
              [date]: employee.shifts[date].filter((s) => s.ID !== shiftId),
            },
          };
        }
        return employee;
      })
    );
  } catch (error) {
    console.error("Ошибка при удалении смены:", error);
  }
};

  // ===========================
  // AgGrid: row data
  // ===========================
  const rows = useMemo(() => {
    return timeData
      // Фильтруем сотрудников, если activeFilter установлен
      .filter((employee) => {
        if (!activeFilter) return true;
        const shiftsForDate = employee.shifts[activeFilter.date] || [];
        // Приводим shift.ShiftTypeId к числу для сравнения
        return shiftsForDate.some(
          (shift) => Number(shift.ShiftTypeId) === activeFilter.shiftTypeId
        );
      })
      .map((employee) => {
        const totalHours = days.reduce((sum: number, day: Date) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const shifts = employee.shifts[dateStr] || [];
          return sum + shifts.reduce((s: number, shift: Shift) => {
            const shiftType = shiftTypes.find(
              (t) => t.ID === Number(shift.ShiftTypeId)
            );
            // Если CivilLawContract === false (или falsy), добавляем часы
            return shiftType && !shiftType.CivilLawContract ? s + shift.Hours : s;
          }, 0);
        }, 0);
  
        const totalHoursCLW = days.reduce((sum: number, day: Date) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const shifts = employee.shifts[dateStr] || [];
          return sum + shifts.reduce((s: number, shift: Shift) => {
            const shiftType = shiftTypes.find(
              (t) => t.ID === Number(shift.ShiftTypeId)
            );
            const isCLW = shiftType?.CivilLawContract ?? false;
            return isCLW ? s + shift.Hours : s;
          }, 0);
        }, 0);
  
        const holidayHours = days.reduce((sum: number, day: Date) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const shifts = employee.shifts[dateStr] || [];
          return sum + shifts.reduce((s: number, shift: Shift) => s + calculateHolidayHours(shift), 0);
        }, 0);
  
        const normHours = days.reduce((sum: number, day: Date) => {
          let dayNorm = getDayNorm(day);
          const dateStr = format(day, "yyyy-MM-dd");
          const shifts = employee.shifts[dateStr] || [];
          const hasAffectingShift = shifts.some((shift) => {
            const shiftType = shiftTypes.find(
              (type) => type.ID === Number(shift.ShiftTypeId)
            );
            return shiftType?.AffectsWorkingNorm;
          });
          if (hasAffectingShift) return sum;
          let fraction = 1;
          const workloadPeriods = employee.workloadPeriods ?? [];
          for (const period of workloadPeriods) {
            if (
              (!period.StartDate || period.StartDate <= dateStr) &&
              (!period.EndDate || period.EndDate >= dateStr)
            ) {
              fraction = period.Fraction;
            }
          }
          dayNorm *= fraction;
          return sum + dayNorm;
        }, 0);
  
        const row: any = {
          ID: employee.ID,
          employeeId: employee.ID,
          Title: employee.Title,
          JobTitle: employee.JobTitle,
          Department: employee.Department,
          Office: employee.Office,
          workloadPeriods: employee.workloadPeriods,
          totalHours, // Лента (CivilLawContract === false)
          totalHoursCLW, // ГПХ (CivilLawContract === true)
          holidayHours,
          normHours,
        };
  
        days.forEach((day) => {
          const formattedDate = format(day, "yyyy-MM-dd");
          const shifts = employee.shifts[formattedDate] || [];
          row[`day-${formattedDate}`] = {
            employeeId: employee.ID,
            date: formattedDate,
            shifts,
          };
        });
  
        return row;
      });
  }, [timeData, days, shiftTypes, activeFilter]);
  
  

  // ===========================
  // AgGrid: column defs
  // ===========================
  const fixedColumns: ColDef[] = useMemo(() => [
    {
      headerName: 'Сотрудник',
      field: 'Title',
      width: 200,
      pinned: 'left',
      cellRenderer: 'employeeCellRenderer',
      sortable: false,
      suppressMovable: true,
    },
    {
      headerComponent: () => (
        <div style={{ textAlign: "right", lineHeight: 1.2 }}>
          <div>Всего часов</div>
          <div style={{ fontSize: "0.8rem" }}>ЛЕНТА | ГПХ</div>
        </div>
      ),
      field: "totalHours",
      width: 150,
      pinned: "left",
      sortable: false,
      suppressMovable: true,
      cellStyle: { textAlign: "right", fontWeight: "bold" },
      valueGetter: (params: any) => {
        const totalHours = params.data.totalHours;
        const totalHoursCLW = params.data.totalHoursCLW;
        return `${totalHours}ч | ${totalHoursCLW}ч`;
      },
    },
    {
      headerName: 'Праздничные часы',
      field: 'holidayHours',
      width: 150,
      pinned: 'left',
      sortable: false,
      suppressMovable: true,
      cellStyle: { textAlign: 'right', fontWeight: 'bold' },
      valueFormatter: (params: ValueFormatterParams) => `${params.value}ч`,
    },
    {
      headerName: 'Нормо часы',
      field: 'normHours',
      width: 120,
      pinned: 'left',
      sortable: false,
      suppressMovable: true,
      cellStyle: { textAlign: 'right', fontWeight: 'bold' },
      valueFormatter: (params: ValueFormatterParams) => `${params.value}ч`,
    },
    {
      headerName: 'Переработки/Недоработки',
      field: 'overtimeUndertime',
      width: 180,
      pinned: 'left',
      sortable: false,
      suppressMovable: true,
      cellStyle: { textAlign: 'right', fontWeight: 'bold' },
      valueGetter: (params: any) => {
        const { totalHours, normHours, holidayHours } = params.data;
        if (totalHours - normHours < 0) {
          return parseFloat((totalHours - normHours).toFixed(2));
        }
        if (totalHours - normHours - holidayHours > 0) {
          return parseFloat((totalHours - normHours - holidayHours).toFixed(2));
        }
        return null;
      },
      valueFormatter: (params: ValueFormatterParams) => {
        if (params.value === null || params.value === undefined) return '';
        return `${params.value}ч`;
      },
    },
  ], []);

  const dynamicColumns: ColDef[] = useMemo(
    () =>
      days.map((day) => {
        const formattedDate = format(day, "yyyy-MM-dd");
        const isHoliday = productionCalendar2025.some(
          (calDay: CalendarDay) =>
            calDay.Date === formattedDate && calDay.Type === "п"
        );
        const isPrevHoliday = productionCalendar2025.some(
          (calDay: CalendarDay) =>
            calDay.Date === formattedDate && calDay.Type === "пп"
        );
  
        // Подсчитываем количество смен каждого типа для данного дня
        const countsForDay: { [key: number]: number } = {};
        shiftTypes.forEach((st) => {
          countsForDay[st.ID] = 0;
        });
        timeData.forEach((employee) => {
          const shifts = employee.shifts[formattedDate] || [];
          shifts.forEach((shift) => {
            if (countsForDay[shift.ShiftTypeId] !== undefined) {
              countsForDay[shift.ShiftTypeId]++;
            }
          });
        });
  
        return {
          headerName: `${format(day, "EEEEEE", { locale: ru })}\n${format(
            day,
            "d MMM",
            { locale: ru }
          )}`,
          field: `day-${formattedDate}`,
          width: 150,
          minWidth: 150,
          sortable: false,
          cellRenderer: "shiftCellRenderer",
          cellRendererParams: {
            shiftTypes,
            handleAddShift,
            handleUpdateShift,
            handleDeleteShift,
          },
          headerComponent: () => {
            const isFilterActive = activeFilter?.date === formattedDate;
            return (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "stretch",
                  px: 0,
                  py: 1,
                  //borderRight: 1,
                  borderColor: "divider",
                  backgroundColor: isHoliday ? "rgba(255, 0, 0, 0.3)" : isPrevHoliday ? "orange" : undefined,
                  //color: isHoliday ? "white" : undefined,
                  height: "100%",
                }}
              >
                {/* Левая колонка: день недели, дата и норма часов */}
                <Box
                  sx={{
                    flexBasis: "40%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    pl: 1,
                  }}
                >
                  <Typography variant="subtitle2">
                    {format(day, "EEEEEE", { locale: ru })}
                  </Typography>
                  <Typography variant="body2">
                    {format(day, "d MMM", { locale: ru })}
                  </Typography>
                  <Typography variant="caption">
                    НРВ: {getDayNorm(day)}ч
                  </Typography>
                </Box>
                {/* Правая колонка: кнопки типов смен с вертикальной прокруткой */}
                <Box
                  sx={{
                    flexBasis: "60%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    //maxHeight: 80,
                    overflowY: "auto",
                    pr: 1,
                  }}
                >
                  {shiftTypes
                    .filter((type) => countsForDay[type.ID] > 0)
                    .map((type) => {
                      const isActive =
                        isFilterActive && activeFilter?.shiftTypeId === type.ID;
                      return (
                        <Button
                          key={type.ID}
                          variant="text"
                          size="small"
                          sx={{
                            m: 0.25,
                            backgroundColor: type.BackgroundColor,
                            color: type.TextColor,
                            ...(isActive && { border: "2px solid blue" }),
                            fontSize: "0.7rem",
                            textTransform: "none",
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            if (isActive) {
                              // Сброс фильтра
                              setActiveFilter(null);
                            } else {
                              // Установка фильтра
                              setActiveFilter({
                                date: formattedDate,
                                shiftTypeId: type.ID,
                              });
                            }
                          }}
                        >
                          {type.Name}: {countsForDay[type.ID]}
                        </Button>
                      );
                    })}
                </Box>
              </Box>
            );
          },
        };
      }),
    [days, shiftTypes, timeData, activeFilter]
  );
  

  const allColumns: ColDef[] = useMemo(
    () => [...fixedColumns, ...dynamicColumns],
    [fixedColumns, dynamicColumns]
  );

  const gridOptions: GridOptions = useMemo(() => ({
    defaultColDef: {
      resizable: true,
      sortable: false,
      filter: false,
    },
    rowHeight: 80,
    headerHeight: 120,
    components: {
      // Рендер ячейки сотрудника (левый столбец)
      employeeCellRenderer: (params: ICellRendererParams) => {
        const [dialogOpen, setDialogOpen] = useState(false);
        const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
        const employee = params.data as TimeSheetEntry;
        if (!employee) return null;
      
        const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          setMenuAnchorEl(e.currentTarget);
        };
      
        const handleMenuClose = () => setMenuAnchorEl(null);
      
        return (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              position: 'relative',
              paddingLeft: '30px', // резервируем место для иконки
              // При наведении делаем иконку видимой
              '&:hover .settingsButton': { opacity: 1 },
            }}
          >
            {/* Кнопка с иконкой (шестерёнкой) – скрыта по умолчанию */}
            <Button
              className="settingsButton"
              onClick={handleMenuOpen}
              variant="text"
              sx={{
                opacity: 0,
                transition: 'opacity 0.3s',
                position: 'absolute',
                left: 0,
                minWidth: 'auto',
                padding: 0,
              }}
            >
              <ManageAccountsIcon style={{ height: 24, width: 24 }} />
            </Button>
      
            {/* Информация о сотруднике */}
            <Box>
              <Typography variant="subtitle1">{employee.Title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {employee.JobTitle}
              </Typography>
            </Box>
      
            <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
              <MenuItem
                onClick={(e) => {
                  e.preventDefault();
                  setDialogOpen(true);
                  handleMenuClose();
                }}
                sx={{ color: "#267db1" }}>
               <EditIcon fontSize="small" sx={{ mr: 1 }} />
               Изменить
              </MenuItem>
              <MenuItem
                onClick={() => {
                  params.context.handleDeleteEmployee(employee.ID);
                  handleMenuClose();
                }}
                sx={{ color: "error.main" }}>
                     <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                     Удалить
              </MenuItem>
            </Menu>
      
            <EmployeeDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              employee={employee}
              onSave={(data) => params.context.handleUpdateEmployee(employee.ID, data)}
            />
          </Box>
        );
      },
      shiftCellRenderer: ShiftCellRenderer,
    },
    context: {
      handleUpdateEmployee,
      handleDeleteEmployee,
      handleAddShift,
      handleUpdateShift,
      handleDeleteShift,
    },
    suppressDragLeaveHidesColumns: true,
  }), [handleUpdateEmployee, handleDeleteEmployee, handleAddShift, handleUpdateShift, handleDeleteShift]);

  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.refreshCells({ force: true });
    }
  }, [shiftTypes]);

  // Сброс фильтра, когда меняется период
  useEffect(() => {
    setActiveFilter(null);
  }, [viewPeriod, currentDate]);

  // Меню в заголовке
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const handleTopMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(e.currentTarget);
  };
  const handleTopMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // ===========================
  // Render
  // ===========================
  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QueryBuilderIcon style={{ height: 24, width: 24 }} />
            <Typography variant="h6">График работы</Typography>
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EmployeeDialog
              onSave={handleAddEmployee}
              trigger={
                <Button variant="outlined" startIcon={<PersonAddAltIcon style={{ height: 16, width: 16 }} />}>
                  Добавить сотрудника
                </Button>
              }
            />
            <Button
              variant="outlined"
              startIcon={<SettingsIcon style={{ height: 16, width: 16 }} />}
              onClick={handleTopMenuOpen}
            >
              Управление чередованием
            </Button>
            <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleTopMenuClose}>
              <MenuItem
                onClick={() => {
                  setIsCreatePatternDialogOpen(true);
                  handleTopMenuClose();
                }}
              >
                <AddIcon style={{ height: 16, width: 16, marginRight: 4 }} />
                Создать чередование
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setIsAssignDialogOpen(true);
                  handleTopMenuClose();
                }}
              >
                <SettingsIcon style={{ height: 16, width: 16, marginRight: 4 }} />
                Применить чередование
              </MenuItem>
            </Menu>
            <ShiftTypeDialog
              shiftTypes={shiftTypes}
              onSave={handleAddShiftType}
              onUpdate={handleUpdateShiftType}
              onDelete={handleDeleteShiftType}
              trigger={
                <Button variant="outlined" startIcon={<SettingsIcon style={{ height: 16, width: 16 }} />}>
                  Управление типами смен
                </Button>
              }
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="view-period-label">Период</InputLabel>
                <Select
                  labelId="view-period-label"
                  value={viewPeriod}
                  label="Период"
                  onChange={(e) => setViewPeriod(e.target.value as ViewPeriod)}
                >
                  <MenuItem value="week">Неделя</MenuItem>
                  <MenuItem value="month">Месяц</MenuItem>
                  <MenuItem value="year">Год</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button variant="outlined" onClick={handlePrevPeriod}>
                  <ArrowBackIosIcon style={{ height: 24, width: 24 }} />
                </Button>
                <Typography variant="subtitle1" sx={{ px: 1, fontWeight: 'medium' }}>
                  {formatPeriodLabel()}
                </Typography>
                <Button variant="outlined" onClick={handleNextPeriod}>
                  <ArrowForwardIosIcon style={{ height: 24 , width: 24 }} />
                </Button>
              </Box>
            </Box>
          </Box>
        }
      />
      <CardContent>
        <Box sx={{ width: '100%', height: '85vh', overflow: 'auto' }}>
          <AgGridReact
            ref={gridRef}
            rowData={rows}
            columnDefs={allColumns}
            gridOptions={gridOptions}
            suppressRowClickSelection
            rowSelection="single"
            animateRows
            modules={[ClientSideRowModelModule]}
          />
        </Box>
      </CardContent>

      <Dialog
        open={isCreatePatternDialogOpen}
        onClose={() => setIsCreatePatternDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Управление чередованиями</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Создавайте и изменяйте правила чередования
          </DialogContentText>
          {/* Если ваш ShiftPatternForm ожидает ShiftPattern с полями ID: string; Name: string; Pattern: boolean[] */}
          <ShiftPatternForm
            existingPatterns={shiftPatterns}
            onSave={handleSavePattern}
            onUpdate={handleUpdatePattern}
            onDelete={handleDeletePattern}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsCreatePatternDialogOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={isAssignDialogOpen}
        onClose={() => setIsAssignDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Применение чередования</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Примените правила чередования для быстрого назначения смен
          </DialogContentText>
          {/* Убедитесь, что в AssignShiftPatternForm пропсы соответствуют типам:
              - shiftTypeId: string
              - employeeId: string
              - date: string
          */}
          <AssignShiftPatternForm
            employees={timeData.map((employee) => ({
              id: String(employee.ID),    // приводим к строке
              name: employee.Title,       // поле Title из Employee
            }))}
            shiftPatterns={shiftPatterns} // ID: string
            shiftTypes={shiftTypes}       // ID: number
            onAssign={handleAssignPattern}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAssignDialogOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
