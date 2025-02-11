// src/services/userService.ts
import apiClient from '../api';
import { getRequestDigest, getWebGUID, getListGUID  } from './contextService';




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


export async function ensureWorkloadPeriodsListExists(): Promise<void> {
  try {
    // Проверяем существование списка
    await apiClient.get("/web/lists/GetByTitle('WorkloadPeriods')", {
      headers: { Accept: 'application/json;odata=verbose' }
    });
    console.log("✅ Список 'WorkloadPeriods' найден");
  } catch (error: any) {
    // Если 404, значит список не существует — создаём
    if (error.response && error.response.status === 404) {
      console.log("❌ Список 'WorkloadPeriods' не найден. Создаем...");

      try {
        const digest = await getRequestDigest();
        if (!digest) throw new Error("❌ Ошибка: X-RequestDigest не получен!");

        // 1. Создаем сам список
        const listPayload = {
          __metadata: { type: "SP.List" },
          Title: "WorkloadPeriods",
          BaseTemplate: 100,
          Description: "Периоды занятости сотрудников"
        };

        const createListResponse = await apiClient.post("/web/lists", listPayload, {
          headers: {
            Accept: "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-Requested-With": "XMLHttpRequest",
            "X-RequestDigest": digest
          }
        });
        console.log("✅ Список 'WorkloadPeriods' создан:", createListResponse.data);

        // 2. Добавляем обычные поля
        const fieldsUrl = `/web/lists/GetByTitle('WorkloadPeriods')/fields`;
        const fields = [
          { Title: "StartDate", FieldTypeKind: 4 }, // DateTime
          { Title: "EndDate", FieldTypeKind: 4 },   // DateTime
          { Title: "Fraction", FieldTypeKind: 9 }   // Number
        ];

        for (const field of fields) {
          await apiClient.post(
            fieldsUrl,
            {
              __metadata: { type: "SP.Field" },
              Title: field.Title,
              FieldTypeKind: field.FieldTypeKind
            },
            {
              headers: {
                Accept: "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-Requested-With": "XMLHttpRequest",
                "X-RequestDigest": digest
              }
            }
          );
          console.log(`✅ Поле '${field.Title}' добавлено.`);
        }

        // 3. Добавляем Lookup-поле через AddField
        const employeesListGuid = await getListGUID("Employees");
        const webGuid = await getWebGUID();

        // Формируем тело запроса для AddField
        const lookupFieldPayload = {
            parameters: {
              __metadata: { type: "SP.FieldCreationInformation" },
              Title: "Employee",
              FieldTypeKind: 7,
              LookupListId: `{${employeesListGuid}}`,
              LookupWebId: `{${webGuid}}`,
              LookupFieldName: "Title",
              Required: true // допустимое свойство
            }
          };
        // POST на /AddField
        const addFieldEndpoint = `/web/lists/GetByTitle('WorkloadPeriods')/fields/AddField`;
        await apiClient.post(addFieldEndpoint, lookupFieldPayload, {
          headers: {
            Accept: "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-Requested-With": "XMLHttpRequest",
            "X-RequestDigest": digest
          }
        });
        console.log("✅ Поле 'Employee' (Lookup) добавлено.");
      } catch (createError) {
        console.error("❌ Ошибка создания списка 'WorkloadPeriods':", createError);
        throw createError;
      }
    } else {
      console.error("❌ Ошибка проверки списка 'WorkloadPeriods':", error);
      throw error;
    }
  }
}


export async function ensureShiftTypeListExists(): Promise<void> {
  try {
    // Проверяем существование списка
    await apiClient.get("/web/lists/GetByTitle('ShiftType')", {
      headers: { Accept: "application/json;odata=verbose" },
    });
    console.log("✅ Список 'ShiftType' найден");
  } catch (error: any) {
    // Если 404, значит список не существует — создаём
    if (error.response && error.response.status === 404) {
      console.log("❌ Список 'ShiftType' не найден. Создаем...");

      try {
        const digest = await getRequestDigest();
        if (!digest) throw new Error("❌ Ошибка: X-RequestDigest не получен!");

        // 1. Создаем сам список
        const listPayload = {
          __metadata: { type: "SP.List" },
          Title: "ShiftType",
          BaseTemplate: 100,
          Description: "Типы смен сотрудников",
        };

        const createListResponse = await apiClient.post("/web/lists", listPayload, {
          headers: {
            Accept: "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-Requested-With": "XMLHttpRequest",
            "X-RequestDigest": digest,
          },
        });
        console.log("✅ Список 'ShiftType' создан:", createListResponse.data);

        // 2. Добавляем обычные поля
        const fieldsUrl = `/web/lists/GetByTitle('ShiftType')/fields`;
        const fields = [
          { Title: "Name", FieldTypeKind: 2 }, // Text
          { Title: "BackgroundColor", FieldTypeKind: 2 }, // Text
          { Title: "TextColor", FieldTypeKind: 2 }, // Text
          { Title: "AffectsWorkingNorm", FieldTypeKind: 8 }, // Boolean
          { Title: "RequiredStartEndTime", FieldTypeKind: 8 }, // Boolean
          { Title: "Description", FieldTypeKind: 2 }, // Text
          { Title: "DefaultStartTime", FieldTypeKind: 2 }, // Text
          { Title: "DefaultEndTime", FieldTypeKind: 2 }, // Text
          { Title: "DefaultBreakStart", FieldTypeKind: 2 }, // Text
          { Title: "DefaultBreakEnd", FieldTypeKind: 2 }, // Text
        ];

        for (const field of fields) {
          await apiClient.post(
            fieldsUrl,
            {
              __metadata: { type: "SP.Field" },
              Title: field.Title,
              FieldTypeKind: field.FieldTypeKind,
            },
            {
              headers: {
                Accept: "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-Requested-With": "XMLHttpRequest",
                "X-RequestDigest": digest,
              },
            }
          );
          console.log(`✅ Поле '${field.Title}' добавлено.`);
        }

        console.log("✅ Все поля для 'ShiftType' добавлены.");
      } catch (createError) {
        console.error("❌ Ошибка создания списка 'ShiftType':", createError);
        throw createError;
      }
    } else {
      console.error("❌ Ошибка проверки списка 'ShiftType':", error);
      throw error;
    }
  }
}


