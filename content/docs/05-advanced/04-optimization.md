+++
title = "Оптимизация и тюнинг"
description = "Настройка производительности системы"
weight = 4
+++

{{ doc_dates() }}

ROSA Linux работает хорошо из коробки, но для специфических задач может потребоваться тонкая настройка.

## Диагностика

### Мониторинг ресурсов

```bash
# Общая картина
htop
# или
top

# Использование памяти
free -h

# Дисковое пространство
df -h

# Нагрузка на диск
iotop

# Сетевая активность
iftop
```

### Анализ загрузки

```bash
# Время загрузки
systemd-analyze

# Медленные сервисы
systemd-analyze blame

# Критический путь
systemd-analyze critical-chain
```

## Оптимизация загрузки

### Отключение ненужных сервисов

```bash
# Список сервисов
systemctl list-unit-files --type=service

# Отключение
sudo systemctl disable bluetooth  # Если не нужен Bluetooth
sudo systemctl disable cups       # Если нет принтера
```

<div class="warning">
  <div class="title">Осторожно</div>
  Отключайте только те сервисы, назначение которых вам понятно.
</div>

### Параллельная загрузка

Systemd уже загружает сервисы параллельно. Проверьте:

```bash
systemctl get-default
# Должно быть graphical.target для десктопа
```

## Оптимизация памяти

### Swappiness

Определяет, как активно система использует swap.

```bash
# Текущее значение
cat /proc/sys/vm/swappiness

# Для десктопа рекомендуется 10-20
sudo sysctl vm.swappiness=10

# Постоянно
echo "vm.swappiness=10" | sudo tee /etc/sysctl.d/99-swappiness.conf
```

### ZRAM (сжатый swap в RAM)

```bash
sudo dnf install zram-generator

# Конфигурация
sudo nano /etc/systemd/zram-generator.conf
```

```ini
[zram0]
zram-size = ram / 2
compression-algorithm = zstd
```

```bash
sudo systemctl daemon-reload
sudo systemctl start systemd-zram-setup@zram0.service
```

### Очистка кэша

```bash
# Освобождение кэша (временно)
sudo sync
sudo sh -c "echo 3 > /proc/sys/vm/drop_caches"
```

## Оптимизация диска

### SSD TRIM

Для SSD включите периодический TRIM:

```bash
sudo systemctl enable --now fstrim.timer
```

### Планировщик I/O

Для SSD используйте `mq-deadline` или `none`:

```bash
# Проверка текущего
cat /sys/block/sda/queue/scheduler

# Изменение (временно)
echo mq-deadline | sudo tee /sys/block/sda/queue/scheduler
```

Постоянно — через параметр ядра: `elevator=mq-deadline`

### noatime

Уменьшает записи на диск. В `/etc/fstab`:

```
/dev/sda1 / ext4 defaults,noatime 0 1
```

## Оптимизация графики

### Compositor

В KDE Plasma:
1. Параметры системы → Экран → Compositor.
2. Попробуйте разные бэкенды (OpenGL 3.1, OpenGL 2.0).
3. Для слабых машин отключите эффекты.

### NVIDIA

Создайте `/etc/X11/xorg.conf.d/20-nvidia.conf`:

```
Section "Device"
    Identifier "NVIDIA"
    Driver "nvidia"
    Option "TripleBuffer" "true"
    Option "Coolbits" "28"
EndSection
```

## Оптимизация сети

### TCP BBR

Современный алгоритм контроля перегрузки:

```bash
echo "net.core.default_qdisc=fq" | sudo tee -a /etc/sysctl.d/99-network.conf
echo "net.ipv4.tcp_congestion_control=bbr" | sudo tee -a /etc/sysctl.d/99-network.conf
sudo sysctl -p /etc/sysctl.d/99-network.conf
```

## Профили производительности

### tuned

Автоматическая настройка под нагрузку:

```bash
sudo dnf install tuned

# Запуск
sudo systemctl enable --now tuned

# Доступные профили
tuned-adm list

# Установка профиля
sudo tuned-adm profile desktop
# или для ноутбука
sudo tuned-adm profile laptop-battery-powersave
```

## Оптимизация для игр

```bash
# Gamemode
sudo dnf install gamemode

# MangoHud для мониторинга
sudo dnf install mangohud
```

Gamemode автоматически:
- Повышает приоритет игры
- Отключает заставку
- Оптимизирует CPU governor

## Мониторинг изменений

После оптимизации сравните:

```bash
# Время загрузки
systemd-analyze

# Использование памяти
free -h
```

<div class="tip">
  <div class="title">Принцип</div>
  Оптимизируйте то, что действительно является узким местом. Не делайте преждевременную оптимизацию.
</div>

## Следующий шаг

- [Автоматизация](@/docs/05-advanced/05-automation.md)
