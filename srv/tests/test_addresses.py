from common.addresses import norm_city, norm_street, norm_unit


def test_norm_street_canonicalizes_suffix_and_direction():
    assert norm_street("1340 Collins Avenue") == "1340 COLLINS AVE"
    assert norm_street("3317 West 111 Street") == "3317 W 111 ST"
    assert norm_street("  100   Ocean   Dr.  ") == "100 OCEAN DR"


def test_norm_street_matches_across_sources():
    # DBPR and the county spell the same street slightly differently.
    assert norm_street("1 Fisher Island Dr") == norm_street("1 FISHER ISLAND DRIVE")


def test_norm_unit_strips_unit_words():
    assert norm_unit("UNIT 101") == "101"
    assert norm_unit("101") == "101"
    assert norm_unit("Apt #5-B") == "5B"
    assert norm_unit("") == ""
    assert norm_unit(None) == ""


def test_norm_city():
    assert norm_city("  Miami  Beach ") == "MIAMI BEACH"
    assert norm_city(None) == ""
