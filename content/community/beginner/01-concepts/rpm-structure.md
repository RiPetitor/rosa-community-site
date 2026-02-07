+++
title = "Внутреннее устройство RPM"
weight = 2
description = "Из чего состоит RPM-файл: заголовки, метаданные, payload, подписи."
+++

RPM-файл — это не просто архив. Это структурированный контейнер с несколькими уровнями информации. Понимание его устройства поможет при отладке проблем.

## Структура RPM-файла

RPM-файл состоит из четырёх частей:

```
┌─────────────────────────────────┐
│         Lead (96 байт)          │  ← Магическое число, совместимость
├─────────────────────────────────┤
│      Signature Header           │  ← Подписи и контрольные суммы
├─────────────────────────────────┤
│        Main Header              │  ← Метаданные пакета
├─────────────────────────────────┤
│     Payload (cpio.zstd)         │  ← Сжатый архив с файлами
└─────────────────────────────────┘
```

### 1. Lead (устаревшая часть)

Первые 96 байт — это «визитная карточка» формата:

```bash
# Посмотреть начало RPM-файла
hexdump -C package.rpm | head -6
```

Вы увидите магическое число `ed ab ee db` — признак RPM-формата. Lead существует для обратной совместимости и практически не используется современными инструментами.

### 2. Signature Header

Содержит криптографические данные для проверки целостности:

- **MD5/SHA256 хеш** содержимого
- **GPG-подпись** (если пакет подписан)
- **Размер** несжатых данных

```bash
# Проверить подпись пакета
rpm -K package.rpm

# Пример вывода:
# package.rpm: digests signatures OK
```

### 3. Main Header (метаданные)

Основная информация о пакете в формате «тег-значение»:

```bash
# Посмотреть все теги заголовка
rpm -qp --queryformat '[%{HEADERTAGNAME}: %{HEADERVALUE}\n]' package.rpm

# Или конкретные поля
rpm -qp --queryformat '%{NAME}-%{VERSION}-%{RELEASE}.%{ARCH}\n' package.rpm
```

Ключевые теги:

| Тег | Описание | Пример |
|-----|----------|--------|
| `NAME` | Имя пакета | `firefox` |
| `VERSION` | Версия upstream | `115.0` |
| `RELEASE` | Версия сборки | `1.rosa13.1` |
| `ARCH` | Архитектура | `x86_64`, `noarch` |
| `SUMMARY` | Краткое описание | `Mozilla Firefox web browser` |
| `DESCRIPTION` | Полное описание | Многострочный текст |
| `LICENSE` | Лицензия | `MPL-2.0` |
| `URL` | Домашняя страница | `https://www.mozilla.org/firefox/` |
| `VENDOR` | Поставщик | `ROSA` |
| `BUILDHOST` | Где собран | `builder.abf.io` |
| `BUILDTIME` | Когда собран | Unix timestamp |
| `SOURCERPM` | Исходный пакет | `firefox-115.0-1.src.rpm` |

### 4. Payload

Архив с файлами пакета. Используется формат **cpio**, сжатый одним из алгоритмов:

- **zstd** — современный, быстрый (по умолчанию в ROSA)
- **xz/lzma** — высокая степень сжатия
- **gzip** — совместимость со старыми системами
- **bzip2** — редко используется

```bash
# Узнать формат сжатия
rpm -qp --queryformat '%{PAYLOADCOMPRESSOR}\n' package.rpm

# Распаковать payload без установки
rpm2cpio package.rpm | cpio -idmv
```

## NEVRA: идентификация пакета

Каждый пакет уникально идентифицируется комбинацией **NEVRA**:

```
N ame      - firefox
E poch     - 0 (обычно опускается)
V ersion   - 115.0
R elease   - 1.rosa13.1
A rch      - x86_64
```

Полное имя файла: `firefox-115.0-1.rosa13.1.x86_64.rpm`

### Epoch: особый случай

**Epoch** — это числовой префикс версии, который имеет наивысший приоритет при сравнении:

```
Epoch:1 Version:1.0  >  Epoch:0 Version:99.0
```

Epoch используется редко и только когда:
- Upstream изменил схему версионирования (было `2023.1`, стало `1.0`)
- Нужно «перебить» неудачную версию

<div class="warning">
  <div class="title">Осторожно с Epoch</div>
  Однажды добавив Epoch, его нельзя убрать. Epoch:0 < Epoch:1 навсегда. Используйте только как крайнюю меру.
</div>

## Зависимости в RPM

RPM хранит несколько типов зависимостей:

### Requires (для работы)

```bash
rpm -qp --requires package.rpm
```

Пример вывода:
```
/bin/sh
libc.so.6()(64bit)
libssl.so.3()(64bit)
config(firefox) = 115.0-1
```

### Provides (что предоставляет)

```bash
rpm -qp --provides package.rpm
```

Пример:
```
firefox = 115.0-1
firefox(x86-64) = 115.0-1
config(firefox) = 115.0-1
```

### BuildRequires (для сборки)

Хранятся только в SRPM:
```bash
rpm -qp --requires package.src.rpm
```

### Автоматические зависимости

RPM автоматически определяет зависимости от:
- Разделяемых библиотек (`.so`)
- Интерпретаторов скриптов (`#!/usr/bin/python3`)
- Perl/Python модулей

Это работает благодаря скриптам `find-requires` и `find-provides`.

## База данных RPM

Установленные пакеты регистрируются в базе данных:

```
/var/lib/rpm/
├── Packages          # Основная БД (Berkeley DB или SQLite)
├── Basenames         # Индекс по именам файлов
├── Providename       # Индекс по provides
├── Requirename       # Индекс по requires
└── ...
```

Запросы к установленным пакетам:

```bash
# Какому пакету принадлежит файл
rpm -qf /usr/bin/firefox

# Все файлы пакета
rpm -ql firefox

# Конфигурационные файлы
rpm -qc firefox

# Документация
rpm -qd firefox

# Скрипты установки/удаления
rpm -q --scripts firefox
```

## Практика: исследуем пакет

```bash
# Скачаем пакет без установки
dnf download coreutils

# Основная информация
rpm -qip coreutils-*.rpm

# Список файлов
rpm -qlp coreutils-*.rpm | head -20

# Зависимости
rpm -qp --requires coreutils-*.rpm

# Что предоставляет
rpm -qp --provides coreutils-*.rpm

# Скрипты
rpm -qp --scripts coreutils-*.rpm

# Changelog
rpm -qp --changelog coreutils-*.rpm | head -30

# Распаковать без установки
mkdir extracted
cd extracted
rpm2cpio ../coreutils-*.rpm | cpio -idmv
ls -la
```

## Проверьте понимание

1. Из каких четырёх частей состоит RPM-файл?
2. Что означает NEVRA?
3. Когда следует использовать Epoch?
4. Как посмотреть, какому пакету принадлежит файл в системе?
5. Как распаковать RPM без установки?

---

**Далее:** [Репозитории и пакетные менеджеры](@/community/beginner/01-concepts/repositories.md)
