require('dotenv').config();
const express = require('express');
const httpntlm = require('httpntlm');
const app = express();

app.use('/api', (req, res) => {
  // Формируем URL запроса к SharePoint с добавлением "/_api"
  let url = `https://portal.lenta.com/sites/obrazceo/_api${req.url}`;
  // Если параметр $format=json ещё не указан, добавляем его
  if (!url.includes('$format=json')) {
    url += (url.includes('?') ? '&' : '?') + '$format=json';
  }
  console.log('Проксирование запроса к:', url);

  httpntlm.get({
    url,
    username: process.env.VITE_SP_USERNAME,
    password: process.env.VITE_SP_PASSWORD,
    //domain: process.env.VITE_SP_DOMAIN || '',
    workstation: '',
    headers: {
      'Accept': 'application/json;odata=verbose'
    }
  }, (err, response) => {
    if (err) {
      console.error('Ошибка NTLM запроса:', err);
      return res.status(500).send(err);
    }
    console.log('Ответ от SharePoint, статус:', response.statusCode);
    res.status(response.statusCode).send(response.body);
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy server listening on port ${port}`));
