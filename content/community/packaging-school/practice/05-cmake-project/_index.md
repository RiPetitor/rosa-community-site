+++
title = "Практикум 5: CMake-проект (fmt)"
weight = 5
description = "Сборка и упаковка fmt — C++ библиотеки на CMake."
template = "community.html"
+++

CMake — один из самых распространённых инструментов для C/C++ проектов. Упакуем **fmt**.

## Что вы узнаете

- Как использовать `%cmake` макросы
- Как управлять базовыми опциями сборки
- Как оформить `-devel` для CMake-проекта

## Шаг 1: Подготовка окружения

```bash
sudo dnf install rpm-build rpmdevtools cmake ninja-build gcc gcc-c++
rpmdev-setuptree
```

## Шаг 2: Скачивание исходников

```bash
cd ~/rpmbuild/SOURCES

# Пример версии — обновите при необходимости
export VER=10.1.1

curl -L -o fmt-${VER}.tar.gz \
  https://github.com/fmtlib/fmt/archive/refs/tags/${VER}.tar.gz
```

## Шаг 3: Создание SPEC-файла

Создайте `~/rpmbuild/SPECS/fmt.spec`:

```spec
Name:           fmt
Version:        10.1.1
Release:        1%{?dist}
Summary:        Small, safe and fast formatting library

License:        MIT
URL:            https://github.com/fmtlib/fmt
Source0:        https://github.com/fmtlib/fmt/archive/refs/tags/%{version}.tar.gz

BuildRequires:  cmake
BuildRequires:  ninja-build
BuildRequires:  gcc-c++

%description
fmt is a formatting library for C++.

%package devel
Summary:        Development files for fmt
Requires:       %{name}%{?_isa} = %{version}-%{release}

%description devel
Header files and CMake config for fmt.

%prep
%autosetup -n fmt-%{version}

%build
%cmake -G Ninja \
    -DBUILD_SHARED_LIBS=ON \
    -DBUILD_TESTING=OFF
%cmake_build

%install
%cmake_install

%files
%license LICENSE*
%doc README.md
%{_libdir}/libfmt.so.*

%files devel
%{_includedir}/fmt/
%{_libdir}/libfmt.so
%{_libdir}/cmake/fmt/
%{_libdir}/pkgconfig/fmt.pc

%changelog
* Mon Feb 02 2026 Your Name <your@email.com> - 10.1.1-1
- Initial package for ROSA Linux
```

Если имена файлов лицензии отличаются, поправьте `%license`.

## Шаг 4: Сборка и проверка

```bash
rpmbuild -ba fmt.spec
rpmlint ~/rpmbuild/RPMS/x86_64/fmt-*.rpm
rpmlint ~/rpmbuild/RPMS/x86_64/fmt-devel-*.rpm
```

## Типичные проблемы

- **Тесты падают** — держите их в `%check` и делайте опциональными
- **Неправильные пути установки** — проверьте `CMAKE_INSTALL_PREFIX` (обычно `/usr`)

---

**Следующий практикум:** [Патчи и backport (htop)](../06-patching/_index.md)
