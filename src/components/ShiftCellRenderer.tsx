import { useState, useMemo } from 'react';
import type { ICellRendererParams } from 'ag-grid-community';
import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import { Shift, ShiftTypeDefinition, Operation, AggregatedMetrics } from '../types';
import { ShiftCard } from './ShiftCard';
import { ShiftDialog } from './ShiftDialog';
import OperationDialog from './OperationDialog';
import { Scrollbars } from 'react-custom-scrollbars-2';

interface ExtraCellRendererParams {
  shiftTypes: ShiftTypeDefinition[];
  handleAddShift: (employeeId: number, date: string, shiftData: Omit<Shift, 'ID'>) => void;
  handleUpdateShift: (
    employeeId: number,
    date: string,
    shiftId: number,
    shiftData: Omit<Shift, 'ID'>
  ) => void;
  handleDeleteShift: (employeeId: number, date: string, shiftId: number) => void;
  bulkMode: boolean;
  bulkSelectedShifts: { employeeId: number; date: string; shiftId: number }[];
  toggleBulkSelection: (employeeId: number, date: string, shiftId: number) => void;
}

export function ShiftCellRenderer(
  props: ICellRendererParams & ExtraCellRendererParams
) {
  const {
    shiftTypes,
    handleAddShift,
    handleUpdateShift,
    handleDeleteShift,
    bulkMode,
    bulkSelectedShifts,
    toggleBulkSelection,
  } = props;

  const {
    employeeId = 0,                    // это ID элемента "сотрудника" (НЕ SP user!)
    date = '',
    shifts = [],
    operations = [] as Operation[],
    aggregatedMetrics = {} as AggregatedMetrics,
  } = props.value || {};

  const workloadPeriods = props.data.workloadPeriods || [];
  const employeeName = props.data?.Title || 'Unknown Employee';

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [operationDialogOpen, setOperationDialogOpen] = useState(false);

  // --- КРИТИЧЕСКОЕ: определяем SharePoint UserName/Id для фильтра OperationDialog
  const spUserId = useMemo(() => {
    // Пытаемся взять из строки сотрудника разные варианты полей
    const fromRow =
      (props.data?.UserNameId as number | undefined) ||
      (props.data?.UserId as number | undefined) ||
      (props.data?.User?.Id as number | undefined) ||
      (props.data?.UserName?.Id as number | undefined);

    // Если в текущих операциях уже есть UserName.Id — берём его
    const fromOps = operations?.find(op => Number(op?.UserName?.Id) > 0)?.UserName?.Id;

    // Фоллбек — ничего не нашли: пусть будет 0
    return Number(fromRow || fromOps || 0) || 0;
  }, [props.data, operations]);

  // суммарные часы за день (без помеченных к удалению)
  const totalDayHours = useMemo(
    () =>
      (shifts || []).reduce((sum, sh) => {
        if (sh?.MarkedForDeletion) return sum;
        const h = Number(sh?.Hours) || 0;
        return sum + h;
      }, 0),
    [shifts]
  );

  // выходной фон
  const dayOfWeek = new Date(date).getDay();
  const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;

  // доля занятости
  const fraction = useMemo(() => {
    if (!workloadPeriods?.length) return 1;
    for (const period of workloadPeriods) {
      if (
        (!period.StartDate || period.StartDate <= date) &&
        (!period.EndDate || period.EndDate >= date)
      ) {
        return period.Fraction ?? 1;
      }
    }
    return 1;
  }, [workloadPeriods, date]);

  const showFractionBlock = fraction < 1;

  // ===== производительность по агрегатам =====
  const totalNormHours = useMemo(() => {
    const a = aggregatedMetrics || ({} as AggregatedMetrics);
    const lt20 = Number(a.shipped_pallets_lt20 || 0) / 20;
    const gt20 = Number(a.shipped_pallets_gt20 || 0) / 25;
    const unloading = Number(a.unloading || 0) / 50;
    const moving = Number(a.moving_pallets || 0) / 25;
    const transfer = Number(a.transfer_thu || 0) / 25;
    const lpr = Number(a.LPR || 0) / 1;
    const sum = lt20 + gt20 + unloading + moving + transfer + lpr;
    return Number.isFinite(sum) ? sum : 0;
  }, [aggregatedMetrics]);

  const productivityNum = useMemo(() => {
    const hours = Number(totalDayHours) || 0;
    if (hours <= 0) return 0;
    return Math.max(0, (totalNormHours / hours) * 100);
  }, [totalNormHours, totalDayHours]);

  const productivityText = useMemo(() => `${productivityNum.toFixed(2)}%`, [productivityNum]);

  // плавный фон от красного → жёлтый → зелёный
  const perfColors = useMemo(() => {
    const p = Math.max(0, Math.min(100, productivityNum)); // clamp
    const hue = (p / 100) * 120; // 0 (красный) .. 120 (зелёный)
    return {
      bg: `hsl(${hue} 85% 90%)`,
      border: `1px solid hsl(${hue} 60% 70%)`,
      text: `hsl(${hue} 35% 25%)`,
    };
  }, [productivityNum]);

  const hasOperations = (aggregatedMetrics?.operationCount || 0) > 0;

  return (
    <Box
      sx={{
        minHeight: 60,
        p: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: isWeekend ? '#FEFCE8' : 'inherit',
      }}
    >
      {/* ВЕРХНЯЯ СЕКЦИЯ: плюс + список смен */}
      <Box sx={{ flex: 1, display: 'flex', gap: 1, overflow: 'hidden' }}>
        {/* левая узкая колонка */}
        <Box
          sx={{
            width: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            pt: 0.5,
            flexShrink: 0,
          }}
        >
          <Button
            variant="text"
            size="small"
            sx={{ minWidth: 0, width: 24, height: 24, mb: 1 }}
            onClick={() => setAddDialogOpen(true)}
            title="Добавить смену"
          >
            <AddIcon fontSize="small" />
          </Button>

          {showFractionBlock && (
            <Typography
              variant="caption"
              sx={{ color: 'gray', fontWeight: 600, textAlign: 'center' }}
            >
              {Math.round(fraction * 100)}%
            </Typography>
          )}
        </Box>

        {/* список смен со скроллом */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Scrollbars
            style={{ width: '100%', height: '100%' }}
            autoHide
            autoHideTimeout={1000}
            autoHideDuration={200}
            renderThumbVertical={({ style, ...scrollProps }) => (
              <div
                {...scrollProps}
                style={{
                  ...style,
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: 4,
                  width: 4,
                  marginRight: 2,
                }}
              />
            )}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                pr: 0.5,
                py: 0.5,
              }}
            >
              {shifts.map((shift: Shift) => (
                <ShiftCard
                  key={shift.ID}
                  shift={shift}
                  shiftTypes={shiftTypes}
                  employeeId={employeeId.toString()}
                  date={date}
                  onUpdateShift={(data) => handleUpdateShift(employeeId, date, shift.ID, data)}
                  onDeleteShift={(shiftId) => handleDeleteShift(employeeId, date, Number(shiftId))}
                  bulkMode={bulkMode}
                  isBulkSelected={
                    bulkMode &&
                    bulkSelectedShifts.some(
                      (item) =>
                        item.employeeId === employeeId &&
                        item.date === date &&
                        item.shiftId === shift.ID
                    )
                  }
                  onToggleBulkSelection={() => toggleBulkSelection(employeeId, date, shift.ID)}
                />
              ))}
            </Box>
          </Scrollbars>
        </Box>
      </Box>

      {/* НИЖНЯЯ СЕКЦИЯ: кликабельная плашка производительности с жёлтой молнией, без разделителей */}
      <Box
        sx={{
          mt: 0.5,
          px: 0.5,
          pb: 0.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 1,
        }}
      >
        {hasOperations && (
          <Button
            onClick={() => setOperationDialogOpen(true)}
            title="Операции и агрегаты"
            sx={{
              minWidth: 0,
              px: 1.25,
              py: 0.5,
              borderRadius: 2,
              backgroundColor: perfColors.bg,
              color: perfColors.text,
              border: perfColors.border,
              fontWeight: 700,
              fontSize: '14px',
              lineHeight: 1.2,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: perfColors.bg,
                filter: 'brightness(0.98)',
              },
            }}
          >
            {/* МОЛНИЯ ВСЕГДА ЖЁЛТАЯ */}
            <FlashOnIcon fontSize="small" sx={{ color: 'gold' }} />
            {productivityText}
          </Button>
        )}
      </Box>

      {/* Диалоги */}
      <ShiftDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        employeeId={employeeId}
        date={date}
        shiftTypes={shiftTypes}
        onSave={(shiftData) => {
          handleAddShift(employeeId, date, shiftData);
          setAddDialogOpen(false);
        }}
      />

      <OperationDialog
        open={operationDialogOpen}
        onClose={() => setOperationDialogOpen(false)}
        aggregatedMetrics={aggregatedMetrics}
        operations={operations}
        date={date}
        employeeName={employeeName}
        employeeId={spUserId || 0}    // <<< ВАЖНО: передаём SharePoint UserName/Id, а не employeeId
        totalDayHours={totalDayHours}
      />
    </Box>
  );
}
