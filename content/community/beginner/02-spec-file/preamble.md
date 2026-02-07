+++
title = "Преамбула: все теги с примерами"
weight = 1
description = "Name, Version, Release, Summary, License, URL и другие теги преамбулы SPEC-файла."
+++

Преамбула — это «паспорт» пакета. Здесь указываются все метаданные: имя, версия, описание, лицензия, источники и зависимости.

## Обязательные теги

Без этих тегов пакет не соберётся:

### Name

Имя пакета. Должно быть уникальным в репозитории.

```spec
Name:           firefox
```

**Правила именования:**
- Только латиница, цифры, дефис, подчёркивание, точка
- Начинается с буквы или цифры
- Обычно совпадает с именем проекта upstream
- Нижний регистр (соглашение)

**Примеры:**
```spec
Name:           python3-requests    # Python-библиотека
Name:           golang-github-user-project  # Go-пакет
Name:           libfoo              # Библиотека
Name:           foo-devel           # Подпакет для разработки
```

### Version

Версия программы из upstream. Точно как в оригинальном релизе.

```spec
Version:        115.0.2
```

**Важно:**
- Не добавляйте сюда свои суффиксы
- Если upstream использует `v1.0.0` — пишите `1.0.0` (без `v`)
- Если версия содержит буквы (alpha, beta, rc) — см. раздел о предрелизах

**Версии с буквами:**
```spec
# Неправильно — 1.0 > 1.0beta по алфавиту
Version:        1.0beta

# Правильно — используем тильду
Version:        1.0~beta1
# 1.0~beta1 < 1.0 (тильда имеет отрицательный вес)
```

### Release

Версия *упаковки*. Увеличивается при изменениях в SPEC без изменения Version.

```spec
Release:        1%{?dist}
```

**Макрос `%{?dist}`:**
- Добавляет суффикс дистрибутива: `.rosa13.1`, `.fc39`, `.el9`
- `?` означает «если определён» — не сломается, если dist не задан

**Когда увеличивать Release:**
- Исправили баг в SPEC → `2%{?dist}`
- Добавили патч → `3%{?dist}`
- Новая Version от upstream → сбросить на `1%{?dist}`

**Снапшоты и git-версии:**
```spec
# Снапшот от определённой даты
Version:        1.0
Release:        0.1.20250203git%{shortcommit}%{?dist}

# После релиза 1.0
Release:        1%{?dist}
```

Формат `0.X` гарантирует, что снапшот будет «меньше» релиза.

### Summary

Краткое описание в одну строку. Не заканчивается точкой.

```spec
Summary:        Mozilla Firefox web browser
```

**Требования:**
- Одна строка, до 80 символов
- Начинается с заглавной буквы
- Без точки в конце
- На английском (или на языке пакета, если локализован)

### License

Лицензия программы. Используйте идентификаторы SPDX.

```spec
License:        GPL-3.0-or-later
License:        MIT
License:        Apache-2.0
License:        GPL-2.0-only AND LGPL-2.1-or-later
```

**Комбинации лицензий:**
- `AND` — все условия должны соблюдаться (разные части под разными лицензиями)
- `OR` — на выбор пользователя
- `WITH` — лицензия с исключением

```spec
# Код под GPL, но с исключением для линковки
License:        GPL-3.0-or-later WITH GCC-exception-3.1

# Часть под MIT, часть под BSD
License:        MIT AND BSD-3-Clause
```

**Как определить лицензию:**
1. Читайте файл LICENSE/COPYING в исходниках
2. Проверьте заголовки файлов исходного кода
3. Смотрите документацию проекта

### URL

Домашняя страница проекта.

```spec
URL:            https://www.mozilla.org/firefox/
```

Должен быть рабочей ссылкой на актуальный сайт проекта.

## Рекомендуемые теги

### Vendor

Поставщик пакета.

```spec
Vendor:         ROSA Linux
```

### Packager

