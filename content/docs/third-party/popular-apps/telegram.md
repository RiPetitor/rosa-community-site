+++
title = "Telegram"
description = "Установка мессенджера Telegram"
weight = 2
+++

Telegram — популярный мессенджер с фокусом на скорость и безопасность.

## Способ 1: Flatpak (рекомендуется)

```bash
flatpak install flathub org.telegram.desktop
```

Запуск:

```bash
flatpak run org.telegram.desktop
```

## Способ 2: Официальный архив

### Скачивание

1. Откройте [desktop.telegram.org](https://desktop.telegram.org/).
2. Скачайте «Telegram for Linux 64 bit».

### Установка

```bash
cd ~/Загрузки
tar -xJf tsetup.*.tar.xz
mv Telegram ~/Applications/
```

### Запуск и интеграция

```bash
~/Applications/Telegram/Telegram
```

При первом запуске Telegram предложит добавить себя в меню.

## Способ 3: Репозитории ROSA

Проверьте наличие в репозиториях:

```bash
dnf search telegram
sudo dnf install telegram-desktop
```

## Обновление

- **Flatpak**: `flatpak update`
- **Архив**: Telegram обновляется автоматически

## Удаление

```bash
# Flatpak
flatpak uninstall org.telegram.desktop

# Архив
rm -rf ~/Applications/Telegram
```

<div class="info">
  <div class="title">Автозапуск</div>
  Telegram можно настроить на автозапуск в настройках приложения: Настройки → Продвинутые настройки → Запускать Telegram при старте системы.
</div>
