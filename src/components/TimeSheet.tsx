//TimeSheet.tsx
// import React, { useState, useMemo, useRef, useEffect } from 'react';
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   Typography,
//   Box,
//   Button,
//   Menu,
//   MenuItem,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogContentText,
//   DialogActions,
//   FormControl,
//   InputLabel,
//   Select,
//   IconButton,            // // menu: импортируем IconButton
//   Drawer,                // // menu: импортируем Drawer
// } from '@mui/material';
// import EditIcon from "@mui/icons-material/Edit";
// // BEGIN BULK MODE: Импорт иконок для bulkMode
// import LibraryAddCheckOutlinedIcon from '@mui/icons-material/LibraryAddCheckOutlined';
// import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
// import LibraryAddCheckIcon from '@mui/icons-material/LibraryAddCheck';
// import EventAvailableIcon from '@mui/icons-material/EventAvailable';
// // END BULK MODE
// import DeleteIcon from "@mui/icons-material/Delete";
// import SettingsIcon from '@mui/icons-material/Settings';
// import AddIcon from '@mui/icons-material/Add';
// import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
// import MenuIcon from '@mui/icons-material/Menu';
// //import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
// import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
// import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
// import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
// import { AgGridReact } from 'ag-grid-react';
// import { ColDef, GridOptions, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
// import { ModuleRegistry } from 'ag-grid-community';
// import {
//   ClientSideRowModelModule,
//   RenderApiModule,
//   RowSelectionModule,
//   TextFilterModule,
//   NumberFilterModule,
//   DateFilterModule,
//   CustomFilterModule,
//   CellStyleModule,
//   ValidationModule
// } from 'ag-grid-community';

// // Регистрируем необходимые модули:
// ModuleRegistry.registerModules([
//   ClientSideRowModelModule,
//   RenderApiModule,
//   RowSelectionModule,
//   TextFilterModule,
//   NumberFilterModule,
//   DateFilterModule,
//   CustomFilterModule,
//   CellStyleModule,
//   ValidationModule,
// ]);

// import {
//   format,
//   startOfWeek,
//   addDays,
//   addMonths,
//   addYears,
//   startOfMonth,
//   startOfYear,
// } from 'date-fns';
// import { ru } from 'date-fns/locale';
// import {
//   Employee,
//   productionCalendar2025,
//   Shift,
//   ShiftTypeDefinition,
//   ShiftPattern,
//   CalendarDay,
// } from '../types';
// import { getDayNorm, calculateHolidayHours, calculateShiftHours } from '../lib/utils';
// import ShiftPatternForm from './ShiftPatternForm';
// import AssignShiftPatternForm from './AssignShiftPatternForm';
// import { ShiftCellRenderer } from './ShiftCellRenderer';
// import { EmployeeDialog } from './EmployeeDialog';
// import { ShiftTypeDialog } from './ShiftTypeDialog';
// import { getEmployee, deleteEmployee, getWorkloadPeriods } from "../services/userService";
// import { createShiftType, deleteShiftType, getShiftTypes, updateShiftType } from "../services/shiftTypeService";
// import { createShift, deleteShift, getShiftById, getShifts, updateShift } from '../services/shiftService';
// import { createShiftPattern, deleteShiftPattern, getShiftPatterns, updateShiftPattern } from '../services/shiftPatternService';
// import { ShiftDialog } from './ShiftDialog';
// import EmployeeHeaderWithFilter from './EmployeeHeaderWithFilter';



// type ViewPeriod = 'week' | 'month' | 'year';

// // Расширяем Employee, добавляя словарь смен
// interface TimeSheetEntry extends Employee {
//   shifts: { [key: string]: Shift[] };
// }

// interface FilterState {
//   date: string;
//   shiftTypeId: number; // лучше сразу number
// }

// export default function TimeSheet() {
//   // Регистрируем необходимые модули
//   const [employeeSort, setEmployeeSort] = useState<{ field: string; order: 'asc' | 'desc' | null }>({
//     field: 'Title',
//     order: null,
//   });

//   const [timeData, setTimeData] = useState<TimeSheetEntry[]>([

//   ]);

//   // Добавляем состояние для фильтра сотрудников
//   const [employeeFilter, setEmployeeFilter] = useState<{ field: string; value: string[] } | null>(null);
//   // Состояние для фильтрации по дате/типу смены
//   const [activeFilter, setActiveFilter] = useState<FilterState | null>(null);
//   const gridRef = useRef<AgGridReact>(null);
//   // Состояния для диалогов управления чередованиями
//   const [shiftPatterns, setShiftPatterns] = useState<ShiftPattern[]>([]);
//   const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
//   const [isCreatePatternDialogOpen, setIsCreatePatternDialogOpen] = useState(false);

//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('week');

//   // BEGIN BULK MODE: состояние режима массовых операций и выбранных смен
//   const [bulkMode, setBulkMode] = useState(false);
//   const [bulkSelectedShifts, setBulkSelectedShifts] = useState<
//     { employeeId: number; date: string; shiftId: number }[]
//   >([]);
//   const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
//   // END BULK MODE


//   // menu: состояние бокового меню для управления чередованием
//   const [sideMenuOpen, setSideMenuOpen] = useState(false);
//   const toggleSideMenu = () => {
//     setSideMenuOpen(!sideMenuOpen);
//   };

//   // Загрузка паттернов смен
//   useEffect(() => {
//     async function loadShiftPatterns() {
//       try {
//         const patterns = await getShiftPatterns();
//         //console.log("✅ Получены паттерны смен:", patterns);
//         setShiftPatterns(patterns);
//       } catch (error) {
//         console.error("❌ Ошибка загрузки паттернов смен:", error);
//       }
//     }
//     loadShiftPatterns();
//   }, []);



//   // Загрузка сотрудников и периодов занятости
//   useEffect(() => {
//     async function loadEmployeesAndWorkloadPeriods() {
//       try {
//         // Загружаем сотрудников и периоды занятости параллельно
//         const [employees, periods] = await Promise.all([
//           getEmployee(),
//           getWorkloadPeriods()
//         ]);
//         //console.log("✅ Загружены сотрудники:", employees);
//         //console.log("✅ Загружены периоды занятости:", periods);

//         // Для каждого сотрудника фильтруем периоды, соответствующие его ID
//         const entries: TimeSheetEntry[] = employees.map((emp: Employee) => ({
//           ...emp,
//           shifts: {},
//           workloadPeriods: periods.filter((p) => p.EmployeeId === emp.ID) || [],
//         }));

//         setTimeData(entries);
//       } catch (error) {
//         console.error("❌ Ошибка загрузки сотрудников или периодов занятости:", error);
//       }
//     }
//     loadEmployeesAndWorkloadPeriods();
//   }, []);

//   // Типы смен (ID — число)
//   const [shiftTypes, setShiftTypes] = useState<ShiftTypeDefinition[]>([]);



//   // Загрузка типов смен
//   useEffect(() => {
//     async function loadShiftTypes() {
//       try {
//         const types = await getShiftTypes();
//         //console.log("✅ Получены типы смен:", types);
//         setShiftTypes(types);
//       } catch (error) {
//         console.error("❌ Ошибка загрузки типов смен:", error);
//       }
//     }
//     loadShiftTypes();
//   }, []);

//   // Список сотрудников. ID — число


//   useEffect(() => {
//     // Если сотрудников ещё нет, ничего не делаем.
//     if (timeData.length === 0) return;

//     async function loadShifts() {
//       try {
//         const shifts = await getShifts();
//         //console.log("Запрос getShifts выполнен", shifts);
//         // Обновляем timeData, добавляя смены к каждому сотруднику
//         setTimeData((prevData) =>
//           prevData.map((employee) => {
//             // Фильтруем смены для данного сотрудника
//             const employeeShifts = shifts.filter(
//               (shift) => shift.EmployeeId === employee.ID
//             );
//             // Группируем смены по дате
//             const shiftsByDate = employeeShifts.reduce(
//               (acc, shift) => {
//                 const formattedDate = format(new Date(shift.Date), 'yyyy-MM-dd');
//                 if (!acc[formattedDate]) {
//                   acc[formattedDate] = [];
//                 }
//                 acc[formattedDate].push(shift);
//                 return acc;
//               },
//               {} as { [date: string]: Shift[] }
//             );
//             return {
//               ...employee,
//               shifts: shiftsByDate,
//             };
//           })
//         );
//       } catch (error) {
//         console.error("Ошибка загрузки смен:", error);
//       }
//     }
//     loadShifts();
//   }, [timeData.length]); // зависимость от количества сотрудников


//   // ===========================
//   // Shift Pattern management
//   // ===========================
//   // Создание нового паттерна
//   const handleSavePattern = async (pattern: ShiftPattern): Promise<void> => {
//     if (pattern.ID === 0) {
//       const patternData = {
//         Name: pattern.Name,
//         Pattern: pattern.Pattern,
//       };
//       try {
//         const newId = await createShiftPattern(patternData);
//         const newPattern: ShiftPattern = { ...pattern, ID: newId };
//         setShiftPatterns((prev) => [...prev, newPattern]);
//       } catch (error) {
//         console.error("Ошибка создания паттерна:", error);
//       }
//     }
//   };

//   // Обновление существующего паттерна
//   const handleUpdatePattern = async (pattern: ShiftPattern): Promise<void> => {
//     if (pattern.ID !== 0) {
//       const patternData = {
//         Name: pattern.Name,
//         Pattern: pattern.Pattern,
//       };
//       try {
//         await updateShiftPattern(pattern.ID, patternData);
//         setShiftPatterns((prev) =>
//           prev.map((p) => (p.ID === pattern.ID ? pattern : p))
//         );
//       } catch (error) {
//         console.error("Ошибка обновления паттерна:", error);
//       }
//     }
//   };

//   // Удаление паттерна
//   const handleDeletePattern = async (patternId: number): Promise<void> => {
//     try {
//       await deleteShiftPattern(patternId);
//       setShiftPatterns((prev) => prev.filter((p) => p.ID !== patternId));
//     } catch (error) {
//       console.error("Ошибка удаления паттерна:", error);
//     }
//   };


//   // ===========================
//   // Assign shift patterns
//   // ===========================
//   // В AssignShiftPatternForm приходят значения shiftTypeId как string,
//   // поэтому парсим в number, прежде чем создавать смену.
//   const handleAssignPattern = (
//     assignments: { employeeId: string; shiftTypeId: number; date: string }[]
//   ) => {
//     assignments.forEach(({ employeeId, shiftTypeId, date }) => {
//       const shiftType = shiftTypes.find((type) => type.ID === shiftTypeId);
//       if (!shiftType) {
//         console.warn(`ShiftType с ID=${shiftTypeId} не найден.`);
//         return;
//       }
//       const hours = calculateShiftHours(
//         shiftType.DefaultStartTime,
//         shiftType.DefaultEndTime,
//         shiftType.DefaultBreakStart,
//         shiftType.DefaultBreakEnd,
//         shiftType.RequiredStartEndTime ?? true
//       );
//       handleAddShift(
//         parseInt(employeeId, 10),
//         date,
//         {
//           ShiftTypeId: shiftTypeId,
//           Date: date,
//           EmployeeId: parseInt(employeeId, 10),
//           StartTime: shiftType.DefaultStartTime,
//           EndTime: shiftType.DefaultEndTime,
//           BreakStart: shiftType.DefaultBreakStart,
//           BreakEnd: shiftType.DefaultBreakEnd,
//           Hours: hours,
//           IsNightShift: shiftType.Name.toLowerCase().includes('ноч') || false,
//         }
//       );
//     });
//   };

//   // ===========================
//   // Period generation
//   // ===========================
//   function generateDays(date: Date, period: ViewPeriod): Date[] {
//     let start: Date;
//     let end: Date;
//     switch (period) {
//       case 'week':
//         start = startOfWeek(date, { weekStartsOn: 1 });
//         end = addDays(start, 6);
//         break;
//       case 'month':
//         start = startOfMonth(date);
//         end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
//         break;
//       case 'year':
//         start = startOfYear(date);
//         end = new Date(date.getFullYear(), 11, 31);
//         break;
//       default:
//         return [];
//     }
//     const days: Date[] = [];
//     for (let current = start; current <= end; current = addDays(current, 1)) {
//       days.push(current);
//     }
//     return days;
//   }
//   const days = useMemo(() => generateDays(currentDate, viewPeriod), [currentDate, viewPeriod]);

//   const handlePrevPeriod = () => {
//     switch (viewPeriod) {
//       case 'week':
//         setCurrentDate(addDays(currentDate, -7));
//         break;
//       case 'month':
//         setCurrentDate(addMonths(currentDate, -1));
//         break;
//       case 'year':
//         setCurrentDate(addYears(currentDate, -1));
//         break;
//     }
//   };

//   const handleNextPeriod = () => {
//     switch (viewPeriod) {
//       case 'week':
//         setCurrentDate(addDays(currentDate, 7));
//         break;
//       case 'month':
//         setCurrentDate(addMonths(currentDate, 1));
//         break;
//       case 'year':
//         setCurrentDate(addYears(currentDate, 1));
//         break;
//     }
//   };

//   const formatPeriodLabel = () => {
//     switch (viewPeriod) {
//       case 'week':
//         return `Неделя ${format(currentDate, 'w', { locale: ru })} - ${format(
//           currentDate,
//           'LLLL yyyy',
//           { locale: ru }
//         )}`;
//       case 'month':
//         return format(currentDate, 'LLLL yyyy', { locale: ru });
//       case 'year':
//         return format(currentDate, 'yyyy');
//     }
//   };

//   // ===========================
//   // Employees management
//   // ===========================
//   const handleAddEmployee = (employeeData: Employee) => { // Теперь принимаем полный объект с ID
//     const newEmployee: TimeSheetEntry = {
//       ...employeeData,
//       shifts: {},
//       workloadPeriods: employeeData.workloadPeriods || [],
//     };
//     setTimeData((prev) => [...prev, newEmployee]);
//   };


//   const handleUpdateEmployee = (ID: number, employeeData: Omit<Employee, 'ID'>) => {
//     setTimeData((prev) =>
//       prev.map((emp) => {
//         if (emp.ID === ID) {
//           return {
//             ...emp,
//             ...employeeData,
//             workloadPeriods: employeeData.workloadPeriods ?? emp.workloadPeriods,
//           };
//         }
//         return emp;
//       })
//     );
//   };

//   const handleDeleteEmployee = async (ID: number) => {
//     try {
//       await deleteEmployee(ID);
//       setTimeData((prev) => prev.filter((emp) => emp.ID !== ID));
//       //console.log("✅ Сотрудник успешно удалён.");
//     } catch (error) {
//       console.error("❌ Ошибка при удалении сотрудника:", error);
//     }
//   };


//   // ===========================
//   // ShiftType management
//   // ===========================
//   const handleAddShiftType = async (
//     shiftTypeData: Omit<ShiftTypeDefinition, 'ID'>
//   ): Promise<void> => {
//     try {
//       // Вызываем сервис создания типа смены, который возвращает новый ID из SharePoint
//       const newId = await createShiftType(shiftTypeData);
//       const newShiftType: ShiftTypeDefinition = {
//         ...shiftTypeData,
//         ID: newId,
//       };
//       setShiftTypes((prev) => [...prev, newShiftType]);
//     } catch (error) {
//       console.error("Ошибка создания типа смены:", error);
//     }
//   };

//   const handleUpdateShiftType = async (
//     ID: number,
//     shiftTypeData: Omit<ShiftTypeDefinition, 'ID'>
//   ): Promise<void> => {
//     try {
//       await updateShiftType(ID, shiftTypeData);
//       setShiftTypes((prev) =>
//         prev.map((type) => (type.ID === ID ? { ...shiftTypeData, ID } : type))
//       );
//     } catch (error) {
//       console.error("Ошибка обновления типа смены:", error);
//     }
//   };

//   const handleDeleteShiftType = async (ID: number): Promise<void> => {
//     // Проверяем, используется ли тип смены
//     const isInUse = timeData.some((employee) =>
//       Object.values(employee.shifts).flat().some((shift) => shift.ShiftTypeId === ID)
//     );
//     if (isInUse) {
//       alert("Нельзя удалить тип смены, который уже используется");
//       return;
//     }
//     try {
//       await deleteShiftType(ID);
//       setShiftTypes((prev) => prev.filter((type) => type.ID !== ID));
//     } catch (error) {
//       console.error("Ошибка удаления типа смены:", error);
//     }
//   };


//   // ===========================
//   // Shifts management
//   // ===========================

//   // Добавить смену
//   const handleAddShift = async (
//     employeeId: number,
//     date: string,
//     shiftData: Omit<Shift, 'ID'>
//   ): Promise<void> => {
//     try {
//       // Создаем смену через сервис, получая новый ID из SharePoint
//       const newId = await createShift(shiftData);
//       const newShift: Shift = {
//         ...shiftData,
//         ID: newId,
//       };
//       setTimeData((prevData) =>
//         prevData.map((employee) => {
//           if (employee.ID === employeeId) {
//             return {
//               ...employee,
//               shifts: {
//                 ...employee.shifts,
//                 [date]: [...(employee.shifts[date] || []), newShift],
//               },
//             };
//           }
//           return employee;
//         })
//       );
//     } catch (error) {
//       console.error("Ошибка при добавлении смены:", error);
//     }
//   };

//   // Обновить смену
//   // Обновить смену
//   const handleUpdateShift = async (
//     employeeId: number,
//     date: string,
//     shiftId: number,
//     shiftData: Omit<Shift, "ID" | "EmployeeId" | "Date">
//   ): Promise<void> => {
//     try {
//       await updateShift(shiftId, shiftData);
//       // Загружаем обновленные данные после изменения
//       const updatedShift = await getShiftById(shiftId);

//       setTimeData((prevData) =>
//         prevData.map((employee) =>
//           employee.ID === employeeId
//             ? {
//               ...employee,
//               shifts: {
//                 ...employee.shifts,
//                 [date]: employee.shifts[date].map((shift) =>
//                   shift.ID === shiftId ? updatedShift : shift
//                 ),
//               },
//             }
//             : employee
//         )
//       );
//     } catch (error) {
//       console.error("❌ Ошибка при обновлении смены:", error);
//     }
//   };

//   // Удалить смену
//   const handleDeleteShift = async (
//     employeeId: number,
//     date: string,
//     shiftId: number
//   ): Promise<void> => {
//     try {
//       await deleteShift(shiftId);
//       setTimeData((prevData) =>
//         prevData.map((employee) => {
//           if (employee.ID === employeeId) {
//             return {
//               ...employee,
//               shifts: {
//                 ...employee.shifts,
//                 [date]: employee.shifts[date].filter((s) => s.ID !== shiftId),
//               },
//             };
//           }
//           return employee;
//         })
//       );
//     } catch (error) {
//       console.error("Ошибка при удалении смены:", error);
//     }
//   };
//   // BEGIN BULK MODE: глобальное переключение режима и управление выбранными сменами
//   const toggleBulkSelection = (employeeId: number, date: string, shiftId: number) => {
//     setBulkSelectedShifts((prev) => {
//       const exists = prev.some(
//         (item) => item.employeeId === employeeId && item.date === date && item.shiftId === shiftId
//       );
//       if (exists) {
//         return prev.filter(
//           (item) => !(item.employeeId === employeeId && item.date === date && item.shiftId === shiftId)
//         );
//       } else {
//         return [...prev, { employeeId, date, shiftId }];
//       }
//     });
//   };

//   const handleBulkEditSave = (data: Omit<Shift, "ID" | "EmployeeId" | "Date">) => {
//     bulkSelectedShifts.forEach((item) => {
//       handleUpdateShift(item.employeeId, item.date, item.shiftId, data);
//     });
//     setBulkEditDialogOpen(false);
//     setBulkSelectedShifts([]);
//   };
//   // END BULK MODE


//   // ===========================
//   // AgGrid: row data
//   // ===========================
//   const rows = useMemo(() => {
//     const filteredRows = timeData
//     .filter((employee) => {
//       if (!employeeFilter || !employeeFilter.value || employeeFilter.value.length === 0) {
//         return true;
//       }
//       const field = employeeFilter.field;
//       const fieldValue = (employee as any)[field];
//       if (typeof fieldValue !== 'string') return false;
//       return employeeFilter.value.some(
//         (option: string) => fieldValue.toLowerCase() === option.toLowerCase()
//       );
//     })
//       // Фильтруем сотрудников, если activeFilter установлен
//       .filter((employee) => {
//         if (!activeFilter) return true;
//         const shiftsForDate = employee.shifts[activeFilter.date] || [];
//         // Приводим shift.ShiftTypeId к числу для сравнения
//         return shiftsForDate.some(
//           (shift) => Number(shift.ShiftTypeId) === activeFilter.shiftTypeId
//         );
//       })
//       .map((employee) => {
//         const totalHours = days.reduce((sum: number, day: Date) => {
//           const dateStr = format(day, "yyyy-MM-dd");
//           const shifts = employee.shifts[dateStr] || [];
//           return sum + shifts.reduce((s: number, shift: Shift) => {
//             if (shift.MarkedForDeletion) return s; // Пропускаем удаленные смены
//             const shiftType = shiftTypes.find(
//               (t) => t.ID === Number(shift.ShiftTypeId)
//             );
//             return shiftType && !shiftType.CivilLawContract ? s + shift.Hours : s;
//           }, 0);
//         }, 0);

