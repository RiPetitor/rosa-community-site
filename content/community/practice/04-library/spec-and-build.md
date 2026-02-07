+++
title = "Подготовка, скачивание и сборка"
weight = 2
+++

## Шаг 1: Подготовка окружения

```bash
# Установите необходимые инструменты
sudo dnf install rpm-build rpmdevtools rpmlint gcc make

# Создайте дерево каталогов для сборки
rpmdev-setuptree
```

Эта команда создаст структуру:

```
~/rpmbuild/
  BUILD/      ← сюда распаковываются исходники при сборке
  BUILDROOT/  ← «виртуальный корень» — сюда устанавливаются файлы
  RPMS/       ← готовые бинарные RPM
  SOURCES/    ← исходные архивы и патчи
  SPECS/      ← SPEC-файлы
  SRPMS/      ← исходные RPM (src.rpm)
```

## Шаг 2: Скачивание исходников

```bash
cd ~/rpmbuild/SOURCES

# Определяем версию
export VER=0.2.5

# Скачиваем архив
curl -L -o yaml-${VER}.tar.gz \
  https://pyyaml.org/download/libyaml/yaml-${VER}.tar.gz
```

Проверьте, что архив скачался:

```bash
ls -lh yaml-${VER}.tar.gz
```

Ожидаемый вывод:

```
-rw-r--r-- 1 user user 596K ... yaml-0.2.5.tar.gz
```

Посмотрите, что внутри архива:

```bash
tar tzf yaml-${VER}.tar.gz | head -15
```

Ожидаемый вывод (обратите внимание на имя каталога — `yaml-0.2.5`, не `libyaml`):

```
yaml-0.2.5/
yaml-0.2.5/LICENSE
yaml-0.2.5/README
yaml-0.2.5/configure
yaml-0.2.5/configure.ac
yaml-0.2.5/Makefile.in
yaml-0.2.5/include/
yaml-0.2.5/include/yaml.h
yaml-0.2.5/src/
...
```

Имя каталога важно: именно его мы укажем в `%autosetup -n yaml-%{version}`.

## Шаг 3: Создание SPEC-файла

Создайте файл `~/rpmbuild/SPECS/libyaml.spec`:

```spec
Name:           libyaml
Version:        0.2.5
Release:        1%{?dist}
Summary:        YAML parser and emitter library

License:        MIT
URL:            https://pyyaml.org/wiki/LibYAML
Source0:        https://pyyaml.org/download/libyaml/yaml-%{version}.tar.gz

BuildRequires:  gcc
BuildRequires:  make

%description
LibYAML is a YAML 1.1 parser and emitter written in C.
It provides a simple API for reading and writing YAML documents.

# =============================================
# Подпакет -devel
# =============================================
%package devel
Summary:        Development files for libyaml
# Требуем основной пакет с совпадающей архитектурой.
# %{?_isa} добавляет суффикс вроде (x86-64) — это нужно, чтобы
# 64-битный -devel не пытался использовать 32-битную библиотеку.
Requires:       %{name}%{?_isa} = %{version}-%{release}

%description devel
Header files and development libraries for building applications
that use libyaml.

# =============================================
# Подготовка: распаковка исходников
# =============================================
%prep
# -n yaml-%{version} указывает имя каталога внутри архива.
# Без -n rpmbuild ожидает каталог %{name}-%{version} = libyaml-0.2.5,
# но в архиве каталог называется yaml-0.2.5.
%autosetup -n yaml-%{version}

# =============================================
# Сборка
# =============================================
%build
# %configure — макрос, который вызывает ./configure с правильными
# путями: --prefix=/usr, --libdir=/usr/lib64 и т.д.
%configure

# %make_build — макрос для make с параллельной сборкой (make -j8 и т.п.)
%make_build

# =============================================
# Установка в BUILDROOT
# =============================================
%install
# %make_install — вызывает make install DESTDIR=%{buildroot}
# Файлы устанавливаются не в реальный /usr, а в
# ~/rpmbuild/BUILDROOT/libyaml-0.2.5-1.rosa13.1.x86_64/usr/
%make_install

# Удаляем .la-файлы — libtool archives не нужны в современных системах.
# Если этого не сделать, rpmlint выдаст предупреждение:
# W: libyaml-devel.x86_64: static-library-without-debuginfo /usr/lib64/libyaml.la
find %{buildroot} -name '*.la' -delete

# =============================================
# Скриптлеты: обновление кэша библиотек
# =============================================
# После установки и удаления пакета нужно обновить кэш ldconfig,
# иначе загрузчик не найдёт библиотеку.
%post -p /sbin/ldconfig
%postun -p /sbin/ldconfig

# =============================================
# Файлы основного пакета (runtime)
# =============================================
%files
%license LICENSE
%doc README
# Реальный файл и SONAME-ссылка:
# libyaml-0.so.2.0.9 — подходит под шаблон *.so.*
# libyaml-0.so.2      — подходит под шаблон *.so.*
# libyaml.so          — НЕ подходит (нет цифр после .so)
# Именно поэтому шаблон *.so.* правильно разделяет файлы.
%{_libdir}/libyaml*.so.*

# =============================================
# Файлы подпакета -devel
# =============================================
%files devel
# Ссылка для линковщика (без номера версии после .so)
%{_libdir}/libyaml.so
# Заголовочный файл для #include <yaml.h>
%{_includedir}/yaml.h
# Файл pkg-config для поиска библиотеки
%{_libdir}/pkgconfig/yaml-0.1.pc

%changelog
* Sat Feb 08 2026 Your Name <your@email.com> - 0.2.5-1
- Initial package for ROSA Linux
```

