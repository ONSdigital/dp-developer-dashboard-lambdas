TARGET_NODE_VERSION=?10.0.0

.PHONY: npm-prod
npm-prod:
	npm install --production --target_arch=x64 --target_platform=linux --target_libc=glibc --target=$(TARGET_NODE_VERSION)

.PHONY: package
package: npm-prod
	zip -r ~/concourse-develop-status.zip index.js node_modules/

.PHONY: clean
clean:
	rm -rf node_modules/ package-lock.json concourse-develop-status.zip