//         const totalHoursCLW = days.reduce((sum: number, day: Date) => {
//           const dateStr = format(day, "yyyy-MM-dd");
//           const shifts = employee.shifts[dateStr] || [];
//           return sum + shifts.reduce((s: number, shift: Shift) => {
//             if (shift.MarkedForDeletion) return s; // Пропускаем удаленные смены
//             const shiftType = shiftTypes.find(
//               (t) => t.ID === Number(shift.ShiftTypeId)
//             );
//             return shiftType?.CivilLawContract ? s + shift.Hours : s;
//           }, 0);
//         }, 0);

//         const holidayHours = days.reduce((sum: number, day: Date) => {
//           const dateStr = format(day, "yyyy-MM-dd");
//           const shifts = employee.shifts[dateStr] || [];
//           return sum + shifts.reduce((s: number, shift: Shift) => {
//             if (shift.MarkedForDeletion) return s; // Пропускаем удаленные смены
//             return s + calculateHolidayHours(shift);
//           }, 0);
//         }, 0);

//         const totalHoursToDelete = days.reduce((sum: number, day: Date) => {
//           const dateStr = format(day, "yyyy-MM-dd");
//           const shifts = employee.shifts[dateStr] || [];
//           return sum + shifts.reduce((s: number, shift: Shift) => {
//             if (!shift.MarkedForDeletion) return s; // Учитываем только помеченные на удаление
//             const shiftType = shiftTypes.find(
//               (t) => t.ID === Number(shift.ShiftTypeId)
//             );
//             return shiftType && !shiftType.CivilLawContract ? s + shift.Hours : s;
//           }, 0);
//         }, 0);

//         const totalHoursCLWToDelete = days.reduce((sum: number, day: Date) => {
//           const dateStr = format(day, "yyyy-MM-dd");
//           const shifts = employee.shifts[dateStr] || [];
//           return sum + shifts.reduce((s: number, shift: Shift) => {
//             if (!shift.MarkedForDeletion) return s; // Учитываем только помеченные на удаление
//             const shiftType = shiftTypes.find(
//               (t) => t.ID === Number(shift.ShiftTypeId)
//             );
//             return shiftType?.CivilLawContract ? s + shift.Hours : s;
//           }, 0);
//         }, 0);

//         const holidayHoursToDelete = days.reduce((sum: number, day: Date) => {
//           const dateStr = format(day, "yyyy-MM-dd");
//           const shifts = employee.shifts[dateStr] || [];
//           return sum + shifts.reduce((s: number, shift: Shift) => {
//             if (!shift.MarkedForDeletion) return s; // Учитываем только помеченные на удаление
//             return s + calculateHolidayHours(shift);
//           }, 0);
//         }, 0);


//         const normHours = days.reduce((sum: number, day: Date) => {
//           const today = new Date();
//           const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

//           // Если режим "Год" — ограничиваем расчёт текущим месяцем
//           if (viewPeriod === "year" && day > endOfCurrentMonth) return sum;

//           let dayNorm = getDayNorm(day);
//           const dateStr = format(day, "yyyy-MM-dd");
//           const shifts = employee.shifts[dateStr] || [];
//           const hasAffectingShift = shifts.some((shift) => {
//             const shiftType = shiftTypes.find((type) => type.ID === Number(shift.ShiftTypeId));
//             return shiftType?.AffectsWorkingNorm;
//           });

//           if (hasAffectingShift) return sum;

//           let fraction = 1;
//           const workloadPeriods = employee.workloadPeriods ?? [];
//           for (const period of workloadPeriods) {
//             if (
//               (!period.StartDate || period.StartDate <= dateStr) &&
//               (!period.EndDate || period.EndDate >= dateStr)
//             ) {
//               fraction = period.Fraction;
//             }
//           }

//           dayNorm *= fraction;
//           return sum + dayNorm;
//         }, 0);


//         const row: any = {
//           ID: employee.ID,
//           employeeId: employee.ID,
//           EmployeeID: employee.EmployeeID,
//           Title: employee.Title,
//           JobTitle: employee.JobTitle,
//           Department: employee.Department,
//           Office: employee.Office,
//           workloadPeriods: employee.workloadPeriods,
//           totalHours, // Лента (CivilLawContract === false)
//           totalHoursCLW, // ГПХ (CivilLawContract === true)
//           holidayHours,
//           totalHoursToDelete, // Добавляем
//           totalHoursCLWToDelete, // Добавляем
//           holidayHoursToDelete, // Добавляем
//           normHours,
//                   // Добавляем новые поля:
//           ShiftNumber: employee.ShiftNumber,
//           ShiftTimeType: employee.ShiftTimeType,
//         };

//         days.forEach((day) => {
//           const formattedDate = format(day, "yyyy-MM-dd");
//           const shifts = employee.shifts[formattedDate] || [];
//           row[`day-${formattedDate}`] = {
//             employeeId: employee.ID,
//             date: formattedDate,
//             shifts,
//           };
//         });

//         return row;
//       });
//       // Сортировка, если установлен порядок
//   if (employeeSort.order) {
//     filteredRows.sort((a, b) => {
//       let aVal = a[employeeSort.field] || "";
//       let bVal = b[employeeSort.field] || "";
//       if (typeof aVal === "string") aVal = aVal.toLowerCase();
//       if (typeof bVal === "string") bVal = bVal.toLowerCase();
//       if (aVal < bVal) return employeeSort.order === 'asc' ? -1 : 1;
//       if (aVal > bVal) return employeeSort.order === 'asc' ? 1 : -1;
//       return 0;
//     });
//   }
//   return filteredRows;
//   }, [timeData, employeeFilter, days, shiftTypes, activeFilter, employeeSort ]);



//   // ===========================
//   // AgGrid: column defs
//   // ===========================
//   const fixedColumns: ColDef[] = useMemo(() => [
//     {
//       headerComponent: (params: any) => (
//         // Передаём onFilterChange для обновления фильтра и список сотрудников (timeData)
//         <EmployeeHeaderWithFilter
//           {...params}
//           onFilterChange={setEmployeeFilter}
//           onSortChange={setEmployeeSort}  // передаём обновление сортировки
//           employees={timeData}
//         />
//       ),
//       field: 'Title',
//       filterValueGetter: (params) => params.data.Title,
//       valueFormatter: (params) => {
//         if (params.value && typeof params.value === 'object') {
//           return JSON.stringify(params.value);
//         }
//         return params.value;
//       },
//       width: 210,
//       pinned: 'left',
//       cellRenderer: 'employeeCellRenderer',
//       sortable: true,
//       suppressMovable: true,
//       //filter: EmployeeFilter,  // стандартная текстовая фильтрация
//       floatingFilter: false,          // отображение строки фильтра
//     },
//     // Колонка для "Часы Лента"
//     {
//       headerName: "Часы ЛЕНТА",
//       field: "totalHours", // или можно вычислять через valueGetter, если значение не хранится напрямую
//       width: 120, // задаём подходящую ширину
//       pinned: 'left',
//       sortable: true,
//       suppressMovable: true,
//       filter: false,
//       cellRenderer: (params: any) => {
//         const { totalHours, totalHoursToDelete } = params.data;
//         return (
//           <div style={{ textAlign: "center" }}>
//             <span>
//               {totalHours}ч{" "}
//               {totalHoursToDelete > 0 && (
//                 <>
//                   (<VisibilityOffIcon style={{ fontSize: 14, color: "gray", marginRight: 2 }} />
//                   {totalHoursToDelete}ч)
//                 </>
//               )}
//             </span>
//           </div>
//         );
//       },
//     },

//     // Колонка для "Часы ГПХ"
//     {
//       headerName: "Часы ГПХ",
//       field: "totalHoursCLW",
//       width: 110,
//       pinned: 'left',
//       sortable: true,
//       suppressMovable: true,
//       filter: false,
//       cellRenderer: (params: any) => {
//         const { totalHoursCLW, totalHoursCLWToDelete } = params.data;
//         return (
//           <div style={{ textAlign: "center" }}>
//             <span>
//               {totalHoursCLW}ч{" "}
//               {totalHoursCLWToDelete > 0 && (
//                 <>
//                   (<VisibilityOffIcon style={{ fontSize: 14, color: "gray", marginRight: 2 }} />
//                   {totalHoursCLWToDelete}ч)
//                 </>
//               )}
//             </span>
//           </div>
//         );
//       },
//     },
//     {
//       headerName: 'Праздничные часы',
//       field: "holidayHours",
//       width: 120,
//       pinned: "left",
//       sortable: true,
//       filter: false,
//       suppressMovable: true,
//       headerClass: 'custom-header', // задаём CSS-класс для заголовка
//       cellRenderer: (params: any) => {
//         const { holidayHours, holidayHoursToDelete } = params.data;

//         return (
//           <div style={{ textAlign: "center" }}>
//             <span>{holidayHours}ч</span>
//             {holidayHoursToDelete > 0 && (
//               <>
//                 (<VisibilityOffIcon style={{ fontSize: 14, color: "gray", marginRight: 2 }} />
//                 {holidayHoursToDelete}ч)
//               </>
//             )}
//           </div>
//         );
//       },
//     },
//     {
//       headerName: 'Нормо часы',
//       field: 'normHours',
//       width: 110,
//       pinned: 'left',
//       sortable: true,
//       filter: false,
//       suppressMovable: true,
//       headerClass: 'custom-header', // задаём CSS-класс для заголовка
//       cellStyle: { textAlign: 'center', fontWeight: 'bold' },
//       valueFormatter: (params: ValueFormatterParams) => `${params.value}ч`,
//     },
//     {
//       headerName: 'Переработки/Недоработки',
//       field: 'overtimeUndertime',
//       width: 125,
//       pinned: 'left',
//       sortable: true,
//       filter: false,
//       suppressMovable: true,
//       headerClass: 'custom-header', // задаём CSS-класс для заголовка
//       cellStyle: (params: any): any => {
//         const style: React.CSSProperties = { textAlign: "center", fontWeight: "bold" };
//         if (params.value != null) {
//           if (params.value < 0) {
//             // Если значение отрицательное, устанавливаем светло-оранжевый фон
//             style.backgroundColor = "#FFDAB9"; // либо задайте конкретный код цвета, например "#FFDAB9"
//           } else if (params.value > 0) {
//             // Если значение положительное, устанавливаем светло-красный фон
//             style.backgroundColor = "lightcoral"; // либо "#F08080"
//           }
//         }
//         return style;
//       },
//       valueGetter: (params: any) => {
//         const { totalHours, normHours, holidayHours } = params.data;
//         if (totalHours - normHours < 0) {
//           return parseFloat((totalHours - normHours).toFixed(2));
//         }
//         if (totalHours - normHours - holidayHours > 0) {
//           return parseFloat((totalHours - normHours - holidayHours).toFixed(2));
//         }
//         return null;
//       },
//       valueFormatter: (params: ValueFormatterParams) => {
//         if (params.value === null || params.value === undefined) return '';
//         return `${params.value}ч`;
//       },
//     },
//   ], [timeData]);

//   const dynamicColumns: ColDef[] = useMemo(
//     () =>
//       days.map((day) => {
//         const formattedDate = format(day, "yyyy-MM-dd");
//         const isHoliday = productionCalendar2025.some(
//           (calDay: CalendarDay) =>
//             calDay.Date === formattedDate && calDay.Type === "п"
//         );
//         const isPrevHoliday = productionCalendar2025.some(
//           (calDay: CalendarDay) =>
//             calDay.Date === formattedDate && calDay.Type === "пп"
//         );

//         // Подсчитываем количество смен каждого типа для данного дня
//         const countsForDay: { [key: number]: number } = {};
//         shiftTypes.forEach((st) => {
//           countsForDay[st.ID] = 0;
//         });
//         timeData.forEach((employee) => {
//           const shifts = employee.shifts[formattedDate] || [];
//           shifts.forEach((shift) => {
//             if (countsForDay[shift.ShiftTypeId] !== undefined) {
//               countsForDay[shift.ShiftTypeId]++;
//             }
//           });
//         });

//         return {
//           headerName: `${format(day, "EEEEEE", { locale: ru })}\n${format(
//             day,
//             "d MMM",
//             { locale: ru }
//           )}`,
//           field: `day-${formattedDate}`,
//           width: 150,
//           minWidth: 150,
//           sortable: false,
//           suppressMovable: true,
//           cellRenderer: "shiftCellRenderer",
//           cellRendererParams: {
//             shiftTypes,
//             handleAddShift,
//             handleUpdateShift,
//             handleDeleteShift,
//             // BEGIN BULK MODE: передаём функции bulkMode в ShiftCellRenderer
//             bulkMode,
//             bulkSelectedShifts,
//             toggleBulkSelection,
//             // END BULK MODE
//           },
//           headerComponent: () => {
//             const isFilterActive = activeFilter?.date === formattedDate;
//             return (
//               <Box
//                 sx={{
//                   display: "flex",
//                   flexDirection: "row",
//                   justifyContent: "space-between",
//                   alignItems: "stretch",
//                   px: 0,
//                   py: 1,
//                   //borderRight: 1,
//                   borderColor: "divider",
//                   backgroundColor: isHoliday ? "rgba(255, 0, 0, 0.3)" : isPrevHoliday ? "orange" : undefined,
//                   //color: isHoliday ? "white" : undefined,
//                   height: "100%",
//                 }}
//               >
//                 {/* Левая колонка: день недели, дата и норма часов */}
//                 <Box
//                   sx={{
//                     flexBasis: "40%",
//                     display: "flex",
//                     flexDirection: "column",
//                     justifyContent: "center",
//                     pl: 1,
//                   }}
//                 >
//                   <Typography variant="subtitle2">
//                     {format(day, "EEEEEE", { locale: ru })}
//                   </Typography>
//                   <Typography variant="body2">
//                     {format(day, "d MMM", { locale: ru })}
//                   </Typography>
//                   <Typography variant="caption">
//                     НРВ: {getDayNorm(day)}ч
//                   </Typography>
//                 </Box>
//                 {/* Правая колонка: кнопки типов смен с вертикальной прокруткой */}
//                 <Box
//                   sx={{
//                     flexBasis: "60%",
//                     display: "flex",
//                     flexDirection: "column",
//                     alignItems: "flex-end",
//                     //maxHeight: 80,
//                     overflowY: "auto",
//                     pr: 1,
//                   }}
//                 >

//                   {shiftTypes
//                     .filter((type) => countsForDay[type.ID] > 0)
//                     .map((type) => {
//                       const isActive =
//                         isFilterActive && activeFilter?.shiftTypeId === type.ID;
//                       return (
//                         <Button
//                           key={type.ID}
//                           variant="text"
//                           size="small"
//                           sx={{
//                             m: 0.25,
//                             backgroundColor: type.BackgroundColor,
//                             color: type.TextColor,
//                             ...(isActive && { border: "2px solid blue" }),
//                             fontSize: "0.7rem",
//                             textTransform: "none",
//                           }}
//                           onMouseDown={(e) => e.preventDefault()}
//                           onClick={() => {
//                             if (isActive) {
//                               // Сброс фильтра
//                               setActiveFilter(null);
//                             } else {
//                               // Установка фильтра
//                               setActiveFilter({
//                                 date: formattedDate,
//                                 shiftTypeId: type.ID,
//                               });
//                             }
//                           }}
//                         >
//                           {type.Name}: {countsForDay[type.ID]}
//                         </Button>
//                       );
//                     })}
//                 </Box>
//               </Box>
//             );
//           },
//         };
//       }),
//     [days, shiftTypes, timeData, activeFilter, bulkMode, bulkSelectedShifts]
//   );


//   const allColumns: ColDef[] = useMemo(
//     () => [...fixedColumns, ...dynamicColumns],
//     [fixedColumns, dynamicColumns]
//   );

//   const gridOptions: GridOptions = useMemo(() => ({
//     defaultColDef: {
//       resizable: true,
//       sortable: true,
//       filter: true,
//     },
//     rowHeight: 80,
//     headerHeight: 120,
//     components: {
//       // Рендер ячейки сотрудника (левый столбец)
//       employeeCellRenderer: (params: ICellRendererParams) => {
//         const [dialogOpen, setDialogOpen] = useState(false);
//         const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
//         const employee = params.data as TimeSheetEntry;
//         if (!employee) return null;

//         const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
//           e.stopPropagation();
//           setMenuAnchorEl(e.currentTarget);
//         };

//         const handleMenuClose = () => setMenuAnchorEl(null);

//         return (
//           <Box
//             sx={{
//               display: 'flex',
//               alignItems: 'center',
//               gap: 1,
//               position: 'relative',
//               paddingLeft: '30px', // резервируем место для иконки
//               // При наведении делаем иконку видимой
//               '&:hover .settingsButton': { opacity: 1 },
//             }}
//           >
//             {/* Кнопка с иконкой (шестерёнкой) – скрыта по умолчанию */}
//             <Button
//               className="settingsButton"
//               onClick={handleMenuOpen}
//               variant="text"
//               sx={{
//                 opacity: 0,
//                 transition: 'opacity 0.3s',
//                 position: 'absolute',
//                 left: 0,
//                 minWidth: 'auto',
//                 padding: 0,
//               }}
//             >
//               <ManageAccountsIcon style={{ height: 24, width: 24 }} />
//             </Button>

//             {/* Информация о сотруднике */}
//             <Box>
//               <Typography variant="subtitle1">{employee.Title}</Typography>
//               <Typography variant="body2" color="text.secondary">
//                 {employee.JobTitle}
//               </Typography>
//               <Typography variant="body2" color="text.secondary">
//                 Смена: {employee.ShiftNumber} {employee.ShiftTimeType}
//               </Typography>
//             </Box>

//             <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
//               <MenuItem
//                 onClick={(e) => {
//                   e.preventDefault();
//                   setDialogOpen(true);
//                   handleMenuClose();
//                 }}
//                 sx={{ color: "#267db1" }}>
//                 <EditIcon fontSize="small" sx={{ mr: 1 }} />
//                 Изменить
//               </MenuItem>
//               <MenuItem
//                 onClick={() => {
//                   params.context.handleDeleteEmployee(employee.ID);
//                   handleMenuClose();
//                 }}
//                 sx={{ color: "error.main" }}>
//                 <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
//                 Удалить
//               </MenuItem>
//             </Menu>

//             <EmployeeDialog
//               open={dialogOpen}
//               onOpenChange={setDialogOpen}
//               employee={employee}
//               onSave={(data) => params.context.handleUpdateEmployee(employee.ID, data)}
//             />
//           </Box>
//         );
//       },
//       shiftCellRenderer: ShiftCellRenderer,
//     },
//     context: {
//       handleAddEmployee,
//       handleUpdateEmployee,
//       handleDeleteEmployee,
//       handleAddShift,
//       handleUpdateShift,
//       handleDeleteShift,
//       // BEGIN BULK MODE: передача глобальных параметров bulkMode в контекст ag‑grid
//       bulkMode,
//       bulkSelectedShifts,
//       toggleBulkSelection,
//       // END BULK MODE
//     },
//     suppressDragLeaveHidesColumns: true,
//   }), [handleAddEmployee, handleUpdateEmployee, handleDeleteEmployee, handleAddShift, handleUpdateShift, handleDeleteShift, bulkMode, bulkSelectedShifts]);

//   useEffect(() => {
//     if (gridRef.current?.api) {
//       gridRef.current.api.refreshCells({ force: true });
//     }
//   }, [shiftTypes]);

//   // Сброс фильтра, когда меняется период
//   useEffect(() => {
//     setActiveFilter(null);
//   }, [viewPeriod, currentDate]);

//   // Меню в заголовке
//   /*const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
//   const handleTopMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
//     setMenuAnchorEl(e.currentTarget);
//   };
//   const handleTopMenuClose = () => {
//     setMenuAnchorEl(null);
//   };*/
//   // BEGIN BULK MODE: Обработчики для режима массовых операций
//   const toggleBulkMode = () => {
//     setBulkMode(!bulkMode);
//     // При отключении режима сбрасываем выбранные смены
//     if (bulkMode) setBulkSelectedShifts([]);
//   };

//   const handleBulkDelete = () => {
//     bulkSelectedShifts.forEach((item) => {
//       handleDeleteShift(item.employeeId, item.date, item.shiftId);
//     });
//     setBulkSelectedShifts([]);
//   };

//   const handleBulkEdit = () => {
//     setBulkEditDialogOpen(true);
//   };

//   // END BULK MODE


//   // ===========================
//   // Render
//   // ===========================
//   return (
//     <Card>
//       <CardHeader
//         title={
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//             {/* menu: Добавляем кнопку открытия бокового меню */}
//             <IconButton onClick={toggleSideMenu} sx={{ p: 0 }}>
//               <MenuIcon />
//             </IconButton>
//             <QueryBuilderIcon style={{ height: 24, width: 24 }} />
//             <Typography variant="h6">График работы</Typography>
//           </Box>
//         }
//         action={
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>

