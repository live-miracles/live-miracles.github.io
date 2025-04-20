.PHONY: *

DIR ?= .

all:
	make start

install:
	npm install

start:
	npm start

pretty:
	npx prettier --write $(DIR)

css:
	npx @tailwindcss/cli -i ./$(DIR)/input.css -o ./$(DIR)/output.css --watch
