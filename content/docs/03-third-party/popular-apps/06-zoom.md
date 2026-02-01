+++
title = "Zoom"
description = "Установка Zoom для видеоконференций"
weight = 6
+++

{{ doc_dates() }}

Zoom — популярная платформа для видеоконференций.

## Способ 1: Flatpak (рекомендуется)

```bash
flatpak install flathub us.zoom.Zoom
```

Запуск:

```bash
flatpak run us.zoom.Zoom
```

<div class="tip">
  <div class="title">Преимущество Flatpak</div>
  Zoom в Flatpak изолирован от системы и имеет ограниченный доступ к файлам.
</div>

## Способ 2: Официальный RPM

### Скачивание

1. Откройте [zoom.us/download](https://zoom.us/download).
2. В разделе «Zoom Client for Linux» выберите «Fedora» и архитектуру x86_64.
3. Нажмите «Download».

### Установка

```bash
cd ~/Загрузки
sudo dnf install ./zoom_x86_64.rpm
```

## Запуск

- Через меню приложений
- Командой: `zoom`

## Настройка

### Камера и микрофон

1. Откройте Zoom → Настройки → Видео/Аудио.
2. Выберите нужные устройства.
3. Проверьте работу.

### Виртуальный фон

Требуется процессор с поддержкой AVX2 или видеокарта NVIDIA.

1. Настройки → Фон и эффекты.
2. Выберите изображение или размытие.

## Проблемы и решения

### Нет звука/видео

1. Проверьте разрешения в настройках системы.
2. Для Flatpak проверьте разрешения через Flatseal.
3. Перезапустите PipeWire:
   ```bash
   systemctl --user restart pipewire
   ```

### Демонстрация экрана в Wayland

В Wayland могут быть ограничения. Решения:

- Используйте X11 сессию для важных звонков
- Или выберите конкретное окно вместо всего экрана

### Высокая нагрузка на CPU

- Отключите виртуальный фон
- Уменьшите качество видео
- Закройте лишние приложения

## Обновление

```bash
# RPM
sudo dnf update zoom

# Flatpak
flatpak update us.zoom.Zoom
```

## Удаление

```bash
# RPM
sudo dnf remove zoom

# Flatpak
flatpak uninstall us.zoom.Zoom
```

## Альтернативы

- **Jitsi Meet** — открытая платформа, работает в браузере
- **Google Meet** — через браузер
- **Microsoft Teams** — доступен как Flatpak
