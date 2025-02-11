// src/services/shiftPatternService.ts
import apiClient from '../api';
import { ShiftPattern } from '../types';
import { getRequestDigest } from './contextService';

export async function createShiftPattern(
  shiftPattern: Omit<ShiftPattern, "ID">
): Promise<number> {
  try {
    const digest = await getRequestDigest();
    const payload = {
      __metadata: { type: "SP.Data.ShiftPatternListItem" },
      Name: shiftPattern.Name,
      // Преобразуем массив boolean в JSON-строку для хранения в SharePoint
      Pattern: JSON.stringify(shiftPattern.Pattern),
    };

    const response = await apiClient.post(
      "/web/lists/GetByTitle('ShiftPattern')/items",
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

    console.log("✅ Паттерн смены создан:", response.data);
    return response.data.d.Id;
  } catch (error) {
    console.error("❌ Ошибка создания паттерна смены:", error);
    throw error;
  }
}

export async function updateShiftPattern(
  shiftPatternId: number,
  shiftPattern: Omit<ShiftPattern, "ID">
): Promise<void> {
  try {
    const digest = await getRequestDigest();
    const payload = {
      __metadata: { type: "SP.Data.ShiftPatternListItem" },
      Name: shiftPattern.Name,
      Pattern: JSON.stringify(shiftPattern.Pattern),
    };

    await apiClient.post(
      `/web/lists/GetByTitle('ShiftPattern')/items(${shiftPatternId})`,
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

    console.log("✅ Паттерн смены обновлен.");
  } catch (error) {
    console.error("❌ Ошибка обновления паттерна смены:", error);
    throw error;
  }
}

export async function deleteShiftPattern(shiftPatternId: number): Promise<void> {
  try {
    const digest = await getRequestDigest();

    await apiClient.post(
      `/web/lists/GetByTitle('ShiftPattern')/items(${shiftPatternId})/recycle()`,
      {},
      {
        headers: {
          Accept: "application/json;odata=verbose",
          "X-Requested-With": "XMLHttpRequest",
          "X-RequestDigest": digest,
        },
      }
    );

    console.log("✅ Паттерн смены отправлен в корзину.");
  } catch (error) {
    console.error("❌ Ошибка удаления паттерна смены:", error);
    throw error;
  }
}

export async function getShiftPatterns(): Promise<ShiftPattern[]> {
  try {
    const response = await apiClient.get("/web/lists/GetByTitle('ShiftPattern')/items", {
      headers: { Accept: "application/json;odata=verbose" },
    });

    // Извлекаем массив результатов и преобразуем JSON-поле в массив boolean
    const items: ShiftPattern[] = response.data.d.results.map((item: any) => ({
      ID: item.ID,
      Name: item.Name,
      Pattern: JSON.parse(item.Pattern || "[]"),
    }));

    console.log("✅ Получены паттерны смен:", items);
    return items;
  } catch (error) {
    console.error("❌ Ошибка получения паттернов смен:", error);
    throw error;
  }
}
