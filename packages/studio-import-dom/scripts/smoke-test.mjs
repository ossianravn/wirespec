import { readFile } from "node:fs/promises";

import {
  compareImplementationToSourceMap,
  inferWireSpecFromDom,
} from "../src/index.js";
import {
  buildSourceMap,
  buildVariantRefs,
  parseWireSpecDocument,
} from "../../runtime/dist/index.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const fixtureSource = await readFile(
  new URL("../../runtime/fixtures/login.wirespec.md", import.meta.url),
  "utf8",
);
const document = parseWireSpecDocument(fixtureSource, "fixtures/login.wirespec.md");
const sourceMap = buildSourceMap(document, {
  entryFile: "fixtures/login.wirespec.md",
  variantRefs: buildVariantRefs(document),
});

const hookedSnapshot = {
  tagName: "body",
  attributes: {},
  text: "Welcome back Work account email Password Forgot your password? Remember me Continue Contact support",
  children: [
    {
      tagName: "div",
      attributes: { "data-ws-id": "login" },
      text: "Welcome back Work account email Password Forgot your password? Remember me Continue Contact support",
      children: [
        {
          tagName: "main",
          attributes: { "data-ws-id": "content" },
          text: "Welcome back Work account email Password Forgot your password? Remember me Continue Contact support",
          children: [
            {
              tagName: "section",
              attributes: { "data-ws-id": "auth-card" },
              text: "Welcome back Work account email Password Forgot your password? Remember me Continue Contact support",
              children: [
                {
                  tagName: "h1",
                  attributes: { "data-ws-id": "title" },
                  text: "Welcome back",
                  children: [],
                },
                {
                  tagName: "p",
                  attributes: { "data-ws-id": "intro" },
                  text: "Use your work email and password.",
                  children: [],
                },
                {
                  tagName: "form",
                  attributes: { "data-ws-id": "login-form" },
                  text: "Work account email Password Forgot your password? Remember me Continue Contact support",
                  children: [
                    {
                      tagName: "label",
                      attributes: {},
                      text: "Work account email",
                      children: [
                        {
                          tagName: "input",
                          attributes: { "data-ws-id": "email", type: "email", name: "email" },
                          text: "",
                          children: [],
                        },
                      ],
                    },
                    {
                      tagName: "label",
                      attributes: {},
                      text: "Password",
                      children: [
                        {
                          tagName: "input",
                          attributes: { "data-ws-id": "password", type: "password", name: "password" },
                          text: "",
                          children: [],
                        },
                      ],
                    },
                    {
                      tagName: "div",
                      attributes: { "data-ws-id": "assistive-row" },
                      text: "Forgot your password? Remember me",
                      children: [
                        {
                          tagName: "a",
                          attributes: { "data-ws-id": "forgot", href: "/forgot-password" },
                          text: "Forgot your password?",
                          children: [],
                        },
                        {
                          tagName: "label",
                          attributes: {},
                          text: "Remember me",
                          children: [
                            {
                              tagName: "input",
                              attributes: { "data-ws-id": "remember", type: "checkbox", name: "remember" },
                              text: "",
                              children: [],
                            },
                          ],
                        },
                      ],
                    },
                    {
                      tagName: "div",
                      attributes: { "data-ws-id": "primary-actions" },
                      text: "Continue Contact support",
                      children: [
                        {
                          tagName: "button",
                          attributes: { "data-ws-id": "submit", hidden: "" },
                          text: "Continue",
                          children: [],
                        },
                        {
                          tagName: "button",
                          attributes: {},
                          text: "Contact support",
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const comparison = compareImplementationToSourceMap(sourceMap, hookedSnapshot, {
  variantKey: "mobile+error",
});
assert(comparison.hooksFound, "Hooked implementation should report WireSpec hooks.");
assert(
  comparison.items.some((item) => item.kind === "label-mismatch" && item.targetId === "node:email"),
  "Comparison should flag label drift on hooked controls.",
);
assert(
  comparison.items.some((item) => item.kind === "primary-action-hidden"),
  "Comparison should detect hidden primary actions.",
);
assert(
  comparison.items.some((item) => item.kind === "missing-state-node" && item.targetId === "node:form-error"),
  "Comparison should detect missing state-specific implementation nodes.",
);
assert(
  comparison.items.some((item) => item.kind === "unexpected-node"),
  "Comparison should flag unlinked implementation nodes.",
);

const inferred = inferWireSpecFromDom({
  tagName: "body",
  attributes: {},
  text: "Reset password Email address Continue",
  children: [
    {
      tagName: "main",
      attributes: {},
      text: "Reset password Email address Continue",
      children: [
        {
          tagName: "h1",
          attributes: {},
          text: "Reset password",
          children: [],
        },
        {
          tagName: "form",
          attributes: {},
          text: "Email address Continue",
          children: [
            {
              tagName: "label",
              attributes: {},
              text: "Email address",
              children: [
                {
                  tagName: "input",
                  attributes: { type: "email", name: "email", required: "" },
                  text: "",
                  children: [],
                },
              ],
            },
            {
              tagName: "button",
              attributes: { type: "submit" },
              text: "Continue",
              children: [],
            },
          ],
        },
      ],
    },
  ],
}, {
  documentId: "reset-password-import",
  documentTitle: "Reset password import",
});

assert(inferred.inferred, "DOM fallback should mark the result as inferred.");
assert(inferred.warnings.length >= 2, "DOM fallback should include inference warnings.");
assert(inferred.source.includes("screen id=reset-password-import"), "DOM fallback should generate parseable WireSpec source.");
assert(inferred.source.includes("field"), "DOM fallback should map semantic HTML controls into WireSpec nodes.");

const parsedDraft = parseWireSpecDocument(inferred.source, "inferred-dom.wirespec.md");
assert(parsedDraft.root.kind === "screen", "Inferred WireSpec should round-trip through the parser.");

console.log("Studio DOM import smoke test passed.");
