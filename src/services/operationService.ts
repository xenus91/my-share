// src/services/operationService.ts
import apiClient from '../api';
import { Operation } from '../types';
import { getRequestDigest } from './contextService';

/** Кэш имени типа элемента списка (ListItemEntityTypeFullName) */
const entityTypeCache = new Map<string, string>();

async function getListItemEntityTypeFullName(listTitle: string): Promise<string> {
  if (entityTypeCache.has(listTitle)) return entityTypeCache.get(listTitle)!;

  const res = await apiClient.get(
    `/web/lists/GetByTitle('${encodeURIComponent(listTitle)}')?$select=ListItemEntityTypeFullName`,
    { headers: { Accept: 'application/json;odata=verbose' } }
  );
  const typeName: string = res.data?.d?.ListItemEntityTypeFullName;
  if (!typeName) {
    throw new Error(`Не удалось получить ListItemEntityTypeFullName для списка ${listTitle}`);
  }
  entityTypeCache.set(listTitle, typeName);
  return typeName;
}

/** true, если строка в ISO-формате YYYY-MM-DDTHH:mm:ssZ */
function isISOZ(s?: string): boolean {
  return !!s && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s);
}

/** Добавляет поле в объект, только если оно не undefined */
function addIf<T extends object, K extends string>(
  target: T,
  key: K,
  value: any
): asserts target is T & Record<K, any> {
  if (value !== undefined) {
    // @ts-ignore
    target[key] = value;
  }
}

