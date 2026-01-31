+++
title = "Установка программ из репозиториев"
description = "Как устанавливать программы с помощью DNF"
weight = 2
+++

Репозитории ROSA Linux содержат тысячи программ, готовых к установке.

## Графический способ

### Центр приложений

1. Откройте «Центр приложений» (или «Discover» в KDE).
2. Найдите нужную программу.
3. Нажмите «Установить».

## Через терминал

### Поиск программы

```bash
dnf search название
```

Пример:

```bash
dnf search vlc
```

### Информация о пакете

```bash
dnf info vlc
```

### Установка пакета

```bash
sudo dnf install vlc
```

### Установка нескольких пакетов

```bash
sudo dnf install vlc gimp inkscape
```

### Удаление пакета

```bash
sudo dnf remove vlc
```

<div class="warning">
  <div class="title">Внимание</div>
  При удалении пакета DNF может предложить удалить зависимости. Внимательно проверяйте список.
</div>

## Группы пакетов

DNF позволяет устанавливать группы связанных программ.

### Список групп

```bash
dnf group list
```

### Установка группы

```bash
sudo dnf group install "Средства разработки"
```

## Полезные команды

| Команда | Описание |
| --- | --- |
| `dnf list installed` | Список установленных пакетов |
| `dnf list available` | Доступные для установки |
| `dnf provides /usr/bin/git` | Какой пакет содержит файл |
| `dnf history` | История операций DNF |
| `dnf history undo N` | Отменить операцию N |

## Репозитории

### Просмотр подключённых репозиториев

```bash
dnf repolist
```

### Временное отключение репозитория

```bash
sudo dnf install пакет --disablerepo=название
```

<div class="info">
  <div class="title">Информация</div>
  Основные репозитории ROSA: <code>rosa-main</code>, <code>rosa-contrib</code>, <code>rosa-non-free</code>.
</div>

## Следующий шаг

- [Рабочее окружение](@/docs/02-daily-use/03-desktop-environment.md)
