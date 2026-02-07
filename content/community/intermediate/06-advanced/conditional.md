+++
title = "Условные сборки и bcond"
weight = 4
description = "Опции сборки, архитектурные условия и флаги %bcond."
+++

Условные сборки позволяют включать и отключать функции пакета без правки SPEC-файла. Это полезно для опциональных зависимостей, тестов, специфичных архитектур.

## Механизм bcond

### Определение опции

```spec
# Тесты ОТКЛЮЧЕНЫ по умолчанию (нужно --with tests для включения)
%bcond_with tests

# Документация ВКЛЮЧЕНА по умолчанию (нужно --without docs для отключения)
%bcond_without docs
```

Логика может показаться контринтуитивной:
- `%bcond_with X` — по умолчанию **без** X (нужен `--with X` для включения)
- `%bcond_without X` — по умолчанию **с** X (нужен `--without X` для отключения)

### Использование в SPEC

```spec
%bcond_with tests
%bcond_without docs

BuildRequires:  gcc
%if %{with docs}
BuildRequires:  doxygen
%endif
%if %{with tests}
BuildRequires:  pytest
%endif

%build
%cmake \
    -DBUILD_DOC=%{?with_docs:ON}%{!?with_docs:OFF} \
    -DBUILD_TESTS=%{?with_tests:ON}%{!?with_tests:OFF}
%cmake_build

%check
%if %{with tests}
%ctest
%endif
```

### Сборка с опциями

```bash
# С тестами (по умолчанию отключены)
rpmbuild -ba package.spec --with tests

# Без документации (по умолчанию включена)
rpmbuild -ba package.spec --without docs

# Комбинация
rpmbuild -ba package.spec --with tests --without docs
```

## Типичные сценарии bcond

### Тесты

Тесты часто требуют сеть или дополнительные зависимости, недоступные на ABF:

```spec
%bcond_with tests

%if %{with tests}
BuildRequires:  python3-pytest
BuildRequires:  python3-mock
%endif

%check
%if %{with tests}
%pytest -q -k "not network"
%endif
```

### GUI и серверная сборка

```spec
%bcond_without gui

%if %{with gui}
BuildRequires:  pkgconfig(gtk+-3.0)
BuildRequires:  pkgconfig(glib-2.0)
%endif

%build
%cmake \
    -DENABLE_GUI=%{?with_gui:ON}%{!?with_gui:OFF}
%cmake_build
```

### Опциональная зависимость от конкретной библиотеки

```spec
%bcond_without pcre2

%if %{with pcre2}
BuildRequires:  pkgconfig(libpcre2-8)
%endif

%build
%configure \
    %{?with_pcre2:--enable-pcre2} \
    %{!?with_pcre2:--disable-pcre2}
```

## Архитектурные условия

### Условные зависимости по архитектуре

```spec
%ifarch x86_64 aarch64
BuildRequires:  libatomic-devel
%endif

%ifarch %{ix86}
BuildRequires:  nasm
%endif
```

### Ограничение архитектур

```spec
# Собирать ТОЛЬКО для указанных архитектур
ExclusiveArch:  x86_64 aarch64

# Собирать для ВСЕХ, КРОМЕ указанных
ExcludeArch:    i686 armv7hl
```

Типичные причины:
- Программа на Rust/Go с CGO — только 64-битные платформы
- Assembly-код только для x86_64
- Upstream не поддерживает архитектуру

### Группы архитектур

RPM определяет группы:

| Группа | Архитектуры |
|--------|-------------|
| `%{ix86}` | i386, i486, i586, i686 |
| `%{arm}` | armv5tel, armv7hl |
| `%{power64}` | ppc64, ppc64le |

```spec
%ifarch %{ix86}
# Только для 32-битных x86
%endif
```

## Условия по версии дистрибутива

```spec
# Разные зависимости для разных версий ROSA
%if 0%{?rosa} >= 13
BuildRequires:  python3-devel
%else
BuildRequires:  python2-devel
%endif
```

**Примечание:** макрос `%{?rosa}` может быть определён не во всех версиях. Проверьте наличие через `rpm --eval '%{?rosa}'`.

## Условная компиляция файлов

```spec
%files
%{_bindir}/myapp
%if %{with gui}
%{_bindir}/myapp-gui
%{_datadir}/applications/myapp.desktop
%{_datadir}/icons/hicolor/*/apps/myapp.png
%endif
%{_mandir}/man1/myapp.1*
```

## Условные подпакеты

```spec
%if %{with gui}
%package gui
Summary:        GUI frontend for %{name}
Requires:       %{name} = %{version}-%{release}

%description gui
Graphical user interface for %{name}.

%files gui
%{_bindir}/myapp-gui
%{_datadir}/applications/myapp.desktop
%endif
```

## Распространённая ошибка: забытый `%endif`

```spec
# НЕПРАВИЛЬНО — rpmbuild выдаст ошибку о несовпадении %if/%endif
%if %{with tests}
BuildRequires:  pytest
# ← нет %endif!

%build
...
```

Каждый `%if` должен иметь парный `%endif`.

## Отладка условий

```bash
# Посмотреть, как раскрываются условия
rpm --eval '%{?with_tests:tests enabled}%{!?with_tests:tests disabled}'

# Обработать SPEC с подстановкой макросов
rpmspec -P mypackage.spec

# С включённой опцией
rpmspec -P mypackage.spec --with tests
```

## Проверьте понимание

1. Чем `%bcond_with` отличается от `%bcond_without`?
2. Как собрать пакет с тестами, если они отключены по умолчанию?
3. Как ограничить сборку только 64-битными архитектурами?
4. Зачем делать тесты опциональными через bcond?
5. Как проверить, что условия в SPEC раскрываются правильно?

---

**Далее:** [Версионирование и Epoch](@/community/intermediate/06-advanced/versioning.md)
