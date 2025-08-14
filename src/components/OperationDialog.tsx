// OperationDialog.tsx
import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  ForwardedRef,
  MutableRefObject,
  useMemo,
} from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  ButtonGroup,
  Box,
  Typography,
  IconButton,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';

import { AgGridReact } from 'ag-grid-react';
import type {
  ColDef,
  GridOptions,
  ICellEditorParams,
  ICellRendererParams,
  GetRowIdFunc,
} from 'ag-grid-community';

// обязательные стили AG Grid
//import 'ag-grid-community/styles/ag-grid.css';
//import 'ag-grid-community/styles/ag-theme-alpine.css';

// регистрация модулей (исправляет ошибку #200)
import { ModuleRegistry } from 'ag-grid-community';
import {
  ClientSideRowModelModule,
  ClientSideRowModelApiModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  CustomEditorModule 
} from 'ag-grid-community';

// зарегистрировать ОДИН РАЗ в приложении
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ClientSideRowModelApiModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
  CustomEditorModule 
]);

// ваши сервисы
import { createOperation, updateOperation, deleteOperation } from '../services/operationService';

// типы домена (упростил до необходимых полей)
export interface Operation {
  Id?: number;
  MetricName: string;
  MetricValue: number;
  ShipmentGID: string;
  Tonnage: number;
  NumRefUnits: number;
  TtlPM: number;
  MetricTime: string;    // HH:mm
  OperationDate: string; // YYYY-MM-DD
  Exception: boolean;
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
  aggregatedMetrics: AggregatedMetrics;
  operations: Operation[];
  date: string; // YYYY-MM-DD
  employeeName: string;
  employeeId: number;
}

// внутренняя строка грида с временным ключом
type OperationRow = Operation & {
  __rowId: string;  // стабильный ключ строки до появления реального Id
  isNew: boolean;
};

// ======================= кастомные редакторы =======================

// Select-редактор для MetricName (только для новых строк)
const SelectMetricEditor = forwardRef(function SelectMetricEditor(
  props: ICellEditorParams,
  ref: ForwardedRef<any>
) {
  const [value, setValue] = useState<string>(props.value ?? 'LPR');

  useEffect(() => {
    // автофокус на элемент <select/>
    const el = document.getElementById('metric-select-editor') as HTMLSelectElement | null;
    el?.focus();
  }, []);

  useImperativeHandle(ref, () => ({
    getValue: () => value,
  }));

  return (
    <select
      id="metric-select-editor"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      style={{ width: '100%', height: 32 }}
    >
      <option value="LPR">КТУ</option>
      <option value="transfer_thu">Перевод ЕО в ОТМ</option>
    </select>
  );
});

// числовой редактор
const NumberCellEditor = forwardRef(function NumberCellEditor(
  props: ICellEditorParams,
  ref: ForwardedRef<any>
) {
  const [value, setValue] = useState<string>(props.value != null ? String(props.value) : '');

  useEffect(() => {
    const el = document.getElementById('number-editor') as HTMLInputElement | null;
    el?.focus();
    el?.select();
  }, []);

  useImperativeHandle(ref, () => ({
    getValue: () => (value === '' ? 0 : Number(value)),
  }));

  return (
    <input
      id="number-editor"
      type="number"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      style={{ width: '100%', height: 32, boxSizing: 'border-box' }}
    />
  );
});

// текстовый редактор
const TextCellEditor = forwardRef(function TextCellEditor(
  props: ICellEditorParams,
  ref: ForwardedRef<any>
) {
  const [value, setValue] = useState<string>(props.value ?? '');

  useEffect(() => {
    const el = document.getElementById('text-editor') as HTMLInputElement | null;
    el?.focus();
    el?.select();
  }, []);

  useImperativeHandle(ref, () => ({
    getValue: () => value,
  }));

  return (
    <input
      id="text-editor"
      type="text"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      style={{ width: '100%', height: 32, boxSizing: 'border-box' }}
    />
  );
});

