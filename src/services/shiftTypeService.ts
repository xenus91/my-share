// src/services/shiftTypeService.ts
import apiClient from '../api';
import { ShiftTypeDefinition } from '../types';
import { getRequestDigest } from './contextService';

export async function createShiftType(shiftType: Omit<ShiftTypeDefinition, "ID">) {
    try {
        const digest = await getRequestDigest();
        const payload = {
            __metadata: { type: "SP.Data.ShiftTypeListItem" },
            Name: shiftType.Name,
            BackgroundColor: shiftType.BackgroundColor,
            TextColor: shiftType.TextColor,
            AffectsWorkingNorm: shiftType.AffectsWorkingNorm,
            RequiredStartEndTime: shiftType.RequiredStartEndTime,
            CivilLawContract: shiftType.CivilLawContract,
            Description: shiftType.Description || "",
            DefaultStartTime: shiftType.DefaultStartTime,
            DefaultEndTime: shiftType.DefaultEndTime,
            DefaultBreakStart: shiftType.DefaultBreakStart,
            DefaultBreakEnd: shiftType.DefaultBreakEnd,
        };

        const response = await apiClient.post(
            "/web/lists/GetByTitle('ShiftType')/items",
            payload,
            {
                headers: {
                    Accept: "application/json;odata=verbose",
                    "Content-Type": "application/json;odata=verbose",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-RequestDigest": digest
                }
            }
        );

        //console.log("✅ Тип смены создан:", response.data);
        return response.data.d.Id;
    } catch (error) {
        console.error("❌ Ошибка создания типа смены:", error);
        throw error;
    }
}


export async function updateShiftType(shiftTypeId: number, shiftType: Omit<ShiftTypeDefinition, "ID">) {
    try {
        const digest = await getRequestDigest();
        const payload = {
            __metadata: { type: "SP.Data.ShiftTypeListItem" },
            Name: shiftType.Name,
            BackgroundColor: shiftType.BackgroundColor,
            TextColor: shiftType.TextColor,
            AffectsWorkingNorm: shiftType.AffectsWorkingNorm,
            RequiredStartEndTime: shiftType.RequiredStartEndTime,
            CivilLawContract: shiftType.CivilLawContract,
            Description: shiftType.Description || "",
            DefaultStartTime: shiftType.DefaultStartTime,
            DefaultEndTime: shiftType.DefaultEndTime,
            DefaultBreakStart: shiftType.DefaultBreakStart,
            DefaultBreakEnd: shiftType.DefaultBreakEnd,
        };

        await apiClient.post(`/web/lists/GetByTitle('ShiftType')/items(${shiftTypeId})`, payload, {
            headers: {
                Accept: "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-RequestDigest": digest,
                "IF-MATCH": "*",
                "X-HTTP-Method": "MERGE",
            }
        });

        //console.log("✅ Тип смены обновлен.");
    } catch (error) {
        console.error("❌ Ошибка обновления типа смены:", error);
        throw error;
    }
}


export async function deleteShiftType(shiftTypeId: number) {
    try {
        const digest = await getRequestDigest();

        await apiClient.post(`/web/lists/GetByTitle('ShiftType')/items(${shiftTypeId})/recycle()`, {}, {
            headers: {
                Accept: "application/json;odata=verbose",
                "X-Requested-With": "XMLHttpRequest",
                "X-RequestDigest": digest
            }
        });

        //console.log("✅ Тип смены отправлен в корзину.");
    } catch (error) {
        console.error("❌ Ошибка удаления типа смены:", error);
        throw error;
    }
}



// Новая функция для получения всех типов смен
export async function getShiftTypes(): Promise<ShiftTypeDefinition[]> {
    try {
      const response = await apiClient.get("/web/lists/GetByTitle('ShiftType')/items", {
        headers: {
          Accept: "application/json;odata=verbose",
        },
      });
  
      // Извлекаем массив результатов из ответа
      const items: ShiftTypeDefinition[] = response.data.d.results.map((item: any) => ({
        ID: item.ID,
        Name: item.Name,
        BackgroundColor: item.BackgroundColor,
        TextColor: item.TextColor,
        AffectsWorkingNorm: item.AffectsWorkingNorm,
        RequiredStartEndTime: item.RequiredStartEndTime,
        CivilLawContract: item.CivilLawContract,
        Description: item.Description,
        DefaultStartTime: item.DefaultStartTime,
        DefaultEndTime: item.DefaultEndTime,
        DefaultBreakStart: item.DefaultBreakStart,
        DefaultBreakEnd: item.DefaultBreakEnd,
      }));
  
      //console.log("✅ Получены типы смен:", items);
      return items;
    } catch (error) {
      console.error("❌ Ошибка получения типов смен:", error);
      throw error;
    }
  }