// types/index.ts

// Элемент списка для периодов занятости (обычно хранится в отдельном списке, связанном по Lookup)
export interface WorkloadPeriod {
  ID: number;           // уникальный числовой идентификатор из SharePoint
  StartDate: string;    // формат YYYY-MM-DD
  EndDate: string;      // формат YYYY-MM-DD
  Fraction: number;     // от 0 до 1 (например, 0.5 = 50%)
  EmployeeId: number;  // ✅ Добавляем это поле!
}

// Элемент списка "Employees"
export interface Employee {
  ID: number;           // уникальный числовой идентификатор из SharePoint
  Title: string;        // имя сотрудника (используем стандартное поле Title)
  JobTitle: string;     // должность сотрудника
  Department: string;
  Office: string;
  workloadPeriods: WorkloadPeriod[];  // связанные периоды занятости (можно заполнять через расширенный запрос)
}

// Интерфейс для правил чередования смен
export interface ShiftPattern {
  ID: number;           // уникальный идентификатор (GUID)
  Name: string;
  Pattern: boolean[];   // массив, определяющий паттерн чередования
}

// Интерфейс для типа смены
export interface ShiftTypeDefinition {
  ID: number;                   // уникальный числовой идентификатор из SharePoint
  Name: string;
  BackgroundColor: string;
  TextColor: string;
  AffectsWorkingNorm: boolean;  // влияет ли тип смены на рабочую норму
  RequiredStartEndTime: boolean;// обязательны ли время начала/окончания смены и перерыв
  CivilLawContract: boolean;    //Является ли смена выполненной по договору ГПХ
  Description?: string;
  DefaultStartTime: string;     // время начала смены по умолчанию
  DefaultEndTime: string;       // время окончания смены по умолчанию
  DefaultBreakStart: string;    // время начала перерыва по умолчанию
  DefaultBreakEnd: string;      // время окончания перерыва по умолчанию
}

// Интерфейс для смены
export interface Shift {
  ID: number;              // уникальный числовой идентификатор смены из SharePoint
  EmployeeId: number;      // ссылка (Lookup) на сотрудника (Employee.ID)
  Date: string;            // дата смены (YYYY-MM-DD)
  ShiftTypeId: number;     // ссылка (Lookup) на тип смены (ShiftTypeDefinition.ID)
  StartTime: string;       // время начала смены
  EndTime: string;         // время окончания смены
  BreakStart: string;      // время начала перерыва
  BreakEnd: string;        // время окончания перерыва
  Hours: number;           // количество рабочих часов
  IsNightShift: boolean;   // является ли смена ночной
  ChangeAuthor?: string;  // новое поле для имени автора изменений
}

// Интерфейс для записи времени (если используется отдельный список)
export interface TimeEntry {
  ID: number;
  EmployeeId: number;
  Date: string;
  StartTime: string;
  EndTime: string;
  BreakDuration: number;
  TotalHours: number;
  Status: 'pending' | 'approved' | 'rejected';
  Notes?: string;
}

// Интерфейс для календарного дня (например, для производственного календаря)
export interface CalendarDay {
  Date: string;
  Type: 'п' | 'в' | 'пп';  // 'п' – праздничный, 'в' – выходной, 'пп' – предпраздничный
  Description: string;
}

// Интерфейс для чередования смен (если используется отдельный список)
export interface ShiftRotation {
  ID: string;
  Name: string;
  Pattern: { ShiftTypeId: string; IsSelected: boolean }[];
}

// Пример производственного календаря 2025
export const productionCalendar2025: CalendarDay[] = [
  { Date: '2025-01-01', Type: 'п', Description: 'Праздничный' },
  { Date: '2025-01-02', Type: 'п', Description: 'Праздничный' },
  { Date: '2025-01-03', Type: 'п', Description: 'Праздничный' },
  { Date: '2025-01-04', Type: 'п', Description: 'Праздничный' },
  { Date: '2025-01-05', Type: 'п', Description: 'Праздничный' },
  { Date: '2025-01-06', Type: 'п', Description: 'Праздничный' },
  { Date: '2025-01-07', Type: 'п', Description: 'Праздничный' },
  { Date: '2025-01-08', Type: 'п', Description: 'Праздничный' },
  { Date: '2025-02-23', Type: 'п', Description: 'Праздничный' },
  { Date: '2025-03-08', Type: 'п', Description: 'Праздничный' },
  { Date: '2025-05-01', Type: 'п', Description: 'Праздничный' },
  { Date: '2025-05-09', Type: 'п', Description: 'Праздничный' },
  { Date: '2025-06-12', Type: 'п', Description: 'Праздничный' },
  { Date: '2025-11-04', Type: 'п', Description: 'Праздничный' },
  { Date: '2025-05-02', Type: 'в', Description: 'Выходной' },
  { Date: '2025-12-31', Type: 'в', Description: 'Выходной' },
  { Date: '2025-05-08', Type: 'в', Description: 'Выходной' },
  { Date: '2025-06-13', Type: 'в', Description: 'Выходной' },
  { Date: '2025-11-03', Type: 'в', Description: 'Выходной' },
  { Date: '2025-03-07', Type: 'пп', Description: 'Предпраздничный' },
  { Date: '2025-04-30', Type: 'пп', Description: 'Предпраздничный' },
  { Date: '2025-06-11', Type: 'пп', Description: 'Предпраздничный' },
  { Date: '2025-11-01', Type: 'пп', Description: 'Предпраздничный' },
];
