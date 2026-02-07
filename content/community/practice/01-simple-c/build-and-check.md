+++
title = "Сборка, проверка и установка пакета"
weight = 3
+++

## Сборка пакета

```bash
cd ~/rpmbuild/SPECS
rpmbuild -ba hello.spec
```

Флаг `-ba` означает **build all** — собрать и бинарный RPM, и исходный (source) RPM.
Другие полезные флаги:
- `-bs` — собрать **только** SRPM (без компиляции)
- `-bb` — собрать **только** бинарный RPM (без SRPM)
- `-bp` — выполнить **только** `%prep` (распаковка — полезно для отладки)
- `-bc` — выполнить до `%build` (компиляция без установки)

### Ожидаемый вывод

Если все прошло успешно, в конце вы увидите:

```
Executing(%prep): /bin/sh -e /var/tmp/rpm-tmp.XXXXXX
...
Executing(%build): /bin/sh -e /var/tmp/rpm-tmp.XXXXXX
...
Executing(%install): /bin/sh -e /var/tmp/rpm-tmp.XXXXXX
...
Executing(%check): /bin/sh -e /var/tmp/rpm-tmp.XXXXXX
...
Processing files: hello-2.12.1-1.rosa13.1.x86_64
...
Wrote: /home/user/rpmbuild/SRPMS/hello-2.12.1-1.rosa13.1.src.rpm
Wrote: /home/user/rpmbuild/RPMS/x86_64/hello-2.12.1-1.rosa13.1.x86_64.rpm
```

Суффикс `.rosa13.1` зависит от `%{?dist}` и может отличаться на другой платформе.

### Что появилось и где

После успешной сборки у вас появятся два файла:

```bash
# Бинарный RPM — готовый пакет для установки
ls ~/rpmbuild/RPMS/x86_64/
# hello-2.12.1-1.rosa13.1.x86_64.rpm

# Исходный RPM — содержит SPEC-файл + исходные архивы
ls ~/rpmbuild/SRPMS/
# hello-2.12.1-1.rosa13.1.src.rpm
```

**Бинарный RPM** (`RPMS/x86_64/`) — это то, что устанавливает пользователь. Внутри — скомпилированная
программа, man-страницы, переводы и т.д.

**Исходный RPM** (`SRPMS/`) — это «рецепт + ингредиенты». Внутри — SPEC-файл и исходный архив.
Из SRPM можно воспроизвести сборку на любой машине. Именно SRPM загружается в ABF.

Каталог `x86_64` указывает на архитектуру процессора. Если бы пакет был `BuildArch: noarch`
(например, скрипты на Python), файл попал бы в `RPMS/noarch/`.

## Исследуем готовый RPM

Перед установкой полезно заглянуть «внутрь» пакета и убедиться, что все правильно.

### Список файлов в пакете

```bash
rpm -qlp ~/rpmbuild/RPMS/x86_64/hello-2.12.1-1.rosa13.1.x86_64.rpm
```

Ожидаемый вывод (сокращенно):

```
/usr/bin/hello
/usr/share/doc/hello/AUTHORS
/usr/share/doc/hello/ChangeLog
/usr/share/doc/hello/NEWS
/usr/share/doc/hello/README
/usr/share/doc/hello/THANKS
/usr/share/info/hello.info.gz
/usr/share/licenses/hello/COPYING
/usr/share/locale/bg/LC_MESSAGES/hello.mo
/usr/share/locale/ca/LC_MESSAGES/hello.mo
...
/usr/share/man/man1/hello.1.gz
```

Здесь видно, куда попадет каждый файл при установке. Обратите внимание:
- `/usr/bin/hello` — сама программа (из `%{_bindir}/hello`)
- `/usr/share/licenses/hello/COPYING` — лицензия (из `%license COPYING`)
- `/usr/share/doc/hello/` — документация (из `%doc README NEWS ...`)
- `/usr/share/locale/*/LC_MESSAGES/hello.mo` — переводы (из `%find_lang`)

### Информация о пакете

```bash
rpm -qip ~/rpmbuild/RPMS/x86_64/hello-2.12.1-1.rosa13.1.x86_64.rpm
```

Покажет имя, версию, лицензию, описание, размер и другую метаинформацию.

### Зависимости пакета

```bash
# Что требуется для установки (Requires)
rpm -qRp ~/rpmbuild/RPMS/x86_64/hello-2.12.1-1.rosa13.1.x86_64.rpm

# Что пакет предоставляет (Provides)
rpm -qPp ~/rpmbuild/RPMS/x86_64/hello-2.12.1-1.rosa13.1.x86_64.rpm
```

RPM автоматически определяет зависимости от shared-библиотек (`.so`). Если программа
слинкована с `libc.so.6`, RPM добавит `Requires: libc.so.6()(64bit)` автоматически.

## Проверка качества

```bash
rpmlint ~/rpmbuild/RPMS/x86_64/hello-*.rpm
rpmlint ~/rpmbuild/SPECS/hello.spec
```

**rpmlint** проверяет пакет на соответствие стандартам. Результаты бывают трех типов:
- **E (error)** — ошибка, которую нужно исправить
- **W (warning)** — предупреждение, желательно исправить
- **I (info)** — информационное сообщение

Пример вывода:

```
hello.x86_64: W: no-documentation
hello.x86_64: W: spelling-error Summary(en_US) greeting
1 packages and 0 specfiles checked; 0 errors, 2 warnings.
```

Если ошибок (E:) нет — пакет пригоден для использования. Предупреждения можно оставить,
если вы понимаете их причину.

## Тестовая установка

```bash
# Установить пакет
sudo dnf install ~/rpmbuild/RPMS/x86_64/hello-2.12.1-1.*.rpm

# Проверить работу
hello
# Ожидаемый вывод: Hello, World!

hello --version
# Ожидаемый вывод: hello (GNU Hello) 2.12.1

hello --greeting="Привет, ROSA!"
# Ожидаемый вывод: Привет, ROSA!

# Проверить man-страницу
man hello

# Удалить пакет
sudo dnf remove hello
```
