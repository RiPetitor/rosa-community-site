+++
title = "Практикум 1: Простая C-программа"
weight = 1
description = "Пошаговая упаковка GNU Hello — классический пример для изучения основ."
template = "community.html"
+++

В этом практикуме мы упакуем **GNU Hello** — простую программу, которая идеально подходит для первого опыта.

## Что вы узнаете

- Полный цикл упаковки от начала до конца
- Работу с Autotools (configure/make)
- Базовую структуру SPEC-файла
- Проверку качества с rpmlint

## О проекте

**GNU Hello** — это «Hello, World!» от GNU Project. Несмотря на простоту, он демонстрирует все стандарты GNU:
- Autotools сборка
- Интернационализация (i18n)
- Man и info документация
- Полный набор стандартных файлов

## Шаг 1: Подготовка

```bash
# Убедитесь, что окружение настроено
rpmdev-setuptree

# Установите необходимые инструменты
sudo dnf install rpm-build rpmdevtools rpmlint gcc make gettext
```

## Шаг 2: Скачивание исходников

```bash
cd ~/rpmbuild/SOURCES

# Скачать архив
curl -LO https://ftp.gnu.org/gnu/hello/hello-2.12.1.tar.gz

# Проверить
tar tzf hello-2.12.1.tar.gz | head -5
```

## Шаг 3: Создание SPEC-файла

Создайте `~/rpmbuild/SPECS/hello.spec`:

```spec
Name:           hello
Version:        2.12.1
Release:        1%{?dist}
Summary:        The classic greeting program from GNU

License:        GPL-3.0-or-later
URL:            https://www.gnu.org/software/hello/
Source0:        https://ftp.gnu.org/gnu/hello/hello-%{version}.tar.gz

BuildRequires:  gcc
BuildRequires:  make
BuildRequires:  gettext

%description
The GNU Hello program produces a familiar, friendly greeting.
It allows non-programmers to use a classic computer science tool
which would otherwise be unavailable to them.

This is an example package for learning RPM packaging.

%prep
%autosetup

%build
%configure
%make_build

%install
%make_install
%find_lang %{name}

%check
make check

%files -f %{name}.lang
%license COPYING
%doc README NEWS AUTHORS ChangeLog THANKS
%{_bindir}/hello
%{_mandir}/man1/hello.1*
%{_infodir}/hello.info*

%changelog
* Mon Feb 03 2025 Your Name <your@email.com> - 2.12.1-1
- Initial package for ROSA Linux
```

## Шаг 4: Сборка

```bash
cd ~/rpmbuild/SPECS
rpmbuild -ba hello.spec
```

**Ожидаемый результат:**
```
Wrote: /home/user/rpmbuild/SRPMS/hello-2.12.1-1.rosa13.1.src.rpm
Wrote: /home/user/rpmbuild/RPMS/x86_64/hello-2.12.1-1.rosa13.1.x86_64.rpm
```
Суффикс `.rosa13.1` зависит от `%{?dist}` и может отличаться на другой платформе.

## Шаг 5: Проверка качества

```bash
rpmlint ~/rpmbuild/RPMS/x86_64/hello-*.rpm
rpmlint ~/rpmbuild/SPECS/hello.spec
```

Исправьте все ошибки (E:), предупреждения (W:) можно оставить с пониманием причины.

## Шаг 6: Тестовая установка

```bash
# Установить
sudo dnf install ~/rpmbuild/RPMS/x86_64/hello-2.12.1-1.*.rpm

# Проверить
hello
hello --version
man hello

# Удалить
sudo dnf remove hello
```

## Разбор SPEC-файла

### Преамбула

| Тег | Значение | Пояснение |
|-----|----------|-----------|
| Name | hello | Имя пакета |
| Version | 2.12.1 | Версия upstream |
| Release | 1%{?dist} | Первая сборка |
| License | GPL-3.0-or-later | SPDX-идентификатор |

### Секции

- **%prep** — `%autosetup` распаковывает и применяет патчи
- **%build** — `%configure` + `%make_build` для Autotools
- **%install** — `%make_install` + `%find_lang` для переводов
- **%check** — запуск тестов
- **%files** — список файлов с `-f %{name}.lang`

## Типичные проблемы

### «gettext not found»

```bash
sudo dnf install gettext
```

### «Installed (but unpackaged) file(s)»

Если появляются файлы локализации — убедитесь, что есть `%find_lang` и `-f %{name}.lang`.

## Что дальше

- Загрузите на ABF и соберите там
- Попробуйте добавить патч
- Создайте подпакет с документацией

---

**Следующий практикум:** [Rust CLI-утилита (ripgrep)](../02-cli-rust/_index.md)
