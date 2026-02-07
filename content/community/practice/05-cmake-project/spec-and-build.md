+++
title = "Подготовка, скачивание и сборка"
weight = 2
+++

## Шаг 1: Подготовка окружения

```bash
sudo dnf install rpm-build rpmdevtools rpmlint cmake ninja-build gcc-c++
rpmdev-setuptree
```

Проверьте версии инструментов:

```bash
cmake --version
# Ожидаемый вывод: cmake version 3.2x.x (или новее)

ninja --version
# Ожидаемый вывод: 1.1x.x (или новее)
```

## Шаг 2: Скачивание исходников

```bash
cd ~/rpmbuild/SOURCES

export VER=10.1.1

curl -L -o fmt-${VER}.tar.gz \
  https://github.com/fmtlib/fmt/archive/refs/tags/${VER}.tar.gz
```

Проверьте содержимое:

```bash
tar tzf fmt-${VER}.tar.gz | head -10
```

Ожидаемый вывод:

```
fmt-10.1.1/
fmt-10.1.1/.clang-format
fmt-10.1.1/.github/
fmt-10.1.1/CMakeLists.txt
fmt-10.1.1/LICENSE
fmt-10.1.1/README.md
fmt-10.1.1/include/
fmt-10.1.1/include/fmt/
fmt-10.1.1/src/
...
```

Обратите внимание: корневой каталог — `fmt-10.1.1`, файл конфигурации — `CMakeLists.txt`.

## Шаг 3: Изучение CMake-опций проекта

Прежде чем писать SPEC, полезно узнать, какие опции есть у проекта.
Распакуйте архив и изучите:

```bash
cd /tmp
tar xzf ~/rpmbuild/SOURCES/fmt-${VER}.tar.gz
cd fmt-${VER}

# Способ 1: Прочитать CMakeLists.txt (ищите option() и set(...CACHE))
grep -n 'option(' CMakeLists.txt
```

Ожидаемый вывод:

```
84:option(FMT_PEDANTIC "Enable extra warnings and expensive tests." OFF)
85:option(FMT_WERROR "Halt the compiler with an error on compiler warnings." OFF)
86:option(FMT_DOC "Generate the doc target." OFF)
87:option(FMT_INSTALL "Generate the install target." ON)
88:option(FMT_TEST "Generate the test target." OFF)
89:option(FMT_FUZZ "Generate the fuzz target." OFF)
90:option(FMT_CUDA_TEST "Generate the cuda-test target." OFF)
91:option(FMT_OS "Include core requiring OS (Windows/Posix) " ON)
92:option(FMT_MODULE "Build a module instead of a traditional library." OFF)
93:option(FMT_SYSTEM_HEADERS "Expose headers with marking them as system." OFF)
```

```bash
# Способ 2: Запустить cmake -LAH для просмотра всех переменных
cmake -B /tmp/fmt-opts -LAH 2>/dev/null | grep -E "^(BUILD_|FMT_|CMAKE_BUILD)" | head -20
```

Ожидаемый вывод:

```
BUILD_SHARED_LIBS:BOOL=OFF
CMAKE_BUILD_TYPE:STRING=
FMT_DOC:BOOL=OFF
FMT_INSTALL:BOOL=ON
FMT_MODULE:BOOL=OFF
FMT_OS:BOOL=ON
FMT_PEDANTIC:BOOL=OFF
FMT_TEST:BOOL=OFF
FMT_WERROR:BOOL=OFF
```

Видим: `BUILD_SHARED_LIBS` по умолчанию `OFF` — без явного включения
мы получим только статическую библиотеку.

```bash
# Очистка
rm -rf /tmp/fmt-${VER} /tmp/fmt-opts
```

## Шаг 4: Создание SPEC-файла

Создайте `~/rpmbuild/SPECS/fmt.spec`:

