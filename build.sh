#!/bin/bash

npm run make

rm -rf build
cp -a src/. build

# Удаляем артефакты
find build -name "*.md" -delete
find src/{t,invest} -name "*index.html" -delete

echo "Создаём Sitemap"
cd build
SITEMAP=sitemap.txt
touch $SITEMAP
echo "https://voischev.ru/" > $SITEMAP
find ./{t,invest} -type d | sed "s/^\./https:\/\/voischev.ru/" | sed "s/$/\//" >> $SITEMAP
find ./{t,invest} -name "*.pdf" | sed "s/^./https:\/\/voischev.ru/" >> $SITEMAP
cd ..
