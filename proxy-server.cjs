const express = require("express");
const cors = require("cors");
const httpntlm = require("httpntlm");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Загружаем переменные окружения
const config = {
  username: process.env.VITE_SP_USERNAME,
  password: process.env.VITE_SP_PASSWORD,
  domain: process.env.VITE_SP_DOMAIN,
  workstation: process.env.VITE_SP_WORKSTATION || "",
};

const sharepointBaseUrl = process.env.VITE_SP_SITE + "/_api";

console.log("🚀 NTLM Proxy запущен");
console.log("🔹 SharePoint Base URL:", sharepointBaseUrl);
console.log("🔹 Пользователь NTLM:", config.username);
console.log("🔹 Домен NTLM:", config.domain);

// Функция получения `X-RequestDigest`
async function getRequestDigest(callback) {
  console.log("🔹 Получение X-RequestDigest...");
  httpntlm.post(
    {
      url: `${sharepointBaseUrl}/contextinfo`,
      username: config.username,
      password: config.password,
      domain: config.domain,
      workstation: config.workstation,
      headers: { Accept: "application/json;odata=verbose" },
    },
    (err, response) => {
      if (err) {
        console.error("❌ Ошибка получения X-RequestDigest:", err);
        return callback(null);
      }
      try {
        const data = JSON.parse(response.body);
        const digest = data.d.GetContextWebInformation.FormDigestValue;
        console.log("✅ X-RequestDigest получен:", digest);
        callback(digest);
      } catch (error) {
        console.error("❌ Ошибка обработки X-RequestDigest:", error);
        callback(null);
      }
    }
  );
}

// Фиксируем ошибку с `/_api`, если он не добавляется
function getSharePointUrl(originalUrl) {
  let fixedUrl = sharepointBaseUrl + originalUrl.replace(/^\/api/, ""); // ✅ Гарантируем, что `/_api` есть в URL
  console.log(`🔹 Перенаправляемый URL: ${fixedUrl}`);
  return fixedUrl;
}

function isValidJson(responseBody) {
  return typeof responseBody === "string" && responseBody.trim().startsWith("{");
}


app.use("/api/*", (req, res) => {
  console.log(`\n🔹 Входящий запрос: ${req.method} ${req.originalUrl}`);

  const sharepointUrl = getSharePointUrl(req.originalUrl);
  console.log(`🔹 Перенаправляемый URL: ${sharepointUrl}`);

  const requestOptions = {
    url: sharepointUrl,
    username: config.username,
    password: config.password,
    domain: config.domain,
    workstation: config.workstation,
    headers: {
      Accept: "application/json;odata=verbose",
      "Content-Type": "application/json;odata=verbose",
    },
  };

  if (req.method === "POST") {
    console.log("🔹 Получение X-RequestDigest...");
    getRequestDigest((digest) => {
      if (!digest) {
        console.error("❌ Ошибка: X-RequestDigest не получен");
        return res.status(500).json({ error: "Ошибка получения X-RequestDigest" });
      }

      requestOptions.headers["X-RequestDigest"] = digest;
      requestOptions.json = req.body;

      console.log("🔹 Отправка POST-запроса в SharePoint с телом:", req.body);
      httpntlm.post(requestOptions, (err, response) => {
        if (err) {
          console.error("❌ Ошибка запроса к SharePoint:", err);
          return res.status(500).json({ error: "Ошибка проксирования запроса" });
        }

        const responseBody = response.body;
        console.log(`✅ Ответ от SharePoint (${response.statusCode}):`, responseBody);

        if (!isValidJson(responseBody)) {
          console.error("❌ ОШИБКА: Ответ не JSON!", responseBody);
          return res.status(500).json({ error: "SharePoint вернул не JSON", details: responseBody });
        }

        res.status(response.statusCode).json(JSON.parse(responseBody));
      });
    });
  } else {
    console.log("🔹 Отправка GET-запроса в SharePoint...");
    httpntlm.get(requestOptions, (err, response) => {
      if (err) {
        console.error("❌ Ошибка запроса к SharePoint:", err);
        return res.status(500).json({ error: "Ошибка проксирования запроса" });
      }

      const responseBody = response.body;
      console.log(`✅ Ответ от SharePoint (${response.statusCode}):`, responseBody);

      if (!isValidJson(responseBody)) {
        console.error("❌ ОШИБКА: Ответ не JSON!", responseBody);
        return res.status(500).json({ error: "SharePoint вернул не JSON", details: responseBody });
      }

      res.status(response.statusCode).json(JSON.parse(responseBody));
    });
  }
});


async function getRequestDigest(callback) {
  const digestUrl = `${sharepointBaseUrl}/contextinfo`;
  console.log(`🔹 Получаем X-RequestDigest с URL: ${digestUrl}`);

  httpntlm.post(
    {
      url: digestUrl,
      username: config.username,
      password: config.password,
      domain: config.domain,
      workstation: config.workstation,
      headers: { Accept: "application/json;odata=verbose" },
    },
    (err, response) => {
      if (err) {
        console.error("❌ Ошибка запроса X-RequestDigest:", err);
        return callback(null);
      }

      console.log(`✅ Ответ от SharePoint (${response.statusCode}):`, response.body);

      try {
        // Проверяем, что ответ действительно JSON
        if (!response.body || !response.body.trim().startsWith("{")) {
          console.error("❌ ОШИБКА: SharePoint вернул не JSON при получении X-RequestDigest!", response.body);
          return callback(null);
        }

        const data = JSON.parse(response.body);
        const digest = data.d.GetContextWebInformation.FormDigestValue;
        console.log("✅ X-RequestDigest получен:", digest);
        callback(digest);
      } catch (parseError) {
        console.error("❌ Ошибка обработки X-RequestDigest JSON:", parseError, "\nОтвет:", response.body);
        callback(null);
      }
    }
  );
}

app.listen(5000, () => {
  console.log("🚀 NTLM Proxy работает на http://localhost:5000");
});
