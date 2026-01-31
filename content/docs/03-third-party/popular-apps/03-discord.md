+++
title = "Discord"
description = "Установка Discord для голосового общения"
weight = 3
+++

Discord — платформа для голосового и текстового общения, популярная среди геймеров и сообществ.

## Способ 1: Flatpak (рекомендуется)

```bash
flatpak install flathub com.discordapp.Discord
```

Запуск:

```bash
flatpak run com.discordapp.Discord
```

<div class="tip">
  <div class="title">Почему Flatpak</div>
  Discord лучше устанавливать через Flatpak — приложение изолировано и не имеет полного доступа к системе.
</div>

## Способ 2: Официальный RPM

### Скачивание

1. Откройте [discord.com/download](https://discord.com/download).
2. Нажмите «Download for Linux» → выберите «deb» или скачайте tar.gz.

Для RPM-систем лучше использовать tar.gz:

```bash
cd ~/Загрузки
tar -xzf discord-*.tar.gz
sudo mv Discord /opt/
```

### Создание ярлыка

```bash
sudo cat > /usr/share/applications/discord.desktop << EOF
[Desktop Entry]
Name=Discord
Exec=/opt/Discord/Discord
Icon=/opt/Discord/discord.png
Type=Application
Categories=Network;Chat;
EOF
```

## Обновление

- **Flatpak**: `flatpak update`
- **Ручная установка**: скачайте новую версию и замените файлы

## Известные проблемы

### Нет звука в голосовых каналах

Проверьте разрешения Flatpak через Flatseal или:

```bash
flatpak permission-reset com.discordapp.Discord
```

### Не работает демонстрация экрана

В Wayland могут быть проблемы. Решения:
- Используйте X11 сессию
- Или включите PipeWire интеграцию

## Удаление

```bash
# Flatpak
flatpak uninstall com.discordapp.Discord

# Ручная установка
sudo rm -rf /opt/Discord
sudo rm /usr/share/applications/discord.desktop
```
