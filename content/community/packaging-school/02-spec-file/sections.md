+++
title = "Секции сборки: %prep, %build, %install, %check"
weight = 4
description = "Что происходит на каждом этапе сборки, стандартные макросы секций."
+++

После преамбулы идут секции, описывающие процесс сборки. Каждая секция — это shell-скрипт, выполняемый на определённом этапе.

## Порядок выполнения секций

```
%prep      →  %build      →  %install    →  %check
Подготовка    Компиляция     Установка      Тесты
                            в buildroot
```

## Секция %description

Не совсем «секция сборки», но обязательная часть. Полное описание пакета.

```spec
%description
HTtop is an interactive process viewer for Unix systems.
It is a text-mode application (for console or X terminals)
and requires ncurses.

Features:
- Tree view of processes
- Mouse support
- Colors
```

**Требования:**
- Начинается сразу после тега
- Может быть многострочным
- На английском (или языке локализации)
- Не должно дублировать Summary

**Для подпакетов:**
```spec
%package devel
Summary:        Development files for %{name}

%description devel
This package contains header files and libraries needed
to develop applications that use %{name}.
```

## Секция %prep

Подготовка исходников: распаковка архивов, применение патчей.

### Макрос %setup

Базовый макрос для распаковки:

```spec
%prep
%setup -q
```

**Опции %setup:**

| Опция | Описание |
|-------|----------|
| `-q` | Тихий режим (меньше вывода) |
| `-n name` | Имя каталога после распаковки |
| `-c` | Создать каталог и распаковать в него |
| `-D` | Не удалять каталог перед распаковкой |
| `-T` | Не распаковывать Source0 |
| `-a N` | Распаковать SourceN после входа в каталог |
| `-b N` | Распаковать SourceN до входа в каталог |

**Примеры:**

```spec
# Стандартная распаковка
%setup -q

# Архив распаковывается в project/ вместо project-1.0/
%setup -q -n project

# Распаковать Source0 и Source1 в один каталог
%setup -q -a 1

# Не распаковывать Source0, только Source1
%setup -q -T -b 1
```

### Макрос %autosetup (рекомендуется)

Современная замена `%setup` + `%patch`:

```spec
%prep
%autosetup -p1
```

Автоматически:
1. Распаковывает Source0
2. Применяет все патчи в порядке номеров

**Опции:**
- `-p1` — уровень strip для патчей
- `-n name` — имя каталога
- `-N` — не применять патчи автоматически
- `-S git` — использовать git для патчей

### Применение патчей вручную

```spec
%prep
%setup -q
%patch0 -p1
%patch1 -p1 -b .backup
%patch2 -p0
```

`-b .backup` создаёт резервные копии изменённых файлов.

### Дополнительные действия в %prep

```spec
%prep
%autosetup -p1

# Удалить bundled-библиотеки
rm -rf vendor/libfoo

# Исправить права
chmod +x scripts/generate.sh

# Установить версию
sed -i 's/@VERSION@/%{version}/' src/version.h
```

## Секция %build

Компиляция исходников. Здесь запускается система сборки проекта.

### Autotools (configure/make)

```spec
%build
%configure
%make_build
```

**%configure** — обёртка над `./configure` с правильными путями:

```bash
# Раскрывается примерно в:
./configure \
    --prefix=/usr \
    --libdir=/usr/lib64 \
    --sysconfdir=/etc \
    --localstatedir=/var \
    ...
```

**%make_build** — обёртка над `make`:

```bash
# Раскрывается в:
make -O -j8  # параллельная сборка
```

**С дополнительными опциями:**

```spec
%build
%configure --enable-feature --disable-tests
%make_build CFLAGS="%{optflags} -DEXTRA"
```

### CMake

```spec
%build
%cmake
%cmake_build
```

**%cmake** создаёт каталог сборки и запускает cmake:

```bash
# Раскрывается примерно в:
mkdir build && cd build
cmake .. \
    -DCMAKE_INSTALL_PREFIX=/usr \
    -DCMAKE_BUILD_TYPE=RelWithDebInfo \
    ...
```

**С опциями:**

```spec
%build
%cmake -DENABLE_TESTS=OFF -DWITH_FEATURE=ON
%cmake_build
```

### Meson

```spec
%build
%meson
%meson_build
```

### Python

```spec
%build
%py3_build

# Или с setuptools
%{python3} setup.py build
```

