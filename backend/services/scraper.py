from urllib.parse import urlparse

import requests
from bs4 import BeautifulSoup


HEADERS = {
    "User-Agent": "AccessFixAI/0.1 (+https://localhost) accessibility-audit-bot",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


def normalize_url(url: str) -> str:
    parsed = urlparse(url)
    if not parsed.scheme:
        return f"https://{url}"
    return url


def fetch_html(url: str) -> dict:
    normalized = normalize_url(url.strip())
    response = requests.get(normalized, headers=HEADERS, timeout=10, allow_redirects=True)
    response.raise_for_status()

    content_type = response.headers.get("content-type", "")
    if "text/html" not in content_type and "application/xhtml+xml" not in content_type:
        raise ValueError("URL did not return an HTML page")

    html = response.text
    soup = BeautifulSoup(html, "html.parser")
    title = soup.title.get_text(" ", strip=True) if soup.title else None

    return {
        "html": html,
        "source_url": response.url,
        "page_title": title,
    }
