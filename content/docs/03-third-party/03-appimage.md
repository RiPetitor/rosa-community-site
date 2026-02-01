+++
title = "AppImage"
description = "Использование портативных приложений AppImage"
weight = 3
+++

{{ doc_dates() }}

AppImage — формат портативных приложений. Один файл содержит программу и все зависимости.

## Особенности

- **Не требует установки** — скачал, сделал исполняемым, запустил.
- **Портативность** — можно хранить на флешке.
- **Изоляция** — не затрагивает систему.

## Использование

### Скачивание

Скачайте `.AppImage` файл с официального сайта программы.

### Запуск

1. Сделайте файл исполняемым:

```bash
chmod +x Программа.AppImage
```

2. Запустите:

```bash
./Программа.AppImage
```

### Через файловый менеджер

1. Правый клик на файле → Свойства.
2. Вкладка «Права» → отметьте «Исполняемый».
3. Двойной клик для запуска.

## Интеграция в систему

### AppImageLauncher

Автоматически интегрирует AppImage в меню:

```bash
# Скачайте с https://github.com/TheAssassin/AppImageLauncher/releases
# Или найдите в репозиториях
sudo dnf install appimagelauncher
```

После установки система будет предлагать интеграцию при запуске AppImage.

### Ручная интеграция

Создайте `.desktop` файл:

```bash
mkdir -p ~/.local/share/applications

cat > ~/.local/share/applications/myapp.desktop << EOF
[Desktop Entry]
Name=My App
Exec=/path/to/MyApp.AppImage
Icon=/path/to/icon.png
Type=Application
Categories=Utility;
EOF
```

## Где хранить

Рекомендуемые места:

- `~/Applications/` — персональные приложения
- `/opt/` — для всех пользователей (требует sudo)

```bash
mkdir -p ~/Applications
mv Программа.AppImage ~/Applications/
```

## Обновление

AppImage не обновляются автоматически. Варианты:

1. **Вручную** — скачайте новую версию и замените файл.

2. **AppImageUpdate** — если приложение поддерживает:
   ```bash
   ./Программа.AppImage --appimage-update
   ```

## Удаление

Просто удалите файл:

```bash
rm ~/Applications/Программа.AppImage
```

Если была интеграция — удалите `.desktop` файл:

```bash
rm ~/.local/share/applications/myapp.desktop
```

<div class="tip">
  <div class="title">Совет</div>
  AppImage удобен для тестирования программ или использования конкретных версий без влияния на систему.
</div>

## Следующий шаг

- [Официальные RPM](@/docs/03-third-party/04-official-rpm.md)
