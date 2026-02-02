+++
title = "Зависимости: BuildRequires и Requires"
weight = 3
description = "Зависимости для сборки и работы, автоматическое определение, Provides/Conflicts/Obsoletes."
+++

Правильное указание зависимостей — одна из главных задач сборщика. Пакет должен работать «из коробки» и собираться в чистом окружении.

## Типы зависимостей

### BuildRequires — для сборки

Пакеты, необходимые **во время сборки**. Устанавливаются в сборочное окружение.

```spec
BuildRequires:  gcc
BuildRequires:  make
BuildRequires:  cmake
BuildRequires:  pkgconfig(libcurl)
BuildRequires:  python3-devel
```

### Requires — для работы

Пакеты, необходимые **для работы** установленной программы.

```spec
Requires:       python3
Requires:       libcurl
Requires:       %{name}-data = %{version}-%{release}
```

## Формы указания зависимостей

### По имени пакета

```spec
BuildRequires:  openssl-devel
Requires:       openssl-libs
```

### Через pkgconfig (рекомендуется для библиотек)

```spec
BuildRequires:  pkgconfig(openssl)
BuildRequires:  pkgconfig(libcurl)
BuildRequires:  pkgconfig(gtk4)
```

**Преимущества:**
- Не зависит от конкретного имени пакета
- Работает, даже если библиотека переехала в другой пакет

**Как узнать pkgconfig-имя:**
```bash
pkg-config --list-all | grep ssl
# openssl    OpenSSL - OpenSSL cryptographic library
```

### Через виртуальные provides

```spec
# Любой пакет, предоставляющий /usr/bin/python3
Requires:       /usr/bin/python3

# Любой MTA
Requires:       /usr/sbin/sendmail

# Perl-модуль
BuildRequires:  perl(File::Copy)

# Python-модуль
BuildRequires:  python3dist(requests)
```

### С указанием версии

```spec
# Точная версия
Requires:       libfoo = 1.0

# Минимальная версия
Requires:       libfoo >= 1.0

# Диапазон
Requires:       libfoo >= 1.0, libfoo < 2.0

# Строгая привязка подпакетов
Requires:       %{name}-libs = %{version}-%{release}
```

**Операторы сравнения:**
- `=` — точно равно
- `<`, `>` — меньше/больше
- `<=`, `>=` — меньше-равно/больше-равно

## Автоматические зависимости

RPM автоматически определяет многие зависимости:

### Разделяемые библиотеки

```bash
# Что программа требует
ldd /usr/bin/htop
# libncursesw.so.6 => /lib64/libncursesw.so.6

# RPM преобразует в
Requires: libncursesw.so.6()(64bit)
```

### Интерпретаторы скриптов

```bash
#!/usr/bin/python3
# RPM автоматически добавит
Requires: /usr/bin/python3
```

### Perl/Python модули

```python
import requests
# RPM добавит
Requires: python3dist(requests)
```

### Отключение автозависимостей

Иногда нужно отключить автоматику:

```spec
# Полное отключение
AutoReq:        no
AutoProv:       no

# Фильтрация конкретных зависимостей
%global __requires_exclude ^libprivate\\.so.*$
%global __provides_exclude_from ^%{_libdir}/%{name}/plugins/.*$
```

## Provides — что предоставляет пакет

```spec
Provides:       webclient
Provides:       bundled(libfoo) = 1.2.3
```

**Автоматические provides:**
- Имя пакета и версия
- Разделяемые библиотеки (`.so`)
- Perl/Python модули

**Явные provides нужны для:**
- Виртуальных возможностей (`Provides: httpd`)
- Bundled-библиотек (`Provides: bundled(libfoo) = 1.2.3`)
- Совместимости (`Provides: old-name`)

## Conflicts — конфликтующие пакеты

Пакеты, которые нельзя установить одновременно:

```spec
# Конфликт с конкретным пакетом
Conflicts:      otherpkg

# Конфликт со старой версией
Conflicts:      libfoo < 2.0
```

**Используйте осторожно** — конфликты усложняют жизнь пользователям.

## Obsoletes — замена устаревшего пакета

Когда пакет заменяет другой (переименование, слияние):

