+++
title = "Что такое buildroot"
weight = 4
description = "Временный корень файловой системы, изоляция сборки, DESTDIR."
+++

**Buildroot** — ключевая концепция сборки пакетов. Это временный каталог, который притворяется корнем файловой системы.

## Зачем нужен buildroot

Без buildroot команда `make install` установила бы файлы прямо в систему:

```bash
# Опасно! Файлы попадут в реальный /usr/bin
make install
```

С buildroot файлы устанавливаются во временный каталог:

```bash
# Безопасно — файлы в ~/rpmbuild/BUILDROOT/.../usr/bin
make install DESTDIR=%{buildroot}
```

**Преимущества:**
- Сборка не требует прав root
- Система остаётся чистой
- Можно точно контролировать, что попадёт в пакет
- Легко откатить и пересобрать

## Как это работает

### Структура buildroot

```
~/rpmbuild/BUILDROOT/
└── hello-2.12.1-1.rosa13.1.x86_64/
    ├── etc/
    │   └── hello.conf
    └── usr/
        ├── bin/
        │   └── hello
        ├── lib64/
        │   └── libhello.so.1
        └── share/
            ├── doc/
            │   └── hello/
            │       └── README
            └── man/
                └── man1/
                    └── hello.1.gz
```

Это зеркало реальной файловой системы, но внутри временного каталога.

### Макрос %{buildroot}

В SPEC-файле:

```spec
%install
install -d %{buildroot}%{_bindir}
install -m 755 hello %{buildroot}%{_bindir}/
```

`%{buildroot}` раскрывается в полный путь:
```
/home/user/rpmbuild/BUILDROOT/hello-2.12.1-1.rosa13.1.x86_64
```

### DESTDIR

Большинство систем сборки поддерживают `DESTDIR`:

```bash
# Autotools
make install DESTDIR=/path/to/buildroot

# CMake
cmake --install . --prefix /usr DESTDIR=/path/to/buildroot

# Meson
meson install -C build --destdir /path/to/buildroot
```

Макрос `%make_install` автоматически передаёт `DESTDIR=%{buildroot}`.

## Процесс сборки

```
1. %prep
   Распаковка в BUILD/hello-2.12.1/

2. %build
   Компиляция в BUILD/hello-2.12.1/
   Создаётся бинарник BUILD/hello-2.12.1/hello

3. %install
   Создаётся BUILDROOT/hello-.../
   Файлы копируются:
   BUILD/.../hello → BUILDROOT/.../usr/bin/hello

4. %files
   RPM берёт файлы из BUILDROOT
   Упаковывает в hello-2.12.1-1.x86_64.rpm

5. Очистка
   BUILD/ и BUILDROOT/ удаляются (если не --noclean)
```

## Примеры установки в buildroot

### Стандартные макросы

```spec
%install
# Autotools
%make_install

# CMake
%cmake_install

# Meson
%meson_install

# Python
%py3_install
```

### Ручная установка

```spec
%install
# Создать каталоги
install -d %{buildroot}%{_bindir}
install -d %{buildroot}%{_sysconfdir}/%{name}
install -d %{buildroot}%{_datadir}/%{name}

# Установить бинарник
install -m 755 myapp %{buildroot}%{_bindir}/

# Установить конфиг
install -m 644 myapp.conf %{buildroot}%{_sysconfdir}/%{name}/

# Установить данные
cp -a data/* %{buildroot}%{_datadir}/%{name}/

# Установить man-страницу
install -Dm 644 myapp.1 %{buildroot}%{_mandir}/man1/myapp.1
```

### Команда install

```bash
install [опции] источник назначение
```

| Опция | Описание |
|-------|----------|
| `-d` | Создать каталог |
| `-m MODE` | Установить права (755, 644, ...) |
| `-D` | Создать родительские каталоги |
| `-p` | Сохранить timestamps |

### Символические ссылки

```spec
%install
%make_install

# Создать симлинк
ln -s libfoo.so.1.0.0 %{buildroot}%{_libdir}/libfoo.so.1
ln -s libfoo.so.1 %{buildroot}%{_libdir}/libfoo.so
```

## Исследование buildroot

После сборки (с `--noclean`) можно изучить содержимое:

```bash
# Сборка без очистки
rpmbuild -bi --noclean hello.spec

# Посмотреть содержимое
ls -laR ~/rpmbuild/BUILDROOT/

# Сравнить с ожидаемым списком файлов
rpm -qlp ~/rpmbuild/RPMS/x86_64/hello-*.rpm
```

## Типичные ошибки

### Установка в реальную систему

```spec
# НЕПРАВИЛЬНО — установит в /usr/bin!
%install
make install

# ПРАВИЛЬНО
%install
make install DESTDIR=%{buildroot}
# или
%make_install
```

### Забыли создать каталог

```
install: cannot create regular file '/...BUILDROOT/.../etc/myapp/config': 
No such file or directory
```

Решение:
```spec
%install
install -d %{buildroot}%{_sysconfdir}/myapp
install -m 644 config %{buildroot}%{_sysconfdir}/myapp/
```

### Неправильные права

```spec
# Неправильно — исполняемый конфиг
install -m 755 app.conf %{buildroot}%{_sysconfdir}/

# Правильно
install -m 644 app.conf %{buildroot}%{_sysconfdir}/
```

### Абсолютные симлинки

```spec
# Неправильно — абсолютный путь, включающий buildroot
ln -s %{buildroot}%{_libdir}/libfoo.so.1 %{buildroot}%{_libdir}/libfoo.so

# Правильно — относительный или абсолютный без buildroot
ln -s libfoo.so.1 %{buildroot}%{_libdir}/libfoo.so
# или
ln -s %{_libdir}/libfoo.so.1 %{buildroot}%{_libdir}/libfoo.so
```

## Очистка buildroot

По умолчанию RPM очищает buildroot. Для отладки:

```bash
# Сохранить buildroot
rpmbuild -bi --noclean hello.spec

# Или в ~/.rpmmacros
%_auto_clean 0
```

Ручная очистка:
```bash
rm -rf ~/rpmbuild/BUILDROOT/*
```

## Проверьте понимание

1. Что произойдёт, если выполнить `make install` без `DESTDIR`?
2. Как раскрывается макрос `%{buildroot}`?
3. Какой командой создать каталог в buildroot?
4. Как сохранить buildroot после сборки для отладки?
5. Почему нельзя создавать абсолютные симлинки с путём buildroot?

---

**Далее:** [Типичные ошибки и их решение](common-errors.md)
