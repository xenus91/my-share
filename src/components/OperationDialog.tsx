import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Operation, AggregatedMetrics } from '../types';
import { format } from 'date-fns';

interface OperationDialogProps {
  open: boolean;
  onClose: () => void;
  aggregatedMetrics: AggregatedMetrics;
  operations: Operation[];
  date: string;
  employeeName: string;
}

export default function OperationDialog({
  open,
  onClose,
  aggregatedMetrics,
  operations,
  date,
  employeeName,
}: OperationDialogProps) {
  const [tab, setTab] = useState<'metrics' | 'operations'>('metrics');

  const handleTabChange = (event: React.SyntheticEvent, newValue: 'metrics' | 'operations') => {
    setTab(newValue);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        Данные по операциям для {employeeName} ({date})
      </DialogTitle>
      <DialogContent>
        <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Агрегированные метрики" value="metrics" />
          <Tab label="Полные операции" value="operations" />
        </Tabs>
        {tab === 'metrics' && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Метрика</TableCell>
                  <TableCell align="right">Значение</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Отгруженные паллеты (до 20 т)</TableCell>
                  <TableCell align="right">{aggregatedMetrics.shipped_pallets_lt20}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Отгруженные паллеты (20 т)</TableCell>
                  <TableCell align="right">{aggregatedMetrics.shipped_pallets_gt20}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Разгрузка</TableCell>
                  <TableCell align="right">{aggregatedMetrics.unloading}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Перемещение паллет</TableCell>
                  <TableCell align="right">{aggregatedMetrics.moving_pallets}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Перевод ЕО в ОТМ</TableCell>
                  <TableCell align="right">{aggregatedMetrics.transfer_thu}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>КТУ</TableCell>
                  <TableCell align="right">{aggregatedMetrics.LPR}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {tab === 'operations' && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Название</TableCell>
                  <TableCell>Метрика</TableCell>
                  <TableCell>Значение</TableCell>
                  <TableCell>Дата операции</TableCell>
                  <TableCell>Время метрики</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {operations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Нет операций
                    </TableCell>
                  </TableRow>
                ) : (
                  operations.map((op) => (
                    <TableRow key={op.Id}>
                      <TableCell>{op.Id}</TableCell>
                      <TableCell>{op.Title}</TableCell>
                      <TableCell>{op.MetricName}</TableCell>
                      <TableCell>{op.MetricValue}</TableCell>
                      <TableCell>{format(new Date(op.OperationDate), 'dd.MM.yyyy')}</TableCell>
                      <TableCell>{op.MetricTime}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
}