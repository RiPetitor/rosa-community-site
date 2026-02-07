+++
title = "Ошибки и отладка"
weight = 4
+++

## Ошибки новичков

### 1. Не установлен Meson или Ninja

```
BUILDSTDERR: /var/tmp/rpm-tmp.XXXXXX: line 1: meson: command not found
```

**Решение:** Добавьте `BuildRequires: meson` и `BuildRequires: ninja-build`.

### 2. Опции Meson заданы неправильно или не заданы

Meson **не падает** при неизвестных или отключённых опциях — он молча отключает фичи.
Вы можете получить пакет без поддержки systemd, сами того не зная.

```
WARNING: sd-bus provider not found, building without daemon
```

**Как проверить:** Читайте вывод `%meson` внимательно. Ищите строки `WARNING` и `Feature`.
Если видите `NO` напротив нужной фичи — добавьте соответствующий `BuildRequires`.

### 3. Забыли юнит-файлы systemd в %files

```
RPM build errors:
    Installed (but unpackaged) file(s) found:
    /usr/lib/systemd/user/gamemoded.service
```

**Решение:** Добавьте в `%files`:

```spec
%{_userunitdir}/gamemoded.service
```

### 4. Забыли D-Bus-файлы

```
    Installed (but unpackaged) file(s) found:
    /usr/share/dbus-1/services/com.feralinteractive.GameMode.service
```

**Решение:** Добавьте в `%files`:

```spec
%{_datadir}/dbus-1/services/com.feralinteractive.GameMode.service
%{_sysconfdir}/dbus-1/system.d/com.feralinteractive.GameMode.conf
```

### 5. Путаница /usr/lib/systemd vs /usr/lib64/systemd

Новички часто пишут:

```spec
# НЕПРАВИЛЬНО!
%{_libdir}/systemd/user/gamemoded.service
```

На x86_64 `%{_libdir}` раскрывается в `/usr/lib64`, но юниты systemd всегда в `/usr/lib`.
Правильно:

```spec
# ПРАВИЛЬНО
%{_userunitdir}/gamemoded.service
# или явно:
/usr/lib/systemd/user/gamemoded.service
```

Используйте макросы `%{_unitdir}` и `%{_userunitdir}` — они всегда указывают на верные пути.

### 6. Забыли ldconfig для разделяемых библиотек

Если в пакете есть `.so.*` файлы, нужно обновлять кэш линковщика:

```spec
%post libs -p /sbin/ldconfig
%postun libs -p /sbin/ldconfig
```

Без этого система может не найти `libgamemode.so.0` после установки, и программы,
которые его используют, будут падать с ошибкой:

```
error while loading shared libraries: libgamemode.so.0: cannot open shared object file
```

### 7. Неправильное разделение -devel

Типичная ошибка — положить `libgamemode.so` (симлинк без версии) в основной пакет
вместо `-devel`. Или наоборот — забыть положить `libgamemode.so.*` (версионированную библиотеку)
в `-libs` или основной пакет.

**Правило:**
- `libfoo.so.X.Y.Z` и `libfoo.so.X` -- runtime, идут в `-libs`
- `libfoo.so` (симлинк) -- для разработчиков, идёт в `-devel`
- Заголовки (`.h`) и `.pc`-файлы -- всегда в `-devel`

### 8. Не указан BuildRequires: systemd-rpm-macros

Если макросы `%systemd_user_post` и т.д. не определены, вы получите:

```
/var/tmp/rpm-tmp.XXXXXX: line 1: systemd_user_post: command not found
```

**Решение:** Добавьте `BuildRequires: systemd-rpm-macros`.

### 9. Meson-опции: старый и новый синтаксис

В проектах на Meson < 1.1 опции описаны в `meson_options.txt`. В новых проектах
файл называется `meson.options`. Всегда проверяйте оба имени:

```bash
ls meson_options.txt meson.options 2>/dev/null
```

Если вы пытаетесь задать несуществующую опцию:

```
ERROR: Unknown options: "with-nonexistent"
```

**Решение:** Проверьте точные имена опций в файле конфигурации проекта.

## Полезные команды для отладки Meson-сборки

```bash
# Распаковать и сконфигурировать вручную для изучения
tar xzf gamemode-1.8.2.tar.gz
cd gamemode-1.8.2
meson setup builddir -Dwith-sd-bus-provider=systemd -Dwith-examples=false

# Посмотреть все опции (встроенные и пользовательские)
meson configure builddir

# Посмотреть, что будет установлено
DESTDIR=/tmp/test-install ninja -C builddir install
find /tmp/test-install -type f | sort

# Очистить и переконфигурировать
rm -rf builddir
meson setup builddir ...
```

Команда `find /tmp/test-install` покажет полный список файлов, которые проект устанавливает.
Это незаменимый приём при написании секции `%files` — вы точно будете знать, что включать.

## Итого

В этом практикуме вы научились:

1. Конфигурировать Meson-проект через `%meson` с опциями `-D`
2. Разбивать пакет на подпакеты: основной (демон + CLI), `-libs` (runtime-библиотеки), `-devel` (заголовки + симлинки + pkgconfig)
3. Правильно обрабатывать юнит-файлы systemd (пользовательские vs системные, макросы)
4. Включать D-Bus-конфигурацию в пакет
5. Использовать ldconfig для разделяемых библиотек
6. Исследовать опции Meson-проекта перед написанием SPEC

---

**Следующий практикум:** [Go-приложение (lazygit)](@/community/practice/08-go-app/_index.md)
