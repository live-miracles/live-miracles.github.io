.PHONY: *

DIR ?= .
LOG_FILE := npm-start.log
PID_FILE := .npm-start.pid

all:
	make start

install:
	npm install

start:
	npm start

daemon:
	@if [ -f $(PID_FILE) ] && kill -0 `cat $(PID_FILE)` 2>/dev/null; then \
		echo "Already running (PID $$(cat $(PID_FILE)))"; \
	else \
		nohup npm start > $(LOG_FILE) 2>&1 & echo $$! > $(PID_FILE); \
	fi

stop:
	@if [ -f $(PID_FILE) ]; then \
		kill `cat $(PID_FILE)` && rm $(PID_FILE); \
	fi

status:
	@if [ -f $(PID_FILE) ] && kill -0 `cat $(PID_FILE)` 2>/dev/null; then \
		echo "Running (PID $$(cat $(PID_FILE)))"; \
	else \
		echo "Not running"; \
	fi

pretty:
	npx prettier --write $(DIR)
