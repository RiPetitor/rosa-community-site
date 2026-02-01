+++
title = "Нет сети / звука / видео"
description = "Решение проблем с оборудованием"
weight = 3
+++

{{ doc_dates() }}

Проблемы с сетью, звуком или видео — частая ситуация. Вот как их диагностировать и исправить.

## Проблемы с сетью

### Нет подключения

```bash
# Проверка интерфейсов
ip link

# Статус NetworkManager
systemctl status NetworkManager

# Перезапуск сети
sudo systemctl restart NetworkManager
```

### Wi-Fi не работает

```bash
# Проверка Wi-Fi адаптера
lspci | grep -i wireless
lsusb | grep -i wireless

# Статус радиомодуля
rfkill list

# Разблокировка
sudo rfkill unblock wifi
```

### Драйвер Wi-Fi

```bash
# Проверка загруженных модулей
lsmod | grep -E 'iwl|ath|rtl|bcm'

# Информация об устройстве
sudo dmesg | grep -i wifi
```

<div class="info">
  <div class="title">Broadcom</div>
  Для карт Broadcom может потребоваться проприетарный драйвер: <code>sudo dnf install broadcom-wl</code>
</div>

### DNS не работает

```bash
# Проверка DNS
nslookup ya.ru

# Временное решение — добавить DNS вручную
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
```

## Проблемы со звуком

### Нет звука вообще

```bash
# Проверка звуковых карт
aplay -l

# Статус PipeWire
systemctl --user status pipewire pipewire-pulse

# Перезапуск
systemctl --user restart pipewire pipewire-pulse
```

### Звук выключен

```bash
# Проверка громкости
pactl get-sink-volume @DEFAULT_SINK@
pactl get-sink-mute @DEFAULT_SINK@

# Включить звук
pactl set-sink-mute @DEFAULT_SINK@ 0
pactl set-sink-volume @DEFAULT_SINK@ 100%
```

### Выбор устройства вывода

```bash
# Список устройств
pactl list sinks short

# Установить устройство по умолчанию
pactl set-default-sink SINK_NAME
```

### HDMI звук

```bash
# Проверка HDMI
aplay -l | grep HDMI

# В настройках звука выберите HDMI-выход
```

## Проблемы с видео

### Чёрный экран / артефакты

#### NVIDIA

```bash
# Проверка драйвера
nvidia-smi

# Переустановка
sudo dnf reinstall nvidia-driver

# Загрузка с открытым драйвером
# В GRUB добавьте: nouveau.modeset=1
```

#### AMD

```bash
# Проверка
glxinfo | grep "OpenGL renderer"

# Переустановка Mesa
sudo dnf reinstall mesa-dri-drivers
```

### Низкое разрешение

```bash
# Проверка доступных разрешений
xrandr

# Установка разрешения
xrandr --output HDMI-1 --mode 1920x1080
```

### Тиринг (разрывы изображения)

#### KDE Plasma

1. Параметры системы → Экран → Композитор.
2. Включите «VSync».

#### NVIDIA

Создайте `/etc/X11/xorg.conf.d/20-nvidia.conf`:

```
Section "Device"
    Identifier "NVIDIA"
    Driver "nvidia"
    Option "TripleBuffer" "true"
EndSection

Section "Screen"
    Identifier "Screen0"
    Option "metamodes" "nvidia-auto-select +0+0 {ForceFullCompositionPipeline=On}"
EndSection
```

## Общая диагностика

### Информация об оборудовании

```bash
# Подробный отчёт
inxi -Fxz

# Только проблемное оборудование
sudo dmesg | grep -iE 'error|fail|warn'
```

### Проверка драйверов

```bash
# Загруженные модули
lsmod

# Информация о модуле
modinfo module_name

# Загрузка модуля
sudo modprobe module_name
```

<div class="tip">
  <div class="title">Совет</div>
  При обращении за помощью прикладывайте вывод <code>inxi -Fxz</code> — это сильно ускорит диагностику.
</div>

## Следующий шаг

- [Восстановление системы](@/docs/04-troubleshooting/04-system-recovery.md)
