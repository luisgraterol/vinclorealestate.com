"""Import each job module here so it registers itself."""

from tasks.web_extractor.jobs import (  # noqa: F401
    dbpr_fl_lodging,
    miami_dade_parcels,
    nashville_str_permits,
    sunbiz_fl,
)
