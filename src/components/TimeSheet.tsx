'use client';

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
import { Employee, productionCalendar2025, Shift, ShiftTypeDefinition, ShiftPattern } from '../types';
import { getDayNorm, calculateHolidayHours, calculateShiftHours } from '../lib/utils';
import ShiftPatternForm from './ShiftPatternForm';
import AssignShiftPatternForm from './AssignShiftPatternForm';
import { ShiftCellRenderer } from './ShiftCellRenderer';
import { EmployeeDialog } from './EmployeeDialog';
import { ShiftTypeDialog } from './ShiftTypeDialog';

type ViewPeriod = 'week' | 'month' | 'year';

interface TimeSheetEntry extends Employee {
  shifts: { [key: string]: Shift[] };
}

interface FilterState {
  date: string;
  shiftTypeId: string;
}

export default function TimeSheet() {
  const [activeFilter, setActiveFilter] = useState<FilterState | null>(null);
  const gridRef = useRef<AgGridReact>(null);

  const [shiftPatterns, setShiftPatterns] = useState<ShiftPattern[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isCreatePatternDialogOpen, setIsCreatePatternDialogOpen] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewPeriod, setViewPeriod] = useState<ViewPeriod>('week');

  const [shiftTypes, setShiftTypes] = useState<ShiftTypeDefinition[]>([
    {
      id: '1',
      name: 'день',
      backgroundColor: 'gray',
      textColor: 'white',
      affectsWorkingNorm: false,
      requiredStartEndTime: true,
      description: 'д',
      defaultStartTime: '08:00',
      defaultEndTime: '20:00',
      defaultBreakStart: '12:00',
      defaultBreakEnd: '13:00',
    },
    {
      id: '2',
      name: 'ночь',
      backgroundColor: 'black',
      textColor: 'white',
      affectsWorkingNorm: false,
      requiredStartEndTime: true,
      description: 'н',
      defaultStartTime: '20:00',
      defaultEndTime: '08:00',
      defaultBreakStart: '21:00',
      defaultBreakEnd: '22:00',
    },
    {
      id: '3',
      name: 'ГПХ',
      backgroundColor: 'yellow',
      textColor: 'black',
      affectsWorkingNorm: false,
      requiredStartEndTime: true,
      description: 'аф',
      defaultStartTime: '00:00',
      defaultEndTime: '00:00',
      defaultBreakStart: '00:00',
      defaultBreakEnd: '00:00',
    },
  ]);

  const [timeData, setTimeData] = useState<TimeSheetEntry[]>([
    {
      id: '1',
      name: 'John Doe',
      position: 'Software Engineer',
      department: 'Engineering',
      email: 'john@example.com',
      shifts: {},
      workloadPeriods: [],
    },
  ]);

  // Handlers for shift pattern management
  const handleSavePattern = (pattern: ShiftPattern) => {
    setShiftPatterns((prev) => {
      const existingIndex = prev.findIndex((p) => p.id === pattern.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = pattern;
        return updated;
      }
      return [...prev, pattern];
    });
  };

  const handleDeletePattern = (id: string) => {
    setShiftPatterns((prev) => prev.filter((p) => p.id !== id));
  };

  // Handler for assigning shift patterns
  const handleAssignPattern = (assignments: { employeeId: string; shiftTypeId: string; date: string }[]) => {
    assignments.forEach(({ employeeId, shiftTypeId, date }) => {
      const shiftType = shiftTypes.find((type) => type.id === shiftTypeId);
      if (!shiftType) {
        console.warn(`ShiftType с id ${shiftTypeId} не найден.`);
        return;
      }
      const hours = calculateShiftHours(
        shiftType.defaultStartTime,
        shiftType.defaultEndTime,
        shiftType.defaultBreakStart,
        shiftType.defaultBreakEnd
      );
      handleAddShift(employeeId, date, {
        shiftTypeId,
        date,
        employeeId,
        startTime: shiftType.defaultStartTime,
        endTime: shiftType.defaultEndTime,
        breakStart: shiftType.defaultBreakStart,
        breakEnd: shiftType.defaultBreakEnd,
        hours: hours,
        isNightShift: shiftType.name.toLowerCase().includes('night') || false,
      });
    });
  };

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

  const handleAddEmployee = (employeeData: Omit<Employee, 'id'>) => {
    const newEmployee: TimeSheetEntry = {
      ...employeeData,
      id: Math.random().toString(36).substr(2, 9),
      shifts: {},
      workloadPeriods: employeeData.workloadPeriods || [],
    };
    setTimeData((prev) => [...prev, newEmployee]);
  };

  const handleUpdateEmployee = (id: string, employeeData: Omit<Employee, 'id'>) => {
    setTimeData((prev) =>
      prev.map((emp) => {
        if (emp.id === id) {
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

  const handleDeleteEmployee = (id: string) => {
    setTimeData((prev) => prev.filter((emp) => emp.id !== id));
  };

  const handleAddShiftType = (shiftTypeData: Omit<ShiftTypeDefinition, 'id'>) => {
    const newShiftType: ShiftTypeDefinition = {
      ...shiftTypeData,
      id: Math.random().toString(36).substr(2, 9),
    };
    setShiftTypes((prev) => [...prev, newShiftType]);
  };

  const handleUpdateShiftType = (id: string, shiftTypeData: Omit<ShiftTypeDefinition, 'id'>) => {
    setShiftTypes((prev) =>
      prev.map((type) => (type.id === id ? { ...shiftTypeData, id } : type))
    );
  };

  const handleDeleteShiftType = (id: string) => {
    const isInUse = timeData.some((employee) =>
      Object.values(employee.shifts).flat().some((shift) => shift.shiftTypeId === id)
    );
    if (isInUse) {
      alert('Нельзя удалить тип смены, который используется');
      return;
    }
    setShiftTypes((prev) => prev.filter((type) => type.id !== id));
  };

  const handleAddShift = (
    employeeId: string,
    date: string,
    shiftData: Omit<Shift, 'id'>
  ) => {
    const newShift: Shift = {
      ...shiftData,
      id: Math.random().toString(36).substr(2, 9),
    };
    setTimeData((prevData) =>
      prevData.map((employee) => {
        if (employee.id === employeeId) {
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

  const handleUpdateShift = (
    employeeId: string,
    date: string,
    shiftId: string,
    shiftData: Omit<Shift, 'id'>
  ) => {
    setTimeData((prevData) =>
      prevData.map((employee) => {
        if (employee.id === employeeId) {
          return {
            ...employee,
            shifts: {
              ...employee.shifts,
              [date]: employee.shifts[date].map((shift) =>
                shift.id === shiftId ? { ...shiftData, id: shiftId } : shift
              ),
            },
          };
        }
        return employee;
      })
    );
  };

  const handleDeleteShift = (employeeId: string, date: string, shiftId: string) => {
    setTimeData((prevData) =>
      prevData.map((employee) => {
        if (employee.id === employeeId) {
          return {
            ...employee,
            shifts: {
              ...employee.shifts,
              [date]: employee.shifts[date].filter((s) => s.id !== shiftId),
            },
          };
        }
        return employee;
      })
    );
  };

  const rows = useMemo(() => {
    return timeData
      .filter((employee) => {
        if (!activeFilter) return true;
        const shifts = employee.shifts[activeFilter.date] || [];
        return shifts.some((shift) => shift.shiftTypeId === activeFilter.shiftTypeId);
      })
      .map((employee) => {
        const row: any = {
          id: employee.id,
          employeeId: employee.id,
          name: employee.name,
          position: employee.position,
          department: employee.department,
          email: employee.email,
          workloadPeriods: employee.workloadPeriods,
          totalHours: days.reduce((sum: number, day: Date) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const shifts = employee.shifts[dateStr] || [];
            return sum + shifts.reduce((shiftSum: number, shift: Shift) => shiftSum + shift.hours, 0);
          }, 0),
          holidayHours: days.reduce((sum: number, day: Date) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const shifts = employee.shifts[dateStr] || [];
            return sum + shifts.reduce((shiftSum: number, shift: Shift) => shiftSum + calculateHolidayHours(shift), 0);
          }, 0),
          normHours: days.reduce((sum: number, day: Date) => {
            let dayNorm = getDayNorm(day);
            const dateStr = format(day, 'yyyy-MM-dd');
            const shifts = employee.shifts[dateStr] || [];
            const hasAffectingShift = shifts.some((shift) => {
              const shiftType = shiftTypes.find((type) => type.id === shift.shiftTypeId);
              return shiftType?.affectsWorkingNorm;
            });
            if (hasAffectingShift) return sum;
            let fraction = 1;
            const workloadPeriods = employee.workloadPeriods ?? [];
            if (workloadPeriods.length > 0) {
              for (const period of workloadPeriods) {
                if (
                  (!period.startDate || period.startDate <= dateStr) &&
                  (!period.endDate || period.endDate >= dateStr)
                ) {
                  fraction = period.fraction;
                }
              }
            }
            dayNorm *= fraction;
            return sum + dayNorm;
          }, 0),
        };

        days.forEach((day) => {
          const formattedDate = format(day, 'yyyy-MM-dd');
          const shifts = employee.shifts[formattedDate] || [];
          row[`day-${formattedDate}`] = {
            employeeId: employee.id,
            date: formattedDate,
            shifts,
          };
        });

        return row;
      });
  }, [timeData, days, shiftTypes, activeFilter]);

  const fixedColumns: ColDef[] = useMemo(() => [
    {
      headerName: 'Сотрудник',
      field: 'name',
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

  const dynamicColumns: ColDef[] = useMemo(() => days.map((day) => {
    const formattedDate = format(day, 'yyyy-MM-dd');
    const isHoliday = productionCalendar2025.some(
      (d) => d.date === formattedDate && d.type === 'п'
    );
    const isPrevHoliday = productionCalendar2025.some(
      (d) => d.date === formattedDate && d.type === 'пп'
    );
    const countsForDay: { [key: string]: number } = shiftTypes.reduce((acc, type) => {
      acc[type.id] = 0;
      return acc;
    }, {} as { [key: string]: number });
    timeData.forEach((employee) => {
      const shifts = employee.shifts[formattedDate] || [];
      shifts.forEach((shift) => {
        if (countsForDay[shift.shiftTypeId] !== undefined) {
          countsForDay[shift.shiftTypeId] += 1;
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
                .filter((type) => countsForDay[type.id] > 0)
                .map((type) => {
                  const isActive = isFilterActive && activeFilter?.shiftTypeId === type.id;
                  return (
                    <Button
                      key={type.id}
                      variant="text"
                      size="small"
                      sx={{
                        m: 0.5,
                        backgroundColor: type.backgroundColor,
                        color: type.textColor,
                        ...(isActive && { border: '2px solid blue' }),
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (activeFilter?.shiftTypeId === type.id && activeFilter?.date === formattedDate) {
                          setActiveFilter(null);
                        } else {
                          setActiveFilter({
                            date: formattedDate,
                            shiftTypeId: type.id,
                          });
                        }
                      }}
                    >
                      {type.name}: {countsForDay[type.id]}
                    </Button>
                  );
                })}
            </Box>
          </Box>
        );
      },
    };
  }), [days, shiftTypes, timeData, activeFilter]);

  const allColumns: ColDef[] = useMemo(() => [...fixedColumns, ...dynamicColumns], [fixedColumns, dynamicColumns]);

  const gridOptions: GridOptions = useMemo(() => ({
    defaultColDef: {
      resizable: true,
      sortable: false,
      filter: false,
    },
    rowHeight: 80,
    headerHeight: 100,
    components: {
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
                <Typography variant="subtitle1">{employee.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {employee.position}
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
                      params.context.handleDeleteEmployee(employee.id);
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
              onSave={(data) => params.context.handleUpdateEmployee(employee.id, data)}
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

  useEffect(() => {
    setActiveFilter(null);
  }, [viewPeriod, currentDate]);

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const handleTopMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(e.currentTarget);
  };
  const handleTopMenuClose = () => {
    setMenuAnchorEl(null);
  };

  return (
    <Card >
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
          <AssignShiftPatternForm
            employees={timeData.map((employee) => ({ id: employee.id, name: employee.name }))}
            shiftPatterns={shiftPatterns}
            shiftTypes={shiftTypes}
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
