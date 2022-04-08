#!/bin/bash

./build.sh

s3cmd put --recursive build/ s3://ivan.voischev.ru

echo "Успешно"
