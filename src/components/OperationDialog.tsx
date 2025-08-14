import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  ButtonGroup,
  TextField,
  MenuItem,
  FormControl,
  Select,
  Box,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, GridOptions, ICellEditorParams, ICellRendererParams } from 'ag-grid-community';
import { ModuleRegistry } from 'ag-grid-community';
import {
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
} from 'ag-grid-community';
import { format } from 'date-fns';
import { Operation, AggregatedMetrics } from '../types';
//import { createOperation } from '../services/operationService';

// Регистрируем модули AgGrid
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  TextFilterModule,
  NumberFilterModule,
  DateFilterModule,
]);

interface OperationDialogProps {
  open: boolean;
  onClose: () => void;
  aggregatedMetrics: AggregatedMetrics;
  operations: Operation[];
  date: string;
  employeeName: string;
  employeeId: number;
}

interface NewOperation {
  Id?: number;
  MetricName: string;
  MetricValue: number;
  ShipmentGID: string;
  Tonnage: number;
  NumRefUnits: number;
  TtlPM: number;
  MetricTime: string;
  OperationDate: string;
  isNew?: boolean;
}

// Кастомный редактор для Select
const SelectCellEditor = React.forwardRef((props: ICellEditorParams, ref) => {
  const [value, setValue] = useState(props.value || '');

  React.useImperativeHandle(ref, () => ({
    getValue: () => value,
  }));

  return (
    <FormControl fullWidth>
      <Select
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          props.stopEditing();
        }}
        autoFocus
        size="small"
      >
        <MenuItem value="shipped_pallets_lt20">Отгруженные паллеты (до 20 т)</MenuItem>
        <MenuItem value="shipped_pallets_gt20">Отгруженные паллеты (20 т)</MenuItem>
        <MenuItem value="unloading">Разгрузка</MenuItem>
        <MenuItem value="moving_pallets">Перемещение паллет</MenuItem>
        <MenuItem value="transfer_thu">Перевод ЕО в ОТМ</MenuItem>
        <MenuItem value="LPR">КТУ</MenuItem>
      </Select>
    </FormControl>
  );
});

// Кастомный редактор для TextField
const TextFieldCellEditor = React.forwardRef((props: ICellEditorParams, ref) => {
  const [value, setValue] = useState(props.value || '');

  React.useImperativeHandle(ref, () => ({
    getValue: () => value,
  }));

  return (
    <TextField
      value={value}
      onChange={(e) => setValue(e.target.value)}
      autoFocus
      fullWidth
      variant="outlined"
      size="small"
    />
  );
});

// Кастомный редактор для числовых полей
const NumberCellEditor = React.forwardRef((props: ICellEditorParams, ref) => {
  const [value, setValue] = useState(props.value || '');

  React.useImperativeHandle(ref, () => ({
    getValue: () => parseFloat(value) || 0,
  }));

  return (
    <TextField
      type="number"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      autoFocus
      fullWidth
      variant="outlined"
      size="small"
    />
  );
});

// Рендерер для кнопки "Сохранить"
const SaveButtonRenderer = (props: ICellRendererParams) => {
  const { data, api } = props;
  if (!data.isNew) return null;

  const handleSave = async () => {
    // Проверяем обязательные поля
    if (!data.MetricName || data.MetricValue <= 0) {
      alert('Пожалуйста, заполните обязательные поля: Название метрики и Значение');
      return;
    }

    // Завершаем редактирование
    api.stopEditing();

    try {
      const newId = await createOperation({
        Title: `Операция для ${props.context.employeeName} на ${props.context.date}`,
        MetricName: data.MetricName,
        MetricValue: data.MetricValue,
        OperationDate: data.OperationDate,
        MetricTime: data.MetricTime,
        ShipmentGID: data.ShipmentGID,
        Tonnage: data.Tonnage,
        NumRefUnits: data.NumRefUnits,
        TtlPM: data.TtlPM,
        UserName: { Id: props.context.employeeId },
      });
      // Обновляем строку с новым ID и убираем флаг isNew
      api.applyTransaction({
        update: [{ ...data, Id: newId, isNew: false }],
      });
      console.log('✅ Новая операция добавлена:', newId);
    } catch (error) {
      console.error('❌ Ошибка при добавлении операции:', error);
      alert('Ошибка при сохранении операции');
    }
  };

  return (
    <Button
      variant="contained"
      size="small"
      startIcon={<SaveIcon />}
      onClick={handleSave}
      sx={{ m: 1 }}
    >
      Сохранить
    </Button>
  );
};

