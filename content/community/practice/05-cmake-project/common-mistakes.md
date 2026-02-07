+++
title = "Ошибки новичков и дополнительные материалы"
weight = 4
+++

## Ошибки новичков

### 1. Забыли BUILD_SHARED_LIBS — только статическая библиотека

**Симптом:** после сборки в BUILDROOT нет `.so` файлов, только `.a`:

```
/usr/lib64/libfmt.a
```

Секция `%files` с `%{_libdir}/libfmt.so.*` падает:

```
error: File not found: .../usr/lib64/libfmt.so.*
```

**Решение:** добавьте `-DBUILD_SHARED_LIBS=ON` в `%cmake`.

### 2. Не включили cmake/ каталог в -devel

**Симптом:** другие CMake-проекты не могут найти fmt:

```
CMake Error at CMakeLists.txt:10 (find_package):
  Could not find a package configuration file provided by "fmt" with any
  of the following names:

    fmtConfig.cmake
    fmt-config.cmake
```

**Решение:** добавьте в `%files devel`:

```spec
%{_libdir}/cmake/fmt/
```

### 3. Неправильный каталог библиотек (lib vs lib64)

**Симптом:** файлы устанавливаются в `/usr/lib/` вместо `/usr/lib64/`.

**Причина:** кто-то вручную указал `CMAKE_INSTALL_LIBDIR=lib` или проект
имеет нестандартную логику определения пути.

**Решение:** макрос `%cmake` автоматически выставляет правильный
`CMAKE_INSTALL_LIBDIR`. Не переопределяйте его без необходимости.
Если проект игнорирует стандартные CMake-переменные, добавьте:

```spec
%cmake -DCMAKE_INSTALL_LIBDIR=%{_libdir} ...
```

### 4. Тесты не запускаются без BUILD_TESTING или проектной опции

**Симптом:** `%ctest` выводит:

```
No tests were found!!!
```

**Причина:** для fmt нужен флаг `-DFMT_TEST=ON`. У других проектов может
быть `-DBUILD_TESTING=ON` (стандартная CMake-переменная) или свой собственный флаг.

**Решение:** посмотрите `option()` в `CMakeLists.txt`:

```bash
grep -n 'option(' CMakeLists.txt
```

### 5. Header-only библиотеки: нет .so файла

Некоторые C++ библиотеки (например, nlohmann-json, Catch2) состоят **только
из заголовочных файлов** — нет `.so`, нет `.a`, только `.h`.

В этом случае:
- Нет основного пакета с библиотекой — весь пакет фактически `-devel`
- Не нужен `ldconfig`
- Пакет становится `noarch` (не зависит от архитектуры):

```spec
BuildArch: noarch
```

Если вы видите, что после `cmake --install` в BUILDROOT нет `.so`-файлов,
а есть только заголовки — скорее всего, это header-only библиотека.

### 6. Конфликт версий CMake config файлов

**Симптом:** cmake-файлы содержат абсолютные пути к BUILDROOT:

```
/home/user/rpmbuild/BUILDROOT/.../usr/lib64/libfmt.so
```

**Причина:** некоторые проекты неправильно генерируют cmake config.

**Решение:** проверьте содержимое `.cmake` файлов:

```bash
grep -r "rpmbuild" ~/rpmbuild/BUILDROOT/*/usr/lib64/cmake/
```

Если находятся пути к BUILDROOT — это баг upstream, нужен патч
(см. Практикум 6).

## Дополнительно: как посмотреть, что собрал CMake

После `rpmbuild -bi` (или `-ba`) проверьте BUILDROOT:

```bash
find ~/rpmbuild/BUILDROOT/fmt-*/ -type f -o -type l | sort
```

Это покажет все файлы, которые нужно распределить между `%files`
и `%files devel`.

## Дополнительно: отладка CMake-опций

Если сборка ведёт себя странно, посмотрите кэш CMake:

```bash
cat ~/rpmbuild/BUILD/fmt-10.1.1/*/CMakeCache.txt | grep -E "^(BUILD_|FMT_|CMAKE_INSTALL)"
```

Это покажет все переменные с их реальными значениями, включая те,
которые выставил макрос `%cmake`.

## Итоги

В этом практикуме вы научились:

1. Понимать отличия CMake-проектов от Autotools
2. Использовать RPM-макросы `%cmake`, `%cmake_build`, `%cmake_install`, `%ctest`
3. Включать shared-библиотеки через `BUILD_SHARED_LIBS`
4. Включать CMake config files и pkgconfig в `-devel`
5. Исследовать CMake-опции проекта
6. Запускать тесты через CTest
7. Проверять результат компиляцией тестовой программы
