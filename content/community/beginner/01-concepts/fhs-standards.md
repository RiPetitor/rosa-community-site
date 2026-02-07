+++
title = "Стандарт FHS и пути установки"
weight = 4
description = "Куда должны попадать файлы программы: бинарники, библиотеки, конфиги, документация."
+++

Одна из задач сборщика — разместить файлы программы в **правильных местах**. Это определяет стандарт **FHS** (Filesystem Hierarchy Standard).

## Зачем нужен стандарт

Без единого стандарта:
- Программа A кладёт бинарники в `/usr/bin`, программа B — в `/opt/bin`
- Конфиги в `/etc`, `/usr/etc`, `~/.config` или в каталоге программы
- Администратор не знает, где искать логи, данные, настройки

FHS решает эту проблему, определяя назначение каждого каталога.

## Основные каталоги FHS

### Корневые каталоги

| Каталог | Назначение |
|---------|------------|
| `/bin` | Основные команды (обычно симлинк на `/usr/bin`) |
| `/sbin` | Системные команды (симлинк на `/usr/sbin`) |
| `/lib`, `/lib64` | Библиотеки (симлинки на `/usr/lib*`) |
| `/etc` | Конфигурационные файлы |
| `/var` | Изменяемые данные (логи, кеши, спулы) |
| `/tmp` | Временные файлы |
| `/home` | Домашние каталоги пользователей |
| `/root` | Домашний каталог root |
| `/opt` | Опциональные пакеты (обычно проприетарное ПО) |

### Каталог /usr

Основное место для установки программ:

| Каталог | Назначение | Макрос RPM |
|---------|------------|------------|
| `/usr/bin` | Исполняемые файлы пользовательских программ | `%{_bindir}` |
| `/usr/sbin` | Исполняемые файлы системных программ | `%{_sbindir}` |
| `/usr/lib` | 32-битные библиотеки | `%{_libdir}` (на 32-бит) |
| `/usr/lib64` | 64-битные библиотеки | `%{_libdir}` (на 64-бит) |
| `/usr/libexec` | Внутренние исполняемые файлы | `%{_libexecdir}` |
| `/usr/include` | Заголовочные файлы C/C++ | `%{_includedir}` |
| `/usr/share` | Архитектурно-независимые данные | `%{_datadir}` |
| `/usr/share/man` | Страницы руководства man | `%{_mandir}` |
| `/usr/share/info` | Страницы info | `%{_infodir}` |
| `/usr/share/doc` | Документация | `%{_docdir}` |

### Каталог /var

Изменяемые данные во время работы:

| Каталог | Назначение |
|---------|------------|
| `/var/log` | Лог-файлы |
| `/var/cache` | Кешированные данные |
| `/var/lib` | Постоянные данные программ (БД, состояние) |
| `/var/run` → `/run` | Runtime-данные (PID-файлы, сокеты) |
| `/var/spool` | Очереди (почта, печать) |
| `/var/tmp` | Временные файлы, сохраняемые между перезагрузками |

### Каталог /etc

Системные конфигурации:

| Путь | Назначение |
|------|------------|
| `/etc/program.conf` | Основной конфиг программы |
| `/etc/program.d/` | Каталог для фрагментов конфигурации |
| `/etc/sysconfig/` | Параметры запуска служб (в ROSA/Fedora) |
| `/etc/default/` | Параметры запуска служб (Debian-стиль) |

## Макросы путей в RPM

В SPEC-файлах **всегда используйте макросы** вместо жёстко заданных путей:

```spec
# Правильно
%{_bindir}/myprogram
%{_libdir}/libmylib.so
%{_datadir}/%{name}/

# Неправильно
/usr/bin/myprogram
/usr/lib64/libmylib.so
/usr/share/myprogram/
```

### Почему макросы важны

1. **Переносимость** — на разных системах пути могут отличаться
2. **Мультиархитектурность** — `%{_libdir}` автоматически `/usr/lib` или `/usr/lib64`
3. **Изменения в будущем** — если стандарт изменится, достаточно обновить макросы

### Основные макросы

```bash
# Посмотреть значения макросов
rpm --eval '%{_bindir}'      # /usr/bin
rpm --eval '%{_libdir}'      # /usr/lib64 (на x86_64)
rpm --eval '%{_datadir}'     # /usr/share
rpm --eval '%{_sysconfdir}'  # /etc
rpm --eval '%{_localstatedir}'  # /var
```

Полный список:

