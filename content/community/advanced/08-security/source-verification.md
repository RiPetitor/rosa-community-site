+++
title = "Проверка источников и подписей"
weight = 1
description = "GPG-подписи, контрольные суммы, защита от подмены исходников."
+++

Первый шаг к безопасному пакету — убедиться, что исходники настоящие и не были подменены.

## Зачем это нужно

Атаки на цепочку поставок (supply chain attacks) — реальная угроза. Примеры:
- Взлом аккаунта разработчика и подмена релиза
- Компрометация сервера с архивами
- Man-in-the-middle при скачивании по HTTP

## Проверка GPG-подписей

Многие проекты подписывают релизы GPG-ключом.

### Шаг 1: Найти подпись

```bash
# Обычно рядом с архивом лежит .asc или .sig
curl -LO https://ftp.gnu.org/gnu/hello/hello-2.12.1.tar.gz
curl -LO https://ftp.gnu.org/gnu/hello/hello-2.12.1.tar.gz.sig
```

### Шаг 2: Импортировать ключ разработчика

```bash
# Найти ID ключа
gpg --verify hello-2.12.1.tar.gz.sig hello-2.12.1.tar.gz
# gpg: Signature made ...
# gpg: using RSA key <KEY_ID>

# Импортировать ключ
gpg --keyserver keys.openpgp.org --recv-keys <KEY_ID>
```

### Шаг 3: Проверить подпись

```bash
gpg --verify hello-2.12.1.tar.gz.sig hello-2.12.1.tar.gz
# gpg: Good signature from "..."
```

Если `Good signature` — файл подлинный.

## Проверка контрольных сумм

Если GPG-подпись недоступна, используйте хеши:

```bash
# SHA256 (предпочтительно)
sha256sum hello-2.12.1.tar.gz
# Сравните с хешем на странице релиза upstream

# SHA512
sha512sum hello-2.12.1.tar.gz
```

### В .abf.yml

```yaml
sources:
  - hello-2.12.1.tar.gz:
      url: https://ftp.gnu.org/gnu/hello/hello-2.12.1.tar.gz
      sha256: abc123def456...
```

ABF проверит хеш при скачивании.

## HTTPS vs HTTP

- **Всегда используйте HTTPS** в `Source0`, если доступен
- HTTP допустим только если HTTPS недоступен (некоторые старые зеркала)
- Проверяйте подписи/хеши особенно тщательно при HTTP

```spec
# Правильно
Source0:        https://ftp.gnu.org/gnu/hello/hello-%{version}.tar.gz

# Допустимо только при проверке подписей
Source0:        http://legacy-mirror.example.com/hello-%{version}.tar.gz
```

## Проверка GitHub/GitLab-релизов

GitHub автоматически создаёт архивы, но они **не подписаны** и могут измениться (GitHub может пересоздать архив с другим хешем).

Рекомендации:
1. Используйте архивы, загруженные автором релиза (assets), а не автосгенерированные
2. Если автор публикует подписи — проверяйте
3. Фиксируйте хеш в `.abf.yml`

```spec
# Автосгенерированный архив — хеш может измениться
Source0:        https://github.com/user/project/archive/v%{version}.tar.gz

# Архив из assets — стабильнее
Source0:        https://github.com/user/project/releases/download/v%{version}/project-%{version}.tar.gz
```

## Практические рекомендации

- **Проверяйте подпись** при каждом обновлении версии, не только первый раз
- **Сохраняйте** исходники в git-репозитории ABF — это фиксирует конкретную версию
- **Не доверяйте** слепо URL — сайт может быть взломан
- **Сравнивайте** содержимое нового архива со старым при обновлении

```bash
# Быстрое сравнение структуры
diff <(tar tzf old-1.0.tar.gz | sort) <(tar tzf new-1.1.tar.gz | sort)
```

## Проверьте понимание

1. Зачем проверять GPG-подпись исходников?
2. Чем опасны автосгенерированные архивы GitHub?
3. Когда допустим HTTP вместо HTTPS для Source0?
4. Как зафиксировать хеш исходников в ABF?

---

**Далее:** [Hardening: флаги безопасности](@/community/advanced/08-security/hardening.md)
