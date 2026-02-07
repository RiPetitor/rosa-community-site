+++
title = "Модуль 2: Анатомия SPEC-файла"
weight = 2
sort_by = "weight"
description = "Детальный разбор «рецепта» пакета: теги, секции, макросы, зависимости."
template = "community.html"
+++

**SPEC-файл** — это «рецепт» пакета. Он описывает *что* собирать, *как* собирать и *какие файлы* должны попасть в итоговый RPM.

## Цели модуля

После изучения этого модуля вы будете:

- Понимать структуру SPEC-файла: преамбула и тело
- Знать все основные теги и их назначение
- Правильно указывать источники и патчи
- Грамотно описывать зависимости
- Использовать макросы вместо жёстко заданных значений
- Вести корректный changelog

## Структура SPEC-файла

SPEC-файл состоит из двух частей:

```
┌─────────────────────────────────────┐
│         ПРЕАМБУЛА (Preamble)        │
│  Метаданные: Name, Version, ...     │
│  Зависимости: BuildRequires, ...    │
├─────────────────────────────────────┤
│            ТЕЛО (Body)              │
│  %description — описание            │
│  %prep — подготовка исходников      │
│  %build — компиляция                │
│  %install — установка в buildroot   │
│  %check — тесты                     │
│  %files — список файлов пакета      │
│  %changelog — история изменений     │
└─────────────────────────────────────┘
```

## Содержание модуля

1. **[Преамбула: все теги с примерами](@/community/beginner/02-spec-file/preamble.md)**  
   Name, Version, Release, Summary, License, URL и другие обязательные и опциональные теги.

2. **[Source и Patch: источники и патчи](@/community/beginner/02-spec-file/sources-patches.md)**  
   Откуда брать исходники, как называть, как применять патчи.

3. **[Зависимости: BuildRequires и Requires](@/community/beginner/02-spec-file/dependencies.md)**  
   Зависимости для сборки и для работы, автоматическое определение, Provides/Conflicts/Obsoletes.

4. **[Секции сборки: %prep, %build, %install, %check](@/community/beginner/02-spec-file/sections.md)**  
   Что происходит на каждом этапе сборки, стандартные макросы секций.

5. **[Секция %files: макросы путей и атрибуты](@/community/beginner/02-spec-file/files-section.md)**  
   Как указывать файлы пакета, атрибуты, %doc, %license, %config.

6. **[Макросы: стандартные, системные, свои](@/community/beginner/02-spec-file/macros.md)**  
   Переменные и макросы, условные конструкции, определение собственных макросов.

7. **[Ведение %changelog](@/community/beginner/02-spec-file/changelog.md)**  
   Формат записей, что документировать, автоматизация.

## Минимальный SPEC-файл

Для понимания общей картины — вот минимальный рабочий SPEC:

```spec
Name:           hello
Version:        2.12.1
Release:        1%{?dist}
Summary:        The classic greeting program
License:        GPL-3.0-or-later
URL:            https://www.gnu.org/software/hello/
Source0:        https://ftp.gnu.org/gnu/hello/hello-%{version}.tar.gz

BuildRequires:  gcc
BuildRequires:  make

%description
The GNU Hello program produces a familiar, friendly greeting.

%prep
%autosetup

%build
%configure
%make_build

%install
%make_install

%files
%license COPYING
%doc README NEWS
%{_bindir}/hello
%{_mandir}/man1/hello.1*
%{_infodir}/hello.info*

%changelog
* Mon Feb 03 2025 Your Name <your@email.com> - 2.12.1-1
- Initial package
```

В следующих темах мы детально разберём каждую часть.

## Следующий модуль

После освоения SPEC-файла переходите к **[Модулю 3: Сборочное окружение](@/community/beginner/03-build-environment/_index.md)** — там мы настроим рабочее место и соберём первый пакет.
