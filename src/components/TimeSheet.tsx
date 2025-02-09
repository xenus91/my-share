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
import {
  Clock,
  Plus,
  Settings,
  Trash2,
  Pencil,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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

  // Типы смен (ID — число)
  const [shiftTypes, setShiftTypes] = useState<ShiftTypeDefinition[]>([
    {
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
    },
  ]);

  // Список сотрудников. ID — число
  const [timeData, setTimeData] = useState<TimeSheetEntry[]>([
   
  ]);

  // ===========================
  // Shift Pattern management
  // ===========================
  const handleSavePattern = (pattern: ShiftPattern) => {
    setShiftPatterns((prev) => {
      const existingIndex = prev.findIndex((p) => p.ID === pattern.ID);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = pattern;
        return updated;
      }
      return [...prev, pattern];
    });
  };

  const handleDeletePattern = (patternId: number) => {
    setShiftPatterns((prev) => prev.filter((p) => p.ID !== patternId));
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
        shiftType.DefaultBreakEnd
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

  const handleDeleteEmployee = (ID: number) => {
    setTimeData((prev) => prev.filter((emp) => emp.ID !== ID));
  };

  // ===========================
  // ShiftType management
  // ===========================
  const handleAddShiftType = (shiftTypeData: Omit<ShiftTypeDefinition, 'ID'>) => {
    const newShiftType: ShiftTypeDefinition = {
      ...shiftTypeData,
      ID: Math.floor(Math.random() * 1000000) + 1,
    };
    setShiftTypes((prev) => [...prev, newShiftType]);
  };

  const handleUpdateShiftType = (ID: number, shiftTypeData: Omit<ShiftTypeDefinition, 'ID'>) => {
    setShiftTypes((prev) =>
      prev.map((type) => (type.ID === ID ? { ...shiftTypeData, ID } : type))
    );
  };

  const handleDeleteShiftType = (ID: number) => {
    // Проверяем, используется ли тип смены
    const isInUse = timeData.some((employee) =>
      Object.values(employee.shifts).flat().some((shift) => shift.ShiftTypeId === ID)
    );
    if (isInUse) {
      alert('Нельзя удалить тип смены, который уже используется');
      return;
    }
    setShiftTypes((prev) => prev.filter((type) => type.ID !== ID));
  };

  // ===========================
  // Shifts management
  // ===========================
  // Добавить смену
  const handleAddShift = (
    employeeId: number,
    date: string,
    shiftData: Omit<Shift, 'ID'>
  ) => {
    const newShift: Shift = {
      ...shiftData,
      ID: Math.floor(Math.random() * 1000000) + 1, // Генерируем числовой ID
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
  };

  // Обновить смену
  const handleUpdateShift = (
    employeeId: number,
    date: string,
    shiftId: number,
    shiftData: Omit<Shift, 'ID'>
  ) => {
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
  };

  // Удалить смену
  const handleDeleteShift = (employeeId: number, date: string, shiftId: number) => {
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
  };

  // ===========================
  // AgGrid: row data
  // ===========================
  const rows = useMemo(() => {
    return timeData
      .filter((employee) => {
        if (!activeFilter) return true;
        const shifts = employee.shifts[activeFilter.date] || [];
        // Смотрим ShiftTypeId
        return shifts.some((shift) => shift.ShiftTypeId === activeFilter.shiftTypeId);
      })
      .map((employee) => {
        const row: any = {
          ID: employee.ID,
          employeeId: employee.ID,
          Title: employee.Title,
          JobTitle: employee.JobTitle,
          Department: employee.Department,
          Office: employee.Office,
          workloadPeriods: employee.workloadPeriods,
          totalHours: days.reduce((sum: number, day: Date) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const shifts = employee.shifts[dateStr] || [];
            // 'Hours' соответствует интерфейсу Shift
            return sum + shifts.reduce((shiftSum: number, shift: Shift) => shiftSum + shift.Hours, 0);
          }, 0),
          holidayHours: days.reduce((sum: number, day: Date) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const shifts = employee.shifts[dateStr] || [];
            return sum + shifts.reduce((shiftSum: number, shift: Shift) => {
              return shiftSum + calculateHolidayHours(shift);
            }, 0);
          }, 0),
          normHours: days.reduce((sum: number, day: Date) => {
            let dayNorm = getDayNorm(day);
            const dateStr = format(day, 'yyyy-MM-dd');
            const shifts = employee.shifts[dateStr] || [];
            const hasAffectingShift = shifts.some((shift) => {
              const shiftType = shiftTypes.find((type) => type.ID === shift.ShiftTypeId);
              // 'AffectsWorkingNorm' в интерфейсе ShiftTypeDefinition
              return shiftType?.AffectsWorkingNorm;
            });
            if (hasAffectingShift) return sum;
            let fraction = 1;
            const workloadPeriods = employee.workloadPeriods ?? [];
            // Проверяем, попадает ли дата в период
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
          }, 0),
        };

        // Динамические поля для каждого дня
        days.forEach((day) => {
          const formattedDate = format(day, 'yyyy-MM-dd');
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
      headerName: 'Всего часов',
      field: 'totalHours',
      width: 120,
      pinned: 'left',
      sortable: false,
      suppressMovable: true,
      cellStyle: { textAlign: 'right', fontWeight: 'bold' },
      valueFormatter: (params: ValueFormatterParams) => `${params.value}ч`,
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

  const dynamicColumns: ColDef[] = useMemo(() => 
    days.map((day) => {
      const formattedDate = format(day, 'yyyy-MM-dd');
      const isHoliday = productionCalendar2025.some(
        (calDay: CalendarDay) => calDay.Date === formattedDate && calDay.Type === 'п'
      );
      const isPrevHoliday = productionCalendar2025.some(
        (calDay: CalendarDay) => calDay.Date === formattedDate && calDay.Type === 'пп'
      );

      // Подсчитываем, сколько смен каждого типа в этот день по всем сотрудникам
      const countsForDay: { [key: number]: number } = {};
      shiftTypes.forEach((st) => { countsForDay[st.ID] = 0; });

      timeData.forEach((employee) => {
        const shifts = employee.shifts[formattedDate] || [];
        shifts.forEach((shift) => {
          if (countsForDay[shift.ShiftTypeId] !== undefined) {
            countsForDay[shift.ShiftTypeId]++;
          }
        });
      });

      return {
        headerName: `${format(day, 'EEEEEE', { locale: ru })}\n${format(day, 'd MMM', { locale: ru })}`,
        field: `day-${formattedDate}`,
        width: 150,
        minWidth: 150,
        sortable: false,
        cellRenderer: 'shiftCellRenderer',
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
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                px: 1,
                py: 1.5,
                borderRight: 1,
                borderColor: 'divider',
                backgroundColor: isHoliday
                  ? 'red'
                  : isPrevHoliday
                  ? 'orange'
                  : 'grey.100',
                height: 'auto',
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="subtitle2">{format(day, 'EEEEEE', { locale: ru })}</Typography>
                <Typography variant="body2">{format(day, 'd MMM', { locale: ru })}</Typography>
                <Typography variant="caption">Норма: {getDayNorm(day)}ч</Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', mt: 1 }}>
                {shiftTypes
                  .filter((type) => countsForDay[type.ID] > 0)
                  .map((type) => {
                    const isActive = isFilterActive && activeFilter?.shiftTypeId === type.ID;
                    return (
                      <Button
                        key={type.ID}
                        variant="text"
                        size="small"
                        sx={{
                          m: 0.5,
                          backgroundColor: type.BackgroundColor,
                          color: type.TextColor,
                          ...(isActive && { border: '2px solid blue' }),
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          if (isActive) {
                            // Сбросить фильтр
                            setActiveFilter(null);
                          } else {
                            // Установить фильтр
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
    })
  , [days, shiftTypes, timeData, activeFilter]);

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
    headerHeight: 100,
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1">{employee.Title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {employee.JobTitle}
                </Typography>
              </Box>
              <Box>
                <Button
                  onClick={handleMenuOpen}
                  variant="text"
                  sx={{ minWidth: 'auto' }}
                >
                  <Settings style={{ height: 16, width: 16 }} />
                </Button>
                <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
                  <MenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      setDialogOpen(true);
                      handleMenuClose();
                    }}
                  >
                    <Pencil style={{ marginRight: 8, height: 16, width: 16 }} />
                    Изменить
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      params.context.handleDeleteEmployee(employee.ID);
                      handleMenuClose();
                    }}
                  >
                    <Trash2 style={{ marginRight: 8, height: 16, width: 16 }} />
                    Удалить
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
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
            <Clock style={{ height: 24, width: 24 }} />
            <Typography variant="h6">График работы</Typography>
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <EmployeeDialog
              onSave={handleAddEmployee}
              trigger={
                <Button variant="outlined" startIcon={<UserPlus style={{ height: 16, width: 16 }} />}>
                  Добавить сотрудника
                </Button>
              }
            />
            <Button
              variant="outlined"
              startIcon={<Settings style={{ height: 16, width: 16 }} />}
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
                <Plus style={{ height: 16, width: 16, marginRight: 4 }} />
                Создать чередование
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setIsAssignDialogOpen(true);
                  handleTopMenuClose();
                }}
              >
                <Settings style={{ height: 16, width: 16, marginRight: 4 }} />
                Применить чередование
              </MenuItem>
            </Menu>
            <ShiftTypeDialog
              shiftTypes={shiftTypes}
              onSave={handleAddShiftType}
              onUpdate={handleUpdateShiftType}
              onDelete={handleDeleteShiftType}
              trigger={
                <Button variant="outlined" startIcon={<Settings style={{ height: 16, width: 16 }} />}>
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
                  <ChevronLeft style={{ height: 16, width: 16 }} />
                </Button>
                <Typography variant="subtitle1" sx={{ px: 1, fontWeight: 'medium' }}>
                  {formatPeriodLabel()}
                </Typography>
                <Button variant="outlined" onClick={handleNextPeriod}>
                  <ChevronRight style={{ height: 16, width: 16 }} />
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
