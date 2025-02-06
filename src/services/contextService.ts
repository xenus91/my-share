import { API_BASE_URL } from '../../config';

export async function getRequestDigest(): Promise<string> {
  try {
      console.log("🔹 Запрашиваем X-RequestDigest...");

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
      
      console.log("✅ X-RequestDigest получен:", digest);
      return digest;
  } catch (error) {
      console.error("❌ Ошибка получения X-RequestDigest:", error);
      throw error;
  }
}
