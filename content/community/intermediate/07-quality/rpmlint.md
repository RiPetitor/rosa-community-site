+++
title = "rpmlint: все проверки с объяснениями"
weight = 1
description = "Как читать вывод rpmlint и исправлять ошибки."
+++

**rpmlint** — главный инструмент контроля качества RPM-пакетов. Он проверяет SPEC-файлы, SRPM и бинарные RPM на типичные ошибки и несоответствия стандартам.

## Запуск

```bash
# Проверить SPEC-файл
rpmlint package.spec

# Проверить бинарный RPM
rpmlint ~/rpmbuild/RPMS/x86_64/package-*.rpm

# Проверить SRPM
rpmlint ~/rpmbuild/SRPMS/package-*.src.rpm

# Подробные объяснения ошибок
rpmlint -i ~/rpmbuild/RPMS/x86_64/package-*.rpm

# Проверить все результаты сборки разом
rpmlint ~/rpmbuild/RPMS/*/*.rpm ~/rpmbuild/SRPMS/*.rpm
```

## Типы сообщений

| Префикс | Значение | Действие |
|---------|----------|----------|
| **E:** | Ошибка (error) | Обязательно исправить |
| **W:** | Предупреждение (warning) | Исправить по возможности |
| **I:** | Информация (info) | Полезная подсказка |

## Частые ошибки (E:) и их исправление

### `invalid-url`

```
E: invalid-url Source0 https://example.com/404.tar.gz
```

**Причина:** URL в `Source0` или `URL:` недоступен или некорректен.

**Решение:** проверьте актуальность ссылки. Если upstream переехал — обновите URL.

### `no-packager-tag` / `no-changelogname-tag`

```
E: no-changelogname-tag
```

**Причина:** changelog содержит запись без имени и email.

**Решение:**
```spec
%changelog
* Mon Feb 03 2025 Your Name <your@email.com> - 1.0-1
- Initial package
```

### `wrong-script-interpreter`

```
E: wrong-script-interpreter /usr/bin/myapp #!/usr/bin/env python
```

**Причина:** shebang `#!/usr/bin/env python` не рекомендуется — в пакете должен быть явный путь.

**Решение:**
```spec
%install
%make_install
# Исправить shebang
sed -i '1s|#!/usr/bin/env python3|#!/usr/bin/python3|' \
    %{buildroot}%{_bindir}/myapp
```

Или макросом (если доступен):
```spec
%py3_shebang_fix %{buildroot}%{_bindir}/myapp
```

### `non-executable-script`

```
E: non-executable-script /usr/share/myapp/helper.sh 644
```

**Причина:** файл содержит shebang (`#!/bin/bash`), но не имеет бита исполнения.

**Решение:** либо добавьте `chmod +x`, либо уберите shebang, если скрипт не запускается напрямую.

### `devel-file-in-non-devel-package`

```
E: devel-file-in-non-devel-package /usr/lib64/libfoo.so
```

**Причина:** невесионированный симлинк `.so` (для линковки) попал в основной пакет.

**Решение:** создайте подпакет `-devel` и перенесите туда `.so`, заголовки и `.pc`-файлы. Подробности в разделе [Подпакеты](@/community/intermediate/06-advanced/subpackages.md).

### `library-without-ldconfig-postin` / `library-without-ldconfig-postun`

```
E: library-without-ldconfig-postun
```

**Причина:** пакет устанавливает `.so.*`, но не обновляет кэш ldconfig.

**Решение:**
```spec
%post -p /sbin/ldconfig
%postun -p /sbin/ldconfig
```

## Частые предупреждения (W:) и их исправление

### `no-documentation`

```
W: no-documentation
```

**Решение:**
```spec
%files
%doc README.md AUTHORS
%license LICENSE
```

### `no-manual-page-for-binary`

```
W: no-manual-page-for-binary myapp
```

**Решение:**
1. Добавить man-страницу из upstream (если есть)
2. Создать минимальную man-страницу
3. Если программа простая — допустимо оставить предупреждение

### `spelling-error`

```
W: spelling-error Summary(en_US) programm -> program
```

**Решение:** исправить опечатку в `Summary` или `%description`.

### `unstripped-binary-or-object`

```
W: unstripped-binary-or-object /usr/bin/myapp
```

**Причина:** бинарник не содержит отладочных символов (debuginfo не извлечён).

**Решение:** убедитесь, что сборка происходит с корректными флагами. Обычно RPM автоматически извлекает debuginfo. Если используете нестандартную систему сборки, проверьте, что `CFLAGS`/`LDFLAGS` из макросов RPM передаются.

### `explicit-lib-dependency`

```
W: explicit-lib-dependency libfoo
```

**Причина:** `Requires: libfoo` указан явно, но RPM определяет зависимости от библиотек автоматически.

**Решение:** удалите явный `Requires: libfoo` — автоматическое определение зависимостей надёжнее.

### `files-duplicate`

```
W: files-duplicate /usr/share/myapp/file1 /usr/share/myapp/file2
```

**Причина:** два файла в пакете идентичны по содержимому.

**Решение:** если это намеренно (например, резервная копия конфига) — допустимо. Иначе уберите дубликат.

### `dangling-symlink`

```
W: dangling-symlink /usr/lib64/libfoo.so -> libfoo.so.1
```

**Причина:** симлинк указывает на файл, которого нет в этом пакете.

**Решение:** файл, на который указывает симлинк, должен быть в зависимости. Для `-devel` это обеспечивается через `Requires: %{name}%{?_isa}`.

### `hidden-file-or-dir`

```
W: hidden-file-or-dir /usr/share/myapp/.config
```

**Причина:** файлы, начинающиеся с точки, обычно не должны быть в пакете.

**Решение:** удалите или переименуйте файл в `%install`.

## Подавление ложных срабатываний

Иногда предупреждение не применимо к конкретному пакету. Создайте файл `rpmlintrc` рядом со SPEC:

```python
# mypackage.rpmlintrc

# Бинарник специально без man-страницы (внутренний хелпер)
addFilter("no-manual-page-for-binary helper")

# Имя пакета правильное, rpmlint ошибается
addFilter("spelling-error.*myterm")
```

**Правила использования фильтров:**
- Используйте **минимально** — каждый фильтр скрывает потенциальную проблему
- **Комментируйте** причину каждого фильтра
- **Предпочитайте** узкие фильтры (с указанием конкретного файла) широким
- При ревью пакета фильтры будут проверены

## Автоматизация

### Проверка в процессе сборки

```bash
# Собрать и сразу проверить
rpmbuild -ba mypackage.spec && \
    rpmlint ~/rpmbuild/RPMS/*/*.rpm ~/rpmbuild/SRPMS/*.rpm
```

### Проверка в mock

```bash
mock -r rosa-13.1-x86_64 --rebuild mypackage.src.rpm
rpmlint /var/lib/mock/rosa-13.1-x86_64/result/*.rpm
```

## Проверьте понимание

1. Чем ошибка (E:) отличается от предупреждения (W:)?
2. Как получить подробное объяснение ошибки?
3. Что делать с `devel-file-in-non-devel-package`?
4. Когда допустимо подавлять предупреждение через rpmlintrc?
5. Почему явные зависимости на библиотеки (`Requires: libfoo`) обычно не нужны?

---

**Далее:** [Тестирование пакета](@/community/intermediate/07-quality/testing.md)
