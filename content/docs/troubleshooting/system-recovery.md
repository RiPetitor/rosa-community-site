+++
title = "Восстановление системы"
description = "Методы восстановления повреждённой системы"
weight = 4
+++

Когда система серьёзно повреждена, есть несколько путей восстановления.

## Timeshift

Timeshift создаёт снимки системы, позволяя откатиться к рабочему состоянию.

### Установка

```bash
sudo dnf install timeshift
```

### Создание снимка

```bash
sudo timeshift --create --comments "Перед обновлением"
```

### Восстановление

```bash
# Список снимков
sudo timeshift --list

# Восстановление
sudo timeshift --restore --snapshot '2024-01-15_12-00-00'
```

Или через графический интерфейс.

<div class="warning">
  <div class="title">Важно</div>
  Timeshift не сохраняет домашние папки по умолчанию. Настройте это отдельно или используйте другой инструмент для бэкапа данных.
</div>

## Восстановление через Live USB

### Монтирование системы

```bash
# Найдите ваши разделы
lsblk

# Примонтируйте корень
sudo mount /dev/sdaX /mnt

# Для работы chroot нужны специальные файловые системы
sudo mount --bind /dev /mnt/dev
sudo mount --bind /dev/pts /mnt/dev/pts
sudo mount --bind /proc /mnt/proc
sudo mount --bind /sys /mnt/sys

# Для UEFI
sudo mount /dev/sdaY /mnt/boot/efi

# Вход в систему
sudo chroot /mnt
```

### Что можно сделать в chroot

- Переустановить пакеты
- Восстановить загрузчик
- Изменить конфигурацию
- Сбросить пароль

### Переустановка повреждённых пакетов

```bash
# В chroot
dnf reinstall bash coreutils systemd
```

### Выход и перезагрузка

```bash
exit
sudo umount -R /mnt
sudo reboot
```

## Сброс пароля root

Если забыли пароль:

### Через GRUB

1. В меню GRUB нажмите `e`.
2. Найдите строку с `linux`.
3. Добавьте в конец: `init=/bin/bash`
4. Нажмите `Ctrl + X`.

```bash
# Перемонтируйте корень для записи
mount -o remount,rw /

# Смените пароль
passwd

# Перезагрузка
exec /sbin/init
```

### Через Live USB

```bash
sudo mount /dev/sdaX /mnt
sudo chroot /mnt
passwd
exit
sudo umount /mnt
```

## Восстановление файловой системы

### Проверка и исправление

```bash
# Отмонтируйте раздел или загрузитесь с Live USB
sudo umount /dev/sdaX

# Проверка ext4
sudo fsck.ext4 -f /dev/sdaX

# Проверка btrfs
sudo btrfs check /dev/sdaX
```

<div class="danger">
  <div class="title">Опасно</div>
  Никогда не запускайте fsck на примонтированном разделе!
</div>

## Переустановка с сохранением данных

Если восстановление невозможно:

1. Загрузитесь с Live USB.
2. Скопируйте важные данные из `/home`.
3. Переустановите систему.
4. Восстановите данные.

### Сохранение списка пакетов

До переустановки:

```bash
rpm -qa > ~/packages.txt
```

После переустановки:

```bash
sudo dnf install $(cat ~/packages.txt)
```

## Аварийный режим (Emergency mode)

Если система загружается в emergency mode:

```bash
# Проверьте файловые системы
journalctl -xb

# Исправьте проблему и перезагрузитесь
systemctl reboot
```

Частые причины:
- Ошибки в `/etc/fstab`
- Повреждённая файловая система
- Проблемы с SELinux

## Следующий шаг

- [Где смотреть логи](@/docs/troubleshooting/logs.md)
