+++
title = "Конфигурационные файлы"
description = "Важные файлы конфигурации системы"
weight = 2
+++

Linux настраивается через текстовые файлы. Знание ключевых конфигов — основа системного администрирования.

## Общие правила

- Конфигурация системы в `/etc/`
- Пользовательская конфигурация в `~/.config/` или `~/.*`
- Перед изменением делайте копию: `sudo cp file file.bak`
- Используйте `sudo` для системных файлов

## Системные файлы

### /etc/fstab — монтирование

Определяет, какие разделы монтировать при загрузке.

```bash
# Формат: устройство точка_монтирования тип опции dump pass
/dev/sda1  /boot  ext4  defaults  0 2
/dev/sda2  /      ext4  defaults  0 1
/dev/sda3  swap   swap  defaults  0 0
```

<div class="danger">
  <div class="title">Осторожно</div>
  Ошибка в fstab может привести к невозможности загрузки. Всегда проверяйте: <code>sudo mount -a</code>
</div>

### /etc/hostname — имя компьютера

```bash
cat /etc/hostname
# или
hostnamectl

# Изменение
sudo hostnamectl set-hostname new-name
```

### /etc/hosts — локальный DNS

```bash
127.0.0.1   localhost
127.0.1.1   mycomputer
192.168.1.10 server.local server
```

### /etc/resolv.conf — DNS-серверы

```bash
nameserver 8.8.8.8
nameserver 8.8.4.4
```

<div class="info">
  <div class="title">NetworkManager</div>
  При использовании NetworkManager этот файл генерируется автоматически. Для постоянных изменений настройте DNS в NetworkManager.
</div>

## Пользователи и группы

### /etc/passwd — пользователи

```bash
username:x:1000:1000:Full Name:/home/username:/bin/bash
```

### /etc/shadow — пароли

Хэши паролей. Только для root.

### /etc/group — группы

```bash
wheel:x:10:user1,user2
```

### /etc/sudoers — права sudo

Редактируйте через `visudo`:

```bash
sudo visudo
```

## Сеть

### /etc/NetworkManager/

Конфигурация NetworkManager и соединений.

### /etc/sysconfig/network-scripts/

Традиционные скрипты сети (устарело, но иногда используется).

## Загрузчик

### /etc/default/grub

```bash
GRUB_TIMEOUT=5
GRUB_CMDLINE_LINUX="quiet splash"
GRUB_DISABLE_OS_PROBER=false
```

После изменения:

```bash
sudo grub2-mkconfig -o /boot/grub2/grub.cfg
```

## Сервисы

### /etc/systemd/system/

Локальные юниты systemd, переопределяют системные.

### Переопределение конфигурации сервиса

```bash
sudo systemctl edit sshd
```

Создаёт `/etc/systemd/system/sshd.service.d/override.conf`.

## Окружение

### /etc/environment

Глобальные переменные окружения.

```bash
PATH="/usr/local/bin:/usr/bin:/bin"
EDITOR=nano
```

### /etc/profile и /etc/profile.d/

Скрипты, выполняемые при входе в систему.

### ~/.bashrc

Пользовательская конфигурация bash.

```bash
# Алиасы
alias ll='ls -la'
alias update='sudo dnf update'

# Переменные
export EDITOR=nano

# PATH
export PATH="$HOME/.local/bin:$PATH"
```

После изменения:

```bash
source ~/.bashrc
```

## DNF

### /etc/dnf/dnf.conf

```bash
[main]
gpgcheck=1
installonly_limit=3
clean_requirements_on_remove=True
best=False
skip_if_unavailable=True
```

### Ускорение DNF

Добавьте в `/etc/dnf/dnf.conf`:

```bash
max_parallel_downloads=10
fastestmirror=True
```

## Безопасность

### /etc/ssh/sshd_config

Конфигурация SSH-сервера.

```bash
Port 22
PermitRootLogin no
PasswordAuthentication yes
```

После изменения:

```bash
sudo systemctl restart sshd
```

## Проверка синтаксиса

Многие конфиги можно проверить:

```bash
# SSH
sudo sshd -t

# GRUB
sudo grub2-script-check /boot/grub2/grub.cfg

# Systemd
systemd-analyze verify /etc/systemd/system/myunit.service
```

## Следующий шаг

- [Управление сервисами](@/docs/05-advanced/03-services.md)
