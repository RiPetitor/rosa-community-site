+++
title = "CMake"
weight = 2
description = "Современная кроссплатформенная система сборки."
+++

**CMake** — популярная кроссплатформенная система сборки. Генерирует Makefile (или Ninja) из описания `CMakeLists.txt`.

## Признаки CMake

В исходниках есть:
- `CMakeLists.txt` в корне
- Возможно, каталог `cmake/` с модулями

## Стандартная сборка

```spec
%build
%cmake
%cmake_build

%install
%cmake_install
```

## Макросы подробно

### %cmake

```spec
%cmake [опции]
```

Раскрывается примерно в:

```bash
mkdir -p redhat-linux-build
cd redhat-linux-build
cmake .. \
    -DCMAKE_INSTALL_PREFIX=/usr \
    -DCMAKE_BUILD_TYPE=RelWithDebInfo \
    -DCMAKE_C_FLAGS="%{optflags}" \
    -DCMAKE_CXX_FLAGS="%{optflags}" \
    -DCMAKE_INSTALL_LIBDIR=/usr/lib64 \
    -DCMAKE_INSTALL_INCLUDEDIR=/usr/include \
    -DCMAKE_INSTALL_SYSCONFDIR=/etc \
    [ваши опции]
```

**С опциями:**

```spec
%cmake \
    -DENABLE_TESTS=ON \
    -DWITH_GTK4=ON \
    -DBUILD_SHARED_LIBS=ON
```

### %cmake_build

```spec
%cmake_build [цели]
```

Собирает проект в каталоге сборки.

### %cmake_install

```spec
%cmake_install
```

Устанавливает в buildroot.

## Полный пример SPEC

```spec
Name:           myproject
Version:        1.0.0
Release:        1%{?dist}
Summary:        My CMake project
License:        MIT
URL:            https://github.com/user/myproject
Source0:        %{url}/archive/v%{version}/%{name}-%{version}.tar.gz

BuildRequires:  cmake >= 3.16
BuildRequires:  gcc-c++
BuildRequires:  ninja-build
BuildRequires:  pkgconfig(Qt6Core)
BuildRequires:  pkgconfig(Qt6Widgets)

%description
My project built with CMake.

%package devel
Summary:        Development files for %{name}
Requires:       %{name}%{?_isa} = %{version}-%{release}

%description devel
Development files for %{name}.

%prep
%autosetup

%build
%cmake -GNinja
%cmake_build

%install
%cmake_install

%check
%ctest

%files
%license LICENSE
%doc README.md
%{_bindir}/myapp
%{_libdir}/libmylib.so.1*

%files devel
%{_includedir}/mylib/
%{_libdir}/libmylib.so
%{_libdir}/cmake/mylib/
%{_libdir}/pkgconfig/mylib.pc

%changelog
* Mon Feb 03 2025 Your Name <your@email.com> - 1.0.0-1
- Initial package
```

## Использование Ninja

Ninja быстрее Make для больших проектов:

```spec
BuildRequires:  ninja-build

%build
%cmake -GNinja
%cmake_build

%install
%cmake_install
```

## Типичные опции CMake

### Типы сборки

```spec
%cmake -DCMAKE_BUILD_TYPE=Release
# Или для отладки
%cmake -DCMAKE_BUILD_TYPE=Debug
```

RPM по умолчанию использует `RelWithDebInfo` (оптимизация + отладочные символы).

### Включение/отключение возможностей

```spec
%cmake \
    -DENABLE_TESTS=ON \
    -DENABLE_DOCS=OFF \
    -DWITH_SYSTEMD=ON \
    -DBUILD_SHARED_LIBS=ON
```

### Пути установки

```spec
%cmake \
    -DCMAKE_INSTALL_SYSCONFDIR=%{_sysconfdir} \
    -DCMAKE_INSTALL_LOCALSTATEDIR=%{_localstatedir}
```

### Использование системных библиотек

```spec
%cmake \
    -DUSE_SYSTEM_ZLIB=ON \
    -DUSE_BUNDLED_SQLITE=OFF
```

## Тестирование

### Макрос %ctest

```spec
%check
%ctest
```

Раскрывается в:

```bash
cd redhat-linux-build
ctest --output-on-failure
```

### С дополнительными опциями

```spec
%check
%ctest --timeout 300
```

### Пропуск определённых тестов

```spec
%check
%ctest --exclude-regex "slow_test|flaky_test"
```

## Отладка CMake

### Посмотреть доступные опции

```bash
cd ~/rpmbuild/BUILD/project-1.0
cmake -LH .
# Или интерактивно
ccmake .
```

### Посмотреть, что определено

```bash
cat CMakeCache.txt | grep -v "^#" | grep -v "^$"
```

### Verbose-сборка

```spec
%build
%cmake
%cmake_build -- VERBOSE=1
```

## Out-of-source сборка

RPM-макросы автоматически создают отдельный каталог сборки:

```
BUILD/project-1.0/
├── CMakeLists.txt
├── src/
└── redhat-linux-build/    ← Каталог сборки
    ├── CMakeCache.txt
    └── Makefile
```

## Особые случаи

### In-source сборка (если требуется)

```spec
%build
%cmake -B .
%cmake_build

%install
%cmake_install -B .
```

### Несколько конфигураций

```spec
%build
# Release
%cmake -B build-release -DCMAKE_BUILD_TYPE=Release
%cmake_build -B build-release

# Debug (если нужно)
%cmake -B build-debug -DCMAKE_BUILD_TYPE=Debug
%cmake_build -B build-debug
```

### CMake presets

Если проект использует `CMakePresets.json`:

```spec
%build
cmake --preset release
cmake --build --preset release

%install
DESTDIR=%{buildroot} cmake --install build/release
```

## Типичные проблемы

### «Could not find package X»

```
CMake Error: Could not find a package configuration file provided by "X"
```

Найти и добавить BuildRequires:

```bash
dnf provides '*/XConfig.cmake'
dnf provides 'cmake(X)'
```

### «Imported target not found»

Библиотека установлена, но CMake её не видит. Возможно, нужен `-devel` пакет:

```bash
dnf provides 'cmake(Qt6Core)'
# qt6-qtbase-devel
```

### Конфликт версий CMake

```spec
BuildRequires:  cmake >= 3.16
```

### Неправильный путь библиотек

```spec
%cmake -DCMAKE_INSTALL_LIBDIR=%{_libdir}
```

## Полезные переменные CMake

| Переменная | Назначение |
|------------|------------|
| `CMAKE_INSTALL_PREFIX` | Префикс установки (/usr) |
| `CMAKE_BUILD_TYPE` | Тип сборки (Release, Debug, ...) |
| `CMAKE_INSTALL_LIBDIR` | Каталог библиотек (lib64) |
| `BUILD_SHARED_LIBS` | Собирать разделяемые библиотеки |
| `CMAKE_VERBOSE_MAKEFILE` | Подробный вывод |

## Проверьте понимание

1. Какой файл указывает на использование CMake?
2. Что делает опция `-GNinja`?
3. Как запустить тесты CMake-проекта?
4. Как узнать, какие опции поддерживает проект?
5. Как включить опцию `ENABLE_FEATURE`?

---

**Далее:** [Meson](meson.md)
