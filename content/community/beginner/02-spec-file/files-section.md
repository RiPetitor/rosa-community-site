+++
title = "Секция %files: макросы путей и атрибуты"
weight = 5
description = "Как указывать файлы пакета, атрибуты, %doc, %license, %config."
+++

Секция `%files` определяет, какие файлы из `%{buildroot}` попадут в итоговый RPM-пакет.

## Основы

```spec
%files
%{_bindir}/myapp
%{_libdir}/libmylib.so.1*
%{_datadir}/%{name}/
%{_mandir}/man1/myapp.1*
```

**Правила:**
- Каждый файл на отдельной строке
- Пути относительно корня (`/`)
- Используйте макросы вместо жёстких путей
- Можно использовать glob-паттерны (`*`, `?`)

## Макросы путей

Всегда используйте макросы для переносимости:

| Макрос | Путь | Назначение |
|--------|------|------------|
| `%{_bindir}` | `/usr/bin` | Пользовательские программы |
| `%{_sbindir}` | `/usr/sbin` | Системные программы |
| `%{_libdir}` | `/usr/lib64` | Библиотеки |
| `%{_libexecdir}` | `/usr/libexec` | Вспомогательные программы |
| `%{_includedir}` | `/usr/include` | Заголовочные файлы |
| `%{_datadir}` | `/usr/share` | Данные |
| `%{_mandir}` | `/usr/share/man` | Man-страницы |
| `%{_infodir}` | `/usr/share/info` | Info-страницы |
| `%{_sysconfdir}` | `/etc` | Конфигурации |
| `%{_localstatedir}` | `/var` | Изменяемые данные |
| `%{_unitdir}` | `/usr/lib/systemd/system` | Systemd unit-файлы |

```bash
# Посмотреть значение макроса
rpm --eval '%{_libdir}'
```

## Специальные директивы

### %doc — документация

```spec
%files
%doc README.md AUTHORS NEWS
%doc docs/manual.html
```

Файлы копируются в `%{_docdir}/%{name}/`. Могут указываться:
- Относительно каталога сборки (без `/`)
- Или абсолютно (из buildroot)

### %license — лицензии

```spec
%files
%license LICENSE COPYING
%license LICENSES/MIT.txt
```

Аналогично `%doc`, но помечает файлы как лицензии. Важно для юридического соответствия.

### %config — конфигурационные файлы

```spec
%files
%config %{_sysconfdir}/%{name}.conf
%config(noreplace) %{_sysconfdir}/%{name}.d/*.conf
```

**Типы %config:**

| Директива | Поведение при обновлении |
|-----------|--------------------------|
| `%config` | Новая версия заменит файл. Если был изменён — сохранится как `.rpmsave` |
| `%config(noreplace)` | Изменённый файл останется. Новая версия сохранится как `.rpmnew` |
| `%config(missingok)` | Не ошибка, если файла нет |

**Рекомендации:**
- Для пользовательских конфигов: `%config(noreplace)`
- Для внутренних конфигов: `%config`
- Для опциональных: `%config(noreplace,missingok)`

### %ghost — виртуальные файлы

Файлы, которые создаются во время работы, а не при установке:

```spec
%files
%ghost %{_localstatedir}/log/%{name}.log
%ghost %{_rundir}/%{name}.pid
```

RPM будет знать об этих файлах (для удаления), но не будет их создавать.

### %dir — каталоги

```spec
%files
%dir %{_sysconfdir}/%{name}.d
%dir %{_datadir}/%{name}
```

**Когда нужен %dir:**
- Пустой каталог должен быть создан
- Каталог принадлежит именно этому пакету

**Когда НЕ нужен:**
- Каталог содержит файлы (они сами создадут его)
- Системный каталог (`/usr/bin`, `/etc`)

### %attr — атрибуты файлов

```spec
%files
%attr(755, root, root) %{_bindir}/myapp
%attr(640, root, mygroup) %{_sysconfdir}/%{name}.conf
%attr(-, myuser, mygroup) %{_localstatedir}/lib/%{name}
```

Формат: `%attr(mode, user, group)`

