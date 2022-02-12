DEST_LIB = dist/parsegraph-$(DIST_NAME).lib.js
PROD_LIB = dist/parsegraph-$(DIST_NAME).js

all: build lint test coverage esdoc

build: $(DEST_LIB)
.PHONY: build

build-prod: $(PROD_LIB)
.PHONY: build-prod

demo: $(DEST_LIB)
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

parsegraph-$(DIST_NAME)-prod.tgz: $(PROD_LIB)
	rm -rf parsegraph-$(DIST_NAME)
	mkdir parsegraph-$(DIST_NAME)
	cp -r README.md LICENSE parsegraph-$(DIST_NAME)
	cp -r dist-prod/ parsegraph-$(DIST_NAME)/dist
	cp -r package-prod.json parsegraph-$(DIST_NAME)/package.json
	tar cvzf $@ parsegraph-$(DIST_NAME)/
	rm -rf parsegraph-$(DIST_NAME)

parsegraph-$(DIST_NAME)-dev.tgz: $(DEST_LIB)
	rm -rf parsegraph-$(DIST_NAME)
	mkdir parsegraph-$(DIST_NAME)
	cp -r -t parsegraph-$(DIST_NAME) package.json package-lock.json README.md demo/ LICENSE dist/
	tar cvzf $@ parsegraph-$(DIST_NAME)/
	rm -rf parsegraph-$(DIST_NAME)

$(DEST_LIB): package.json package-lock.json $(SCRIPT_FILES) $(GLSL_SCRIPTS)
	npm run build
	mv -v dist-types/src/* dist/
	mv dist/index.d.ts dist/parsegraph-$(DIST_NAME).d.ts
	mv dist/index.d.ts.map dist/parsegraph-$(DIST_NAME).d.ts.map

$(PROD_LIB): package.json package-lock.json $(SCRIPT_FILES)
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