//             {/* BEGIN BULK MODE: Кнопка bulkMode */}
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//               <Button
//                 variant="outlined"
//                 onClick={toggleBulkMode}
//                 startIcon={bulkMode ? <LibraryAddCheckIcon /> : <LibraryAddCheckOutlinedIcon />}
//               >
//                 Массовое измение
//               </Button>
//               {bulkMode && (
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                   <Button variant="outlined" onClick={handleBulkEdit} startIcon={<EditIcon />} />
//                   <Button variant="outlined" onClick={handleBulkDelete} startIcon={<DeleteIcon />} />
//                 </Box>
//               )}
//             </Box>
//             {/* END BULK MODE */}
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//               <FormControl size="small" sx={{ minWidth: 180 }}>
//                 <InputLabel id="view-period-label">Период</InputLabel>
//                 <Select
//                   labelId="view-period-label"
//                   value={viewPeriod}
//                   label="Период"
//                   onChange={(e) => setViewPeriod(e.target.value as ViewPeriod)}
//                 >
//                   <MenuItem value="week">Неделя</MenuItem>
//                   <MenuItem value="month">Месяц</MenuItem>
//                   <MenuItem value="year">Год</MenuItem>
//                 </Select>
//               </FormControl>
//               <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
//                 <Button variant="outlined" onClick={handlePrevPeriod}>
//                   <ArrowBackIosIcon style={{ height: 24, width: 24 }} />
//                 </Button>
//                 <Typography variant="subtitle1" sx={{ px: 1, fontWeight: 'medium' }}>
//                   {formatPeriodLabel()}
//                 </Typography>
//                 <Button variant="outlined" onClick={handleNextPeriod}>
//                   <ArrowForwardIosIcon style={{ height: 24, width: 24 }} />
//                 </Button>
//               </Box>
//             </Box>
//           </Box>
//         }
//       />
//       {/* menu: Боковое меню (Drawer) для управления чередованием */}
//       <Drawer anchor="left" open={sideMenuOpen} onClose={() => setSideMenuOpen(false)}>
//         <Box sx={{
//           width: 250,
//           p: 2,
//           display: 'flex',
//           flexDirection: 'column',
//           gap: 1 // Добавляет равные промежутки между всеми детьми
//         }}>
//           <Button
//             fullWidth
//             variant="outlined"
//             startIcon={<AddIcon style={{ height: 16, width: 16 }} />}
//             onClick={() => {
//               setIsCreatePatternDialogOpen(true);
//               setSideMenuOpen(false);
//             }}
//           >
//             Создать чередование
//           </Button>

//           <Button
//             fullWidth
//             variant="outlined"

//             startIcon={<EventAvailableIcon style={{ height: 16, width: 16 }} />}
//             onClick={() => {
//               setIsAssignDialogOpen(true);
//               setSideMenuOpen(false);
//             }}
//           >
//             Применить чередование
//           </Button>

//           <ShiftTypeDialog
//             shiftTypes={shiftTypes}
//             onSave={handleAddShiftType}
//             onUpdate={handleUpdateShiftType}
//             onDelete={handleDeleteShiftType}
//             trigger={
//               <Button
//                 fullWidth
//                 variant="outlined"
//                 startIcon={<SettingsIcon style={{ height: 16, width: 16 }} />}
//                 sx={{ mt: 0 }} // Выравниваем с остальными кнопками
//               >
//                 Управление типами смен
//               </Button>
//             }
//           />
//         </Box>
//       </Drawer>
//       <CardContent>
//         <Box sx={{ width: '100%', height: '85vh', overflow: 'auto' }}>
//           <AgGridReact
//             ref={gridRef}
//             rowData={rows}
//             columnDefs={allColumns}
//             gridOptions={gridOptions}
//             suppressRowClickSelection
//             rowSelection="single"
//             animateRows
//             modules={[ClientSideRowModelModule]}
//           />
//         </Box>
//       </CardContent>

//       <Dialog
//         open={isCreatePatternDialogOpen}
//         onClose={() => setIsCreatePatternDialogOpen(false)}
//         fullWidth
//         maxWidth="md"
//       >
//         <DialogTitle>Управление чередованиями</DialogTitle>
//         <DialogContent>
//           <DialogContentText>
//             Создавайте и изменяйте правила чередования
//           </DialogContentText>
//           {/* Если ваш ShiftPatternForm ожидает ShiftPattern с полями ID: string; Name: string; Pattern: boolean[] */}
//           <ShiftPatternForm
//             existingPatterns={shiftPatterns}
//             onSave={handleSavePattern}
//             onUpdate={handleUpdatePattern}
//             onDelete={handleDeletePattern}
//           />
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setIsCreatePatternDialogOpen(false)}>Закрыть</Button>
//         </DialogActions>
//       </Dialog>

//       <Dialog
//         open={isAssignDialogOpen}
//         onClose={() => setIsAssignDialogOpen(false)}
//         fullWidth
//         maxWidth="md"
//       >
//         <DialogTitle>Применение чередования</DialogTitle>
//         <DialogContent>
//           <DialogContentText>
//             Примените правила чередования для быстрого назначения смен
//           </DialogContentText>
//           {/* Убедитесь, что в AssignShiftPatternForm пропсы соответствуют типам:
//               - shiftTypeId: string
//               - employeeId: string
//               - date: string
//           */}
//           <AssignShiftPatternForm
//             employees={timeData.map((employee) => ({
//               id: String(employee.ID),    // приводим к строке
//               name: employee.Title,       // поле Title из Employee
//             }))}
//             shiftPatterns={shiftPatterns} // ID: string
//             shiftTypes={shiftTypes}       // ID: number
//             onAssign={handleAssignPattern}
//           />
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setIsAssignDialogOpen(false)}>Закрыть</Button>
//         </DialogActions>
//       </Dialog>
//       {/* Bulk Edit Dialog для массового редактирования смен */}
//       <ShiftDialog
//         shift={null} // Можно передать значения из первой выбранной смены, если требуется
//         employeeId={bulkSelectedShifts.length > 0 ? bulkSelectedShifts[0].employeeId.toString() : ""}
//         date={bulkSelectedShifts.length > 0 ? bulkSelectedShifts[0].date : ""}
//         shiftTypes={shiftTypes}
//         open={bulkEditDialogOpen}
//         onOpenChange={setBulkEditDialogOpen}
//         onSave={handleBulkEditSave}
//       />
//     </Card>
//   );
// }

// src/components/TimeSheet.tsx
// import React, { useState, useMemo, useRef, useEffect } from 'react';
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   Typography,
//   Box,
//   Button,
//   Menu,
//   MenuItem,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogContentText,
//   DialogActions,
//   FormControl,
//   InputLabel,
//   Select,
//   IconButton,
//   Drawer,
// } from '@mui/material';
// import EditIcon from "@mui/icons-material/Edit";
// import LibraryAddCheckOutlinedIcon from '@mui/icons-material/LibraryAddCheckOutlined';
// import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
// import LibraryAddCheckIcon from '@mui/icons-material/LibraryAddCheck';
// import EventAvailableIcon from '@mui/icons-material/EventAvailable';
// import DeleteIcon from "@mui/icons-material/Delete";
// import SettingsIcon from '@mui/icons-material/Settings';
// import AddIcon from '@mui/icons-material/Add';
// import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
// import MenuIcon from '@mui/icons-material/Menu';
// import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
// import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
// import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
// import { AgGridReact } from 'ag-grid-react';
// import { ColDef, GridOptions, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
// import { ModuleRegistry } from 'ag-grid-community';
// import {
//   ClientSideRowModelModule,
//   RenderApiModule,
//   RowSelectionModule,
//   TextFilterModule,
//   NumberFilterModule,
//   DateFilterModule,
//   CustomFilterModule,
//   CellStyleModule,
//   ValidationModule,
// } from 'ag-grid-community';

// // Регистрируем необходимые модули
// ModuleRegistry.registerModules([
//   ClientSideRowModelModule,
//   RenderApiModule,
//   RowSelectionModule,
//   TextFilterModule,
//   NumberFilterModule,
//   DateFilterModule,
//   CustomFilterModule,
//   CellStyleModule,
//   ValidationModule,
// ]);

// import {
//   format,
//   startOfWeek,
//   addDays,
//   addMonths,
//   addYears,
//   startOfMonth,
//   startOfYear,
// } from 'date-fns';
// import { ru } from 'date-fns/locale';
// import {
//   Employee,
//   productionCalendar2025,
//   Shift,
//   ShiftTypeDefinition,
//   ShiftPattern,
//   CalendarDay,
//   Operation, // NEW: Импортируем тип Operation
//   AggregatedMetrics, // NEW: Импортируем тип AggregatedMetrics
//   DayEntry, // NEW: Импортируем тип DayEntry
// } from '../types';
// import { getDayNorm, calculateHolidayHours, calculateShiftHours, aggregateOperations } from '../lib/utils'; // NEW: Импортируем aggregateOperations
// import ShiftPatternForm from './ShiftPatternForm';
// import AssignShiftPatternForm from './AssignShiftPatternForm';
// import { ShiftCellRenderer } from './ShiftCellRenderer';
// import { EmployeeDialog } from './EmployeeDialog';
// import { ShiftTypeDialog } from './ShiftTypeDialog';
// import { getEmployee, deleteEmployee, getWorkloadPeriods } from "../services/userService";
// import { createShiftType, deleteShiftType, getShiftTypes, updateShiftType } from "../services/shiftTypeService";
// import { createShift, deleteShift, getShiftById, getShifts, updateShift } from '../services/shiftService';
// import { createShiftPattern, deleteShiftPattern, getShiftPatterns, updateShiftPattern } from '../services/shiftPatternService';
// import { ShiftDialog } from './ShiftDialog';
// import EmployeeHeaderWithFilter from './EmployeeHeaderWithFilter';
// import { useOperations } from '../hooks/useOperations'; // NEW: Импортируем хук useOperations

// type ViewPeriod = 'week' | 'month' | 'year';

// // NEW: Обновляем интерфейс TimeSheetEntry, чтобы использовать DayEntry
// interface TimeSheetEntry extends Employee {
//   shifts: { [key: string]: DayEntry };
// }

// interface FilterState {
//   date: string;
//   shiftTypeId: number;
// }

// export default function TimeSheet() {
//   const [employeeSort, setEmployeeSort] = useState<{ field: string; order: 'asc' | 'desc' | null }>({
//     field: 'Title',
//     order: null,
//   });

//   const [employeeFilter, setEmployeeFilter] = useState<{ field: string; value: string[] } | null>(null);
//   const [activeFilter, setActiveFilter] = useState<FilterState | null>(null);
//   const gridRef = useRef<AgGridReact>(null);
//   const [shiftPatterns, setShiftPatterns] = useState<ShiftPattern[]>([]);
//   const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
//   const [isCreatePatternDialogOpen, setIsCreatePatternDialogOpen] = useState(false);
//   const [bulkMode, setBulkMode] = useState(false);
//   const [bulkSelectedShifts, setBulkSelectedShifts] = useState<
//     { employeeId: number; date: string; shiftId: number }[]
//   >([]);
//   const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
//   const [sideMenuOpen, setSideMenuOpen] = useState(false);
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('week');
//   const [shiftTypes, setShiftTypes] = useState<ShiftTypeDefinition[]>([]);
//   const [timeData, setTimeData] = useState<TimeSheetEntry[]>([]);

//   // NEW: Вычисляем диапазон дат для загрузки операций
//   const getDateRange = () => {
//     let start: Date, end: Date;
//     if (viewPeriod === 'week') {
//       start = startOfWeek(currentDate, { weekStartsOn: 1 });
//       end = addDays(start, 6);
//     } else if (viewPeriod === 'month') {
//       start = startOfMonth(currentDate);
//       end = addDays(addMonths(start, 1), -1);
//     } else {
//       start = startOfYear(currentDate);
//       end = addDays(addYears(start, 1), -1);
//     }
//     return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
//   };

//   const { start: startDate, end: endDate } = getDateRange();

//   // NEW: Загрузка операций с использованием хука
//   const { data: operations = [], isLoading: operationsLoading } = useOperations(
//     timeData.map((e) => e.ID),
//     startDate,
//     endDate
//   );

//   // Загрузка паттернов смен
//   useEffect(() => {
//     async function loadShiftPatterns() {
//       try {
//         const patterns = await getShiftPatterns();
//         setShiftPatterns(patterns);
//       } catch (error) {
//         console.error("❌ Ошибка загрузки паттернов смен:", error);
//       }
//     }
//     loadShiftPatterns();
//   }, []);

//   // NEW: Загрузка сотрудников, смен и операций
//   useEffect(() => {
//     async function loadEmployeesAndData() {
//       try {
//         const [employees, periods, shifts] = await Promise.all([
//           getEmployee(),
//           getWorkloadPeriods(),
//           getShifts(),
//         ]);

//         // NEW: Формируем TimeSheetEntry с DayEntry
//         const entries: TimeSheetEntry[] = employees.map((emp: Employee) => {
//           const employeeShifts: { [key: string]: DayEntry } = {};
//           // Формируем даты для текущего периода
//           let current = new Date(startDate);
//           const end = new Date(endDate);
//           while (current <= end) {
//             const dateStr = format(current, 'yyyy-MM-dd');
//             const dayShifts = shifts.filter(
//               (s) => s.EmployeeId === emp.ID && s.Date.startsWith(dateStr)
//             );
//             // NEW: Фильтруем операции для текущего сотрудника и даты
//             const dayOperations = operations.filter(
//               (op) => op.UserName.Id === emp.ID && op.OperationDate.startsWith(dateStr)
//             );
//             employeeShifts[`day-${dateStr}`] = {
//               employeeId: emp.ID,
//               date: dateStr,
//               shifts: dayShifts,
//               operations: dayOperations, // NEW: Добавляем операции
//               aggregatedMetrics: aggregateOperations(dayOperations), // NEW: Агрегируем метрики
//             };
//             current = addDays(current, 1);
//           }
//           return {
//             ...emp,
//             shifts: employeeShifts,
//             workloadPeriods: periods.filter((p) => p.EmployeeId === emp.ID) || [],
//           };
//         });

//         setTimeData(entries);
//       } catch (error) {
//         console.error("❌ Ошибка загрузки данных:", error);
//       }
//     }
//     loadEmployeesAndData();
//   }, [startDate, endDate, operations]); // NEW: Добавляем operations в зависимости

//   // Загрузка типов смен
//   useEffect(() => {
//     async function loadShiftTypes() {
//       try {
//         const types = await getShiftTypes();
//         setShiftTypes(types);
//       } catch (error) {
//         console.error("❌ Ошибка загрузки типов смен:", error);
//       }
//     }
//     loadShiftTypes();
//   }, []);

//   const toggleSideMenu = () => {
//     setSideMenuOpen(!sideMenuOpen);
//   };

//   // Shift Pattern management
//   const handleSavePattern = async (pattern: ShiftPattern): Promise<void> => {
//     if (pattern.ID === 0) {
//       const patternData = {
//         Name: pattern.Name,
//         Pattern: pattern.Pattern,
//       };
//       try {
//         const newId = await createShiftPattern(patternData);
//         const newPattern: ShiftPattern = { ...pattern, ID: newId };
//         setShiftPatterns((prev) => [...prev, newPattern]);
//       } catch (error) {
//         console.error("Ошибка создания паттерна:", error);
//       }
//     }
//   };

//   const handleUpdatePattern = async (pattern: ShiftPattern): Promise<void> => {
//     if (pattern.ID !== 0) {
//       const patternData = {
//         Name: pattern.Name,
//         Pattern: pattern.Pattern,
//       };
//       try {
//         await updateShiftPattern(pattern.ID, patternData);
//         setShiftPatterns((prev) =>
//           prev.map((p) => (p.ID === pattern.ID ? pattern : p))
//         );
//       } catch (error) {
//         console.error("Ошибка обновления паттерна:", error);
//       }
//     }
//   };

//   const handleDeletePattern = async (patternId: number): Promise<void> => {
//     try {
//       await deleteShiftPattern(patternId);
//       setShiftPatterns((prev) => prev.filter((p) => p.ID !== patternId));
//     } catch (error) {
//       console.error("Ошибка удаления паттерна:", error);
//     }
//   };

//   // Assign shift patterns
//   const handleAssignPattern = (
//     assignments: { employeeId: string; shiftTypeId: number; date: string }[]
//   ) => {
//     assignments.forEach(({ employeeId, shiftTypeId, date }) => {
//       const shiftType = shiftTypes.find((type) => type.ID === shiftTypeId);
//       if (!shiftType) {
//         console.warn(`ShiftType с ID=${shiftTypeId} не найден.`);
//         return;
//       }
//       const hours = calculateShiftHours(
//         shiftType.DefaultStartTime,
//         shiftType.DefaultEndTime,
//         shiftType.DefaultBreakStart,
//         shiftType.DefaultBreakEnd,
//         shiftType.RequiredStartEndTime ?? true
//       );
//       handleAddShift(
//         parseInt(employeeId, 10),
//         date,
//         {
//           ShiftTypeId: shiftTypeId,
//           Date: date,
//           EmployeeId: parseInt(employeeId, 10),
//           StartTime: shiftType.DefaultStartTime,
//           EndTime: shiftType.DefaultEndTime,
//           BreakStart: shiftType.DefaultBreakStart,
//           BreakEnd: shiftType.DefaultBreakEnd,
//           Hours: hours,
//           IsNightShift: shiftType.Name.toLowerCase().includes('ноч') || false,
//         }
//       );
//     });
//   };

//   // Period generation
//   function generateDays(date: Date, period: ViewPeriod): Date[] {
//     let start: Date;
//     let end: Date;
//     switch (period) {
//       case 'week':
//         start = startOfWeek(date, { weekStartsOn: 1 });
//         end = addDays(start, 6);
//         break;
//       case 'month':
//         start = startOfMonth(date);
//         end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
//         break;
//       case 'year':
//         start = startOfYear(date);
//         end = new Date(date.getFullYear(), 11, 31);
//         break;
//       default:
//         return [];
//     }
//     const days: Date[] = [];
//     for (let current = start; current <= end; current = addDays(current, 1)) {
//       days.push(current);
//     }
//     return days;
//   }
//   const days = useMemo(() => generateDays(currentDate, viewPeriod), [currentDate, viewPeriod]);

//   const handlePrevPeriod = () => {
//     switch (viewPeriod) {
//       case 'week':
//         setCurrentDate(addDays(currentDate, -7));
//         break;
//       case 'month':
//         setCurrentDate(addMonths(currentDate, -1));
//         break;
//       case 'year':
//         setCurrentDate(addYears(currentDate, -1));
//         break;
//     }
//   };

//   const handleNextPeriod = () => {
//     switch (viewPeriod) {
//       case 'week':
//         setCurrentDate(addDays(currentDate, 7));
//         break;
//       case 'month':
//         setCurrentDate(addMonths(currentDate, 1));
//         break;
//       case 'year':
//         setCurrentDate(addYears(currentDate, 1));
//         break;
//     }
//   };

//   const formatPeriodLabel = () => {
//     switch (viewPeriod) {
//       case 'week':
//         return `Неделя ${format(currentDate, 'w', { locale: ru })} - ${format(
//           currentDate,
//           'LLLL yyyy',
//           { locale: ru }
//         )}`;
//       case 'month':
//         return format(currentDate, 'LLLL yyyy', { locale: ru });
//       case 'year':
//         return format(currentDate, 'yyyy');
//     }
//   };

//   // Employees management
//   const handleAddEmployee = (employeeData: Employee) => {
//     const newEmployee: TimeSheetEntry = {
//       ...employeeData,
//       shifts: {},
//       workloadPeriods: employeeData.workloadPeriods || [],
//     };
//     setTimeData((prev) => [...prev, newEmployee]);
//   };

//   const handleUpdateEmployee = (ID: number, employeeData: Omit<Employee, 'ID'>) => {
//     setTimeData((prev) =>
//       prev.map((emp) => {
//         if (emp.ID === ID) {
//           return {
//             ...emp,
//             ...employeeData,
//             workloadPeriods: employeeData.workloadPeriods ?? emp.workloadPeriods,
//           };
//         }
//         return emp;
//       })
//     );
//   };

//   const handleDeleteEmployee = async (ID: number) => {
//     try {
//       await deleteEmployee(ID);
//       setTimeData((prev) => prev.filter((emp) => emp.ID !== ID));
//     } catch (error) {
//       console.error("❌ Ошибка при удалении сотрудника:", error);
//     }
//   };

//   // ShiftType management
//   const handleAddShiftType = async (
//     shiftTypeData: Omit<ShiftTypeDefinition, 'ID'>
//   ): Promise<void> => {
//     try {
//       const newId = await createShiftType(shiftTypeData);
//       const newShiftType: ShiftTypeDefinition = {
//         ...shiftTypeData,
//         ID: newId,
//       };
//       setShiftTypes((prev) => [...prev, newShiftType]);
//     } catch (error) {
//       console.error("Ошибка создания типа смены:", error);
//     }
//   };

//   const handleUpdateShiftType = async (
//     ID: number,
//     shiftTypeData: Omit<ShiftTypeDefinition, 'ID'>
//   ): Promise<void> => {
//     try {
//       await updateShiftType(ID, shiftTypeData);
//       setShiftTypes((prev) =>
//         prev.map((type) => (type.ID === ID ? { ...shiftTypeData, ID } : type))
//       );
//     } catch (error) {
//       console.error("Ошибка обновления типа смены:", error);
//     }
//   };

//   const handleDeleteShiftType = async (ID: number): Promise<void> => {
//     const isInUse = timeData.some((employee) =>
//       Object.values(employee.shifts).flatMap((day) => day.shifts).some(
//         (shift) => shift.ShiftTypeId === ID
//       )
//     );
//     if (isInUse) {
//       alert("Нельзя удалить тип смены, который уже используется");
//       return;
//     }
//     try {
//       await deleteShiftType(ID);
//       setShiftTypes((prev) => prev.filter((type) => type.ID !== ID));
//     } catch (error) {
//       console.error("Ошибка удаления типа смены:", error);
//     }
//   };

