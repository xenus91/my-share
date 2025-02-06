// src/services/userService.ts
import apiClient from '../api';
import { Employee } from '../types';
import { getRequestDigest } from './contextService';

// Получение свойств пользователя по accountName
export async function getUserPropertiesByAccountName(accountName: string): Promise<{
    preferredName: string;
    jobTitle: string;
    department: string;
    office: string;
} | null> {
    try {
        const encodedAccount = encodeURIComponent(accountName);
        const response = await apiClient.get(
            `/SP.UserProfiles.PeopleManager/GetPropertiesFor(accountName=@v)?@v='${encodedAccount}'`,
            {
                headers: { Accept: "application/json;odata=verbose" }
            }
        );

        // Парсим свойства пользователя
        const propertiesArray: { Key: string; Value: string }[] = response.data.d.UserProfileProperties.results;
        const props: { [key: string]: string } = {};
        propertiesArray.forEach(prop => {
            props[prop.Key] = prop.Value;
        });

        return {
            preferredName: props["PreferredName"] || "",
            jobTitle: props["SPS-JobTitle"] || "",
            department: props["Department"] || "",
            office: props["Office"] || ""
        };
    } catch (error) {
        console.error("Ошибка получения расширенных свойств пользователя:", error);
        return null;
    }
}

// Получение userId по loginName
export async function getUserIdByLoginName(loginName: string): Promise<string | null> {
    if (!loginName) {
        console.error("Пустой loginName");
        return null;
    }

    const fullLogin = `i:0#.w|retail\\${loginName}`;
    const encodedLogin = encodeURIComponent(fullLogin);
    console.log("Используемый логин:", fullLogin);

    const url = `/web/siteusers(@v)?@v='${encodedLogin}'`;
    console.log("Формируем URL:", url);

    try {
        const response = await apiClient.get(url, {
            headers: { Accept: "application/json;odata=verbose" },
            withCredentials: true
        });

        return response.data?.d?.Id || null;
    } catch (error) {
        console.error("Ошибка поиска пользователя по loginName:", error);
        return null;
    }
}

// Создание сотрудника в списке "Employees"
export async function createEmployee(payload: {
    preferredName: string;
    employeeId: string;
    jobTitle: string;
    department: string;
    office: string;
}): Promise<Employee> {
    try {
        const digest = await getRequestDigest();
        const postPayload = {
            __metadata: { type: "SP.Data.EmployeesListItem" },
            Title: payload.preferredName,
            EmployeeId: payload.employeeId,
            JobTitle: payload.jobTitle,
            Department: payload.department,
            Office: payload.office
        };

        const response = await apiClient.post(
            "/web/lists/GetByTitle('Employees')/items",
            postPayload,
            {
                headers: {
                    Accept: "application/json;odata=verbose",
                    "Content-Type": "application/json;odata=verbose",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-RequestDigest": digest
                }
            }
        );
        console.log("✅ Сотрудник создан:", response.data);
        return response.data.d;
    } catch (error) {
        console.error("❌ Ошибка создания сотрудника:", error);
        throw error;
    }
}

// Проверка наличия списка "Employees" и его создание при необходимости
export async function ensureEmployeesListExists(): Promise<void> {
  try {
      await apiClient.get("/web/lists/GetByTitle('Employees')", {
          headers: { Accept: 'application/json;odata=verbose' }
      });
      console.log("✅ Список 'Employees' найден");
  } catch (error: any) {
      if (error.response && error.response.status === 404) {
          console.log("❌ Список 'Employees' не найден. Создаем...");

          try {
              const digest = await getRequestDigest();
              if (!digest) {
                  console.error("❌ Ошибка: X-RequestDigest не получен!");
                  throw new Error("X-RequestDigest не получен");
              }
              console.log("🔹 X-RequestDigest:", digest);

              const listPayload = {
                  __metadata: { "type": "SP.List" },
                  Title: "Employees",
                  BaseTemplate: 100,
                  Description: "Список сотрудников"
              };

              console.log("🔹 Отправляем запрос на создание списка...");
              const createListResponse = await apiClient.post("/web/lists", listPayload, {
                  headers: {
                      Accept: 'application/json;odata=verbose',
                      'Content-Type': 'application/json;odata=verbose',
                      "X-Requested-With": "XMLHttpRequest",
                      "X-RequestDigest": digest
                  }
              });

              console.log("✅ Список 'Employees' создан:", createListResponse.data);

              // Добавляем поля
              const fieldsUrl = `/web/lists/GetByTitle('Employees')/fields`;
              const fields = [
                {
                  __metadata: { type: "SP.FieldUser" },
                  Title: "Employee",
                  FieldTypeKind: 20, // 🔹 Поле типа "User"
                  Required: false
                },
                {
                  __metadata: { type: "SP.FieldText" },
                  Title: "JobTitle",
                  FieldTypeKind: 2, // 🔹 Текстовое поле (Single Line of Text)
                  Required: false,
                  MaxLength: 255
                },
                {
                  __metadata: { type: "SP.FieldText" },
                  Title: "Department",
                  FieldTypeKind: 2, // 🔹 Текстовое поле (Single Line of Text)
                  Required: false,
                  MaxLength: 255
                },
                {
                  __metadata: { type: "SP.FieldText" },
                  Title: "Office",
                  FieldTypeKind: 2, // 🔹 Текстовое поле (Single Line of Text)
                  Required: false,
                  MaxLength: 255
                }
              ];
              

              for (const field of fields) {
                  console.log(`🔹 Добавляем поле '${field.Title}'...`);
                  const fieldPayload = {
                      __metadata: { "type": field.__metadata.type },
                      Title: field.Title,
                      FieldTypeKind: field.FieldTypeKind,
                      Required: field.Required,
                      ...(field.MaxLength ? { MaxLength: field.MaxLength } : {})
                  };

                  await apiClient.post(fieldsUrl, fieldPayload, {
                      headers: {
                          Accept: 'application/json;odata=verbose',
                          'Content-Type': 'application/json;odata=verbose',
                          "X-Requested-With": "XMLHttpRequest",
                          "X-RequestDigest": digest
                      }
                  });

                  console.log(`✅ Поле '${field.Title}' добавлено`);
              }
          } catch (createError) {
              console.error("❌ Ошибка создания списка 'Employees' или полей:", createError);
              throw createError;
          }
      } else {
          console.error("❌ Ошибка проверки списка 'Employees':", error);
          throw error;
      }
  }
}