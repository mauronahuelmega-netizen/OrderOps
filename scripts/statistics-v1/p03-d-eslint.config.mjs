import nextVitals from 'eslint-config-next/core-web-vitals';
import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';
const files=['components/admin/statistics/**/*.tsx','app/admin/(protected)/statistics/**/*.tsx','app/admin/(protected)/statistics/**/*.ts','lib/statistics/summary-route-server.ts','lib/statistics/summary-chart.ts'];
export default [...nextVitals.map(config=>({...config,files})),{
  files,languageOptions:{parser},plugins:{'@typescript-eslint':plugin},
  rules:{...plugin.configs.recommended.rules,'@typescript-eslint/no-unused-vars':['error',{caughtErrors:'none'}]},
}];
