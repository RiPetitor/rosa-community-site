+++
title = "Оборудование и драйверы"
description = "Настройка видеокарт, принтеров и периферии"
weight = 5
+++

{{ doc_dates() }}

Большинство оборудования в Linux работает «из коробки». Но некоторые устройства требуют дополнительной настройки.

## Видеокарты

### NVIDIA

Проприетарные драйверы обеспечивают лучшую производительность.

```bash
# Проверка видеокарты
lspci | grep -i nvidia

# Установка драйвера
sudo dnf install nvidia-driver
```

После установки перезагрузите систему.

<div class="warning">
  <div class="title">Важно</div>
  После обновления ядра может потребоваться переустановка драйвера NVIDIA.
</div>

### AMD

Драйверы AMDGPU встроены в ядро Linux.

```bash
# Проверка
lspci | grep -i amd

# Для Vulkan и OpenGL
sudo dnf install mesa-vulkan-drivers mesa-dri-drivers
```

### Intel

Драйверы встроены в ядро. Дополнительно:

```bash
sudo dnf install intel-media-driver
```

## Звук

### PulseAudio / PipeWire

ROSA использует PipeWire — современную звуковую систему.

```bash
# Проверка звуковых устройств
pactl list sinks short

# Регулировка громкости
pactl set-sink-volume @DEFAULT_SINK@ +10%
```

### Нет звука?

1. Проверьте, не выключен ли звук: `pactl get-sink-mute @DEFAULT_SINK@`
2. Откройте микшер и проверьте уровни.
3. Перезапустите PipeWire: `systemctl --user restart pipewire`

## Принтеры

ROSA использует CUPS для печати.

### Графическая настройка

1. Откройте «Параметры системы» → «Принтеры».
2. Нажмите «Добавить принтер».
3. Следуйте инструкциям.

### Через терминал

```bash
# Установка CUPS
sudo dnf install cups

# Запуск службы
sudo systemctl enable --now cups

# Веб-интерфейс
# Откройте http://localhost:631 в браузере
```

### HP принтеры

```bash
sudo dnf install hplip
hp-setup
```

## Bluetooth

### Включение

```bash
sudo systemctl enable --now bluetooth
```

### Сопряжение устройства

1. Откройте настройки Bluetooth.
2. Включите обнаружение.
3. Выберите устройство и подключитесь.

### Через терминал

```bash
bluetoothctl
# В интерактивном режиме:
power on
agent on
scan on
pair XX:XX:XX:XX:XX:XX
connect XX:XX:XX:XX:XX:XX
```

## Веб-камеры

Обычно работают автоматически. Проверка:

```bash
# Список видеоустройств
ls /dev/video*

# Тест камеры
sudo dnf install cheese
cheese
```

## Информация об оборудовании

```bash
# Подробная информация
inxi -Fxz

# Список PCI-устройств
lspci

# Список USB-устройств
lsusb

# Информация о процессоре
lscpu

# Информация о памяти
free -h
```

## Следующий шаг

- [Пользователи и права](@/docs/02-daily-use/06-users-permissions.md)
