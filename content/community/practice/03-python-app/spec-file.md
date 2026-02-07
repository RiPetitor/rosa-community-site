+++
title = "Создание SPEC-файла"
weight = 2
+++

Создайте `~/rpmbuild/SPECS/httpie.spec`:

```spec
# ============================================================
# Глобальные переменные
# ============================================================
# Определяем имя и версию пакета на PyPI.
# %{pypi_name} используется в макросе %{pypi_source} для формирования URL.
%global pypi_name httpie
%global pypi_version 3.2.4

Name:           %{pypi_name}
Version:        %{pypi_version}
Release:        1%{?dist}
Summary:        Human-friendly command-line HTTP client

License:        BSD-3-Clause
URL:            https://httpie.io/

# %{pypi_source} — макрос, раскрывающийся в URL на PyPI.
# Эквивалентен: https://files.pythonhosted.org/packages/source/h/httpie/httpie-3.2.4.tar.gz
# Если макрос недоступен, используйте прямой URL (закомментированный ниже).
Source0:        %{pypi_source}
# Source0:      https://files.pythonhosted.org/packages/source/h/httpie/httpie-%{version}.tar.gz

# ============================================================
# BuildArch: noarch
# ============================================================
# httpie — чистый Python, нет C-расширений.
# Пакет одинаково работает на любой архитектуре.
# Готовый RPM попадет в ~/rpmbuild/RPMS/noarch/ (а не x86_64/).
BuildArch:      noarch

# ============================================================
# Зависимости для сборки
# ============================================================
# python3-devel — содержит макросы и заголовки Python.
# pyproject-rpm-macros — предоставляет %pyproject_* макросы.
BuildRequires:  python3-devel
BuildRequires:  pyproject-rpm-macros

%description
HTTPie is a command-line HTTP client. Its goal is to make CLI interaction
with web services as human-friendly as possible. HTTPie is designed for
testing, debugging, and generally interacting with APIs and HTTP servers.

# ============================================================
# %generate_buildrequires — автоматическое определение зависимостей
# ============================================================
# Это особенная секция. При первом проходе rpmbuild выполняет ее,
# чтобы узнать, какие пакеты нужны для сборки.
#
# %pyproject_buildrequires читает pyproject.toml (или setup.cfg)
# и выводит список зависимостей. Если каких-то пакетов не хватает,
# rpmbuild остановится и покажет, что нужно доустановить.
#
# Это двухпроходная система:
# 1. Первый проход — определить зависимости
# 2. Второй проход — собственно сборка
%generate_buildrequires
%pyproject_buildrequires

# ============================================================
# %build — сборка wheel
# ============================================================
# %pyproject_wheel создает wheel-файл (.whl) — бинарный дистрибутив Python.
# За кулисами это эквивалентно:
#   python3 -m pip wheel --no-deps --no-build-isolation .
# Wheel появится в каталоге сборки, и на следующем этапе будет установлен.
%build
%pyproject_wheel

# ============================================================
# %install — установка wheel в buildroot
# ============================================================
# %pyproject_install берет созданный wheel и устанавливает его в %{buildroot}.
# За кулисами:
#   python3 -m pip install --root %{buildroot} --no-deps <wheel_file>
#
# После этого в buildroot появляются:
#   %{buildroot}/usr/lib/python3.X/site-packages/httpie/       ← модули Python
#   %{buildroot}/usr/lib/python3.X/site-packages/httpie-3.2.4.dist-info/  ← метаданные
#   %{buildroot}/usr/bin/http        ← CLI-скрипт
#   %{buildroot}/usr/bin/https       ← CLI-скрипт
#   %{buildroot}/usr/bin/httpie      ← CLI-скрипт
#
# %pyproject_save_files httpie — ключевой макрос.
# Он находит все файлы модуля «httpie» в site-packages и записывает
# их пути в файл, который потом используется в %files.
# Аргумент «httpie» — это имя Python-пакета (каталог в site-packages).
#
# Файл со списком создается в:
#   %{_builddir}/pyproject-files-httpie.txt
# Вы можете посмотреть его содержимое для отладки.
%install
%pyproject_install
%pyproject_save_files httpie

# ============================================================
# %check — тесты
# ============================================================
# Тесты httpie требуют сети (обращаются к httpbin.org),
# поэтому по умолчанию отключены.
# Можно включить при локальной сборке: rpmbuild -ba httpie.spec --with tests
%bcond_with tests

%check
%if %{with tests}
%pytest -q
%endif

# ============================================================
# %files — список файлов в пакете
# ============================================================
# -f %{pyproject_files} подключает автоматически сгенерированный список
# файлов модуля httpie (из %pyproject_save_files).
#
# Файлы лицензии и документации указываем явно.
#
# CLI-скрипты (entry_points) тоже указываем явно — %pyproject_save_files
# их НЕ включает, потому что они лежат в %{_bindir}, а не в site-packages.
%files -f %{pyproject_files}
%license LICENSE
%doc README.md
%{_bindir}/http
%{_bindir}/https
%{_bindir}/httpie

%changelog
* Mon Feb 02 2026 Your Name <your@email.com> - 3.2.4-1
- Initial package for ROSA Linux
```

## Проверка зависимостей перед сборкой

Перед сборкой полезно проверить, доступны ли все зависимости httpie в репозиториях ROSA:

```bash
# Посмотрим, какие Python-пакеты требует httpie
sudo dnf builddep ~/rpmbuild/SPECS/httpie.spec
```

Если команда показывает, что какой-то пакет не найден:

```
No match for argument: python3-charset-normalizer
Error: Unable to find a match: python3-charset-normalizer
```

Это значит, что зависимость httpie не упакована для ROSA. Варианты решения:
1. Упакуйте недостающую зависимость отдельным RPM-пакетом (рекурсивно)
2. Проверьте, есть ли она под другим именем: `dnf search charset-normalizer`
3. Проверьте в contrib-репозитории

> **Совет:** для Python-пакетов в ROSA имена обычно имеют вид `python3-имя_пакета`.
> Например, PyPI-пакет `requests` упакован как `python3-requests`.
