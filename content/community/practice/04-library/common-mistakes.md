+++
title = "Ошибки новичков и дополнительные материалы"
weight = 4
+++

## Ошибки новичков

### 1. Символическая ссылка .so попала в основной пакет

**Что произошло:** в секции `%files` написали `%{_libdir}/libyaml*.so*`
(без точки после `*`), и ссылка `libyaml.so` попала в основной пакет.

**Почему это плохо:** пользователи, которым не нужна разработка, получают
лишний файл. А программы, зависящие от `-devel`, не смогут явно потребовать
его установку.

**Как правильно:**
```spec
# Основной пакет — только версионированные файлы:
%{_libdir}/libyaml*.so.*

# -devel — ссылка без версии:
%{_libdir}/libyaml.so
```

### 2. Забыли ldconfig — «error while loading shared libraries»

**Симптом:** пакет установлен, но при запуске программы:

```
./myprogram: error while loading shared libraries: libyaml-0.so.2:
cannot open shared object file: No such file or directory
```

**Причина:** не вызван `ldconfig`, кэш `/etc/ld.so.cache` не обновлён.

**Решение:** добавьте в SPEC:

```spec
%post -p /sbin/ldconfig
%postun -p /sbin/ldconfig
```

**Быстрая проверка на живой системе:** запустите `sudo ldconfig` вручную.
Если после этого программа заработала — значит, проблема именно в скриптлетах.

### 3. Не удалили .la-файлы

**Симптом:** rpmlint предупреждает:

```
W: libyaml-devel.x86_64: la-file /usr/lib64/libyaml.la
```

**Решение:** добавьте в `%install`:

```spec
find %{buildroot} -name '*.la' -delete
```

### 4. Неправильный glob-шаблон для .so-файлов

**Ошибка:** написали `%{_libdir}/libyaml.so.*` (без `-0` в имени).

Реальные файлы называются `libyaml-0.so.2` и `libyaml-0.so.2.0.9`.
Шаблон `libyaml.so.*` ничего не захватит, и rpmbuild упадёт:

```
error: File not found: /home/user/rpmbuild/BUILDROOT/.../usr/lib64/libyaml.so.*
```

**Решение:** всегда проверяйте реальные имена файлов в BUILDROOT:

```bash
ls -la ~/rpmbuild/BUILDROOT/libyaml-*/usr/lib64/
```

И используйте шаблон, соответствующий реальным именам: `libyaml*.so.*`

### 5. Забыли `%{?_isa}` в Requires подпакета -devel

**Что написали:**
```spec
Requires: %{name} = %{version}-%{release}
```

**Почему плохо:** на мультилиб-системе (где стоят и 32-битные, и 64-битные
пакеты) может установиться libyaml другой архитектуры. Разработчик получит
несовпадение между заголовками (64-бит) и библиотекой (32-бит).

**Как правильно:**
```spec
Requires: %{name}%{?_isa} = %{version}-%{release}
```

### 6. Заголовочные файлы в неправильной директории

**Ошибка:** upstream устанавливает заголовки в `/usr/include/libyaml/yaml.h`,
а вы написали `%{_includedir}/yaml.h`.

**Решение:** всегда проверяйте, куда реально устанавливаются файлы:

```bash
find ~/rpmbuild/BUILDROOT/ -name '*.h'
```

### 7. Забыли включить pkgconfig-файл в -devel

**Симптом:** после установки `-devel` команда `pkg-config --libs yaml-0.1`
выдаёт ошибку:

```
Package yaml-0.1 was not found in the pkg-config search path.
```

**Причина:** файл `yaml-0.1.pc` не указан в секции `%files devel`.

**Решение:** добавьте:

```spec
%files devel
...
%{_libdir}/pkgconfig/yaml-0.1.pc
```

### 8. Не обновили %changelog

Каждое изменение в SPEC-файле должно сопровождаться записью в `%changelog`.
Без этого rpmlint выдаст предупреждение. Используйте `rpmdev-bumpspec`
для автоматического добавления записи.

## Дополнительно: как узнать, какие файлы установились

После `rpmbuild -bi` (или полной сборки `-ba`) можно посмотреть
содержимое BUILDROOT:

```bash
find ~/rpmbuild/BUILDROOT/libyaml-*/ -type f -o -type l | sort
```

Ожидаемый вывод:

```
.../usr/include/yaml.h
.../usr/lib64/libyaml-0.so.2
.../usr/lib64/libyaml-0.so.2.0.9
.../usr/lib64/libyaml.so
.../usr/lib64/pkgconfig/yaml-0.1.pc
```

(Файл `.la` уже удалён, если вы добавили `find ... -delete`.)

Именно по этому списку вы заполняете секции `%files` и `%files devel`.

## Дополнительно: статическая библиотека

Иногда upstream также собирает статическую библиотеку `libyaml.a`.
Если вы хотите её включить, создайте подпакет `libyaml-static`:

```spec
%package static
Summary:        Static library for libyaml
Requires:       %{name}-devel%{?_isa} = %{version}-%{release}

%description static
Static library for linking libyaml statically.

%files static
%{_libdir}/libyaml.a
```

Если статическая библиотека не нужна (чаще всего не нужна), удалите её:

```spec
find %{buildroot} -name '*.a' -delete
```

## Итоги

В этом практикуме вы научились:

1. Понимать структуру shared library: реальный файл, SONAME-ссылка и dev-ссылка
2. Разделять пакет на runtime (основной) и development (-devel)
3. Настраивать ldconfig для обновления кэша библиотек
4. Работать с pkgconfig для удобной компиляции зависимых программ
5. Удалять ненужные .la-файлы
6. Проверять правильность сборки с помощью readelf, pkg-config и тестовой программы
