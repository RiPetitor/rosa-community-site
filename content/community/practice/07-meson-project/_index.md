+++
title = "Практикум 7: Meson-проект (gamemode)"
weight = 7
description = "Сборка и упаковка gamemode — демон оптимизации производительности для игр, Meson-проект с systemd, D-Bus и shared library."
sort_by = "weight"
template = "community.html"
page_template = "community-page.html"
+++

В этом практикуме мы упакуем **gamemode** — демон от Feral Interactive, который оптимизирует
производительность Linux-системы во время запуска игр. Проект идеально подходит для изучения
Meson-сборки: здесь есть демон, CLI-утилита, разделяемая библиотека, заголовки, D-Bus-конфигурация
и юнит-файлы systemd.

## Что вы узнаете

- Как работает система сборки Meson и чем она отличается от Autotools и CMake
- Как использовать RPM-макросы `%meson`, `%meson_build`, `%meson_install`
- Как задавать опции сборки Meson через `-D`
- Как правильно разделять пакет на подпакеты: основной, `-libs`, `-devel`
- Как работать с юнит-файлами systemd и D-Bus-сервисами в RPM
- Как использовать systemd-макросы в скриптлетах

## Что такое Meson

**Meson** — это современная система сборки, написанная на Python. Ключевые отличия от Autotools и CMake:

- **Декларативный синтаксис** — файлы `meson.build` читаются проще, чем `CMakeLists.txt` или `Makefile.am`
- **Быстрая конфигурация** — Meson значительно быстрее autoconf/automake на больших проектах
- **Бэкенд Ninja** — вместо Make используется Ninja, который параллелит сборку эффективнее
- **Встроенная поддержка** pkg-config, systemd, D-Bus, i18n и многого другого
- **Кросс-платформенность** — один и тот же `meson.build` работает на Linux, macOS, Windows

Meson не генерирует Makefile. Вместо этого он создаёт файлы для Ninja (`build.ninja`),
и вся компиляция идёт через `ninja`. В RPM-контексте это означает, что вместо
`%configure` / `%make_build` / `%make_install` используются `%meson` / `%meson_build` / `%meson_install`.

### Что делают RPM-макросы Meson

| Макрос | Что делает за кулисами | Аналог в Autotools |
|--------|------------------------|--------------------|
| `%meson` | Запускает `meson setup` с правильными путями (`--prefix=/usr`, `--libdir=%{_libdir}` и т.д.) | `%configure` |
| `%meson_build` | Запускает `ninja -C %{__meson_build_dir}` — компиляция проекта | `%make_build` |
| `%meson_install` | Запускает `DESTDIR=%{buildroot} ninja -C %{__meson_build_dir} install` | `%make_install` |

Макрос `%meson` автоматически передаёт Ninja правильные системные пути: `--prefix=/usr`,
`--libdir=/usr/lib64` (на x86_64), `--sysconfdir=/etc` и т.д. Вам не нужно указывать их вручную.

## О проекте gamemode

**gamemode** ([GitHub](https://github.com/FeralInteractive/gamemode)) состоит из нескольких компонентов:

| Компонент | Описание |
|-----------|----------|
| `gamemoded` | Демон, принимающий запросы через D-Bus и применяющий оптимизации |
| `gamemoderun` | CLI-обёртка для запуска игр с gamemode |
| `libgamemode.so` | Разделяемая библиотека — клиентский API для приложений |
| `libgamemodeauto.so` | Библиотека для автоматической активации (через LD_PRELOAD) |
| `gamemode_client.h` | Заголовочный файл для разработчиков |
| `gamemode.pc` | Файл pkg-config |
| `gamemoded.service` | Пользовательский юнит systemd |
| D-Bus-конфигурация | Файлы политики и описания сервиса |

## Содержание практикума

1. [SPEC-файл и сборка](spec-and-build/) — подготовка окружения, скачивание исходников, изучение опций Meson, создание SPEC-файла и сборка пакета
2. [Проверка результатов](verification/) — rpmlint, проверка содержимого пакетов, зависимостей и тестовая установка
3. [systemd и D-Bus](systemd-and-dbus/) — юнит-файлы systemd, скриптлеты, D-Bus-конфигурация
4. [Ошибки и отладка](common-mistakes/) — типичные ошибки новичков, полезные команды для отладки, итоги
