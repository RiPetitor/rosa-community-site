+++
title = "Практикум 5: CMake-проект (fmt)"
weight = 5
description = "Сборка и упаковка fmt — C++ библиотеки на CMake: макросы %cmake, shared vs static, CMake config files."
sort_by = "weight"
template = "community.html"
page_template = "community-page.html"
+++

В этом практикуме мы упакуем **fmt** — популярную C++ библиотеку форматирования строк.
Проект использует **CMake** вместо Autotools, и это потребует другого подхода к сборке.
Разберём все отличия подробно.

## Что вы узнаете

- Чем CMake отличается от Autotools и что даёт пакетировщику
- Как работают макросы `%cmake`, `%cmake_build`, `%cmake_install`
- Зачем нужен `-DBUILD_SHARED_LIBS=ON` и что будет без него
- Что такое CMake config files и чем они отличаются от pkgconfig
- Как запускать тесты через `ctest`
- Как находить все CMake-опции проекта

## О проекте

**fmt** — это open-source библиотека форматирования строк для C++,
предоставляющая быструю и безопасную альтернативу C stdio и C++ iostreams.
В этом практикуме мы соберём её с использованием CMake и Ninja.

## Разделы практикума

1. [Теория: CMake, макросы RPM и config files](theory/)
2. [Подготовка, скачивание и сборка](spec-and-build/)
3. [Проверка качества и тестовая установка](verification/)
4. [Ошибки новичков и дополнительные материалы](common-mistakes/)
