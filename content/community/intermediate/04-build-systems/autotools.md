+++
title = "Autotools (configure/make)"
weight = 1
description = "Классическая система сборки: configure, make, make install."
+++

**Autotools** (GNU Build System) — классическая система сборки, состоящая из autoconf, automake и libtool. Большинство проектов на C/C++ всё ещё используют её.

## Признаки Autotools

В исходниках есть:
- `configure` или `configure.ac` / `configure.in`
- `Makefile.am` или `Makefile.in`
- `aclocal.m4`
- Каталог `m4/`

## Стандартная сборка

```spec
%build
%configure
%make_build

%install
%make_install
```

Это работает для 90% проектов на Autotools.

## Макросы подробно

### %configure

```spec
%configure [опции]
```

Раскрывается в:

```bash
./configure \
    --build=x86_64-redhat-linux-gnu \
    --host=x86_64-redhat-linux-gnu \
    --program-prefix= \
    --disable-dependency-tracking \
    --prefix=/usr \
    --exec-prefix=/usr \
    --bindir=/usr/bin \
    --sbindir=/usr/sbin \
    --sysconfdir=/etc \
    --datadir=/usr/share \
    --includedir=/usr/include \
    --libdir=/usr/lib64 \
    --libexecdir=/usr/libexec \
    --localstatedir=/var \
    --sharedstatedir=/var/lib \
    --mandir=/usr/share/man \
    --infodir=/usr/share/info \
    [ваши опции]
```

**Типичные опции:**

```spec
%configure \
    --enable-feature \
    --disable-static \
    --with-system-libfoo \
    --without-bundled-bar
```

### %make_build

```spec
%make_build [цели]
```

Раскрывается в:

```bash
make -O -j8  # параллельная сборка
```

`-j8` зависит от `%{?_smp_mflags}`.

**С дополнительными параметрами:**

```spec
%make_build CFLAGS="%{optflags} -DEXTRA" V=1
```

### %make_install

```spec
%make_install [переменные]
```

Раскрывается в:

```bash
make install DESTDIR=%{buildroot}
```

## Полный пример SPEC

```spec
Name:           hello
Version:        2.12.1
Release:        1%{?dist}
Summary:        The classic greeting program
License:        GPL-3.0-or-later
URL:            https://www.gnu.org/software/hello/
Source0:        https://ftp.gnu.org/gnu/hello/hello-%{version}.tar.gz

BuildRequires:  gcc
BuildRequires:  make
BuildRequires:  gettext

%description
The GNU Hello program produces a familiar, friendly greeting.

%prep
%autosetup

%build
%configure
%make_build

%install
%make_install
%find_lang %{name}

%check
make check

%files -f %{name}.lang
%license COPYING
%doc README NEWS AUTHORS
%{_bindir}/hello
%{_mandir}/man1/hello.1*
%{_infodir}/hello.info*

%changelog
* Mon Feb 03 2025 Your Name <your@email.com> - 2.12.1-1
- Initial package
```

## Генерация configure

Некоторые проекты распространяют только `configure.ac` без готового `configure`:

```spec
%prep
%autosetup

# Сгенерировать configure
autoreconf -fiv
```

**BuildRequires:**

```spec
BuildRequires:  autoconf
BuildRequires:  automake
BuildRequires:  libtool
```

Или если есть `autogen.sh`:

```spec
%prep
%autosetup
./autogen.sh
```

## Распространённые опции configure

### Включение/отключение возможностей

```spec
%configure \
    --enable-gtk-doc \
    --disable-static \
    --disable-rpath
```

### Использование системных библиотек

```spec
%configure \
    --with-system-zlib \
    --without-bundled-sqlite
```

### Пути установки

```spec
%configure \
    --docdir=%{_pkgdocdir} \
    --with-systemdsystemunitdir=%{_unitdir}
```

## Работа с libtool

Libtool создаёт файлы `.la` — они обычно не нужны:

```spec
%install
%make_install

# Удалить .la файлы
find %{buildroot} -name '*.la' -delete
```

### Отключение статических библиотек

```spec
%configure --disable-static
```

Если статические библиотеки нужны, они идут в `-static` подпакет.

## Параллельная сборка

По умолчанию `%make_build` использует все ядра. Если сборка ломается:

```spec
%build
%configure
make  # Без параллельности
```

Или ограничить:

```spec
%build
%configure
make -j2
```

## Отладка configure

### Посмотреть доступные опции

```bash
cd ~/rpmbuild/BUILD/project-1.0
./configure --help
```

### Посмотреть, что configure определил

```bash
cat config.log
cat config.h
```

### Типичные ошибки

**«checking for FOO... no»**

```
checking for FOO... no
configure: error: FOO is required
```

Найти и добавить BuildRequires:

```bash
dnf provides '*/FOO' 
dnf provides 'pkgconfig(foo)'
```

**«configure: error: C compiler cannot create executables»**

```bash
sudo dnf install gcc
```

## Примеры из реальных пакетов

### Проект с подкаталогом сборки

Некоторые проекты требуют out-of-tree сборку:

```spec
%build
mkdir build && cd build
%configure
%make_build

%install
cd build
%make_install
```

### Проект с нестандартными путями

```spec
%configure \
    --with-configdir=%{_sysconfdir}/%{name} \
    --with-datadir=%{_datadir}/%{name} \
    --with-rundir=%{_rundir}/%{name}
```

### Отключение ненужных зависимостей

```spec
%configure \
    --disable-dependency-tracking \
    --disable-silent-rules \
    --disable-nls
```

## Типичные проблемы

### «Makefile: No rule to make target 'install'»

Проект не использует стандартный `make install`:

```spec
%install
install -Dm 755 myapp %{buildroot}%{_bindir}/myapp
```

### «libtool: error: cannot find the library»

Путь к библиотеке неверен. Возможно, нужно:

```spec
%configure LDFLAGS="-L%{_libdir}"
```

### Configure падает на зависимости

Проверьте, что установлены `-devel` пакеты:

```bash
sudo dnf install libfoo-devel libbar-devel
```

## Проверьте понимание

1. Какие файлы указывают на использование Autotools?
2. Что делает макрос `%configure`?
3. Как отключить статические библиотеки?
4. Что делать с файлами `.la`?
5. Как запустить configure с опцией `--enable-feature`?

---

**Далее:** [CMake](@/community/intermediate/04-build-systems/cmake.md)
