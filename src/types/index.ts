//index.ts
export interface WorkloadPeriod {
  id: string;
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  fraction: number;   // Доля занятости, от 0 до 1 (например, 0.5 = 50%)
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  office: string;

  // Новый массив периодов долей занятости
  workloadPeriods: WorkloadPeriod[];
}
export interface ShiftPattern {
  id: string;
  name: string;
  pattern: boolean[];
}


export interface ShiftTypeDefinition {
  id: string;
  name: string;
  backgroundColor: string;
  textColor: string;
  affectsWorkingNorm: boolean; // Указывает, влияет ли тип смены на рабочую норму
  requiredStartEndTime: boolean; // Новое свойство, указывает, обязательны ли начало/окончание смены и перерыв
  description?: string;
  defaultStartTime: string; // Начало смены по умолчанию
  defaultEndTime: string; // Окончание смены по умолчанию
  defaultBreakStart: string; // Начало перерыва по умолчанию
  defaultBreakEnd: string; // Окончание перерыва по умолчанию
}

export interface Shift {
  id: string;
  employeeId: string; // ID сотрудника
  date: string; // Дата смены
  shiftTypeId: string; // ID типа смены
  startTime: string; // Время начала смены
  endTime: string; // Время окончания смены
  breakStart: string; // Время начала перерыва
  breakEnd: string; // Время окончания перерыва
  hours: number; // Количество рабочих часов
  isNightShift: boolean; // Указывает, является ли смена ночной
}

export interface TimeEntry {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakDuration: number; // Длительность перерыва
  totalHours: number; // Общее количество часов
  status: 'pending' | 'approved' | 'rejected'; // Статус записи
  notes?: string; // Дополнительные заметки
}

export interface CalendarDay {
  date: string; // Дата
  type: 'п' | 'в' | 'пп'; // Тип дня: праздничный, выходной, предпраздничный
  description: string; // Описание
}

// ../types/index.ts

export interface ShiftRotation {
  id: string; // Уникальный идентификатор
  name: string; // Название чередования
  pattern: { shiftTypeId: string; isSelected: boolean }[]; // Паттерн чередования
}



export const productionCalendar2025: CalendarDay[] = [
  { date: '2025-01-01', type: 'п', description: 'Праздничный' },
  { date: '2025-01-02', type: 'п', description: 'Праздничный' },
  { date: '2025-01-03', type: 'п', description: 'Праздничный' },
  { date: '2025-01-04', type: 'п', description: 'Праздничный' },
  { date: '2025-01-05', type: 'п', description: 'Праздничный' },
  { date: '2025-01-06', type: 'п', description: 'Праздничный' },
  { date: '2025-01-07', type: 'п', description: 'Праздничный' },
  { date: '2025-01-08', type: 'п', description: 'Праздничный' },
  { date: '2025-02-23', type: 'п', description: 'Праздничный' },
  { date: '2025-03-08', type: 'п', description: 'Праздничный' },
  { date: '2025-05-01', type: 'п', description: 'Праздничный' },
  { date: '2025-05-09', type: 'п', description: 'Праздничный' },
  { date: '2025-06-12', type: 'п', description: 'Праздничный' },
  { date: '2025-11-04', type: 'п', description: 'Праздничный' },
  { date: '2025-05-02', type: 'в', description: 'Выходной' },
  { date: '2025-12-31', type: 'в', description: 'Выходной' },
  { date: '2025-05-08', type: 'в', description: 'Выходной' },
  { date: '2025-06-13', type: 'в', description: 'Выходной' },
  { date: '2025-11-03', type: 'в', description: 'Выходной' },
  { date: '2025-03-07', type: 'пп', description: 'Предпраздничный' },
  { date: '2025-04-30', type: 'пп', description: 'Предпраздничный' },
  { date: '2025-06-11', type: 'пп', description: 'Предпраздничный' },
  { date: '2025-11-01', type: 'пп', description: 'Предпраздничный' },
];
