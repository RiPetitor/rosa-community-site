+++
title = "Flatpak"
description = "Установка приложений через Flatpak"
weight = 2
+++

Flatpak — универсальный формат пакетов, работающий в песочнице. Приложения изолированы от системы и друг от друга.

## Установка Flatpak

```bash
sudo dnf install flatpak
```

## Подключение Flathub

Flathub — основной репозиторий Flatpak-приложений.

```bash
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```

После этого перезагрузите систему или перелогиньтесь.

## Использование

### Поиск приложения

```bash
flatpak search telegram
```

Или через [flathub.org](https://flathub.org/).

### Установка

```bash
flatpak install flathub org.telegram.desktop
```

### Запуск

```bash
flatpak run org.telegram.desktop
```

Приложения также появляются в меню.

### Список установленных

```bash
flatpak list
```

### Обновление

```bash
flatpak update
```

### Удаление

```bash
flatpak uninstall org.telegram.desktop
```

## Интеграция с системой

### Центр приложений

В KDE Discover и GNOME Software Flatpak интегрирован автоматически.

### Разрешения

Flatpak-приложения работают в песочнице. Для управления разрешениями:

```bash
sudo dnf install flatseal
flatpak run com.github.tchx84.Flatseal
```

Flatseal позволяет:
- Давать доступ к папкам
- Разрешать сеть, звук, камеру
- Настраивать переменные окружения

## Особенности

<div class="info">
  <div class="title">Размер</div>
  Flatpak-приложения занимают больше места, так как включают свои зависимости. Однако многие зависимости переиспользуются между приложениями.
</div>

<div class="tip">
  <div class="title">Совет</div>
  Flatpak — хороший выбор для проприетарных приложений (Discord, Slack, Zoom), которые лучше держать изолированными.
</div>

## Очистка

Удаление неиспользуемых зависимостей:

```bash
flatpak uninstall --unused
```

## Следующий шаг

- [AppImage](@/docs/03-third-party/03-appimage.md)
