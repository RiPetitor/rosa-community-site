+++
title = "Автоматизация"
description = "Скрипты, планировщики и инструменты автоматизации"
weight = 5
+++

Автоматизация рутинных задач экономит время и снижает количество ошибок.

## Bash-скрипты

### Основы

```bash
#!/bin/bash

# Переменные
NAME="ROSA Linux"
VERSION=$(cat /etc/os-release | grep VERSION_ID | cut -d= -f2)

# Вывод
echo "Система: $NAME $VERSION"

# Условия
if [ -f /etc/rosa-release ]; then
    echo "Это ROSA Linux"
fi

# Циклы
for file in /var/log/*.log; do
    echo "Найден лог: $file"
done
```

### Полезный скрипт: обновление системы

```bash
#!/bin/bash
set -e

echo "=== Обновление системы ==="

# Обновление пакетов
sudo dnf update -y

# Очистка
sudo dnf autoremove -y
sudo dnf clean all

# Flatpak
if command -v flatpak &> /dev/null; then
    echo "=== Обновление Flatpak ==="
    flatpak update -y
fi

echo "=== Готово ==="
```

Сохраните как `~/bin/update-system.sh` и сделайте исполняемым:

```bash
mkdir -p ~/bin
chmod +x ~/bin/update-system.sh
```

## Systemd таймеры

Замена cron с интеграцией в systemd.

### Пример: еженедельная очистка

`~/.config/systemd/user/cleanup.service`:

```ini
[Unit]
Description=Weekly cleanup

[Service]
Type=oneshot
ExecStart=/home/user/bin/cleanup.sh
```

`~/.config/systemd/user/cleanup.timer`:

```ini
[Unit]
Description=Run cleanup weekly

[Timer]
OnCalendar=weekly
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
systemctl --user daemon-reload
systemctl --user enable --now cleanup.timer
```

## Cron (классический способ)

```bash
# Редактирование задач
crontab -e
```

Формат:

```
# минута час день месяц день_недели команда
0 2 * * * /home/user/bin/backup.sh       # Каждый день в 2:00
0 0 * * 0 /home/user/bin/weekly.sh       # Каждое воскресенье
*/15 * * * * /home/user/bin/check.sh     # Каждые 15 минут
```

## Ansible

Для сложной автоматизации и управления несколькими машинами.

### Установка

```bash
sudo dnf install ansible
```

### Простой playbook

`setup.yml`:

```yaml
---
- name: Настройка рабочей станции
  hosts: localhost
  become: yes
  
  tasks:
    - name: Обновить систему
      dnf:
        name: "*"
        state: latest
    
    - name: Установить базовые программы
      dnf:
        name:
          - vim
          - htop
          - git
        state: present
    
    - name: Включить сервис SSH
      systemd:
        name: sshd
        enabled: yes
        state: started
```

Запуск:

```bash
ansible-playbook setup.yml
```

## Алиасы и функции

В `~/.bashrc`:

```bash
# Алиасы
alias update='sudo dnf update'
alias ll='ls -lah'
alias ..='cd ..'
alias grep='grep --color=auto'

# Функции
mkcd() {
    mkdir -p "$1" && cd "$1"
}

extract() {
    if [ -f "$1" ]; then
        case "$1" in
            *.tar.bz2)   tar xjf "$1"    ;;
            *.tar.gz)    tar xzf "$1"    ;;
            *.tar.xz)    tar xJf "$1"    ;;
            *.zip)       unzip "$1"      ;;
            *.7z)        7z x "$1"       ;;
            *)           echo "Неизвестный формат: $1" ;;
        esac
    fi
}
```

## Автозапуск приложений

### Графические приложения

Создайте `.desktop` файл в `~/.config/autostart/`:

```ini
[Desktop Entry]
Type=Application
Name=My App
Exec=/path/to/app
Hidden=false
X-GNOME-Autostart-enabled=true
```

### Через systemd

```bash
# Создайте user-сервис
nano ~/.config/systemd/user/myapp.service

# Включите
systemctl --user enable myapp
```

## Резервное копирование

### Простой скрипт с rsync

```bash
#!/bin/bash
SOURCE="/home/user"
DEST="/mnt/backup"
DATE=$(date +%Y-%m-%d)

rsync -avz --delete \
    --exclude='.cache' \
    --exclude='Downloads' \
    "$SOURCE" "$DEST/backup-$DATE"

# Удаление старых бэкапов (старше 30 дней)
find "$DEST" -maxdepth 1 -name "backup-*" -mtime +30 -exec rm -rf {} \;
```

### Borg Backup

Продвинутое решение с дедупликацией:

```bash
sudo dnf install borgbackup

# Инициализация репозитория
borg init --encryption=repokey /mnt/backup/borg

# Создание бэкапа
borg create /mnt/backup/borg::backup-$(date +%Y-%m-%d) /home/user

# Список бэкапов
borg list /mnt/backup/borg
```

## Мониторинг

### Скрипт проверки диска

```bash
#!/bin/bash
THRESHOLD=90

df -H | grep -vE '^Filesystem|tmpfs' | awk '{ print $5 " " $1 }' | while read usage partition; do
    usage_num=${usage%\%}
    if [ "$usage_num" -ge "$THRESHOLD" ]; then
        echo "Внимание: $partition заполнен на $usage"
    fi
done
```

<div class="tip">
  <div class="title">Совет</div>
  Начинайте с простых скриптов и постепенно усложняйте. Автоматизируйте то, что делаете чаще всего.
</div>
