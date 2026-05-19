FRONTEND_DIR = ./web/default
FRONTEND_CLASSIC_DIR = ./web/classic
BACKEND_DIR = .
DEV_PG_CONTAINER = sqlbot-postgresql-dev
DEV_POSTGRES_DB = new-api
DEV_POSTGRES_USER = sqlbot_user
DEV_SQL_DSN = postgresql://sqlbot_user:DevOnly@123456@localhost:15432/new-api

.PHONY: all dev dev-web dev-web-classic reset-setup check check-backend check-frontend test

all:
	@echo "Starting backend locally..."
	@cd $(BACKEND_DIR) && SQL_DSN="$(DEV_SQL_DSN)" go run main.go

dev-web:
	@echo "Starting frontend dev server..."
	@cd $(FRONTEND_DIR) && bun install && bun run dev

dev-web-classic:
	@echo "Starting classic frontend dev server..."
	@cd $(FRONTEND_CLASSIC_DIR) && bun install && bun run dev

dev:
	@cd $(FRONTEND_DIR) && bun install & SQL_DSN="$(DEV_SQL_DSN)" cd $(BACKEND_DIR) && go run main.go

reset-setup:
	@echo "Resetting local setup wizard state..."
	@docker exec $(DEV_PG_CONTAINER) psql -U $(DEV_POSTGRES_USER) -d "$(DEV_POSTGRES_DB)" \
		-c 'DELETE FROM setups;' \
		-c 'DELETE FROM users WHERE role = 100;' \
		-c "DELETE FROM options WHERE key IN ('SelfUseModeEnabled', 'DemoSiteEnabled');"
	@echo "Reset complete. Restart your local backend process if it is running."

check: check-backend   ## 本地快速检查 (后端默认)

check-backend:                         ## Go 后端检查
	go vet ./...
	go test ./...

check-frontend:                        ## 前端检查 (default)
	cd $(FRONTEND_DIR) && bun run lint && bun run typecheck

test:                                  ## 运行所有测试
	go test ./...
