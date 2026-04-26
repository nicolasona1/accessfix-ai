from bs4 import BeautifulSoup


GENERIC_LINKS = {"click here", "read more", "here", "more"}


def _snippet(tag) -> str:
    snippet = " ".join(str(tag).split())
    return snippet if len(snippet) <= 520 else f"{snippet[:520]}..."


def _issue(issue_type: str, severity: str, title: str, tag, suggestion: str) -> dict:
    return {
        "type": issue_type,
        "severity": severity,
        "title": title,
        "snippet": _snippet(tag),
        "suggestion": suggestion,
    }


def _title_with_count(title: str, count: int) -> str:
    return title if count == 1 else f"{title} ({count} found)"


def _aggregate(issues: list[dict]) -> list[dict]:
    grouped: dict[str, dict] = {}
    for item in issues:
        key = item["type"]
        if key not in grouped:
            grouped[key] = {**item, "count": 1, "_snippets": [item["snippet"]]}
            continue
        grouped[key]["count"] += 1
        if len(grouped[key]["_snippets"]) < 3:
            grouped[key]["_snippets"].append(item["snippet"])

    aggregated = []
    for item in grouped.values():
        snippets = item.pop("_snippets")
        item["title"] = _title_with_count(item["title"], item["count"])
        item["snippet"] = "\n".join(snippets)
        aggregated.append(item)
    return aggregated


def _has_label(soup: BeautifulSoup, tag) -> bool:
    field_id = tag.get("id")
    if field_id and soup.select_one(f'label[for="{field_id}"]'):
        return True
    return bool(tag.find_parent("label") or tag.get("aria-label") or tag.get("aria-labelledby"))


def parse_accessibility_issues(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    issues: list[dict] = []

    html_tag = soup.find("html")
    if not html_tag or not html_tag.get("lang"):
        issues.append({
            "type": "missing-lang",
            "severity": "Medium",
            "title": "Missing page language",
            "snippet": "<html>",
            "suggestion": 'Add lang="en" to the html element.',
        })

    for img in soup.find_all("img"):
        if not img.has_attr("alt"):
            issues.append(_issue("missing-alt", "Critical", "Image is missing alt text", img, "Add descriptive alt text and mark AI suggestions for review."))
        elif not img.get("alt", "").strip() and not img.get("role"):
            issues.append(_issue("empty-alt", "Critical", "Content image has empty alt text", img, "Use empty alt text only for decorative images."))

    for button in soup.find_all("button"):
        if not button.get_text(strip=True) and not button.get("aria-label"):
            issues.append(_issue("unlabeled-button", "Critical", "Button has no accessible name", button, "Add visible text or aria-label."))

    for link in soup.find_all("a"):
        if link.get_text(" ", strip=True).lower() in GENERIC_LINKS:
            issues.append(_issue("generic-link", "High", "Link text is too generic", link, "Use link text that describes the destination."))

    for field in soup.find_all(["input", "textarea", "select"]):
        if field.get("type") != "hidden" and not _has_label(soup, field):
            issues.append(_issue("missing-label", "High", "Form field is missing a label", field, "Associate a label with this field."))

    previous_level = 0
    for heading in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"]):
        level = int(heading.name[1])
        if previous_level and level > previous_level + 1:
            issues.append(_issue("heading-order", "Medium", "Heading level skips structure", heading, "Use sequential heading levels."))
        previous_level = level

    for tag in soup.select("div[onclick], span[onclick]"):
        if not tag.get("role") and not tag.get("tabindex"):
            issues.append(_issue("missing-role", "Medium", "Clickable element is missing role and keyboard focus", tag, 'Use a button or add role="button" and keyboard support.'))

    return _aggregate(issues)
