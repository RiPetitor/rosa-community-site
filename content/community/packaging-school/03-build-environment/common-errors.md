+++
title = "Типичные ошибки и их решение"
weight = 5
description = "Разбор частых проблем при сборке RPM с объяснениями и решениями."
+++

При первых сборках вы обязательно столкнётесь с ошибками. Здесь собраны наиболее частые проблемы и способы их решения.

## Ошибки на этапе %prep

### «Source0 not found»

```
error: File /home/user/rpmbuild/SOURCES/myapp-1.0.tar.gz: No such file or directory
```

**Причина:** Архив исходников не скачан.

**Решение:**
```bash
# Скачать через spectool
spectool -g -C ~/rpmbuild/SOURCES/ myapp.spec

# Или вручную
cd ~/rpmbuild/SOURCES/
curl -LO https://example.com/myapp-1.0.tar.gz
```

### «Patch does not apply»

```
Patch #0 (myapp-fix.patch):
+ /usr/bin/patch -p1 -s
patch: **** Can't find file to patch at input line 5
```

**Причины:**
1. Неправильный уровень `-p`
2. Патч для другой версии
3. Изменилась структура каталогов

**Диагностика:**
```bash
# Посмотреть, что внутри патча
head -20 ~/rpmbuild/SOURCES/myapp-fix.patch
# --- a/src/main.c
# +++ b/src/main.c

# Попробовать разные уровни -p
cd ~/rpmbuild/BUILD/myapp-1.0
patch -p1 --dry-run < ~/rpmbuild/SOURCES/myapp-fix.patch
patch -p0 --dry-run < ~/rpmbuild/SOURCES/myapp-fix.patch
```

**Решение:**
```spec
# Указать правильный уровень
%prep
%autosetup -p1
# или
%setup -q
%patch0 -p0
```

### «Archive extracts to unexpected directory»

```
error: Bad source: /home/user/rpmbuild/SOURCES/myapp-1.0.tar.gz: 
Expected myapp-1.0, got myapp
```

**Причина:** Архив распаковывается в каталог с другим именем.

**Решение:**
```spec
%prep
%autosetup -n myapp
# или
%setup -q -n myapp
```

## Ошибки на этапе %build

### «Command not found: configure»

```
./configure: No such file or directory
```

**Причина:** Проект не использует Autotools, или нужно сгенерировать configure.

**Решение:**
```spec
# Если есть autogen.sh
%prep
%autosetup
./autogen.sh

# Или если проект использует CMake
%build
%cmake
%cmake_build
```

### «Package requirements not met»

```
checking for LIBFOO... no
configure: error: Package requirements (libfoo >= 2.0) were not met
```

**Причина:** Не установлена библиотека для сборки.

**Решение:**
```bash
# Найти пакет
dnf provides 'pkgconfig(libfoo)'
# libfoo-devel-2.1-1.x86_64 : Development files for libfoo

# Добавить в SPEC
BuildRequires: pkgconfig(libfoo) >= 2.0
# или
BuildRequires: libfoo-devel >= 2.0
```

### «Undefined reference»

```
/usr/bin/ld: main.o: undefined reference to `foo_init'
collect2: error: ld returned 1 exit status
```

**Причина:** Не линкуется библиотека.

**Решение:**
```spec
%build
%configure LDFLAGS="-lfoo"
# или проверить, что в проекте правильный порядок линковки
```

### «fatal error: header.h: No such file or directory»

```
main.c:5:10: fatal error: foo/bar.h: No such file or directory
    5 | #include <foo/bar.h>
```

**Причина:** Не установлены заголовочные файлы.

**Решение:**
```bash
# Найти пакет с заголовком
dnf provides '*/foo/bar.h'

# Добавить в SPEC
BuildRequires: libfoo-devel
```

## Ошибки на этапе %install

### «Installed (but unpackaged) file(s) found»

```
RPM build errors:
    Installed (but unpackaged) file(s) found:
    /usr/lib64/libfoo.la
    /usr/share/doc/myapp/README
