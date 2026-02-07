+++
title = "Что происходит за кулисами"
weight = 4
+++

## Что происходит за кулисами

Когда вы запускаете `rpmbuild -ba hello.spec`, происходит следующее:

### Этап 1: %prep — Распаковка

```
~/rpmbuild/SOURCES/hello-2.12.1.tar.gz
       ↓ (распаковка)
~/rpmbuild/BUILD/hello-2.12.1/
       (здесь теперь лежат все исходные файлы)
```

Макрос `%autosetup`:
1. Переходит в `~/rpmbuild/BUILD/`
2. Распаковывает `Source0` (наш `.tar.gz`)
3. Переходит в созданный каталог `hello-2.12.1/`
4. Применяет патчи (если есть `Patch0`, `Patch1` и т.д.)

### Этап 2: %build — Компиляция

Все происходит внутри `~/rpmbuild/BUILD/hello-2.12.1/`:

```
./configure --prefix=/usr --libdir=/usr/lib64 ...
       ↓
Makefile (сгенерированный configure)
       ↓
make -j$(nproc)
       ↓
~/rpmbuild/BUILD/hello-2.12.1/src/hello  (скомпилированный бинарник)
```

### Этап 3: %install — Установка в фальшивый корень

```
make install DESTDIR=~/rpmbuild/BUILDROOT/hello-2.12.1-1.rosa13.1.x86_64/
```

Файлы попадают в **BUILDROOT**, а не в реальную систему:

```
~/rpmbuild/BUILDROOT/hello-2.12.1-1.rosa13.1.x86_64/
├── usr/
│   ├── bin/
│   │   └── hello              ← бинарник
│   └── share/
│       ├── doc/hello/         ← документация
│       ├── info/              ← info-страницы
│       ├── locale/            ← переводы
│       └── man/man1/          ← man-страницы
```

Это ключевой момент: программа «думает», что устанавливается в `/usr/bin/hello`,
но на самом деле файл попадает в `BUILDROOT/usr/bin/hello`. Переменная `DESTDIR`
сдвигает все пути.

### Этап 4: %files — Сборка RPM

`rpmbuild` берет перечисленные в `%files` пути, находит соответствующие файлы
в BUILDROOT и упаковывает их в RPM-пакет.

Если файл указан в `%files`, но его нет в BUILDROOT — ошибка.
Если файл есть в BUILDROOT, но не указан в `%files` — тоже ошибка
(«Installed but unpackaged files found»).

## Разбор макросов

Вот основные макросы, которые мы использовали, и во что они раскрываются:

| Макрос | Раскрывается в | Пояснение |
|--------|---------------|-----------|
| `%{name}` | `hello` | Значение тега Name |
| `%{version}` | `2.12.1` | Значение тега Version |
| `%{_bindir}` | `/usr/bin` | Стандартный каталог для программ |
| `%{_mandir}` | `/usr/share/man` | Каталог man-страниц |
| `%{_infodir}` | `/usr/share/info` | Каталог info-страниц |
| `%{_datadir}` | `/usr/share` | Каталог данных |
| `%{buildroot}` | `~/rpmbuild/BUILDROOT/...` | Фальшивый корень |
| `%{?dist}` | `.rosa13.1` | Тег дистрибутива (может быть пустым) |

Чтобы узнать значение любого макроса, используйте:

```bash
rpm --eval '%{_bindir}'
# /usr/bin

rpm --eval '%{_libdir}'
# /usr/lib64

rpm --eval '%{?dist}'
# .rosa13.1
```
