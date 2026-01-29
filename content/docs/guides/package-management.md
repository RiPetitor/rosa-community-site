+++
title = "Управление пакетами"
description = "Как устанавливать, обновлять и удалять программы"
weight = 1
+++

ROSA Linux использует пакетный менеджер **DNF** для управления программным
обеспечением.

## Основные команды

```bash
# поиск пакета
dnf search имя_пакета

# установка пакета
sudo dnf install имя_пакета

# удаление пакета
sudo dnf remove имя_пакета

# обновление системы
sudo dnf update
```

## Работа с репозиториями

```bash
# показать подключенные репозитории
dnf repolist

# добавить репозиторий (пример)
sudo dnf config-manager --add-repo https://example.repo
```

## Полезные операции

```bash
# история операций
dnf history

# очистка кеша
sudo dnf clean all
```

<div class="info">
  <div class="title">Графические инструменты</div>
  В KDE можно использовать Discover, в GNOME — GNOME Software.
</div>

## Flatpak

```bash
# включить Flathub
sudo flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
```

## Советы

<div class="warning">
  <div class="title">Внимание</div>
  Не смешивайте пакеты из разных версий ROSA Linux — это может привести к конфликтам.
</div>
