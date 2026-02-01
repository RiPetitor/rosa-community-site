+++
title = "Официальные RPM"
description = "Установка RPM-пакетов от разработчиков"
weight = 4
+++

{{ doc_dates() }}

Некоторые разработчики предоставляют официальные RPM-пакеты для Fedora, RHEL или CentOS. Они обычно совместимы с ROSA Linux.

## Установка RPM-файла

### Через DNF (рекомендуется)

```bash
sudo dnf install ./package.rpm
```

DNF автоматически разрешит зависимости из репозиториев.

### Через rpm (без зависимостей)

```bash
sudo rpm -ivh package.rpm
```

<div class="warning">
  <div class="title">Внимание</div>
  Команда <code>rpm</code> не разрешает зависимости автоматически. Используйте <code>dnf install</code> для локальных файлов.
</div>

## Подключение репозитория разработчика

Многие программы добавляют свой репозиторий для автообновлений.

### Пример: Visual Studio Code

```bash
# Импорт ключа
sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc

# Добавление репозитория
sudo sh -c 'echo -e "[code]\nname=Visual Studio Code\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\nenabled=1\ngpgcheck=1\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc" > /etc/yum.repos.d/vscode.repo'

# Установка
sudo dnf install code
```

### Пример: Google Chrome

```bash
# Скачайте RPM с google.com/chrome
sudo dnf install ./google-chrome-stable_current_x86_64.rpm
```

Chrome автоматически добавит свой репозиторий.

## Проверка совместимости

RPM для Fedora обычно работают в ROSA. Проверьте:

- Версию glibc: `rpm -q glibc`
- Зависимости пакета: `rpm -qpR package.rpm`

## Управление репозиториями

### Список репозиториев

```bash
dnf repolist
```

### Отключение репозитория

```bash
sudo dnf config-manager --set-disabled repo-name
```

### Удаление репозитория

```bash
sudo rm /etc/yum.repos.d/repo-name.repo
```

## Удаление пакета

```bash
sudo dnf remove package-name
```

<div class="tip">
  <div class="title">Совет</div>
  Перед установкой стороннего RPM проверьте, нет ли программы в репозиториях ROSA или на Flathub.
</div>

## Следующий шаг

- [Установка из архивов](@/docs/03-third-party/05-from-archives.md)
