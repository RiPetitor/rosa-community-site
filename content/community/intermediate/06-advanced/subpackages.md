+++
title = "Подпакеты: -devel, -doc, -libs"
weight = 2
description = "Разделение пакета на логические части и правила для -devel."
+++

Разделение на подпакеты — обязательная практика для библиотек и крупных проектов. Пользователю не нужны заголовочные файлы, а разработчику не нужны man-страницы приложения.

## Зачем это нужно

- **Экономия места:** пользователь устанавливает только то, что нужно
- **Чистые зависимости:** пакет, зависящий от библиотеки, тянет только runtime, а не заголовки
- **Параллельная установка:** `-devel` можно установить только при разработке
- **Гранулярность обновлений:** обновление документации не требует пересборки бинарников

## Типичные подпакеты

| Подпакет | Содержит | Когда нужен |
|----------|----------|-------------|
| Основной | Бинарники или runtime-библиотеки (`.so.*`) | Всегда |
| `-devel` | Заголовки, `.so`-линк, `pkgconfig`, CMake-конфиги | Библиотека |
| `-libs` | Только `.so.*` (если основной пакет — приложение) | Приложение + библиотека |
| `-doc` | Документация (doxygen, sphinx, man-страницы) | Много документации |
| `-static` | Статические библиотеки `.a` | По запросу |
| `-tools` | Утилиты командной строки | Библиотека с CLI-инструментами |

## Полный пример: библиотека с подпакетами

```spec
Name:           libfoo
Version:        2.1.0
Release:        1%{?dist}
Summary:        Foo library for data processing

License:        MIT
URL:            https://github.com/example/libfoo
Source0:        %{url}/archive/v%{version}/%{name}-%{version}.tar.gz

BuildRequires:  gcc
BuildRequires:  cmake
BuildRequires:  pkgconfig(zlib)

%description
LibFoo is a high-performance library for data processing.
This package contains the shared library needed to run
applications linked with libfoo.

# --- Подпакет devel ---
%package devel
Summary:        Development files for %{name}
Requires:       %{name}%{?_isa} = %{version}-%{release}
Requires:       pkgconfig(zlib)

%description devel
Header files, unversioned shared library symlink, and
pkg-config file for developing applications with %{name}.

# --- Подпакет doc ---
%package doc
Summary:        Documentation for %{name}
BuildArch:      noarch

%description doc
API documentation and examples for %{name}.

%prep
%autosetup

%build
%cmake -DBUILD_SHARED_LIBS=ON \
       -DBUILD_DOC=ON
%cmake_build

%install
%cmake_install

%post -p /sbin/ldconfig
%postun -p /sbin/ldconfig

# --- Основной пакет: только runtime ---
%files
%license LICENSE
%{_libdir}/libfoo.so.2*

# --- devel: всё для разработки ---
%files devel
%{_includedir}/foo/
%{_libdir}/libfoo.so
%{_libdir}/pkgconfig/foo.pc
%{_libdir}/cmake/Foo/

# --- doc: документация ---
%files doc
%doc README.md CHANGELOG.md
%doc docs/examples/
%{_docdir}/%{name}/html/

%changelog
* Mon Feb 03 2025 Your Name <your@email.com> - 2.1.0-1
- Initial package
```

## Правила для `-devel`

### Что должно быть в `-devel`

- Заголовочные файлы (`%{_includedir}/`)
- Симлинк `.so` без версии (`libfoo.so` → `libfoo.so.2.1.0`)
- Файлы `pkg-config` (`*.pc`)
- CMake-конфиги (`%{_libdir}/cmake/Foo/`)
- Статические библиотеки `.a` (или вынесите в `-static`)

### Что НЕ должно быть в `-devel`

- Версионированные `.so` (`libfoo.so.2`, `libfoo.so.2.1.0`) — это runtime
- Бинарники приложения
- Документация пользователя

### Обязательные зависимости `-devel`

```spec
%package devel
Requires:       %{name}%{?_isa} = %{version}-%{release}
```

- `%{?_isa}` обеспечивает совпадение архитектуры (`.x86_64`, `.aarch64`)
- Если `-devel` зависит от `-devel` другой библиотеки, укажите это:

