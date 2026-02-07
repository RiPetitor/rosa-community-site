+++
title = "Разбор ошибок сборки"
weight = 5
description = "Типичные ошибки на ABF и способы их исправления."
+++

Сборка на ABF часто выявляет ошибки, которые не проявлялись локально. Здесь разберём типичные проблемы.

## Принципы отладки

1. **Скачайте и прочитайте лог** — ошибка обычно в конце
2. **Ищите строку «error:»** — rpmbuild явно указывает проблему
3. **Сравните с локальной сборкой** — что отличается?
4. **Проверьте BuildRequires** — на ABF только то, что указано

## Ошибки на этапе подготовки

### «Source0 not found»

```
error: File /home/omv/rpmbuild/SOURCES/mypackage-1.0.0.tar.gz: No such file or directory
```

**Причины:**
1. Файл не добавлен в git-репозиторий
2. Имя файла не совпадает с Source0 в SPEC
3. URL недоступен

**Решение:**
```bash
# Проверить, что файл есть
ls -la mypackage-1.0.0.tar.gz

# Добавить в git
git add mypackage-1.0.0.tar.gz
git commit -m "Add source tarball"
git push
```

### «Patch does not apply»

```
error: patch mypackage-fix.patch does not apply
```

**Причины:**
1. Патч для другой версии исходников
2. Патч уже применён в новой версии
3. Неправильный уровень `-p`

**Решение:**
```bash
# Скачать исходники и проверить патч
tar xf mypackage-1.0.0.tar.gz
cd mypackage-1.0.0
patch -p1 --dry-run < ../mypackage-fix.patch
```

Если патч устарел — удалите его или создайте новый.

## Ошибки зависимостей

### «No package X available»

```
No match for argument: libfoo-devel
Error: Unable to find a match: libfoo-devel
```

**Причины:**
1. Пакет называется по-другому в ROSA
2. Пакет не существует в репозитории
3. Опечатка в имени

**Решение:**
```bash
# Поиск правильного имени
dnf search libfoo
dnf provides '*/libfoo.h'
dnf provides 'pkgconfig(libfoo)'
```

### «Nothing provides X needed by Y»

```
Error: Package: mypackage-1.0.0-1 requires libfoo.so.1()(64bit)
  No available provider: libfoo.so.1()(64bit)
```

**Причины:**
1. Библиотека не в репозитории
2. Версия библиотеки отличается

**Решение:**
- Добавить пакет с библиотекой в репозиторий
- Или собрать с bundled-версией

## Ошибки компиляции

### «error: 'function' was not declared»

```
main.c:10:5: error: 'new_function' was not declared in this scope
```

**Причины:**
1. Новая версия компилятора строже
2. Не подключён заголовочный файл
3. API библиотеки изменился

**Решение:**
Создать патч:
```bash
# В исходниках
echo '#include <missing_header.h>' >> src/main.c
diff -u src/main.c.orig src/main.c > fix-include.patch
```

### «undefined reference to»

```
/usr/bin/ld: main.o: undefined reference to 'foo_init'
```

**Причины:**
1. Не линкуется библиотека
2. Неправильный порядок линковки

**Решение:**
```spec
%build
%configure LDFLAGS="-lfoo"
```

Или добавить BuildRequires с нужной библиотекой.

## Ошибки установки

### «Installed (but unpackaged) file(s)»

```
RPM build errors:
    Installed (but unpackaged) file(s) found:
    /usr/lib64/libfoo.la
    /usr/share/doc/mypackage/CHANGELOG
```

**Причина:** Файлы созданы в buildroot, но не указаны в `%files`.

**Решение:**
```spec
# Вариант 1: Добавить файлы
%files
%{_libdir}/libfoo.la
%doc CHANGELOG

# Вариант 2: Удалить ненужные
%install
%make_install
rm -f %{buildroot}%{_libdir}/*.la
```

### «File not found»

```
File not found: /buildroot/.../usr/bin/myapp
```

**Причины:**
1. Опечатка в `%files`
2. Файл не создан при установке
3. Неправильный макрос пути

**Решение:**
```bash
# Посмотреть, что реально создано
# (запустить локально с --noclean)
ls -laR ~/rpmbuild/BUILDROOT/
```

## Ошибки тестов

### «%check failed»

```
FAILED tests/test_main.py::test_function
error: Bad exit status from /var/tmp/rpm-tmp.xxxxx (%check)
```

**Причины:**
1. Тесты требуют сеть (недоступна на ABF)
2. Тесты требуют специфичное окружение
3. Баг в коде

**Решение:**
```spec
%check
# Пропустить сетевые тесты
%pytest -k "not network"

# Или временно отключить (с комментарием!)
# Tests disabled: require network access
# %%pytest
```

## Ошибки окружения

### «Cannot allocate memory»

Сборка требует много RAM.

**Решение:**
```spec
%build
# Ограничить параллельность
make -j2
```

### «No space left on device»

Проект создаёт слишком много временных файлов.

**Решение:**
- Упростить сборку
- Отключить генерацию документации
- Обратиться к администраторам ABF

## Отличия ABF от локальной сборки

| Аспект | Локально | ABF |
|--------|----------|-----|
| Установленные пакеты | Много | Только BuildRequires |
| Сеть | Обычно есть | Обычно нет (или сильно ограничена) |
| Окружение | Может быть «грязным» | Чистый chroot |
| Архитектура | Одна | Несколько |
| Время | Не ограничено | Таймаут |

## Чеклист перед отправкой на ABF

1. ✅ Сборка проходит локально
2. ✅ `rpmlint` не показывает ошибок
3. ✅ Все файлы добавлены в git
4. ✅ Все BuildRequires указаны явно
5. ✅ Тесты не требуют сеть

## Отладка с mock

Mock эмулирует окружение ABF (имя профиля смотрите в `/etc/mock`):

```bash
# Установить mock
sudo dnf install mock
sudo usermod -aG mock $USER

# Собрать в чистом окружении
mock -r rosa-13.1-x86_64 --rebuild mypackage.src.rpm

# Посмотреть лог
less /var/lib/mock/rosa-13.1-x86_64/result/build.log
```

## Получение помощи

Если не можете разобраться:

1. **Прочитайте лог** ещё раз
2. **Поищите ошибку** в интернете
3. **Спросите в Telegram** [t.me/rosalinux](https://t.me/rosalinux)
4. **Напишите на форум** с логом и описанием

## Проверьте понимание

1. Где искать причину ошибки в логе?
2. Почему пакет собирается локально, но падает на ABF?
3. Как исправить ошибку «No package X available»?
4. Что делать с «Installed (but unpackaged)»?
5. Как проверить сборку в чистом окружении без ABF?

---

**Далее:** [Публикация в community](@/community/intermediate/05-abf-workflow/publishing.md)
