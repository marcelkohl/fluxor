.PHONY: help install env install-rust install-tauri-deps install-android-deps setup setup-android \
	dev app run build tauri-build preview icons check clean \
	android-init android-dev android-build android-build-debug android-install android-run apk

NPM := npm
TAURI := $(NPM) run tauri --
CARGO_HOME := $(HOME)/.cargo
CARGO_BIN := $(CARGO_HOME)/bin
ANDROID_HOME ?= $(HOME)/Android/Sdk
ANDROID_GEN := src-tauri/gen/android

# JDK: Android Studio (JBR) ou OpenJDK 17 do sistema.
ifeq ($(wildcard $(HOME)/android-studio/jbr/bin/java),)
  ifeq ($(wildcard /opt/android-studio/jbr/bin/java),)
    JAVA_HOME ?= $(shell dirname "$$(dirname "$$(readlink -f "$$(command -v java 2>/dev/null)" 2>/dev/null)")" 2>/dev/null)
  else
    JAVA_HOME ?= /opt/android-studio/jbr
  endif
else
  JAVA_HOME ?= $(HOME)/android-studio/jbr
endif

NDK_VERSION := $(shell ls -1 "$(ANDROID_HOME)/ndk" 2>/dev/null | sort -V | tail -1)
NDK_HOME ?= $(ANDROID_HOME)/ndk/$(NDK_VERSION)

JAVA_BIN :=
ifneq ($(JAVA_HOME),)
JAVA_BIN := $(JAVA_HOME)/bin:
endif

# Garante que recipes enxerguem cargo após `make install-rust` na mesma sessão.
export PATH := $(JAVA_BIN)$(ANDROID_HOME)/platform-tools:$(ANDROID_HOME)/cmdline-tools/latest/bin:$(CARGO_BIN):$(PATH)
export JAVA_HOME
export ANDROID_HOME
export NDK_HOME

.DEFAULT_GOAL := help

define require_cargo
	@if ! command -v cargo >/dev/null 2>&1; then \
		echo ""; \
		echo "Erro: Rust/cargo não encontrado no PATH."; \
		echo "Execute: make install-rust   ou   make setup"; \
		echo ""; \
		exit 1; \
	fi
endef

define require_tauri_deps
	@if [ "$$(uname -s)" = "Linux" ]; then \
		if ! command -v pkg-config >/dev/null 2>&1; then \
			echo ""; \
			echo "Erro: pkg-config não encontrado (necessário para compilar Tauri no Linux)."; \
			echo "Execute: make install-tauri-deps   ou   make setup"; \
		echo "Doc: https://v2.tauri.app/start/prerequisites/"; \
		echo ""; \
		exit 1; \
		fi; \
	fi
endef

define require_java
	@if [ -n "$(JAVA_HOME)" ] && [ -x "$(JAVA_HOME)/bin/java" ]; then \
		:; \
	elif command -v java >/dev/null 2>&1; then \
		:; \
	else \
		echo ""; \
		echo "Erro: Java (JDK 17+) não encontrado."; \
		echo "Instale Android Studio ou: make install-android-deps"; \
		echo "Depois exporte JAVA_HOME, ex.:"; \
		echo "  export JAVA_HOME=\"$(HOME)/android-studio/jbr\""; \
		echo "Doc: https://v2.tauri.app/start/prerequisites/#android"; \
		echo ""; \
		exit 1; \
	fi
endef

define require_android_sdk
	@if [ ! -d "$(ANDROID_HOME)" ]; then \
		echo ""; \
		echo "Erro: Android SDK não encontrado em $(ANDROID_HOME)"; \
		echo "Instale Android Studio e os SDK packages (Platform, Build-Tools, NDK)."; \
		echo "Depois exporte:"; \
		echo "  export ANDROID_HOME=\"$(HOME)/Android/Sdk\""; \
		echo "Doc: https://v2.tauri.app/start/prerequisites/#android"; \
		echo ""; \
		exit 1; \
	fi; \
	if [ -z "$(NDK_VERSION)" ] || [ ! -d "$(NDK_HOME)" ]; then \
		echo ""; \
		echo "Erro: NDK não encontrado em $(ANDROID_HOME)/ndk"; \
		echo "No Android Studio: SDK Manager → NDK (Side by side)."; \
		echo ""; \
		exit 1; \
	fi
endef

define require_android_project
	@if [ ! -d "$(ANDROID_GEN)" ]; then \
		echo ""; \
		echo "Erro: target Android não inicializado."; \
		echo "Execute uma vez: make android-init"; \
		echo ""; \
		exit 1; \
	fi