/** ===== Нормализация дат для SP REST ===== */
function toZStart(dateYMD: string): string {
  // ожидаем 'YYYY-MM-DD'
  return `${dateYMD}T00:00:00Z`;
}
function nextDay(dateYMD: string): string {
  const d = new Date(`${dateYMD}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}

/** Привести абсолютный __next к относительному пути (совместимо с apiClient) */
function toRelativeApiUrl(absoluteOrRelative: string): string {
  try {
    const u = new URL(absoluteOrRelative);
    return u.pathname + u.search;
  } catch {
    // уже относительный
    return absoluteOrRelative;
  }
}

/** Сборка URL для чтения items */
function buildItemsUrl(listTitle: string, parts: string[], top?: number) {
  const qs = [...parts];
  if (top && Number.isFinite(top) && top > 0) qs.push(`$top=${top}`);
  const query = qs.length ? `?${qs.join('&')}` : '';
  return `/web/lists/GetByTitle('${encodeURIComponent(listTitle)}')/items${query}`;
}

/* ========= чтение ========= */

/**
 * Чтение операций с поддержкой пагинации (__next).
 * @param employeeIds массив SharePoint UserName/Id (ВАЖНО: это не ваш локальный employeeId)
 * @param startDate 'YYYY-MM-DD' (включительно)
 * @param endDate 'YYYY-MM-DD' (если не задан, берётся только 1 день startDate)
 * @param pageSize размер страницы ($top), по умолчанию 500
 * @param maxPages ограничитель количества страниц (защита), по умолчанию 50
 */
export async function getOperations(
  employeeIds: number[] = [],
  startDate?: string,
  endDate?: string,
  pageSize = 500,
  maxPages = 50
): Promise<Operation[]> {
  try {
    const listTitle = 'shipmentgroup_productivity_v4';

    // фильтры
    const filterParts: string[] = [];

    if (employeeIds.length > 0) {
      const employeeFilters = employeeIds.map((id) => `UserName/Id eq ${id}`).join(' or ');
      filterParts.push(`(${employeeFilters})`);
    }

    if (startDate && endDate) {
      const startZ = toZStart(startDate);
      const endExclusiveZ = toZStart(nextDay(endDate));
      filterParts.push(
        `OperationDate ge datetime'${startZ}' and OperationDate lt datetime'${endExclusiveZ}'`
      );
    } else if (startDate && !endDate) {
      const startZ = toZStart(startDate);
      const endExclusiveZ = toZStart(nextDay(startDate));
      filterParts.push(
        `OperationDate ge datetime'${startZ}' and OperationDate lt datetime'${endExclusiveZ}'`
      );
    }

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

    const queryParts: string[] = [];
    if (filterParts.length) queryParts.push(`$filter=${filterParts.join(' and ')}`);
    queryParts.push(`$select=${selectFields}`);
    queryParts.push(`$expand=UserName,Author,Editor`);

    let url = buildItemsUrl(listTitle, queryParts, pageSize);
    const allRaw: any[] = [];
    let page = 0;

    while (url && page < maxPages) {
      page += 1;

      const response = await apiClient.get(url, {
        headers: { Accept: 'application/json;odata=verbose' },
      });

      const d = response.data?.d;
      const results = d?.results ?? [];
      allRaw.push(...results);

      const nextUrl: string | undefined = d?.__next;
      if (nextUrl) {
        url = toRelativeApiUrl(nextUrl);
      } else {
        break;
      }
    }

    const items: Operation[] = allRaw.map((item: any) => ({
      Id: item.Id,
      Title: item.Title,
      LocationGID: item.LocationGID,
      ShiftType: item.ShiftType,
      // ВАЖНО: тип Operation в сервисах ожидает ровно { Id: number }
      UserName: { Id: Number(item?.UserName?.Id ?? 0) },
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
      // Author/Editor могут не совпадать с типами Operation — если нужно, добавь их в тип
      Author: (item.Author && { Id: item.Author.Id, Title: item.Author.Title }) as any,
      Editor: (item.Editor && { Id: item.Editor.Id, Title: item.Editor.Title }) as any,
    }));

    return items;
  } catch (error) {
    console.error('❌ Ошибка получения операций (с пагинацией):', error);
    throw error;
  }
}

/* ========= создание ========= */

export async function createOperation(operation: Partial<Operation>): Promise<number> {
  const listTitle = 'shipmentgroup_productivity_v4';
  try {
    const digest = await getRequestDigest();
    const entityType = await getListItemEntityTypeFullName(listTitle);

    // ВАЖНО: нужен валидный SharePoint UserNameId (число)
    const userId =
      (operation as any)?.UserName?.Id ??
      (operation as any)?.UserNameId ??
      (operation as any)?.userId;
    if (typeof userId !== 'number' || !Number.isFinite(userId) || userId <= 0) {
      throw new Error('UserNameId отсутствует или некорректен при создании операции');
    }

    // нормализуем OperationDate: 'YYYY-MM-DD' -> 'YYYY-MM-DDT00:00:00Z'
    let normalizedOperationDate = operation.OperationDate;
    if (normalizedOperationDate && /^\d{4}-\d{2}-\d{2}$/.test(normalizedOperationDate)) {
      normalizedOperationDate = `${normalizedOperationDate}T00:00:00Z`;
    }

    const payload: any = {
      __metadata: { type: entityType },
      Title: operation.Title,
      UserNameId: userId,
      MetricName: operation.MetricName,
      MetricValue: operation.MetricValue,
      OperationDate: normalizedOperationDate,
      ShipmentGID: operation.ShipmentGID,
      Tonnage: operation.Tonnage,
      TonnageCategory: (operation as any).TonnageCategory,
      NumRefUnits: operation.NumRefUnits,
      TtlPM: operation.TtlPM,
      Exception: operation.Exception,
      ShiftType: (operation as any).ShiftType,
      LocationGID: (operation as any).LocationGID,
    };

    if (isISOZ(operation.MetricTime)) {
      payload.MetricTime = operation.MetricTime;
    }

    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    const response = await apiClient.post(
      `/web/lists/GetByTitle('${encodeURIComponent(listTitle)}')/items`,
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

    return response.data.d.Id;
  } catch (error) {
    console.error('❌ Ошибка создания операции:', error);
    throw error;
  }
}

/* ========= обновление ========= */

export async function updateOperation(operationId: number, operation: Partial<Operation>): Promise<void> {
  const listTitle = 'shipmentgroup_productivity_v4';
  try {
    const digest = await getRequestDigest();
    const entityType = await getListItemEntityTypeFullName(listTitle);

    const payload: any = { __metadata: { type: entityType } };

    // Если нужно уметь менять UserNameId при апдейте — раскомментируй:
    // const userId =
    //   (operation as any)?.UserName?.Id ??
    //   (operation as any)?.UserNameId ??
    //   (operation as any)?.userId;
    // if (typeof userId === 'number' && Number.isFinite(userId) && userId > 0) {
    //   addIf(payload, 'UserNameId', userId);
    // }

    if (operation.OperationDate) {
      const od = /^\d{4}-\d{2}-\d{2}$/.test(operation.OperationDate)
        ? `${operation.OperationDate}T00:00:00Z`
        : operation.OperationDate;
      addIf(payload, 'OperationDate', od);
    }

    addIf(payload, 'Title', operation.Title);
    addIf(payload, 'MetricName', operation.MetricName);
    addIf(payload, 'MetricValue', operation.MetricValue);
    addIf(payload, 'ShipmentGID', operation.ShipmentGID);
    addIf(payload, 'Tonnage', operation.Tonnage);
    addIf(payload, 'TonnageCategory', (operation as any).TonnageCategory);
    addIf(payload, 'NumRefUnits', operation.NumRefUnits);
    addIf(payload, 'TtlPM', operation.TtlPM);
    addIf(payload, 'Exception', operation.Exception);
    addIf(payload, 'ShiftType', (operation as any).ShiftType);
    addIf(payload, 'LocationGID', (operation as any).LocationGID);

    if (isISOZ(operation.MetricTime)) {
      addIf(payload, 'MetricTime', operation.MetricTime);
    }

    await apiClient.post(
      `/web/lists/GetByTitle('${encodeURIComponent(listTitle)}')/items(${operationId})`,
      payload,
      {
        headers: {
          Accept: 'application/json;odata=verbose',
          'Content-Type': 'application/json;odata=verbose',
          'X-RequestDigest': digest,
          'IF-MATCH': '*',
          'X-HTTP-Method': 'MERGE',
        },
      }
    );
  } catch (error) {
    console.error('❌ Ошибка обновления операции:', error);
    throw error;
  }
}

/* ========= удаление ========= */

export async function deleteOperation(operationId: number): Promise<void> {
  const listTitle = 'shipmentgroup_productivity_v4';
  try {
    const digest = await getRequestDigest();
    await apiClient.post(
      `/web/lists/GetByTitle('${encodeURIComponent(listTitle)}')/items(${operationId})/recycle`,
      {},
      {
        headers: {
          Accept: 'application/json;odata=verbose',
          'X-Requested-With': 'XMLHttpRequest',
          'X-RequestDigest': digest,
        },
      }
    );
  } catch (error) {
    console.error('❌ Ошибка удаления операции:', error);
    throw error;
  }
}