// редактор времени HH:mm
const TimeCellEditor = forwardRef(function TimeCellEditor(
  props: ICellEditorParams,
  ref: ForwardedRef<any>
) {
  const initial = (props.value as string) || new Date().toISOString().slice(11, 16);
  const [value, setValue] = useState<string>(initial);

  useEffect(() => {
    const el = document.getElementById('time-editor') as HTMLInputElement | null;
    el?.focus();
  }, []);

  useImperativeHandle(ref, () => ({
    getValue: () => value,
  }));

  return (
    <input
      id="time-editor"
      type="time"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      style={{ width: '100%', height: 32, boxSizing: 'border-box' }}
    />
  );
});

// ======================= ячейка действий =======================

function ActionsRenderer(props: ICellRendererParams<OperationRow>) {
  const { data, api, context } = props;
  const savingRef = context?.savingRef as MutableRefObject<boolean>;
  const employeeName: string = context.employeeName;
  const date: string = context.date;
  const employeeId: number = context.employeeId;

  const disabled = !!savingRef?.current;

  const onSave = async () => {
    if (!data) return;

    if (!data.MetricName) {
      alert('Не выбрана метрика');
      return;
    }
    if (data.MetricValue == null || Number(data.MetricValue) <= 0) {
      alert('Заполните корректное значение (больше 0)');
      return;
    }

    try {
      if (savingRef) savingRef.current = true;

      if (data.isNew) {
        // создание
        const newId = await createOperation({
          Title: `Операция ${data.MetricName} для ${employeeName} на ${date}`,
          UserName: { Id: employeeId },
          MetricName: data.MetricName,
          MetricValue: data.MetricValue,
          OperationDate: data.OperationDate,
          MetricTime: data.MetricTime,
          ShipmentGID: data.ShipmentGID,
          Tonnage: data.Tonnage,
          NumRefUnits: data.NumRefUnits,
          TtlPM: data.TtlPM,
          Exception: data.Exception,
        });

        // обновляем ТУ ЖЕ ссылкой (важно для избежания #5)
        data.Id = newId;
        data.isNew = false;
        data.__rowId = `op-${newId}`;

        api.applyTransaction({ update: [data] });
      } else {
        // обновление
        await updateOperation(data.Id!, {
          MetricName: data.MetricName,
          MetricValue: data.MetricValue,
          MetricTime: data.MetricTime,
          ShipmentGID: data.ShipmentGID,
          Tonnage: data.Tonnage,
          NumRefUnits: data.NumRefUnits,
          TtlPM: data.TtlPM,
          Exception: data.Exception,
          OperationDate: data.OperationDate,
        });

        api.applyTransaction({ update: [data] });
      }
    } catch (e) {
      console.error('Ошибка при сохранении операции', e);
      alert('Ошибка при сохранении операции');
    } finally {
      if (savingRef) savingRef.current = false;
    }
  };

  const onDelete = async () => {
    if (!data) return;

    if (!data.isNew && !confirm('Удалить операцию?')) return;

    try {
      if (savingRef) savingRef.current = true;

      if (!data.isNew && data.Id) {
        await deleteOperation(data.Id);
      }
      api.applyTransaction({ remove: [data] });
    } catch (e) {
      console.error('Ошибка при удалении операции', e);
      alert('Ошибка при удалении операции');
    } finally {
      if (savingRef) savingRef.current = false;
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
      <Button
        size="small"
        variant="contained"
        startIcon={<SaveIcon />}
        onClick={onSave}
        disabled={disabled}
      >
        Сохранить
      </Button>
      <IconButton size="small" onClick={onDelete} disabled={disabled}>
        <DeleteIcon />
      </IconButton>
    </Box>
  );
}

// ======================= основной компонент =======================

export default function OperationDialog({
  open,
  onClose,
  aggregatedMetrics,
  operations,
  date,
  employeeName,
  employeeId,
}: OperationDialogProps) {
  const gridRef = useRef<AgGridReact<OperationRow>>(null);
  const savingRef = useRef<boolean>(false);
  const tmpIdRef = useRef<number>(1);

  const [tab, setTab] = useState<'metrics' | 'operations'>('metrics');
  const [initialRows, setInitialRows] = useState<OperationRow[]>([]);

  // преобразуем входной массив операций в строки грида с постоянными ключами
  useEffect(() => {
    const rows: OperationRow[] = (operations || []).map((op) => ({
      ...op,
      __rowId: op.Id ? `op-${op.Id}` : `tmp-${tmpIdRef.current++}`,
      isNew: !op.Id,
    }));
    setInitialRows(rows);
  }, [operations]);

  // генератор новой строки
  const makeNewRow = (): OperationRow => ({
    __rowId: `tmp-${tmpIdRef.current++}`,
    Id: undefined,
    MetricName: 'LPR',
    MetricValue: 0,
    ShipmentGID: '',
    Tonnage: 0,
    NumRefUnits: 0,
    TtlPM: 0,
    MetricTime: new Date().toISOString().slice(11, 16),
    OperationDate: date,
    Exception: false,
    isNew: true,
  });

  // Добавить новую строку
  const handleAddOperation = () => {
    const newRow = makeNewRow();
    gridRef.current?.api.applyTransaction({ add: [newRow], addIndex: 0 });
    // авто-редактирование первой ячейки
    setTimeout(() => {
      gridRef.current?.api.startEditingCell({
        rowIndex: 0,
        colKey: 'MetricName',
      });
    }, 0);
  };

  // ===== столбцы агрегированных метрик (левая вкладка) =====
  const metricsColumns: ColDef[] = useMemo(
    () => [
      { headerName: 'Метрика', field: 'name', sortable: true, filter: 'agTextColumnFilter' },
      {
        headerName: 'Значение',
        field: 'value',
        sortable: true,
        filter: 'agNumberColumnFilter',
        cellStyle: { textAlign: 'right' },
      },
    ],
    []
  );

  const metricsRows = useMemo(
    () => [
      { name: 'Отгруженные паллеты (до 20 т)', value: aggregatedMetrics.shipped_pallets_lt20 },
      { name: 'Отгруженные паллеты (20 т)', value: aggregatedMetrics.shipped_pallets_gt20 },
      { name: 'Разгрузка', value: aggregatedMetrics.unloading },
      { name: 'Перемещение паллет', value: aggregatedMetrics.moving_pallets },
      { name: 'Перевод ЕО в ОТМ', value: aggregatedMetrics.transfer_thu },
      { name: 'КТУ', value: aggregatedMetrics.LPR },
      { name: 'Количество операций', value: aggregatedMetrics.operationCount },
    ],
    [aggregatedMetrics]
  );

  // ===== столбцы операций (правая вкладка) =====
  const operationColumns: ColDef<OperationRow>[] = useMemo(
  () => [
    { headerName: 'ID', field: 'Id', width: 100, editable: false, filter: 'agNumberColumnFilter', sortable: true },
    { headerName: 'Метрика', field: 'MetricName', editable: (p) => p.data?.isNew === true, filter: 'agTextColumnFilter', sortable: true, width: 160, cellEditor: 'selectMetricEditor' },
    { headerName: 'Значение', field: 'MetricValue', filter: 'agNumberColumnFilter', sortable: true, width: 130, editable: (p) => p.data?.MetricName === 'LPR' || p.data?.MetricName === 'transfer_thu', cellEditor: 'numberCellEditor' },
    { headerName: 'Shipment GID', field: 'ShipmentGID', filter: 'agTextColumnFilter', sortable: true, width: 160, editable: true, cellEditor: 'textCellEditor' },
    { headerName: 'Тоннаж', field: 'Tonnage', filter: 'agNumberColumnFilter', sortable: true, width: 120, editable: true, cellEditor: 'numberCellEditor' },
    { headerName: 'Паллетоместа', field: 'NumRefUnits', filter: 'agNumberColumnFilter', sortable: true, width: 140, editable: true, cellEditor: 'numberCellEditor' },
    { headerName: 'Утилизация', field: 'TtlPM', filter: 'agNumberColumnFilter', sortable: true, width: 120, editable: true, cellEditor: 'numberCellEditor' },
    { headerName: 'Дата операции', field: 'OperationDate', filter: 'agDateColumnFilter', sortable: true, width: 150, editable: false },
    { headerName: 'Время метрики', field: 'MetricTime', filter: 'agTextColumnFilter', sortable: true, width: 140, editable: true, cellEditor: 'timeCellEditor' },
    {
      headerName: 'Исключение',
      field: 'Exception',
      filter: 'agTextColumnFilter',
      sortable: true,
      width: 120,
      editable: true,
      cellEditor: 'textCellEditor',
      valueFormatter: (p) => (p.value ? 'Да' : 'Нет'),
      valueParser: (p) => {
        const val = String(p.newValue).trim().toLowerCase();
        return val === 'true' || val === 'да' || val === '1';
      },
    },
    {
      headerName: 'Действия',
      field: undefined,
      width: 220,
      editable: false,
      cellRenderer: ActionsRenderer,
    },
  ],
  []
);


  // grid options: НЕТ applyTransaction в onCellEditingStopped => нет #5
  const gridOptions: GridOptions<OperationRow> = useMemo(
    () => ({
      defaultColDef: {
        resizable: true,
        sortable: true,
        filter: true,
        floatingFilter: true,
        editable: true,
      },
      rowHeight: 40,
      suppressDragLeaveHidesColumns: true,
      // важный ключ: используем реальный Id, если он есть; иначе временный __rowId
      getRowId: ((p) => (p.data.Id ? `op-${p.data.Id}` : p.data.__rowId)) as GetRowIdFunc<OperationRow>,
      // НЕ обновляем через update на стопе, просто пусть грид держит изменения в data
      stopEditingWhenCellsLoseFocus: true,
      context: {
        employeeName,
        date,
        employeeId,
        savingRef,
      },
    }),
    [employeeName, date, employeeId]
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Данные по операциям для {employeeName} ({date})
          </Typography>
          <ButtonGroup variant="contained">
            <Button
              onClick={() => setTab('metrics')}
              color={tab === 'metrics' ? 'primary' : 'inherit'}
            >
              Агрегированные метрики
            </Button>
            <Button
              onClick={() => setTab('operations')}
              color={tab === 'operations' ? 'primary' : 'inherit'}
            >
              Полные операции
            </Button>
          </ButtonGroup>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ overflow: 'hidden' }}>
        {tab === 'metrics' && (
          <Box sx={{ height: 400, width: '100%' }}>
            <div className="ag-theme-alpine" style={{ height: '100%', width: '100%' }}>
              <AgGridReact
                rowData={metricsRows}
                columnDefs={metricsColumns}
                modules={[
                  ClientSideRowModelModule,
                  ClientSideRowModelApiModule,
                  TextFilterModule,
                  NumberFilterModule,
                ]}
              />
            </div>
          </Box>
        )}

        {tab === 'operations' && (
          <Box sx={{ height: 460, width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddOperation}
                disabled={savingRef.current}
              >
                Добавить операцию (LPR/Перевод ЕО в ОТМ)
              </Button>
            </Box>

            <div className="ag-theme-alpine" style={{ height: 420, width: '100%' }}>
              <AgGridReact<OperationRow>
                ref={gridRef}
                rowData={initialRows}
                columnDefs={operationColumns as ColDef[]}
                gridOptions={gridOptions}
                modules={[
                  ClientSideRowModelModule,
                  ClientSideRowModelApiModule,
                  TextFilterModule,
                  NumberFilterModule,
                  DateFilterModule,
                ]}
                components={{
                  selectMetricEditor: SelectMetricEditor,
                  numberCellEditor: NumberCellEditor,
                  textCellEditor: TextCellEditor,
                  timeCellEditor: TimeCellEditor,
                }}
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
