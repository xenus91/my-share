// OperationDialog.tsx
import React, {
  useEffect, useRef, useState, useMemo, useCallback, MutableRefObject,
} from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, ButtonGroup, Box, Typography, IconButton, CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import { Switch } from '@mui/material';

import { AgGridReact } from 'ag-grid-react';
import type {
  ColDef, GridOptions, ICellRendererParams, GetRowIdFunc,
  CellValueChangedEvent, CellEditingStartedEvent, CellEditingStoppedEvent, RowDataUpdatedEvent, CellStyle,
} from 'ag-grid-community';

import { ModuleRegistry } from 'ag-grid-community';
import {
  ClientSideRowModelModule, ClientSideRowModelApiModule,
  TextFilterModule, NumberFilterModule, DateFilterModule, RowApiModule,
  TextEditorModule, NumberEditorModule, DateEditorModule,
  CheckboxEditorModule, LargeTextEditorModule, SelectEditorModule, CustomEditorModule,
} from 'ag-grid-community';

ModuleRegistry.registerModules([
  TextEditorModule, NumberEditorModule, DateEditorModule,
  CheckboxEditorModule, LargeTextEditorModule, SelectEditorModule, CustomEditorModule,
  ClientSideRowModelModule, ClientSideRowModelApiModule,
  TextFilterModule, NumberFilterModule, DateFilterModule, RowApiModule,
]);

import {
  createOperation, updateOperation, deleteOperation, getOperations as fetchOperations,
} from '../services/operationService';

/* ===== Типы ===== */
export interface Operation {
  Id?: number;
  MetricName: string;
  MetricValue: number;
  ShipmentGID: string;
  Tonnage: number;
  NumRefUnits: number;
  TtlPM: number;
  MetricTime: string;     // '' или ISOZ
  OperationDate: string;  // YYYY-MM-DD
  Exception: boolean;

  Title?: string;
  UserName?: { Id: number; Title?: string; Email?: string };
  TonnageCategory?: string; // "<20" | ">20"
  ShiftType?: string;
  LocationGID?: string;
}

export interface AggregatedMetrics {
  shipped_pallets_lt20: number;
  shipped_pallets_gt20: number;
  unloading: number;
  moving_pallets: number;
  transfer_thu: number;
  LPR: number;
  operationCount: number;
}

interface OperationDialogProps {
  open: boolean;
  onClose: () => void;
  aggregatedMetrics: AggregatedMetrics; // оставляем для совместимости
  operations: Operation[];              // для инфера userId
  date: string;
  employeeName: string;
  employeeId: number;
  totalDayHours: number;                // из ShiftCellRenderer
}

type OperationRow = Operation & {
  __rowId: string;   // tmp-* или op-<Id>
  isNew: boolean;
  UserNameId?: number;
};

/* ===== Утилы ===== */
const ACTION_METRICS = new Set(['LPR', 'transfer_thu']);
const isActionMetric = (m?: string) => ACTION_METRICS.has(m || '');
const canEditForExisting = (row?: OperationRow) => !!row && isActionMetric(row.MetricName);
const isISODateTimeZ = (s: string) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(s);
const ActionsColId = '__actions__';

// Нормы операций в час
const NORMS_PER_HOUR = {
  shipped_pallets_lt20: 20,
  shipped_pallets_gt20: 25,
  unloading: 50,
  moving_pallets: 25,   // transit_pallets
  transfer_thu: 25,
  LPR: 1,
} as const;

/* === Центрирующий рендерер для объединённых ячеек === */
const VertCenterRenderer = (p: ICellRendererParams) => {
  const value = p.value as React.ReactNode;
  return (
    <div style={{
      height: '100%',
      width: '100%',
      display: 'flex',
      alignItems: 'center',     // по вертикали
      justifyContent: 'center', // по горизонтали
      fontWeight: 600,
    }}>
      {value}
    </div>
  );
};

