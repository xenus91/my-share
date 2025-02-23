import { API_BASE_URL } from '../../config';
import  apiClient from '../api'

export async function getRequestDigest(): Promise<string> {
  try {
      //console.log("🔹 Запрашиваем X-RequestDigest...");

      const response = await fetch(`${API_BASE_URL}/contextinfo`, { // Используем API_BASE_URL
          method: "POST",
          headers: {
              Accept: "application/json;odata=verbose",
              "X-Requested-With": "XMLHttpRequest"
          },
          credentials: "include"
      });

      if (!response.ok) {
          throw new Error(`Ошибка получения X-RequestDigest: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const digest = data.d.GetContextWebInformation.FormDigestValue;
      
      //console.log("✅ X-RequestDigest получен:", digest);
      return digest;
  } catch (error) {
      console.error("❌ Ошибка получения X-RequestDigest:", error);
      throw error;
  }
}


export async function getWebGUID(): Promise<string> {
    try {
      const response = await apiClient.get("/web?$select=Id", {
        headers: { Accept: "application/json;odata=verbose" }
      });
      return response.data.d.Id;
    } catch (error) {
      console.error("Ошибка получения GUID веба:", error);
      throw error;
    }
  }


  /**
 * Получает GUID списка по его названию.
 * @param listTitle Название списка в SharePoint.
 * @returns GUID списка.
 */
export async function getListGUID(listTitle: string): Promise<string> {
    try {
        const response = await apiClient.get(`/web/lists/GetByTitle('${listTitle}')?$select=Id`, {
            headers: { Accept: "application/json;odata=verbose" }
        });

        return response.data.d.Id; // GUID списка
    } catch (error) {
        console.error(`❌ Ошибка получения GUID списка '${listTitle}':`, error);
        throw error;
    }
}