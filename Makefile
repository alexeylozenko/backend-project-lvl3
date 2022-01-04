pre-publish: install test test-coverage lint

install:
		npm ci

test:
		npm test

lint:
		npx eslint .

test-coverage:
		rm -rf coverage
		npm test --  --coverage --coverageProvider=v8
	