//   // Shifts management
//   const handleAddShift = async (
//     employeeId: number,
//     date: string,
//     shiftData: Omit<Shift, 'ID'>
//   ): Promise<void> => {
//     try {
//       const newId = await createShift(shiftData);
//       const newShift: Shift = {
//         ...shiftData,
//         ID: newId,
//       };
//       setTimeData((prevData) =>
//         prevData.map((employee) => {
//           if (employee.ID === employeeId) {
//             return {
//               ...employee,
//               shifts: {
//                 ...employee.shifts,
//                 [`day-${date}`]: {
//                   ...employee.shifts[`day-${date}`],
//                   shifts: [...(employee.shifts[`day-${date}`]?.shifts || []), newShift],
//                 },
//               },
//             };
//           }
//           return employee;
//         })
//       );
//     } catch (error) {
//       console.error("Ошибка при добавлении смены:", error);
//     }
//   };

//   const handleUpdateShift = async (
//     employeeId: number,
//     date: string,
//     shiftId: number,
//     shiftData: Omit<Shift, "ID" | "EmployeeId" | "Date">
//   ): Promise<void> => {
//     try {
//       await updateShift(shiftId, shiftData);
//       const updatedShift = await getShiftById(shiftId);
//       setTimeData((prevData) =>
//         prevData.map((employee) =>
//           employee.ID === employeeId
//             ? {
//                 ...employee,
//                 shifts: {
//                   ...employee.shifts,
//                   [`day-${date}`]: {
//                     ...employee.shifts[`day-${date}`],
//                     shifts: employee.shifts[`day-${date}`].shifts.map((shift) =>
//                       shift.ID === shiftId ? updatedShift : shift
//                     ),
//                   },
//                 },
//               }
//             : employee
//         )
//       );
//     } catch (error) {
//       console.error("❌ Ошибка при обновлении смены:", error);
//     }
//   };

//   const handleDeleteShift = async (
//     employeeId: number,
//     date: string,
//     shiftId: number
//   ): Promise<void> => {
//     try {
//       await deleteShift(shiftId);
//       setTimeData((prevData) =>
//         prevData.map((employee) => {
//           if (employee.ID === employeeId) {
//             return {
//               ...employee,
//               shifts: {
//                 ...employee.shifts,
//                 [`day-${date}`]: {
//                   ...employee.shifts[`day-${date}`],
//                   shifts: employee.shifts[`day-${date}`].shifts.filter((s) => s.ID !== shiftId),
//                 },
//               },
//             };
//           }
//           return employee;
//         })
//       );
//     } catch (error) {
//       console.error("Ошибка при удалении смены:", error);
//     }
//   };

//   // BEGIN BULK MODE: глобальное переключение режима и управление выбранными сменами
//   const toggleBulkSelection = (employeeId: number, date: string, shiftId: number) => {
//     setBulkSelectedShifts((prev) => {
//       const exists = prev.some(
//         (item) => item.employeeId === employeeId && item.date === date && item.shiftId === shiftId
//       );
//       if (exists) {
//         return prev.filter(
//           (item) => !(item.employeeId === employeeId && item.date === date && item.shiftId === shiftId)
//         );
//       } else {
//         return [...prev, { employeeId, date, shiftId }];
//       }
//     });
//   };

//   const handleBulkEditSave = (data: Omit<Shift, "ID" | "EmployeeId" | "Date">) => {
//     bulkSelectedShifts.forEach((item) => {
//       handleUpdateShift(item.employeeId, item.date, item.shiftId, data);
//     });
//     setBulkEditDialogOpen(false);
//     setBulkSelectedShifts([]);
//   };
//   const handleBulkEdit = () => {
//      setBulkEditDialogOpen(true);
//    };

//   const handleBulkDelete = () => {
//     bulkSelectedShifts.forEach((item) => {
//       handleDeleteShift(item.employeeId, item.date, item.shiftId);
//     });
//     setBulkSelectedShifts([]);
//   };
//   // END BULK MODE

//   // AgGrid: row data
//   const rows = useMemo(() => {
//     const filteredRows = timeData
//       .filter((employee) => {
//         if (!employeeFilter || !employeeFilter.value || employeeFilter.value.length === 0) {
//           return true;
//         }
//         const field = employeeFilter.field;
//         const fieldValue = (employee as any)[field];
//         if (typeof fieldValue !== 'string') return false;
//         return employeeFilter.value.some(
//           (option: string) => fieldValue.toLowerCase() === option.toLowerCase()
//         );
//       })
//       .filter((employee) => {
//         if (!activeFilter) return true;
//         const dayEntry = employee.shifts[`day-${activeFilter.date}`] || { shifts: [] };
//         return dayEntry.shifts.some(
//           (shift) => Number(shift.ShiftTypeId) === activeFilter.shiftTypeId
//         );
//       })
//       .map((employee) => {
//         const totalHours = days.reduce((sum: number, day: Date) => {
//           const dateStr = format(day, "yyyy-MM-dd");
//           const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
//           return sum + dayEntry.shifts.reduce((s: number, shift: Shift) => {
//             if (shift.MarkedForDeletion) return s;
//             const shiftType = shiftTypes.find(
//               (t) => t.ID === Number(shift.ShiftTypeId)
//             );
//             return shiftType && !shiftType.CivilLawContract ? s + shift.Hours : s;
//           }, 0);
//         }, 0);

//         const totalHoursCLW = days.reduce((sum: number, day: Date) => {
//           const dateStr = format(day, "yyyy-MM-dd");
//           const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
//           return sum + dayEntry.shifts.reduce((s: number, shift: Shift) => {
//             if (shift.MarkedForDeletion) return s;
//             const shiftType = shiftTypes.find(
//               (t) => t.ID === Number(shift.ShiftTypeId)
//             );
//             return shiftType?.CivilLawContract ? s + shift.Hours : s;
//           }, 0);
//         }, 0);

//         const holidayHours = days.reduce((sum: number, day: Date) => {
//           const dateStr = format(day, "yyyy-MM-dd");
//           const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
//           return sum + dayEntry.shifts.reduce((s: number, shift: Shift) => {
//             if (shift.MarkedForDeletion) return s;
//             return s + calculateHolidayHours(shift);
//           }, 0);
//         }, 0);

//         const totalHoursToDelete = days.reduce((sum: number, day: Date) => {
//           const dateStr = format(day, "yyyy-MM-dd");
//           const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
//           return sum + dayEntry.shifts.reduce((s: number, shift: Shift) => {
//             if (!shift.MarkedForDeletion) return s;
//             const shiftType = shiftTypes.find(
//               (t) => t.ID === Number(shift.ShiftTypeId)
//             );
//             return shiftType && !shiftType.CivilLawContract ? s + shift.Hours : s;
//           }, 0);
//         }, 0);

//         const totalHoursCLWToDelete = days.reduce((sum: number, day: Date) => {
//           const dateStr = format(day, "yyyy-MM-dd");
//           const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
//           return sum + dayEntry.shifts.reduce((s: number, shift: Shift) => {
//             if (!shift.MarkedForDeletion) return s;
//             const shiftType = shiftTypes.find(
//               (t) => t.ID === Number(shift.ShiftTypeId)
//             );
//             return shiftType?.CivilLawContract ? s + shift.Hours : s;
//           }, 0);
//         }, 0);

//         const holidayHoursToDelete = days.reduce((sum: number, day: Date) => {
//           const dateStr = format(day, "yyyy-MM-dd");
//           const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
//           return sum + dayEntry.shifts.reduce((s: number, shift: Shift) => {
//             if (!shift.MarkedForDeletion) return s;
//             return s + calculateHolidayHours(shift);
//           }, 0);
//         }, 0);

//         const normHours = days.reduce((sum: number, day: Date) => {
//           const today = new Date();
//           const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

//           if (viewPeriod === "year" && day > endOfCurrentMonth) return sum;

//           let dayNorm = getDayNorm(day);
//           const dateStr = format(day, "yyyy-MM-dd");
//           const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
//           const hasAffectingShift = dayEntry.shifts.some((shift) => {
//             const shiftType = shiftTypes.find((type) => type.ID === Number(shift.ShiftTypeId));
//             return shiftType?.AffectsWorkingNorm;
//           });

//           if (hasAffectingShift) return sum;

//           let fraction = 1;
//           const workloadPeriods = employee.workloadPeriods ?? [];
//           for (const period of workloadPeriods) {
//             if (
//               (!period.StartDate || period.StartDate <= dateStr) &&
//               (!period.EndDate || period.EndDate >= dateStr)
//             ) {
//               fraction = period.Fraction;
//             }
//           }

//           dayNorm *= fraction;
//           return sum + dayNorm;
//         }, 0);

//         const row: any = {
//           ID: employee.ID,
//           employeeId: employee.ID,
//           EmployeeID: employee.EmployeeID,
//           Title: employee.Title,
//           JobTitle: employee.JobTitle,
//           Department: employee.Department,
//           Office: employee.Office,
//           workloadPeriods: employee.workloadPeriods,
//           totalHours,
//           totalHoursCLW,
//           holidayHours,
//           totalHoursToDelete,
//           totalHoursCLWToDelete,
//           holidayHoursToDelete,
//           normHours,
//           ShiftNumber: employee.ShiftNumber,
//           ShiftTimeType: employee.ShiftTimeType,
//         };

//         days.forEach((day) => {
//           const formattedDate = format(day, "yyyy-MM-dd");
//           row[`day-${formattedDate}`] = employee.shifts[`day-${formattedDate}`] || {
//             employeeId: employee.ID,
//             date: formattedDate,
//             shifts: [],
//             operations: [], // NEW: Добавляем пустой массив операций
//             aggregatedMetrics: { // NEW: Пустые метрики по умолчанию
//               shipped_pallets_lt20: 0,
//               shipped_pallets_gt20: 0,
//               unloading: 0,
//               moving_pallets: 0,
//               transfer_thu: 0,
//               LPR: 0,
//               operationCount: 0,
//             },
//           };
//         });

//         return row;
//       });

//     if (employeeSort.order) {
//       filteredRows.sort((a, b) => {
//         let aVal = a[employeeSort.field] || "";
//         let bVal = b[employeeSort.field] || "";
//         if (typeof aVal === "string") aVal = aVal.toLowerCase();
//         if (typeof bVal === "string") bVal = bVal.toLowerCase();
//         if (aVal < bVal) return employeeSort.order === 'asc' ? -1 : 1;
//         if (aVal > bVal) return employeeSort.order === 'asc' ? 1 : -1;
//         return 0;
//       });
//     }
//     return filteredRows;
//   }, [timeData, employeeFilter, days, shiftTypes, activeFilter, employeeSort]);

//   // AgGrid: column defs
//   const fixedColumns: ColDef[] = useMemo(() => [
//     {
//       headerComponent: (params: any) => (
//         <EmployeeHeaderWithFilter
//           {...params}
//           onFilterChange={setEmployeeFilter}
//           onSortChange={setEmployeeSort}
//           employees={timeData}
//         />
//       ),
//       field: 'Title',
//       filterValueGetter: (params) => params.data.Title,
//       valueFormatter: (params) => {
//         if (params.value && typeof params.value === 'object') {
//           return JSON.stringify(params.value);
//         }
//         return params.value;
//       },
//       width: 210,
//       pinned: 'left',
//       cellRenderer: 'employeeCellRenderer',
//       sortable: true,
//       suppressMovable: true,
//       floatingFilter: false,
//     },
//     {
//       headerName: "Часы ЛЕНТА",
//       field: "totalHours",
//       width: 120,
//       pinned: 'left',
//       sortable: true,
//       suppressMovable: true,
//       filter: false,
//       cellRenderer: (params: any) => {
//         const { totalHours, totalHoursToDelete } = params.data;
//         return (
//           <div style={{ textAlign: "center" }}>
//             <span>
//               {totalHours}ч{" "}
//               {totalHoursToDelete > 0 && (
//                 <>
//                   (<VisibilityOffIcon style={{ fontSize: 14, color: "gray", marginRight: 2 }} />
//                   {totalHoursToDelete}ч)
//                 </>
//               )}
//             </span>
//           </div>
//         );
//       },
//     },
//     {
//       headerName: "Часы ГПХ",
//       field: "totalHoursCLW",
//       width: 110,
//       pinned: 'left',
//       sortable: true,
//       suppressMovable: true,
//       filter: false,
//       cellRenderer: (params: any) => {
//         const { totalHoursCLW, totalHoursCLWToDelete } = params.data;
//         return (
//           <div style={{ textAlign: "center" }}>
//             <span>
//               {totalHoursCLW}ч{" "}
//               {totalHoursCLWToDelete > 0 && (
//                 <>
//                   (<VisibilityOffIcon style={{ fontSize: 14, color: "gray", marginRight: 2 }} />
//                   {totalHoursCLWToDelete}ч)
//                 </>
//               )}
//             </span>
//           </div>
//         );
//       },
//     },
//     {
//       headerName: 'Праздничные часы',
//       field: "holidayHours",
//       width: 120,
//       pinned: "left",
//       sortable: true,
//       filter: false,
//       suppressMovable: true,
//       headerClass: 'custom-header',
//       cellRenderer: (params: any) => {
//         const { holidayHours, holidayHoursToDelete } = params.data;
//         return (
//           <div style={{ textAlign: "center" }}>
//             <span>{holidayHours}ч</span>
//             {holidayHoursToDelete > 0 && (
//               <>
//                 (<VisibilityOffIcon style={{ fontSize: 14, color: "gray", marginRight: 2 }} />
//                 {holidayHoursToDelete}ч)
//               </>
//             )}
//           </div>
//         );
//       },
//     },
//     {
//       headerName: 'Нормо часы',
//       field: 'normHours',
//       width: 110,
//       pinned: 'left',
//       sortable: true,
//       filter: false,
//       suppressMovable: true,
//       headerClass: 'custom-header',
//       cellStyle: { textAlign: 'center', fontWeight: 'bold' },
//       valueFormatter: (params: ValueFormatterParams) => `${params.value}ч`,
//     },
//     {
//       headerName: 'Переработки/Недоработки',
//       field: 'overtimeUndertime',
//       width: 125,
//       pinned: 'left',
//       sortable: true,
//       filter: false,
//       suppressMovable: true,
//       headerClass: 'custom-header',
//       cellStyle: (params: any): any => {
//         const style: React.CSSProperties = { textAlign: "center", fontWeight: "bold" };
//         if (params.value != null) {
//           if (params.value < 0) {
//             style.backgroundColor = "#FFDAB9";
//           } else if (params.value > 0) {
//             style.backgroundColor = "lightcoral";
//           }
//         }
//         return style;
//       },
//       valueGetter: (params: any) => {
//         const { totalHours, normHours, holidayHours } = params.data;
//         if (totalHours - normHours < 0) {
//           return parseFloat((totalHours - normHours).toFixed(2));
//         }
//         if (totalHours - normHours - holidayHours > 0) {
//           return parseFloat((totalHours - normHours - holidayHours).toFixed(2));
//         }
//         return null;
//       },
//       valueFormatter: (params: ValueFormatterParams) => {
//         if (params.value === null || params.value === undefined) return '';
//         return `${params.value}ч`;
//       },
//     },
//   ], [timeData]);

//   const dynamicColumns: ColDef[] = useMemo(
//     () =>
//       days.map((day) => {
//         const formattedDate = format(day, "yyyy-MM-dd");
//         const isHoliday = productionCalendar2025.some(
//           (calDay: CalendarDay) =>
//             calDay.Date === formattedDate && calDay.Type === "п"
//         );
//         const isPrevHoliday = productionCalendar2025.some(
//           (calDay: CalendarDay) =>
//             calDay.Date === formattedDate && calDay.Type === "пп"
//         );

//         const countsForDay: { [key: number]: number } = {};
//         shiftTypes.forEach((st) => {
//           countsForDay[st.ID] = 0;
//         });
//         timeData.forEach((employee) => {
//           const dayEntry = employee.shifts[`day-${formattedDate}`] || { shifts: [] };
//           dayEntry.shifts.forEach((shift) => {
//             if (countsForDay[shift.ShiftTypeId] !== undefined) {
//               countsForDay[shift.ShiftTypeId]++;
//             }
//           });
//         });

//         return {
//           headerName: `${format(day, "EEEEEE", { locale: ru })}\n${format(
//             day,
//             "d MMM",
//             { locale: ru }
//           )}`,
//           field: `day-${formattedDate}`,
//           width: 150,
//           minWidth: 150,
//           sortable: false,
//           suppressMovable: true,
//           cellRenderer: "shiftCellRenderer",
//           cellRendererParams: {
//             shiftTypes,
//             handleAddShift,
//             handleUpdateShift,
//             handleDeleteShift,
//             bulkMode,
//             bulkSelectedShifts,
//             toggleBulkSelection,
//           },
//           headerComponent: () => {
//             const isFilterActive = activeFilter?.date === formattedDate;
//             return (
//               <Box
//                 sx={{
//                   display: "flex",
//                   flexDirection: "row",
//                   justifyContent: "space-between",
//                   alignItems: "stretch",
//                   px: 0,
//                   py: 1,
//                   borderColor: "divider",
//                   backgroundColor: isHoliday ? "rgba(255, 0, 0, 0.3)" : isPrevHoliday ? "orange" : undefined,
//                   height: "100%",
//                 }}
//               >
//                 <Box
//                   sx={{
//                     flexBasis: "40%",
//                     display: "flex",
//                     flexDirection: "column",
//                     justifyContent: "center",
//                     pl: 1,
//                   }}
//                 >
//                   <Typography variant="subtitle2">
//                     {format(day, "EEEEEE", { locale: ru })}
//                   </Typography>
//                   <Typography variant="body2">
//                     {format(day, "d MMM", { locale: ru })}
//                   </Typography>
//                   <Typography variant="caption">
//                     НРВ: {getDayNorm(day)}ч
//                   </Typography>
//                 </Box>
//                 <Box
//                   sx={{
//                     flexBasis: "60%",
//                     display: "flex",
//                     flexDirection: "column",
//                     alignItems: "flex-end",
//                     overflowY: "auto",
//                     pr: 1,
//                   }}
//                 >
//                   {shiftTypes
//                     .filter((type) => countsForDay[type.ID] > 0)
//                     .map((type) => {
//                       const isActive =
//                         isFilterActive && activeFilter?.shiftTypeId === type.ID;
//                       return (
//                         <Button
//                           key={type.ID}
//                           variant="text"
//                           size="small"
//                           sx={{
//                             m: 0.25,
//                             backgroundColor: type.BackgroundColor,
//                             color: type.TextColor,
//                             ...(isActive && { border: "2px solid blue" }),
//                             fontSize: "0.7rem",
//                             textTransform: "none",
//                           }}
//                           onMouseDown={(e) => e.preventDefault()}
//                           onClick={() => {
//                             if (isActive) {
//                               setActiveFilter(null);
//                             } else {
//                               setActiveFilter({
//                                 date: formattedDate,
//                                 shiftTypeId: type.ID,
//                               });
//                             }
//                           }}
//                         >
//                           {type.Name}: {countsForDay[type.ID]}
//                         </Button>
//                       );
//                     })}
//                 </Box>
//               </Box>
//             );
//           },
//         };
//       }),
//     [days, shiftTypes, timeData, activeFilter, bulkMode, bulkSelectedShifts]
//   );

//   const allColumns: ColDef[] = useMemo(
//     () => [...fixedColumns, ...dynamicColumns],
//     [fixedColumns, dynamicColumns]
//   );

//   const gridOptions: GridOptions = useMemo(() => ({
//     defaultColDef: {
//       resizable: true,
//       sortable: true,
//       filter: true,
//     },
//     rowHeight: 80,
//     headerHeight: 120,
//     components: {
//       employeeCellRenderer: (params: ICellRendererParams) => {
//         const [dialogOpen, setDialogOpen] = useState(false);
//         const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
//         const employee = params.data as TimeSheetEntry;
//         if (!employee) return null;

//         const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
//           e.stopPropagation();
//           setMenuAnchorEl(e.currentTarget);
//         };

//         const handleMenuClose = () => setMenuAnchorEl(null);

//         return (
//           <Box
//             sx={{
//               display: 'flex',
//               alignItems: 'center',
//               gap: 1,
//               position: 'relative',
//               paddingLeft: '30px',
//               '&:hover .settingsButton': { opacity: 1 },
//             }}
//           >
//             <Button
//               className="settingsButton"
//               onClick={handleMenuOpen}
//               variant="text"
//               sx={{
//                 opacity: 0,
//                 transition: 'opacity 0.3s',
//                 position: 'absolute',
//                 left: 0,
//                 minWidth: 'auto',
//                 padding: 0,
//               }}
//             >
//               <ManageAccountsIcon style={{ height: 24, width: 24 }} />
//             </Button>
//             <Box>
//               <Typography variant="subtitle1">{employee.Title}</Typography>
//               <Typography variant="body2" color="text.secondary">
//                 {employee.JobTitle}
//               </Typography>
//               <Typography variant="body2" color="text.secondary">
//                 Смена: {employee.ShiftNumber} {employee.ShiftTimeType}
//               </Typography>
//             </Box>
//             <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
//               <MenuItem
//                 onClick={(e) => {
//                   e.preventDefault();
//                   setDialogOpen(true);
//                   handleMenuClose();
//                 }}
//                 sx={{ color: "#267db1" }}
//               >
//                 <EditIcon fontSize="small" sx={{ mr: 1 }} />
//                 Изменить
//               </MenuItem>
//               <MenuItem
//                 onClick={() => {
//                   params.context.handleDeleteEmployee(employee.ID);
//                   handleMenuClose();
//                 }}
//                 sx={{ color: "error.main" }}
//               >
//                 <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
//                 Удалить
//               </MenuItem>
//             </Menu>
//             <EmployeeDialog
//               open={dialogOpen}
//               onOpenChange={setDialogOpen}
//               employee={employee}
//               onSave={(data) => params.context.handleUpdateEmployee(employee.ID, data)}
//             />
//           </Box>
//         );
//       },
//       shiftCellRenderer: ShiftCellRenderer,
//     },
//     context: {
//       handleAddEmployee,
//       handleUpdateEmployee,
//       handleDeleteEmployee,
//       handleAddShift,
//       handleUpdateShift,
//       handleDeleteShift,
//       bulkMode,
//       bulkSelectedShifts,
//       toggleBulkSelection,
//     },
//     suppressDragLeaveHidesColumns: true,
//   }), [handleAddEmployee, handleUpdateEmployee, handleDeleteEmployee, handleAddShift, handleUpdateShift, handleDeleteShift, bulkMode, bulkSelectedShifts]);

