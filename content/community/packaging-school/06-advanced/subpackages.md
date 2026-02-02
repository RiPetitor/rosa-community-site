+++
title = "Подпакеты: -devel, -doc, -libs"
weight = 2
description = "Разделение пакета на логические части и правила для -devel."
+++

Разделение на подпакеты — обязательная практика для библиотек и крупных проектов.

## Зачем это нужно

- Пользователь устанавливает только то, что нужно
- Разработчики получают заголовки и линковочные файлы
- Документация не тянется по умолчанию

## Типичные подпакеты

- **Основной пакет** — бинарники или runtime-библиотеки
- **-devel** — заголовки, `.so`-линк, `pkgconfig`, CMake-конфиги
- **-doc** — документация
- **-libs** — отдельный runtime для библиотек

## Пример SPEC

```spec
%package devel
Summary:        Development files for %{name}
Requires:       %{name}%{?_isa} = %{version}-%{release}

%description devel
Header files and libraries for developing with %{name}.

%files
%{_libdir}/libfoo.so.*

%files devel
%{_includedir}/foo/
%{_libdir}/libfoo.so
%{_libdir}/pkgconfig/foo.pc
%{_libdir}/cmake/Foo/
```

## Правила для -devel

- Всегда зависит от runtime-пакета
- Содержит **только** файлы разработки
- `.so` без версии — только в `-devel`

## Документация

Документы можно вынести в `-doc`, если их много:

```spec
%package doc
Summary: Documentation for %{name}

%files doc
%doc README.md docs/*
```
