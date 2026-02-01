+++
title = "Google Chrome"
description = "Установка браузера Google Chrome"
weight = 1
+++

{{ doc_dates() }}

Google Chrome — популярный браузер от Google.

## Способ 1: Официальный RPM

### Скачивание

1. Откройте [google.com/chrome](https://www.google.com/chrome/).
2. Нажмите «Скачать Chrome».
3. Выберите «64-bit .rpm (для Fedora/openSUSE)».

### Установка

```bash
cd ~/Загрузки
sudo dnf install ./google-chrome-stable_current_x86_64.rpm
```

Chrome автоматически добавит репозиторий для обновлений.

## Способ 2: Flatpak

```bash
flatpak install flathub com.google.Chrome
```

## Запуск

- Через меню приложений
- Или командой: `google-chrome-stable`

## Обновление

При установке через RPM Chrome обновляется вместе с системой:

```bash
sudo dnf update google-chrome-stable
```

## Удаление

```bash
sudo dnf remove google-chrome-stable
```

<div class="tip">
  <div class="title">Альтернатива</div>
  Рассмотрите Chromium — открытую версию Chrome, доступную в репозиториях: <code>sudo dnf install chromium</code>
</div>
