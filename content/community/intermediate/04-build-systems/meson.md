+++
title = "Meson"
weight = 3
description = "Быстрая и простая система сборки нового поколения."
+++

**Meson** — современная система сборки, известная простотой синтаксиса и скоростью. Использует Ninja как бэкенд по умолчанию.

## Признаки Meson

В исходниках есть:
- `meson.build` в корне
- Возможно, `meson_options.txt` с опциями

## Стандартная сборка

```spec
%build
%meson
%meson_build

%install
%meson_install
```

## Макросы подробно

### %meson

```spec
%meson [опции]
```

Раскрывается примерно в:

```bash
meson setup \
    --buildtype=plain \
    --prefix=/usr \
    --libdir=/usr/lib64 \
    --libexecdir=/usr/libexec \
    --bindir=/usr/bin \
    --sbindir=/usr/sbin \
    --includedir=/usr/include \
    --datadir=/usr/share \
    --mandir=/usr/share/man \
    --infodir=/usr/share/info \
    --localedir=/usr/share/locale \
    --sysconfdir=/etc \
    --localstatedir=/var \
    --sharedstatedir=/var/lib \
    --auto-features=enabled \
    [ваши опции] \
    %{_vpath_builddir}
```

**С опциями:**

```spec
%meson \
    -Dfeature=enabled \
    -Dtests=true \
    -Ddocs=false
```

### %meson_build

```spec
%meson_build [цели]
```

Собирает проект с помощью Ninja.

### %meson_install

```spec
%meson_install
```

Устанавливает в buildroot.

## Полный пример SPEC

```spec
Name:           myapp
Version:        1.0.0
Release:        1%{?dist}
Summary:        My Meson-based application
License:        LGPL-2.1-or-later
URL:            https://gitlab.gnome.org/user/myapp
Source0:        %{url}/-/archive/v%{version}/%{name}-%{version}.tar.bz2

BuildRequires:  meson >= 0.60
BuildRequires:  gcc
BuildRequires:  pkgconfig(glib-2.0) >= 2.70
BuildRequires:  pkgconfig(gtk4)
BuildRequires:  gettext

Requires:       hicolor-icon-theme

%description
My application built with Meson.

%prep
%autosetup

%build
%meson
%meson_build

%install
%meson_install
%find_lang %{name}

%check
%meson_test

%files -f %{name}.lang
%license COPYING
%doc README.md NEWS
%{_bindir}/myapp
%{_datadir}/applications/myapp.desktop
%{_datadir}/icons/hicolor/*/apps/myapp.png
%{_datadir}/glib-2.0/schemas/org.example.myapp.gschema.xml
%{_datadir}/metainfo/myapp.metainfo.xml

%changelog
* Mon Feb 03 2025 Your Name <your@email.com> - 1.0.0-1
- Initial package
```

## Опции Meson

### Просмотр доступных опций

```bash
meson configure
# Или из исходников
cat meson_options.txt
```

### Включение/отключение возможностей

Meson использует три состояния для features:

```spec
%meson \
    -Dfeature=enabled \    # Обязательно включить
    -Dother=disabled \     # Обязательно отключить
    -Dauto=auto            # Автоопределение
```

По умолчанию RPM-макрос включает `--auto-features=enabled`, что означает: если зависимость найдена — feature включается.

### Типичные опции

```spec
%meson \
    -Dtests=true \
    -Ddocs=false \
    -Dman=true \
    -Dsystemd=true \
    -Dgtk_doc=false
```

### Опции с массивами

```spec
%meson \
    -Dbackends=['x11','wayland']
```

## Тестирование

### Макрос %meson_test

```spec
%check
%meson_test
```

Раскрывается в:

```bash
meson test -C %{_vpath_builddir} --no-rebuild --print-errorlogs
```

### С дополнительными опциями

```spec
%check
%meson_test --timeout-multiplier 2
```

### Пропуск тестов

```spec
%check
%meson_test --no-suite slow
```

## Субпроекты и wrap

Meson поддерживает субпроекты (bundled-зависимости) через `subprojects/`:

```spec
%prep
%autosetup

# Удалить bundled-библиотеки, использовать системные
rm -rf subprojects/zlib
rm -rf subprojects/libfoo.wrap

%build
%meson -Dwrap_mode=nofallback
%meson_build
```

`-Dwrap_mode=nofallback` — не использовать субпроекты, если системная библиотека найдена.

## Introspection и доступные опции

```bash
# Посмотреть все опции
meson configure builddir/

# Посмотреть конкретную опцию
meson configure builddir/ | grep feature

# Изменить опцию (для отладки)
meson configure builddir/ -Dfeature=disabled
```

## Особенности GNOME-проектов

Многие GNOME-проекты используют Meson:

```spec
BuildRequires:  meson
BuildRequires:  pkgconfig(glib-2.0)
BuildRequires:  pkgconfig(gtk4)
BuildRequires:  pkgconfig(libadwaita-1)
BuildRequires:  desktop-file-utils
BuildRequires:  appstream
BuildRequires:  gettext

%install
%meson_install
%find_lang %{name}

%check
appstream-util validate-relax --nonet %{buildroot}%{_datadir}/metainfo/*.xml
desktop-file-validate %{buildroot}%{_datadir}/applications/*.desktop
```

## Кросс-компиляция

Для cross-файла:

```spec
%build
%meson --cross-file=%{SOURCE1}
%meson_build
```

## Типичные проблемы

### «Dependency X not found»

```
meson.build:10:0: ERROR: Dependency "gtk4" not found
```

Найти и добавить BuildRequires:

```bash
dnf provides 'pkgconfig(gtk4)'
# gtk4-devel
```

### «Option X does not exist»

Опечатка в имени опции или устаревшая опция:

```bash
meson configure | grep -i option
```

### «Program not found: ninja»

```bash
sudo dnf install ninja-build
```

### Конфликт версий Meson

```spec
BuildRequires:  meson >= 0.60
```

## Отладка Meson

### Подробный вывод

```spec
%build
%meson
%meson_build -v
```

### Посмотреть конфигурацию

```bash
cat %{_vpath_builddir}/meson-logs/meson-log.txt
```

### Пересборка с изменёнными опциями

```bash
meson configure %{_vpath_builddir} -Dfeature=true
ninja -C %{_vpath_builddir}
```

## Сравнение с CMake

| Аспект | Meson | CMake |
|--------|-------|-------|
| Синтаксис | Простой, Python-подобный | Сложнее |
| Бэкенд | Ninja (по умолчанию) | Make/Ninja |
| Скорость | Быстрее | Медленнее |
| Features | enabled/disabled/auto | ON/OFF |
| Субпроекты | wrap | FetchContent |

## Проверьте понимание

1. Какой файл указывает на использование Meson?
2. Чем отличаются состояния `enabled`, `disabled`, `auto` для опций?
3. Как запустить тесты Meson-проекта?
4. Как отключить использование bundled-библиотек?
5. Как узнать, какие опции поддерживает проект?

---

**Далее:** [Python: setuptools и wheel](@/community/intermediate/04-build-systems/python-setuptools.md)