### Rust (Cargo)

```spec
%build
%cargo_build
```

### Go

```spec
%build
%gobuild -o %{gobuilddir}/bin/myapp ./cmd/myapp
```

### Без системы сборки

Иногда достаточно простого make:

```spec
%build
make %{?_smp_mflags} CFLAGS="%{optflags}"
```

`%{?_smp_mflags}` — флаги параллельной сборки (`-j8`).
`%{optflags}` — оптимизационные флаги дистрибутива.

## Секция %install

Установка собранных файлов в `%{buildroot}` — временный корень файловой системы.

### Autotools

```spec
%install
%make_install
```

Эквивалентно:
```bash
make install DESTDIR=%{buildroot}
```

### CMake

```spec
%install
%cmake_install
```

### Meson

```spec
%install
%meson_install
```

### Python

```spec
%install
%py3_install
```

### Ручная установка

```spec
%install
# Создать каталоги
install -d %{buildroot}%{_bindir}
install -d %{buildroot}%{_sysconfdir}/%{name}

# Установить файлы
install -m 755 myapp %{buildroot}%{_bindir}/
install -m 644 myapp.conf %{buildroot}%{_sysconfdir}/%{name}/

# Установить man-страницу
install -Dm 644 myapp.1 %{buildroot}%{_mandir}/man1/myapp.1
```

**Команда install:**
- `-d` — создать каталог
- `-m MODE` — права доступа
- `-D` — создать родительские каталоги

### Дополнительные действия

```spec
%install
%make_install

# Удалить ненужные файлы
rm -f %{buildroot}%{_libdir}/*.la
rm -rf %{buildroot}%{_datadir}/doc/%{name}

# Установить дополнительные файлы
install -Dm 644 %{SOURCE1} %{buildroot}%{_unitdir}/%{name}.service
install -Dm 644 %{SOURCE2} %{buildroot}%{_sysconfdir}/sysconfig/%{name}

# Создать симлинк
ln -s libfoo.so.1 %{buildroot}%{_libdir}/libfoo.so

# Переместить файлы
mv %{buildroot}%{_docdir}/%{name} %{buildroot}%{_docdir}/%{name}-%{version}
```

## Секция %check

Запуск тестов. Выполняется после %install, но до упаковки.

```spec
%check
%make_build check
```

**Варианты:**

```spec
# Autotools
%check
make check

# CMake
%check
%ctest

# Python
%check
%pytest

# Rust
%check
%cargo_test
```

**Пропуск тестов (временно):**

```spec
%check
# Тесты отключены, см. BZ#12345
# make check
```

<div class="warning">
  <div class="title">Важно</div>
  Не отключайте тесты без причины. Если тесты падают — это сигнал о проблеме.
</div>

## Условное выполнение

### По архитектуре

```spec
%build
%configure
%make_build

%ifarch x86_64
# Дополнительно для x86_64
make special-x64-target
%endif
```

### По опциям сборки

```spec
%bcond_without tests

%check
%if %{with tests}
make check
%endif
```

## Переменные окружения

```spec
%build
export CFLAGS="%{optflags} -DNDEBUG"
export LDFLAGS="%{build_ldflags}"
%configure
%make_build
```

**Стандартные макросы флагов:**
- `%{optflags}` — флаги компиляции (оптимизация, hardening)
- `%{build_ldflags}` — флаги линковки

## Типичные ошибки

### Файлы вне buildroot

```
RPM build errors:
   Installed (but unpackaged) file(s) found:
   /usr/bin/myapp
```

**Причина:** `make install` установил в систему, а не в buildroot.

**Решение:** Убедитесь, что используется `DESTDIR=%{buildroot}`.

### Параллельная сборка ломает проект

```spec
%build
# Отключить параллельную сборку
make -j1
```

Но лучше исправить Makefile проекта.

### Неправильные права файлов

```spec
%install
%make_install
# Исправить права
chmod 644 %{buildroot}%{_sysconfdir}/%{name}.conf
```

## Проверьте понимание

1. В каком порядке выполняются секции сборки?
2. Чем отличается `%setup` от `%autosetup`?
3. Что делает макрос `%configure`?
4. Куда устанавливаются файлы в секции `%install`?
5. Почему важна секция `%check`?

---

**Далее:** [Секция %files: макросы путей и атрибуты](files-section.md)
