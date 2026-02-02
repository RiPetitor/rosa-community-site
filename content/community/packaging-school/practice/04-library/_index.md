+++
title = "Практикум 4: Библиотека с подпакетом -devel (libyaml)"
weight = 4
description = "Разделение библиотеки на runtime и -devel на примере libyaml."
template = "community.html"
+++

Библиотеки почти всегда требуют подпакетов. Здесь разберём **libyaml** — C-библиотеку для YAML.

## Что вы узнаете

- Как выделять `-devel`
- Где должны лежать заголовки, `.so`-линки и `pkgconfig`
- Зачем нужен `ldconfig`

## Шаг 1: Скачивание исходников

```bash
cd ~/rpmbuild/SOURCES

# Пример версии — обновите при необходимости
export VER=0.2.5

curl -L -o yaml-${VER}.tar.gz \
  https://pyyaml.org/download/libyaml/yaml-${VER}.tar.gz
```

## Шаг 2: Создание SPEC-файла

Создайте `~/rpmbuild/SPECS/libyaml.spec`:

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
LibYAML is a C library for parsing and emitting YAML.

%package devel
Summary:        Development files for libyaml
Requires:       %{name}%{?_isa} = %{version}-%{release}

%description devel
Header files and libraries for developing with libyaml.

%prep
%autosetup -n yaml-%{version}

%build
%configure
%make_build

%install
%make_install

%post -p /sbin/ldconfig
%postun -p /sbin/ldconfig

%files
%license LICENSE
%doc README
%{_libdir}/libyaml.so.*

%files devel
%{_includedir}/yaml.h
%{_libdir}/libyaml.so
%{_libdir}/pkgconfig/yaml-0.1.pc

%changelog
* Mon Feb 02 2026 Your Name <your@email.com> - 0.2.5-1
- Initial package for ROSA Linux
```

Проверьте реальные имена файлов документации/лицензии в архиве и скорректируйте `%doc` и `%license`.

## Шаг 3: Сборка и проверка

```bash
rpmbuild -ba libyaml.spec
rpmlint ~/rpmbuild/RPMS/x86_64/libyaml-*.rpm
rpmlint ~/rpmbuild/RPMS/x86_64/libyaml-devel-*.rpm
```

## Типичные ошибки

- **Заголовки попали в основной пакет** — перенесите их в `-devel`
- **Нет `.so`-линка** — он должен быть в `-devel`
- **Забыли `ldconfig`** — для библиотек с `.so.*` используйте скриптлеты

---

**Следующий практикум:** [CMake-проект (fmt)](../05-cmake-project/_index.md)
