IMG_NAME = myf-tradeflow-core
CONTAINER_NAME = $(IMG_NAME)-container
ROOT_NODE_MODULES_VOL = $(IMG_NAME)-nm-root
BACKEND_NODE_MODULES_VOL = $(IMG_NAME)-nm-backend
FRONTEND_NODE_MODULES_VOL = $(IMG_NAME)-nm-frontend

.PHONY: all start stop dev install build build-image clean clean-all logs purge-volumes volumes-ls shell compose-config

all: start

start:
	@docker compose up -d

stop:
	@docker compose stop

remove:
	@docker compose down

dev:
	@docker compose exec app npm run dev

install:
	@docker compose exec app npm run install:all

build:
	@docker compose up -d --build
	@docker compose exec app npm run install:all

build-image:
	@docker compose build

purge-volumes:
	@docker volume rm -f $(ROOT_NODE_MODULES_VOL) $(BACKEND_NODE_MODULES_VOL) $(FRONTEND_NODE_MODULES_VOL) 2>/dev/null || true

volumes-ls:
	@docker volume ls | grep $(IMG_NAME) || true

sh:
	@docker compose exec app sh

logs:
	@docker compose logs -f app

compose-config:
	@docker compose config