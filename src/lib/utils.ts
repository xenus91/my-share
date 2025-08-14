//utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, getDay, parse, addDays, startOfDay, max, min, differenceInMinutes } from 'date-fns';
import { productionCalendar2025, Shift, Operation, AggregatedMetrics } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function aggregateOperations(operations: Operation[]): AggregatedMetrics {
  console.log('📊 aggregateOperations: Входные операции=', operations);
  const metrics: AggregatedMetrics = {
    shipped_pallets_lt20: 0,
    shipped_pallets_gt20: 0,
    unloading: 0,
    moving_pallets: 0,
    transfer_thu: 0,
    LPR: 0,
    operationCount: operations.length,
  };

  operations.forEach((op) => {
    console.log('📈 Обработка операции:', op);
    if (op.MetricName === 'shipped_pallets' && op.TonnageCategory === '<20') {
      metrics.shipped_pallets_lt20 += op.MetricValue || 0;
    } else if (op.MetricName === 'shipped_pallets' && op.TonnageCategory === '>20') {
      metrics.shipped_pallets_gt20 += op.MetricValue || 0;
    } else if (op.MetricName === 'unload' || op.MetricName === 'transit_pallets') {
      metrics.unloading += op.MetricValue || 0;
    } else if (op.MetricName === 'transit_pallets') {
      metrics.moving_pallets += op.MetricValue || 0;
    } else if (op.MetricName === 'transfer_thu') {
      metrics.transfer_thu += op.MetricValue || 0;
    } else if (op.MetricName === 'LPR') {
      metrics.LPR += op.MetricValue || 0;
    }
  });

  console.log('📊 Результат агрегации:', metrics);
  return metrics;
}

export function getDayNorm(date: Date): number {
  const dateString = format(date, 'yyyy-MM-dd');
  const calendarDay = productionCalendar2025.find(day => day.Date === dateString);

  if (calendarDay) {
    switch (calendarDay.Type) {
      case 'п':
      case 'в':
        return 0;
      case 'пп':
        return 7;
    }
  }

  const dayOfWeek = getDay(date);
  return dayOfWeek >= 1 && dayOfWeek <= 5 ? 8 : 0;
}

export function isHolidayDate(date: string): boolean {
  return productionCalendar2025.some(day => 
    day.Date === date && (day.Type === 'п' || day.Type === 'в')
  );
}

