IMG_NAME = myf-tradeflow-core
CONTAINER_NAME = $(IMG_NAME)-container
ROOT_NODE_MODULES_VOL = $(IMG_NAME)-nm-root
BACKEND_NODE_MODULES_VOL = $(IMG_NAME)-nm-backend
FRONTEND_NODE_MODULES_VOL = $(IMG_NAME)-nm-frontend

.PHONY: all start stop dev install build build-image clean clean-all logs purge-volumes volumes-ls shell compose-config

docker-start:
	@docker compose up -d

docker-stop:
	@docker compose stop

docker-down:
	@docker compose down

docker-dev:
	@docker compose exec app npm run dev

docker-build:
	@docker compose up -d --build

docker-build-image:
	@docker compose build

docker-purge-volumes:
	@docker volume rm -f $(ROOT_NODE_MODULES_VOL) $(BACKEND_NODE_MODULES_VOL) $(FRONTEND_NODE_MODULES_VOL) 2>/dev/null || true

docker-sh:
	@docker compose exec app sh

docker-logs:
	@docker compose logs -f app

docker-compose-config:
	@docker compose config

install:
	npm run install:all

dev:
	npm run dev

build:
	npm run build

clean-node-modules:
	rm -rf node_modules
	rm -rf backend/node_modules
	rm -rf frontend/node_modules