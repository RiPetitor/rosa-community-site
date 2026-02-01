+++
title = "Проблемы с оборудованием"
description = "Решение проблем с сетью, звуком и видео"
weight = 3
+++

{{ doc_dates() }}

Иногда после установки или обновления оборудование перестаёт работать. Вот как диагностировать и исправить самые частые проблемы.

## Проблемы с сетью

### Нет подключения (Ethernet)
```bash
# Проверка статуса сетевых интерфейсов
ip addr

# Проверка статуса NetworkManager
systemctl status NetworkManager

# Перезапуск службы управления сетью
sudo systemctl restart NetworkManager
```

### Не работает Wi-Fi
```bash
# 1. Проверьте, видит ли система адаптер
lspci | grep -i wireless
lsusb | grep -i wireless

# 2. Проверьте, не заблокирован ли радиомодуль
rfkill list

# Если есть "Hard blocked: yes", включите его аппаратной кнопкой/переключателем
# Если "Soft blocked: yes", разблокируйте командой:
sudo rfkill unblock wifi
```

<div class="info">
  <div class="title">Драйверы Broadcom</div>
  Некоторые старые карты Broadcom требуют проприетарный драйвер. Если `lspci` показывает адаптер Broadcom, попробуйте установить: `sudo dnf install broadcom-wl`.
</div>

### Не работают сайты (проблема с DNS)
Если `ping 8.8.8.8` работает, а `ping ya.ru` нет — проблема в DNS.

```bash
# Проверить, какие DNS-серверы используются
resolvectl status

# Установить DNS-серверы Google через NetworkManager (изменения сохранятся)
sudo nmcli connection modify "Имя_Подключения" ipv4.dns "8.8.8.8,8.8.4.4"

# Перезагрузите подключение, чтобы применить изменения
sudo nmcli connection up "Имя_Подключения"
```

## Проблемы со звуком
ROSA Linux использует **PipeWire** как современный звуковой сервер.

### Нет звука
```bash
# 1. Проверка, видит ли система звуковые карты
aplay -l

# 2. Проверка статуса служб PipeWire
systemctl --user status pipewire pipewire-pulse

# 3. Перезапуск служб
systemctl --user restart pipewire pipewire-pulse
```

### Проверка громкости и устройств
```bash
# Проверить, не выключен ли звук
pactl get-sink-mute @DEFAULT_SINK@

# Установить громкость на 80%
pactl set-sink-volume @DEFAULT_SINK@ 80%

# Список устройств вывода
pactl list sinks short

# Установить устройство по умолчанию (замените SINK_NAME)
pactl set-default-sink SINK_NAME
```
Для более тонкой настройки и отладки установите **pavucontrol** (`sudo dnf install pavucontrol`). Эта утилита позволяет наглядно управлять потоками и устройствами.

## Проблемы с видео

### Низкое разрешение экрана
Это обычно означает, что не загрузился правильный драйвер видеокарты.

```bash
# Проверка доступных разрешений
xrandr

# Если в списке только одно низкое разрешение, драйвер не работает.
```

### Проблемы с драйверами NVIDIA
Для подробной информации обратитесь к специальному разделу **[Диагностика драйверов NVIDIA](@/docs/02-daily-use/nvidia/04-troubleshooting.md)**.

- **Чёрный экран:** Загрузитесь с параметром `nomodeset`, чтобы обойти проприетарный драйвер, и попробуйте переустановить его.
- **Проверка:** Основная команда для проверки — `nvidia-smi`.

### Проблемы с драйверами AMD
Драйвер `amdgpu` встроен в ядро Linux, но иногда ему не хватает прошивки (firmware).

```bash
# Проверка, загружен ли драйвер
glxinfo | grep "OpenGL renderer"

# Поиск ошибок, связанных с прошивкой, в логах ядра
sudo dmesg | grep -iE 'amdgpu.*firmware'
```
Если есть ошибки о недостающих файлах прошивки, убедитесь, что у вас установлен пакет `linux-firmware`.

### Тиринг (разрывы изображения)
1.  **Настройки композитора:** В первую очередь попробуйте включить VSync в настройках вашей среды рабочего стола (например, в KDE: «Параметры системы» → «Экран и монитор» → «Композитор»).
2.  **Force Composition Pipeline (NVIDIA):** Если VSync не помогает, можно использовать опцию драйвера NVIDIA. Создайте файл `/etc/X11/xorg.conf.d/20-nvidia.conf` со следующим содержимым:
    ```ini
    Section "Screen"
        Identifier "Screen0"
        Option "metamodes" "nvidia-auto-select +0+0 {ForceFullCompositionPipeline=On}"
    EndSection
    ```
    Этот метод может немного снизить производительность.

## Следующий шаг
- [Восстановление системы](@/docs/04-troubleshooting/04-system-recovery.md)
