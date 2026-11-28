from tasks.web_extractor.jobs.sunbiz_fl import RECORD_LENGTH, parse_record


def place(record: list[str], start: int, value: str) -> None:
    """Write `value` at 1-based position `start`."""
    for i, ch in enumerate(value):
        record[start - 1 + i] = ch


def make_record(name="SUN LLC", status="A", etype="FLAL", officer="DOE JOHN") -> str:
    record = [" "] * RECORD_LENGTH
    place(record, 13, name)  # corporation name
    place(record, 205, status)  # status
    place(record, 206, etype)  # filing type
    place(record, 669, "MGRM")  # officer 1 title
    place(record, 674, officer)  # officer 1 name
    place(record, 716, "1 MAIN ST")  # officer 1 address
    return "".join(record)


def test_parse_record_extracts_llc_and_officer():
    parsed = parse_record(make_record())
    assert parsed is not None
    assert parsed["name"] == "SUN LLC"
    assert parsed["entity_type"] == "FLAL"
    assert parsed["officers"][0]["name"] == "DOE JOHN"
    assert parsed["officers"][0]["address"] == "1 MAIN ST"


def test_parse_record_skips_inactive():
    assert parse_record(make_record(status="I")) is None


def test_parse_record_skips_non_llc():
    assert parse_record(make_record(etype="DOMP")) is None
