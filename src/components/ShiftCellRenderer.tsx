import { useState } from 'react';
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
  const { shiftTypes, handleAddShift, handleUpdateShift, handleDeleteShift, bulkMode, bulkSelectedShifts, toggleBulkSelection } = props;
  const { employeeId = 0, date = '', shifts = [], operations = [], aggregatedMetrics = {} as AggregatedMetrics } = props.value || {};
  const workloadPeriods = props.data.workloadPeriods || [];
  const employeeName = props.data?.Title || 'Unknown Employee';

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [operationDialogOpen, setOperationDialogOpen] = useState(false);

  const dayOfWeek = new Date(date).getDay();
  const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;

  let fraction = 1;
  if (workloadPeriods.length > 0) {
    for (const period of workloadPeriods) {
      if (
        (!period.StartDate || period.StartDate <= date) &&
        (!period.EndDate || period.EndDate >= date)
      ) {
        fraction = period.Fraction;
      }
    }
  }
  const showFractionBlock = fraction < 1;

  return (
    <Box
      sx={{
        minHeight: 60,
        p: 0,
        display: 'flex',
        height: '100%',
        backgroundColor: isWeekend ? '#FEFCE8' : 'inherit',
      }}
    >
      {/* Левая часть: кнопка "Добавить смену" и иконка молнии */}
      <Box
        sx={{
          width: '16.66%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          flexShrink: 0,
        }}
      >
        <Button
          variant="text"
          size="small"
          sx={{ minWidth: 0, width: 24, height: 24, mb: 1 }}
          onClick={() => setAddDialogOpen(true)}
        >
          <AddIcon fontSize="small" />
        </Button>
        {aggregatedMetrics.operationCount > 0 && (
          <Button
            variant="text"
            size="small"
            sx={{ minWidth: 0, width: 24, height: 24 }}
            onClick={() => setOperationDialogOpen(true)}
          >
            <FlashOnIcon fontSize="small" sx={{ color: 'orange' }} />
          </Button>
        )}
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
        />
      </Box>
      {/* Правая часть: список смен */}
      <Scrollbars
        style={{ width: '83.33%', height: '100%' }}
        autoHide
        autoHideTimeout={1000}
        autoHideDuration={200}
        renderThumbVertical={({ style, ...props }) => (
          <div
            {...props}
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
            alignItems: 'center',
          }}
        >
          {showFractionBlock && (
            <Typography variant="caption" sx={{ color: 'gray', fontWeight: 600, mb: 1 }}>
              Доля: {Math.round(fraction * 100)}%
            </Typography>
          )}
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
  );
}