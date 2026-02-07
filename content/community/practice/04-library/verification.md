+++
title = "Проверка качества и тестовая установка"
weight = 3
+++

## Шаг 5: Проверка качества

```bash
rpmlint ~/rpmbuild/RPMS/x86_64/libyaml-0.2.5-*.rpm
rpmlint ~/rpmbuild/RPMS/x86_64/libyaml-devel-0.2.5-*.rpm
```

Чистый вывод выглядит так:

```
libyaml.x86_64: I: No problems found.
libyaml-devel.x86_64: I: No problems found.
```

Если вы забыли удалить `.la`-файл, увидите предупреждение вроде:

```
W: libyaml-devel.x86_64: la-file /usr/lib64/libyaml.la
```

## Шаг 6: Проверка содержимого пакетов

Убедитесь, что файлы попали в правильные пакеты:

```bash
# Основной пакет — должны быть только .so.* файлы:
rpm -qlp ~/rpmbuild/RPMS/x86_64/libyaml-0.2.5-*.x86_64.rpm
```

Ожидаемый вывод:

```
/usr/lib64/libyaml-0.so.2
/usr/lib64/libyaml-0.so.2.0.9
/usr/share/doc/libyaml/README
/usr/share/licenses/libyaml/LICENSE
```

```bash
# -devel пакет — ссылка .so, заголовки и pkgconfig:
rpm -qlp ~/rpmbuild/RPMS/x86_64/libyaml-devel-0.2.5-*.x86_64.rpm
```

Ожидаемый вывод:

```
/usr/include/yaml.h
/usr/lib64/libyaml.so
/usr/lib64/pkgconfig/yaml-0.1.pc
```

## Шаг 7: Проверка SONAME

```bash
# Установите пакет для проверки (или проверьте прямо в BUILDROOT):
readelf -d ~/rpmbuild/BUILDROOT/libyaml-0.2.5-*/usr/lib64/libyaml-0.so.2.0.9 \
  | grep SONAME
```

Ожидаемый вывод:

```
 0x000000000000000e (SONAME)             Library soname: [libyaml-0.so.2]
```

## Шаг 8: Тестовая установка и проверка

```bash
# Установите оба пакета
sudo dnf install ~/rpmbuild/RPMS/x86_64/libyaml-0.2.5-*.x86_64.rpm \
                 ~/rpmbuild/RPMS/x86_64/libyaml-devel-0.2.5-*.x86_64.rpm
```

### Проверка через pkg-config

```bash
pkg-config --modversion yaml-0.1
# Ожидаемый вывод: 0.2.5

pkg-config --libs yaml-0.1
# Ожидаемый вывод: -lyaml

pkg-config --cflags yaml-0.1
# Ожидаемый вывод: (пусто или -I/usr/include)
```

### Проверка: компиляция тестовой программы

Создайте файл `test_yaml.c`:

```c
#include <stdio.h>
#include <yaml.h>

int main(void) {
    yaml_parser_t parser;

    if (!yaml_parser_initialize(&parser)) {
        fprintf(stderr, "Failed to initialize parser!\n");
        return 1;
    }

    printf("libyaml version: %s\n", yaml_get_version_string());
    printf("Parser initialized successfully.\n");

    yaml_parser_delete(&parser);
    return 0;
}
```

Скомпилируйте и запустите:

```bash
gcc test_yaml.c $(pkg-config --cflags --libs yaml-0.1) -o test_yaml
./test_yaml
```

Ожидаемый вывод:

```
libyaml version: 0.2.5
Parser initialized successfully.
```

Если всё работает — ваш пакет собран правильно.

### Удаление тестовых пакетов

```bash
sudo dnf remove libyaml libyaml-devel
rm -f test_yaml test_yaml.c
```