```spec
# Заменяем старый пакет
Obsoletes:      old-package < 2.0
Provides:       old-package = %{version}-%{release}
```

При установке `new-package` пакетный менеджер автоматически удалит `old-package`.

**Важно:**
- Obsoletes должен иметь версию (`< X.Y`)
- Без версии пакет будет «obsolete» навсегда
- Добавьте `Provides` для совместимости зависимостей

## Зависимости подпакетов

### Строгая привязка

```spec
%package libs
Summary:        Libraries for %{name}

%package devel
Summary:        Development files for %{name}
Requires:       %{name}-libs = %{version}-%{release}
```

`%{version}-%{release}` гарантирует, что установятся одинаковые версии.

### Рекомендации и предложения

```spec
# Рекомендуется, но не обязательно (dnf установит по умолчанию)
Recommends:     %{name}-plugins

# Предлагается (dnf покажет, но не установит)
Suggests:       %{name}-docs

# Дополняет другой пакет (устанавливается, если тот есть)
Supplements:    (python3 and %{name})

# Улучшает другой пакет
Enhances:       vim
```

## Слабые зависимости

### Recommends

Пакет будет установлен по умолчанию, но пользователь может отказаться:

```spec
Recommends:     bash-completion
```

### Suggests

Пакет будет показан как предложение:

```spec
Suggests:       documentation
```

### Supplements

Пакет будет установлен, если установлен другой:

```spec
# Установить langpack, если установлены firefox и langpacks-ru
Supplements:    (firefox and langpacks-ru)
```

## Зависимости времени выполнения скриптов

### Requires(pre), Requires(post), ...

Зависимости для скриптлетов:

```spec
Requires(pre):    shadow-utils      # Для создания пользователя
Requires(post):   systemd           # Для systemctl daemon-reload
Requires(preun):  systemd
Requires(postun): systemd
```

### OrderWithRequires

Управление порядком транзакции без жёсткой зависимости:

```spec
OrderWithRequires: otherpkg
```

## Типичные ошибки

### Недостающий BuildRequires

**Симптом:** Сборка работает локально, падает на ABF.

```
error: Package 'libfoo-devel' not found
```

**Причина:** Локально пакет уже установлен, в чистом окружении — нет.

**Решение:** Собирать в mock или внимательно смотреть логи configure/cmake.

### Избыточные Requires

```spec
# Неправильно — уже подтягивается автоматически
Requires:       glibc
Requires:       libstdc++

# Правильно — только то, что RPM не найдёт сам
Requires:       python3-requests
```

### Отсутствие версии в Obsoletes

```spec
# Неправильно — obsolete навсегда
Obsoletes:      old-package

# Правильно
Obsoletes:      old-package < 2.0
```

### Нестрогая привязка подпакетов

```spec
# Неправильно — может установиться libs от другой версии
Requires:       %{name}-libs

# Правильно
Requires:       %{name}-libs = %{version}-%{release}
```

## Отладка зависимостей

### Посмотреть зависимости пакета

```bash
# Requires собранного пакета
rpm -qp --requires package.rpm

# Provides
rpm -qp --provides package.rpm

# BuildRequires из SRPM
rpm -qp --requires package.src.rpm
```

### Найти, какой пакет предоставляет файл

```bash
dnf provides /usr/lib64/libssl.so.3
# openssl-libs-3.0.8-1.x86_64 : ...
```

### Найти, какой пакет предоставляет pkgconfig

```bash
dnf provides 'pkgconfig(openssl)'
# openssl-devel-3.0.8-1.x86_64 : ...
```

### Проверить автоматические зависимости

```bash
# Что RPM найдёт автоматически
/usr/lib/rpm/find-requires < <(rpm -qlp package.rpm)
/usr/lib/rpm/find-provides < <(rpm -qlp package.rpm)
```

## Проверьте понимание

1. Чем отличается `BuildRequires` от `Requires`?
2. Почему лучше использовать `pkgconfig(...)` вместо имени пакета?
3. Когда нужно использовать `Obsoletes` и `Provides` вместе?
4. Как RPM автоматически определяет зависимости от библиотек?
5. Зачем нужна строгая привязка `= %{version}-%{release}` для подпакетов?

---

**Далее:** [Секции сборки: %prep, %build, %install, %check](sections.md)
