+++
title = "Сборка, проверка и установка пакета"
weight = 3
+++

## Сборка

```bash
cd ~/rpmbuild/SPECS
rpmbuild -ba httpie.spec
```

### Ожидаемый вывод

Процесс сборки Python-пакета обычно быстрый (несколько секунд):

```
Executing(%generate_buildrequires): /bin/sh -e /var/tmp/rpm-tmp.XXXXXX
...
Executing(%build): /bin/sh -e /var/tmp/rpm-tmp.XXXXXX
...
Processing wheel: httpie-3.2.4-py3-none-any.whl
...
Executing(%install): /bin/sh -e /var/tmp/rpm-tmp.XXXXXX
...
Processing files: httpie-3.2.4-1.rosa13.1.noarch
...
Wrote: /home/user/rpmbuild/SRPMS/httpie-3.2.4-1.rosa13.1.src.rpm
Wrote: /home/user/rpmbuild/RPMS/noarch/httpie-3.2.4-1.rosa13.1.noarch.rpm
```

Обратите внимание:
- Пакет попал в `RPMS/noarch/` (не `x86_64/`) — потому что `BuildArch: noarch`
- В имени файла суффикс `.noarch` вместо `.x86_64`

### Что появилось

```bash
# Бинарный RPM
ls -lh ~/rpmbuild/RPMS/noarch/httpie-*.rpm
# httpie-3.2.4-1.rosa13.1.noarch.rpm

# Исходный RPM
ls -lh ~/rpmbuild/SRPMS/httpie-*.src.rpm
# httpie-3.2.4-1.rosa13.1.src.rpm
```

## Исследуем готовый пакет

### Список файлов

```bash
rpm -qlp ~/rpmbuild/RPMS/noarch/httpie-*.rpm
```

Ожидаемый вывод (сокращенно):

```
/usr/bin/http
/usr/bin/httpie
/usr/bin/https
/usr/lib/python3.12/site-packages/httpie/__init__.py
/usr/lib/python3.12/site-packages/httpie/__main__.py
/usr/lib/python3.12/site-packages/httpie/adapters.py
/usr/lib/python3.12/site-packages/httpie/cli/
...
/usr/lib/python3.12/site-packages/httpie-3.2.4.dist-info/
...
/usr/share/doc/httpie/README.md
/usr/share/licenses/httpie/LICENSE
```

Здесь видно:
- **CLI-скрипты** в `/usr/bin/` — то, что запускает пользователь
- **Python-модули** в `/usr/lib/python3.12/site-packages/httpie/` — собственно код
- **Метаданные** в `.dist-info/` — информация о пакете для pip/Python
- **Документация и лицензия** в стандартных каталогах

### Зависимости пакета

```bash
rpm -qRp ~/rpmbuild/RPMS/noarch/httpie-*.rpm
```

RPM автоматически определяет зависимости Python-пакета (из `requires.txt` в dist-info).
Вы увидите что-то вроде:

```
python3-charset-normalizer
python3-defusedxml
python3-multidict
python3-pygments >= 2.5.2
python3-requests >= 2.22.0
python3-requests-toolbelt >= 0.9.1
python3-rich >= 9.10.0
python(abi) = 3.12
```

### Информация о пакете

```bash
rpm -qip ~/rpmbuild/RPMS/noarch/httpie-*.rpm
```

Проверьте, что Architecture показывает `noarch`.

## Проверка и тестовая установка

```bash
# Проверка rpmlint
rpmlint ~/rpmbuild/RPMS/noarch/httpie-*.rpm

# Установка
sudo dnf install ~/rpmbuild/RPMS/noarch/httpie-*.rpm

# Проверка CLI
http --version
# Ожидаемый вывод: 3.2.4

https --version
# Ожидаемый вывод: 3.2.4

httpie --version
# Ожидаемый вывод: 3.2.4
```

### Проверяем, что Python-модуль доступен

```bash
python3 -c "import httpie; print(httpie.__version__)"
# Ожидаемый вывод: 3.2.4
```

### Проверяем работу

```bash
# Простой GET-запрос
http GET https://httpbin.org/get

# Должен вывести красиво отформатированный JSON-ответ
```

### Удаление

```bash
sudo dnf remove httpie
```