`-` означает «использовать значение по умолчанию».

### %defattr — атрибуты по умолчанию

```spec
%files
%defattr(644, root, root, 755)
%{_datadir}/%{name}/
```

Формат: `%defattr(file_mode, user, group, dir_mode)`

Устанавливает атрибуты по умолчанию для всех последующих файлов.

### %verify — контроль проверки

```spec
%files
%verify(not md5 size mtime) %config(noreplace) %{_sysconfdir}/%{name}.conf
```

Отключает определённые проверки при `rpm -V`.

## Glob-паттерны

```spec
%files
# Все файлы с расширением .so.1*
%{_libdir}/libfoo.so.1*

# Все файлы в каталоге
%{_datadir}/%{name}/*

# Рекурсивно весь каталог
%{_datadir}/%{name}/

# Все man-страницы (включая сжатые)
%{_mandir}/man1/myapp.1*
```

**Важно:** Слэш в конце `%{_datadir}/%{name}/` означает «весь каталог рекурсивно».

## Локализация

```spec
%find_lang %{name}

%files -f %{name}.lang
%{_bindir}/myapp
```

`%find_lang` создаёт файл со списком переводов, `-f` подключает его.

## Подпакеты

```spec
%package libs
Summary:        Libraries for %{name}

%package devel
Summary:        Development files for %{name}
Requires:       %{name}-libs = %{version}-%{release}

%files
%{_bindir}/myapp
%doc README.md
%license LICENSE

%files libs
%{_libdir}/libmylib.so.1*

%files devel
%{_includedir}/mylib/
%{_libdir}/libmylib.so
%{_libdir}/pkgconfig/mylib.pc
```

## Исключение файлов

```spec
%files
%{_datadir}/%{name}/
%exclude %{_datadir}/%{name}/test/
```

Исключённые файлы не попадут в пакет и должны быть удалены в `%install` или перечислены в `%exclude`.

## Автоматические списки

### %{_docdir}

```spec
%files
%doc README NEWS
# Автоматически создаст %{_docdir}/%{name}/README и т.д.
```

### %{python3_sitelib}

```spec
%files -n python3-%{name}
%{python3_sitelib}/%{name}/
%{python3_sitelib}/%{name}-%{version}.dist-info/
```

## Типичные ошибки

### Installed (but unpackaged) file(s)

```
RPM build errors:
   Installed (but unpackaged) file(s) found:
   /usr/lib64/libfoo.la
```

**Решения:**
1. Добавить файл в `%files`
2. Удалить в `%install`: `rm -f %{buildroot}%{_libdir}/*.la`
3. Использовать `%exclude` (не рекомендуется)

### File not found

```
File not found: /builddir/build/BUILDROOT/.../usr/bin/myapp
```

**Причины:**
- Опечатка в имени
- Файл не создан в `%install`
- Неправильный макрос пути

### Conflicting files

```
file /usr/bin/myapp conflicts between attempted installs
```

Два пакета устанавливают один файл. Решение:
- Вынести общий файл в отдельный пакет
- Использовать `Conflicts:`
- Использовать альтернативы (`update-alternatives`)

### Жёсткие пути вместо макросов

```spec
# Неправильно
%files
/usr/lib64/libfoo.so.1*

# Правильно
%files
%{_libdir}/libfoo.so.1*
```

На 32-битной системе `/usr/lib64` не существует.

## Проверка списка файлов

```bash
# Посмотреть, что попало в buildroot
ls -laR ~/rpmbuild/BUILDROOT/

# Посмотреть файлы в собранном пакете
rpm -qlp package.rpm

# Посмотреть с атрибутами
rpm -qlpv package.rpm
```

## Проверьте понимание

1. Зачем использовать макросы путей вместо жёстких путей?
2. Чем отличается `%config` от `%config(noreplace)`?
3. Когда нужна директива `%dir`?
4. Как включить все файлы каталога рекурсивно?
5. Что делать с ошибкой «Installed (but unpackaged) file(s)»?

---

**Далее:** [Макросы: стандартные, системные, свои](@/community/beginner/02-spec-file/macros.md)
