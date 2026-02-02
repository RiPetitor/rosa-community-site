+++
title = "Python: setuptools и wheel"
weight = 4
description = "Упаковка Python-приложений и библиотек."
+++

Python-пакеты имеют свои особенности: управление зависимостями через pip, различные системы сборки (setuptools, flit, poetry), wheel-формат.

## Типы Python-пакетов

1. **Библиотеки** — импортируются другими программами
2. **Приложения** — самостоятельные программы с CLI
3. **Расширения** — содержат C-код (требуют компиляции)

## Признаки Python-проекта

| Файл | Система сборки |
|------|----------------|
| `pyproject.toml` | Современный стандарт (PEP 517/518) |
| `setup.py` | Setuptools (классический) |
| `setup.cfg` | Setuptools (декларативный) |
| `poetry.lock` | Poetry |
| `Pipfile` | Pipenv |

## Стандартная сборка (setuptools)

```spec
%build
%py3_build

%install
%py3_install
```

## Современная сборка (pyproject.toml)

```spec
%build
%pyproject_wheel

%install
%pyproject_install
%pyproject_save_files %{pypi_name}
```

**Подсказка для ROSA:** если макросы `%pyproject_*` или `%{pypi_source}` не находятся,
установите пакет `pyproject-rpm-macros` и/или `python3-rpm-macros` (точные названия
проверьте через `dnf search rpm-macros`).

## Полный пример: библиотека

```spec
%global pypi_name requests
%global pypi_version 2.31.0

Name:           python3-%{pypi_name}
Version:        %{pypi_version}
Release:        1%{?dist}
Summary:        Python HTTP library

License:        Apache-2.0
URL:            https://requests.readthedocs.io/
Source0:        %{pypi_source}

BuildArch:      noarch

BuildRequires:  python3-devel
BuildRequires:  python3-pip
BuildRequires:  python3-wheel
BuildRequires:  python3-setuptools

# Зависимости для тестов
BuildRequires:  python3-pytest
BuildRequires:  python3-urllib3
BuildRequires:  python3-charset-normalizer
BuildRequires:  python3-idna
BuildRequires:  python3-certifi

Requires:       python3-urllib3 >= 1.21.1
Requires:       python3-charset-normalizer >= 2.0
Requires:       python3-idna >= 2.5
Requires:       python3-certifi >= 2017.4.17

%description
Requests is a simple, yet elegant, HTTP library for Python.

%prep
%autosetup -n %{pypi_name}-%{version}

%build
%pyproject_wheel

%install
%pyproject_install
%pyproject_save_files %{pypi_name}

%check
%pytest

%files -f %{pyproject_files}
%license LICENSE
%doc README.md HISTORY.md

%changelog
* Mon Feb 03 2025 Your Name <your@email.com> - 2.31.0-1
- Initial package
```

## Полный пример: приложение с CLI

```spec
%global pypi_name httpie

Name:           %{pypi_name}
Version:        3.2.2
Release:        1%{?dist}
Summary:        Modern command-line HTTP client

License:        BSD-3-Clause
URL:            https://httpie.io/
Source0:        %{pypi_source}

BuildArch:      noarch

BuildRequires:  python3-devel
BuildRequires:  python3-pip
BuildRequires:  python3-wheel
BuildRequires:  python3-setuptools

Requires:       python3-requests
Requires:       python3-pygments
Requires:       python3-rich

%description
HTTPie is a command-line HTTP client with an intuitive UI,
JSON support, syntax highlighting, and more.

%prep
%autosetup -n %{pypi_name}-%{version}

%build
%pyproject_wheel

%install
%pyproject_install
%pyproject_save_files httpie

%files -f %{pyproject_files}
%license LICENSE
%doc README.md
%{_bindir}/http
%{_bindir}/https
%{_bindir}/httpie

%changelog
* Mon Feb 03 2025 Your Name <your@email.com> - 3.2.2-1
- Initial package
```

## Макросы Python

### Автоматические макросы

| Макрос | Значение |
|--------|----------|
| `%{python3}` | `/usr/bin/python3` |
| `%{python3_sitelib}` | `/usr/lib/python3.X/site-packages` |
| `%{python3_sitearch}` | `/usr/lib64/python3.X/site-packages` |
| `%{python3_version}` | `3.x` (зависит от платформы) |
| `%{pypi_source}` | URL для PyPI |

