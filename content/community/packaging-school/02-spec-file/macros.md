+++
title = "Макросы: стандартные, системные, свои"
weight = 6
description = "Переменные и макросы RPM, условные конструкции, определение собственных макросов."
+++

Макросы — это переменные и функции, которые делают SPEC-файлы гибкими, переносимыми и читаемыми.

## Синтаксис макросов

### Простые макросы

```spec
%{name}           # Значение тега Name
%{version}        # Значение тега Version
%{_bindir}        # Путь /usr/bin
```

### Условные макросы

```spec
%{?dist}          # Значение dist, если определён, иначе пусто
%{!?dist:default} # "default", если dist не определён
%{?with_tests:1}  # "1", если with_tests определён
```

### Раскрытие макросов

```bash
# Посмотреть значение
rpm --eval '%{_libdir}'
# /usr/lib64

rpm --eval '%{name}'
# %{name} (не определён вне контекста SPEC)

# Раскрыть сложное выражение
rpm --eval '%{?fedora:Fedora}%{?rhel:RHEL}%{?rosa:ROSA}'
```

## Стандартные макросы

### Теги пакета

```spec
%{name}           # Имя пакета
%{version}        # Версия
%{release}        # Релиз
%{epoch}          # Epoch (или пусто)
%{summary}        # Summary
%{license}        # Лицензия
%{url}            # URL
```

### Пути установки

```spec
%{_prefix}        # /usr
%{_exec_prefix}   # /usr
%{_bindir}        # /usr/bin
%{_sbindir}       # /usr/sbin
%{_libdir}        # /usr/lib64 (на x86_64)
%{_libexecdir}    # /usr/libexec
%{_includedir}    # /usr/include
%{_datadir}       # /usr/share
%{_mandir}        # /usr/share/man
%{_infodir}       # /usr/share/info
%{_docdir}        # /usr/share/doc
%{_sysconfdir}    # /etc
%{_localstatedir} # /var
%{_rundir}        # /run
%{_tmppath}       # /var/tmp
```

### Сборочные пути

```spec
%{buildroot}      # Временный корень установки
%{_builddir}      # ~/rpmbuild/BUILD
%{_sourcedir}     # ~/rpmbuild/SOURCES
%{_specdir}       # ~/rpmbuild/SPECS
%{_srcrpmdir}     # ~/rpmbuild/SRPMS
%{_rpmdir}        # ~/rpmbuild/RPMS
```

### Системная информация

```spec
%{_arch}          # Архитектура (x86_64, aarch64, ...)
%{_host}          # Хост сборки
%{_host_cpu}      # CPU хоста
%{_target}        # Целевая платформа
%{dist}           # Суффикс дистрибутива (.rosa13.1)
```

### Флаги компиляции

```spec
%{optflags}       # Флаги оптимизации (-O2 -g ...)
%{build_cflags}   # CFLAGS
%{build_cxxflags} # CXXFLAGS
%{build_ldflags}  # LDFLAGS
%{_smp_mflags}    # Флаги параллельной сборки (-j8)
```

## Макросы секций

### %configure

```spec
%configure --enable-feature
```

Раскрывается в:
```bash
./configure \
    --build=x86_64-redhat-linux-gnu \
    --host=x86_64-redhat-linux-gnu \
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
    --enable-feature
```

### %make_build, %make_install

```spec
%make_build       # make -O -j8
%make_install     # make install DESTDIR=%{buildroot}
```

### %cmake, %cmake_build, %cmake_install

```spec
%cmake -DFEATURE=ON
%cmake_build
%cmake_install
```

### %meson, %meson_build, %meson_install

```spec
%meson -Dfeature=true
%meson_build
%meson_install
```

### %autosetup

```spec
%autosetup -p1    # Распаковка + патчи
%autosetup -n dir # Указать имя каталога
%autosetup -N     # Без автоматического применения патчей
```

## Определение своих макросов

### Глобальные макросы

```spec
%global project_name MyProject
%global commit abc123def456
%global shortcommit %(c=%{commit}; echo ${c:0:7})
```

`%global` — макрос доступен везде в SPEC.

### Локальные макросы

```spec
%define localvar value
```

`%define` — макрос раскрывается лениво (при использовании).

### Разница %global и %define

```spec
%define lazy %{version}
%global eager %{version}

# Если version изменится, lazy вернёт новое значение
# eager сохранит значение на момент определения
```