const buildPayload = (row: OperationRow) => {
  const base: any = {
    MetricName: row.MetricName,
    MetricValue: row.MetricValue,
    OperationDate: row.OperationDate,
    ShipmentGID: row.ShipmentGID,
    Tonnage: row.Tonnage,
    NumRefUnits: row.NumRefUnits,
    TtlPM: row.TtlPM,
    Exception: row.Exception,
    TonnageCategory: row.TonnageCategory,
    ShiftType: row.ShiftType,
    LocationGID: row.LocationGID,
  };
  if (row.MetricTime && isISODateTimeZ(row.MetricTime)) {
    base.MetricTime = row.MetricTime;
  }
  return base;
};

/* ===== Switch для Исключения ===== */
const ExceptionRenderer = (p: ICellRendererParams<OperationRow>) => {
  const { data, value, api } = p;
  if (!data) return null;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    data.Exception = e.target.checked;
    api.applyTransaction({ update: [data] });
  };
  return <Switch checked={!!value} onChange={handleChange} size="small" />;
};

/* ===== Рендерер действий ===== */
function ActionsRenderer(props: ICellRendererParams<OperationRow>) {
  const { data, api, context } = props;
  if (!data) return null;

  const savingRef = context?.savingRef as MutableRefObject<boolean>;
  const setRows = context?.setRows as React.Dispatch<React.SetStateAction<OperationRow[]>>;
  const employeeName: string = context.employeeName;
  const date: string = context.date;
  const employeeIdFromProps: number = context.employeeId;
  const userIdRef = context?.userIdRef as MutableRefObject<number>;
  const unsavedRef = context?.unsavedRef as MutableRefObject<OperationRow[]>;

  // shipped_pallets — нет удаления
  const hideDelete = data.MetricName === 'shipped_pallets';
  const show = isActionMetric(data.MetricName) || data.MetricName === 'shipped_pallets';
  if (!show) return null;

  const disabled = !!savingRef?.current;

  const onSave = async () => {
    api.stopEditing(true);
    const node = api.getRowNode(data.__rowId);
    const fresh = (node?.data || data) as OperationRow;

    const userId =
      fresh.UserNameId ||
      fresh.UserName?.Id ||
      (userIdRef?.current ?? 0) ||
      employeeIdFromProps ||
      0;

    if (!Number.isFinite(userId) || userId <= 0) {
      alert('Не удалось определить пользователя (UserNameId).');
      return;
    }

    if (fresh.UserNameId !== userId) {
      fresh.UserNameId = userId;
      fresh.UserName = { Id: userId };
      setRows((prev) => prev.map((r) => (r.__rowId === fresh.__rowId ? { ...fresh } : r)));
    }

    if (isActionMetric(fresh.MetricName)) {
      if (fresh.MetricValue == null || Number(fresh.MetricValue) <= 0) {
        alert('Заполните корректное значение (> 0)');
        return;
      }
    }

    const payload = {
      Title: `Операция ${fresh.MetricName} для ${employeeName} на ${date}`,
      UserNameId: userId,
      UserName: { Id: userId },
      ...buildPayload(fresh),
    };

    try {
      if (savingRef) savingRef.current = true;

      if (fresh.isNew) {
        const oldRowId = fresh.__rowId;
        const newId = await createOperation(payload);

        const updated: OperationRow = {
          ...fresh,
          Id: newId,
          isNew: false,
          __rowId: `op-${newId}`,
          UserNameId: userId,
          UserName: { Id: userId },
        };

        setRows((prev) => prev.map((r) => (r.__rowId === oldRowId ? updated : r)));
        if (unsavedRef?.current) {
          unsavedRef.current = unsavedRef.current.filter((r) => r.__rowId !== oldRowId);
        }
      } else {
        await updateOperation(fresh.Id!, buildPayload(fresh));
        setRows((prev) => prev.map((r) => (r.__rowId === fresh.__rowId ? { ...fresh } : r)));
      }
    } catch {
      alert('Ошибка при сохранении операции');
    } finally {
      if (savingRef) savingRef.current = false;
    }
  };

  const onDelete = async () => {
    if (hideDelete) return;
    api.stopEditing(true);
    const node = props.api.getRowNode(data.__rowId);
    const fresh = (node?.data || data) as OperationRow;

    if (!fresh.isNew && !confirm('Удалить операцию?')) return;

    try {
      if (savingRef) savingRef.current = true;
      if (!fresh.isNew && fresh.Id) await deleteOperation(fresh.Id);
      setRows((prev) => prev.filter((r) => r.__rowId !== fresh.__rowId));
      if (unsavedRef?.current) {
        unsavedRef.current = unsavedRef.current.filter((r) => r.__rowId !== fresh.__rowId);
      }
    } catch {
      alert('Ошибка при удалении операции');
    } finally {
      if (savingRef) savingRef.current = false;
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: .5 }}>
      <IconButton size="small" onClick={onSave} disabled={disabled} aria-label="Сохранить">
        <SaveIcon fontSize="small" />
      </IconButton>
      {!hideDelete && (
        <IconButton size="small" onClick={onDelete} disabled={disabled} aria-label="Удалить">
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
}

/* ===== Компонент ===== */
export default function OperationDialog({
  open, onClose, aggregatedMetrics, operations, date, employeeName, employeeId, totalDayHours,
}: OperationDialogProps) {
  const gridRef = useRef<AgGridReact<OperationRow>>(null);
  const savingRef = useRef<boolean>(false);
  const tmpIdRef = useRef<number>(1);

  const [tab, setTab] = useState<'metrics' | 'operations'>('metrics');
  const [rows, setRows] = useState<OperationRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // анти-ддос
  const inFlightRef = useRef<boolean>(false);
  const lastFetchKeyRef = useRef<string>('');
  const fetchTokenRef = useRef<number>(0);

  // кто наш пользователь
  const userIdRef = useRef<number>(0);

  // несохранённые строки (tmp)
  const unsavedRef = useRef<OperationRow[]>([]);

  // определить userId при открытии
  const initUserIdOnOpen = useCallback(() => {
    const inferredFromOps =
      (operations || []).find((op) => Number(op.UserName?.Id) > 0)?.UserName?.Id ?? 0;
    userIdRef.current = (employeeId && Number(employeeId) > 0) ? employeeId : (inferredFromOps || 0);
  }, [employeeId, operations]);

  const makeNewRow = useCallback((dateStr: string): OperationRow => {
    const uid = userIdRef.current || 0;
    return {
      __rowId: `tmp-${tmpIdRef.current++}`,
      Id: undefined,
      MetricName: 'LPR',
      MetricValue: 0,
      ShipmentGID: '',
      Tonnage: 0,
      NumRefUnits: 0,
      TtlPM: 0,
      MetricTime: '',
      OperationDate: dateStr,
      Exception: false,
      isNew: true,
      UserNameId: uid > 0 ? uid : undefined,
      UserName: uid > 0 ? { Id: uid } : undefined,
    };
  }, []);

  const handleAddOperation = () => {
    const newRow = makeNewRow(date);
    setRows((prev) => {
      const next = [newRow, ...prev];
      unsavedRef.current = [newRow, ...unsavedRef.current];
      return next;
    });
    setTimeout(() => {
      gridRef.current?.api.startEditingCell({ rowIndex: 0, colKey: 'MetricName' });
    }, 0);
  };

  // фетч с ограничителями
  const fetchAndSeed = useCallback(async (uid: number, dateStr: string) => {
    if (!uid) return;
    const key = `${uid}|${dateStr}`;
    if (lastFetchKeyRef.current === key) return;
    if (inFlightRef.current) return;

    lastFetchKeyRef.current = key;
    inFlightRef.current = true;
    const myToken = ++fetchTokenRef.current;

    setLoading(true);
    try {
      const list = await fetchOperations([uid], dateStr, dateStr);
      const fetchedRows: OperationRow[] = list.map((op) => ({
        ...op,
        __rowId: op.Id ? `op-${op.Id}` : `tmp-${tmpIdRef.current++}`,
        isNew: !op.Id,
        UserNameId: op.UserName?.Id,
      }));

      if (fetchTokenRef.current !== myToken) return;

      const merged = [...fetchedRows, ...unsavedRef.current];
      setRows(merged);
    } catch {
      lastFetchKeyRef.current = '';
    } finally {
      if (fetchTokenRef.current === myToken) {
        inFlightRef.current = false;
        setLoading(false);
      }
    }
  }, []);

  // открытие диалога => определить userId и загрузить
  useEffect(() => {
    if (!open) return;

    unsavedRef.current = (rows || []).filter(r => r.isNew && !r.Id);
    initUserIdOnOpen();
    const uid = userIdRef.current;

    lastFetchKeyRef.current = '';
    fetchAndSeed(uid, date);
  }, [open, employeeId, date, initUserIdOnOpen, fetchAndSeed]);

  /* ===== Пересчёт агрегатов из rows ===== */
   /* ===== Пересчёт агрегатов из rows ===== */
  const aggregates = useMemo<AggregatedMetrics>(() => {
    const acc: AggregatedMetrics = {
      shipped_pallets_lt20: 0,
      shipped_pallets_gt20: 0,
      unloading: 0,
      moving_pallets: 0,
      transfer_thu: 0,
      LPR: 0,
      operationCount: 0,
    };

    for (const r of rows) {
      if (!r || r.Exception) continue;

      const val = Number(r.MetricValue) || 0;
      const metric = (r.MetricName || '').trim();

      switch (metric) {
        case 'shipped_pallets': {
          const cat = (r.TonnageCategory || '').trim();
          if (cat === '<20' || cat === 'lt20' || cat === '< 20') {
            acc.shipped_pallets_lt20 += val;
          } else if (cat === '>20' || cat === 'gt20' || cat === '> 20') {
            acc.shipped_pallets_gt20 += val;
          }
          break;
        }

        case 'transit_pallets':
          // как в ShiftCellRenderer: считаем и как перемещение, и как разгрузку
          acc.moving_pallets += val;
          acc.unloading += val;
          break;

        case 'unload':
          acc.unloading += val;
          break;

        case 'transfer_thu':
          acc.transfer_thu += val;
          break;

        case 'LPR':
          acc.LPR += val;
          break;

        default:
          break;
      }

      acc.operationCount += 1;
    }

    return acc;
  }, [rows]);

  // Таблица метрик + норм.часы
  type MetricRow = {
    key: keyof AggregatedMetrics | 'operationCount';
    name: string;
    value: number;
    normPerHour?: number;
    normHours?: number;
  };

  const metricsRows = useMemo<MetricRow[]>(() => {
    const list: MetricRow[] = [
      {
        key: 'shipped_pallets_lt20',
        name: 'Отгруженные паллеты (до 20 т)',
        value: aggregates.shipped_pallets_lt20,
        normPerHour: NORMS_PER_HOUR.shipped_pallets_lt20,
        normHours: aggregates.shipped_pallets_lt20 / NORMS_PER_HOUR.shipped_pallets_lt20,
      },
      {
        key: 'shipped_pallets_gt20',
        name: 'Отгруженные паллеты (20 т)',
        value: aggregates.shipped_pallets_gt20,
        normPerHour: NORMS_PER_HOUR.shipped_pallets_gt20,
        normHours: aggregates.shipped_pallets_gt20 / NORMS_PER_HOUR.shipped_pallets_gt20,
      },
      {
        key: 'unloading',
        name: 'Разгрузка',
        value: aggregates.unloading,
        normPerHour: NORMS_PER_HOUR.unloading,
        normHours: aggregates.unloading / NORMS_PER_HOUR.unloading,
      },
      {
        key: 'moving_pallets',
        name: 'Перемещение паллет',
        value: aggregates.moving_pallets,
        normPerHour: NORMS_PER_HOUR.moving_pallets,
        normHours: aggregates.moving_pallets / NORMS_PER_HOUR.moving_pallets,
      },
      {
        key: 'transfer_thu',
        name: 'Перевод ЕО в ОТМ',
        value: aggregates.transfer_thu,
        normPerHour: NORMS_PER_HOUR.transfer_thu,
        normHours: aggregates.transfer_thu / NORMS_PER_HOUR.transfer_thu,
      },
      {
        key: 'LPR',
        name: 'КТУ',
        value: aggregates.LPR,
        normPerHour: NORMS_PER_HOUR.LPR,
        normHours: aggregates.LPR / NORMS_PER_HOUR.LPR,
      },
    ];
    return list;
  }, [aggregates]);

  // Сумма нормированных часов
  const totalNormHours = useMemo(() => {
    return metricsRows.reduce((s, r) => s + (typeof r.normHours === 'number' ? r.normHours : 0), 0);
  }, [metricsRows]);

  // Производительность в %
  const productivityPct = useMemo(() => {
    const hours = Number(totalDayHours) || 0;
    if (hours <= 0) return "0.00%";
    const value = Math.max(0, (totalNormHours / hours) * 100);
    return `${value.toFixed(2)}%`;
  }, [totalNormHours, totalDayHours]);


  /* ===== события редактирования ===== */
  const onCellValueChanged = (e: CellValueChangedEvent<OperationRow>) => {
    const colId = e.column.getColId();

    if (colId === 'MetricTime' && !isISODateTimeZ(String(e.newValue))) {
      e.data.MetricTime = '';
    }
    if (!(e.data.UserNameId && e.data.UserNameId > 0)) {
      const uid = userIdRef.current || 0;
      if (uid > 0) {
        e.data.UserNameId = uid;
        e.data.UserName = { Id: uid };
      }
    }

    setRows((prev) => prev.map((r) => (r.__rowId === e.data.__rowId ? { ...e.data } : r)));
    if (colId === 'MetricName') {
      gridRef.current?.api.refreshCells({ force: true });
    }
  };

  const onCellEditingStarted = (e: CellEditingStartedEvent<OperationRow>) => {
    console.log('[onCellEditingStarted]', { rowId: e.data?.__rowId, colId: e.column.getColId(), value: e.value });
  };
  const onCellEditingStopped = (e: CellEditingStoppedEvent<OperationRow>) => {
    console.log('[onCellEditingStopped]', { rowId: e.data?.__rowId, colId: e.column.getColId(), value: e.value });
  };
  const onRowDataUpdated = (e: RowDataUpdatedEvent<OperationRow>) => {
    console.log('[onRowDataUpdated] row count =', e.api.getDisplayedRowCount());
  };

  /* ===== колонки операций ===== */
  const rightAlign: CellStyle = { textAlign: 'right' };
  const centerAlignBold: CellStyle = { textAlign: 'center', fontWeight: 600 as unknown as string | number };

  const operationColumns: ColDef<OperationRow>[] = useMemo(
    () => [
      {
        headerName: 'Действия',
        field: ActionsColId as any,
        width: 100,
        editable: false,
        pinned: 'left',
        cellRenderer: ActionsRenderer as any,
      },

      { headerName: 'ID', field: 'Id', width: 90, editable: false, filter: 'agNumberColumnFilter', sortable: true },
      { headerName: 'UserNameId', field: 'UserNameId', hide: true },

      {
        headerName: 'Метрика',
        field: 'MetricName',
        editable: (p) => !!p.data?.isNew,
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 170,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: (p: any) => ({
          values: p?.data?.isNew
            ? ['LPR', 'transfer_thu']
            : ['LPR', 'transfer_thu', 'shipped_pallets', 'transit_pallets', 'unload'],
        }),
      },
      {
        headerName: 'Значение',
        field: 'MetricValue',
        filter: 'agNumberColumnFilter',
        sortable: true,
        width: 120,
        editable: (p) => p.data?.isNew || canEditForExisting(p.data),
        valueParser: (p) => {
          const n = Number(p.newValue);
          return Number.isFinite(n) ? n : 0;
        },
        cellStyle: rightAlign,
      },
      {
        headerName: 'Shipment GID',
        field: 'ShipmentGID',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 150,
        editable: (p) => !p.data?.isNew && canEditForExisting(p.data),
      },
      {
        headerName: 'Тоннаж',
        field: 'Tonnage',
        filter: 'agNumberColumnFilter',
        sortable: true,
        width: 110,
        editable: (p) => !p.data?.isNew && canEditForExisting(p.data),
        valueParser: (p) => {
          const n = Number(p.newValue);
          return Number.isFinite(n) ? n : 0;
        },
        cellStyle: rightAlign,
      },
      {
        headerName: 'Категория тоннажа',
        field: 'TonnageCategory',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 160,
        editable: (p) => !p.data?.isNew && p.data?.MetricName === 'shipped_pallets',
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: ['<20', '>20'] },
      },
      {
        headerName: 'Паллетоместа',
        field: 'NumRefUnits',
        filter: 'agNumberColumnFilter',
        sortable: true,
        width: 130,
        editable: (p) => !p.data?.isNew && canEditForExisting(p.data),
        valueParser: (p) => {
          const n = Number(p.newValue);
          return Number.isFinite(n) ? n : 0;
        },
        cellStyle: rightAlign,
      },
      {
        headerName: 'Утилизация',
        field: 'TtlPM',
        filter: 'agNumberColumnFilter',
        sortable: true,
        width: 110,
        editable: (p) => !p.data?.isNew && canEditForExisting(p.data),
        valueParser: (p) => {
          const n = Number(p.newValue);
          return Number.isFinite(n) ? n : 0;
        },
        cellStyle: rightAlign,
      },
      {
        headerName: 'Дата операции',
        field: 'OperationDate',
        filter: 'agDateColumnFilter',
        sortable: true,
        width: 140,
        editable: false,
      },
      {
        headerName: 'Metric Time',
        field: 'MetricTime',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 170,
        editable: false,
        valueFormatter: (p) => (p.value && isISODateTimeZ(p.value) ? p.value : ''),
      },
      {
        headerName: 'Исключение',
        field: 'Exception',
        filter: 'agTextColumnFilter',
        sortable: true,
        width: 130,
        editable: false,           // правим через Switch
        cellRenderer: ExceptionRenderer as any,
        cellStyle: centerAlignBold,
      },

    ],
    []
  );

  const gridOptions: GridOptions<OperationRow> = useMemo(
    () => ({
      defaultColDef: {
        resizable: true, sortable: true, filter: true, floatingFilter: true, editable: true,
      },
      rowHeight: 40,
      suppressDragLeaveHidesColumns: true,
      getRowId: ((p) => p.data.__rowId) as GetRowIdFunc<OperationRow>,

      onCellValueChanged,
      onCellEditingStarted,
      onCellEditingStopped,
      onRowDataUpdated,

      stopEditingWhenCellsLoseFocus: true,

      context: {
        employeeName, date, employeeId,
        savingRef, setRows,
        userIdRef, unsavedRef,
      },
    }),
    [employeeName, date, employeeId]
  );

  /* ===== Заголовки для таблицы агрегатов с rowSpan по ВСЕМ строкам ===== */
  type MetricRowColDef = ColDef<MetricRow>;

  const metricsColumnDefs = useMemo<MetricRowColDef[]>(() => {
    const right: CellStyle = { textAlign: 'right' };
    const greyBg: CellStyle = { backgroundColor: '#F7F7F7' };
    const greenBg: CellStyle = { backgroundColor: '#EEF9F0' };

    // «владелец» объединённой ячейки — первая видимая строка
    const isOwner = (p: any) => p?.node?.rowIndex === 0;
    // растягиваемся на всё число видимых строк
    const fullSpan = (p: any) => (isOwner(p) ? p.api.getDisplayedRowCount() : 1);

    return [
      { headerName: 'Метрика', field: 'name', sortable: true, filter: 'agTextColumnFilter', flex: 1 },
      {
        headerName: 'Значение',
        field: 'value',
        sortable: true,
        filter: 'agNumberColumnFilter',
        width: 140,
        cellStyle: right,
        valueFormatter: (p: any) => (p.value ?? 0),
      },
      {
        headerName: 'Норма (оп/ч)',
        field: 'normPerHour',
        sortable: false,
        filter: false,
        width: 140,
        cellStyle: right,
        valueFormatter: (p: any) => (p.value ? p.value : ''),
      },
      {
        headerName: 'Норм. часы',
        field: 'normHours',
        sortable: true,
        filter: 'agNumberColumnFilter',
        width: 140,
        cellStyle: right,
        valueFormatter: (p: any) =>
          p.value != null && isFinite(p.value) ? (Math.round(p.value * 100) / 100).toFixed(2) : '',
      },

      // === ОТРАБОТАНО, ЧАСЫ — одна объединённая ячейка на весь столбец ===
      {
        headerName: 'Отработано, ч',
        field: '__workedHours' as any,
        width: 160,
        suppressMenu: true,
        sortable: false,
        filter: false,
        rowSpan: fullSpan,
        // значение — только у владельца; у прочих — undefined (ничего не рисуется)
        valueGetter: (p) => (isOwner(p) ? (Number.isFinite(totalDayHours) ? totalDayHours : 0) : undefined),
        valueFormatter: (p: any) =>
          p.value != null && isFinite(p.value) ? (Math.round(p.value * 100) / 100).toFixed(2) : '',
        cellRenderer: VertCenterRenderer as any,
        cellStyle: greyBg,
      },

      // === ПРОИЗВОДИТЕЛЬНОСТЬ, % — одна объединённая ячейка ===
      {
        headerName: 'Производительность, %',
        field: '__productivity' as any,
        width: 190,
        suppressMenu: true,
        sortable: false,
        filter: false,
        rowSpan: fullSpan,
        valueGetter: (p) => (isOwner(p) ? productivityPct : undefined),
        cellRenderer: VertCenterRenderer as any,
        cellStyle: greenBg,
      },
    ];
  }, [totalDayHours, productivityPct]);

  return (
    <Dialog open={open} onClose={onClose} keepMounted fullWidth maxWidth="lg">
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Данные по операциям для {employeeName} ({date})
          </Typography>
          <ButtonGroup variant="contained">
            <Button onClick={() => setTab('metrics')} color={tab === 'metrics' ? 'primary' : 'inherit'}>
              Агрегированные метрики
            </Button>
            <Button onClick={() => setTab('operations')} color={tab === 'operations' ? 'primary' : 'inherit'}>
              Полные операции
            </Button>
          </ButtonGroup>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ overflow: 'hidden' }}>
        {tab === 'metrics' && (
          <Box sx={{ height: 420, width: '100%' }}>
            <div className="ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
              <AgGridReact<MetricRow>
                rowData={metricsRows}
                columnDefs={metricsColumnDefs}
                // ВАЖНО: rowSpan работает надёжнее с suppressRowTransform
                gridOptions={{ suppressRowTransform: true }}
                modules={[ClientSideRowModelModule, ClientSideRowModelApiModule, TextFilterModule, NumberFilterModule]}
              />
            </div>
          </Box>
        )}

        {tab === 'operations' && (
          <Box sx={{ height: 460, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Box />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {loading && <CircularProgress size={18} />}
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddOperation}
                  disabled={savingRef.current}
                >
                  Добавить операцию
                </Button>
              </Box>
            </Box>

            <div className="ag-theme-alpine" style={{ height: 420, width: '100%' }}>
              <AgGridReact<OperationRow>
                ref={gridRef}
                rowData={rows}
                columnDefs={operationColumns as ColDef[]}
                gridOptions={gridOptions}
                modules={[
                  ClientSideRowModelModule,
                  ClientSideRowModelApiModule,
                  TextFilterModule,
                  NumberFilterModule,
                  DateFilterModule,
                ]}
                overlayNoRowsTemplate={'<span style="padding:8px;display:block;text-align:center">Нет операций</span>'}
              />
            </div>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {savingRef.current && <CircularProgress size={20} sx={{ mr: 2 }} />}
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
}