### Макросы сборки

```spec
# Классический setuptools
%py3_build
%py3_install

# Современный pyproject
%pyproject_wheel
%pyproject_install
%pyproject_save_files имя_пакета
```

### %pyproject_save_files

Автоматически генерирует список файлов:

```spec
%install
%pyproject_install
%pyproject_save_files mypackage

%files -f %{pyproject_files}
%license LICENSE
```

## noarch vs архитектурные пакеты

### noarch (чистый Python)

```spec
BuildArch:      noarch

%files
%{python3_sitelib}/%{pypi_name}/
%{python3_sitelib}/%{pypi_name}-%{version}.dist-info/
```

### Архитектурный (с C-расширениями)

```spec
# Нет BuildArch: noarch

BuildRequires:  python3-devel
BuildRequires:  gcc

%files
%{python3_sitearch}/%{pypi_name}/
%{python3_sitearch}/%{pypi_name}-%{version}.dist-info/
```

Обратите внимание: `sitelib` vs `sitearch`.

## Зависимости

### Определение зависимостей

```bash
# Из setup.py / pyproject.toml
grep -E "(install_requires|dependencies)" setup.py pyproject.toml

# Или установить и посмотреть
pip show mypackage | grep Requires
```

### Автоматические зависимости

RPM автоматически добавляет зависимости из:
- `requires.txt`
- `METADATA`

Можно отключить:

```spec
%global __python_requires %{nil}
```

### Версионные зависимости

```spec
Requires:       python3-requests >= 2.20.0
Requires:       python3-urllib3 >= 1.21, python3-urllib3 < 2.0
```

## Тестирование

### pytest

```spec
BuildRequires:  python3-pytest

%check
%pytest
```

### С дополнительными опциями

```spec
%check
%pytest -v --ignore=tests/integration/
```

### Пропуск тестов, требующих сеть

```spec
%check
%pytest -k "not network"
```

## Bundled-зависимости

Некоторые пакеты содержат копии библиотек. Их нужно удалять:

```spec
%prep
%autosetup

# Удалить bundled-библиотеки
rm -rf vendor/
rm -rf %{pypi_name}/vendor/

%build
%pyproject_wheel
```

И добавить системные зависимости:

```spec
Requires:       python3-urllib3
Requires:       python3-certifi
```

## Entry points и скрипты

### Автоматические entry points

Если в `pyproject.toml`:

```toml
[project.scripts]
myapp = "mypackage.cli:main"
```

Скрипт создастся автоматически в `%{_bindir}`.

### Ручная установка

```spec
%install
%pyproject_install
%pyproject_save_files mypackage

# Если entry point не работает
install -Dm 755 bin/myapp %{buildroot}%{_bindir}/myapp
```

## Исправление shebang

```spec
%install
%pyproject_install
%pyproject_save_files mypackage

# Исправить shebang на стандартный
%py3_shebang_fix %{buildroot}%{_bindir}/*
```

## Типичные проблемы

### «ModuleNotFoundError during build»

```
ModuleNotFoundError: No module named 'setuptools'
```

Добавьте BuildRequires:

```spec
BuildRequires:  python3-setuptools
BuildRequires:  python3-wheel
BuildRequires:  python3-pip
```

### «No matching distribution found»

Зависимость не в репозитории. Нужно упаковать её отдельно или использовать `--no-deps`:

```spec
%build
pip3 wheel --no-deps -w dist .
```

### «Two files match pattern»

```spec
# Конфликт %pyproject_save_files
%files -f %{pyproject_files}
%{python3_sitelib}/mypackage/   # Уже в %{pyproject_files}!
```

Уберите дублирующиеся строки.

### Неправильная версия Python

```spec
# Убедитесь, что используется python3
BuildRequires:  python3-devel
%global python3_pkgversion 3
```

## Проверьте понимание

1. Чем отличается `%py3_build` от `%pyproject_wheel`?
2. Когда пакет должен быть `noarch`?
3. Как автоматически сгенерировать список файлов?
4. В чём разница между `sitelib` и `sitearch`?
5. Как запустить pytest в секции %check?

---

**Далее:** [Rust и Cargo](rust-cargo.md)
