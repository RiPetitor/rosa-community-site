+++
title = "Условные сборки и bcond"
weight = 4
description = "Опции сборки, архитектурные условия и флаги %bcond."
+++

Условные сборки позволяют включать и отключать функции без правки SPEC.

## Простейший bcond

```spec
%bcond_with tests

%if %{with tests}
BuildRequires:  pytest
%endif

%check
%if %{with tests}
%pytest
%endif
```

Сборка с тестами:

```bash
rpmbuild -ba package.spec --with tests
```

## Архитектурные условия

```spec
%ifarch x86_64 aarch64
BuildRequires:  libatomic
%endif

ExclusiveArch:  x86_64 aarch64
ExcludeArch:    i686
```

## Типичные сценарии

- Отключение нестабильных тестов
- Сборка без GUI на серверных системах
- Специфичные зависимости для архитектур
