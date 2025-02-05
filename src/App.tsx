// src/App.tsx
import  { useEffect, useState } from 'react';
import TimeSheet from './components/TimeSheet';
import { ensureEmployeesListExists } from './services/userService';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button
} from '@mui/material';
import './App.css';

function App() {
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    ensureEmployeesListExists()
      .then(() => {
        console.log("Проверка списка 'Employees' завершена успешно");
      })
      .catch((error) => {
        console.error("Ошибка при проверке/создании списка 'Employees':", error);
        // Если ошибка, можно отобразить диалог с предложением создать список вручную
        setOpenDialog(true);
      });
  }, []);

  return (
    <>
      <TimeSheet />
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Список сотрудников не найден</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Список "Employees" не найден на сайте SharePoint. Создать список вручную?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Отмена
          </Button>
          <Button
            onClick={() => {
              // Здесь можно добавить альтернативную логику создания списка вручную
              console.log('Попытка создать список "Employees" вручную');
              setOpenDialog(false);
            }}
            color="primary"
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default App;
