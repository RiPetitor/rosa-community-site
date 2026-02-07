+++
title = "systemd и D-Bus"
weight = 3
+++

## Юнит-файлы systemd: пути и макросы

Одна из самых запутанных тем для новичков — где лежат юнит-файлы systemd.

### Системные и пользовательские юниты

| Тип | Путь | RPM-макрос |
|-----|------|------------|
| Системные юниты | `/usr/lib/systemd/system/` | `%{_unitdir}` |
| Пользовательские юниты | `/usr/lib/systemd/user/` | `%{_userunitdir}` |

gamemode использует **пользовательский юнит** — демон запускается от имени пользователя,
а не от root. Поэтому файл `gamemoded.service` лежит в `/usr/lib/systemd/user/`.

> **Внимание!** Путь именно `/usr/lib/systemd/user/`, а **не** `/usr/lib64/systemd/user/`.
> Юнит-файлы systemd — это не бинарники и не библиотеки, они architecture-independent.
> Поэтому всегда `/usr/lib/`, даже на 64-битных системах. Макрос `%{_userunitdir}`
> это гарантирует.

### Скриптлеты systemd

В SPEC-файле мы используем макросы из пакета `systemd-rpm-macros`:

```spec
# После установки: включить юнит в автозапуск для пользователя
%post
%systemd_user_post gamemoded.service

# Перед удалением: остановить и отключить юнит
%preun
%systemd_user_preun gamemoded.service

# После удаления: перезапустить юнит при обновлении пакета
%postun
%systemd_user_postun_with_restart gamemoded.service
```

Эти макросы раскрываются в вызовы `systemctl`, обёрнутые в проверки (чтобы не падать,
если systemd не запущен). Для **системных** юнитов используются аналоги без `_user`:
`%systemd_post`, `%systemd_preun`, `%systemd_postun_with_restart`.

## D-Bus: где что лежит

gamemode регистрирует D-Bus-сервис. Файлы:

| Файл | Путь | Назначение |
|------|------|------------|
| Service-файл | `/usr/share/dbus-1/services/com.feralinteractive.GameMode.service` | Говорит D-Bus, как запустить демон |
| Policy-файл | `/etc/dbus-1/system.d/com.feralinteractive.GameMode.conf` | Политика: кто может обращаться к сервису |

Если вы забудете включить эти файлы в `%files`, D-Bus не будет знать о сервисе,
и gamemode не сможет автоматически запускаться по запросу.
