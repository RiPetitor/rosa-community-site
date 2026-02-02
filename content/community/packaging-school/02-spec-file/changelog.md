+++
title = "Ведение %changelog"
weight = 7
description = "Формат записей changelog, что документировать, автоматизация."
+++

Секция `%changelog` — это история изменений SPEC-файла. Она помогает понять, что и когда менялось в пакете.

## Формат записи

```spec
%changelog
* Mon Feb 03 2025 Ivan Petrov <ivan@example.com> - 2.0.0-1
- Update to version 2.0.0
- Add new feature X
- Fix crash on startup (rhbz#12345)

* Fri Jan 15 2025 Ivan Petrov <ivan@example.com> - 1.9.0-2
- Rebuild for new libfoo

* Wed Dec 20 2024 Ivan Petrov <ivan@example.com> - 1.9.0-1
- Initial package
```

### Структура записи

```
* День Месяц ДД ГГГГ Имя Фамилия <email> - Версия-Релиз
- Описание изменения 1
- Описание изменения 2
```

**Обязательные элементы:**
- Звёздочка `*` в начале
- День недели (3 буквы): Mon, Tue, Wed, Thu, Fri, Sat, Sun
- Месяц (3 буквы): Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec
- Число (1-2 цифры)
- Год (4 цифры)
- Имя и email сборщика
- Версия-релиз через дефис
- Описание изменений с дефисом

## Что документировать

### Обязательно

- **Обновление версии upstream**
  ```
  - Update to version 2.0.0
  ```

- **Добавление/удаление патчей**
  ```
  - Add patch to fix memory leak (upstream#1234)
  - Drop obsolete build-fix patch (fixed upstream)
  ```

- **Изменения в зависимостях**
  ```
  - Add BuildRequires: libfoo-devel
  - Remove obsolete Requires: old-package
  ```

- **Исправления безопасности**
  ```
  - Security fix for CVE-2025-1234
  ```

### По желанию

- Rebuild для новой версии библиотеки
- Исправления в SPEC-файле
- Изменения в подпакетах

### Ссылки на баги

```spec
- Fix crash on ARM (rhbz#12345)
- Backport fix from upstream (upstream#678)
- Security fix for CVE-2025-1234
- Resolves: rhbz#12345
```

Используйте принятые в проекте сокращения:
- `rhbz#` — Red Hat Bugzilla
- `bz#` — общий Bugzilla
- `gh#` — GitHub issue
- `upstream#` — баг в upstream

## Правила ведения

### Хронологический порядок

Новые записи — сверху:

```spec
%changelog
* Mon Feb 03 2025 ...  ← Новая
* Fri Jan 15 2025 ...
* Wed Dec 20 2024 ...  ← Старая
```

### Одна запись на сборку

Не разбивайте одно обновление на несколько записей:

```spec
# Неправильно
* Mon Feb 03 2025 Ivan <ivan@example.com> - 2.0.0-1
- Update to 2.0.0

* Mon Feb 03 2025 Ivan <ivan@example.com> - 2.0.0-1
- Fix build

# Правильно
* Mon Feb 03 2025 Ivan <ivan@example.com> - 2.0.0-1
- Update to 2.0.0
- Fix build with GCC 14
```

### Язык

Традиционно changelog ведётся на **английском**. Это позволяет:
- Читать его всем участникам
- Использовать стандартные инструменты анализа

### Краткость

```spec
# Слишком подробно
- Fixed the bug where the application would crash when the user clicked 
  the button while the network connection was unstable and the cache 
  was being rebuilt in the background

# В самый раз
- Fix crash on button click during network instability (#1234)
```

## Автоматизация

### rpmdev-bumpspec

```bash
# Увеличить релиз и добавить запись
rpmdev-bumpspec -c "Rebuild for new libfoo" package.spec

# Увеличить версию
rpmdev-bumpspec -n 2.0.0 -c "Update to 2.0.0" package.spec
```

### Настройка имени в ~/.rpmmacros

```
%packager Ivan Petrov <ivan@example.com>
```

### Шаблон для редактора

Для Vim (`~/.vim/ftplugin/spec.vim`):

```vim
iabbrev clh * <C-R>=strftime("%a %b %d %Y")<CR> Your Name <your@email.com> -
```

## Миграция из Git

Если проект ведётся в Git, можно генерировать changelog из коммитов:

```bash
# Простой вариант
git log --format="- %s" v1.0..v2.0

# С датами
git log --format="* %ad %an <%ae>%n- %s" --date=format:"%a %b %d %Y" v1.0..v2.0
```

Но обычно changelog SPEC и история Git — разные вещи. Changelog описывает изменения **в упаковке**, а не в коде.

## Просмотр changelog

```bash
# Из SPEC-файла
rpmspec -q --changelog package.spec

# Из RPM-пакета
rpm -qp --changelog package.rpm

# Из установленного пакета
rpm -q --changelog package

# Последние 10 записей
rpm -q --changelog package | head -50
```

## Типичные ошибки

### Неправильный формат даты

```spec
# Неправильно
* 03.02.2025 Ivan <ivan@example.com> - 1.0-1
* February 3, 2025 Ivan <ivan@example.com> - 1.0-1
* Mon Feb 3 2025 Ivan <ivan@example.com> - 1.0-1  # нужно 03

# Правильно
* Mon Feb 03 2025 Ivan <ivan@example.com> - 1.0-1
```

### Несоответствие версии

```spec
Version: 2.0.0
Release: 1%{?dist}

%changelog
* Mon Feb 03 2025 Ivan <ivan@example.com> - 1.9.0-1  # Ошибка!
```

Версия в changelog должна соответствовать текущей Version-Release.

### Пропущенный email

```spec
# Неправильно
* Mon Feb 03 2025 Ivan Petrov - 1.0-1

# Правильно
* Mon Feb 03 2025 Ivan Petrov <ivan@example.com> - 1.0-1
```

### Пустой changelog

```spec
%changelog
# Здесь должна быть хотя бы одна запись!
```

## Шаблон новой записи

```spec
* DDD MMM DD YYYY Your Name <your@email.com> - VERSION-RELEASE
- Description of changes
```

Пример для копирования:

```spec
* Mon Feb 03 2025 Your Name <your@email.com> - 1.0.0-1
- Initial package
```

## Проверьте понимание

1. В каком порядке располагаются записи changelog?
2. Какой формат даты используется в changelog?
3. Что обязательно документировать в changelog?
4. Как автоматически добавить запись в changelog?
5. Должна ли версия в changelog соответствовать текущей версии пакета?

---

**Следующий модуль:** [Сборочное окружение](@/community/packaging-school/03-build-environment/_index.md)
