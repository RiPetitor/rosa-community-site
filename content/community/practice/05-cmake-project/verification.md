+++
title = "Проверка качества и тестовая установка"
weight = 3
+++

## Шаг 6: Проверка качества

```bash
rpmlint ~/rpmbuild/RPMS/x86_64/fmt-10.1.1-*.rpm
rpmlint ~/rpmbuild/RPMS/x86_64/fmt-devel-10.1.1-*.rpm
```

## Шаг 7: Проверка содержимого пакетов

```bash
# Основной пакет:
rpm -qlp ~/rpmbuild/RPMS/x86_64/fmt-10.1.1-*.x86_64.rpm
```

Ожидаемый вывод:

```
/usr/lib64/libfmt.so.10
/usr/lib64/libfmt.so.10.1.1
/usr/share/doc/fmt/ChangeLog.md
/usr/share/doc/fmt/README.md
/usr/share/licenses/fmt/LICENSE
```

```bash
# -devel пакет:
rpm -qlp ~/rpmbuild/RPMS/x86_64/fmt-devel-10.1.1-*.x86_64.rpm
```

Ожидаемый вывод:

```
/usr/include/fmt/args.h
/usr/include/fmt/chrono.h
/usr/include/fmt/color.h
/usr/include/fmt/compile.h
/usr/include/fmt/core.h
/usr/include/fmt/format-inl.h
/usr/include/fmt/format.h
/usr/include/fmt/os.h
/usr/include/fmt/ostream.h
/usr/include/fmt/printf.h
/usr/include/fmt/ranges.h
/usr/include/fmt/std.h
/usr/include/fmt/xchar.h
/usr/lib64/cmake/fmt/fmt-config-version.cmake
/usr/lib64/cmake/fmt/fmt-config.cmake
/usr/lib64/cmake/fmt/fmt-targets-relwithdebinfo.cmake
/usr/lib64/cmake/fmt/fmt-targets.cmake
/usr/lib64/libfmt.so
/usr/lib64/pkgconfig/fmt.pc
```

### Полная карта файлов

```
Основной пакет (fmt):
  /usr/lib64/libfmt.so.10.1.1           ← реальный бинарный файл
  /usr/lib64/libfmt.so.10               ← SONAME-ссылка

Подпакет -devel (fmt-devel):
  /usr/lib64/libfmt.so                  ← ссылка для линковщика
  /usr/include/fmt/*.h                  ← заголовочные файлы
  /usr/lib64/cmake/fmt/*.cmake          ← CMake config (для find_package)
  /usr/lib64/pkgconfig/fmt.pc           ← pkgconfig (для pkg-config)
```

## Шаг 8: Тестовая установка и проверка

```bash
sudo dnf install ~/rpmbuild/RPMS/x86_64/fmt-10.1.1-*.x86_64.rpm \
                 ~/rpmbuild/RPMS/x86_64/fmt-devel-10.1.1-*.x86_64.rpm
```

### Проверка через pkg-config

```bash
pkg-config --modversion fmt
# Ожидаемый вывод: 10.1.1

pkg-config --libs fmt
# Ожидаемый вывод: -lfmt

pkg-config --cflags fmt
# Ожидаемый вывод: -I/usr/include
```

### Проверка: компиляция тестовой программы

Создайте файл `test_fmt.cpp`:

```cpp
#include <fmt/core.h>
#include <fmt/color.h>

int main() {
    fmt::print("Hello from fmt version {}.{}.{}!\n",
               FMT_VERSION / 10000,
               FMT_VERSION / 100 % 100,
               FMT_VERSION % 100);

    fmt::print(fg(fmt::color::green), "This should be green.\n");

    std::string name = "ROSA Linux";
    fmt::print("Building packages for {}.\n", name);

    return 0;
}
```

Скомпилируйте и запустите:

```bash
# Способ 1: через pkg-config
g++ test_fmt.cpp $(pkg-config --cflags --libs fmt) -o test_fmt
./test_fmt

# Способ 2: напрямую
g++ test_fmt.cpp -lfmt -o test_fmt
./test_fmt
```

Ожидаемый вывод:

```
Hello from fmt version 10.1.1!
This should be green.
Building packages for ROSA Linux.
```

### Проверка через CMake (как это делают реальные проекты)

Создайте каталог `test_cmake/` с двумя файлами.

`test_cmake/CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.14)
project(test_fmt)

find_package(fmt REQUIRED)

add_executable(test_fmt main.cpp)
target_link_libraries(test_fmt fmt::fmt)
```

`test_cmake/main.cpp`:

```cpp
#include <fmt/core.h>

int main() {
    fmt::print("find_package(fmt) works!\n");
    return 0;
}
```

Сборка и запуск:

```bash
cd test_cmake
cmake -B build
cmake --build build
./build/test_fmt
```

Ожидаемый вывод:

```
find_package(fmt) works!
```

Если CMake config files не были бы включены в `-devel`, этот тест упал бы
на строке `find_package(fmt REQUIRED)`.

### Очистка

```bash
sudo dnf remove fmt fmt-devel
rm -rf test_fmt test_fmt.cpp test_cmake/
```
