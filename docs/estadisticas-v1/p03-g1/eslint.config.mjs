import nextVitals from 'eslint-config-next/core-web-vitals';
import parser from '@typescript-eslint/parser';import plugin from '@typescript-eslint/eslint-plugin';
const files=['lib/statistics/statistics-publication-*.ts','lib/statistics/summary-server.ts','lib/statistics/summary-route-server.ts','lib/statistics/summary-transport.ts','lib/statistics/products-*.ts','lib/statistics/products.verify.ts','lib/statistics/p03-g1*.ts','app/admin/(protected)/statistics/page.tsx','app/admin/(protected)/statistics/query/route.ts'];
export default [...nextVitals.map(c=>({...c,files})),{files,languageOptions:{parser},plugins:{'@typescript-eslint':plugin},rules:{...plugin.configs.recommended.rules,'@typescript-eslint/no-unused-vars':['error',{caughtErrors:'none'}]}}];
