# Bash

Собираю полезные знания про Bash.

![Bash](bash.png)

## CLI

### Возврат в предыдущую директорию

Команда `cd` — использует переменную `$OLDPWD` оболочки bash, чтобы получить путь предыдущего рабочего каталога. Фактически выполняется команда `cd $OLDPWD`

```
cd -
```

### Перемещаем курсор в CLI быстрее с помощью горячих клавиш

![Перемещаем курсор в CLI быстрее с помощью горячих клавиш](moving_cli.png)

### Генерация паролей

```
openssl rand -base64 6
openssl rand -hex 4
date | md5 | head -c8; echo
```
### Поиск в gzip файлах

```
find features -name "chrome-*" | xargs zgrep "yastatic.net\/" -rl
```


## Ссылки

* [Статья про Bash на Wikipedia](https://ru.wikipedia.org/wiki/Bash)
* [PDF про Bash](bash.pdf)