endef

define require_adb
	@if ! command -v adb >/dev/null 2>&1; then \
		echo ""; \
		echo "Erro: adb não encontrado (Android SDK Platform-Tools)."; \
		echo "Instale pelo Android Studio ou:"; \
		echo "  export PATH=\"$(ANDROID_HOME)/platform-tools:$$PATH\""; \
		echo ""; \
		exit 1; \
	fi; \
	devices=$$(adb devices | awk 'NR>1 && $$2==\"device\" {print $$1}' | wc -l); \
	if [ "$$devices" -eq 0 ]; then \
		echo ""; \
		echo "Erro: nenhum dispositivo Android conectado."; \
		echo "Conecte o celular (USB debugging) ou inicie um emulador."; \
		echo "Verifique: adb devices"; \
		echo ""; \
		exit 1; \
	fi
endef

define show_apk_outputs
	@echo ""
	@apk_count=$$(find src-tauri/gen/android/app/build/outputs/apk -name '*.apk' 2>/dev/null | wc -l); \
	if [ "$$apk_count" -eq 0 ]; then \
		echo "Nenhum APK encontrado em src-tauri/gen/android/app/build/outputs/apk/"; \
		echo "Verifique erros acima (Gradle/Tauri)."; \
	else \
		echo "========================================"; \
		echo "  APK gerado com sucesso ($$apk_count arquivo(s))"; \
		echo "========================================"; \
		find src-tauri/gen/android/app/build/outputs/apk -name '*.apk' 2>/dev/null | sort | while read -r apk; do \
			size=$$(du -h "$$apk" | cut -f1); \
			echo ""; \
			echo "  $$apk  ($$size)"; \
		done; \
		echo ""; \
		mkdir -p dist/android; \
		debug_apk=$$(find src-tauri/gen/android/app/build/outputs/apk -path '*/debug/*.apk' 2>/dev/null | head -1); \
		if [ -n "$$debug_apk" ]; then \
			cp -f "$$debug_apk" dist/android/fluxor-debug.apk; \
			echo "  Instalável no celular: dist/android/fluxor-debug.apk"; \
			echo "  Comando: make android-install"; \
			echo ""; \
		fi; \
		release_apk="src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release-unsigned.apk"; \
		if [ -f "$$release_apk" ]; then \
			cp -f "$$release_apk" dist/android/fluxor-release-unsigned.apk; \
			echo "  ATENÇÃO: dist/android/fluxor-release-unsigned.apk NÃO instala no celular"; \
			echo "  (release sem assinatura → Android mostra \"pacote inválido\")."; \
			echo "  Para testar no aparelho: make android-install"; \
		fi; \
		echo ""; \
	fi
endef

help: ## Lista os comandos disponíveis
	@echo "Fluxor — comandos de desenvolvimento"
	@echo ""
	@grep -E '^[a-zA-Z0-9_-]+:.*##' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

install: ## Instala dependências Node
	$(NPM) install

env: ## Cria .env a partir de .env.example (se não existir)
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Criado .env — ajuste VITE_DEV_PORT se a porta 5173 estiver em uso."; \
	else \
		echo ".env já existe."; \
	fi

install-rust: ## Instala Rust (rustup) se cargo não existir
	@if command -v cargo >/dev/null 2>&1; then \
		echo "Rust já instalado:"; \
		cargo --version; \
		rustc --version; \
	else \
		echo "Instalando Rust via rustup (stable)..."; \
		curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable; \
		echo ""; \
		echo "Rust instalado em $(CARGO_BIN)"; \
		"$(CARGO_BIN)/cargo" --version; \
		"$(CARGO_BIN)/rustc" --version; \
		echo ""; \
		echo "Neste terminal, para usar cargo fora do make:"; \
		echo "  source \"$(CARGO_HOME)/env\""; \
	fi

install-tauri-deps: ## Dependências de SO para Tauri (Linux / apt)
	@set -e; \
	if [ "$$(uname -s)" != "Linux" ]; then \
		echo "install-tauri-deps: nada a fazer (não é Linux)."; \
	elif command -v pkg-config >/dev/null 2>&1 && pkg-config --exists glib-2.0 2>/dev/null; then \
		echo "Dependências Tauri OK (pkg-config + glib-2.0)."; \
	elif ! command -v apt-get >/dev/null 2>&1; then \
		echo "Distribuição sem apt-get — instale manualmente:"; \
		echo "  https://v2.tauri.app/start/prerequisites/"; \
		exit 1; \
	else \
		echo "Instalando dependências Tauri via apt (sudo)..."; \
		sudo apt-get update -qq; \
		sudo apt-get install -y \
			pkg-config \
			libwebkit2gtk-4.1-dev \
			build-essential \
			curl \
			wget \
			file \
			libxdo-dev \
			libssl-dev \
			libayatana-appindicator3-dev \
			librsvg2-dev; \
		echo ""; \
		echo "Dependências Tauri instaladas."; \
	fi

