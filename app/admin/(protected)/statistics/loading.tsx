import AdminPageLayout from '@/components/admin/admin-page-layout';
import { SummarySkeleton } from '@/components/admin/statistics/summary-panels';
import styles from '@/components/admin/statistics/statistics.module.css';
export default function LoadingStatistics() {
  return <AdminPageLayout size="wide"><div className={styles.root}><h1>Estadísticas</h1><SummarySkeleton /></div></AdminPageLayout>;
}
