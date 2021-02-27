# MOEX API. Курс валют и акций с Московской биржи

Примеры работы с курсами валют и акций с помощью API Московской Биржи на JavaScript.

## Как получить данные курса валют Центрального Банка

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
    console.log(json.cbrf.data[json.cbrf.columns.indexOf('CBRF_USD_LAST')]);
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

## Параметры

`?iss.meta=off` — отключает мета-данные в результате ответа.

## Ссылки

* [API Московской Биржи](https://iss.moex.com/iss/reference/)
* [API Центрального банка](https://cbr.ru/development/SXML/)