export async function ensureShiftsListExists(): Promise<void> {
  try {
    // Проверяем существование списка "Shifts"
    await apiClient.get("/web/lists/GetByTitle('Shifts')", {
      headers: { Accept: "application/json;odata=verbose" },
    });
    console.log("✅ Список 'Shifts' найден");
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      console.log("❌ Список 'Shifts' не найден. Создаем...");
      try {
        const digest = await getRequestDigest();
        if (!digest) throw new Error("❌ Ошибка: X-RequestDigest не получен!");

        // 1. Создаем список "Shifts"
        const listPayload = {
          __metadata: { type: "SP.List" },
          Title: "Shifts",
          BaseTemplate: 100,
          Description: "Смены сотрудников",
        };

        const createListResponse = await apiClient.post("/web/lists", listPayload, {
          headers: {
            Accept: "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-Requested-With": "XMLHttpRequest",
            "X-RequestDigest": digest,
          },
        });
        console.log("✅ Список 'Shifts' создан:", createListResponse.data);

        // 2. Добавляем обычные поля
        const fieldsUrl = `/web/lists/GetByTitle('Shifts')/fields`;
        const fields = [
          { Title: "Date", FieldTypeKind: 4 },         // DateTime
          { Title: "StartTime", FieldTypeKind: 2 },      // Text
          { Title: "EndTime", FieldTypeKind: 2 },        // Text
          { Title: "BreakStart", FieldTypeKind: 2 },     // Text
          { Title: "BreakEnd", FieldTypeKind: 2 },       // Text
          { Title: "Hours", FieldTypeKind: 9 },          // Number
          { Title: "IsNightShift", FieldTypeKind: 8 },   // Boolean
        ];

        for (const field of fields) {
          await apiClient.post(
            fieldsUrl,
            {
              __metadata: { type: "SP.Field" },
              Title: field.Title,
              FieldTypeKind: field.FieldTypeKind,
            },
            {
              headers: {
                Accept: "application/json;odata=verbose",
                "Content-Type": "application/json;odata=verbose",
                "X-Requested-With": "XMLHttpRequest",
                "X-RequestDigest": digest,
              },
            }
          );
          console.log(`✅ Поле '${field.Title}' добавлено.`);
        }

        // 3. Добавляем Lookup-поле для сотрудника (Employee)
        const employeesListGuid = await getListGUID("Employees");
        const webGuid = await getWebGUID();

        const employeeLookupPayload = {
          parameters: {
            __metadata: { type: "SP.FieldCreationInformation" },
            Title: "Employee",
            FieldTypeKind: 7, // Lookup
            LookupListId: `{${employeesListGuid}}`,
            LookupWebId: `{${webGuid}}`,
            LookupFieldName: "Title",
            Required: true,
          },
        };

        const addEmployeeLookupEndpoint = `/web/lists/GetByTitle('Shifts')/fields/AddField`;
        await apiClient.post(addEmployeeLookupEndpoint, employeeLookupPayload, {
          headers: {
            Accept: "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-Requested-With": "XMLHttpRequest",
            "X-RequestDigest": digest,
          },
        });
        console.log("✅ Поле 'Employee' (Lookup) добавлено.");

        // 4. Добавляем Lookup-поле для типа смены (ShiftType)
        const shiftTypeListGuid = await getListGUID("ShiftType");

        const shiftTypeLookupPayload = {
          parameters: {
            __metadata: { type: "SP.FieldCreationInformation" },
            Title: "ShiftType",
            FieldTypeKind: 7, // Lookup
            LookupListId: `{${shiftTypeListGuid}}`,
            LookupWebId: `{${webGuid}}`,
            LookupFieldName: "Title",
            Required: true,
          },
        };

        const addShiftTypeLookupEndpoint = `/web/lists/GetByTitle('Shifts')/fields/AddField`;
        await apiClient.post(addShiftTypeLookupEndpoint, shiftTypeLookupPayload, {
          headers: {
            Accept: "application/json;odata=verbose",
            "Content-Type": "application/json;odata=verbose",
            "X-Requested-With": "XMLHttpRequest",
            "X-RequestDigest": digest,
          },
        });
        console.log("✅ Поле 'ShiftType' (Lookup) добавлено.");

        console.log("✅ Все поля для 'Shifts' добавлены.");
      } catch (createError) {
        console.error("❌ Ошибка создания списка 'Shifts':", createError);
        throw createError;
      }
    } else {
      console.error("❌ Ошибка проверки списка 'Shifts':", error);
      throw error;
    }
  }
}
