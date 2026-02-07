+++
title = "Сопровождение пакета"
weight = 4
description = "Обновления, безопасность, работа с багами, жизненный цикл мейнтейнера."
+++

После публикации работа не заканчивается. Мейнтейнер — это человек, который берёт на себя ответственность за актуальность, безопасность и работоспособность пакета.

## Обязанности мейнтейнера

| Задача | Периодичность |
|--------|---------------|
| Обновление до новых версий upstream | При выходе новых релизов |
| Исправление уязвимостей (CVE) | Как можно быстрее |
| Реакция на баг-репорты | По мере поступления |
| Пересборка при обновлении зависимостей | При необходимости |
| Адаптация к новой платформе ROSA | При выходе новой версии |

## Обновление версии upstream

### Процесс

1. **Узнать о новом релизе:**
   - Подписаться на releases в GitHub/GitLab
   - Следить за RSS-лентой проекта
   - Мониторить через `dnf repoquery --latest-limit=1`

2. **Скачать новые исходники:**
   ```bash
   cd mypackage/
   rm mypackage-1.0.0.tar.gz
   curl -LO https://github.com/upstream/mypackage/archive/v2.0.0/mypackage-2.0.0.tar.gz
   ```

3. **Обновить SPEC:**
   ```spec
   Version:        2.0.0
   Release:        1%{?dist}
   ```

4. **Проверить патчи:**
   ```bash
   # Попробовать применить каждый патч
   tar xf mypackage-2.0.0.tar.gz
   cd mypackage-2.0.0
   patch -p1 --dry-run < ../fix-rosa.patch
   ```
   - Патч применяется чисто → оставить
   - Патч вошёл в upstream → удалить из SPEC
   - Патч конфликтует → пересоздать (см. [Патчи](@/community/intermediate/06-advanced/patches-deep.md))

5. **Проверить новые зависимости:**
   ```bash
   # Прочитать CHANGELOG / NEWS upstream
   cat mypackage-2.0.0/NEWS
   # Сравнить CMakeLists.txt / configure.ac / Cargo.toml
   diff -u mypackage-1.0.0/CMakeLists.txt mypackage-2.0.0/CMakeLists.txt
   ```

6. **Обновить changelog:**
   ```spec
   %changelog
   * Wed Feb 05 2025 Your Name <your@email.com> - 2.0.0-1
   - Update to 2.0.0
   - Remove upstreamed patch fix-crash.patch
   - Add new BuildRequires: pkgconfig(libbar)
   ```

7. **Собрать, протестировать, опубликовать.**

### Удобный инструмент

```bash
# Автоматически обновить Release и changelog
rpmdev-bumpspec -n 2.0.0 -c "Update to 2.0.0" mypackage.spec
```

## Исправления безопасности (CVE)

При обнаружении уязвимости в upstream:

### Если upstream выпустил новую версию

Обновите пакет до новой версии (см. выше).

### Если upstream только выпустил патч

```bash
# Скачать патч из upstream commit
curl -LO https://github.com/upstream/project/commit/abc123.patch
mv abc123.patch backport-CVE-2025-1234.patch
```

В SPEC:

```spec
# Security fix for CVE-2025-1234
Patch10:       backport-CVE-2025-1234.patch

Release:        2%{?dist}

%changelog
* Thu Feb 06 2025 Your Name <your@email.com> - 1.0.0-2
- Fix CVE-2025-1234: buffer overflow in parser
```

**Важно:** увеличьте `Release`, а не `Version`.

### Где отслеживать CVE

- [NVD (National Vulnerability Database)](https://nvd.nist.gov/)
- GitHub Security Advisories (для проектов на GitHub)
- Рассылки upstream-проекта
- [ROSA bugzilla / форум](https://forum.rosa.ru)

## Пересборка при обновлении зависимостей

Иногда нужно пересобрать пакет, хотя upstream не менялся:

- Обновилась библиотека, от которой зависит пакет (новый SONAME)
- Новая версия компилятора
- Изменились макросы RPM

```bash
# Bump Release
rpmdev-bumpspec -c "Rebuild for new libfoo" mypackage.spec

# Собрать и опубликовать
git add mypackage.spec
git commit -m "Rebuild for new libfoo"
git push
```

## Работа с багами

### Когда пользователь сообщает о проблеме

1. **Воспроизведите** проблему на своей системе
2. **Определите**, это баг upstream или упаковки:
   - Баг воспроизводится при сборке из исходников → upstream
   - Баг только в пакете → ошибка в SPEC / патчах
3. **Если upstream** — сообщите upstream, сделайте backport патча при необходимости
4. **Если упаковка** — исправьте SPEC, увеличьте Release
5. **Документируйте** решение в changelog

### Общение с upstream

```
Subject: [Bug] Crash when processing empty input on ROSA Linux

Steps to reproduce:
1. Install mypackage 1.0.0 (RPM)
2. Run: myapp < /dev/null
3. Observe: segfault

Expected: graceful error message
Actual: SIGSEGV

Environment: ROSA Fresh 13.1, GCC 14.1, glibc 2.39
```

Структурированный баг-репорт повышает шансы на быстрое исправление.

## Адаптация к новой платформе ROSA

При выходе новой версии ROSA (например, 14.0):

1. Создайте ветку (при необходимости):
   ```bash
   git checkout -b rosa14.0
   ```

2. Проверьте сборку на новой платформе:
   - Новые версии компиляторов могут выявить предупреждения
   - Новые версии библиотек могут потребовать обновления патчей
   - Макросы RPM могли измениться

3. Исправьте проблемы и опубликуйте.

## Когда передать или отказаться от пакета

Если у вас нет времени на сопровождение:

1. **Найдите нового мейнтейнера:**
   - Напишите в [Telegram](https://t.me/rosalinux) или на [форум](https://forum.rosa.ru)
   - Передайте права на проект в ABF

2. **Если никто не взял:**
   - Пометьте пакет как «orphaned» (брошенный)
   - Через время пакет может быть удалён из community

Лучше передать пакет, чем оставить его гнить с уязвимостями.

## Хорошие практики мейнтейнера

- **Подпишитесь** на уведомления upstream (GitHub Watch → Releases)
- **Проверяйте** пакет регулярно, даже если нет жалоб
- **Обновляйте** своевременно — не копите долг из нескольких мажорных версий
- **Отвечайте** на вопросы пользователей в разумные сроки
- **Документируйте** все изменения в changelog

## Проверьте понимание

1. Что делать в первую очередь при обнаружении CVE?
2. Как проверить, что патч вошёл в новую версию upstream?
3. Когда нужна пересборка без изменения Version?
4. Как правильно сообщить о баге upstream?
5. Что делать, если вы больше не можете поддерживать пакет?

---

**Следующий раздел:** [Практикумы](@/community/practice/_index.md)
