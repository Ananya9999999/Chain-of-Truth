"""One reentrant lock guarding every write to the database.

Two things need serialising, and they turn out to be the same thing:

  * Sequence allocation. Both the case ledger and the audit log read the current
    tail to pick the next seq, so read-then-insert must be atomic.
  * SQLite writes. SQLite allows one writer at a time. A request that INSERTs an
    evidence row and *then* appends to the chain holds a write transaction open
    across both, so two concurrent uploads collide with "database is locked"
    unless the whole operation is serialised -- not just the chain append.

The lock is reentrant because a write operation (log_evidence) nests further
locked calls inside it (append_entry, audit.record).

SQLite plus one uvicorn worker is the hackathon deployment. On a multi-worker or
multi-process deployment this in-process lock is not enough on its own -- the
UNIQUE constraints on (case_id, seq) and audit seq are the correctness backstop,
and Postgres with SELECT ... FOR UPDATE is the real answer at that point.
"""
from __future__ import annotations

import threading

chain_lock = threading.RLock()

# Same lock, named for the broader use: hold it for an entire write operation
# (stage rows -> append chain entry -> commit), not merely the chain append.
write_lock = chain_lock
