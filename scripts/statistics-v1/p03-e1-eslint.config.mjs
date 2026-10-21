import nextVitals from 'eslint-config-next/core-web-vitals';
import parser from '@typescript-eslint/parser';
import plugin from '@typescript-eslint/eslint-plugin';
const files=['lib/admin/permissions.ts','components/admin/admin-nav-config.ts','components/admin/layout/admin-nav-list.tsx','lib/statistics/summary-principal.ts','lib/statistics/summary-route-server.ts','lib/statistics/summary-transport.ts','lib/statistics/p03-e1.verify.ts'];
export default [...nextVitals.map(config=>({...config,files})),{files,languageOptions:{parser},plugins:{'@typescript-eslint':plugin},rules:{...plugin.configs.recommended.rules,'@typescript-eslint/no-unused-vars':['error',{caughtErrors:'none'}]}}];
