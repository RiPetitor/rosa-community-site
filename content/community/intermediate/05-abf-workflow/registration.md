+++
title = "Регистрация и настройка"
weight = 2
description = "Создание аккаунта, настройка SSH-ключей и git."
+++

Для работы с ABF нужен аккаунт и настроенные SSH-ключи для доступа к git-репозиториям.

## Регистрация на ABF

### Шаг 1: Создание аккаунта

1. Перейдите на [https://abf.io](https://abf.io)
2. Нажмите «Sign up» или «Регистрация»
3. Заполните форму:
   - Имя пользователя (латиница)
   - Email
   - Пароль
4. Подтвердите email

### Шаг 2: Запрос доступа к сборке

Для запуска сборок нужно запросить права. Напишите в:
- Телеграм: [t.me/rosalinux](https://t.me/rosalinux)
- Форум: [forum.rosa.ru](https://forum.rosa.ru)

Укажите ваш логин на ABF и цель (упаковка ПО для ROSA).

## Настройка SSH-ключей

SSH-ключи нужны для работы с git-репозиториями на ABF.

### Шаг 1: Сгенерировать ключ (если нет)

```bash
# Проверить наличие ключей
ls ~/.ssh/id_*.pub

# Если нет — создать
ssh-keygen -t ed25519 -C "your@email.com"
# Или RSA
ssh-keygen -t rsa -b 4096 -C "your@email.com"
```

При запросе passphrase можно оставить пустым или установить для дополнительной безопасности.

### Шаг 2: Добавить ключ на ABF

1. Скопируйте публичный ключ:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   # или
   cat ~/.ssh/id_rsa.pub
   ```

2. На ABF: Settings → SSH Keys → Add new

3. Вставьте содержимое `.pub` файла

### Шаг 3: Проверить подключение

```bash
ssh -T git@abf.io
# Ожидаемый ответ:
# Hi username! You've successfully authenticated...
```

## Настройка Git

### Глобальные настройки

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

### Настройка для ABF

Создайте файл `~/.ssh/config`:

```
Host abf.io
    HostName abf.io
    User git
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
```

## Клонирование репозитория

### Существующий проект

```bash
git clone git@abf.io:import/firefox.git
cd firefox
```

### Ваш личный проект

```bash
git clone git@abf.io:username_personal/mypackage.git
```

## Создание нового проекта

### Через веб-интерфейс

1. На ABF: Your projects → New project
2. Заполните:
   - Name: имя пакета
   - Description: описание
   - Visibility: Public
3. Нажмите Create

### Инициализация репозитория

```bash
# Создать локальный каталог
mkdir mypackage
cd mypackage

# Инициализировать git
git init

# Добавить remote
git remote add origin git@abf.io:username_personal/mypackage.git

# Создать начальную структуру
touch mypackage.spec
# Добавить исходники

# Первый коммит
git add .
git commit -m "Initial commit"
git push -u origin main
# или используйте основную ветку проекта (например, master)
```

## Структура личного репозитория

После регистрации у вас появляется:

```
https://abf.io/username_personal/
```

Здесь вы можете создавать свои проекты для тестирования.

## Публикация пакетов

После сборки пакеты попадают в ваш личный репозиторий:

```
https://abf-downloads.rosalinux.ru/username_personal/repository/ROSA_PLATFORM/x86_64/main/release/
# где ROSA_PLATFORM = rosa13.1 (или имя платформы из ABF)
```

Чтобы пользователи могли установить ваши пакеты:

```bash
# Создать файл репозитория (подставьте платформу из ABF, например rosa13.1)
sudo tee /etc/yum.repos.d/username.repo << 'EOF'
[username-personal]
name=User Personal Repository
baseurl=https://abf-downloads.rosalinux.ru/username_personal/repository/ROSA_PLATFORM/$basearch/main/release/
enabled=1
gpgcheck=0
EOF

# Обновить кеш
sudo dnf makecache

# Установить пакет
sudo dnf install mypackage
```
Личные репозитории обычно не подписаны, поэтому `gpgcheck=0` здесь допустим.

## Права доступа

### Уровни доступа к проекту

| Уровень | Возможности |
|---------|-------------|
| Reader | Просмотр, клонирование |
| Writer | + Push, создание веток |
| Admin | + Управление настройками, правами |

### Добавление участников

1. Перейдите в проект
2. Settings → Collaborators
3. Добавьте пользователя и выберите уровень

## Токены API

Для автоматизации можно использовать API-токены:

1. Settings → Personal access tokens
2. Generate new token
3. Выберите области доступа
4. Сохраните токен (показывается один раз!)

Использование:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://abf.io/api/v1/projects/username_personal/mypackage
```

## Типичные проблемы

### «Permission denied (publickey)»

SSH-ключ не добавлен или неправильный:

```bash
# Проверить, какой ключ используется
ssh -vT git@abf.io

# Убедиться, что ключ добавлен на ABF
```

### «Repository not found»

- Проверьте правильность URL
- Убедитесь, что есть права доступа
- Возможно, проект ещё не создан

### «Permission denied» при push

Нет прав на запись:
- Для чужого проекта — запросите права у владельца
- Для своего — проверьте настройки проекта

## Проверьте понимание

1. Какие шаги нужны для регистрации на ABF?
2. Как сгенерировать SSH-ключ?
3. Как проверить, что SSH-ключ работает?
4. Куда попадают пакеты из личного репозитория?
5. Как дать другому пользователю доступ к своему проекту?

---

**Далее:** [Структура проекта на ABF](@/community/intermediate/05-abf-workflow/project-structure.md)
