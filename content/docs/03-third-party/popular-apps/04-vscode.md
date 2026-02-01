+++
title = "VS Code"
description = "Установка редактора Visual Studio Code"
weight = 4
+++

{{ doc_dates() }}

Visual Studio Code — популярный редактор кода от Microsoft.

## Способ 1: Официальный репозиторий

### Добавление репозитория

```bash
# Импорт ключа
sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc

# Добавление репозитория
sudo sh -c 'echo -e "[code]\nname=Visual Studio Code\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" > /etc/yum.repos.d/vscode.repo'
```

### Установка

```bash
sudo dnf check-update
sudo dnf install code
```

## Способ 2: Flatpak

```bash
flatpak install flathub com.visualstudio.code
```

## Способ 3: Скачать RPM

1. Откройте [code.visualstudio.com](https://code.visualstudio.com/).
2. Скачайте `.rpm` файл.
3. Установите:

```bash
sudo dnf install ./code-*.rpm
```

## Запуск

- Через меню приложений
- Командой: `code`
- Открыть папку: `code /path/to/project`

## Полезные расширения

После установки добавьте расширения:

- **Russian Language Pack** — русский интерфейс
- **GitLens** — расширенная работа с Git
- **Prettier** — форматирование кода
- **ESLint** — проверка JavaScript/TypeScript

## Настройки

Откройте настройки: `Ctrl + ,`

### Русский интерфейс

1. Установите расширение «Russian Language Pack».
2. Перезапустите VS Code.
3. Выберите русский язык в появившемся диалоге.

## Обновление

При установке через репозиторий:

```bash
sudo dnf update code
```

## Альтернатива: VSCodium

Открытая сборка без телеметрии Microsoft:

```bash
flatpak install flathub com.vscodium.codium
```

<div class="info">
  <div class="title">Информация</div>
  VSCodium функционально идентичен VS Code, но без отслеживания и с открытым исходным кодом.
</div>

## Удаление

```bash
sudo dnf remove code
# Удаление репозитория
sudo rm /etc/yum.repos.d/vscode.repo
```
