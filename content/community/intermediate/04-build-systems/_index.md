+++
title = "Модуль 4: Системы сборки"
weight = 4
sort_by = "weight"
description = "Как собирать проекты на разных языках и с разными инструментами сборки."
template = "community.html"
+++

Разные проекты используют разные системы сборки: Autotools, CMake, Meson, setuptools, Cargo, Go modules. Каждая имеет свои особенности упаковки.

## Цели модуля

После изучения этого модуля вы будете:

- Определять систему сборки проекта
- Использовать правильные макросы для каждой системы
- Понимать особенности упаковки для разных языков
- Решать типичные проблемы сборки

## Как определить систему сборки

| Файлы в исходниках | Система сборки |
|-------------------|----------------|
| `configure`, `configure.ac`, `Makefile.am` | Autotools |
| `CMakeLists.txt` | CMake |
| `meson.build` | Meson |
| `setup.py`, `setup.cfg`, `pyproject.toml` | Python (setuptools/pip) |
| `Cargo.toml` | Rust (Cargo) |
| `go.mod` | Go modules |
| `Makefile` (только) | Make |
| `build.gradle`, `pom.xml` | Java (Gradle/Maven) |

## Содержание модуля

1. **[Autotools (configure/make)](@/community/intermediate/04-build-systems/autotools.md)**  
   Классическая система сборки: configure, make, make install.

2. **[CMake](@/community/intermediate/04-build-systems/cmake.md)**  
   Современная кроссплатформенная система сборки.

3. **[Meson](@/community/intermediate/04-build-systems/meson.md)**  
   Быстрая и простая система сборки нового поколения.

4. **[Python: setuptools и wheel](@/community/intermediate/04-build-systems/python-setuptools.md)**  
   Упаковка Python-приложений и библиотек.

5. **[Rust и Cargo](@/community/intermediate/04-build-systems/rust-cargo.md)**  
   Упаковка Rust-программ, vendoring зависимостей.

6. **[Go modules](@/community/intermediate/04-build-systems/golang.md)**  
   Упаковка Go-программ.

## Общие принципы

Независимо от системы сборки, этапы одинаковы:

```
%prep     →  Распаковка, патчи
%build    →  Конфигурация и компиляция
%install  →  Установка в buildroot
%check    →  Тесты
%files    →  Список файлов
```

Макросы RPM абстрагируют детали:

| Система | Конфигурация | Сборка | Установка |
|---------|--------------|--------|-----------|
| Autotools | `%configure` | `%make_build` | `%make_install` |
| CMake | `%cmake` | `%cmake_build` | `%cmake_install` |
| Meson | `%meson` | `%meson_build` | `%meson_install` |
| Python | — | `%py3_build` | `%py3_install` |
| Rust | — | `%cargo_build` | `%cargo_install` |
| Go | — | `%gobuild` | `install` |

## Следующий модуль

После освоения систем сборки переходите к **[Модулю 5: ABF и рабочий процесс](@/community/intermediate/05-abf-workflow/_index.md)** — там мы научимся работать со сборочной фермой.
