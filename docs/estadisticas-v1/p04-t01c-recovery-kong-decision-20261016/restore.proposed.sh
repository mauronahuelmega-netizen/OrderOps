#!/bin/sh
# FUTURE LAB ONLY. Never invoked during preparation. Stages are deliberately not retried.
set -eu
umask 077
test "${RECOVERY_PLAN_ACK:-}" = 'orderops-recovery-20261016-a'
test "${RECOVERY_LAB_ID:-}" != '592f44984962a26c6552ccb02937d56385a8db008eb8e7a27e8be2d932f77bd1'
test "$(hostname)" = "$(printf '%s' "$RECOVERY_LAB_ID" | cut -c 1-12)"
test "$(id -un)" = 'postgres'
test ! -e /qa/pgdata
for bin in initdb pg_ctl pg_restore pg_dump psql dropdb timeout sha256sum; do command -v "$bin" >/dev/null; done
unset PGHOSTADDR PGSERVICE PGSERVICEFILE PGPASSFILE PGPASSWORD PGDATABASE PGOPTIONS
export PGHOST=/qa/socket PGPORT=56442 PGUSER=postgres TMPDIR=/qa/tmp
mkdir /qa/private /qa/socket /qa/tmp
printf '%s  %s\n' b48f1ed8f4f6a6a75f946a2a55b388f88f20c6d05cc48fecf42cd166af1eecdc /qa/input/backup.dump | sha256sum -c - >/qa/private/hash.log
timeout --signal=TERM --kill-after=5s 60s initdb -D /qa/pgdata -U postgres --auth-local=trust --auth-host=reject --encoding=UTF8 --locale=C.UTF-8 >/qa/private/init.log 2>&1
# No vendor entrypoint, original pgdata/config, external sockets, or network listeners.
# pg_net worker is directed away from the restored database; no queue processing there.
timeout --signal=TERM --kill-after=5s 40s pg_ctl -D /qa/pgdata -l /qa/private/server.log -o "-c listen_addresses='' -c unix_socket_directories=/qa/socket -p 56442 -c max_connections=10 -c shared_buffers=32MB -c work_mem=4MB -c maintenance_work_mem=32MB -c statement_timeout=15000 -c lock_timeout=3000 -c wal_level=logical -c max_wal_senders=0 -c max_replication_slots=0 -c shared_preload_libraries=pg_stat_statements,pg_net -c pg_net.database_name=template1" -w -t 30 start >/qa/private/start.log 2>&1
timeout --signal=TERM --kill-after=5s 30s psql -X -w -v ON_ERROR_STOP=1 -d postgres -f /qa/input/roles.sql >/qa/private/roles.log 2>&1
# Only the disposable cluster's empty bootstrap DB is removed so --create can restore postgres.
timeout --signal=TERM --kill-after=5s 30s dropdb -w postgres >/qa/private/drop-bootstrap.log 2>&1
# --create deliberately restores DATABASE, ACL and DATABASE PROPERTIES; do not combine with -1.
# No --clean, exclusions, --no-owner, --no-acl, --disable-triggers, or parallel workers.
timeout --signal=TERM --kill-after=5s 180s pg_restore --create --exit-on-error --no-password --jobs=1 --dbname=template1 /qa/input/backup.dump >/qa/private/restore.log 2>&1
printf '%s\n' RESTORE_COMPLETE
