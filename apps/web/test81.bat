call npx tsc --noEmit
call npx tsc -p tsconfig.brave-test.json
call node --test .test-dist/company-identity-cleaner.test.js
call npm run build