```

**Причина:** Файлы установлены в buildroot, но не перечислены в `%files`.

**Решения:**

1. **Добавить файлы в %files:**
   ```spec
   %files
   %{_libdir}/libfoo.la
   %doc README
   ```

2. **Удалить ненужные файлы:**
   ```spec
   %install
   %make_install
   rm -f %{buildroot}%{_libdir}/*.la
   ```

3. **Использовать %exclude (не рекомендуется):**
   ```spec
   %files
   %exclude %{_libdir}/*.la
   ```

### «File not found»

```
File not found: /home/user/rpmbuild/BUILDROOT/.../usr/bin/myapp
```

**Причины:**
1. Опечатка в `%files`
2. Файл не создан при `%install`
3. Неправильный макрос пути

**Диагностика:**
```bash
# Посмотреть, что реально есть в buildroot
ls -laR ~/rpmbuild/BUILDROOT/

# Сравнить с %files в SPEC
```

### «DESTDIR not honored»

Некоторые проекты игнорируют DESTDIR:

```bash
make install DESTDIR=%{buildroot}
# Файлы всё равно идут в /usr/bin вместо buildroot
```

**Решение:**
```spec
%install
# Ручная установка
install -d %{buildroot}%{_bindir}
install -m 755 myapp %{buildroot}%{_bindir}/

# Или исправить Makefile патчем
```

## Ошибки в %files

### «File listed twice»

```
File listed twice: /usr/share/myapp/data/file.txt
```

**Причина:** Файл указан и отдельно, и через wildcard.

**Решение:**
```spec
# Неправильно
%files
%{_datadir}/myapp/
%{_datadir}/myapp/data/file.txt

# Правильно — или каталог, или отдельные файлы
%files
%{_datadir}/myapp/
```

### «Conflicting files»

```
file /usr/bin/common from install of pkg-A conflicts with 
file from package pkg-B
```

**Причина:** Два пакета устанавливают один файл.

**Решения:**
1. Вынести общий файл в отдельный пакет
2. Использовать `Conflicts:`
3. Использовать `update-alternatives`

### «Directory not owned by any package»

```
W: directory-not-owned /usr/share/myapp
```

**Решение:**
```spec
%files
%dir %{_datadir}/myapp
%{_datadir}/myapp/*
```

## Ошибки rpmlint

### «no-documentation»

```
W: no-documentation
```

**Решение:**
```spec
%files
%doc README.md AUTHORS
%license LICENSE
```

### «no-manual-page-for-binary»

```
W: no-manual-page-for-binary myapp
```

**Решения:**
1. Добавить man-страницу из upstream (если есть)
2. Создать минимальную man-страницу
3. Игнорировать (если программа простая)

### «spelling-error»

```
W: spelling-error Summary(en_US) programm -> program
```

**Решение:** Исправить опечатку или добавить исключение в `/etc/rpmlint/config`.

### «wrong-script-interpreter»

```
E: wrong-script-interpreter /usr/bin/myapp #!/usr/bin/env python
```

**Причина:** Shebang `#!/usr/bin/env python` нестандартен.

**Решение:**
```spec
%install
%make_install
# Исправить shebang
sed -i '1s|#!/usr/bin/env python|#!/usr/bin/python3|' \
    %{buildroot}%{_bindir}/myapp
```

Или использовать макрос:
```spec
%py3_shebang_fix %{buildroot}%{_bindir}/myapp
```

### «devel-file-in-non-devel-package»

```
W: devel-file-in-non-devel-package /usr/lib64/libfoo.so
```

**Причина:** Симлинк `.so` без версии попал в основной пакет.

**Решение:**
```spec
%package devel
Summary: Development files for %{name}
Requires: %{name}-libs = %{version}-%{release}

%files
%{_bindir}/myapp

%files libs
%{_libdir}/libfoo.so.1*

%files devel
%{_libdir}/libfoo.so
%{_includedir}/foo.h
%{_libdir}/pkgconfig/foo.pc
```

## Системные ошибки

### «Permission denied»

```
error: can't create %{buildroot}: Permission denied
```

**Причина:** Проблемы с правами или сборка от root.

**Решение:**
```bash
# Проверить владельца
ls -la ~/rpmbuild

# Исправить
sudo chown -R $USER:$USER ~/rpmbuild
```

### «No space left on device»

```
error: No space left on device
```

**Решение:**
```bash
# Проверить место
df -h

# Очистить старые сборки
rm -rf ~/rpmbuild/BUILD/*
rm -rf ~/rpmbuild/BUILDROOT/*
```

### «Out of memory»

При сборке больших проектов:

```spec
%build
# Ограничить параллельность
make -j2
```

Или в `~/.rpmmacros`:
```
%_smp_mflags -j2
```

## Быстрая диагностика

```bash
# Пошаговая сборка для отладки
rpmbuild -bp package.spec   # Только %prep
rpmbuild -bc package.spec   # До %build включительно
rpmbuild -bi package.spec   # До %install включительно

# Сохранить buildroot
rpmbuild -bi --noclean package.spec

# Посмотреть, что создано
ls -laR ~/rpmbuild/BUILD/
ls -laR ~/rpmbuild/BUILDROOT/
```

## Проверьте понимание

1. Как скачать исходники, указанные в SPEC?
2. Что делать, если патч не применяется?
3. Как найти пакет, содержащий нужный заголовочный файл?
4. Что означает ошибка «Installed (but unpackaged)»?
5. Как выполнить только этап %prep для отладки?

---

**Следующий модуль:** [Системы сборки](@/community/packaging-school/04-build-systems/_index.md)