//   useEffect(() => {
//     if (gridRef.current?.api) {
//       gridRef.current.api.refreshCells({ force: true });
//     }
//   }, [shiftTypes]);

//   useEffect(() => {
//     setActiveFilter(null);
//   }, [viewPeriod, currentDate]);

//   const toggleBulkMode = () => {
//     setBulkMode(!bulkMode);
//     if (bulkMode) setBulkSelectedShifts([]);
//   };

//   // Render
//   return (
//     <Card>
//       <CardHeader
//         title={
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//             <IconButton onClick={toggleSideMenu} sx={{ p: 0 }}>
//               <MenuIcon />
//             </IconButton>
//             <QueryBuilderIcon style={{ height: 24, width: 24 }} />
//             <Typography variant="h6">График работы</Typography>
//           </Box>
//         }
//         action={
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//               <Button
//                 variant="outlined"
//                 onClick={toggleBulkMode}
//                 startIcon={bulkMode ? <LibraryAddCheckIcon /> : <LibraryAddCheckOutlinedIcon />}
//               >
//                 Массовое измение
//               </Button>
//               {bulkMode && (
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                   <Button variant="outlined" onClick={handleBulkEdit} startIcon={<EditIcon />} />
//                   <Button variant="outlined" onClick={handleBulkDelete} startIcon={<DeleteIcon />} />
//                 </Box>
//               )}
//             </Box>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//               <FormControl size="small" sx={{ minWidth: 180 }}>
//                 <InputLabel id="view-period-label">Период</InputLabel>
//                 <Select
//                   labelId="view-period-label"
//                   value={viewPeriod}
//                   label="Период"
//                   onChange={(e) => setViewPeriod(e.target.value as ViewPeriod)}
//                 >
//                   <MenuItem value="week">Неделя</MenuItem>
//                   <MenuItem value="month">Месяц</MenuItem>
//                   <MenuItem value="year">Год</MenuItem>
//                 </Select>
//               </FormControl>
//               <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
//                 <Button variant="outlined" onClick={handlePrevPeriod}>
//                   <ArrowBackIosIcon style={{ height: 24, width: 24 }} />
//                 </Button>
//                 <Typography variant="subtitle1" sx={{ px: 1, fontWeight: 'medium' }}>
//                   {formatPeriodLabel()}
//                 </Typography>
//                 <Button variant="outlined" onClick={handleNextPeriod}>
//                   <ArrowForwardIosIcon style={{ height: 24, width: 24 }} />
//                 </Button>
//               </Box>
//             </Box>
//           </Box>
//         }
//       />
//       <Drawer anchor="left" open={sideMenuOpen} onClose={() => setSideMenuOpen(false)}>
//         <Box sx={{
//           width: 250,
//           p: 2,
//           display: 'flex',
//           flexDirection: 'column',
//           gap: 1
//         }}>
//           <Button
//             fullWidth
//             variant="outlined"
//             startIcon={<AddIcon style={{ height: 16, width: 16 }} />}
//             onClick={() => {
//               setIsCreatePatternDialogOpen(true);
//               setSideMenuOpen(false);
//             }}
//           >
//             Создать чередование
//           </Button>
//           <Button
//             fullWidth
//             variant="outlined"
//             startIcon={<EventAvailableIcon style={{ height: 16, width: 16 }} />}
//             onClick={() => {
//               setIsAssignDialogOpen(true);
//               setSideMenuOpen(false);
//             }}
//           >
//             Применить чередование
//           </Button>
//           <ShiftTypeDialog
//             shiftTypes={shiftTypes}
//             onSave={handleAddShiftType}
//             onUpdate={handleUpdateShiftType}
//             onDelete={handleDeleteShiftType}
//             trigger={
//               <Button
//                 fullWidth
//                 variant="outlined"
//                 startIcon={<SettingsIcon style={{ height: 16, width: 16 }} />}
//                 sx={{ mt: 0 }}
//               >
//                 Управление типами смен
//               </Button>
//             }
//           />
//         </Box>
//       </Drawer>
//       <CardContent>
//         <Box sx={{ width: '100%', height: '85vh', overflow: 'auto' }}>
//           <AgGridReact
//             ref={gridRef}
//             rowData={rows}
//             columnDefs={allColumns}
//             gridOptions={gridOptions}
//             suppressRowClickSelection
//             rowSelection="single"
//             animateRows
//             modules={[ClientSideRowModelModule]}
//           />
//         </Box>
//       </CardContent>
//       <Dialog
//         open={isCreatePatternDialogOpen}
//         onClose={() => setIsCreatePatternDialogOpen(false)}
//         fullWidth
//         maxWidth="md"
//       >
//         <DialogTitle>Управление чередованиями</DialogTitle>
//         <DialogContent>
//           <DialogContentText>
//             Создавайте и изменяйте правила чередования
//           </DialogContentText>
//           <ShiftPatternForm
//             existingPatterns={shiftPatterns}
//             onSave={handleSavePattern}
//             onUpdate={handleUpdatePattern}
//             onDelete={handleDeletePattern}
//           />
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setIsCreatePatternDialogOpen(false)}>Закрыть</Button>
//         </DialogActions>
//       </Dialog>
//       <Dialog
//         open={isAssignDialogOpen}
//         onClose={() => setIsAssignDialogOpen(false)}
//         fullWidth
//         maxWidth="md"
//       >
//         <DialogTitle>Применение чередования</DialogTitle>
//         <DialogContent>
//           <DialogContentText>
//             Примените правила чередования для быстрого назначения смен
//           </DialogContentText>
//           <AssignShiftPatternForm
//             employees={timeData.map((employee) => ({
//               id: String(employee.ID),
//               name: employee.Title,
//             }))}
//             shiftPatterns={shiftPatterns}
//             shiftTypes={shiftTypes}
//             onAssign={handleAssignPattern}
//           />
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setIsAssignDialogOpen(false)}>Закрыть</Button>
//         </DialogActions>
//       </Dialog>
//       <ShiftDialog
//         shift={null}
//         employeeId={bulkSelectedShifts.length > 0 ? bulkSelectedShifts[0].employeeId.toString() : ""}
//         date={bulkSelectedShifts.length > 0 ? bulkSelectedShifts[0].date : ""}
//         shiftTypes={shiftTypes}
//         open={bulkEditDialogOpen}
//         onOpenChange={setBulkEditDialogOpen}
//         onSave={handleBulkEditSave}
//       />
//     </Card>
//   );
// }

//src/components/TimeSheet.tsx
// import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   Typography,
//   Box,
//   Button,
//   Menu,
//   MenuItem,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogContentText,
//   DialogActions,
//   FormControl,
//   InputLabel,
//   Select,
//   IconButton,
//   Drawer,
// } from '@mui/material';
// import EditIcon from "@mui/icons-material/Edit";
// import LibraryAddCheckOutlinedIcon from '@mui/icons-material/LibraryAddCheckOutlined';
// import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
// import LibraryAddCheckIcon from '@mui/icons-material/LibraryAddCheck';
// import EventAvailableIcon from '@mui/icons-material/EventAvailable';
// import DeleteIcon from "@mui/icons-material/Delete";
// import SettingsIcon from '@mui/icons-material/Settings';
// import AddIcon from '@mui/icons-material/Add';
// import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
// import MenuIcon from '@mui/icons-material/Menu';
// import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
// import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
// import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
// import { AgGridReact } from 'ag-grid-react';
// import { ColDef, GridOptions, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
// import { ModuleRegistry } from 'ag-grid-community';
// import {
//   ClientSideRowModelModule,
//   RenderApiModule,
//   RowSelectionModule,
//   TextFilterModule,
//   NumberFilterModule,
//   DateFilterModule,
//   CustomFilterModule,
//   CellStyleModule,
//   ValidationModule,
// } from 'ag-grid-community';

// // Регистрируем необходимые модули
// ModuleRegistry.registerModules([
//   ClientSideRowModelModule,
//   RenderApiModule,
//   RowSelectionModule,
//   TextFilterModule,
//   NumberFilterModule,
//   DateFilterModule,
//   CustomFilterModule,
//   CellStyleModule,
//   ValidationModule,
// ]);

// import {
//   format,
//   startOfWeek,
//   addDays,
//   addMonths,
//   addYears,
//   startOfMonth,
//   startOfYear,
// } from 'date-fns';
// import { ru } from 'date-fns/locale';
// import {
//   Employee,
//   productionCalendar2025,
//   Shift,
//   ShiftTypeDefinition,
//   ShiftPattern,
//   CalendarDay,
//   Operation,
//   AggregatedMetrics,
//   DayEntry,
// } from '../types';
// import { getDayNorm, calculateHolidayHours, calculateShiftHours, aggregateOperations } from '../lib/utils';
// import ShiftPatternForm from './ShiftPatternForm';
// import AssignShiftPatternForm from './AssignShiftPatternForm';
// import { ShiftCellRenderer } from './ShiftCellRenderer';
// import { EmployeeDialog } from './EmployeeDialog';
// import { ShiftTypeDialog } from './ShiftTypeDialog';
// import { getEmployee, deleteEmployee, getWorkloadPeriods } from "../services/userService";
// import { createShiftType, deleteShiftType, getShiftTypes, updateShiftType } from "../services/shiftTypeService";
// import { createShift, deleteShift, getShiftById, getShifts, updateShift } from '../services/shiftService';
// import { createShiftPattern, deleteShiftPattern, getShiftPatterns, updateShiftPattern } from '../services/shiftPatternService';
// import { ShiftDialog } from './ShiftDialog';
// import EmployeeHeaderWithFilter from './EmployeeHeaderWithFilter';
// import { useOperations } from '../hooks/useOperations';

// type ViewPeriod = 'week' | 'month' | 'year';

// interface TimeSheetEntry extends Employee {
//   shifts: { [key: string]: DayEntry };
// }

// interface FilterState {
//   date: string;
//   shiftTypeId: number;
// }

// export default function TimeSheet() {
//   const [employeeSort, setEmployeeSort] = useState<{ field: string; order: 'asc' | 'desc' | null }>({
//     field: 'Title',
//     order: null,
//   });

//   const [employeeFilter, setEmployeeFilter] = useState<{ field: string; value: string[] } | null>(null);
//   const [activeFilter, setActiveFilter] = useState<FilterState | null>(null);
//   const gridRef = useRef<AgGridReact>(null);
//   const [shiftPatterns, setShiftPatterns] = useState<ShiftPattern[]>([]);
//   const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
//   const [isCreatePatternDialogOpen, setIsCreatePatternDialogOpen] = useState(false);
//   const [bulkMode, setBulkMode] = useState(false);
//   const [bulkSelectedShifts, setBulkSelectedShifts] = useState<
//     { employeeId: number; date: string; shiftId: number }[]
//   >([]);
//   const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
//   const [sideMenuOpen, setSideMenuOpen] = useState(false);
//   const [currentDate, setCurrentDate] = useState(new Date());
//   const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('week');
//   const [shiftTypes, setShiftTypes] = useState<ShiftTypeDefinition[]>([]);
//   const [timeData, setTimeData] = useState<TimeSheetEntry[]>([]);

//   // NEW: Мемоизация диапазона дат
//   const getDateRange = useCallback(() => {
//     let start: Date, end: Date;
//     if (viewPeriod === 'week') {
//       start = startOfWeek(currentDate, { weekStartsOn: 1 });
//       end = addDays(start, 6);
//     } else if (viewPeriod === 'month') {
//       start = startOfMonth(currentDate);
//       end = addDays(addMonths(start, 1), -1);
//     } else {
//       start = startOfYear(currentDate);
//       end = addDays(addYears(start, 1), -1);
//     }
//     return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
//   }, [currentDate, viewPeriod]);

//   const { start: startDate, end: endDate } = getDateRange();

//   // NEW: Загрузка операций с мемоизацией employeeIds
//   const employeeIds = useMemo(() => timeData.map((e) => e.EmployeeId), [timeData]);
//   const { data: operations = [], isLoading: operationsLoading, error: operationsError } = useOperations(
//     employeeIds,
//     startDate,
//     endDate
//   );

//   // NEW: Логирование ошибок и статуса загрузки операций
//   useEffect(() => {
//     if (operationsError) {
//       console.error("❌ Ошибка загрузки операций:", operationsError);
//     }
//     if (operationsLoading) {
//       console.log("⏳ Загрузка операций...");
//     } else {
//       console.log("✅ Операции загружены:", operations);
//     }
//   }, [operationsLoading, operationsError, operations]);

//   // Загрузка паттернов смен
//   useEffect(() => {
//     async function loadShiftPatterns() {
//       try {
//         const patterns = await getShiftPatterns();
//         setShiftPatterns(patterns);
//       } catch (error) {
//         console.error("❌ Ошибка загрузки паттернов смен:", error);
//       }
//     }
//     loadShiftPatterns();
//   }, []);

//   // Загрузка типов смен
//   useEffect(() => {
//     async function loadShiftTypes() {
//       try {
//         const types = await getShiftTypes();
//         setShiftTypes(types);
//       } catch (error) {
//         console.error("❌ Ошибка загрузки типов смен:", error);
//       }
//     }
//     loadShiftTypes();
//   }, []);



//   //   // Загрузка паттернов смен
//   useEffect(() => {
//     async function loadShiftPatterns() {
//       try {
//         const patterns = await getShiftPatterns();
//         setShiftPatterns(patterns);
//       } catch (error) {
//         console.error("❌ Ошибка загрузки паттернов смен:", error);
//       }
//     }
//     loadShiftPatterns();
//   }, []);

//   // NEW: Загрузка сотрудников, смен и операций
//   useEffect(() => {
//     async function loadEmployeesAndData() {
//       try {
//         const [employees, periods, shifts] = await Promise.all([
//           getEmployee(),
//           getWorkloadPeriods(),
//           getShifts(),
//         ]);

//         // NEW: Формируем TimeSheetEntry с DayEntry
//         const entries: TimeSheetEntry[] = employees.map((emp: Employee) => {
//           const employeeShifts: { [key: string]: DayEntry } = {};
//           // Формируем даты для текущего периода
//           let current = new Date(startDate);
//           const end = new Date(endDate);
//           while (current <= end) {
//             const dateStr = format(current, 'yyyy-MM-dd');
//             const dayShifts = shifts.filter(
//               (s) => s.EmployeeId === emp.ID && s.Date.startsWith(dateStr)
//             );
//             // NEW: Фильтруем операции для текущего сотрудника и даты
//             const dayOperations = operations.filter(
//               (op) => op.UserName.Id === emp.EmployeeId && op.OperationDate.startsWith(dateStr)
//             );
//             employeeShifts[`day-${dateStr}`] = {
//               employeeId: emp.ID,
//               date: dateStr,
//               shifts: dayShifts,
//               operations: dayOperations, // NEW: Добавляем операции
//               aggregatedMetrics: aggregateOperations(dayOperations), // NEW: Агрегируем метрики
//             };
//             current = addDays(current, 1);
//           }
//           return {
//             ...emp,
//             shifts: employeeShifts,
//             workloadPeriods: periods.filter((p) => p.EmployeeId === emp.ID) || [],
//           };
//         });

//         setTimeData(entries);
//       } catch (error) {
//         console.error("❌ Ошибка загрузки данных:", error);
//       }
//     }
//     loadEmployeesAndData();
//   }, [startDate, endDate,  ]); // NEW: Добавляем operations в зависимости


//   const toggleSideMenu = () => {
//     setSideMenuOpen(!sideMenuOpen);
//   };

//   // Shift Pattern management
//   const handleSavePattern = async (pattern: ShiftPattern): Promise<void> => {
//     if (pattern.ID === 0) {
//       const patternData = {
//         Name: pattern.Name,
//         Pattern: pattern.Pattern,
//       };
//       try {
//         const newId = await createShiftPattern(patternData);
//         const newPattern: ShiftPattern = { ...pattern, ID: newId };
//         setShiftPatterns((prev) => [...prev, newPattern]);
//       } catch (error) {
//         console.error("Ошибка создания паттерна:", error);
//       }
//     }
//   };

//   const handleUpdatePattern = async (pattern: ShiftPattern): Promise<void> => {
//     if (pattern.ID !== 0) {
//       const patternData = {
//         Name: pattern.Name,
//         Pattern: pattern.Pattern,
//       };
//       try {
//         await updateShiftPattern(pattern.ID, patternData);
//         setShiftPatterns((prev) =>
//           prev.map((p) => (p.ID === pattern.ID ? pattern : p))
//         );
//       } catch (error) {
//         console.error("Ошибка обновления паттерна:", error);
//       }
//     }
//   };

//   const handleDeletePattern = async (patternId: number): Promise<void> => {
//     try {
//       await deleteShiftPattern(patternId);
//       setShiftPatterns((prev) => prev.filter((p) => p.ID !== patternId));
//     } catch (error) {
//       console.error("Ошибка удаления паттерна:", error);
//     }
//   };

//   // Assign shift patterns
//   const handleAssignPattern = (
//     assignments: { employeeId: string; shiftTypeId: number; date: string }[]
//   ) => {
//     assignments.forEach(({ employeeId, shiftTypeId, date }) => {
//       const shiftType = shiftTypes.find((type) => type.ID === shiftTypeId);
//       if (!shiftType) {
//         console.warn(`ShiftType с ID=${shiftTypeId} не найден.`);
//         return;
//       }
//       const hours = calculateShiftHours(
//         shiftType.DefaultStartTime,
//         shiftType.DefaultEndTime,
//         shiftType.DefaultBreakStart,
//         shiftType.DefaultBreakEnd,
//         shiftType.RequiredStartEndTime ?? true
//       );
//       handleAddShift(
//         parseInt(employeeId, 10),
//         date,
//         {
//           ShiftTypeId: shiftTypeId,
//           Date: date,
//           EmployeeId: parseInt(employeeId, 10),
//           StartTime: shiftType.DefaultStartTime,
//           EndTime: shiftType.DefaultEndTime,
//           BreakStart: shiftType.DefaultBreakStart,
//           BreakEnd: shiftType.DefaultBreakEnd,
//           Hours: hours,
//           IsNightShift: shiftType.Name.toLowerCase().includes('ноч') || false,
//         }
//       );
//     });
//   };

//   // Period generation
//   function generateDays(date: Date, period: ViewPeriod): Date[] {
//     let start: Date;
//     let end: Date;
//     switch (period) {
//       case 'week':
//         start = startOfWeek(date, { weekStartsOn: 1 });
//         end = addDays(start, 6);
//         break;
//       case 'month':
//         start = startOfMonth(date);
//         end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
//         break;
//       case 'year':
//         start = startOfYear(date);
//         end = new Date(date.getFullYear(), 11, 31);
//         break;
//       default:
//         return [];
//     }
//     const days: Date[] = [];
//     for (let current = start; current <= end; current = addDays(current, 1)) {
//       days.push(current);
//     }
//     return days;
//   }
//   const days = useMemo(() => generateDays(currentDate, viewPeriod), [currentDate, viewPeriod]);

//   const handlePrevPeriod = () => {
//     switch (viewPeriod) {
//       case 'week':
//         setCurrentDate(addDays(currentDate, -7));
//         break;
//       case 'month':
//         setCurrentDate(addMonths(currentDate, -1));
//         break;
//       case 'year':
//         setCurrentDate(addYears(currentDate, -1));
//         break;
//     }
//   };

//   const handleNextPeriod = () => {
//     switch (viewPeriod) {
//       case 'week':
//         setCurrentDate(addDays(currentDate, 7));
//         break;
//       case 'month':
//         setCurrentDate(addMonths(currentDate, 1));
//         break;
//       case 'year':
//         setCurrentDate(addYears(currentDate, 1));
//         break;
//     }
//   };

//   const formatPeriodLabel = () => {
//     switch (viewPeriod) {
//       case 'week':
//         return `Неделя ${format(currentDate, 'w', { locale: ru })} - ${format(
//           currentDate,
//           'LLLL yyyy',
//           { locale: ru }
//         )}`;
//       case 'month':
//         return format(currentDate, 'LLLL yyyy', { locale: ru });
//       case 'year':
//         return format(currentDate, 'yyyy');
//     }
//   };

//   // Employees management
//   const handleAddEmployee = (employeeData: Employee) => {
//     const newEmployee: TimeSheetEntry = {
//       ...employeeData,
//       shifts: {},
//       workloadPeriods: employeeData.workloadPeriods || [],
//     };
//     setTimeData((prev) => [...prev, newEmployee]);
//   };

//   const handleUpdateEmployee = (ID: number, employeeData: Omit<Employee, 'ID'>) => {
//     setTimeData((prev) =>
//       prev.map((emp) => {
//         if (emp.ID === ID) {
//           return {
//             ...emp,
//             ...employeeData,
//             workloadPeriods: employeeData.workloadPeriods ?? emp.workloadPeriods,
//           };
//         }
//         return emp;
//       })
//     );
//   };

