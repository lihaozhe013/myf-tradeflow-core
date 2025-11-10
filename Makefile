IMG_NAME = myf-tradeflow-core
CONTAINER_NAME = $(IMG_NAME)-container
CURRENT_DIR = $(shell pwd)

.PHONY: all start stop dev install build build-image clean clean-container clean-all logs

all: start

start:
	@docker run -d --name $(CONTAINER_NAME) \
		-p 8000:8000 \
		-p 5173:5173 \
		-v "$(CURRENT_DIR)":/app \
		-v /app/node_modules \
		-v /app/backend/node_modules \
		-v /app/frontend/node_modules \
		$(IMG_NAME) sh -c "while true; do sleep 3600; done"

stop:
	@docker rm -f -v $(CONTAINER_NAME) > /dev/null 2>&1 || true

dev:
	@docker exec -it $(CONTAINER_NAME) npm run dev

install:
	@docker exec -it $(CONTAINER_NAME) npm run install:all

build:
	@docker exec -it $(CONTAINER_NAME) npm run build

build-image:
	@docker build -t $(IMG_NAME) .

clean:
	@rm -rf "$(CURRENT_DIR)/node_modules" \
		"$(CURRENT_DIR)/frontend/node_modules" \
		"$(CURRENT_DIR)/backend/node_modules"

clean-all: clean stop

logs:
	@docker logs -f $(CONTAINER_NAME)