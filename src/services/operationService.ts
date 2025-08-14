// src/services/operationService.ts
import apiClient from '../api';
import { Operation } from '../types';
import { getRequestDigest } from './contextService';

// Получение операций по фильтрам (сотрудники и даты)
export async function getOperations(
  employeeIds: number[] = [],
  startDate?: string,
  endDate?: string
): Promise<Operation[]> {
  try {
    let filterQuery = '';

    // Фильтр по сотрудникам
    if (employeeIds.length > 0) {
      const employeeFilters = employeeIds
        .map((id) => `UserName/Id eq ${id}`)
        .join(' or ');
      filterQuery += `(${employeeFilters})`; // Исправлено: добавлены скобки
    }

    // Фильтр по датам
    if (startDate && endDate) {
      filterQuery += `${filterQuery ? ' and ' : ''}OperationDate ge '${startDate}' and OperationDate le '${endDate}'`;
    }

    const query = filterQuery ? `?$filter=${filterQuery}` : '';
    const selectFields = [
      'Id',
      'Title',
      'LocationGID',
      'ShiftType',
      'UserName/Id',
      'TonnageCategory',
      'Tonnage',
      'ShipmentGID',
      'MetricName',
      'MetricValue',
      'MetricTime',
      'NumRefUnits',
      'TtlPM',
      'OperationDate',
      'Exception',
      'Created',
      'Modified',
      'Author/Id',
      'Author/Title',
      'Editor/Id',
      'Editor/Title',
    ].join(',');

    console.log('📝 Формирование запроса операций:', `/web/lists/GetByTitle('shipmentgroup_productivity_v4')/items${query}&$select=${selectFields}&$expand=UserName,Author,Editor`);

    const response = await apiClient.get(
      `/web/lists/GetByTitle('shipmentgroup_productivity_v4')/items${query}&$select=${selectFields}&$expand=UserName,Author,Editor`,
      {
        headers: {
          Accept: 'application/json;odata=verbose',
        },
      }
    );

    const items: Operation[] = response.data.d.results.map((item: any) => ({
      Id: item.Id,
      Title: item.Title,
      LocationGID: item.LocationGID,
      ShiftType: item.ShiftType,
      UserName: {
        Id: item.UserName.Id,
        Title: item.UserName.Title,
        Email: item.UserName.Email,
      },
      TonnageCategory: item.TonnageCategory,
      Tonnage: item.Tonnage,
      ShipmentGID: item.ShipmentGID,
      MetricName: item.MetricName,
      MetricValue: item.MetricValue,
      MetricTime: item.MetricTime,
      NumRefUnits: item.NumRefUnits,
      TtlPM: item.TtlPM,
      OperationDate: item.OperationDate,
      Exception: item.Exception,
      Created: item.Created,
      Modified: item.Modified,
      Author: { Id: item.Author.Id, Title: item.Author.Title },
      Editor: { Id: item.Editor.Id, Title: item.Editor.Title },
    }));

    console.log('✅ Получены операции:', items.length, items);
    return items;
  } catch (error) {
    console.error('❌ Ошибка получения операций:', error);
    throw error;
  }
}


// Создание новой операции
export async function createOperation(operation: Partial<Operation>): Promise<number> {
  try {
    const digest = await getRequestDigest();
    const payload = {
      __metadata: { type: 'SP.Data.shipmentgroup_productivity_v4ListItem' },
      Title: operation.Title || `Операция LPR для ${operation.UserName?.Id}`,
      UserNameId: operation.UserName?.Id,
      MetricName: 'LPR', // Ограничиваем только LPR
      MetricValue: operation.MetricValue || 0,
      OperationDate: operation.OperationDate,
      MetricTime: operation.MetricTime || new Date().toISOString().substring(11, 16),
      ShipmentGID: operation.ShipmentGID || '',
      Tonnage: operation.Tonnage || 0,
      TonnageCategory: operation.TonnageCategory || '',
      NumRefUnits: operation.NumRefUnits || 0,
      TtlPM: operation.TtlPM || 0,
      Exception: operation.Exception || false,
      ShiftType: operation.ShiftType || '',
      LocationGID: operation.LocationGID || '',
    };

    const response = await apiClient.post(
      "/web/lists/GetByTitle('shipmentgroup_productivity_v4')/items",
      payload,
      {
        headers: {
          Accept: 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-Requested-With': 'XMLHttpRequest',
          'X-RequestDigest': digest,
        },
      }
    );

    console.log('✅ Операция создана:', response.data);
    return response.data.d.Id;
  } catch (error) {
    console.error('❌ Ошибка создания операции:', error);
    throw error;
  }
}

