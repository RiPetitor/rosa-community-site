+++
title = "Репозитории и пакетные менеджеры"
weight = 3
description = "Как dnf работает с репозиториями, разрешение зависимостей, кеширование."
+++

Пакеты не существуют в вакууме — они живут в **репозиториях**, а доступ к ним обеспечивают **пакетные менеджеры**.

## Что такое репозиторий

Репозиторий — это структурированное хранилище пакетов с метаданными. Он состоит из:

```
repository/
├── repodata/                    # Метаданные репозитория
│   ├── repomd.xml              # Главный индекс
│   ├── primary.xml.gz          # Информация о пакетах
│   ├── filelists.xml.gz        # Списки файлов
│   ├── other.xml.gz            # Changelog и прочее
│   └── *-comps.xml.gz          # Группы пакетов (опционально)
├── Packages/                    # Сами RPM-файлы
│   ├── a/
│   │   ├── apache-2.4.57-1.x86_64.rpm
│   │   └── ...
│   ├── b/
│   └── ...
└── drpms/                       # Дельта-пакеты (опционально)
```

### Создание метаданных

Метаданные создаются утилитой `createrepo_c`:

```bash
# Создать репозиторий из каталога с RPM
createrepo_c /path/to/packages/

# Обновить после добавления новых пакетов
createrepo_c --update /path/to/packages/
```

## Репозитории в ROSA Linux

ROSA использует несколько типов репозиториев:

| Репозиторий | Назначение |
|-------------|------------|
| **main/release** | Основные пакеты дистрибутива |
| **main/updates** | Обновления безопасности и исправления |
| **contrib/release** | Дополнительные пакеты от сообщества |
| **non-free** | Проприетарные компоненты |
| **restricted** | Пакеты с ограниченным распространением |

Конфигурация репозиториев находится в `/etc/yum.repos.d/`:

```bash
ls /etc/yum.repos.d/
# rosa-main.repo
# rosa-contrib.repo
# ...
```

Пример файла репозитория (путь и зеркало могут отличаться — ориентируйтесь на вашу платформу ROSA):

```ini
[rosa-main-release]
name=ROSA Main Release
baseurl=http://mirror.rosa.ru/rosa/rosa13.1/repository/$basearch/main/release/
enabled=1
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-ROSA
# путь к ключу уточняйте в /etc/pki/rpm-gpg/
```

## Пакетный менеджер dnf

**dnf** (Dandified YUM) — основной пакетный менеджер в ROSA:

### Основные команды

```bash
# Поиск пакета
dnf search firefox

# Информация о пакете
dnf info firefox

# Установка
sudo dnf install firefox

# Удаление
sudo dnf remove firefox

# Обновление всех пакетов
sudo dnf upgrade

# Обновление конкретного пакета
sudo dnf upgrade firefox

# Список установленных
dnf list installed

# Список доступных обновлений
dnf check-update
```

### Работа с репозиториями

```bash
# Список репозиториев
dnf repolist
dnf repolist all  # включая отключённые

# Включить репозиторий
sudo dnf config-manager --set-enabled repo-name

# Отключить
sudo dnf config-manager --set-disabled repo-name

# Временно использовать репозиторий
sudo dnf --enablerepo=testing install package
```

### Работа с группами

```bash
# Список групп
dnf group list

# Информация о группе
dnf group info "Development Tools"

# Установка группы
sudo dnf group install "Development Tools"
```

## Разрешение зависимостей

Когда вы устанавливаете пакет, dnf:

1. **Читает метаданные** всех включённых репозиториев
2. **Строит граф зависимостей** — какие пакеты требуются
3. **Разрешает конфликты** — выбирает совместимые версии
4. **Вычисляет транзакцию** — что установить, обновить, удалить
5. **Скачивает пакеты** (или берёт из кеша)
6. **Выполняет транзакцию**

```bash
# Посмотреть, что будет установлено (без установки)
dnf install --assumeno firefox

# Подробный вывод
dnf install -v firefox
```

### Типы зависимостей

```bash
# Что требуется пакету для работы
dnf repoquery --requires firefox

# Что требуется для сборки (из SRPM)
dnf repoquery --requires --srpm firefox

# Какие пакеты зависят от данного
dnf repoquery --whatrequires openssl-libs

# Какой пакет предоставляет файл
dnf provides /usr/bin/python3
```

### Конфликты и obsoletes

Иногда пакеты несовместимы:

```spec
# В SPEC-файле
Conflicts: old-package < 2.0
Obsoletes: renamed-package < 1.0
Provides:  renamed-package = %{version}
```

- **Conflicts** — нельзя установить вместе
- **Obsoletes** — заменяет устаревший пакет (dnf автоматически удалит старый)

## Кеширование

dnf кеширует метаданные и пакеты:

```bash
# Где хранится кеш
ls /var/cache/dnf/

# Очистить кеш метаданных
sudo dnf clean metadata

# Очистить кеш пакетов
sudo dnf clean packages

# Очистить всё
sudo dnf clean all

# Принудительно обновить метаданные
sudo dnf makecache
```

Настройка в `/etc/dnf/dnf.conf`:

```ini
[main]
keepcache=0          # Не хранить скачанные RPM после установки
metadata_expire=48h  # Время жизни кеша метаданных
```

## Приоритеты репозиториев

Если один пакет есть в нескольких репозиториях, dnf выбирает по:

1. **Приоритету** репозитория (меньше = выше)
2. **Версии** пакета (новее = лучше)

```ini
[myrepo]
name=My Repository
baseurl=http://example.com/repo/
priority=10  # Выше приоритет, чем у стандартных (99)
```

## Модульность (dnf modules)

Современный dnf поддерживает **модули** — способ иметь несколько версий одного ПО:

```bash
# Список модулей
dnf module list

# Информация о модуле
dnf module info nodejs

# Включить определённый поток (версию)
sudo dnf module enable nodejs:18

# Установить модуль
sudo dnf module install nodejs:18
```

## История и откат

dnf ведёт историю транзакций:

```bash
# Посмотреть историю
dnf history
dnf history info 15  # детали транзакции #15

# Откатить последнюю транзакцию
sudo dnf history undo last

# Откатить конкретную
sudo dnf history undo 15
```

## Практика: исследуем репозитории

```bash
# Список всех репозиториев
dnf repolist -v

# Сколько пакетов в каждом
dnf repolist

# Найти пакет и узнать, из какого он репозитория
dnf info firefox | grep Repository

# Посмотреть доступные версии пакета
dnf --showduplicates list firefox

# Посмотреть changelog пакета из репозитория
dnf changelog firefox | head -50
```

## Типичные проблемы

### «Ничего не найдено»

```bash
# Обновить кеш
sudo dnf clean all
sudo dnf makecache
```

### «Конфликт зависимостей»

```bash
# Посмотреть, что конфликтует
dnf repoquery --conflicts problem-package

# Попробовать с --allowerasing (удалит конфликтующие)
sudo dnf install package --allowerasing
```

### «Пакет исключён»

Проверьте `/etc/dnf/dnf.conf` на наличие `exclude=...`

## Проверьте понимание

1. Что содержит каталог `repodata/` в репозитории?
2. Как dnf узнаёт, какие пакеты доступны?
3. Как посмотреть, какой пакет предоставляет файл `/usr/lib64/libssl.so.3`?
4. Что произойдёт, если пакет A имеет `Obsoletes: B`?
5. Как откатить последнюю установку?

---

**Далее:** [Стандарт FHS и пути установки](fhs-standards.md)