export default function OperationDialog({
  open,
  onClose,
  aggregatedMetrics,
  operations,
  date,
  employeeName,
  employeeId,
}: OperationDialogProps) {
  const [tab, setTab] = useState<'metrics' | 'operations'>('metrics');
  const [rowData, setRowData] = useState<NewOperation[]>(operations);
  const gridRef = useRef<AgGridReact>(null);

  const handleTabChange = (newTab: 'metrics' | 'operations') => {
    setTab(newTab);
  };

  const handleAddOperation = useCallback(() => {
    const newRow: NewOperation = {
      MetricName: '',
      MetricValue: 0,
      ShipmentGID: '',
      Tonnage: 0,
      NumRefUnits: 0,
      TtlPM: 0,
      MetricTime: '',
      OperationDate: date,
      isNew: true,
    };
    setRowData([newRow, ...rowData]);
    gridRef.current?.api?.applyTransaction({ add: [newRow], addIndex: 0 });
    // Запускаем редактирование первой колонки
    setTimeout(() => {
      gridRef.current?.api?.startEditingCell({
        rowIndex: 0,
        colKey: 'MetricName',
      });
    }, 0);
  }, [rowData, date]);

  // Колонки для таблицы агрегированных метрик
  const metricsColumns: ColDef[] = [
    {
      headerName: 'Метрика',
      field: 'name',
      filter: 'agTextColumnFilter',
      sortable: true,
      width: 250,
    },
    {
      headerName: 'Значение',
      field: 'value',
      filter: 'agNumberColumnFilter',
      sortable: true,
      width: 150,
      cellStyle: { textAlign: 'right' },
    },
  ];

  // Данные для таблицы агрегированных метрик
  const metricsRows = [
    { name: 'Отгруженные паллеты (до 20 т)', value: aggregatedMetrics.shipped_pallets_lt20 },
    { name: 'Отгруженные паллеты (20 т)', value: aggregatedMetrics.shipped_pallets_gt20 },
    { name: 'Разгрузка', value: aggregatedMetrics.unloading },
    { name: 'Перемещение паллет', value: aggregatedMetrics.moving_pallets },
    { name: 'Перевод ЕО в ОТМ', value: aggregatedMetrics.transfer_thu },
    { name: 'КТУ', value: aggregatedMetrics.LPR },
    { name: 'Количество операций', value: aggregatedMetrics.operationCount },
  ];

  // Колонки для таблицы операций
  const operationsColumns: ColDef[] = [
    {
      headerName: 'ID',
      field: 'Id',
      filter: 'agNumberColumnFilter',
      sortable: true,
      width: 100,
      editable: false,
    },
    {
      headerName: 'Метрика',
      field: 'MetricName',
      filter: 'agTextColumnFilter',
      sortable: true,
      width: 150,
      editable: (params) => params.data.isNew,
      cellEditor: SelectCellEditor,
      cellEditorPopup: false,
    },
    {
      headerName: 'Значение',
      field: 'MetricValue',
      filter: 'agNumberColumnFilter',
      sortable: true,
      width: 120,
      editable: (params) => params.data.isNew,
      cellEditor: NumberCellEditor,
    },
    {
      headerName: 'Транспортировка',
      field: 'ShipmentGID',
      filter: 'agTextColumnFilter',
      sortable: true,
      width: 150,
      editable: (params) => params.data.isNew,
      cellEditor: TextFieldCellEditor,
    },
    {
      headerName: 'Тоннаж',
      field: 'Tonnage',
      filter: 'agNumberColumnFilter',
      sortable: true,
      width: 120,
      editable: (params) => params.data.isNew,
      cellEditor: NumberCellEditor,
    },
    {
      headerName: 'Паллетоместа',
      field: 'NumRefUnits',
      filter: 'agNumberColumnFilter',
      sortable: true,
      width: 120,
      editable: (params) => params.data.isNew,
      cellEditor: NumberCellEditor,
    },
    {
      headerName: 'Утилизация',
      field: 'TtlPM',
      filter: 'agNumberColumnFilter',
      sortable: true,
      width: 120,
      editable: (params) => params.data.isNew,
      cellEditor: NumberCellEditor,
    },
    {
      headerName: 'Дата операции',
      field: 'OperationDate',
      filter: 'agDateColumnFilter',
      sortable: true,
      width: 150,
      valueFormatter: (params) => format(new Date(params.value), 'dd.MM.yyyy'),
      editable: false,
    },
    {
      headerName: 'Время метрики',
      field: 'MetricTime',
      filter: 'agTextColumnFilter',
      sortable: true,
      width: 120,
      editable: (params) => params.data.isNew,
      cellEditor: TextFieldCellEditor,
    },
    {
      headerName: 'Действия',
      field: 'actions',
      width: 150,
      cellRenderer: SaveButtonRenderer,
      editable: false,
      cellStyle: { display: 'flex', alignItems: 'center' },
    },
  ];

  const gridOptions: GridOptions = {
    defaultColDef: {
      resizable: true,
      sortable: true,
      filter: true,
      floatingFilter: true,
    },
    rowHeight: 40,
    suppressDragLeaveHidesColumns: true,
    context: { employeeName, date, employeeId },
    getRowStyle: (params) => {
      if (params.data.isNew) {
        return { background: '#e6f7fa' }; // Выделяем новую строку светло-голубым цветом
      }
      return undefined;
    },
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Данные по операциям для {employeeName} ({date})
          </Typography>
          <ButtonGroup variant="contained" aria-label="outlined primary button group">
            <Button
              onClick={() => handleTabChange('metrics')}
              color={tab === 'metrics' ? 'primary' : 'inherit'}
            >
              Агрегированные метрики
            </Button>
            <Button
              onClick={() => handleTabChange('operations')}
              color={tab === 'operations' ? 'primary' : 'inherit'}
            >
              Полные операции
            </Button>
          </ButtonGroup>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ overflow: 'hidden' }}>
        {tab === 'metrics' && (
          <Box sx={{ height: '400px', width: '100%' }}>
            <AgGridReact
              ref={gridRef}
              rowData={metricsRows}
              columnDefs={metricsColumns}
              gridOptions={gridOptions}
              modules={[ClientSideRowModelModule, TextFilterModule, NumberFilterModule]}
            />
          </Box>
        )}
        {tab === 'operations' && (
          <Box sx={{ height: '400px', width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddOperation}
              >
                Добавить операцию
              </Button>
            </Box>
            <AgGridReact
              ref={gridRef}
              rowData={rowData}
              columnDefs={operationsColumns}
              gridOptions={gridOptions}
              modules={[ClientSideRowModelModule, TextFilterModule, NumberFilterModule, DateFilterModule]}
              noRowsOverlayComponent={() => (
                <Typography align="center" sx={{ p: 2 }}>
                  Нет операций
                </Typography>
              )}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
}