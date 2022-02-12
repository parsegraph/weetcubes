all: build lint test coverage esdoc

build: dist/parsegraph-$(DIST_NAME).js
.PHONY: build

build-prod: dist-prod/parsegraph-$(DIST_NAME).js
.PHONY: build-prod

demo: dist/parsegraph-$(DIST_NAME).js
	npm run demo
.PHONY: demo

check:
	npm run test
.PHONY: check

test: check
.PHONY: test

coverage:
	npm run coverage
.PHONY: coverage

prettier:
	npx prettier --write src test demo
.PHONY: prettier

lint:
	npx eslint --fix $(SCRIPT_FILES)
.PHONY: lint

esdoc:
	npx esdoc
.PHONY: esdoc

doc: esdoc
.PHONY: doc

tar: parsegraph-$(DIST_NAME)-dev.tgz
.PHONY: tar

tar-prod: parsegraph-$(DIST_NAME)-prod.tgz
.PHONY: tar

parsegraph-$(DIST_NAME)-prod.tgz: dist-prod/parsegraph-$(DIST_NAME).js
	rm -rf parsegraph-$(DIST_NAME)
	mkdir parsegraph-$(DIST_NAME)
	cp -r README.md LICENSE parsegraph-$(DIST_NAME)
	cp -r dist-prod/ parsegraph-$(DIST_NAME)/dist
	cp -r package-prod.json parsegraph-$(DIST_NAME)/package.json
	tar cvzf $@ parsegraph-$(DIST_NAME)/
	rm -rf parsegraph-$(DIST_NAME)

parsegraph-$(DIST_NAME)-dev.tgz: dist/parsegraph-$(DIST_NAME).js
	rm -rf parsegraph-$(DIST_NAME)
	mkdir parsegraph-$(DIST_NAME)
	cp -r -t parsegraph-$(DIST_NAME) package.json package-lock.json README.md demo/ LICENSE dist/
	tar cvzf $@ parsegraph-$(DIST_NAME)/
	rm -rf parsegraph-$(DIST_NAME)

dist/parsegraph-$(DIST_NAME).js: package.json package-lock.json $(SCRIPT_FILES) $(GLSL_SCRIPTS)
	npm run build
	mv -v dist-types/src/* dist/
	mv dist/index.d.ts dist/parsegraph-$(DIST_NAME).d.ts
	mv dist/index.d.ts.map dist/parsegraph-$(DIST_NAME).d.ts.map

dist-prod/parsegraph-$(DIST_NAME).js: package.json package-lock.json $(SCRIPT_FILES)
	npm run build-prod
	mv -v dist-types/src/* dist-prod/
	mv dist-prod/index.d.ts dist-prod/parsegraph-$(DIST_NAME).d.ts
	mv dist-prod/index.d.ts.map dist-prod/parsegraph-$(DIST_NAME).d.ts.map

clean:
	rm -rf dist dist-types dist-prod .nyc_output parsegraph-$(DIST_NAME) parsegraph-$(DIST_NAME)-dev.tgz parsegraph-$(DIST_NAME)-prod.tgz
.PHONY: clean

build-container:
	podman build . -t parsegraph-$(DIST_NAME)
.PHONY: build-container

run-container: build-container stop-container
	podman run -e SITE_ROOT=$(DEMO_ROOT) -w /usr/src/ --name parsegraph-$(DIST_NAME) -it -p$(DEMO_PORT):3000 localhost/parsegraph-$(DIST_NAME):latest npm run demo
.PHONY: run-container

stop-container:
	podman stop parsegraph-$(DIST_NAME); podman rm parsegraph-$(DIST_NAME); true
.PHONY: stop-container
