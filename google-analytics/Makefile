build:
	GOOS=linux GOARCH=amd64 go build -o build/main main.go
	zip main.zip build/main

run:
	sam local invoke "GoogleAnalytics" -e event.json

.PHONY: build