```spec
%package devel
Requires:       %{name}%{?_isa} = %{version}-%{release}
Requires:       pkgconfig(zlib)
Requires:       pkgconfig(openssl)
```

## Паттерн: приложение + библиотека (`-libs`)

Когда проект — это и приложение, и библиотека:

```spec
Name:           foo

%description
Foo is a data processing tool.

# Библиотека выносится в -libs
%package libs
Summary:        Shared libraries for %{name}

%description libs
Shared libraries used by %{name} and other applications.

%package devel
Summary:        Development files for %{name}
Requires:       %{name}-libs%{?_isa} = %{version}-%{release}

%description devel
Header files and libraries for developing with %{name}.

# Основной пакет — приложение, зависит от libs
%files
%{_bindir}/foo
%{_mandir}/man1/foo.1*

%files libs
%license LICENSE
%{_libdir}/libfoo.so.2*

%files devel
%{_includedir}/foo/
%{_libdir}/libfoo.so
%{_libdir}/pkgconfig/foo.pc
```

Зависимость основного пакета от `-libs` будет определена автоматически по `libfoo.so.2`.

## Версионирование `.so` файлов (SONAME)

Правильное понимание SONAME критично для подпакетов:

```
libfoo.so        → симлинк, для линковки (devel)
libfoo.so.2      → симлинк SONAME (runtime, ищется при запуске)
libfoo.so.2.1.0  → реальный файл (runtime)
```

В `%files`:

```spec
# runtime — версионированные файлы
%files
%{_libdir}/libfoo.so.2*

# devel — невесионированный симлинк
%files devel
%{_libdir}/libfoo.so
```

**Почему `so.2*`?** Glob `libfoo.so.2*` захватит и `libfoo.so.2`, и `libfoo.so.2.1.0`.

## Подпакет `-static`

Статические библиотеки по умолчанию не нужны. Выносите в отдельный подпакет:

```spec
%package static
Summary:        Static library for %{name}
Requires:       %{name}-devel%{?_isa} = %{version}-%{release}

%description static
Static library for linking %{name} statically.

%files static
%{_libdir}/libfoo.a
```

## Удаление `.la` файлов

Libtool создаёт `.la` файлы, которые не нужны в современных системах:

```spec
%install
%make_install

# Удалить .la файлы
find %{buildroot} -name '*.la' -delete
```

Если не удалить — rpmlint выдаст предупреждение, и файлы попадут в «unpackaged».

## Noarch-подпакеты

Документация и данные не зависят от архитектуры:

```spec
%package doc
Summary:        Documentation for %{name}
BuildArch:      noarch

%files doc
%doc docs/
```

`BuildArch: noarch` означает, что подпакет один для всех архитектур.

## Типичные ошибки

### `.so` без версии в основном пакете

```
W: devel-file-in-non-devel-package /usr/lib64/libfoo.so
```

**Решение:** перенесите `libfoo.so` (без версии) в `-devel`.

### Заголовки в основном пакете

```
W: devel-file-in-non-devel-package /usr/include/foo.h
```

**Решение:** создайте подпакет `-devel` и перенесите заголовки туда.

### `-devel` без зависимости на runtime

```spec
# НЕПРАВИЛЬНО
%package devel
Summary:  Development files

# ПРАВИЛЬНО
%package devel
Summary:  Development files
Requires: %{name}%{?_isa} = %{version}-%{release}
```

### Файлы указаны дважды

```
File listed twice: /usr/lib64/libfoo.so.2.1.0
```

**Причина:** файл попал и в основной пакет, и в `-devel`.

**Решение:** проверьте glob-паттерны. `%{_libdir}/libfoo.so.*` захватит и `libfoo.so.2.1.0`, и `libfoo.so.2`. Используйте точные паттерны:

```spec
%files
%{_libdir}/libfoo.so.2*

%files devel
%{_libdir}/libfoo.so
```

## Проверьте понимание

1. Зачем разделять пакет на подпакеты?
2. Какие файлы должны быть в `-devel`, а какие в основном пакете?
3. Что такое SONAME и как это влияет на `%files`?
4. Когда нужен подпакет `-libs`?
5. Зачем указывать `%{?_isa}` в зависимости `-devel` от основного пакета?

---

**Далее:** [Скриптлеты и триггеры](@/community/intermediate/06-advanced/scriptlets.md)
