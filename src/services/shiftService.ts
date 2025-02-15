// src/services/shiftService.ts
import apiClient from '../api';
import { Shift } from '../types';
import { getRequestDigest } from './contextService';

export async function createShift(
  shift: Omit<Shift, "ID">
): Promise<number> {
  try {
    const digest = await getRequestDigest();
    const payload = {
      __metadata: { type: "SP.Data.ShiftsListItem" },
      EmployeeId: shift.EmployeeId,
      Date: shift.Date,
      ShiftTypeId: shift.ShiftTypeId,
      StartTime: shift.StartTime,
      EndTime: shift.EndTime,
      BreakStart: shift.BreakStart,
      BreakEnd: shift.BreakEnd,
      Hours: shift.Hours,
      IsNightShift: shift.IsNightShift,
    };

    const response = await apiClient.post(
      "/web/lists/GetByTitle('Shifts')/items",
      payload,
      {
        headers: {
          Accept: "application/json;odata=verbose",
          "Content-Type": "application/json;odata=verbose",
          "X-Requested-With": "XMLHttpRequest",
          "X-RequestDigest": digest,
        },
      }
    );

    console.log("✅ Смена создана:", response.data);
    return response.data.d.Id;
  } catch (error) {
    console.error("❌ Ошибка создания смены:", error);
    throw error;
  }
}

// services/shiftService.ts
export async function updateShift(
  shiftId: number,
  shift: Omit<Shift, "ID" | "EmployeeId" | "Date">
): Promise<void> {
  try {
    const digest = await getRequestDigest();
    const payload = {
      __metadata: { type: "SP.Data.ShiftsListItem" },
      ShiftTypeId: shift.ShiftTypeId,
      StartTime: shift.StartTime,
      EndTime: shift.EndTime,
      BreakStart: shift.BreakStart,
      BreakEnd: shift.BreakEnd,
      Hours: shift.Hours,
      IsNightShift: shift.IsNightShift,
    };

    await apiClient.post(
      `/web/lists/GetByTitle('Shifts')/items(${shiftId})`,
      payload,
      {
        headers: {
          Accept: "application/json;odata=verbose",
          "Content-Type": "application/json;odata=verbose",
          "X-RequestDigest": digest,
          "IF-MATCH": "*",
          "X-HTTP-Method": "MERGE",
        },
      }
    );

    console.log("✅ Смена обновлена.");
  } catch (error) {
    console.error("❌ Ошибка обновления смены:", error);
    throw error;
  }
}


export async function deleteShift(shiftId: number): Promise<void> {
  try {
    const digest = await getRequestDigest();

    await apiClient.post(
      `/web/lists/GetByTitle('Shifts')/items(${shiftId})/recycle()`,
      {},
      {
        headers: {
          Accept: "application/json;odata=verbose",
          "X-Requested-With": "XMLHttpRequest",
          "X-RequestDigest": digest,
        },
      }
    );

    console.log("✅ Смена отправлена в корзину.");
  } catch (error) {
    console.error("❌ Ошибка удаления смены:", error);
    throw error;
  }
}

export async function getShifts(): Promise<Shift[]> {
  try {
    const response = await apiClient.get(
      "/web/lists/GetByTitle('Shifts')/items?$select=ID,EmployeeId,Date,ShiftTypeId,StartTime,EndTime,BreakStart,BreakEnd,Hours,IsNightShift,Editor/Title&$expand=Editor",
      {
        headers: {
          Accept: "application/json;odata=verbose",
        },
      }
    );

    const items: Shift[] = response.data.d.results.map((item: any) => ({
      ID: item.ID,
      EmployeeId: item.EmployeeId,
      Date: item.Date,
      ShiftTypeId: item.ShiftTypeId,
      StartTime: item.StartTime,
      EndTime: item.EndTime,
      BreakStart: item.BreakStart,
      BreakEnd: item.BreakEnd,
      Hours: item.Hours,
      IsNightShift: item.IsNightShift,
      ChangeAuthor: item.Editor ? item.Editor.Title : "Неизвестно" // получаем имя автора из Editor.Title
    }));

    console.log("✅ Получены смены:", items);
    return items;
  } catch (error) {
    console.error("❌ Ошибка получения смен:", error);
    throw error;
  }
}

