+++
title = "Архитектура ROSA"
description = "Структура и компоненты дистрибутива ROSA Linux"
weight = 1
+++

Понимание архитектуры системы помогает эффективнее решать задачи и диагностировать проблемы.

## Основа

ROSA Linux — это RPM-дистрибутив, использующий:

- **Пакетный менеджер:** DNF (ранее urpmi)
- **Формат пакетов:** RPM
- **Система инициализации:** systemd
- **Загрузчик:** GRUB2

## Структура файловой системы

```
/
├── bin/          → /usr/bin     # Основные команды
├── sbin/         → /usr/sbin    # Системные команды
├── lib/          → /usr/lib     # Библиотеки
├── lib64/        → /usr/lib64   # 64-bit библиотеки
├── boot/                         # Ядро и загрузчик
├── dev/                          # Файлы устройств
├── etc/                          # Конфигурация системы
├── home/                         # Домашние папки
├── opt/                          # Стороннее ПО
├── proc/                         # Виртуальная ФС процессов
├── root/                         # Домашняя папка root
├── run/                          # Данные времени выполнения
├── srv/                          # Данные сервисов
├── sys/                          # Виртуальная ФС ядра
├── tmp/                          # Временные файлы
├── usr/                          # Пользовательские программы
│   ├── bin/                      # Исполняемые файлы
│   ├── lib/                      # Библиотеки
│   ├── share/                    # Общие данные
│   └── local/                    # Локально установленное ПО
└── var/                          # Изменяемые данные
    ├── log/                      # Логи
    ├── cache/                    # Кэш
    └── lib/                      # Данные приложений
```

## Репозитории ROSA

### Основные репозитории

| Репозиторий | Содержимое |
| --- | --- |
| `rosa-main` | Основные пакеты, поддерживаемые ROSA |
| `rosa-contrib` | Пакеты от сообщества |
| `rosa-non-free` | Проприетарное ПО, кодеки |

### Конфигурация

Файлы репозиториев находятся в `/etc/yum.repos.d/`.

```bash
# Просмотр подключённых
dnf repolist

# Информация о репозитории
dnf repoinfo rosa-main
```

## Система инициализации (systemd)

Systemd управляет:
- Загрузкой системы
- Сервисами и демонами
- Таймерами и задачами
- Точками монтирования
- Логированием (journald)

### Цели (targets)

```bash
# Текущая цель
systemctl get-default

# Доступные цели
systemctl list-units --type=target

# Изменение цели
sudo systemctl set-default graphical.target  # GUI
sudo systemctl set-default multi-user.target # Консоль
```

## Ядро Linux

### Информация о ядре

```bash
# Версия
uname -r

# Подробности
uname -a

# Параметры ядра
cat /proc/cmdline
```

### Модули ядра

```bash
# Загруженные модули
lsmod

# Информация о модуле
modinfo nvidia

# Загрузка/выгрузка
sudo modprobe module_name
sudo modprobe -r module_name
```

### Параметры загрузки

Редактируются в `/etc/default/grub`:

```bash
GRUB_CMDLINE_LINUX="quiet splash"
```

После изменения:

```bash
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
```

## Графическая подсистема

### X11 vs Wayland

- **X11** — классический протокол, широкая совместимость
- **Wayland** — современный протокол, лучшая безопасность

Проверка текущего сессии:

```bash
echo $XDG_SESSION_TYPE
```

### Display Manager

SDDM (KDE) или GDM (GNOME) — менеджеры входа.

```bash
# Статус
systemctl status sddm

# Переключение
sudo systemctl disable gdm
sudo systemctl enable sddm
```

## Следующий шаг

- [Конфигурационные файлы](@/docs/05-advanced/02-config-files.md)
