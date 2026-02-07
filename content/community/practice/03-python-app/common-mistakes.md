+++
title = "Ошибки новичков и советы по отладке"
weight = 5
+++

## Ошибки новичков

### 1. Отсутствует python3-devel или pyproject-rpm-macros

**Симптом:**

```
error: line 42: Unknown tag: %pyproject_buildrequires
```

или

```
error: Bad exit status from /var/tmp/rpm-tmp.XXXXXX (%generate_buildrequires)
```

**Причина:** не установлен пакет `pyproject-rpm-macros`, который предоставляет макросы
`%pyproject_*`.

**Решение:**

```bash
sudo dnf install pyproject-rpm-macros python3-devel
```

### 2. Пакет устанавливается в неправильную версию Python

**Симптом:** после установки `python3 -c "import httpie"` выдает `ModuleNotFoundError`.

**Причина:** на системе несколько версий Python, и пакет собрался для другой версии.
Например, собран для Python 3.11, а вы запускаете Python 3.12.

**Решение:** убедитесь, что используете системный Python:

```bash
python3 --version
rpm --eval '%{python3_version}'
```

Версии должны совпадать. Макросы `%pyproject_*` используют системный Python,
указанный в `python3-devel`.

### 3. Забыли перечислить CLI-скрипты в %files

**Симптом:**

```
RPM build errors:
    Installed (but unpackaged) file(s) found:
    /usr/bin/http
    /usr/bin/https
    /usr/bin/httpie
```

**Причина:** `%pyproject_save_files` включает только файлы из `site-packages`, но не из
`%{_bindir}`. CLI-скрипты, созданные из `console_scripts` entry points, нужно указать
в `%files` **вручную**.

**Решение:** добавьте в `%files`:

```spec
%{_bindir}/http
%{_bindir}/https
%{_bindir}/httpie
```

> **Как узнать имена скриптов?** Посмотрите `console_scripts` в `setup.cfg` или
> `pyproject.toml` проекта (как мы делали в шаге 2).

### 4. Тесты требуют доступа к сети

**Симптом:**

```
FAILED tests/test_output.py::TestHTTPie::test_GET - ConnectionError:
    HTTPConnectionPool(host='httpbin.org', port=80):
    Max retries exceeded with url: /get
```

**Причина:** многие Python-проекты имеют тесты, которые обращаются к внешним сервисам.
На ABF сети нет.

**Решение:** отключите тесты по умолчанию с помощью `%bcond`:

```spec
%bcond_with tests

%check
%if %{with tests}
%pytest -q
%endif
```

Тесты можно запустить локально: `rpmbuild -ba httpie.spec --with tests`.

Некоторые проекты позволяют пропустить сетевые тесты:

```spec
%check
%if %{with tests}
%pytest -q -k "not network and not online"
%endif
```

### 5. Зависимости не доступны в репозиториях ROSA

**Симптом:**

```
No matching package to install: python3-rich >= 9.10.0
```

**Причина:** не все Python-пакеты с PyPI упакованы для ROSA.

**Решение — как проверить:**

```bash
# Проверить, есть ли пакет в репозитории
dnf search python3-rich

# Проверить доступную версию
dnf info python3-rich
```

Если пакета нет:
1. Упакуйте его как отдельный RPM (многие Python-пакеты просты в упаковке)
2. Проверьте contrib-репозитории
3. В крайнем случае можно bundled-зависимости включить в пакет (но это не рекомендуется)

### 6. Путаница noarch vs arch

**Симптом:** вы указали `BuildArch: noarch`, но при установке получаете:

```
Error: package httpie-3.2.4-1.noarch requires libfoo.so()(64bit)
```

**Причина:** пакет зависит от скомпилированной библиотеки, значит он НЕ noarch.

**Как определить:** если проект содержит файлы `.c`, `.pyx` (Cython), или `setup.py`
вызывает `Extension()` — это **не** noarch. Уберите `BuildArch: noarch`, и пакет
соберется для конкретной архитектуры.

Чистый Python (только `.py` файлы) = `noarch`.
Python + C-расширения = архитектурно-зависимый.

### 7. Макрос %{pypi_source} не работает

**Симптом:**

```
error: File /home/user/rpmbuild/SOURCES/httpie-3.2.4.tar.gz: No such file or directory
```

Хотя файл скачан и лежит в SOURCES.

**Причина:** макрос `%{pypi_source}` раскрывается в URL, и rpmbuild извлекает имя файла
из этого URL. Если реальное имя файла отличается от ожидаемого (например, регистр букв),
rpmbuild не найдет файл.

**Решение:** проверьте, во что раскрывается макрос:

```bash
rpm --eval '%{pypi_source httpie}'
```

И сравните имя файла с тем, что лежит в `~/rpmbuild/SOURCES/`. Если не совпадает,
используйте прямой URL вместо макроса:

```spec
Source0: https://files.pythonhosted.org/packages/source/h/httpie/httpie-%{version}.tar.gz
```

## Советы по отладке Python-пакетов

### Пошаговая сборка

```bash
# Только распаковка
rpmbuild -bp httpie.spec

# Посмотреть pyproject.toml
cat ~/rpmbuild/BUILD/httpie-3.2.4/pyproject.toml

# Посмотреть entry_points
grep -A10 console_scripts ~/rpmbuild/BUILD/httpie-3.2.4/setup.cfg
```

### Посмотреть сгенерированный список файлов

После `rpmbuild -bi` (или неудачной полной сборки):

```bash
cat ~/rpmbuild/BUILD/httpie-3.2.4/%{name}-%{version}.dist-info/entry_points.txt
# Или после %pyproject_save_files:
find ~/rpmbuild/BUILDROOT/ -type f | head -30
```

### Проверить, что wheel корректный

После `rpmbuild -bc`:

```bash
ls ~/rpmbuild/BUILD/httpie-3.2.4/*.whl
# httpie-3.2.4-py3-none-any.whl

# Посмотреть содержимое wheel
python3 -m zipfile -l ~/rpmbuild/BUILD/httpie-3.2.4/httpie-3.2.4-py3-none-any.whl | head -20
```

### Найти все установленные файлы

```bash
rpmbuild -bi httpie.spec
find ~/rpmbuild/BUILDROOT/ -type f | sort
```

Сравните этот список с тем, что указано в `%files`. Все файлы должны быть учтены.

## Что дальше

- Загрузите пакет на ABF
- Попробуйте упаковать другое Python-приложение: `yt-dlp`, `black`, `poetry`
- Попробуйте упаковать Python-библиотеку (без CLI): `python3-requests`
- Разберитесь с `%pyproject_buildrequires -t` — для запуска тестов при сборке
- Добавьте man-страницу, если проект ее предоставляет

---

**Следующий практикум:** [Библиотека с подпакетом -devel (libyaml)](../04-library/)
