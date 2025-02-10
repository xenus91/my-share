import { useEffect, useState } from 'react';
import TimeSheet from './components/TimeSheet';
import { ensureEmployeesListExists, ensureWorkloadPeriodsListExists, ensureShiftTypeListExists } from './services/listCheck';
import {
  Dialog,
  DialogContent,
  Typography,
  LinearProgress,
  Box
} from '@mui/material';
import './App.css';

function App() {
  const [openDialog, setOpenDialog] = useState(true);
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    Promise.all([ensureEmployeesListExists(), ensureWorkloadPeriodsListExists(), ensureShiftTypeListExists()])
      .then(() => {
        setStatus("done");
        setTimeout(() => setOpenDialog(false), 1500);
      })
      .catch((error) => {
        // Если код ошибки = 500 — не показываем ошибку
        if (error?.response?.status === 500) {
          console.warn("Получен статус 500, но не отображаем ошибку.");
          setStatus("done");
          setTimeout(() => setOpenDialog(false), 1500);
        } else {
          console.error("Ошибка при проверке/создании списков:", error);
          setStatus("error");
        }
      });
  }, []);
  
  return (
    <>
      <TimeSheet />
      <Dialog open={openDialog}>
        <DialogContent>
          {status === "loading" && (
            <Box sx={{ minWidth: 300 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Настраиваем списки, пожалуйста подождите
              </Typography>
              <LinearProgress />
            </Box>
          )}
          {status === "done" && (
            <Typography variant="body1" sx={{ minWidth: 300 }}>
              Все готово :)
            </Typography>
          )}
          {status === "error" && (
            <Typography variant="body1" color="error" sx={{ minWidth: 300 }}>
              Произошла ошибка при настройке списков
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default App;
