#!/bin/bash

./build.sh

echo "Создаём архив"
tar -P -czf /tmp/voischev.ru.tar.gz build/
rm -rf build

echo "Отправка на сервер"
scp /tmp/voischev.ru.tar.gz voischev@voischev:/tmp/

echo "Публикация на сервере"
ssh voischev bash -s < scripts/server_publish

echo "Успешно"
