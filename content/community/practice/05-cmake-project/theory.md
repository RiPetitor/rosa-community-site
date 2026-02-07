+++
title = "Теория: CMake, макросы RPM и config files"
weight = 1
+++

## CMake vs Autotools

### Autotools (то, что было в Практикуме 4)

В Autotools цепочка выглядит так:
```
./configure --prefix=/usr → Makefile → make → make install
```

Файлы конфигурации: `configure.ac`, `Makefile.am`, `configure` (сгенерированный).

### CMake

В CMake цепочка другая:
```
cmake -B build -DCMAKE_INSTALL_PREFIX=/usr → cmake --build build → cmake --install build
```

Файл конфигурации: `CMakeLists.txt` в корне проекта (и в подкаталогах).

### Ключевые отличия для пакетировщика

| Аспект | Autotools | CMake |
|--------|-----------|-------|
| Конфигурация | `./configure --флаги` | `cmake -DФЛАГ=ЗНАЧЕНИЕ` |
| Файл сборки | `Makefile` | `CMakeLists.txt` |
| Сборка | `make` | `cmake --build` или `ninja` |
| Out-of-source build | Необязательно | **Стандартная практика** |
| Генератор | Только Make | Make, Ninja, и др. |
| RPM-макросы | `%configure`, `%make_build` | `%cmake`, `%cmake_build` |

### Out-of-source build

CMake принципиально отличается тем, что сборка происходит **вне дерева исходников**.
Исходники остаются чистыми в `~/rpmbuild/BUILD/fmt-10.1.1/`, а все объектные
файлы создаются в отдельном подкаталоге. RPM-макрос `%cmake` создаёт этот каталог
автоматически. По умолчанию он называется `%{_vpath_builddir}` и обычно раскрывается
в `redhat-linux-build` или аналогичное имя внутри `BUILD/fmt-10.1.1/`.

Структура при сборке:

```
~/rpmbuild/BUILD/fmt-10.1.1/           ← исходники (CMakeLists.txt, include/, src/)
~/rpmbuild/BUILD/fmt-10.1.1/x86_64-redhat-linux-gnu/  ← каталог сборки (build dir)
  ├── CMakeCache.txt                   ← кэш CMake с выбранными опциями
  ├── libfmt.so.10 → libfmt.so.10.1.1 ← собранная библиотека
  ├── build.ninja                      ← файл сборки Ninja
  └── ...
```

## Что делают CMake-макросы RPM

### Макрос `%cmake`

Когда вы пишете в SPEC:
```spec
%cmake -G Ninja -DBUILD_SHARED_LIBS=ON
```

Это раскрывается примерно в:

```bash
cmake \
  -B x86_64-redhat-linux-gnu \        # каталог сборки (out-of-source)
  -DCMAKE_INSTALL_PREFIX=/usr \        # куда устанавливать
  -DCMAKE_INSTALL_LIBDIR=lib64 \       # путь к библиотекам (lib64 на x86_64)
  -DCMAKE_BUILD_TYPE=RelWithDebInfo \  # режим сборки (релиз с отладочной инфо)
  -DCMAKE_C_FLAGS="..." \             # флаги компилятора из системы
  -DCMAKE_CXX_FLAGS="..." \           # флаги C++ компилятора
  -G Ninja \                          # ваш параметр: использовать Ninja
  -DBUILD_SHARED_LIBS=ON              # ваш параметр: shared библиотеки
```

Главное преимущество макроса: он сам выставляет правильные пути для дистрибутива.
Без него пришлось бы вручную указывать `CMAKE_INSTALL_PREFIX`, `CMAKE_INSTALL_LIBDIR`
и множество других переменных.

### Макрос `%cmake_build`

Раскрывается примерно в:

```bash
cmake --build x86_64-redhat-linux-gnu --verbose -- -j8
```

Это запускает сборку в каталоге сборки с параллельными потоками.
Если вы указали `-G Ninja`, CMake вызовет `ninja`, иначе — `make`.

### Макрос `%cmake_install`

Раскрывается примерно в:

```bash
DESTDIR=%{buildroot} cmake --install x86_64-redhat-linux-gnu
```

`DESTDIR` — ключевой момент: файлы устанавливаются не в реальный `/usr`,
а в `~/rpmbuild/BUILDROOT/fmt-10.1.1-.../usr/`.

## BUILD_SHARED_LIBS

Многие CMake-проекты по умолчанию собирают **статическую** библиотеку (`.a`).
Чтобы получить **разделяемую** библиотеку (`.so`), нужно явно указать:

```
-DBUILD_SHARED_LIBS=ON
```

Без этого флага:
- Будет создан только `libfmt.a` (статическая библиотека)
- Не будет `libfmt.so*` файлов
- Секция `%files` с `%{_libdir}/libfmt.so.*` не найдёт файлов
- Сборка RPM упадёт с ошибкой

Некоторые проекты используют собственные переменные (например, `FMT_SHARED=ON`
или `BUILD_SHARED=ON`). Всегда проверяйте `CMakeLists.txt` проекта.

## Ninja vs Make

**Ninja** — быстрая система сборки, разработанная для CMake-проектов.
Преимущества:

- Быстрее, чем Make, особенно при инкрементальной сборке
- Лучше отображает прогресс (показывает `[42/100]`)
- Используется по умолчанию в Chromium, Android и многих других проектах

Указывается флагом `-G Ninja`. Для этого нужен пакет `ninja-build`:

```bash
sudo dnf install ninja-build
```

Если Ninja не установлен, уберите `-G Ninja` — CMake будет использовать Make.

## CMake config files vs pkgconfig

CMake-проекты часто устанавливают **два** набора файлов для поиска библиотеки:

### pkgconfig (.pc файлы)

```
/usr/lib64/pkgconfig/fmt.pc
```

Используется через `pkg-config --libs fmt`. Работает с любой системой сборки.

### CMake config files (.cmake файлы)

```
/usr/lib64/cmake/fmt/
  ├── fmt-config.cmake          ← главный конфиг
  ├── fmt-config-version.cmake  ← проверка версии
  └── fmt-targets.cmake         ← описание целей (targets)
```

Используется через `find_package(fmt)` в `CMakeLists.txt` других проектов.
Это **более мощный** способ, чем pkgconfig:

- Поддерживает компоненты (`find_package(fmt COMPONENTS ...)`)
- Умеет проверять версии
- Экспортирует цели с правильными свойствами (include paths, link flags)

**Важно для пакетировщика:** если не включить каталог `cmake/fmt/` в `-devel`,
другие CMake-проекты не смогут найти fmt через `find_package()` и сборка
зависимых пакетов сломается.