| Макрос | Значение | Назначение |
|--------|----------|------------|
| `%{_prefix}` | `/usr` | Базовый префикс |
| `%{_exec_prefix}` | `/usr` | Префикс для исполняемых файлов |
| `%{_bindir}` | `/usr/bin` | Пользовательские программы |
| `%{_sbindir}` | `/usr/sbin` | Системные программы |
| `%{_libdir}` | `/usr/lib64` | Библиотеки (архитектурно-зависимый) |
| `%{_libexecdir}` | `/usr/libexec` | Вспомогательные программы |
| `%{_includedir}` | `/usr/include` | Заголовочные файлы |
| `%{_datadir}` | `/usr/share` | Данные (архитектурно-независимые) |
| `%{_mandir}` | `/usr/share/man` | Страницы man |
| `%{_infodir}` | `/usr/share/info` | Страницы info |
| `%{_docdir}` | `/usr/share/doc` | Документация |
| `%{_sysconfdir}` | `/etc` | Конфигурации |
| `%{_localstatedir}` | `/var` | Изменяемые данные |
| `%{_rundir}` | `/run` | Runtime-данные |
| `%{_tmppath}` | `/var/tmp` | Временные файлы сборки |

## Правила размещения файлов

### Исполняемые файлы

```spec
%files
%{_bindir}/myprogram           # Команда для пользователей
%{_sbindir}/myprogram-daemon   # Системная служба
%{_libexecdir}/%{name}/helper  # Внутренний хелпер
```

<div class="info">
  <div class="title">Совет</div>
  Если программа не предназначена для прямого вызова пользователем — она должна быть в <code>%{_libexecdir}</code>, а не в <code>%{_bindir}</code>.
</div>

### Библиотеки

```spec
%files
%{_libdir}/libmylib.so.1*      # Разделяемая библиотека

%files devel
%{_libdir}/libmylib.so         # Симлинк для линковки
%{_includedir}/mylib.h         # Заголовочный файл
%{_libdir}/pkgconfig/mylib.pc  # pkg-config файл
```

### Данные программы

```spec
%files
%{_datadir}/%{name}/           # Данные (иконки, звуки, шаблоны)
%{_datadir}/applications/%{name}.desktop  # Desktop-файл
%{_datadir}/icons/hicolor/*/apps/%{name}.png  # Иконки
```

### Конфигурации

```spec
%files
%config(noreplace) %{_sysconfdir}/%{name}.conf
%config(noreplace) %{_sysconfdir}/%{name}.d/*.conf
```

`%config(noreplace)` означает: если пользователь изменил файл, при обновлении новая версия будет сохранена как `.rpmnew`, а изменённая — останется.

### Документация

```spec
%files
%doc README.md AUTHORS
%license LICENSE COPYING
%{_mandir}/man1/%{name}.1*
%{_infodir}/%{name}.info*
```

`%doc` и `%license` — специальные маркеры, RPM автоматически помещает их в `%{_docdir}/%{name}`.

## Systemd и службы

Для systemd-юнитов:

```spec
%files
%{_unitdir}/%{name}.service           # Системная служба
%{_userunitdir}/%{name}.service       # Пользовательская служба
%{_presetdir}/90-%{name}.preset       # Preset-файл
%{_tmpfilesdir}/%{name}.conf          # tmpfiles.d конфиг
%{_sysusersdir}/%{name}.conf          # sysusers.d конфиг
```

Макросы:
- `%{_unitdir}` → `/usr/lib/systemd/system`
- `%{_userunitdir}` → `/usr/lib/systemd/user`

## Типичные ошибки

### Файлы в /usr/local

```
# Неправильно — /usr/local для ручной установки, не для пакетов
/usr/local/bin/myprogram
```

### Файлы в домашнем каталоге

```
# Неправильно — пакеты не должны трогать домашние каталоги
/home/user/.config/myprogram/
```

### Жёстко заданный /usr/lib вместо /usr/lib64

```spec
# Неправильно — сломается на x86_64
/usr/lib/libmylib.so

# Правильно
%{_libdir}/libmylib.so
```

### Конфиги без %config

```spec
# Неправильно — пользовательские изменения будут потеряны
%{_sysconfdir}/%{name}.conf

# Правильно
%config(noreplace) %{_sysconfdir}/%{name}.conf
```

## Практика: анализ пакета

Проанализируйте размещение файлов в существующем пакете:

```bash
# Скачать пакет
dnf download htop

# Посмотреть все файлы
rpm -qlp htop-*.rpm

# Проверить соответствие FHS
rpm -qlp htop-*.rpm | while read f; do
  case "$f" in
    /usr/bin/*) echo "BIN: $f" ;;
    /usr/share/man/*) echo "MAN: $f" ;;
    /usr/share/doc/*) echo "DOC: $f" ;;
    /usr/share/*) echo "DATA: $f" ;;
    /etc/*) echo "CONFIG: $f" ;;
    *) echo "OTHER: $f" ;;
  esac
done
```

## Проверьте понимание

1. Почему в SPEC-файле нужно использовать `%{_bindir}` вместо `/usr/bin`?
2. Куда должна попадать разделяемая библиотека `libfoo.so.1.0.0`?
3. Чем отличается `%config` от `%config(noreplace)`?
4. Куда помещать внутренние вспомогательные скрипты программы?
5. В каком каталоге должны находиться systemd unit-файлы?

---

**Следующий модуль:** [Анатомия SPEC-файла](@/community/beginner/02-spec-file/_index.md)
