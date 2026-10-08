"""Copy the grid data from an S3-compatible bucket to the local data directory.

The api reads the grid tiles from disk (GRID_TILES_PATH). On Railway the data directory is a
volume, so the files stay between deployments and this script only downloads new or changed
objects. A file is changed when its size or its modification time is different from the object.

Configuration (environment variables):
    GRID_BUCKET_NAME: bucket to copy from. If it is not set, the script does nothing.
    GRID_BUCKET_ENDPOINT, GRID_BUCKET_REGION: S3 endpoint and region.
    GRID_BUCKET_ACCESS_KEY_ID, GRID_BUCKET_SECRET_ACCESS_KEY: bucket credentials.
    GRID_DATA_DIR: local directory that receives the bucket content. Default: /opt/api/data.

If the copy fails and the data directory already has grid/meta.json, the script logs a warning
and exits 0, so the api starts with the data it has. With no data, it exits 1.
"""

import logging
import os
import pathlib
import sys

from pyarrow import fs

logging.basicConfig(level=logging.INFO, format="[sync_grid_data] %(message)s")
log = logging.getLogger(__name__)


def sync(bucket: str, data_dir: pathlib.Path) -> tuple[int, int]:
    s3 = fs.S3FileSystem(
        access_key=os.environ["GRID_BUCKET_ACCESS_KEY_ID"],
        secret_key=os.environ["GRID_BUCKET_SECRET_ACCESS_KEY"],
        endpoint_override=os.environ.get("GRID_BUCKET_ENDPOINT"),
        region=os.environ.get("GRID_BUCKET_REGION", "auto"),
        force_virtual_addressing=True,
    )
    objects = [
        info for info in s3.get_file_info(fs.FileSelector(bucket, recursive=True)) if info.type == fs.FileType.File
    ]
    downloaded = 0
    for obj in objects:
        target = data_dir / obj.path.removeprefix(f"{bucket}/")
        mtime = obj.mtime.timestamp()
        if target.exists() and target.stat().st_size == obj.size and int(target.stat().st_mtime) == int(mtime):
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        partial = target.with_name(target.name + ".partial")
        with s3.open_input_stream(obj.path) as src, open(partial, "wb") as dst:
            while chunk := src.read(8 * 1024 * 1024):
                dst.write(chunk)
        os.utime(partial, (mtime, mtime))
        partial.replace(target)
        downloaded += 1
    return len(objects), downloaded


def main() -> int:
    bucket = os.environ.get("GRID_BUCKET_NAME")
    if not bucket:
        log.info("GRID_BUCKET_NAME is not set. Skip the sync.")
        return 0
    data_dir = pathlib.Path(os.environ.get("GRID_DATA_DIR", "/opt/api/data"))
    try:
        total, downloaded = sync(bucket, data_dir)
    except Exception:
        if (data_dir / "grid" / "meta.json").exists():
            log.warning("The sync failed. Start with the data that is on disk.", exc_info=True)
            return 0
        log.exception("The sync failed and there is no data on disk.")
        return 1
    log.info("%d objects in the bucket, %d downloaded.", total, downloaded)
    return 0


if __name__ == "__main__":
    sys.exit(main())