//   const handleDeleteEmployee = async (ID: number) => {
//     try {
//       await deleteEmployee(ID);
//       setTimeData((prev) => prev.filter((emp) => emp.ID !== ID));
//     } catch (error) {
//       console.error("❌ Ошибка при удалении сотрудника:", error);
//     }
//   };

//   // ShiftType management
//   const handleAddShiftType = async (
//     shiftTypeData: Omit<ShiftTypeDefinition, 'ID'>
//   ): Promise<void> => {
//     try {
//       const newId = await createShiftType(shiftTypeData);
//       const newShiftType: ShiftTypeDefinition = {
//         ...shiftTypeData,
//         ID: newId,
//       };
//       setShiftTypes((prev) => [...prev, newShiftType]);
//     } catch (error) {
//       console.error("Ошибка создания типа смены:", error);
//     }
//   };

//   const handleUpdateShiftType = async (
//     ID: number,
//     shiftTypeData: Omit<ShiftTypeDefinition, 'ID'>
//   ): Promise<void> => {
//     try {
//       await updateShiftType(ID, shiftTypeData);
//       setShiftTypes((prev) =>
//         prev.map((type) => (type.ID === ID ? { ...shiftTypeData, ID } : type))
//       );
//     } catch (error) {
//       console.error("Ошибка обновления типа смены:", error);
//     }
//   };

//   const handleDeleteShiftType = async (ID: number): Promise<void> => {
//     const isInUse = timeData.some((employee) =>
//       Object.values(employee.shifts).flatMap((day) => day.shifts).some(
//         (shift) => shift.ShiftTypeId === ID
//       )
//     );
//     if (isInUse) {
//       alert("Нельзя удалить тип смены, который уже используется");
//       return;
//     }
//     try {
//       await deleteShiftType(ID);
//       setShiftTypes((prev) => prev.filter((type) => type.ID !== ID));
//     } catch (error) {
//       console.error("Ошибка удаления типа смены:", error);
//     }
//   };

//   // Shifts management
//   const handleAddShift = async (
//     employeeId: number,
//     date: string,
//     shiftData: Omit<Shift, 'ID'>
//   ): Promise<void> => {
//     try {
//       const newId = await createShift(shiftData);
//       const newShift: Shift = {
//         ...shiftData,
//         ID: newId,
//       };
//       setTimeData((prevData) =>
//         prevData.map((employee) => {
//           if (employee.ID === employeeId) {
//             return {
//               ...employee,
//               shifts: {
//                 ...employee.shifts,
//                 [`day-${date}`]: {
//                   ...employee.shifts[`day-${date}`] || { employeeId, date, shifts: [], operations: [], aggregatedMetrics: {} },
//                   shifts: [...(employee.shifts[`day-${date}`]?.shifts || []), newShift],
//                 },
//               },
//             };
//           }
//           return employee;
//         })
//       );
//     } catch (error) {
//       console.error("Ошибка при добавлении смены:", error);
//     }
//   };

//   const handleUpdateShift = async (
//     employeeId: number,
//     date: string,
//     shiftId: number,
//     shiftData: Omit<Shift, "ID" | "EmployeeId" | "Date">
//   ): Promise<void> => {
//     try {
//       await updateShift(shiftId, shiftData);
//       const updatedShift = await getShiftById(shiftId);
//       setTimeData((prevData) =>
//         prevData.map((employee) =>
//           employee.ID === employeeId
//             ? {
//                 ...employee,
//                 shifts: {
//                   ...employee.shifts,
//                   [`day-${date}`]: {
//                     ...employee.shifts[`day-${date}`],
//                     shifts: employee.shifts[`day-${date}`].shifts.map((shift) =>
//                       shift.ID === shiftId ? updatedShift : shift
//                     ),
//                   },
//                 },
//               }
//             : employee
//         )
//       );
//     } catch (error) {
//       console.error("❌ Ошибка при обновлении смены:", error);
//     }
//   };

//   const handleDeleteShift = async (
//     employeeId: number,
//     date: string,
//     shiftId: number
//   ): Promise<void> => {
//     try {
//       await deleteShift(shiftId);
//       setTimeData((prevData) =>
//         prevData.map((employee) => {
//           if (employee.ID === employeeId) {
//             return {
//               ...employee,
//               shifts: {
//                 ...employee.shifts,
//                 [`day-${date}`]: {
//                   ...employee.shifts[`day-${date}`],
//                   shifts: employee.shifts[`day-${date}`].shifts.filter((s) => s.ID !== shiftId),
//                 },
//               },
//             };
//           }
//           return employee;
//         })
//       );
//     } catch (error) {
//       console.error("Ошибка при удалении смены:", error);
//     }
//   };

//   const toggleBulkSelection = (employeeId: number, date: string, shiftId: number) => {
//     setBulkSelectedShifts((prev) => {
//       const exists = prev.some(
//         (item) => item.employeeId === employeeId && item.date === date && item.shiftId === shiftId
//       );
//       if (exists) {
//         return prev.filter(
//           (item) => !(item.employeeId === employeeId && item.date === date && item.shiftId === shiftId)
//         );
//       } else {
//         return [...prev, { employeeId, date, shiftId }];
//       }
//     });
//   };


//     const handleBulkEdit = () => {
//       setBulkEditDialogOpen(true);
//     };
//   const handleBulkEditSave = (data: Omit<Shift, "ID" | "EmployeeId" | "Date">) => {
//     bulkSelectedShifts.forEach((item) => {
//       handleUpdateShift(item.employeeId, item.date, item.shiftId, data);
//     });
//     setBulkEditDialogOpen(false);
//     setBulkSelectedShifts([]);
//   };

//   const handleBulkDelete = () => {
//     bulkSelectedShifts.forEach((item) => {
//       handleDeleteShift(item.employeeId, item.date, item.shiftId);
//     });
//     setBulkSelectedShifts([]);
//   };

//   // AgGrid: row data
//   const rows = useMemo(() => {
//     const filteredRows = timeData
//       .filter((employee) => {
//         if (!employeeFilter || !employeeFilter.value || employeeFilter.value.length === 0) {
//           return true;
//         }
//         const field = employeeFilter.field;
//         const fieldValue = (employee as any)[field];
//         if (typeof fieldValue !== 'string') return false;
//         return employeeFilter.value.some(
//           (option: string) => fieldValue.toLowerCase() === option.toLowerCase()
//         );
//       })
//       .filter((employee) => {
//         if (!activeFilter) return true;
//         const dayEntry = employee.shifts[`day-${activeFilter.date}`] || { shifts: [] };
//         return dayEntry.shifts.some(
//           (shift) => Number(shift.ShiftTypeId) === activeFilter.shiftTypeId
//         );
//       })
//       .map((employee) => {
//         const totalHours = days.reduce((sum: number, day: Date) => {
//           const dateStr = format(day, "yyyy-MM-dd");
//           const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
//           return sum + dayEntry.shifts.reduce((s: number, shift: Shift) => {
//             if (shift.MarkedForDeletion) return s;
//             const shiftType = shiftTypes.find(
//               (t) => t.ID === Number(shift.ShiftTypeId)
//             );
//             return shiftType && !shiftType.CivilLawContract ? s + shift.Hours : s;
//           }, 0);
//         }, 0);

//         const totalHoursCLW = days.reduce((sum: number, day: Date) => {
//           const dateStr = format(day, "yyyy-MM-dd");
//           const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
//           return sum + dayEntry.shifts.reduce((s: number, shift: Shift) => {
//             if (shift.MarkedForDeletion) return s;
//             const shiftType = shiftTypes.find(
//               (t) => t.ID === Number(shift.ShiftTypeId)
//             );
//             return shiftType?.CivilLawContract ? s + shift.Hours : s;
//           }, 0);
//         }, 0);

//         const holidayHours = days.reduce((sum: number, day: Date) => {
//           const dateStr = format(day, "yyyy-MM-dd");
//           const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
//           return sum + dayEntry.shifts.reduce((s: number, shift: Shift) => {
//             if (shift.MarkedForDeletion) return s;
//             return s + calculateHolidayHours(shift);
//           }, 0);
//         }, 0);

//         const totalHoursToDelete = days.reduce((sum: number, day: Date) => {
//           const dateStr = format(day, "yyyy-MM-dd");
//           const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
//           return sum + dayEntry.shifts.reduce((s: number, shift: Shift) => {
//             if (!shift.MarkedForDeletion) return s;
//             const shiftType = shiftTypes.find(
//               (t) => t.ID === Number(shift.ShiftTypeId)
//             );
//             return shiftType && !shiftType.CivilLawContract ? s + shift.Hours : s;
//           }, 0);
//         }, 0);

//         const totalHoursCLWToDelete = days.reduce((sum: number, day: Date) => {
//           const dateStr = format(day, "yyyy-MM-dd");
//           const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
//           return sum + dayEntry.shifts.reduce((s: number, shift: Shift) => {
//             if (!shift.MarkedForDeletion) return s;
//             const shiftType = shiftTypes.find(
//               (t) => t.ID === Number(shift.ShiftTypeId)
//             );
//             return shiftType?.CivilLawContract ? s + shift.Hours : s;
//           }, 0);
//         }, 0);

//         const holidayHoursToDelete = days.reduce((sum: number, day: Date) => {
//           const dateStr = format(day, "yyyy-MM-dd");
//           const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
//           return sum + dayEntry.shifts.reduce((s: number, shift: Shift) => {
//             if (!shift.MarkedForDeletion) return s;
//             return s + calculateHolidayHours(shift);
//           }, 0);
//         }, 0);

//         const normHours = days.reduce((sum: number, day: Date) => {
//           const today = new Date();
//           const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

//           if (viewPeriod === "year" && day > endOfCurrentMonth) return sum;

//           let dayNorm = getDayNorm(day);
//           const dateStr = format(day, "yyyy-MM-dd");
//           const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
//           const hasAffectingShift = dayEntry.shifts.some((shift) => {
//             const shiftType = shiftTypes.find((type) => type.ID === Number(shift.ShiftTypeId));
//             return shiftType?.AffectsWorkingNorm;
//           });

//           if (hasAffectingShift) return sum;

//           let fraction = 1;
//           const workloadPeriods = employee.workloadPeriods ?? [];
//           for (const period of workloadPeriods) {
//             if (
//               (!period.StartDate || period.StartDate <= dateStr) &&
//               (!period.EndDate || period.EndDate >= dateStr)
//             ) {
//               fraction = period.Fraction;
//             }
//           }

//           dayNorm *= fraction;
//           return sum + dayNorm;
//         }, 0);

//         const row: any = {
//           ID: employee.ID,
//           employeeId: employee.ID,
//           EmployeeID: employee.EmployeeId,
//           Title: employee.Title,
//           JobTitle: employee.JobTitle,
//           Department: employee.Department,
//           Office: employee.Office,
//           workloadPeriods: employee.workloadPeriods,
//           totalHours,
//           totalHoursCLW,
//           holidayHours,
//           totalHoursToDelete,
//           totalHoursCLWToDelete,
//           holidayHoursToDelete,
//           normHours,
//           ShiftNumber: employee.ShiftNumber,
//           ShiftTimeType: employee.ShiftTimeType,
//         };

//         days.forEach((day) => {
//           const formattedDate = format(day, "yyyy-MM-dd");
//           row[`day-${formattedDate}`] = employee.shifts[`day-${formattedDate}`] || {
//             employeeId: employee.ID,
//             date: formattedDate,
//             shifts: [],
//             operations: [],
//             aggregatedMetrics: {
//               shipped_pallets_lt20: 0,
//               shipped_pallets_gt20: 0,
//               unloading: 0,
//               moving_pallets: 0,
//               transfer_thu: 0,
//               LPR: 0,
//               operationCount: 0,
//             },
//           };
//         });

//         return row;
//       });

//     if (employeeSort.order) {
//       filteredRows.sort((a, b) => {
//         let aVal = a[employeeSort.field] || "";
//         let bVal = b[employeeSort.field] || "";
//         if (typeof aVal === "string") aVal = aVal.toLowerCase();
//         if (typeof bVal === "string") bVal = bVal.toLowerCase();
//         if (aVal < bVal) return employeeSort.order === 'asc' ? -1 : 1;
//         if (aVal > bVal) return employeeSort.order === 'asc' ? 1 : -1;
//         return 0;
//       });
//     }
//     return filteredRows;
//   }, [timeData, employeeFilter, days, shiftTypes, activeFilter, employeeSort]);

//   // AgGrid: column defs
//   const fixedColumns: ColDef[] = useMemo(() => [
//     {
//       headerComponent: (params: any) => (
//         <EmployeeHeaderWithFilter
//           {...params}
//           onFilterChange={setEmployeeFilter}
//           onSortChange={setEmployeeSort}
//           employees={timeData}
//         />
//       ),
//       field: 'Title',
//       filterValueGetter: (params) => params.data.Title,
//       valueFormatter: (params) => {
//         if (params.value && typeof params.value === 'object') {
//           return JSON.stringify(params.value);
//         }
//         return params.value;
//       },
//       width: 210,
//       pinned: 'left',
//       cellRenderer: 'employeeCellRenderer',
//       sortable: true,
//       suppressMovable: true,
//       floatingFilter: false,
//     },
//     {
//       headerName: "Часы ЛЕНТА",
//       field: "totalHours",
//       width: 120,
//       pinned: 'left',
//       sortable: true,
//       suppressMovable: true,
//       filter: false,
//       cellRenderer: (params: any) => {
//         const { totalHours, totalHoursToDelete } = params.data;
//         return (
//           <div style={{ textAlign: "center" }}>
//             <span>
//               {totalHours}ч{" "}
//               {totalHoursToDelete > 0 && (
//                 <>
//                   (<VisibilityOffIcon style={{ fontSize: 14, color: "gray", marginRight: 2 }} />
//                   {totalHoursToDelete}ч)
//                 </>
//               )}
//             </span>
//           </div>
//         );
//       },
//     },
//     {
//       headerName: "Часы ГПХ",
//       field: "totalHoursCLW",
//       width: 110,
//       pinned: 'left',
//       sortable: true,
//       suppressMovable: true,
//       filter: false,
//       cellRenderer: (params: any) => {
//         const { totalHoursCLW, totalHoursCLWToDelete } = params.data;
//         return (
//           <div style={{ textAlign: "center" }}>
//             <span>
//               {totalHoursCLW}ч{" "}
//               {totalHoursCLWToDelete > 0 && (
//                 <>
//                   (<VisibilityOffIcon style={{ fontSize: 14, color: "gray", marginRight: 2 }} />
//                   {totalHoursCLWToDelete}ч)
//                 </>
//               )}
//             </span>
//           </div>
//         );
//       },
//     },
//     {
//       headerName: 'Праздничные часы',
//       field: "holidayHours",
//       width: 120,
//       pinned: "left",
//       sortable: true,
//       filter: false,
//       suppressMovable: true,
//       headerClass: 'custom-header',
//       cellRenderer: (params: any) => {
//         const { holidayHours, holidayHoursToDelete } = params.data;
//         return (
//           <div style={{ textAlign: "center" }}>
//             <span>{holidayHours}ч</span>
//             {holidayHoursToDelete > 0 && (
//               <>
//                 (<VisibilityOffIcon style={{ fontSize: 14, color: "gray", marginRight: 2 }} />
//                 {holidayHoursToDelete}ч)
//               </>
//             )}
//           </div>
//         );
//       },
//     },
//     {
//       headerName: 'Нормо часы',
//       field: 'normHours',
//       width: 110,
//       pinned: 'left',
//       sortable: true,
//       filter: false,
//       suppressMovable: true,
//       headerClass: 'custom-header',
//       cellStyle: { textAlign: 'center', fontWeight: 'bold' },
//       valueFormatter: (params: ValueFormatterParams) => `${params.value}ч`,
//     },
//     {
//       headerName: 'Переработки/Недоработки',
//       field: 'overtimeUndertime',
//       width: 125,
//       pinned: 'left',
//       sortable: true,
//       filter: false,
//       suppressMovable: true,
//       headerClass: 'custom-header',
//       cellStyle: (params: any): any => {
//         const style: React.CSSProperties = { textAlign: "center", fontWeight: "bold" };
//         if (params.value != null) {
//           if (params.value < 0) {
//             style.backgroundColor = "#FFDAB9";
//           } else if (params.value > 0) {
//             style.backgroundColor = "lightcoral";
//           }
//         }
//         return style;
//       },
//       valueGetter: (params: any) => {
//         const { totalHours, normHours, holidayHours } = params.data;
//         if (totalHours - normHours < 0) {
//           return parseFloat((totalHours - normHours).toFixed(2));
//         }
//         if (totalHours - normHours - holidayHours > 0) {
//           return parseFloat((totalHours - normHours - holidayHours).toFixed(2));
//         }
//         return null;
//       },
//       valueFormatter: (params: ValueFormatterParams) => {
//         if (params.value === null || params.value === undefined) return '';
//         return `${params.value}ч`;
//       },
//     },
//   ], [timeData]);

//   const dynamicColumns: ColDef[] = useMemo(
//     () =>
//       days.map((day) => {
//         const formattedDate = format(day, "yyyy-MM-dd");
//         const isHoliday = productionCalendar2025.some(
//           (calDay: CalendarDay) =>
//             calDay.Date === formattedDate && calDay.Type === "п"
//         );
//         const isPrevHoliday = productionCalendar2025.some(
//           (calDay: CalendarDay) =>
//             calDay.Date === formattedDate && calDay.Type === "пп"
//         );

//         const countsForDay: { [key: number]: number } = {};
//         shiftTypes.forEach((st) => {
//           countsForDay[st.ID] = 0;
//         });
//         timeData.forEach((employee) => {
//           const dayEntry = employee.shifts[`day-${formattedDate}`] || { shifts: [] };
//           dayEntry.shifts.forEach((shift) => {
//             if (countsForDay[shift.ShiftTypeId] !== undefined) {
//               countsForDay[shift.ShiftTypeId]++;
//             }
//           });
//         });

//         return {
//           headerName: `${format(day, "EEEEEE", { locale: ru })}\n${format(
//             day,
//             "d MMM",
//             { locale: ru }
//           )}`,
//           field: `day-${formattedDate}`,
//           width: 150,
//           minWidth: 150,
//           sortable: false,
//           suppressMovable: true,
//           cellRenderer: "shiftCellRenderer",
//           cellRendererParams: {
//             shiftTypes,
//             handleAddShift,
//             handleUpdateShift,
//             handleDeleteShift,
//             bulkMode,
//             bulkSelectedShifts,
//             toggleBulkSelection,
//           },
//           headerComponent: () => {
//             const isFilterActive = activeFilter?.date === formattedDate;
//             return (
//               <Box
//                 sx={{
//                   display: "flex",
//                   flexDirection: "row",
//                   justifyContent: "space-between",
//                   alignItems: "stretch",
//                   px: 0,
//                   py: 1,
//                   borderColor: "divider",
//                   backgroundColor: isHoliday ? "rgba(255, 0, 0, 0.3)" : isPrevHoliday ? "orange" : undefined,
//                   height: "100%",
//                 }}
//               >
//                 <Box
//                   sx={{
//                     flexBasis: "40%",
//                     display: "flex",
//                     flexDirection: "column",
//                     justifyContent: "center",
//                     pl: 1,
//                   }}
//                 >
//                   <Typography variant="subtitle2">
//                     {format(day, "EEEEEE", { locale: ru })}
//                   </Typography>
//                   <Typography variant="body2">
//                     {format(day, "d MMM", { locale: ru })}
//                   </Typography>
//                   <Typography variant="caption">
//                     НРВ: {getDayNorm(day)}ч
//                   </Typography>
//                 </Box>
//                 <Box
//                   sx={{
//                     flexBasis: "60%",
//                     display: "flex",
//                     flexDirection: "column",
//                     alignItems: "flex-end",
//                     overflowY: "auto",
//                     pr: 1,
//                   }}
//                 >
//                   {shiftTypes
//                     .filter((type) => countsForDay[type.ID] > 0)
//                     .map((type) => {
//                       const isActive =
//                         isFilterActive && activeFilter?.shiftTypeId === type.ID;
//                       return (
//                         <Button
//                           key={type.ID}
//                           variant="text"
//                           size="small"
//                           sx={{
//                             m: 0.25,
//                             backgroundColor: type.BackgroundColor,
//                             color: type.TextColor,
//                             ...(isActive && { border: "2px solid blue" }),
//                             fontSize: "0.7rem",
//                             textTransform: "none",
//                           }}
//                           onMouseDown={(e) => e.preventDefault()}
//                           onClick={() => {
//                             if (isActive) {
//                               setActiveFilter(null);
//                             } else {
//                               setActiveFilter({
//                                 date: formattedDate,
//                                 shiftTypeId: type.ID,
//                               });
//                             }
//                           }}
//                         >
//                           {type.Name}: {countsForDay[type.ID]}
//                         </Button>
//                       );
//                     })}
//                 </Box>
//               </Box>
//             );
//           },
//         };
//       }),
//     [days, shiftTypes, timeData, activeFilter, bulkMode, bulkSelectedShifts]
//   );

//   const allColumns: ColDef[] = useMemo(
//     () => [...fixedColumns, ...dynamicColumns],
//     [fixedColumns, dynamicColumns]
//   );

//   const gridOptions: GridOptions = useMemo(() => ({
//     defaultColDef: {
//       resizable: true,
//       sortable: true,
//       filter: true,
//     },
//     rowHeight: 80,
//     headerHeight: 120,
//     components: {
//       employeeCellRenderer: (params: ICellRendererParams) => {
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
//   const employee = params.data as TimeSheetEntry;

//   if (!employee) {
//     console.error('❌ EmployeeCellRenderer: employee is undefined', params);
//     return <Typography color="error">Данные сотрудника отсутствуют</Typography>;
//   }

