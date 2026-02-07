+++
title = "Сборка и проверка пакета"
weight = 3
+++

## Сборка

```bash
cd ~/rpmbuild/SPECS
rpmbuild -ba ripgrep.spec
```

Сборка Rust-проектов занимает заметно больше времени, чем C-проектов, — это нормально.
Cargo компилирует каждую зависимость из vendor/ по отдельности. На первой сборке
это может занять 5-15 минут в зависимости от мощности машины.

### Сборка с поддержкой PCRE2

```bash
rpmbuild -ba ripgrep.spec --with pcre2
```

### Ожидаемый вывод

В конце успешной сборки вы увидите:

```
Wrote: /home/user/rpmbuild/SRPMS/ripgrep-14.1.1-1.rosa13.1.src.rpm
Wrote: /home/user/rpmbuild/RPMS/x86_64/ripgrep-14.1.1-1.rosa13.1.x86_64.rpm
```

### Что появилось и где

```bash
# Бинарный RPM
ls -lh ~/rpmbuild/RPMS/x86_64/ripgrep-*.rpm
# ripgrep-14.1.1-1.rosa13.1.x86_64.rpm  (обычно 2-5 МБ)

# Исходный RPM (содержит SPEC + Source0 + Source1)
ls -lh ~/rpmbuild/SRPMS/ripgrep-*.src.rpm
# ripgrep-14.1.1-1.rosa13.1.src.rpm  (может быть 20-50 МБ из-за vendor)
```

Обратите внимание, что SRPM будет большим — он содержит архив с вендоренными зависимостями.
Это нормально для Rust-пакетов.

## Проверка собранного пакета

### Проверка rpmlint

```bash
rpmlint ~/rpmbuild/RPMS/x86_64/ripgrep-*.rpm
```

### Проверка бинарника

Перед установкой полезно убедиться, что бинарник собрался корректно:

```bash
# Тип файла
file ~/rpmbuild/BUILD/ripgrep-14.1.1/target/release/rg
```

Ожидаемый вывод:

```
target/release/rg: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV),
dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, ...
```

Ключевое слово — **dynamically linked**. Это значит, что бинарник использует
системные библиотеки (libc, libm и т.д.), что правильно для RPM-пакета.

```bash
# Какие библиотеки нужны бинарнику
ldd ~/rpmbuild/BUILD/ripgrep-14.1.1/target/release/rg
```

Ожидаемый вывод (примерный):

```
linux-vdso.so.1 (0x00007ffd...)
libgcc_s.so.1 => /lib64/libgcc_s.so.1 (0x00007f...)
libm.so.6 => /lib64/libm.so.6 (0x00007f...)
libc.so.6 => /lib64/libc.so.6 (0x00007f...)
/lib64/ld-linux-x86-64.so.2 (0x00007f...)
```

Если `ldd` показывает `not found` для какой-то библиотеки — пакет не будет работать
на системе без нее. Нужно добавить `Requires:` в SPEC.

Если собирали с `--with pcre2`, в списке также будет `libpcre2-8.so`.

### Список файлов в пакете

```bash
rpm -qlp ~/rpmbuild/RPMS/x86_64/ripgrep-*.rpm
```

Ожидаемый вывод:

```
/usr/bin/rg
/usr/share/bash-completion/completions/rg
/usr/share/doc/ripgrep/CHANGELOG.md
/usr/share/doc/ripgrep/FAQ.md
/usr/share/doc/ripgrep/README.md
/usr/share/fish/vendor_completions.d/rg.fish
/usr/share/licenses/ripgrep/LICENSE-MIT
/usr/share/licenses/ripgrep/UNLICENSE
/usr/share/man/man1/rg.1.gz
/usr/share/zsh/site-functions/_rg
```

### Тестовая установка

```bash
sudo dnf install ~/rpmbuild/RPMS/x86_64/ripgrep-*.rpm

# Проверяем
rg --version
# Ожидаемый вывод: ripgrep 14.1.1

# Тестируем работу
rg "root" /etc/passwd
# Ожидаемый вывод: строки с "root" из /etc/passwd

# Проверяем автодополнение (в bash)
rg --<TAB><TAB>
# Должен показать список опций

# Удаляем
sudo dnf remove ripgrep
```
