+++
title = "Управление сервисами"
description = "Работа с systemd: сервисы, таймеры, юниты"
weight = 3
+++

Systemd — система инициализации и управления сервисами в ROSA Linux.

## Основные команды systemctl

### Управление сервисами

```bash
# Статус
systemctl status sshd

# Запуск
sudo systemctl start sshd

# Остановка
sudo systemctl stop sshd

# Перезапуск
sudo systemctl restart sshd

# Перезагрузка конфигурации (без остановки)
sudo systemctl reload sshd
```

### Автозапуск

```bash
# Включить автозапуск
sudo systemctl enable sshd

# Выключить автозапуск
sudo systemctl disable sshd

# Включить и запустить сразу
sudo systemctl enable --now sshd
```

### Просмотр

```bash
# Все сервисы
systemctl list-units --type=service

# Только активные
systemctl list-units --type=service --state=running

# Неудачные
systemctl list-units --failed
```

## Типы юнитов

| Тип | Расширение | Назначение |
| --- | --- | --- |
| Service | `.service` | Демоны и сервисы |
| Timer | `.timer` | Планировщик задач |
| Mount | `.mount` | Точки монтирования |
| Socket | `.socket` | Сокеты для активации |
| Target | `.target` | Группы юнитов |
| Path | `.path` | Мониторинг файлов |

## Создание своего сервиса

### Пример: простой скрипт

1. Создайте скрипт:

```bash
sudo nano /usr/local/bin/myscript.sh
```

```bash
#!/bin/bash
echo "Service started at $(date)" >> /var/log/myscript.log
# Ваш код здесь
```

```bash
sudo chmod +x /usr/local/bin/myscript.sh
```

2. Создайте юнит:

```bash
sudo nano /etc/systemd/system/myscript.service
```

```ini
[Unit]
Description=My Custom Script
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/myscript.sh

[Install]
WantedBy=multi-user.target
```

3. Активируйте:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now myscript
```

### Типы сервисов

- `Type=simple` — основной процесс остаётся запущенным
- `Type=oneshot` — выполняется один раз и завершается
- `Type=forking` — демон форкается (как традиционные демоны)

## Таймеры (замена cron)

### Пример: ежедневная задача

Создайте сервис `/etc/systemd/system/backup.service`:

```ini
[Unit]
Description=Daily backup

[Service]
Type=oneshot
ExecStart=/usr/local/bin/backup.sh
```

Создайте таймер `/etc/systemd/system/backup.timer`:

```ini
[Unit]
Description=Run backup daily

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

Активируйте:

```bash
sudo systemctl enable --now backup.timer
```

### Просмотр таймеров

```bash
systemctl list-timers
```

### Синтаксис OnCalendar

```
OnCalendar=daily           # Каждый день в 00:00
OnCalendar=weekly          # Каждую неделю
OnCalendar=*-*-* 02:00:00  # Каждый день в 2:00
OnCalendar=Mon *-*-* 09:00 # Каждый понедельник в 9:00
```

## Пользовательские сервисы

Для сервисов текущего пользователя:

```bash
# Создайте папку
mkdir -p ~/.config/systemd/user/

# Создайте юнит
nano ~/.config/systemd/user/myapp.service

# Управление
systemctl --user daemon-reload
systemctl --user enable --now myapp
systemctl --user status myapp
```

## Диагностика

### Логи сервиса

```bash
journalctl -u sshd
journalctl -u sshd -f  # Следить
journalctl -u sshd --since "1 hour ago"
```

### Анализ загрузки

```bash
# Время загрузки
systemd-analyze

# Детальный анализ
systemd-analyze blame

# График зависимостей
systemd-analyze plot > boot.svg
```

### Зависимости

```bash
# От чего зависит
systemctl list-dependencies sshd

# Что зависит от
systemctl list-dependencies --reverse sshd
```

## Переопределение конфигурации

Не редактируйте файлы в `/usr/lib/systemd/`. Используйте drop-in файлы:

```bash
sudo systemctl edit sshd
```

Это создаст `/etc/systemd/system/sshd.service.d/override.conf`.

## Следующий шаг

- [Оптимизация и тюнинг](@/docs/advanced/optimization.md)
