+++
title = "Проверка результатов"
weight = 2
+++

## Проверка rpmlint

```bash
rpmlint ~/rpmbuild/RPMS/x86_64/gamemode-*.rpm
```

## Проверка содержимого пакетов

Убедитесь, что файлы попали в правильные подпакеты:

```bash
# Основной пакет — демон, CLI, systemd, D-Bus
rpm -qpl ~/rpmbuild/RPMS/x86_64/gamemode-1.8.2-1.*.x86_64.rpm

# Библиотеки — только .so с версиями
rpm -qpl ~/rpmbuild/RPMS/x86_64/gamemode-libs-1.8.2-1.*.x86_64.rpm

# Для разработчиков — заголовки, симлинки, pkgconfig
rpm -qpl ~/rpmbuild/RPMS/x86_64/gamemode-devel-1.8.2-1.*.x86_64.rpm
```

## Проверка зависимостей

```bash
rpm -qpR ~/rpmbuild/RPMS/x86_64/gamemode-1.8.2-1.*.x86_64.rpm | head -15
```

В зависимостях должна быть `gamemode-libs` — RPM генерирует это автоматически, потому что
бинарники линкуются с `libgamemode.so`.

## Тестовая установка

```bash
sudo dnf install ~/rpmbuild/RPMS/x86_64/gamemode-*.rpm

# Проверить, что юнит доступен
systemctl --user status gamemoded.service

# Проверить, что бинарник работает
gamemoderun echo "GameMode works"
```
