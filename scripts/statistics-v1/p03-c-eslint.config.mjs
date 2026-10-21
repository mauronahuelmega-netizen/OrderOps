// Own P03-C TypeScript lint; does not change the shared Next.js lint configuration.
import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';
export default [{
  files:['lib/statistics/summary*.ts'],
  languageOptions:{parser,parserOptions:{ecmaVersion:'latest',sourceType:'module'}},
  plugins:{'@typescript-eslint':plugin},
  rules:{...plugin.configs.recommended.rules,'@typescript-eslint/no-unused-vars':['error',{caughtErrors:'none'}]},
}];