### Разбор ключевых моментов SPEC-файла

#### Макрос `%{?_isa}` в Requires

Строка:
```spec
Requires: %{name}%{?_isa} = %{version}-%{release}
```

раскрывается в нечто вроде:
```
Requires: libyaml(x86-64) = 0.2.5-1.rosa13.1
```

Суффикс `(x86-64)` — это **ISA** (Instruction Set Architecture). Он гарантирует,
что 64-битный `libyaml-devel` потребует 64-битный `libyaml`. Без `%{?_isa}`
менеджер пакетов мог бы поставить 32-битную библиотеку к 64-битным заголовкам,
и компиляция бы сломалась.

#### Шаблон `%{_libdir}/libyaml*.so.*`

Этот glob захватывает:
- `libyaml-0.so.2` (SONAME-ссылка) — подходит: есть `.so.` и потом цифра
- `libyaml-0.so.2.0.9` (реальный файл) — подходит

Но **не** захватывает:
- `libyaml.so` (ссылка для компилятора) — нет ничего после `.so`

Это именно то, что нужно: runtime-файлы в основной пакет, dev-ссылка в `-devel`.

#### Путь `%{_libdir}`

Макрос `%{_libdir}` раскрывается в:
- `/usr/lib64` на 64-битных системах
- `/usr/lib` на 32-битных

Никогда не пишите путь `/usr/lib64` напрямую — используйте макрос,
чтобы SPEC работал на любой архитектуре.

## Шаг 4: Сборка

```bash
cd ~/rpmbuild/SPECS
rpmbuild -ba libyaml.spec
```

Процесс займёт 1-2 минуты. Следите за выводом.

**Ожидаемый успешный вывод (последние строки):**

```
Wrote: /home/user/rpmbuild/SRPMS/libyaml-0.2.5-1.rosa13.1.src.rpm
Wrote: /home/user/rpmbuild/RPMS/x86_64/libyaml-0.2.5-1.rosa13.1.x86_64.rpm
Wrote: /home/user/rpmbuild/RPMS/x86_64/libyaml-devel-0.2.5-1.rosa13.1.x86_64.rpm
Wrote: /home/user/rpmbuild/RPMS/x86_64/libyaml-debuginfo-0.2.5-1.rosa13.1.x86_64.rpm
```

Обратите внимание: создались **два** RPM — `libyaml` и `libyaml-devel`.
Также может появиться `libyaml-debuginfo` — это нормально, он содержит
отладочные символы.
