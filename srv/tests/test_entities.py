from common.entities import entity_key, looks_like_entity


def test_looks_like_entity():
    assert looks_like_entity("1002 SUNRISES LLC")
    assert looks_like_entity("Beachcomber Investments Corp")
    assert looks_like_entity("SMITH FAMILY TRUST")
    assert not looks_like_entity("Carlos Fernando Gomez")
    assert not looks_like_entity("")
    assert not looks_like_entity(None)


def test_entity_key_matches_across_spellings():
    # Same entity, different punctuation/suffix across sources -> same key.
    assert entity_key("SUN LLC") == entity_key("Sun, L.L.C.")
    assert entity_key("1002 SUNRISES LLC") == entity_key("1002 SUNRISES, LLC")
    assert entity_key("The Palm Group Inc") == entity_key("PALM GROUP, INC.")


def test_entity_key_distinguishes_different_entities():
    assert entity_key("SUN LLC") != entity_key("MOON LLC")