**Рекомендация:** Используйте `%global` для констант, `%define` — редко.

### Макросы с параметрами

```spec
%global make_verbose %{__make} VERBOSE=1 %{?_smp_mflags}

%build
%{make_verbose}
```

### Shell-команды в макросах

```spec
%global shortcommit %(c=%{commit}; echo ${c:0:7})
%global git_date %(date +%Y%m%d)
```

`%(...)` выполняет shell-команду и подставляет результат.

## Условные конструкции

### %if / %endif

```spec
%if 0%{?fedora} >= 38
BuildRequires: new-package
%else
BuildRequires: old-package
%endif
```

### %ifarch / %ifnarch

```spec
%ifarch x86_64 aarch64
# Только для этих архитектур
BuildRequires: special-lib
%endif

%ifnarch i686
# Для всех, кроме i686
%global with_feature 1
%endif
```

### %if с макросами

```spec
%if 0%{?with_tests}
%check
make test
%endif
```

`0%{?macro}` — защита от пустого значения (пустота + число = число).

## Опции сборки (bcond)

```spec
# Определение опций
%bcond_without tests    # По умолчанию tests включены
%bcond_with debug       # По умолчанию debug выключен

# Использование
%if %{with tests}
BuildRequires: test-framework
%endif

%build
%configure %{?with_debug:--enable-debug}

%if %{with tests}
%check
make test
%endif
```

**Использование при сборке:**
```bash
rpmbuild --with debug --without tests -ba package.spec
```

## Специальные макросы

### %{?dist}

```spec
Release: 1%{?dist}
# На ROSA: 1.rosa13.1
# На Fedora: 1.fc39
```

### %{?_smp_mflags}

```spec
make %{?_smp_mflags}
# Раскрывается в -j8 (или сколько ядер)
```

### %{SOURCE0}, %{PATCH0}

```spec
# Полный путь к Source0
install -m 644 %{SOURCE1} %{buildroot}%{_unitdir}/

# Полный путь к Patch0
cat %{PATCH0}
```

### %find_lang

```spec
%install
%make_install
%find_lang %{name}

%files -f %{name}.lang
```

### Встроенные Lua-макросы

```spec
%{lua: print(rpm.expand("%{version}"))}
%{lua: 
  local v = rpm.expand("%{version}")
  print(v:gsub("%.", "_"))
}
```

## Файл ~/.rpmmacros

Персональные настройки:

```
%_topdir        %(echo $HOME)/rpmbuild
%packager       Your Name <your@email.com>
%vendor         ROSA Linux
%dist           .rosa13.1

# Отключить debuginfo
%debug_package  %{nil}

# Параллельная сборка
%_smp_mflags    -j8
```

## Системные макросы

Макросы дистрибутива в `/usr/lib/rpm/macros.d/`:

```bash
ls /usr/lib/rpm/macros.d/
# macros.python3
# macros.cmake
# macros.meson
# ...
```

## Отладка макросов

```bash
# Раскрыть все макросы в SPEC
rpmspec --parse package.spec

# Раскрыть конкретный макрос
rpm --eval '%{_libdir}'

# Показать все определённые макросы
rpm --showrc | grep -i macro

# Показать макрос с определением
rpm -E '%{dump}' 2>&1 | grep _bindir
```

## Типичные ошибки

### Пустой макрос ломает синтаксис

```spec
# Опасно — если dist пуст, будет синтаксическая ошибка
%if %{dist} == ".fc39"

# Безопасно
%if "%{?dist}" == ".fc39"
%if 0%{?fedora}
```

### Неправильный порядок %global

```spec
# Неправильно — version ещё не определён
%global archive %{name}-%{version}.tar.gz

Name: myapp
Version: 1.0

# Правильно — определять после тегов или использовать буквальные значения
```

### Лишние пробелы в %define

```spec
# Неправильно — пробел станет частью значения
%global myvar value 

# Правильно
%global myvar value
```

## Проверьте понимание

1. Чем отличается `%{?macro}` от `%{macro}`?
2. Какая разница между `%global` и `%define`?
3. Как выполнить shell-команду в макросе?
4. Что делает `0%{?fedora}`?
5. Как определить опцию сборки, включённую по умолчанию?

---

**Далее:** [Ведение %changelog](changelog.md)
