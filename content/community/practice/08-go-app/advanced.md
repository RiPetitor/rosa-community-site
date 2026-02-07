+++
title = "Дополнительные темы"
weight = 3
+++

## Shell-completions

Некоторые Go-приложения могут генерировать shell-completions. Если lazygit поддерживает это,
вы можете добавить их в пакет:

```spec
%install
install -Dm0755 lazygit %{buildroot}%{_bindir}/lazygit

# Генерация completions (если поддерживается)
./lazygit completion bash 2>/dev/null && {
    install -Dm0644 <(./lazygit completion bash) \
        %{buildroot}%{_datadir}/bash-completion/completions/lazygit
    install -Dm0644 <(./lazygit completion zsh) \
        %{buildroot}%{_datadir}/zsh/site-functions/_lazygit
    install -Dm0644 <(./lazygit completion fish) \
        %{buildroot}%{_datadir}/fish/vendor_completions.d/lazygit.fish
} || :
```

Если поддержки нет -- `|| :` не даст сборке упасть. Пути для completions:

| Shell | Путь | Пояснение |
|-------|------|-----------|
| bash | `/usr/share/bash-completion/completions/lazygit` | Стандартный путь для bash-completion |
| zsh | `/usr/share/zsh/site-functions/_lazygit` | Префикс `_` обязателен для zsh |
| fish | `/usr/share/fish/vendor_completions.d/lazygit.fish` | Суффикс `.fish` обязателен |

Не забудьте добавить файлы в `%files`:

```spec
%files
%license LICENSE
%doc README.md
%{_bindir}/lazygit
# Раскомментируйте, если completions генерируются:
# %{_datadir}/bash-completion/completions/lazygit
# %{_datadir}/zsh/site-functions/_lazygit
# %{_datadir}/fish/vendor_completions.d/lazygit.fish
```

## Go module proxy и воспроизводимость

### GOPROXY=off

В секции `%build` мы установили `GOPROXY=off`. Это критически важно:

```bash
export GOPROXY=off
```

Без этого Go может попытаться проверить контрольные суммы модулей через
`sum.golang.org`, даже если модули уже есть в vendor/. На ABF это приведёт к ошибке:

```
verifying module: checksum mismatch ... GONOSUMCHECK or GONOSUMDB to bypass
```

С `GOPROXY=off` Go полностью работает офлайн. Никаких сюрпризов при сборке.

### Воспроизводимые сборки

Для полной воспроизводимости также рекомендуется:

```bash
export GONOSUMCHECK=*
export GONOSUMDB=*
export GOFLAGS="-mod=vendor -trimpath"
```

Флаг `-trimpath` убирает абсолютные пути из бинарника (вместо `/home/user/rpmbuild/BUILD/...`
в отладочной информации будет относительный путь). Это делает сборку воспроизводимой
независимо от пути, где она выполнялась.

## Структура файлов в пакете

В отличие от C/C++ проектов, Go-приложение устанавливает минимум файлов:

```
/usr/bin/lazygit                             ← бинарник
/usr/share/doc/lazygit/README.md             ← документация
/usr/share/licenses/lazygit/LICENSE          ← лицензия
```

Нет библиотек, нет заголовков, нет pkg-config, нет man-страниц (если проект их не генерирует).
Пакет получается предельно простым.
