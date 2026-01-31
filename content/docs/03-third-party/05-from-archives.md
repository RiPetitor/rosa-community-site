+++
title = "Установка из архивов"
description = "Ручная установка программ из tar.gz и zip"
weight = 5
+++

Некоторые программы распространяются как архивы с готовыми бинарниками или исходным кодом.

## Бинарные архивы

### Распаковка

```bash
# tar.gz
tar -xzf program.tar.gz

# tar.xz
tar -xJf program.tar.xz

# zip
unzip program.zip
```

### Размещение

Рекомендуемые места:

- `/opt/program/` — для всех пользователей
- `~/Applications/program/` — только для вас

```bash
sudo mv program /opt/
# или
mv program ~/Applications/
```

### Запуск

```bash
/opt/program/program
# или добавьте в PATH
```

### Интеграция в меню

Создайте `.desktop` файл:

```bash
sudo cat > /usr/share/applications/program.desktop << EOF
[Desktop Entry]
Name=Program Name
Exec=/opt/program/program
Icon=/opt/program/icon.png
Type=Application
Categories=Development;
EOF
```

### Добавление в PATH

Чтобы запускать программу по имени из любой папки:

```bash
echo 'export PATH="$PATH:/opt/program"' >> ~/.bashrc
source ~/.bashrc
```

## Сборка из исходников

<div class="warning">
  <div class="title">Для опытных</div>
  Сборка из исходников требует навыков и понимания процесса. Убедитесь, что понимаете, что делаете.
</div>

### Типичный процесс

1. Установите инструменты сборки:

```bash
sudo dnf install gcc gcc-c++ make cmake
```

2. Распакуйте и войдите в папку:

```bash
tar -xzf program-source.tar.gz
cd program-source
```

3. Прочитайте README или INSTALL.

4. Типичные команды:

```bash
# Автоинструменты (configure)
./configure --prefix=/usr/local
make
sudo make install

# CMake
mkdir build && cd build
cmake ..
make
sudo make install
```

### Удаление собранного ПО

Если использовался `make install`:

```bash
cd program-source
sudo make uninstall
```

Или удалите файлы вручную из `/usr/local/`.

## Обновление

При ручной установке обновление делается вручную:

1. Скачайте новую версию.
2. Замените старые файлы.
3. Перезапустите программу.

<div class="tip">
  <div class="title">Рекомендация</div>
  Ручная установка — крайний вариант. Предпочитайте репозитории, Flatpak или официальные RPM.
</div>

## Следующий шаг

- [Популярные приложения](@/docs/03-third-party/popular-apps/_index.md)
