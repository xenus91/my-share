// src/hooks/useShifts.ts
import { useQuery } from "@tanstack/react-query";
import { getShifts } from "../services/shiftService";
import { Shift } from "../types";

/** 
 * Хук для загрузки всех смен из SharePoint.
 * Возвращает объект:
 * {
 *   data,       // Shift[] | undefined
 *   isLoading,  // boolean
 *   isError,    // boolean
 *   error,      // Error | null
 *   ...         // (другие поля, см. документацию useQuery)
 * }
 */
export function useShifts() {
  return useQuery<Shift[], Error>({
    queryKey: ["shifts"],
    queryFn: getShifts, 
    // Можно указать refetchOnWindowFocus: false, если не нужно автообновление при фокусе:
    // refetchOnWindowFocus: false,
  });
}
