'use client';
import styles from '@/components/admin/statistics/statistics.module.css';
export default function StatisticsError({ reset }: { reset: () => void }) {
  return <div className={styles.root}><section className={styles.error} role="alert"><h1>Estadísticas</h1><h2>No pudimos abrir el Resumen</h2><p>Volvé a intentar. No se muestran datos sin verificar.</p><button type="button" className={styles.primary} onClick={reset}>Volver a intentar</button></section></div>;
}