//   console.log('📋 EmployeeCellRenderer: employee=', employee);

//   const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
//     e.stopPropagation();
//     setMenuAnchorEl(e.currentTarget);
//   };

//   const handleMenuClose = () => setMenuAnchorEl(null);

//   return (
//     <Box
//       sx={{
//         display: 'flex',
//         alignItems: 'center',
//         gap: 1,
//         position: 'relative',
//         paddingLeft: '30px',
//         '&:hover .settingsButton': { opacity: 1 },
//       }}
//     >
//       <Button
//         className="settingsButton"
//         onClick={handleMenuOpen}
//         variant="text"
//         sx={{
//           opacity: 0,
//           transition: 'opacity 0.3s',
//           position: 'absolute',
//           left: 0,
//           minWidth: 'auto',
//           padding: 0,
//         }}
//       >
//         <ManageAccountsIcon style={{ height: 24, width: 24 }} />
//       </Button>
//       <Box>
//         <Typography variant="subtitle1">{employee.Title}</Typography>
//         <Typography variant="body2" color="text.secondary">
//           {employee.JobTitle}
//         </Typography>
//         <Typography variant="body2" color="text.secondary">
//           Смена: {employee.ShiftNumber} {employee.ShiftTimeType}
//         </Typography>
//       </Box>
//       <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
//         <MenuItem
//           onClick={(e) => {
//             e.preventDefault();
//             setDialogOpen(true);
//             handleMenuClose();
//           }}
//           sx={{ color: "#267db1" }}
//         >
//           <EditIcon fontSize="small" sx={{ mr: 1 }} />
//           Изменить
//         </MenuItem>
//         <MenuItem
//           onClick={() => {
//             params.context.handleDeleteEmployee(employee.ID);
//             handleMenuClose();
//           }}
//           sx={{ color: "error.main" }}
//         >
//           <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
//           Удалить
//         </MenuItem>
//       </Menu>
//       <EmployeeDialog
//         open={dialogOpen}
//         onOpenChange={setDialogOpen}
//         employee={employee}
//         onSave={(data) => params.context.handleUpdateEmployee(employee.ID, data)}
//       />
//     </Box>
//   );
// },
//       // employeeCellRenderer: (params: ICellRendererParams) => {
//       //   const [dialogOpen, setDialogOpen] = useState(false);
//       //   const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
//       //   const employee = params.data as TimeSheetEntry;
//       //   if (!employee) return null;

//       //   const handleMenuOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
//       //     e.stopPropagation();
//       //     setMenuAnchorEl(e.currentTarget);
//       //   };

//       //   const handleMenuClose = () => setMenuAnchorEl(null);

//       //   return (
//       //     <Box
//       //       sx={{
//       //         display: 'flex',
//       //         alignItems: 'center',
//       //         gap: 1,
//       //         position: 'relative',
//       //         paddingLeft: '30px',
//       //         '&:hover .settingsButton': { opacity: 1 },
//       //       }}
//       //     >
//       //       <Button
//       //         className="settingsButton"
//       //         onClick={handleMenuOpen}
//       //         variant="text"
//       //         sx={{
//       //           opacity: 0,
//       //           transition: 'opacity 0.3s',
//       //           position: 'absolute',
//       //           left: 0,
//       //           minWidth: 'auto',
//       //           padding: 0,
//       //         }}
//       //       >
//       //         <ManageAccountsIcon style={{ height: 24, width: 24 }} />
//       //       </Button>
//       //       <Box>
//       //         <Typography variant="subtitle1">{employee.Title}</Typography>
//       //         <Typography variant="body2" color="text.secondary">
//       //           {employee.JobTitle}
//       //         </Typography>
//       //         <Typography variant="body2" color="text.secondary">
//       //           Смена: {employee.ShiftNumber} {employee.ShiftTimeType}
//       //         </Typography>
//       //       </Box>
//       //       <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
//       //         <MenuItem
//       //           onClick={(e) => {
//       //             e.preventDefault();
//       //             setDialogOpen(true);
//       //             handleMenuClose();
//       //           }}
//       //           sx={{ color: "#267db1" }}
//       //         >
//       //           <EditIcon fontSize="small" sx={{ mr: 1 }} />
//       //           Изменить
//       //         </MenuItem>
//       //         <MenuItem
//       //           onClick={() => {
//       //             params.context.handleDeleteEmployee(employee.ID);
//       //             handleMenuClose();
//       //           }}
//       //           sx={{ color: "error.main" }}
//       //         >
//       //           <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
//       //           Удалить
//       //         </MenuItem>
//       //       </Menu>
//       //       <EmployeeDialog
//       //         open={dialogOpen}
//       //         onOpenChange={setDialogOpen}
//       //         employee={employee}
//       //         onSave={(data) => params.context.handleUpdateEmployee(employee.ID, data)}
//       //       />
//       //     </Box>
//       //   );
//       // },
//       shiftCellRenderer: ShiftCellRenderer,
//     },
//     context: {
//       handleAddEmployee,
//       handleUpdateEmployee,
//       handleDeleteEmployee,
//       handleAddShift,
//       handleUpdateShift,
//       handleDeleteShift,
//       bulkMode,
//       bulkSelectedShifts,
//       toggleBulkSelection,
//     },
//     suppressDragLeaveHidesColumns: true,
//   }), [handleAddEmployee, handleUpdateEmployee, handleDeleteEmployee, handleAddShift, handleUpdateShift, handleDeleteShift, bulkMode, bulkSelectedShifts]);

//   useEffect(() => {
//     if (gridRef.current?.api) {
//       gridRef.current.api.refreshCells({ force: true });
//     }
//   }, [shiftTypes]);

//   useEffect(() => {
//     setActiveFilter(null);
//   }, [viewPeriod, currentDate]);

//   const toggleBulkMode = () => {
//     setBulkMode(!bulkMode);
//     if (bulkMode) setBulkSelectedShifts([]);
//   };

//   // Render
//   return (
//     <Card>
//       <CardHeader
//         title={
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//             <IconButton onClick={toggleSideMenu} sx={{ p: 0 }}>
//               <MenuIcon />
//             </IconButton>
//             <QueryBuilderIcon style={{ height: 24, width: 24 }} />
//             <Typography variant="h6">График работы</Typography>
//           </Box>
//         }
//         action={
//           <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//               <Button
//                 variant="outlined"
//                 onClick={toggleBulkMode}
//                 startIcon={bulkMode ? <LibraryAddCheckIcon /> : <LibraryAddCheckOutlinedIcon />}
//               >
//                 Массовое измение
//               </Button>
//               {bulkMode && (
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                   <Button variant="outlined" onClick={handleBulkEdit} startIcon={<EditIcon />} />
//                   <Button variant="outlined" onClick={handleBulkDelete} startIcon={<DeleteIcon />} />
//                 </Box>
//               )}
//             </Box>
//             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//               <FormControl size="small" sx={{ minWidth: 180 }}>
//                 <InputLabel id="view-period-label">Период</InputLabel>
//                 <Select
//                   labelId="view-period-label"
//                   value={viewPeriod}
//                   label="Период"
//                   onChange={(e) => setViewPeriod(e.target.value as ViewPeriod)}
//                 >
//                   <MenuItem value="week">Неделя</MenuItem>
//                   <MenuItem value="month">Месяц</MenuItem>
//                   <MenuItem value="year">Год</MenuItem>
//                 </Select>
//               </FormControl>
//               <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
//                 <Button variant="outlined" onClick={handlePrevPeriod}>
//                   <ArrowBackIosIcon style={{ height: 24, width: 24 }} />
//                 </Button>
//                 <Typography variant="subtitle1" sx={{ px: 1, fontWeight: 'medium' }}>
//                   {formatPeriodLabel()}
//                 </Typography>
//                 <Button variant="outlined" onClick={handleNextPeriod}>
//                   <ArrowForwardIosIcon style={{ height: 24, width: 24 }} />
//                 </Button>
//               </Box>
//             </Box>
//           </Box>
//         }
//       />
//       <Drawer anchor="left" open={sideMenuOpen} onClose={() => setSideMenuOpen(false)}>
//         <Box sx={{
//           width: 250,
//           p: 2,
//           display: 'flex',
//           flexDirection: 'column',
//           gap: 1
//         }}>
//           <Button
//             fullWidth
//             variant="outlined"
//             startIcon={<AddIcon style={{ height: 16, width: 16 }} />}
//             onClick={() => {
//               setIsCreatePatternDialogOpen(true);
//               setSideMenuOpen(false);
//             }}
//           >
//             Создать чередование
//           </Button>
//           <Button
//             fullWidth
//             variant="outlined"
//             startIcon={<EventAvailableIcon style={{ height: 16, width: 16 }} />}
//             onClick={() => {
//               setIsAssignDialogOpen(true);
//               setSideMenuOpen(false);
//             }}
//           >
//             Применить чередование
//           </Button>
//           <ShiftTypeDialog
//             shiftTypes={shiftTypes}
//             onSave={handleAddShiftType}
//             onUpdate={handleUpdateShiftType}
//             onDelete={handleDeleteShiftType}
//             trigger={
//               <Button
//                 fullWidth
//                 variant="outlined"
//                 startIcon={<SettingsIcon style={{ height: 16, width: 16 }} />}
//                 sx={{ mt: 0 }}
//               >
//                 Управление типами смен
//               </Button>
//             }
//           />
//         </Box>
//       </Drawer>
//       <CardContent>
//         <Box sx={{ width: '100%', height: '85vh', overflow: 'auto' }}>
//           <AgGridReact
//             ref={gridRef}
//             rowData={rows}
//             columnDefs={allColumns}
//             gridOptions={gridOptions}
//             suppressRowClickSelection
//             rowSelection="single"
//             animateRows
//             modules={[ClientSideRowModelModule]}
//           />
//         </Box>
//       </CardContent>
//       <Dialog
//         open={isCreatePatternDialogOpen}
//         onClose={() => setIsCreatePatternDialogOpen(false)}
//         fullWidth
//         maxWidth="md"
//       >
//         <DialogTitle>Управление чередованиями</DialogTitle>
//         <DialogContent>
//           <DialogContentText>
//             Создавайте и изменяйте правила чередования
//           </DialogContentText>
//           <ShiftPatternForm
//             existingPatterns={shiftPatterns}
//             onSave={handleSavePattern}
//             onUpdate={handleUpdatePattern}
//             onDelete={handleDeletePattern}
//           />
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setIsCreatePatternDialogOpen(false)}>Закрыть</Button>
//         </DialogActions>
//       </Dialog>
//       <Dialog
//         open={isAssignDialogOpen}
//         onClose={() => setIsAssignDialogOpen(false)}
//         fullWidth
//         maxWidth="md"
//       >
//         <DialogTitle>Применение чередования</DialogTitle>
//         <DialogContent>
//           <DialogContentText>
//             Примените правила чередования для быстрого назначения смен
//           </DialogContentText>
//           <AssignShiftPatternForm
//             employees={timeData.map((employee) => ({
//               id: String(employee.ID),
//               name: employee.Title,
//             }))}
//             shiftPatterns={shiftPatterns}
//             shiftTypes={shiftTypes}
//             onAssign={handleAssignPattern}
//           />
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setIsAssignDialogOpen(false)}>Закрыть</Button>
//         </DialogActions>
//       </Dialog>
//       <ShiftDialog
//         shift={null}
//         employeeId={bulkSelectedShifts.length > 0 ? bulkSelectedShifts[0].employeeId.toString() : ""}
//         date={bulkSelectedShifts.length > 0 ? bulkSelectedShifts[0].date : ""}
//         shiftTypes={shiftTypes}
//         open={bulkEditDialogOpen}
//         onOpenChange={setBulkEditDialogOpen}
//         onSave={handleBulkEditSave}
//       />
//     </Card>
//   );
// }


import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
  IconButton,
  Drawer,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LibraryAddCheckOutlinedIcon from '@mui/icons-material/LibraryAddCheckOutlined';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LibraryAddCheckIcon from '@mui/icons-material/LibraryAddCheck';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import MenuIcon from '@mui/icons-material/Menu';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridOptions, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { ModuleRegistry } from 'ag-grid-community';
import {
  ClientSideRowModelModule,
  RenderApiModule,
  RowSelectionModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  CustomFilterModule,
  CellStyleModule,
  ValidationModule,
} from 'ag-grid-community';
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
  Operation,
  AggregatedMetrics,
  DayEntry,
} from '../types';
import { getDayNorm, calculateHolidayHours, calculateShiftHours, aggregateOperations } from '../lib/utils';
import ShiftPatternForm from './ShiftPatternForm';
import AssignShiftPatternForm from './AssignShiftPatternForm';
import { ShiftCellRenderer } from './ShiftCellRenderer';
import { EmployeeDialog } from './EmployeeDialog';
import { ShiftTypeDialog } from './ShiftTypeDialog';
import { getEmployee, deleteEmployee, getWorkloadPeriods } from '../services/userService';
import { createShiftType, deleteShiftType, getShiftTypes, updateShiftType } from '../services/shiftTypeService';
import { createShift, deleteShift, getShiftById, getShifts, updateShift } from '../services/shiftService';
import { createShiftPattern, deleteShiftPattern, getShiftPatterns, updateShiftPattern } from '../services/shiftPatternService';
import { ShiftDialog } from './ShiftDialog';
import EmployeeHeaderWithFilter from './EmployeeHeaderWithFilter';

import { useOperations } from '../hooks/useOperations';
import { getOperations } from '../services/operationService';

// Регистрируем необходимые модули
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  RenderApiModule,
  RowSelectionModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  CustomFilterModule,
  CellStyleModule,
  ValidationModule,
]);

type ViewPeriod = 'week' | 'month' | 'year';

interface TimeSheetEntry extends Employee {
  shifts: { [key: string]: DayEntry };
}

interface FilterState {
  date: string;
  shiftTypeId: number;
}

