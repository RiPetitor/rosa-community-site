+++
title = "Где смотреть логи"
description = "Поиск и анализ системных журналов"
weight = 5
+++

Логи — первый источник информации при диагностике проблем.

## journalctl — главный инструмент

Systemd хранит логи в бинарном формате. Для просмотра используйте `journalctl`.

### Основные команды

```bash
# Все логи текущей загрузки
journalctl -b

# Логи предыдущей загрузки
journalctl -b -1

# Последние 100 строк
journalctl -n 100

# Следить за логами в реальном времени
journalctl -f

# Только ошибки и предупреждения
journalctl -p err
journalctl -p warning

# Логи конкретного сервиса
journalctl -u NetworkManager
journalctl -u sddm
```

### Фильтрация по времени

```bash
# За последний час
journalctl --since "1 hour ago"

# За сегодня
journalctl --since today

# Конкретный период
journalctl --since "2024-01-15 10:00" --until "2024-01-15 12:00"
```

### Поиск

```bash
# Поиск по ключевому слову
journalctl | grep -i error

# Расширенный вывод с контекстом
journalctl -xe
```

## Файлы в /var/log

Некоторые программы пишут логи в традиционные файлы.

### Основные файлы

| Файл | Содержимое |
| --- | --- |
| `/var/log/messages` | Общие системные сообщения |
| `/var/log/secure` | Аутентификация, sudo |
| `/var/log/dnf.log` | Операции DNF |
| `/var/log/Xorg.0.log` | Графический сервер X11 |
| `/var/log/boot.log` | Загрузка системы |

### Просмотр

```bash
# Последние строки
tail -n 50 /var/log/messages

# Следить за изменениями
tail -f /var/log/messages

# Поиск ошибок
grep -i error /var/log/messages
```

## Логи конкретных подсистем

### Сеть

```bash
journalctl -u NetworkManager
journalctl -u firewalld
```

### Звук

```bash
journalctl --user -u pipewire
journalctl --user -u pipewire-pulse
```

### Графика

```bash
# X11
cat /var/log/Xorg.0.log | grep -E '\(EE\)|\(WW\)'

# Wayland (KDE)
journalctl --user -u plasma-kwin_wayland
```

### Загрузчик

```bash
journalctl -b | grep -i grub
```

## Логи приложений

### Flatpak

```bash
flatpak run --command=bash com.app.Name
# Затем запустите приложение и смотрите вывод
```

### Snap

```bash
snap logs app-name
```

### Пользовательские приложения

Часто пишут логи в:
- `~/.local/share/app-name/`
- `~/.config/app-name/`

## Анализ краша ядра

```bash
# Последние kernel panic
journalctl -k -p err

# Информация о падениях
sudo coredumpctl list
sudo coredumpctl info
```

## Отправка логов в поддержку

### Создание отчёта

```bash
# Сохранить логи в файл
journalctl -b > ~/boot-log.txt

# Системная информация
inxi -Fxz > ~/system-info.txt
```

### Очистка личных данных

Перед отправкой проверьте логи на наличие:
- Имён пользователей
- IP-адресов
- Путей с личной информацией

```bash
# Замена username
sed -i 's/your_username/USER/g' ~/boot-log.txt
```

## Ротация логов

Старые логи автоматически удаляются. Настройки в `/etc/logrotate.conf`.

### Очистка журнала

```bash
# Оставить только последние 2 дня
sudo journalctl --vacuum-time=2d

# Ограничить размер
sudo journalctl --vacuum-size=500M
```

<div class="tip">
  <div class="title">Совет</div>
  При обращении за помощью всегда прикладывайте релевантные логи — это значительно ускоряет решение проблемы.
</div>
