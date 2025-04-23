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
