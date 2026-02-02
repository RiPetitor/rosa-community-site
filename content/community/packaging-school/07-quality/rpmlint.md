+++
title = "rpmlint: все проверки с объяснениями"
weight = 1
description = "Как читать вывод rpmlint и исправлять ошибки."
+++

**rpmlint** проверяет качество SPEC-файлов и готовых RPM-пакетов.

## Запуск

```bash
rpmlint package.spec
rpmlint ~/rpmbuild/RPMS/x86_64/package-*.rpm
rpmlint ~/rpmbuild/SRPMS/package-*.src.rpm
rpmlint -i ~/rpmbuild/RPMS/x86_64/package-*.rpm
```
Для `noarch` пакетов путь будет `~/rpmbuild/RPMS/noarch/`.

## Типы сообщений

- **E:** ошибки — необходимо исправить
- **W:** предупреждения — исправить по возможности
- **I:** информация — полезные подсказки

## Частые сообщения

| Сообщение | Что значит | Что делать |
|-----------|------------|-----------|
| `invalid-url` | Некорректная ссылка в URL | Исправить URL |
| `no-changelogname` | Плохой формат записи в changelog | Использовать `Имя <email>` |
| `spelling-error` | Орфография в Summary/Description | Исправить |
| `no-documentation` | Не указан `%doc` | Добавить документацию |
| `unstripped-binary-or-object` | Не удалены символы отладки | Убедиться, что сборка корректна |
| `script-without-shebang` | Скрипт без shebang | Добавить `#!/usr/bin/env ...` |

## Ложные срабатывания и исключения

Если предупреждение корректно для конкретного пакета, его можно аккуратно подавить через `rpmlintrc`.
Предпочтительнее хранить файл рядом со SPEC (чтобы он был виден при review):

```
addFilter("spelling-error")
# addFilter("unstripped-binary-or-object")
```

Используйте минимальное количество фильтров и комментируйте причину в changelog или в самом `rpmlintrc`.

## Практика

Всегда запускайте rpmlint **до** публикации. Большинство ошибок — это баги в SPEC, а не в коде.