```spec
Name:           fmt
Version:        10.1.1
Release:        1%{?dist}
Summary:        Small, safe and fast formatting library for C++

License:        MIT
URL:            https://github.com/fmtlib/fmt
Source0:        https://github.com/fmtlib/fmt/archive/refs/tags/%{version}.tar.gz

BuildRequires:  cmake
BuildRequires:  ninja-build
BuildRequires:  gcc-c++

%description
fmt is an open-source formatting library providing a fast and safe
alternative to C stdio and C++ iostreams. It supports Python-like
format string syntax, positional arguments, and user-defined types.

# =============================================
# Подпакет -devel
# =============================================
%package devel
Summary:        Development files for fmt
Requires:       %{name}%{?_isa} = %{version}-%{release}

%description devel
Header files, CMake config files, and pkg-config file for developing
applications that use fmt.

# =============================================
# Подготовка: распаковка
# =============================================
%prep
# Каталог в архиве: fmt-10.1.1 — совпадает с %{name}-%{version},
# поэтому -n не нужен.
%autosetup -n fmt-%{version}

# =============================================
# Конфигурация и сборка
# =============================================
%build
# %cmake создаёт каталог сборки (out-of-source) и вызывает cmake
# с правильными путями для дистрибутива.
#
# -G Ninja          — использовать Ninja вместо Make (быстрее)
# -DBUILD_SHARED_LIBS=ON — собирать .so, а не .a
# -DFMT_TEST=ON     — собирать тесты (для %check)
%cmake -G Ninja \
    -DBUILD_SHARED_LIBS=ON \
    -DFMT_TEST=ON

# %cmake_build запускает сборку в каталоге, созданном %cmake.
# С Ninja вы увидите прогресс вроде [1/42], [2/42], ...
%cmake_build

# =============================================
# Запуск тестов
# =============================================
%check
# %ctest запускает тесты из каталога сборки.
# Это эквивалентно: cd <builddir> && ctest --output-on-failure
%ctest

# =============================================
# Установка
# =============================================
%install
# %cmake_install вызывает cmake --install с DESTDIR=%{buildroot}.
# Файлы попадут в ~/rpmbuild/BUILDROOT/fmt-10.1.1-.../usr/
%cmake_install

# =============================================
# Скриптлеты: обновление кэша библиотек
# =============================================
%post -p /sbin/ldconfig
%postun -p /sbin/ldconfig

# =============================================
# Файлы основного пакета (runtime)
# =============================================
%files
%license LICENSE
%doc README.md ChangeLog.md
# Только версионированные .so файлы — то, что нужно для запуска:
# libfmt.so.10 (SONAME-ссылка)
# libfmt.so.10.1.1 (реальный файл)
%{_libdir}/libfmt.so.*

# =============================================
# Файлы подпакета -devel
# =============================================
%files devel
# Ссылка для линковщика (без номера версии)
%{_libdir}/libfmt.so
# Заголовочные файлы — каталог целиком
%{_includedir}/fmt/
# CMake config files — ОБЯЗАТЕЛЬНО! Без них find_package(fmt) не работает
%{_libdir}/cmake/fmt/
# pkgconfig файл для совместимости с не-CMake проектами
%{_libdir}/pkgconfig/fmt.pc

%changelog
* Sat Feb 08 2026 Your Name <your@email.com> - 10.1.1-1
- Initial package for ROSA Linux
```

### Разбор ключевых моментов

#### Секция %check и тесты

```spec
%check
%ctest
```

Макрос `%ctest` запускает CTest — тестовый фреймворк CMake. Он:
1. Переходит в каталог сборки
2. Вызывает `ctest --output-on-failure`
3. При неудаче показывает вывод упавших тестов

Мы включили тесты через `-DFMT_TEST=ON`. Без этого флага тесты
не будут собраны и `%ctest` ничего не запустит.

Ожидаемый вывод тестов (при успехе):

```
Test project /home/user/rpmbuild/BUILD/fmt-10.1.1/x86_64-redhat-linux-gnu
      Start  1: args-test
 1/16 Test  #1: args-test ................   Passed    0.01 sec
      Start  2: assert-test
 2/16 Test  #2: assert-test ..............   Passed    0.01 sec
...
16/16 Test #16: xchar-test ...............   Passed    0.03 sec

100% tests passed, 0 tests failed out of 16
```

#### Каталог cmake/fmt/ в -devel

Это один из самых важных моментов. Когда другой CMake-проект пишет:

```cmake
find_package(fmt REQUIRED)
target_link_libraries(myapp fmt::fmt)
```

CMake ищет файлы конфигурации в `/usr/lib64/cmake/fmt/`. Если их нет —
`find_package` падает с ошибкой:

```
CMake Error at CMakeLists.txt:10 (find_package):
  Could not find a package configuration file provided by "fmt"
```

Это частая ошибка новичков: забыть включить `%{_libdir}/cmake/fmt/` в `-devel`.

## Шаг 5: Сборка

```bash
cd ~/rpmbuild/SPECS
rpmbuild -ba fmt.spec
```

Сборка с тестами займёт 2-5 минут. Следите за выводом.

**Ожидаемый успешный вывод (последние строки):**

```
Wrote: /home/user/rpmbuild/SRPMS/fmt-10.1.1-1.rosa13.1.src.rpm
Wrote: /home/user/rpmbuild/RPMS/x86_64/fmt-10.1.1-1.rosa13.1.x86_64.rpm
Wrote: /home/user/rpmbuild/RPMS/x86_64/fmt-devel-10.1.1-1.rosa13.1.x86_64.rpm
Wrote: /home/user/rpmbuild/RPMS/x86_64/fmt-debuginfo-10.1.1-1.rosa13.1.x86_64.rpm
```
