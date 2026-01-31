+++
title = "Проблемы после обновлений"
description = "Исправление неполадок, возникших после обновления системы"
weight = 2
+++

Обновления иногда приводят к неожиданным проблемам. Вот как их решить.

## Откат обновления

### Использование истории DNF

```bash
# Посмотреть историю
sudo dnf history

# Детали конкретной транзакции
sudo dnf history info N

# Откатить транзакцию
sudo dnf history undo N
```

<div class="warning">
  <div class="title">Осторожно</div>
  Откат может потребовать также откатить зависимые транзакции. DNF предупредит об этом.
</div>

## Загрузка с предыдущим ядром

Если проблема связана с новым ядром:

1. Перезагрузитесь.
2. В меню GRUB выберите «Advanced options».
3. Выберите предыдущую версию ядра.

### Установка предыдущего ядра по умолчанию

```bash
# Список установленных ядер
rpm -qa | grep kernel

# Узнать пункты меню GRUB
sudo grubby --info=ALL

# Установить ядро по умолчанию
sudo grubby --set-default /boot/vmlinuz-5.x.x-xxx
```

## Сломанные зависимости

### Диагностика

```bash
sudo dnf check
```

### Восстановление

```bash
# Синхронизация с репозиториями
sudo dnf distro-sync

# Принудительная переустановка
sudo dnf reinstall пакет

# Удаление проблемного пакета
sudo dnf remove пакет
```

## Проблемы с драйвером NVIDIA

После обновления ядра драйвер NVIDIA может не работать.

### Решение

```bash
# Переустановка драйвера
sudo dnf reinstall nvidia-driver akmod-nvidia

# Пересборка модуля ядра
sudo akmods --force
sudo dracut --force

# Перезагрузка
sudo reboot
```

### Временное решение

Загрузитесь с `nomodeset` и переустановите драйвер.

## Не работает графический интерфейс

### Переключение на TTY

Нажмите `Ctrl + Alt + F2` для входа в текстовый режим.

### Перезапуск дисплейного менеджера

```bash
# SDDM (KDE)
sudo systemctl restart sddm

# GDM (GNOME)
sudo systemctl restart gdm
```

### Проверка логов

```bash
journalctl -xe
cat /var/log/Xorg.0.log
```

## Восстановление через Timeshift

Если вы настроили Timeshift до обновления:

```bash
sudo timeshift --restore
```

Или через графический интерфейс Timeshift.

## Очистка кэша DNF

Иногда помогает очистка кэша:

```bash
sudo dnf clean all
sudo dnf makecache
```

## Проверка целостности пакетов

```bash
# Проверка всех пакетов
sudo rpm -Va

# Переустановка повреждённых
sudo dnf reinstall $(rpm -Va 2>&1 | grep -E '^..5' | awk '{print $NF}' | xargs rpm -qf | sort -u)
```

<div class="tip">
  <div class="title">Профилактика</div>
  Создавайте снимки системы (Timeshift, Snapper) перед крупными обновлениями.
</div>

## Следующий шаг

- [Нет сети / звука / видео](@/docs/04-troubleshooting/03-hardware-issues.md)
