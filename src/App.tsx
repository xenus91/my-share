import  { useEffect, useState } from "react";
import TimeSheet from "./components/TimeSheet";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { lightTheme, darkTheme } from "./theme";
import ThemeToggle from "./components/ThemeToggle"; // импорт переключателя
import {
  ensureEmployeesListExists,
  ensureWorkloadPeriodsListExists,
  ensureShiftTypeListExists,
  ensureShiftsListExists,
  ensureShiftPatternListExists,
} from "./services/listCheck";
import {
  Dialog,
  DialogContent,
  Typography,
  LinearProgress,
  Box
} from "@mui/material";
import "./App.css";

function App() {
  const [openDialog, setOpenDialog] = useState(true);
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    Promise.all([
      ensureEmployeesListExists(),
      ensureWorkloadPeriodsListExists(),
      ensureShiftTypeListExists(),
      ensureShiftsListExists(),
      ensureShiftPatternListExists(),
    ])
      .then(() => {
        setStatus("done");
        setTimeout(() => setOpenDialog(false), 1500);
      })
      .catch((error) => {
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
    <ThemeProvider theme={themeMode === "light" ? lightTheme : darkTheme}>
      <CssBaseline />
      <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
        <ThemeToggle mode={themeMode} onChange={setThemeMode} />
      </Box>
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
    </ThemeProvider>
  );
}

export default App;
