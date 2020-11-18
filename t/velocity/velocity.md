# Ускорение работы сайта

Собираю интересные практики и ссылки про ускорение сайта.

## Асинхронная загрузка стилей

```
<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="styles.css"></noscript>
```

## Ссылки
* https://web.dev/fast/
