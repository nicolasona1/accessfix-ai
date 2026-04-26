export const demoHtml = `<!DOCTYPE html>
<html>
<body>
  <img src="logo.png">
  <h1>Contact Us</h1>
  <h3>Fill out the form below</h3>
  <input type="text" placeholder="Your name">
  <input type="email" placeholder="Email">
  <button></button>
  <a href="/about">Click here</a>
  <img src="team.jpg">
  <div onclick="submitForm()">Submit</div>
</body>
</html>`;

const critical = "Critical";
const high = "High";
const medium = "Medium";
const genericLinks = new Set(["click here", "read more", "here", "more"]);

const serialize = (element) => {
  const snippet = element.outerHTML.replace(/\s+/g, " ").trim();
  return snippet.length <= 520 ? snippet : `${snippet.slice(0, 520)}...`;
};
const text = (element) => element.textContent.trim().replace(/\s+/g, " ");

const hasLabel = (doc, input) => {
  const id = input.getAttribute("id");
  if (id && doc.querySelector(`label[for="${CSS.escape(id)}"]`)) return true;
  return Boolean(input.closest("label") || input.getAttribute("aria-label") || input.getAttribute("aria-labelledby"));
};

const issue = (type, severity, title, element, suggestion) => ({
  id: `${type}-${Math.random().toString(36).slice(2, 9)}`,
  type,
  severity,
  title,
  snippet: serialize(element),
  suggestion,
  count: 1
});

const titleWithCount = (title, count) => count === 1 ? title : `${title} (${count} found)`;

const aggregateIssues = (issues) => {
  const grouped = new Map();
  issues.forEach((item) => {
    if (!grouped.has(item.type)) {
      grouped.set(item.type, { ...item, count: 1, snippets: [item.snippet] });
      return;
    }
    const current = grouped.get(item.type);
    current.count += 1;
    if (current.snippets.length < 3) current.snippets.push(item.snippet);
  });

  return Array.from(grouped.values()).map(({ snippets, ...item }) => ({
    ...item,
    title: titleWithCount(item.title, item.count),
    snippet: snippets.join("\n")
  }));
};

export function parseAccessibilityIssues(htmlString) {
  const doc = new DOMParser().parseFromString(htmlString, "text/html");
  const issues = [];

  if (!doc.documentElement.getAttribute("lang")) {
    issues.push({
      id: "missing-lang",
      type: "missing-lang",
      severity: medium,
      title: "Missing page language",
      snippet: "<html>",
      suggestion: "Add lang=\"en\" to the html element so screen readers choose the right pronunciation."
    });
  }

  doc.querySelectorAll("img").forEach((img) => {
    if (!img.hasAttribute("alt")) {
      issues.push(issue("missing-alt", critical, "Image is missing alt text", img, "Add descriptive alt text and mark AI suggestions for human review."));
    } else if (img.getAttribute("alt").trim() === "" && !img.getAttribute("role")) {
      issues.push(issue("empty-alt", critical, "Content image has empty alt text", img, "Use empty alt text only for decorative images."));
    }
  });

  doc.querySelectorAll("button").forEach((button) => {
    if (!text(button) && !button.getAttribute("aria-label")) {
      issues.push(issue("unlabeled-button", critical, "Button has no accessible name", button, "Add visible text or an aria-label that describes the action."));
    }
  });

  doc.querySelectorAll("a").forEach((link) => {
    if (genericLinks.has(text(link).toLowerCase())) {
      issues.push(issue("generic-link", high, "Link text is too generic", link, "Replace vague link text with the destination or action."));
    }
  });

  doc.querySelectorAll("input, textarea, select").forEach((input) => {
    if (input.type !== "hidden" && !hasLabel(doc, input)) {
      issues.push(issue("missing-label", high, "Form field is missing a label", input, "Associate a label with this field instead of relying only on placeholder text."));
    }
  });

  let previousLevel = 0;
  doc.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => {
    const level = Number(heading.tagName.slice(1));
    if (previousLevel && level > previousLevel + 1) {
      issues.push(issue("heading-order", medium, "Heading level skips structure", heading, "Use sequential heading levels so assistive tech users can navigate the outline."));
    }
    previousLevel = level;
  });

  doc.querySelectorAll("div[onclick], span[onclick]").forEach((el) => {
    if (!el.getAttribute("role") && !el.getAttribute("tabindex")) {
      issues.push(issue("missing-role", medium, "Clickable element is missing role and keyboard focus", el, "Use a real button or add role=\"button\" and keyboard support."));
    }
  });

  return aggregateIssues(issues);
}

