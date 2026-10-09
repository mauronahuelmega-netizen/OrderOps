-- Local rollback for Commercial Core PHASE-01, including enqueue.
-- Do not run if a later commercial migration is applied.
-- This file is not executed by P01-T02 or P01-T04.

drop schema if exists commercial cascade;
