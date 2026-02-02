+++
title = "Школа упаковки"
description = "Полный курс по созданию RPM-пакетов для ROSA Linux: от основ до публикации в репозитории сообщества."
weight = 2
sort_by = "weight"
template = "community.html"
+++

Добро пожаловать в **Школу упаковки** — учебный курс по созданию RPM-пакетов для ROSA Linux.

Курс разделен на две части: **теоретическую базу** с детальным разбором всех аспектов упаковки и **практикумы** — пошаговые разборы реальных Open Source проектов разных типов.

---

## Для кого этот курс

- Пользователи, желающие упаковать нужную программу для ROSA
- Разработчики, публикующие свои проекты в RPM-формате
- Контрибьюторы, готовые помогать сообществу с поддержкой пакетов

## Перед стартом

Что потребуется для прохождения курса:

- Базовые навыки работы в Linux-терминале
- Понимание принципов Git (clone, commit, push)
- ROSA Linux или совместимый дистрибутив для практики
- Готовность читать логи сборки и разбираться в ошибках

---

## Часть I: Теория

Фундаментальные знания о формате RPM, структуре SPEC-файлов, сборочных системах и инфраструктуре ABF.

### Модуль 1. Основы и концепции
Что такое пакет, репозиторий, RPM. Роль сборщика и стандарты размещения файлов.
- [Обзор модуля](@/community/packaging-school/01-concepts/_index.md)
- [Что такое пакет и зачем он нужен](@/community/packaging-school/01-concepts/what-is-package.md)
- [Внутреннее устройство RPM](@/community/packaging-school/01-concepts/rpm-structure.md)
- [Репозитории и пакетные менеджеры](@/community/packaging-school/01-concepts/repositories.md)
- [Стандарт FHS и пути установки](@/community/packaging-school/01-concepts/fhs-standards.md)

### Модуль 2. Анатомия SPEC-файла
Детальный разбор «рецепта» пакета: теги, секции, макросы, зависимости.
- [Обзор модуля](@/community/packaging-school/02-spec-file/_index.md)
- [Преамбула: все теги с примерами](@/community/packaging-school/02-spec-file/preamble.md)
- [Source и Patch: источники и патчи](@/community/packaging-school/02-spec-file/sources-patches.md)
- [Зависимости: BuildRequires и Requires](@/community/packaging-school/02-spec-file/dependencies.md)
- [Секции сборки: %prep, %build, %install, %check](@/community/packaging-school/02-spec-file/sections.md)
- [Секция %files: макросы путей и атрибуты](@/community/packaging-school/02-spec-file/files-section.md)
- [Макросы: стандартные, системные, свои](@/community/packaging-school/02-spec-file/macros.md)
- [Ведение %changelog](@/community/packaging-school/02-spec-file/changelog.md)

### Модуль 3. Сборочное окружение
Подготовка рабочего места, первая локальная сборка, типичные ошибки новичков.
- [Обзор модуля](@/community/packaging-school/03-build-environment/_index.md)
- [Установка инструментов](@/community/packaging-school/03-build-environment/tools-setup.md)
- [Структура ~/rpmbuild](@/community/packaging-school/03-build-environment/rpmbuild-tree.md)
- [Первая сборка: GNU Hello](@/community/packaging-school/03-build-environment/first-build.md)
- [Что такое buildroot](@/community/packaging-school/03-build-environment/buildroot.md)
- [Типичные ошибки и их решение](@/community/packaging-school/03-build-environment/common-errors.md)

### Модуль 4. Системы сборки
Как собирать проекты на разных языках и с разными инструментами.
- [Обзор модуля](@/community/packaging-school/04-build-systems/_index.md)
- [Autotools (configure/make)](@/community/packaging-school/04-build-systems/autotools.md)
- [CMake](@/community/packaging-school/04-build-systems/cmake.md)
- [Meson](@/community/packaging-school/04-build-systems/meson.md)
- [Python: setuptools и wheel](@/community/packaging-school/04-build-systems/python-setuptools.md)
- [Rust и Cargo](@/community/packaging-school/04-build-systems/rust-cargo.md)
- [Go modules](@/community/packaging-school/04-build-systems/golang.md)

### Модуль 5. ABF и рабочий процесс
От локальной сборки к облачной. Знакомство с ABF и правилами публикации.
- [Обзор модуля](@/community/packaging-school/05-abf-workflow/_index.md)
- [Что такое ABF](@/community/packaging-school/05-abf-workflow/abf-overview.md)
- [Регистрация и настройка](@/community/packaging-school/05-abf-workflow/registration.md)
- [Структура проекта на ABF](@/community/packaging-school/05-abf-workflow/project-structure.md)
- [Запуск и мониторинг сборки](@/community/packaging-school/05-abf-workflow/build-launch.md)
- [Разбор ошибок сборки](@/community/packaging-school/05-abf-workflow/build-errors.md)
- [Публикация в community](@/community/packaging-school/05-abf-workflow/publishing.md)

### Модуль 6. Продвинутые техники
Патчи, подпакеты, скриптлеты, условные сборки.
- [Обзор модуля](@/community/packaging-school/06-advanced/_index.md)
- [Патчи: создание, применение, backport](@/community/packaging-school/06-advanced/patches-deep.md)
- [Подпакеты: -devel, -doc, -libs](@/community/packaging-school/06-advanced/subpackages.md)
- [Скриптлеты и триггеры](@/community/packaging-school/06-advanced/scriptlets.md)
- [Условные сборки и bcond](@/community/packaging-school/06-advanced/conditional.md)
- [Версионирование и Epoch](@/community/packaging-school/06-advanced/versioning.md)

### Модуль 7. Качество и релиз
Проверка пакета, тестирование, чеклист перед публикацией.
- [Обзор модуля](@/community/packaging-school/07-quality/_index.md)
- [rpmlint: все проверки с объяснениями](@/community/packaging-school/07-quality/rpmlint.md)
- [Тестирование пакета](@/community/packaging-school/07-quality/testing.md)
- [Чеклист перед релизом](@/community/packaging-school/07-quality/checklist.md)
- [Сопровождение пакета](@/community/packaging-school/07-quality/maintenance.md)

---

## Часть II: Практикумы

Пошаговые разборы упаковки реальных Open Source проектов. Каждый практикум показывает особенности и типичные сложности определенного типа приложений.

- [Обзор практикумов](@/community/packaging-school/practice/_index.md)
- [Практикум 1: Простая C-программа (GNU Hello)](@/community/packaging-school/practice/01-simple-c/_index.md)
- [Практикум 2: Rust CLI-утилита (ripgrep)](@/community/packaging-school/practice/02-cli-rust/_index.md)
- [Практикум 3: Python-приложение (httpie)](@/community/packaging-school/practice/03-python-app/_index.md)
- [Практикум 4: Библиотека с подпакетом -devel (libyaml)](@/community/packaging-school/practice/04-library/_index.md)
- [Практикум 5: CMake-проект (fmt)](@/community/packaging-school/practice/05-cmake-project/_index.md)
- [Практикум 6: Патчи и backport (htop)](@/community/packaging-school/practice/06-patching/_index.md)

---

## Где задавать вопросы

- Телеграм: [t.me/rosalinux](https://t.me/rosalinux)
- Форум: [forum.rosa.ru](https://forum.rosa.ru)
- Matrix: [#rosa:matrix.org](https://matrix.to/#/#rosa:matrix.org)
