import apiClient from '../api';

export async function getRequestDigest(): Promise<string> {
    try {
      const response = await apiClient.post("/contextinfo", null, {
        headers: {
          Accept: "application/json;odata=verbose",
          "X-Requested-With": "XMLHttpRequest"
        },
        withCredentials: true // если используется NTLM
      });
  
      return response.data.d.GetContextWebInformation.FormDigestValue;
    } catch (error) {
      console.error("Ошибка получения X-RequestDigest:", error);
      throw error;
    }
  }
  
