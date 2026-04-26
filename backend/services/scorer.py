RULES = {
    "missing-alt": {"base": 15, "cap": 25},
    "empty-alt": {"base": 15, "cap": 20},
    "unlabeled-button": {"base": 15, "cap": 18},
    "generic-link": {"base": 8, "cap": 12},
    "missing-label": {"base": 8, "cap": 16},
    "heading-order": {"base": 3, "cap": 8},
    "missing-lang": {"base": 3, "cap": 3},
    "missing-role": {"base": 3, "cap": 8},
}

FALLBACK_PENALTIES = {
    "Critical": 12,
    "High": 6,
    "Medium": 2,
}


def score_issues(issues: list[dict]) -> int:
    penalty = 0
    for issue in issues:
        count = issue.get("count", 1)
        rule = RULES.get(issue["type"])
        if rule:
            penalty += min(rule["base"] * count, rule["cap"])
        else:
            penalty += FALLBACK_PENALTIES.get(issue["severity"], 0)

    score = 100 - penalty
    return max(0, score)
