# MOEX API. Курс валют и акций с Московской биржи

Примеры работы с курсами валют и акций с помощью API Московской Биржи на JavaScript.

## Получить данные курса валют Центрального Банка

```
fetch('https://iss.moex.com/iss/statistics/engines/currency/markets/selt/rates.json?iss.meta=off')
.then((response) => {
    if (!response.ok) {
        throw new Error('HTTP error, status = ' + response.status);
    }
    return response.json();
})
.then((json) => {
    // Текущий курс доллара ЦБРФ
    console.log(json.cbrf.data[0][json.cbrf.columns.indexOf('CBRF_USD_LAST')]);
})
.catch((error) => {
    console.error(error);
});
```

Биржевой курс доллара на закрытие торгов по дням можно получить так:
`http://iss.moex.com/iss/statistics/engines/futures/markets/indicativerates/securities/USD/RUB.json?from=2021-01-01&till=2021-02-25&iss.meta=off`

## Получить курс акции по тикеру
```
async function moexTickerLast(ticker) {
    const json = await fetch('https://iss.moex.com/iss/engines/stock/markets/shares/securities/' + ticker + '.json?iss.meta=off')
        .then((res) => { return res.json()});
    return json.marketdata.data.filter(function(d) { return ['TQBR', 'TQTF'].indexOf(d[1]) !== -1; })[0][12];
}

moexTickerLast('GAZP').then(console.log); // 150.25
```

## Получить курс акции по тикеру в Excel и Google Docs

Открываем редактор скриптов из меню: `Инструменты` > `Редактор скриптов`. Создаём новую функцию.

```
function moexTickerLast(ticker) {
    var json = UrlFetchApp.fetch('https://iss.moex.com/iss/engines/stock/markets/shares/securities/' + ticker + '.json');
    return JSON.parse(json).marketdata.data.filter(function(d) { return ['TQBR', 'TQTF'].indexOf(d[1]) !== -1; })[0][12];
}
```

Далее используется как обычная формула: `=moexTickerLast("GAZP")`.

## Параметры

* `?iss.meta=off` — отключает мета-данные в результате ответа
* `?sort_order=desc` — вариант сортировки
* `?iss.only=history&history.columns=TRADEDATE,CLOSE,YIELD` — выбор нужных таблиц и колонок

## Ссылки

* [API Московской Биржи](https://iss.moex.com/iss/reference/)
* [Документация и примеры](https://www.moex.com/a2193)
* [API Центрального банка](https://cbr.ru/development/SXML/)
