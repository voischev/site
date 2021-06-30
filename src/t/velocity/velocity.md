# Ускорение работы сайта

Собираю интересные практики и ссылки про ускорение сайта.

## Асинхронная загрузка стилей

```
<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="styles.css"></noscript>
```

## Быстрый счётчик Яндекс Метрики
Учитывает только заходы на сайт

```
<link rel="preload" href="https://mc.yandex.ru/watch/<НОМЕР_СЧЁТЧИКА>" as="image" onload="this.onload=null">
```

## Ссылки
* [Почему скорость сайта это важно](https://blog.sibirix.ru/amp/2021/02/24/gpsi-and-scripts-2021/)
* [Fast load times](https://web.dev/fast/)
* [Front-End Performance Checklist 2020](https://smashingmagazine.com/2020/01/front-end-performance-checklist-2020-pdf-pages/)