export function calculateScore(issues) {
  const rules = {
    "missing-alt": { base: 15, cap: 25 },
    "empty-alt": { base: 15, cap: 20 },
    "unlabeled-button": { base: 15, cap: 18 },
    "generic-link": { base: 8, cap: 12 },
    "missing-label": { base: 8, cap: 16 },
    "heading-order": { base: 3, cap: 8 },
    "missing-lang": { base: 3, cap: 3 },
    "missing-role": { base: 3, cap: 8 }
  };
  const fallback = { Critical: 12, High: 6, Medium: 2 };
  const penalty = issues.reduce((sum, item) => {
    const count = item.count || 1;
    const rule = rules[item.type];
    if (rule) return sum + Math.min(rule.base * count, rule.cap);
    return sum + (fallback[item.severity] || 0);
  }, 0);
  const score = 100 - penalty;
  return Math.max(0, score);
}

export function summarizeIssues(issues) {
  return {
    Critical: issues.filter((item) => item.severity === critical).reduce((sum, item) => sum + (item.count || 1), 0),
    High: issues.filter((item) => item.severity === high).reduce((sum, item) => sum + (item.count || 1), 0),
    Medium: issues.filter((item) => item.severity === medium).reduce((sum, item) => sum + (item.count || 1), 0)
  };
}

export function generateScreenReaderScript(htmlString) {
  const doc = new DOMParser().parseFromString(htmlString, "text/html");
  const tokens = [];
  const add = (el, spoken, isIssue = false) => {
    if (spoken && spoken.trim()) tokens.push({ text: spoken.trim(), tag: el.tagName?.toLowerCase() || "html", isIssue });
  };

  doc.body.querySelectorAll("h1,h2,h3,h4,h5,h6,img,button,a,input,textarea,select,div[onclick],span[onclick]").forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) add(el, `heading level ${tag.slice(1)}, ${text(el)}`);
    if (tag === "img") add(el, el.getAttribute("alt") ? `${el.getAttribute("alt")}, image` : "image", !el.getAttribute("alt"));
    if (tag === "button") add(el, `${text(el) || el.getAttribute("aria-label") || "button"}${text(el) || el.getAttribute("aria-label") ? ", button" : ""}`, !text(el) && !el.getAttribute("aria-label"));
    if (tag === "a") add(el, `${text(el) || "link"}, link`, genericLinks.has(text(el).toLowerCase()));
    if (["input", "textarea", "select"].includes(tag)) {
      const label = el.getAttribute("aria-label") || el.getAttribute("placeholder") || "edit text";
      add(el, `${label}, edit text`, !el.getAttribute("aria-label") && !el.closest("label"));
    }
    if ((tag === "div" || tag === "span") && el.getAttribute("onclick")) {
      add(el, `${text(el) || "clickable item"}`, !el.getAttribute("role"));
    }
  });

  return tokens;
}

const labelForInput = (input) => {
  const placeholder = input.getAttribute("placeholder") || "Field";
  if (/name/i.test(placeholder)) return "Enter your full name";
  if (/email/i.test(placeholder) || input.type === "email") return "Enter your email address";
  return placeholder;
};

export function applyAccessibleFixes(htmlString) {
  const doc = new DOMParser().parseFromString(htmlString, "text/html");
  doc.documentElement.setAttribute("lang", doc.documentElement.getAttribute("lang") || "en");

  doc.querySelectorAll("img").forEach((img) => {
    if (!img.getAttribute("alt")) {
      const src = img.getAttribute("src") || "";
      const alt = /logo/i.test(src) ? "Company logo" : /team/i.test(src) ? "Our founding team" : "Descriptive image";
      img.setAttribute("alt", alt);
      img.setAttribute("data-ai-suggested", "true");
    }
  });

  doc.querySelectorAll("h3").forEach((heading) => {
    const previous = heading.previousElementSibling;
    if (previous?.tagName?.toLowerCase() === "h1") {
      const h2 = doc.createElement("h2");
      h2.innerHTML = heading.innerHTML;
      heading.replaceWith(h2);
    }
  });

  doc.querySelectorAll("input, textarea, select").forEach((input, index) => {
    if (hasLabel(doc, input) || input.type === "hidden") return;
    const id = input.getAttribute("id") || `field-${index + 1}`;
    input.setAttribute("id", id);
    input.setAttribute("aria-label", labelForInput(input));
  });

  doc.querySelectorAll("button").forEach((button) => {
    if (!text(button) && !button.getAttribute("aria-label")) button.textContent = "Submit form";
  });

  doc.querySelectorAll("a").forEach((link) => {
    if (genericLinks.has(text(link).toLowerCase())) link.textContent = "Learn more about our company";
  });

  doc.querySelectorAll("div[onclick], span[onclick]").forEach((el) => {
    if (!el.getAttribute("role")) el.setAttribute("role", "button");
    if (!el.getAttribute("tabindex")) el.setAttribute("tabindex", "0");
  });

  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
}

export function buildFixCards(issues) {
  return issues.map((item) => ({
    ...item,
    fixed_html: item.suggestion,
    explanation: `${item.title}. This fix improves the accessible name, document structure, or navigation context for assistive technology users.`,
    confidence: item.type.includes("alt") ? "Medium - review image meaning" : "High"
  }));
}
