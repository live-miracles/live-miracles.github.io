.PHONY: *

pretty:
	npx prettier "!**/*{.min.css,.min.js,output.css}" --write .

css:
	npx @tailwindcss/cli -i ./input.css -o ./output.css --watch