export function calculateHolidayHours(shift: Shift): number {
  //console.log('Начало расчета праздничных часов', shift);

  const shiftDate = new Date(shift.Date);
  // Полные даты для начала и конца смены
  let startDateTime = parse(shift.StartTime, 'HH:mm', shiftDate);
  let endDateTime = parse(shift.EndTime, 'HH:mm', shiftDate);

  // Коррекция перехода через полночь
  if (endDateTime <= startDateTime) {
    endDateTime = addDays(endDateTime, 1);
  }

  //console.log('Начало смены:', startDateTime);
  //console.log('Конец смены:', endDateTime);

  // Полные даты для перерыва
  let breakStartDateTime = shift.BreakStart
    ? parse(shift.BreakStart, 'HH:mm', shiftDate)
    : null;
  let breakEndDateTime = shift.BreakEnd
    ? parse(shift.BreakEnd, 'HH:mm', shiftDate)
    : null;

  // Коррекция для перерыва (если он выходит за рамки смены)
  if (breakStartDateTime && breakEndDateTime) {
    if (breakStartDateTime < startDateTime) {
      breakStartDateTime = addDays(breakStartDateTime, 1);
    }
    if (breakEndDateTime <= breakStartDateTime) {
      breakEndDateTime = addDays(breakEndDateTime, 1);
    }
  }

  //console.log('Начало перерыва:', breakStartDateTime);
  //console.log('Конец перерыва:', breakEndDateTime);

  // Получаем список всех праздничных дней
  const holidays = productionCalendar2025.filter(day => day.Type === 'п').map(day => day.Date);

  //console.log('Список праздничных дней:', holidays);

  // Инициализируем счетчик праздничных минут
  let holidayMinutes = 0;

  // Цикл по дням смены
  let currentDate = startDateTime;
  while (currentDate < endDateTime) {
    const nextDay = addDays(currentDate, 1);
    const dayEnd = currentDate < startOfDay(nextDay) ? startOfDay(nextDay) : nextDay;

    const currentDayHoliday = holidays.includes(format(currentDate, 'yyyy-MM-dd'));

    //console.log('Текущая дата:', currentDate);
    //console.log('Конец текущего периода:', dayEnd);
    //console.log('Является ли текущий день праздничным:', currentDayHoliday);

    if (currentDayHoliday) {
      const holidayStart = max([currentDate, startOfDay(currentDate)]);
      const holidayEnd = min([endDateTime, dayEnd]);

      let dailyHolidayMinutes = (holidayEnd.getTime() - holidayStart.getTime()) / (1000 * 60);

      //console.log('Праздничное начало:', holidayStart);
      //console.log('Праздничное окончание:', holidayEnd);
      //console.log('Праздничные минуты до вычета перерыва:', dailyHolidayMinutes);

      // Учет пересечения перерыва с праздничным временем
      if (breakStartDateTime && breakEndDateTime) {
        const breakOverlapStart = max([breakStartDateTime, holidayStart]);
        const breakOverlapEnd = min([breakEndDateTime, holidayEnd]);

        if (breakOverlapStart < breakOverlapEnd) {
          const breakOverlapMinutes = (breakOverlapEnd.getTime() - breakOverlapStart.getTime()) / (1000 * 60);
          dailyHolidayMinutes -= breakOverlapMinutes;

          //console.log('Перерыв пересекается с праздничным временем');
          //console.log('Начало пересечения перерыва:', breakOverlapStart);
          //console.log('Конец пересечения перерыва:', breakOverlapEnd);
          //console.log('Минуты перерыва, вычтенные из праздничного времени:', breakOverlapMinutes);
        }
      }

      holidayMinutes += dailyHolidayMinutes;
      //console.log('Итоговые праздничные минуты за день:', dailyHolidayMinutes);
    }

    currentDate = dayEnd;
  }

  //console.log('Общие праздничные минуты:', holidayMinutes);
  const holidayHours = holidayMinutes / 60;
  //console.log('Общие праздничные часы:', holidayHours);
  return holidayHours;
}


/**
 * Рассчитывает количество рабочих часов для смены.
 * @param startTime Время начала смены (формат 'HH:mm')
 * @param endTime Время окончания смены (формат 'HH:mm')
 * @param breakStart Время начала перерыва (формат 'HH:mm')
 * @param breakEnd Время окончания перерыва (формат 'HH:mm')
 * @returns Количество рабочих часов с учётом перерыва
 */
export function calculateShiftHours(
  startTime: string,
  endTime: string,
  breakStart: string,
  breakEnd: string,
  requiredStartEndTime: boolean = true
): number {
  if (!requiredStartEndTime) {
    return 0;
  }


  const baseDate = '2000-01-01'; // Базовая дата для расчётов

  let start = parse(`${baseDate} ${startTime}`, 'yyyy-MM-dd HH:mm', new Date());
  let end = parse(`${baseDate} ${endTime}`, 'yyyy-MM-dd HH:mm', new Date());

  // Если время окончания раньше или равно времени начала, считаем, что смена продолжается до следующего дня
  if (end <= start) {
    end = addDays(end, 1);
  }

  const totalMinutes = differenceInMinutes(end, start);

  const breakStartTime = parse(`${baseDate} ${breakStart}`, 'yyyy-MM-dd HH:mm', new Date());
  let breakEndTime = parse(`${baseDate} ${breakEnd}`, 'yyyy-MM-dd HH:mm', new Date());

  // Если время окончания перерыва раньше или равно времени начала перерыва, считаем, что перерыв до следующего дня
  if (breakEndTime < breakStartTime) {
    breakEndTime = addDays(breakEndTime, 1);
  }

  let breakMinutes = differenceInMinutes(breakEndTime, breakStartTime);

  // Убедимся, что перерыв не превышает общую длительность смены
  const shiftDuration = differenceInMinutes(end, start);
  breakMinutes = Math.min(breakMinutes, shiftDuration);

  const workMinutes = totalMinutes - breakMinutes;
  return parseFloat((workMinutes / 60).toFixed(2));
}