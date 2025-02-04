// App.tsx
import  { useState, useEffect } from 'react';
import TimeSheet from './components/TimeSheet';
import { API_BASE_URL } from '../config';
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
  // Состояние для открытия диалога, если список "Employees" не найден
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    // Выполняем запрос к API SharePoint для получения списка "Employees"
    fetch(`${API_BASE_URL}/web/lists/GetByTitle('DcEmail')`, {
      headers: {
        Accept: 'application/json;odata=verbose'
      }
    })
      .then((response) => {
        console.log('Response:', response);
        if (!response.ok) {
          // Если статус не OK (например, 404), считаем, что список не найден
          setOpenDialog(true);
        }
        return response.json();
      })
      .then((data) => {
        console.log('Data:', data);
      })
      .catch((error) => {
        console.error('Error:', error);
        // В случае ошибки тоже показываем диалог
        setOpenDialog(true);
      });
  }, []);

  return (
    <>
      <TimeSheet />
      
      {/* Диалог, который показывается, если список "Employees" не найден */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Список сотрудников не найден</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Список "Employees" не найден на сайте SharePoint. Создать список?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Отмена
          </Button>
          <Button
            onClick={() => {
              // Здесь можно добавить логику создания списка через API
              console.log('Создать список "Employees"');
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