Сборщик пакета (обычно устанавливается глобально в `~/.rpmmacros`).

```spec
Packager:       Your Name <your@email.com>
```

### Group

Категория пакета. В современных дистрибутивах почти не используется.

```spec
Group:          Applications/Internet
```

### BuildArch

Архитектура сборки. Для платформо-независимых пакетов:

```spec
BuildArch:      noarch
```

**Когда использовать `noarch`:**
- Чистый Python, Ruby, Perl без C-расширений
- Документация
- Шрифты
- Данные (иконки, темы, переводы)
- Shell-скрипты

**Когда НЕ использовать `noarch`:**
- Есть компилируемый код (C, C++, Rust, Go)
- Архитектурно-зависимые пути (`%{_libdir}`)

### ExclusiveArch / ExcludeArch

Ограничение по архитектурам:

```spec
# Собирать только для этих архитектур
ExclusiveArch:  x86_64 aarch64

# Не собирать для этих архитектур
ExcludeArch:    i686 armv7hl
```

### Epoch

Наивысший приоритет при сравнении версий. Используйте только как крайнюю меру.

```spec
Epoch:          1
```

**Когда нужен Epoch:**
- Upstream изменил схему версионирования: было `2024.1`, стало `1.0`
- Нужно понизить версию (очень редко)

<div class="warning">
  <div class="title">Предупреждение</div>
  Epoch нельзя убрать после добавления. <code>Epoch:1 Version:0.1</code> всегда больше <code>Version:99.0</code>.
</div>

## Дополнительные теги

### AutoReq / AutoProv

Управление автоматическим определением зависимостей:

```spec
# Отключить автоматический поиск Requires
AutoReq:        no

# Отключить автоматический поиск Provides
AutoProv:       no

# Отключить оба
AutoReqProv:    no
```

Используется для пакетов с bundled-зависимостями или специфичным окружением.

### BuildRoot

Устарело в современных версиях RPM, но иногда встречается:

```spec
BuildRoot:      %{_tmppath}/%{name}-%{version}-%{release}-root
```

RPM 4.x автоматически создаёт buildroot, этот тег можно опустить.

## Полный пример преамбулы

```spec
Name:           htop
Version:        3.3.0
Release:        1%{?dist}
Summary:        Interactive process viewer
License:        GPL-2.0-or-later
URL:            https://htop.dev/
Vendor:         ROSA Linux

Source0:        https://github.com/htop-dev/htop/releases/download/%{version}/htop-%{version}.tar.xz

BuildRequires:  gcc
BuildRequires:  make
BuildRequires:  autoconf
BuildRequires:  automake
BuildRequires:  ncurses-devel
BuildRequires:  libsensors-devel
BuildRequires:  systemd-devel

Requires:       ncurses-libs

# htop заменяет устаревший htop-legacy
Obsoletes:      htop-legacy < 3.0
Provides:       htop-legacy = %{version}-%{release}
```

## Типичные ошибки

### Неправильное имя пакета

```spec
# Неправильно — пробелы и спецсимволы
Name:           My Cool App!

# Правильно
Name:           my-cool-app
```

### Version с буквой v

```spec
# Неправильно
Version:        v1.2.3

# Правильно
Version:        1.2.3
```

### Неточная лицензия

```spec
# Неправильно — слишком общо
License:        GPLv2

# Правильно — SPDX идентификатор
License:        GPL-2.0-only
```

### Точка в Summary

```spec
# Неправильно
Summary:        A great program.

# Правильно
Summary:        A great program
```

## Проверьте понимание

1. Какие теги обязательны для сборки RPM?
2. Как указать версию для бета-релиза, чтобы итоговый релиз был «больше»?
3. Когда пакет должен иметь `BuildArch: noarch`?
4. Что означает `%{?dist}` в теге Release?
5. Почему нужно избегать использования Epoch?

---

**Далее:** [Source и Patch: источники и патчи](@/community/beginner/02-spec-file/sources-patches.md)
