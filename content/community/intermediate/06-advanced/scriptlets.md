+++
title = "Скриптлеты и триггеры"
weight = 3
description = "%pre/%post/%preun/%postun и триггеры для корректной установки."
+++

Скриптлеты — это shell-команды, которые выполняются при установке, обновлении и удалении пакета. Используйте их с осторожностью и только когда это действительно необходимо.

## Когда нужны скриптлеты

| Задача | Скриптлет |
|--------|-----------|
| Обновить кэш ldconfig (библиотеки) | `%post` / `%postun` |
| Регистрация сервиса systemd | `%post` / `%preun` / `%postun` |
| Создание системного пользователя | `%pre` |
| Обновление кэша иконок | `%transfiletriggerin` |
| Обновление desktop-базы | `%transfiletriggerin` |
| Обновление кэша шрифтов | `%transfiletriggerin` |

## Порядок выполнения

### При установке нового пакета

```
%pre    (до копирования файлов)
        ← файлы копируются в систему
%post   (после копирования файлов)
```

### При обновлении (1.0 → 2.0)

```
%pre    новой версии (2.0)
        ← файлы новой версии копируются
%post   новой версии (2.0)
%preun  старой версии (1.0)
        ← файлы старой версии удаляются
%postun старой версии (1.0)
```

### При удалении

```
%preun  (до удаления файлов)
        ← файлы удаляются
%postun (после удаления файлов)
```

## Аргумент `$1` — различаем установку, обновление и удаление

Скриптлеты получают аргумент `$1` — количество версий пакета после завершения операции:

| Операция | `$1` в `%pre`/`%post` | `$1` в `%preun`/`%postun` |
|----------|----------------------|--------------------------|
| Установка | 1 | — |
| Обновление | 2 | 1 |
| Удаление | — | 0 |

Использование:

```spec
%post
if [ $1 -eq 1 ]; then
    # Первая установка
    echo "Welcome to mypackage!"
fi

%postun
if [ $1 -eq 0 ]; then
    # Полное удаление (не обновление)
    rm -rf /var/cache/mypackage
fi
```

## Systemd-сервисы

Для пакетов с systemd unit-файлами используйте готовые макросы:

```spec
BuildRequires:  systemd-rpm-macros

%post
%systemd_post myservice.service

%preun
%systemd_preun myservice.service

%postun
%systemd_postun_with_restart myservice.service
```

Что делают макросы:
- `%systemd_post` — включает preset (если настроен), перезагружает конфигурацию systemd
- `%systemd_preun` — останавливает и отключает сервис при удалении
- `%systemd_postun_with_restart` — перезапускает сервис при обновлении

Вариант без перезапуска при обновлении:

```spec
%postun
%systemd_postun myservice.service
```

## Ldconfig (разделяемые библиотеки)

Для пакетов с `.so.*` файлами:

```spec
%post -p /sbin/ldconfig
%postun -p /sbin/ldconfig
```

Флаг `-p` означает: вместо shell-скрипта выполнить программу напрямую (быстрее и безопаснее).

## Создание системного пользователя

```spec
BuildRequires:  systemd-rpm-macros

%pre
%sysusers_create_compat %{SOURCE1}
```

Где `Source1` — файл `mypackage.sysusers`:

```
u mypackage - "MyPackage Service" /var/lib/mypackage /sbin/nologin
```

Альтернативный (старый) способ:

```spec
%pre
getent group mypackage >/dev/null || groupadd -r mypackage
getent passwd mypackage >/dev/null || \
    useradd -r -g mypackage -d /var/lib/mypackage -s /sbin/nologin \
    -c "MyPackage Service" mypackage
exit 0
```

## Триггеры

Триггеры реагируют на установку или удаление **других** пакетов.

### File triggers (современный способ)

Файловые триггеры срабатывают, когда любой пакет добавляет файлы в указанный каталог:

```spec
# Обновить кэш иконок
%transfiletriggerin -- %{_datadir}/icons/hicolor
gtk-update-icon-cache --force %{_datadir}/icons/hicolor &>/dev/null || :

# Обновить desktop-базу
%transfiletriggerin -- %{_datadir}/applications
update-desktop-database %{_datadir}/applications &>/dev/null || :

# Обновить кэш GLib-схем
%transfiletriggerin -- %{_datadir}/glib-2.0/schemas
glib-compile-schemas %{_datadir}/glib-2.0/schemas &>/dev/null || :
```

Файловые триггеры обычно находятся в пакетах, предоставляющих соответствующие утилиты (gtk3, desktop-file-utils, glib2). Вам не нужно добавлять их вручную в каждый пакет.

### Классические триггеры

```spec
# Срабатывает при установке пакета "other-package"
%triggerin -- other-package
echo "other-package установлен, обновляю конфиг"
```

## Важные правила

### Идемпотентность

Скриптлет может выполниться несколько раз. Он должен давать одинаковый результат:

```spec
%post
# ПРАВИЛЬНО — идемпотентно
getent group mygroup >/dev/null || groupadd -r mygroup

# НЕПРАВИЛЬНО — при повторном запуске упадёт
groupadd -r mygroup
```

### Обработка ошибок

Скриптлет не должен прерывать установку при ошибке:

```spec
%post
# || : — игнорировать ошибку
/usr/bin/update-cache || :

# Или явная проверка
if [ -x /usr/bin/update-cache ]; then
    /usr/bin/update-cache
fi
```

### Запрещено

- **Сетевые операции** — установка может быть офлайн
- **Пользовательский ввод** — установка должна быть автоматической
- **Долгие операции** — пакетный менеджер ждёт завершения
- **Удаление файлов других пакетов** — это нарушает целостность

## Зависимости от скриптлетов

Если скриптлет вызывает программу, укажите зависимость:

```spec
Requires(pre):    shadow-utils
Requires(post):   systemd
Requires(preun):  systemd
Requires(postun): systemd
```

`Requires(pre)` гарантирует, что `shadow-utils` будет установлен **до** выполнения `%pre`.

## Отладка скриптлетов

```bash
# Посмотреть скриптлеты установленного пакета
rpm -q --scripts mypackage

# Посмотреть скриптлеты в RPM-файле
rpm -qp --scripts mypackage-1.0-1.x86_64.rpm

# Посмотреть триггеры
rpm -q --triggers mypackage
```

## Проверьте понимание

1. В каком порядке выполняются скриптлеты при обновлении?
2. Как отличить установку от обновления в `%post`?
3. Зачем нужен `|| :` в конце команд?
4. Какие макросы используются для systemd-сервисов?
5. Чем файловые триггеры лучше обычных скриптлетов?

---

**Далее:** [Условные сборки и bcond](@/community/intermediate/06-advanced/conditional.md)
