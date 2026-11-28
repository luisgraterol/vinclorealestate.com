"""CLI for the `web-extractor` task: runs a job and leaves its raw data in upstream."""

from __future__ import annotations

import argparse
import logging
import os
import sys
from datetime import UTC, date, datetime

from common.jsonl import RawWriter
from common.logs import setup_logging
from common.paths import new_run_id, raw_key
from common.storage import storage_from_uri
from tasks.web_extractor.base import job_context
from tasks.web_extractor.registry import all_jobs, get_job

log = logging.getLogger("web-extractor")


def parse_args(argv: list[str] | None) -> argparse.Namespace:
    p = argparse.ArgumentParser(prog="web-extractor", description=__doc__)
    p.add_argument("--job", help="job to run")
    p.add_argument("--list", action="store_true", help="list the available jobs")
    p.add_argument("--date", type=date.fromisoformat, help="run date (UTC by default)")
    p.add_argument(
        "--upstream",
        default=os.environ.get("UPSTREAM_URI"),
        help="s3://bucket or local folder (defaults to $UPSTREAM_URI)",
    )
    args = p.parse_args(argv)
    if not args.list and not args.job:
        p.error("falta --job (o usa --list)")
    if args.job and not args.upstream:
        p.error("falta --upstream o la variable UPSTREAM_URI")
    return args


def run(
    job_name: str, upstream_uri: str, run_date: date | None = None, context_factory=job_context
) -> int:
    job = get_job(job_name)
    now = datetime.now(UTC)
    run_date = run_date or now.date()
    run_id = new_run_id(now)
    key = raw_key(job.name, run_date, run_id)
    storage = storage_from_uri(upstream_uri)
    log.info("job=%s run_id=%s destination=%s/%s", job.name, run_id, storage.uri, key)

    with RawWriter(storage, key, job.name, run_id) as writer, context_factory() as ctx:
        ctx.upstream = storage
        ctx.run_date = run_date
        for item in job.extract(ctx):
            writer.write(item.source_url, item.data)

    if writer.count == 0:
        log.error("job %s returned no records", job.name)
        return 2
    log.info("done: %d records", writer.count)
    return 0


def main(argv: list[str] | None = None) -> int:
    setup_logging()
    args = parse_args(argv)
    if args.list:
        for name, cls in all_jobs().items():
            print(f"{name}\t{cls.description}")
        return 0
    return run(args.job, args.upstream, args.date)


if __name__ == "__main__":
    sys.exit(main())
