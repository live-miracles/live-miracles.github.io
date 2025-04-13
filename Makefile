.PHONY: *

DIR ?= .

all:
	make start

install:
	npm install

pretty:
	npx prettier --write $(DIR)

pretty-gal:
	npx prettier --write gallery/
	npx prettier --write gallery-ext/

pretty-del-yt:
	npx prettier --write yad/

pretty-vmm:
	npx prettier --write vmix-master/

start:
	npm start

css-del-yt:
	npx @tailwindcss/cli -i ./delayed-yt/input.css -o ./delayed-yt/output.css --watch

css-gal:
	npx @tailwindcss/cli -i ./gallery/input.css -o ./gallery/output.css --watch

css-gal-ext:
	npx @tailwindcss/cli -i ./gallery-ext/popup.css -o ./gallery-ext/output.css --watch

css-vmm:
	npx @tailwindcss/cli -i ./vmix-master/input.css -o ./vmix-master/output.css --watch

css-graf:
	npx @tailwindcss/cli -i ./grafana-monitor/input.css -o ./grafana-monitor/output.css --watch