export default function TimeSheet() {
  const [employeeSort, setEmployeeSort] = useState<{ field: string; order: 'asc' | 'desc' | null }>({
    field: 'Title',
    order: null,
  });
  const [employeeFilter, setEmployeeFilter] = useState<{ field: string; value: string[] } | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterState | null>(null);
  const gridRef = useRef<AgGridReact>(null);
  const [shiftPatterns, setShiftPatterns] = useState<ShiftPattern[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isCreatePatternDialogOpen, setIsCreatePatternDialogOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelectedShifts, setBulkSelectedShifts] = useState<
    { employeeId: number; date: string; shiftId: number }[]
  >([]);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('week');
  const [shiftTypes, setShiftTypes] = useState<ShiftTypeDefinition[]>([]);
  const [timeData, setTimeData] = useState<TimeSheetEntry[]>([]);

  // Мемоизация диапазона дат
  const getDateRange = useCallback(() => {
    let start: Date, end: Date;
    if (viewPeriod === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = addDays(start, 6);
    } else if (viewPeriod === 'month') {
      start = startOfMonth(currentDate);
      end = addDays(addMonths(start, 1), -1);
    } else {
      start = startOfYear(currentDate);
      end = addDays(addYears(start, 1), -1);
    }
    return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
  }, [currentDate, viewPeriod]);

  const { start: startDate, end: endDate } = getDateRange();

  // Загрузка операций
  const employeeIds = useMemo(() => timeData.map((e) => e.EmployeeId), [timeData]);
  const { data: operations = [], isLoading: operationsLoading, error: operationsError } = useOperations(
    employeeIds,
    startDate,
    endDate
  );

  // Логирование операций
  useEffect(() => {
    if (operationsError) {
      console.error('❌ Ошибка загрузки операций:', operationsError);
    }
    if (operationsLoading) {
      console.log('⏳ Загрузка операций...');
    } else {
      console.log('✅ Операции загружены:', operations);
    }
  }, [operationsLoading, operationsError, operations]);

  // Загрузка всех данных
  useEffect(() => {
    async function loadAllData() {
      console.log('⏳ Начало загрузки всех данных...');
      try {
        const [employees, periods, shifts, types, patterns, ops] = await Promise.all([
          getEmployee(),
          getWorkloadPeriods(),
          getShifts(),
          getShiftTypes(),
          getShiftPatterns(),
          employeeIds.length ? getOperations(employeeIds, startDate, endDate) : Promise.resolve([]),
        ]);

        console.log('📦 Получены данные:', {
          employees: employees.length,
          periods: periods.length,
          shifts: shifts.length,
          shiftTypes: types.length,
          shiftPatterns: patterns.length,
          operations: ops.length,
        });

        const entries: TimeSheetEntry[] = employees.map((emp: Employee) => {
          const employeeShifts: { [key: string]: DayEntry } = {};
          let current = new Date(startDate);
          const end = new Date(endDate);
          while (current <= end) {
            const dateStr = format(current, 'yyyy-MM-dd');
            const dayShifts = shifts.filter(
              (s) => s.EmployeeId === emp.ID && format(new Date(s.Date), 'yyyy-MM-dd') === dateStr
            );
            const dayOperations = ops.filter(
              (op) => op.UserName.Id === emp.EmployeeId && format(new Date(op.OperationDate), 'yyyy-MM-dd') === dateStr
            );
            employeeShifts[`day-${dateStr}`] = {
              employeeId: emp.ID,
              date: dateStr,
              shifts: dayShifts,
              operations: dayOperations,
              aggregatedMetrics: aggregateOperations(dayOperations),
            };
            current = addDays(current, 1);
          }
          return {
            ...emp,
            EmployeeId: emp.EmployeeId,
            shifts: employeeShifts,
            workloadPeriods: periods.filter((p) => p.EmployeeId === emp.ID) || [],
          };
        });

        console.log('✅ timeData сформирован:', entries);
        setTimeData(entries);
        setShiftTypes(types);
        setShiftPatterns(patterns);
      } catch (error) {
        console.error('❌ Ошибка загрузки данных:', error);
      }
    }
    loadAllData();
  }, [startDate, endDate, ]);

  const toggleSideMenu = () => {
    setSideMenuOpen(!sideMenuOpen);
  };

  // Shift Pattern management
  const handleSavePattern = async (pattern: ShiftPattern): Promise<void> => {
    if (pattern.ID === 0) {
      try {
        const newId = await createShiftPattern({ Name: pattern.Name, Pattern: pattern.Pattern });
        const newPattern: ShiftPattern = { ...pattern, ID: newId };
        setShiftPatterns((prev) => [...prev, newPattern]);
      } catch (error) {
        console.error('❌ Ошибка создания паттерна:', error);
      }
    }
  };

  const handleUpdatePattern = async (pattern: ShiftPattern): Promise<void> => {
    if (pattern.ID !== 0) {
      try {
        await updateShiftPattern(pattern.ID, { Name: pattern.Name, Pattern: pattern.Pattern });
        setShiftPatterns((prev) =>
          prev.map((p) => (p.ID === pattern.ID ? pattern : p))
        );
      } catch (error) {
        console.error('❌ Ошибка обновления паттерна:', error);
      }
    }
  };

  const handleDeletePattern = async (patternId: number): Promise<void> => {
    try {
      await deleteShiftPattern(patternId);
      setShiftPatterns((prev) => prev.filter((p) => p.ID !== patternId));
    } catch (error) {
      console.error('❌ Ошибка удаления паттерна:', error);
    }
  };

  // Assign shift patterns
  const handleAssignPattern = (
    assignments: { employeeId: string; shiftTypeId: number; date: string }[]
  ) => {
    assignments.forEach(({ employeeId, shiftTypeId, date }) => {
      const shiftType = shiftTypes.find((type) => type.ID === shiftTypeId);
      if (!shiftType) {
        console.warn(`❌ ShiftType с ID=${shiftTypeId} не найден.`);
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

  // Period generation
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

  // Employees management
  const handleAddEmployee = (employeeData: Employee) => {
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
    } catch (error) {
      console.error('❌ Ошибка при удалении сотрудника:', error);
    }
  };

  // ShiftType management
  const handleAddShiftType = async (
    shiftTypeData: Omit<ShiftTypeDefinition, 'ID'>
  ): Promise<void> => {
    try {
      const newId = await createShiftType(shiftTypeData);
      const newShiftType: ShiftTypeDefinition = {
        ...shiftTypeData,
        ID: newId,
      };
      setShiftTypes((prev) => [...prev, newShiftType]);
    } catch (error) {
      console.error('❌ Ошибка создания типа смены:', error);
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
      console.error('❌ Ошибка обновления типа смены:', error);
    }
  };

  const handleDeleteShiftType = async (ID: number): Promise<void> => {
    const isInUse = timeData.some((employee) =>
      Object.values(employee.shifts).flatMap((day) => day.shifts).some(
        (shift) => shift.ShiftTypeId === ID
      )
    );
    if (isInUse) {
      alert('Нельзя удалить тип смены, который уже используется');
      return;
    }
    try {
      await deleteShiftType(ID);
      setShiftTypes((prev) => prev.filter((type) => type.ID !== ID));
    } catch (error) {
      console.error('❌ Ошибка удаления типа смены:', error);
    }
  };

  // Shifts management
  const handleAddShift = async (
    employeeId: number,
    date: string,
    shiftData: Omit<Shift, 'ID'>
  ): Promise<void> => {
    try {
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
                [`day-${date}`]: {
                  ...employee.shifts[`day-${date}`] || { employeeId, date, shifts: [], operations: [], aggregatedMetrics: {} },
                  shifts: [...(employee.shifts[`day-${date}`]?.shifts || []), newShift],
                },
              },
            };
          }
          return employee;
        })
      );
      console.log('✅ Смена добавлена:', newShift);
    } catch (error) {
      console.error('❌ Ошибка при добавлении смены:', error);
    }
  };

  const handleUpdateShift = async (
    employeeId: number,
    date: string,
    shiftId: number,
    shiftData: Omit<Shift, 'ID' | 'EmployeeId' | 'Date'>
  ): Promise<void> => {
    try {
      await updateShift(shiftId, shiftData);
      const updatedShift = await getShiftById(shiftId);
      setTimeData((prevData) =>
        prevData.map((employee) =>
          employee.ID === employeeId
            ? {
                ...employee,
                shifts: {
                  ...employee.shifts,
                  [`day-${date}`]: {
                    ...employee.shifts[`day-${date}`],
                    shifts: employee.shifts[`day-${date}`].shifts.map((shift) =>
                      shift.ID === shiftId ? updatedShift : shift
                    ),
                  },
                },
              }
            : employee
        )
      );
      console.log('✅ Смена обновлена:', updatedShift);
    } catch (error) {
      console.error('❌ Ошибка при обновлении смены:', error);
    }
  };

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
                [`day-${date}`]: {
                  ...employee.shifts[`day-${date}`],
                  shifts: employee.shifts[`day-${date}`].shifts.filter((s) => s.ID !== shiftId),
                },
              },
            };
          }
          return employee;
        })
      );
      console.log('✅ Смена удалена:', shiftId);
    } catch (error) {
      console.error('❌ Ошибка при удалении смены:', error);
    }
  };

  const toggleBulkSelection = (employeeId: number, date: string, shiftId: number) => {
    setBulkSelectedShifts((prev) => {
      const exists = prev.some(
        (item) => item.employeeId === employeeId && item.date === date && item.shiftId === shiftId
      );
      if (exists) {
        return prev.filter(
          (item) => !(item.employeeId === employeeId && item.date === date && item.shiftId === shiftId)
        );
      } else {
        return [...prev, { employeeId, date, shiftId }];
      }
    });
  };

  const handleBulkEdit = () => {
    setBulkEditDialogOpen(true);
  };

  const handleBulkEditSave = (data: Omit<Shift, 'ID' | 'EmployeeId' | 'Date'>) => {
    bulkSelectedShifts.forEach((item) => {
      handleUpdateShift(item.employeeId, item.date, item.shiftId, data);
    });
    setBulkEditDialogOpen(false);
    setBulkSelectedShifts([]);
  };

  const handleBulkDelete = () => {
    bulkSelectedShifts.forEach((item) => {
      handleDeleteShift(item.employeeId, item.date, item.shiftId);
    });
    setBulkSelectedShifts([]);
  };

  // AgGrid: row data
  const rows = useMemo(() => {
    console.log('🔍 Формирование строк для AgGrid:', { timeDataLength: timeData.length });
    const filteredRows = timeData
      .filter((employee) => {
        if (!employeeFilter || !employeeFilter.value || employeeFilter.value.length === 0) {
          return true;
        }
        const field = employeeFilter.field;
        const fieldValue = (employee as any)[field];
        if (typeof fieldValue !== 'string') return false;
        return employeeFilter.value.some(
          (option: string) => fieldValue.toLowerCase() === option.toLowerCase()
        );
      })
      .filter((employee) => {
        if (!activeFilter) return true;
        const dayEntry = employee.shifts[`day-${activeFilter.date}`] || { shifts: [] };
        return dayEntry.shifts.some(
          (shift) => Number(shift.ShiftTypeId) === activeFilter.shiftTypeId
        );
      })
      .map((employee) => {
        const totalHours = days.reduce((sum: number, day: Date) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
          return sum + dayEntry.shifts.reduce((s: number, shift: Shift) => {
            if (shift.MarkedForDeletion) return s;
            const shiftType = shiftTypes.find(
              (t) => t.ID === Number(shift.ShiftTypeId)
            );
            return shiftType && !shiftType.CivilLawContract ? s + shift.Hours : s;
          }, 0);
        }, 0);

        const totalHoursCLW = days.reduce((sum: number, day: Date) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
          return sum + dayEntry.shifts.reduce((s: number, shift: Shift) => {
            if (shift.MarkedForDeletion) return s;
            const shiftType = shiftTypes.find(
              (t) => t.ID === Number(shift.ShiftTypeId)
            );
            return shiftType?.CivilLawContract ? s + shift.Hours : s;
          }, 0);
        }, 0);

        const holidayHours = days.reduce((sum: number, day: Date) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
          return sum + dayEntry.shifts.reduce((s: number, shift: Shift) => {
            if (shift.MarkedForDeletion) return s;
            return s + calculateHolidayHours(shift);
          }, 0);
        }, 0);

        const totalHoursToDelete = days.reduce((sum: number, day: Date) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
          return sum + dayEntry.shifts.reduce((s: number, shift: Shift) => {
            if (!shift.MarkedForDeletion) return s;
            const shiftType = shiftTypes.find(
              (t) => t.ID === Number(shift.ShiftTypeId)
            );
            return shiftType && !shiftType.CivilLawContract ? s + shift.Hours : s;
          }, 0);
        }, 0);

        const totalHoursCLWToDelete = days.reduce((sum: number, day: Date) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
          return sum + dayEntry.shifts.reduce((s: number, shift: Shift) => {
            if (!shift.MarkedForDeletion) return s;
            const shiftType = shiftTypes.find(
              (t) => t.ID === Number(shift.ShiftTypeId)
            );
            return shiftType?.CivilLawContract ? s + shift.Hours : s;
          }, 0);
        }, 0);

        const holidayHoursToDelete = days.reduce((sum: number, day: Date) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
          return sum + dayEntry.shifts.reduce((s: number, shift: Shift) => {
            if (!shift.MarkedForDeletion) return s;
            return s + calculateHolidayHours(shift);
          }, 0);
        }, 0);

        const normHours = days.reduce((sum: number, day: Date) => {
          const today = new Date();
          const endOfCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

          if (viewPeriod === 'year' && day > endOfCurrentMonth) return sum;

          let dayNorm = getDayNorm(day);
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayEntry = employee.shifts[`day-${dateStr}`] || { shifts: [] };
          const hasAffectingShift = dayEntry.shifts.some((shift) => {
            const shiftType = shiftTypes.find((type) => type.ID === Number(shift.ShiftTypeId));
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
          EmployeeID: employee.EmployeeId,
          Title: employee.Title,
          JobTitle: employee.JobTitle,
          Department: employee.Department,
          Office: employee.Office,
          workloadPeriods: employee.workloadPeriods,
          totalHours,
          totalHoursCLW,
          holidayHours,
          totalHoursToDelete,
          totalHoursCLWToDelete,
          holidayHoursToDelete,
          normHours,
          ShiftNumber: employee.ShiftNumber,
          ShiftTimeType: employee.ShiftTimeType,
        };

        days.forEach((day) => {
          const formattedDate = format(day, 'yyyy-MM-dd');
          row[`day-${formattedDate}`] = employee.shifts[`day-${formattedDate}`] || {
            employeeId: employee.ID,
            date: formattedDate,
            shifts: [],
            operations: [],
            aggregatedMetrics: {
              shipped_pallets_lt20: 0,
              shipped_pallets_gt20: 0,
              unloading: 0,
              moving_pallets: 0,
              transfer_thu: 0,
              LPR: 0,
              operationCount: 0,
            },
          };
          console.log(`🔍 Row для ${employee.Title}, день ${formattedDate}:`, row[`day-${formattedDate}`]);
        });

        return row;
      });

    if (employeeSort.order) {
      filteredRows.sort((a, b) => {
        let aVal = a[employeeSort.field] || '';
        let bVal = b[employeeSort.field] || '';
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return employeeSort.order === 'asc' ? -1 : 1;
        if (aVal > bVal) return employeeSort.order === 'asc' ? 1 : -1;
        return 0;
      });
    }
    console.log('✅ Строки для AgGrid сформированы:', filteredRows);
    return filteredRows;
  }, [timeData, employeeFilter, days, shiftTypes, activeFilter, employeeSort]);

  // AgGrid: column defs
  const fixedColumns: ColDef[] = useMemo(() => [
    {
      headerComponent: (params: any) => (
        <EmployeeHeaderWithFilter
          {...params}
          onFilterChange={setEmployeeFilter}
          onSortChange={setEmployeeSort}
          employees={timeData}
        />
      ),
      field: 'Title',
      filterValueGetter: (params) => params.data.Title,
      valueFormatter: (params) => {
        if (params.value && typeof params.value === 'object') {
          return JSON.stringify(params.value);
        }
        return params.value;
      },
      width: 210,
      pinned: 'left',
      cellRenderer: 'employeeCellRenderer',
      sortable: true,
      suppressMovable: true,
      floatingFilter: false,
    },
    {
      headerName: 'Часы ЛЕНТА',
      field: 'totalHours',
      width: 120,
      pinned: 'left',
      sortable: true,
      suppressMovable: true,
      filter: false,
      cellRenderer: (params: any) => {
        const { totalHours, totalHoursToDelete } = params.data;
        return (
          <div style={{ textAlign: 'center' }}>
            <span>
              {totalHours}ч{' '}
              {totalHoursToDelete > 0 && (
                <>
                  (<VisibilityOffIcon style={{ fontSize: 14, color: 'gray', marginRight: 2 }} />
                  {totalHoursToDelete}ч)
                </>
              )}
            </span>
          </div>
        );
      },
    },
    {
      headerName: 'Часы ГПХ',
      field: 'totalHoursCLW',
      width: 110,
      pinned: 'left',
      sortable: true,
      suppressMovable: true,
      filter: false,
      cellRenderer: (params: any) => {
        const { totalHoursCLW, totalHoursCLWToDelete } = params.data;
        return (
          <div style={{ textAlign: 'center' }}>
            <span>
              {totalHoursCLW}ч{' '}
              {totalHoursCLWToDelete > 0 && (
                <>
                  (<VisibilityOffIcon style={{ fontSize: 14, color: 'gray', marginRight: 2 }} />
                  {totalHoursCLWToDelete}ч)
                </>
              )}
            </span>
          </div>
        );
      },
    },
    {
      headerName: 'Праздничные часы',
      field: 'holidayHours',
      width: 120,
      pinned: 'left',
      sortable: true,
      filter: false,
      suppressMovable: true,
      headerClass: 'custom-header',
      cellRenderer: (params: any) => {
        const { holidayHours, holidayHoursToDelete } = params.data;
        return (
          <div style={{ textAlign: 'center' }}>
            <span>{holidayHours}ч</span>
            {holidayHoursToDelete > 0 && (
              <>
                (<VisibilityOffIcon style={{ fontSize: 14, color: 'gray', marginRight: 2 }} />
                {holidayHoursToDelete}ч)
              </>
            )}
          </div>
        );
      },
    },
    {
      headerName: 'Нормо часы',
      field: 'normHours',
      width: 110,
      pinned: 'left',
      sortable: true,
      filter: false,
      suppressMovable: true,
      headerClass: 'custom-header',
      cellStyle: { textAlign: 'center', fontWeight: 'bold' },
      valueFormatter: (params: ValueFormatterParams) => `${params.value}ч`,
    },
    {
      headerName: 'Переработки/Недоработки',
      field: 'overtimeUndertime',
      width: 125,
      pinned: 'left',
      sortable: true,
      filter: false,
      suppressMovable: true,
      headerClass: 'custom-header',
      cellStyle: (params: any): any => {
        const style: React.CSSProperties = { textAlign: 'center', fontWeight: 'bold' };
        if (params.value != null) {
          if (params.value < 0) {
            style.backgroundColor = '#FFDAB9';
          } else if (params.value > 0) {
            style.backgroundColor = 'lightcoral';
          }
        }
        return style;
      },
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
  ], [timeData]);

  const dynamicColumns: ColDef[] = useMemo(
    () =>
      days.map((day) => {
        const formattedDate = format(day, 'yyyy-MM-dd');
        const isHoliday = productionCalendar2025.some(
          (calDay: CalendarDay) =>
            calDay.Date === formattedDate && calDay.Type === 'п'
        );
        const isPrevHoliday = productionCalendar2025.some(
          (calDay: CalendarDay) =>
            calDay.Date === formattedDate && calDay.Type === 'пп'
        );

        const countsForDay: { [key: number]: number } = {};
        shiftTypes.forEach((st) => {
          countsForDay[st.ID] = 0;
        });
        timeData.forEach((employee) => {
          const dayEntry = employee.shifts[`day-${formattedDate}`] || { shifts: [] };
          dayEntry.shifts.forEach((shift) => {
            if (countsForDay[shift.ShiftTypeId] !== undefined) {
              countsForDay[shift.ShiftTypeId]++;
            }
          });
        });

        return {
          headerName: `${format(day, 'EEEEEE', { locale: ru })}\n${format(
            day,
            'd MMM',
            { locale: ru }
          )}`,
          field: `day-${formattedDate}`,
          width: 150,
          minWidth: 150,
          sortable: false,
          suppressMovable: true,
          cellRenderer: 'shiftCellRenderer',
          cellRendererParams: {
            shiftTypes,
            handleAddShift,
            handleUpdateShift,
            handleDeleteShift,
            bulkMode,
            bulkSelectedShifts,
            toggleBulkSelection,
          },
          headerComponent: () => {
            const isFilterActive = activeFilter?.date === formattedDate;
            return (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'stretch',
                  px: 0,
                  py: 1,
                  borderColor: 'divider',
                  backgroundColor: isHoliday ? 'rgba(255, 0, 0, 0.3)' : isPrevHoliday ? 'orange' : undefined,
                  height: '100%',
                }}
              >
                <Box
                  sx={{
                    flexBasis: '40%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    pl: 1,
                  }}
                >
                  <Typography variant='subtitle2'>
                    {format(day, 'EEEEEE', { locale: ru })}
                  </Typography>
                  <Typography variant='body2'>
                    {format(day, 'd MMM', { locale: ru })}
                  </Typography>
                  <Typography variant='caption'>
                    НРВ: {getDayNorm(day)}ч
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flexBasis: '60%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    overflowY: 'auto',
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
                          variant='text'
                          size='small'
                          sx={{
                            m: 0.25,
                            backgroundColor: type.BackgroundColor,
                            color: type.TextColor,
                            ...(isActive && { border: '2px solid blue' }),
                            fontSize: '0.7rem',
                            textTransform: 'none',
                          }}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            if (isActive) {
                              setActiveFilter(null);
                            } else {
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
    [days, shiftTypes, timeData, activeFilter, bulkMode, bulkSelectedShifts]
  );

  const allColumns: ColDef[] = useMemo(
    () => [...fixedColumns, ...dynamicColumns],
    [fixedColumns, dynamicColumns]
  );

  const gridOptions: GridOptions = useMemo(() => ({
    defaultColDef: {
      resizable: true,
      sortable: true,
      filter: true,
    },
    rowHeight: 80,
    headerHeight: 120,
    components: {
      employeeCellRenderer: (params: ICellRendererParams) => {
        const [dialogOpen, setDialogOpen] = useState(false);
        const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
        const employee = params.data as TimeSheetEntry;

        if (!employee) {
          console.error('❌ EmployeeCellRenderer: employee is undefined', params);
          return <Typography color='error'>Данные сотрудника отсутствуют</Typography>;
        }

        console.log('📋 EmployeeCellRenderer: employee=', employee);

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
              paddingLeft: '30px',
              '&:hover .settingsButton': { opacity: 1 },
            }}
          >
            <Button
              className='settingsButton'
              onClick={handleMenuOpen}
              variant='text'
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
            <Box>
              <Typography variant='subtitle1'>{employee.Title}</Typography>
              <Typography variant='body2' color='text.secondary'>
                {employee.JobTitle}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Смена: {employee.ShiftNumber} {employee.ShiftTimeType}
              </Typography>
            </Box>
            <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
              <MenuItem
                onClick={(e) => {
                  e.preventDefault();
                  setDialogOpen(true);
                  handleMenuClose();
                }}
                sx={{ color: '#267db1' }}
              >
                <EditIcon fontSize='small' sx={{ mr: 1 }} />
                Изменить
              </MenuItem>
              <MenuItem
                onClick={() => {
                  params.context.handleDeleteEmployee(employee.ID);
                  handleMenuClose();
                }}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon fontSize='small' sx={{ mr: 1 }} />
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
      handleAddEmployee,
      handleUpdateEmployee,
      handleDeleteEmployee,
      handleAddShift,
      handleUpdateShift,
      handleDeleteShift,
      bulkMode,
      bulkSelectedShifts,
      toggleBulkSelection,
    },
    suppressDragLeaveHidesColumns: true,
  }), [handleAddEmployee, handleUpdateEmployee, handleDeleteEmployee, handleAddShift, handleUpdateShift, handleDeleteShift, bulkMode, bulkSelectedShifts]);

  useEffect(() => {
    if (gridRef.current?.api) {
      gridRef.current.api.refreshCells({ force: true });
    }
  }, [shiftTypes]);

  useEffect(() => {
    setActiveFilter(null);
  }, [viewPeriod, currentDate]);

  const toggleBulkMode = () => {
    setBulkMode(!bulkMode);
    if (bulkMode) setBulkSelectedShifts([]);
  };

  // Render
  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton onClick={toggleSideMenu} sx={{ p: 0 }}>
              <MenuIcon />
            </IconButton>
            <QueryBuilderIcon style={{ height: 24, width: 24 }} />
            <Typography variant='h6'>График работы</Typography>
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant='outlined'
                onClick={toggleBulkMode}
                startIcon={bulkMode ? <LibraryAddCheckIcon /> : <LibraryAddCheckOutlinedIcon />}
              >
                Массовое измение
              </Button>
              {bulkMode && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button variant='outlined' onClick={handleBulkEdit} startIcon={<EditIcon />} />
                  <Button variant='outlined' onClick={handleBulkDelete} startIcon={<DeleteIcon />} />
                </Box>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControl size='small' sx={{ minWidth: 180 }}>
                <InputLabel id='view-period-label'>Период</InputLabel>
                <Select
                  labelId='view-period-label'
                  value={viewPeriod}
                  label='Период'
                  onChange={(e) => setViewPeriod(e.target.value as ViewPeriod)}
                >
                  <MenuItem value='week'>Неделя</MenuItem>
                  <MenuItem value='month'>Месяц</MenuItem>
                  <MenuItem value='year'>Год</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button variant='outlined' onClick={handlePrevPeriod}>
                  <ArrowBackIosIcon style={{ height: 24, width: 24 }} />
                </Button>
                <Typography variant='subtitle1' sx={{ px: 1, fontWeight: 'medium' }}>
                  {formatPeriodLabel()}
                </Typography>
                <Button variant='outlined' onClick={handleNextPeriod}>
                  <ArrowForwardIosIcon style={{ height: 24, width: 24 }} />
                </Button>
              </Box>
            </Box>
          </Box>
        }
      />
      <Drawer anchor='left' open={sideMenuOpen} onClose={() => setSideMenuOpen(false)}>
        <Box sx={{
          width: 250,
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1
        }}>
          <Button
            fullWidth
            variant='outlined'
            startIcon={<AddIcon style={{ height: 16, width: 16 }} />}
            onClick={() => {
              setIsCreatePatternDialogOpen(true);
              setSideMenuOpen(false);
            }}
          >
            Создать чередование
          </Button>
          <Button
            fullWidth
            variant='outlined'
            startIcon={<EventAvailableIcon style={{ height: 16, width: 16 }} />}
            onClick={() => {
              setIsAssignDialogOpen(true);
              setSideMenuOpen(false);
            }}
          >
            Применить чередование
          </Button>
          <ShiftTypeDialog
            shiftTypes={shiftTypes}
            onSave={handleAddShiftType}
            onUpdate={handleUpdateShiftType}
            onDelete={handleDeleteShiftType}
            trigger={
              <Button
                fullWidth
                variant='outlined'
                startIcon={<SettingsIcon style={{ height: 16, width: 16 }} />}
                sx={{ mt: 0 }}
              >
                Управление типами смен
              </Button>
            }
          />
        </Box>
      </Drawer>
      <CardContent>
        <Box sx={{ width: '100%', height: '85vh', overflow: 'auto' }}>
          <AgGridReact
            ref={gridRef}
            rowData={rows}
            columnDefs={allColumns}
            gridOptions={gridOptions}
            suppressRowClickSelection
            rowSelection='single'
            animateRows
            modules={[ClientSideRowModelModule]}
          />
        </Box>
      </CardContent>
      <Dialog
        open={isCreatePatternDialogOpen}
        onClose={() => setIsCreatePatternDialogOpen(false)}
        fullWidth
        maxWidth='md'
      >
        <DialogTitle>Управление чередованиями</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Создавайте и изменяйте правила чередования
          </DialogContentText>
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
        maxWidth='md'
      >
        <DialogTitle>Применение чередования</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Примените правила чередования для быстрого назначения смен
          </DialogContentText>
          <AssignShiftPatternForm
            employees={timeData.map((employee) => ({
              id: String(employee.ID),
              name: employee.Title,
            }))}
            shiftPatterns={shiftPatterns}
            shiftTypes={shiftTypes}
            onAssign={handleAssignPattern}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAssignDialogOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
      <ShiftDialog
        shift={null}
        employeeId={bulkSelectedShifts.length > 0 ? bulkSelectedShifts[0].employeeId.toString() : ''}
        date={bulkSelectedShifts.length > 0 ? bulkSelectedShifts[0].date : ''}
        shiftTypes={shiftTypes}
        open={bulkEditDialogOpen}
        onOpenChange={setBulkEditDialogOpen}
        onSave={handleBulkEditSave}
      />
    </Card>
  );
}

