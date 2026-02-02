+++
title = "Структура проекта на ABF"
weight = 3
description = "Организация репозитория: SPEC, исходники, патчи."
+++

Репозиторий проекта на ABF содержит всё необходимое для сборки пакета: SPEC-файл, исходники и патчи.

## Типичная структура

```
mypackage/
├── mypackage.spec          # SPEC-файл (обязательно)
├── mypackage-1.0.0.tar.gz  # Архив исходников
├── mypackage-fix.patch     # Патчи (если нужны)
├── mypackage.service       # Дополнительные файлы
└── .abf.yml                # Конфигурация сборки (опционально)
```

## SPEC-файл

Главный файл проекта. Имя должно соответствовать имени пакета:

```
mypackage.spec  ← для пакета mypackage
```

## Исходники (Sources)

### Локальные файлы

Если `Source0` указывает URL, но файл лежит в репозитории:

```spec
Source0:        https://example.com/mypackage-%{version}.tar.gz
```

ABF сначала проверит репозиторий, потом попытается скачать по URL.

### Только URL

Если файл большой, можно не хранить его в git:

```spec
Source0:        https://github.com/user/project/archive/v%{version}.tar.gz
```

ABF скачает файл при сборке.

### Рекомендация

Для стабильности лучше хранить исходники в репозитории:
- URL может измениться
- Файл по URL может исчезнуть
- Сборка становится воспроизводимой

## Большие файлы

Git не любит большие файлы. Для архивов > 50 МБ:

1. **Загрузить отдельно** через веб-интерфейс ABF
2. **Использовать Git LFS** (если настроено)
3. **Использовать только URL** в Source

### Загрузка через веб-интерфейс

1. Перейдите в проект на ABF
2. Files → Upload file
3. Загрузите архив

Файл будет доступен для сборки, но не в git.

## Патчи

Патчи хранятся рядом со SPEC:

```
mypackage/
├── mypackage.spec
├── mypackage-1.0.0.tar.gz
├── 0001-fix-build.patch
├── 0002-rosa-defaults.patch
└── 0003-CVE-2025-1234.patch
```

Нумерация помогает поддерживать порядок.

## Дополнительные файлы

Конфиги, unit-файлы, скрипты:

```
mypackage/
├── mypackage.spec
├── mypackage-1.0.0.tar.gz
├── mypackage.service       # Source1
├── mypackage.sysconfig     # Source2
├── mypackage.logrotate     # Source3
└── README.rosa.md          # Документация (опционально)
```

В SPEC:

```spec
Source0:        mypackage-%{version}.tar.gz
Source1:        mypackage.service
Source2:        mypackage.sysconfig
Source3:        mypackage.logrotate
```

## Файл .abf.yml

Опциональный файл конфигурации сборки:

```yaml
sources:
  - mypackage-1.0.0.tar.gz: https://example.com/mypackage-1.0.0.tar.gz

# Или с хешами для проверки
sources:
  - mypackage-1.0.0.tar.gz:
      url: https://example.com/mypackage-1.0.0.tar.gz
      sha256: abc123...
```

ABF скачает указанные файлы перед сборкой.

## Ветки и теги

### Ветки для платформ

Разные ветки для разных версий ROSA (по вашему соглашению):

```
main          # Основная ветка проекта
rosa13.1      # Для ROSA Fresh 13.1 (если ведёте отдельную ветку)
```

### Теги для версий

```bash
git tag v1.0.0-1
git push origin v1.0.0-1
```

## Пример создания проекта

### Шаг 1: Клонировать или инициализировать

```bash
# Новый проект
git clone git@abf.io:username_personal/mypackage.git
cd mypackage

# Или инициализация
mkdir mypackage && cd mypackage
git init
git remote add origin git@abf.io:username_personal/mypackage.git
```

### Шаг 2: Добавить файлы

```bash
# SPEC-файл
cp ~/rpmbuild/SPECS/mypackage.spec .

# Исходники
cp ~/rpmbuild/SOURCES/mypackage-1.0.0.tar.gz .

# Патчи (если есть)
cp ~/rpmbuild/SOURCES/*.patch .

# Дополнительные файлы
cp ~/rpmbuild/SOURCES/mypackage.service .
```

### Шаг 3: Закоммитить и отправить

```bash
git add .
git commit -m "Initial packaging of mypackage 1.0.0"
git push -u origin main
# или используйте основную ветку проекта (например, master)
```

## Обновление пакета

### Новая версия upstream

```bash
cd mypackage

# Скачать новые исходники
curl -LO https://example.com/mypackage-1.1.0.tar.gz

# Удалить старые
rm mypackage-1.0.0.tar.gz

# Обновить SPEC
# - Version: 1.1.0
# - Release: 1%{?dist}
# - Source0 URL
# - %changelog

# Закоммитить
git add .
git commit -m "Update to 1.1.0"
git push
```

### Исправление сборки (bump release)

```bash
# Отредактировать SPEC
# - Release: 2%{?dist}
# - %changelog

git add mypackage.spec
git commit -m "Fix build on ROSA 13"
git push
```

## .gitignore

Что не должно попадать в репозиторий:

```gitignore
# Результаты локальной сборки
*.rpm
*.log

# Временные файлы
*~
*.swp
.*.swp

# Распакованные исходники
*/
!.gitignore
```

## Проверка перед push

```bash
# Убедиться, что SPEC корректен
rpmlint mypackage.spec

# Проверить, что исходники на месте
ls -la *.tar.* *.patch

# Посмотреть, что будет отправлено
git status
git diff --cached
```

## Типичные ошибки

### Забыли добавить исходники

```bash
# Ошибка сборки: Source0 not found
git add mypackage-1.0.0.tar.gz
git commit --amend
git push --force
```

### Слишком большой файл

```
remote: error: File is 150 MB; this exceeds the limit of 100 MB
```

Решения:
- Использовать только URL в Source
- Загрузить через веб-интерфейс
- Разбить на части

### Неправильное имя SPEC

```
# Ошибка: не найден SPEC-файл
# Убедитесь, что имя совпадает с именем пакета
mv package.spec mypackage.spec
```

## Проверьте понимание

1. Какие файлы обязательно должны быть в репозитории проекта?
2. Как ABF находит исходники — сначала локально или по URL?
3. Что делать с большими файлами (> 50 МБ)?
4. Зачем нужен файл `.abf.yml`?
5. Как организовать поддержку разных версий ROSA?

---

**Далее:** [Запуск и мониторинг сборки](build-launch.md)
