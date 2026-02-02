+++
title = "Практикум 3: Python-приложение (httpie)"
weight = 3
description = "Упаковка httpie: Python CLI на базе pyproject и зависимостей из PyPI."
template = "community.html"
+++

В этом практикуме упакуем **httpie** — CLI-клиент для HTTP-запросов.

## Что вы узнаете

- Как использовать `%pyproject_*` макросы
- Как автоматически формировать BuildRequires
- Как оформить CLI-скрипты в `%files`

## Шаг 1: Подготовка окружения

```bash
sudo dnf install rpm-build rpmdevtools \
  python3-devel python3-pip python3-setuptools python3-wheel \
  pyproject-rpm-macros
rpmdev-setuptree
```

## Шаг 2: Создание SPEC-файла

Создайте `~/rpmbuild/SPECS/httpie.spec`:

```spec
%global pypi_name httpie
%global pypi_version 3.2.2

Name:           %{pypi_name}
Version:        %{pypi_version}
Release:        1%{?dist}
Summary:        Human-friendly command-line HTTP client

License:        BSD-3-Clause
URL:            https://httpie.io/
Source0:        %{pypi_source}
# Если %{pypi_source} недоступен, используйте прямой URL к PyPI
# Source0:      https://files.pythonhosted.org/packages/source/h/httpie/httpie-%{version}.tar.gz

BuildArch:      noarch

BuildRequires:  python3-devel
BuildRequires:  pyproject-rpm-macros

%description
HTTPie is a command-line HTTP client with an easy-to-use interface.

%generate_buildrequires
%pyproject_buildrequires

%build
%pyproject_wheel

%install
%pyproject_install
%pyproject_save_files httpie

%bcond_with tests

%check
%if %{with tests}
%pytest -q
%endif

%files -f %{pyproject_files}
%license LICENSE
%doc README.rst
%{_bindir}/http
%{_bindir}/https
%{_bindir}/httpie

%changelog
* Mon Feb 02 2026 Your Name <your@email.com> - 3.2.2-1
- Initial package for ROSA Linux
```

Обновите `%global pypi_version` под актуальный релиз upstream.

## Шаг 3: Сборка

```bash
cd ~/rpmbuild/SPECS
rpmbuild -ba httpie.spec
```

Сборка с тестами:

```bash
rpmbuild -ba httpie.spec --with tests
```

## Шаг 4: Проверка

```bash
rpmlint ~/rpmbuild/RPMS/noarch/httpie-*.rpm

sudo dnf install ~/rpmbuild/RPMS/noarch/httpie-*.rpm
http --version
http --help | head -5
```

## Типичные проблемы

- **Не хватает зависимостей** — используйте `%pyproject_buildrequires`
- **Нет entry point** — убедитесь, что в `pyproject.toml` есть `console_scripts`
- **Тесты требуют сеть** — запускайте их только с `--with tests`

---

**Следующий практикум:** [Библиотека с подпакетом -devel (libyaml)](../04-library/_index.md)