setup: install env install-rust install-tauri-deps icons ## Setup inicial (Node + Rust + SO + ícones)

setup-android: install install-rust install-android-deps android-init ## Setup Android (SDK checks + init Tauri)

install-android-deps: ## JDK (apt), targets Rust Android e checagem do SDK
	$(require_cargo)
	@set -e; \
	echo "Instalando Rust targets para Android..."; \
	rustup target add aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android; \
	if [ "$$(uname -s)" = "Linux" ] && command -v apt-get >/dev/null 2>&1; then \
		if ! command -v java >/dev/null 2>&1; then \
			echo "Instalando OpenJDK 17 (sudo)..."; \
			sudo apt-get update -qq; \
			sudo apt-get install -y openjdk-17-jdk; \
		else \
			echo "Java OK: $$(command -v java)"; \
		fi; \
	fi
	@echo ""
	@echo "Verificando ambiente Android..."
	$(require_java)
	$(require_android_sdk)
	@echo "ANDROID_HOME=$(ANDROID_HOME)"
	@echo "NDK_HOME=$(NDK_HOME)"
	@if [ -n "$(JAVA_HOME)" ]; then echo "JAVA_HOME=$(JAVA_HOME)"; else echo "JAVA_HOME=(java no PATH: $$(command -v java))"; fi
	@echo ""
	@echo "Ambiente Android OK."

dev: ## Sobe o frontend (Vite) em http://localhost:5173
	$(NPM) run dev

app: ## Sobe a aplicação desktop (Tauri + Vite)
	$(require_cargo)
	$(require_tauri_deps)
	$(TAURI) dev

run: app ## Alias para `make app`

build: ## Build de produção do frontend
	$(NPM) run build

tauri-build: build ## Build de produção do app desktop
	$(require_cargo)
	$(require_tauri_deps)
	$(TAURI) build

preview: build ## Preview do build frontend
	$(NPM) run preview

icons: ## Regenera ícones Tauri a partir do favicon
	$(require_cargo)
	$(require_tauri_deps)
	$(TAURI) icon public/favicon.svg

check: build ## Valida TypeScript e build do frontend

android-init: ## [1x] Inicializa o target Android no projeto (Tauri)
	$(require_cargo)
	$(require_java)
	$(require_android_sdk)
	$(TAURI) android init --ci

android-dev: ## Roda o app no emulador/dispositivo (dev)
	$(require_cargo)
	$(require_java)
	$(require_android_sdk)
	$(require_android_project)
	$(TAURI) android dev

android-build-debug: build ## Gera APK debug assinado (instalável no celular)
	$(require_cargo)
	$(require_java)
	$(require_android_sdk)
	$(require_android_project)
	$(TAURI) android build --debug --apk
	$(show_apk_outputs)

android-install: android-build-debug ## Build debug + instala no celular via adb
	$(require_adb)
	@debug_apk=$$(find src-tauri/gen/android/app/build/outputs/apk -path '*/debug/*.apk' 2>/dev/null | head -1); \
	if [ -z "$$debug_apk" ]; then \
		echo ""; \
		echo "Erro: APK debug não encontrado."; \
		echo "Execute: make android-build-debug"; \
		echo ""; \
		exit 1; \
	fi; \
	echo ""; \
	echo "Instalando $$debug_apk no dispositivo..."; \
	adb install -r "$$debug_apk"; \
	echo ""; \
	echo "Instalação concluída. Abra o app \"Fluxor\" no celular."

android-build: build ## Gera APK release unsigned (NÃO instala direto no celular)
	$(require_cargo)
	$(require_java)
	$(require_android_sdk)
	$(require_android_project)
	$(TAURI) android build --apk
	$(show_apk_outputs)

apk: android-build ## Alias para release unsigned (distribuição — requer assinatura)

android-run: build ## Instala e executa build release no dispositivo
	$(require_cargo)
	$(require_java)
	$(require_android_sdk)
	$(require_android_project)
	$(TAURI) android run

clean: ## Remove artefatos de build
	rm -rf dist node_modules/.tmp src-tauri/target
