import assert from "node:assert/strict";
import {
  buildOgImageUrl,
  buildShareMetadataText,
} from "../src/lib/metadata-utils";
import { QUESTIONS_PER_TEST } from "../src/lib/questions";

const ogUrl = buildOgImageUrl({ index: 50, tierKey: "moderateDecline", correct: "?" });
assert.equal(
  new URLSearchParams(ogUrl.split("?")[1]).get("n"),
  String(QUESTIONS_PER_TEST),
  "OG image URL should use QUESTIONS_PER_TEST",
);

const share = buildShareMetadataText({
  siteTitle: "Cognitive Rustproof",
  tierKey: "moderateDecline",
  tierLabel: "Moderate Decline",
  index: 42,
});
assert.equal(
  share.title,
  "Cognitive Rustproof — Moderate Decline",
  "share metadata should use the localized tier label",
);
assert.match(
  share.description,
  /42/,
  "share metadata description should include the challenge score",
);
