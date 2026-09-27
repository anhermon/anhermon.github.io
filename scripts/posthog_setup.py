#!/usr/bin/env python3
"""Idempotent PostHog Cloud EU dashboard setup for Venture Loop.

Creates or updates the "Venture Loop — traffic & engagement" dashboard and its
insights (pageviews, uniques, top pages, referrers, cta_click by cta, and the
pageview -> cta_click -> bot_start funnel). Safe to run twice: insights and the
dashboard are looked up by name first, then PATCHed instead of duplicated.

Needs a *personal* API key (not the public project key committed in
assets/analytics.js) — only ever run this via:

    vaultlet run --ref vaultlet://venture-loop/POSTHOG_PERSONAL_API_KEY -- \\
        python3 scripts/posthog_setup.py --project-id <id>

--dry-run works with no key and no network call at all; it just prints the
payloads that would be sent.
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.request

API_HOST = "https://eu.posthog.com"  # private API host for EU cloud (not eu.i.posthog.com, which is ingestion-only)
DASHBOARD_NAME = "Venture Loop — traffic & engagement"


def trends(name, event, breakdown=None):
    source = {"kind": "TrendsQuery", "series": [{"kind": "EventsNode", "event": event, "math": "total"}]}
    if breakdown:
        source["breakdownFilter"] = {"breakdown": breakdown, "breakdown_type": "event"}
    return {"name": name, "query": {"kind": "InsightVizNode", "source": source}}


def uniques(name, event):
    return {
        "name": name,
        "query": {
            "kind": "InsightVizNode",
            "source": {"kind": "TrendsQuery", "series": [{"kind": "EventsNode", "event": event, "math": "dau"}]},
        },
    }


def funnel(name, steps):
    return {
        "name": name,
        "query": {
            "kind": "InsightVizNode",
            "source": {
                "kind": "FunnelsQuery",
                "series": [{"kind": "EventsNode", "event": e} for e in steps],
            },
        },
    }


def build_insights():
    return [
        trends("Pageviews", "$pageview"),
        uniques("Uniques", "$pageview"),
        trends("Top pages", "$pageview", breakdown="$pathname"),
        trends("Referrers", "$pageview", breakdown="$referring_domain"),
        trends("CTA clicks by CTA", "cta_click", breakdown="cta"),
        funnel("Pageview -> CTA click -> bot start", ["$pageview", "cta_click", "bot_start"]),
    ]


def api(method, path, token, body=None):
    req = urllib.request.Request(
        f"{API_HOST}{path}",
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"{method} {path} failed: {e.code} {e.read().decode()}")


def find_by_name(items, name):
    return next((i for i in items if i.get("name") == name), None)


def ensure_dashboard(project_id, token):
    existing = api("GET", f"/api/projects/{project_id}/dashboards/?search={DASHBOARD_NAME}", token)
    match = find_by_name(existing.get("results", []), DASHBOARD_NAME)
    if match:
        return api("PATCH", f"/api/projects/{project_id}/dashboards/{match['id']}/", token, {"name": DASHBOARD_NAME})
    return api("POST", f"/api/projects/{project_id}/dashboards/", token, {"name": DASHBOARD_NAME})


def ensure_insight(project_id, token, spec, dashboard_id):
    existing = api("GET", f"/api/projects/{project_id}/insights/?search={spec['name']}", token)
    match = find_by_name(existing.get("results", []), spec["name"])
    body = dict(spec, dashboards=[dashboard_id])
    if match:
        return api("PATCH", f"/api/projects/{project_id}/insights/{match['id']}/", token, body)
    return api("POST", f"/api/projects/{project_id}/insights/", token, body)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--project-id", help="PostHog project ID (required unless --dry-run)")
    parser.add_argument("--dry-run", action="store_true", help="Print planned payloads only; no network call, no key needed")
    parser.add_argument("--selftest", action="store_true", help="Run offline assertions on payload builders and exit")
    args = parser.parse_args()

    if args.selftest:
        insights = build_insights()
        assert len(insights) == 6
        assert insights[0]["query"]["source"]["kind"] == "TrendsQuery"
        assert insights[1]["query"]["source"]["series"][0]["math"] == "dau"
        assert insights[4]["query"]["source"]["breakdownFilter"]["breakdown"] == "cta"
        assert insights[5]["query"]["source"]["kind"] == "FunnelsQuery"
        assert [s["event"] for s in insights[5]["query"]["source"]["series"]] == ["$pageview", "cta_click", "bot_start"]
        print("SELFTEST OK: payload builders")
        return

    if args.dry_run:
        print(f"Would ensure dashboard: {DASHBOARD_NAME!r}")
        for spec in build_insights():
            print(f"Would ensure insight: {spec['name']!r}")
            print(json.dumps(spec, indent=2, ensure_ascii=False))
        return

    if not args.project_id:
        sys.exit("--project-id is required (unless --dry-run)")
    token = os.environ.get("POSTHOG_PERSONAL_API_KEY")
    if not token:
        sys.exit("POSTHOG_PERSONAL_API_KEY is not set — run this via "
                  "`vaultlet run --ref vaultlet://venture-loop/POSTHOG_PERSONAL_API_KEY -- ...`")

    dashboard = ensure_dashboard(args.project_id, token)
    for spec in build_insights():
        ensure_insight(args.project_id, token, spec, dashboard["id"])
    print(f"Dashboard ready: {API_HOST}/project/{args.project_id}/dashboard/{dashboard['id']}")


if __name__ == "__main__":
    main()
