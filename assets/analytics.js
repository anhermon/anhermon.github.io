// PostHog Cloud EU, cookieless. Project 285746 is shared with the Sababa Ivrit bot
// (VEN-39/VEN-40), so every event here is tagged source: "site" to tell them apart.
(function () {
  "use strict";
  var POSTHOG_KEY = "phc_vzjAcjG3oSwRFqrcrDh7RRsntq8VeKw2Er7yQmv4BQvF";
  var POSTHOG_HOST = "https://eu.i.posthog.com";

  if (!POSTHOG_KEY) return;

  /* eslint-disable */
  !function (t, e) { var o, n, p, r; e.__SV || (window.posthog = e, e._i = [], e.init = function (i, s, a) { function g(t, e) { var o = e.split("."); 2 == o.length && (t = t[o[0]], e = o[1]); t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } } (p = t.createElement("script")).type = "text/javascript", p.crossOrigin = "anonymous", p.async = !0, p.src = s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js", (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(p, r); var u = e; for (void 0 !== a ? u = e[a] = [] : a = "posthog", u.people = u.people || [], u.toString = function (t) { var e = "posthog"; return "posthog" !== a && (e += "." + a), t || (e += " (stub)"), e }, u.people.toString = function () { return u.toString(1) + ".people (stub)" }, o = "init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSurveysLoaded onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "), n = 0; n < o.length; n++)g(u, o[n]); e._i.push([i, s, a]) }, e.__SV = 1) }(document, window.posthog || []);
  /* eslint-enable */

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: "identified_only",
    persistence: "memory",
    autocapture: true,
    capture_pageview: true,
    session_recording: { maskAllInputs: true },
  });
  posthog.register({ source: "site" });

  window.vlTrackCTA = function (cta) {
    posthog.capture("cta_click", {
      cta: cta,
      lang: document.documentElement.lang || "en",
      page: location.pathname,
    });
  };
})();

// No-op fallback so pages can call vlTrackCTA(...) unconditionally even before this script
// finishes loading, or when POSTHOG_KEY is empty.
if (typeof window.vlTrackCTA !== "function") {
  window.vlTrackCTA = function () {};
}
