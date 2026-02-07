+++
title = "Баг-репорты и патчи upstream"
weight = 2
description = "Как сообщить о проблеме и отправить исправление upstream."
+++

Умение писать хорошие баг-репорты и отправлять патчи — ключевой навык мейнтейнера.

## Эффективный баг-репорт

### Структура

```
Title: [Краткое описание проблемы]

## Environment
- OS: ROSA Fresh 13.1 (x86_64)
- Compiler: GCC 14.1.0
- Version: myproject 1.5.0

## Steps to reproduce
1. Configure with: ./configure --enable-foo
2. Compile: make -j8
3. Run: ./myapp --process input.txt

## Expected behavior
Processing completes successfully.

## Actual behavior
Segfault at line 42 in parser.c.
Backtrace:
  #0 0x... in parse_value (parser.c:42)
  ...

## Additional information
- Problem appeared after upgrading GCC from 13.x to 14.x
- Works correctly with -O0 optimization
```

### Правила хорошего баг-репорта

- **Один баг — один репорт.** Не смешивайте несколько проблем
- **Минимальный пример.** Уберите всё лишнее, оставьте только то, что воспроизводит баг
- **Версии.** Укажите точные версии всего: ОС, компилятора, библиотек
- **Логи и backtrace.** Приложите полный вывод, а не «оно упало»
- **Поиск дубликатов.** Перед отправкой проверьте существующие issues

## Отправка патча upstream

### Через GitHub Pull Request

```bash
# 1. Форкнуть репозиторий на GitHub

# 2. Клонировать свой форк
git clone https://github.com/YOUR_USER/project.git
cd project

# 3. Создать ветку
git checkout -b fix-gcc14-build

# 4. Внести исправления
vim src/parser.c

# 5. Закоммитить
git add src/parser.c
git commit -m "Fix build failure with GCC 14

GCC 14 treats -Wimplicit-function-declaration as error by default.
Add missing #include <stdlib.h> for malloc/free.

Fixes: #1234"

# 6. Отправить
git push origin fix-gcc14-build

# 7. Создать Pull Request через веб-интерфейс GitHub
```

### Через email (git send-email)

Некоторые проекты (особенно ядро Linux, Git) принимают патчи через рассылку:

```bash
# Создать патч
git format-patch -1

# Отправить по email
git send-email --to=dev@project.org 0001-Fix-build-with-GCC-14.patch
```

### Хороший commit message

```
Краткое описание (до 72 символов)

Подробное описание проблемы и решения.
Объясните, ПОЧЕМУ изменение нужно, а не только ЧТО изменено.

Ссылки:
Fixes: #1234
Signed-off-by: Your Name <your@email.com>
```

**Правила:**
- Первая строка — императив: «Fix ...», «Add ...», «Remove ...»
- Пустая строка после заголовка
- Тело — объяснение контекста
- Ссылка на issue/баг

## Прочитайте CONTRIBUTING.md

Перед отправкой патча **всегда** проверьте, есть ли инструкции:

```bash
cat CONTRIBUTING.md
# или
cat HACKING
# или
cat docs/contributing.rst
```

Там может быть указано:
- Стиль кодирования
- Требование подписи (DCO, CLA)
- Куда отправлять патчи
- Как запускать тесты

## Что делать после отправки

- **Ждите.** Upstream может ответить через дни или недели
- **Отвечайте на комментарии.** Если попросили доработать — доработайте
- **Не обижайтесь на отказ.** Upstream может иметь другое видение. Спросите, как улучшить
- **Обновите патч**, если попросили. Используйте `git rebase -i` для правки коммитов

## Отслеживание upstream

### Подписка на релизы

На GitHub: Watch → Custom → Releases only

### RSS-лента

Многие проекты имеют RSS с релизами:

```
https://github.com/user/project/releases.atom
```

### Автоматический мониторинг

Добавьте RSS-ленты upstream-проектов в ваш RSS-ридер. При выходе нового релиза — обновите пакет.

## Проверьте понимание

1. Что должен содержать хороший баг-репорт?
2. Зачем читать CONTRIBUTING.md перед отправкой патча?
3. Как следить за новыми релизами upstream?
4. Что делать, если upstream отклонил ваш патч?

---

**Следующий модуль:** [Ревью пакетов](@/community/advanced/11-review/_index.md)
