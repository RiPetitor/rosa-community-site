+++
title = "Ошибки новичков и советы по отладке"
weight = 5
+++

## Ошибки новичков

Эта секция — самая важная. Здесь собраны реальные ошибки, с которыми вы **обязательно**
столкнетесь. Не пугайтесь — все через это проходят.

### 1. Забыли указать BuildRequires

**Симптом:** сборка падает на этапе `%build` с загадочной ошибкой:

```
error: Bad exit status from /var/tmp/rpm-tmp.XXXXXX (%build)
```

А если посмотреть выше в логе:

```
checking for gcc... no
configure: error: no acceptable C compiler found in $PATH
```

**Причина:** не установлен `gcc`, и он не указан в `BuildRequires`.

**Решение:** добавьте `BuildRequires: gcc` в SPEC и установите его:

```bash
sudo dnf install gcc
```

**Совет:** перед запуском `rpmbuild` проверьте, что все BuildRequires установлены:

```bash
sudo dnf builddep ~/rpmbuild/SPECS/hello.spec
```

Эта команда прочитает SPEC-файл и установит все зависимости для сборки.

### 2. Неправильный URL в Source0 или файл не в том каталоге

**Симптом:**

```
error: File /home/user/rpmbuild/SOURCES/hello-2.12.1.tar.gz: No such file or directory
```

**Причина:** `rpmbuild` не скачивает файлы по URL из `Source0` — он просто ищет файл
с таким именем в `~/rpmbuild/SOURCES/`. Если вы положили файл не туда или назвали
его иначе — получите эту ошибку.

**Решение:** убедитесь, что файл лежит в `~/rpmbuild/SOURCES/` и его имя совпадает
с тем, что ожидает SPEC:

```bash
ls ~/rpmbuild/SOURCES/hello-2.12.1.tar.gz
```

Если имя файла и URL не совпадают, rpmbuild берет **только имя файла** из URL.
Например, из URL `https://example.com/downloads/hello-2.12.1.tar.gz` rpmbuild извлечет
имя `hello-2.12.1.tar.gz` и будет искать его в SOURCES.

### 3. Файлы в %files, которых нет в BUILDROOT

**Симптом:**

```
File not found: /home/user/rpmbuild/BUILDROOT/hello-2.12.1-1.rosa13.1.x86_64/usr/bin/hello
```

**Причина:** вы указали в секции `%files` файл, который не был создан на этапе `%install`.
Возможные причины:
- Опечатка в имени файла
- Программа ставит бинарник под другим именем
- `%install` не отработал корректно

**Решение:** после неудачной сборки посмотрите, что реально попало в BUILDROOT:

```bash
find ~/rpmbuild/BUILDROOT/ -type f | head -20
```

Или пересоберите только до этапа install и проверьте:

```bash
rpmbuild -bi hello.spec
find ~/rpmbuild/BUILDROOT/ -type f
```

### 4. Забыли %find_lang — «Installed (but unpackaged) file(s) found»

**Симптом:**

```
RPM build errors:
    Installed (but unpackaged) file(s) found:
    /usr/share/locale/bg/LC_MESSAGES/hello.mo
    /usr/share/locale/ca/LC_MESSAGES/hello.mo
    /usr/share/locale/da/LC_MESSAGES/hello.mo
    ...
```

**Причина:** `make install` установил файлы переводов (`.mo`), но вы не перечислили
их в секции `%files`. Для программ с переводами нужно использовать `%find_lang`.

**Решение:** добавьте в `%install`:

```
%find_lang %{name}
```

И в `%files` используйте:

```
%files -f %{name}.lang
```

Макрос `%find_lang` находит все файлы переводов и записывает их в файл `%{name}.lang`.
Флаг `-f` подключает этот список.

### 5. Запуск rpmbuild от root

**Симптом:** нет ошибки как таковой, но это **очень опасно**.

**Почему:** на этапе `%install` выполняется `make install DESTDIR=...`. Если в Makefile
есть баг или если DESTDIR игнорируется, файлы установятся **прямо в вашу реальную систему**.
От root это может перезаписать системные файлы и сломать ОС.

**Решение:** **всегда** собирайте пакеты от обычного пользователя. Для этого и существует
каталог `~/rpmbuild/` — он находится в домашнем каталоге, и права root не нужны.

```bash
# ПРАВИЛЬНО: от обычного пользователя
rpmbuild -ba hello.spec

# НЕПРАВИЛЬНО: от root — НИКОГДА так не делайте!
# sudo rpmbuild -ba hello.spec  ← ОПАСНО!
```

### 6. Неправильный формат %changelog

**Симптом:**

```
error: %changelog not in descending chronological order
```

или

```
error: date in %changelog is not valid
```

**Причина:** формат даты в `%changelog` строго фиксирован:

```
* День_недели Месяц Число Год Имя Фамилия <email> - Версия-Релиз
```

День недели и месяц — **только на английском**, трехбуквенные сокращения:
`Mon Tue Wed Thu Fri Sat Sun` и `Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec`.

**Решение:** используйте команду `date` для генерации правильной даты:

```bash
date "+%a %b %d %Y"
# Mon Feb 03 2025
```

### 7. Файлы попадают не в те пути

**Симптом:** программа устанавливается, но не запускается, потому что оказалась в `/usr/local/bin`
вместо `/usr/bin`.

**Причина:** вы вызвали `./configure` напрямую без `%configure`. По умолчанию Autotools
ставит в `/usr/local`, а RPM ожидает файлы в `/usr`.

**Решение:** всегда используйте макрос `%configure` вместо прямого вызова `./configure`.
Макрос автоматически передает `--prefix=/usr`, `--libdir=/usr/lib64` и другие флаги.

## Советы по отладке

### Пошаговая сборка

Если сборка падает и непонятно на каком этапе, собирайте пошагово:

```bash
# Только распаковка
rpmbuild -bp hello.spec
ls ~/rpmbuild/BUILD/hello-2.12.1/

# Распаковка + компиляция
rpmbuild -bc hello.spec

# Распаковка + компиляция + установка
rpmbuild -bi hello.spec
find ~/rpmbuild/BUILDROOT/ -type f
```

### Просмотр раскрытого SPEC-файла

Чтобы увидеть, как rpmbuild раскрывает макросы:

```bash
rpmspec -P ~/rpmbuild/SPECS/hello.spec | head -50
```

Это покажет SPEC-файл, в котором все макросы заменены на реальные значения.

### Проверка содержимого SRPM

```bash
rpm -qlp ~/rpmbuild/SRPMS/hello-2.12.1-1.rosa13.1.src.rpm
```

Ожидаемый вывод:

```
hello-2.12.1.tar.gz
hello.spec
```

SRPM содержит все, что нужно для воспроизведения сборки: SPEC-файл и исходный архив.

## Что дальше

- Загрузите пакет на ABF и соберите его там
- Попробуйте добавить патч к пакету (см. [Практикум 6: Патчинг](../06-patching/))
- Создайте подпакет с документацией (`%package doc`)
- Попробуйте обновить до следующей версии GNU Hello

---

**Следующий практикум:** [Rust CLI-утилита (ripgrep)](../02-cli-rust/)
