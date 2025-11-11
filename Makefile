IMG_NAME = myf-tradeflow-core
CONTAINER_NAME = $(IMG_NAME)-container
# POSIX path (e.g. /e/dev/..)
CURRENT_DIR = $(shell pwd)
# Windows path (e.g. E:\\dev\\..). On non-MSYS envs, this falls back to CURRENT_DIR.
CURRENT_DIR_WIN = $(shell pwd -W 2>/dev/null || echo $(CURRENT_DIR))
# Named volumes (persist compiled Linux native modules, avoid rebuild on adding deps)
ROOT_NODE_MODULES_VOL = $(IMG_NAME)-nm-root
BACKEND_NODE_MODULES_VOL = $(IMG_NAME)-nm-backend
FRONTEND_NODE_MODULES_VOL = $(IMG_NAME)-nm-frontend

.PHONY: all start stop dev install build build-image clean clean-all logs purge-volumes volumes-ls shell

all: start

start:
	@MSYS_NO_PATHCONV=1 docker run -d --name $(CONTAINER_NAME) \
		-p 8000:8000 \
		-p 5173:5173 \
		-v "$(CURRENT_DIR_WIN):/app" \
		-v $(ROOT_NODE_MODULES_VOL):/app/node_modules \
		-v $(BACKEND_NODE_MODULES_VOL):/app/backend/node_modules \
		-v $(FRONTEND_NODE_MODULES_VOL):/app/frontend/node_modules \
		$(IMG_NAME) sh -c "while true; do sleep 3600; done"

stop:
	@docker rm -f $(CONTAINER_NAME) > /dev/null 2>&1 || true

dev:
	@docker exec -it $(CONTAINER_NAME) npm run dev

install:
	@docker exec -it $(CONTAINER_NAME) npm run install:all

build:
	@docker exec -it $(CONTAINER_NAME) npm run build

build-image:
	@docker build -t $(IMG_NAME) .

clean:
	@rm -rf "$(CURRENT_DIR)/node_modules" "$(CURRENT_DIR)/frontend/node_modules" "$(CURRENT_DIR)/backend/node_modules"

purge-volumes:
	@docker volume rm -f $(ROOT_NODE_MODULES_VOL) $(BACKEND_NODE_MODULES_VOL) $(FRONTEND_NODE_MODULES_VOL) 2>/dev/null || true

volumes-ls:
	@docker volume ls | grep $(IMG_NAME) || true

shell:
	@docker exec -it $(CONTAINER_NAME) sh

clean-all: clean stop

logs:
	@docker logs -f $(CONTAINER_NAME)