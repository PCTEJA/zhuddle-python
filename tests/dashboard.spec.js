import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

const questions = JSON.parse(
  readFileSync(new URL("../src/data/questions.json", import.meta.url), "utf8"),
);
const solution =
  'message = "Hello world"\ncharacter_count = len(message)\nlargest_character = max(message)\nsmallest_character = min(message)\nwhole_number = int("32")\ndecimal_number = float("3.14159")';

async function edit(page, value) {
  const editor = page.locator(".cm-content");
  await editor.click();
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.insertText(value);
}

test("real Python, scoring, saved edits, quizzes and exports survive the redesign", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.locator(".cm-content").waitFor();
  await page
    .getByRole("button", { name: "Join the quest", exact: true })
    .click();
  await page.getByLabel("Full name").fill("Dashboard Test");
  await page.getByLabel("UNT ID", { exact: true }).fill("test-local-only");
  await page.getByRole("button", { name: "Let’s build something" }).click();
  await expect(page.locator("dialog")).not.toBeVisible();
  await edit(page, solution);
  await page.getByRole("button", { name: "Run & check", exact: true }).click();
  await expect(page.locator(".result-heading")).toContainText("10/10 XP", {
    timeout: 95000,
  });
  await expect(page.locator(".xp-pill")).toContainText("10 XP");
  await expect(page.locator(".goal-check.done")).toHaveCount(2);
  await page.getByRole("button", { name: "Run & check", exact: true }).click();
  await expect(page.locator(".console-header")).toContainText("Attempt 2");
  await expect(page.locator(".xp-pill")).toContainText("10 XP");
  await edit(page, solution + "\n# checking an edit");
  await expect(page.locator(".xp-pill")).toContainText("0 XP");
  await expect(page.locator(".check-results")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".cm-content")).toContainText("# checking an edit");
  await expect(page.locator(".profile-button")).toContainText("Dashboard");
  await page.getByRole("button", { name: "Let’s try it", exact: true }).click();
  const question = questions.find((q) => q.id === "M01");
  const option = question.options.find((o) => o.letter === question.answer);
  await page
    .getByRole("radio", {
      name: `${option.letter} ${option.text}`,
      exact: true,
    })
    .check();
  await page.getByRole("button", { name: "Check answer", exact: true }).click();
  await expect(page.locator(".result-heading")).toContainText("2/2 XP");
  await page.getByRole("button", { name: "Achievements", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Download certificate", exact: true }),
  ).toBeDisabled();
  const notebook = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download my notebook", exact: true })
    .click();
  const data = JSON.parse(readFileSync(await (await notebook).path(), "utf8"));
  expect(data.metadata.zhuddle.score).toBe(2);
  expect(
    data.cells.some(
      (c) => c.cell_type === "code" && c.source.includes("# checking an edit"),
    ),
  ).toBe(true);
  const report = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download grade report", exact: true })
    .click();
  expect(
    readFileSync(await (await report).path())
      .subarray(0, 4)
      .toString(),
  ).toBe("%PDF");
  await page.getByRole("button", { name: "Learn", exact: true }).click();
  await page
    .getByRole("button", {
      name: "01 Toolbox warm-up Easy · 10 XP",
      exact: false,
    })
    .click();
  await page
    .getByRole("button", { name: "Reset starter code", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reset this mission", exact: true })
    .click();
  await expect(page.locator(".cm-content")).toContainText(
    "character_count = None",
  );
  await expect(page.locator(".cm-content")).not.toContainText(
    "# checking an edit",
  );
  expect(errors).toEqual([]);
});

test("search, responsive layouts, mobile keyboard navigation and all asset URLs", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator(".cm-content").waitFor();
  await page.getByRole("searchbox", { name: "Search lessons" }).fill("random");
  await page
    .locator(".search-results")
    .getByRole("button", { name: /Random-number lab/ })
    .click();
  await expect(page.locator(".quest-heading")).toContainText(
    "Random-number lab",
  );
  await page.getByRole("button", { name: "Explore", exact: true }).click();
  await expect(page.locator(".resource-card")).toHaveCount(3);
  await page.getByRole("button", { name: "Learn", exact: true }).click();
  for (const width of [1672, 1440, 1280, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `overflow at ${width}px`,
    ).toBe(true);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("button", { name: "Open course menu", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Close navigation", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("link", { name: "Offline notebook", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open course menu", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Open course menu", exact: true })
    .click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("button", { name: "Explore", exact: true })
    .click();
  await expect(page.locator(".explore-surface")).toBeVisible();
  await expect(page.locator(".sidebar")).not.toBeVisible();
  const catalog = JSON.parse(
    readFileSync(
      new URL("../public/assets/zhuddle/catalog.json", import.meta.url),
      "utf8",
    ),
  );
  for (const asset of catalog) {
    for (const name of [asset.still, asset.animated].filter(Boolean)) {
      const response = await page.request.get(`/assets/zhuddle/${name}`);
      expect(response.ok(), name).toBe(true);
      expect(await response.text()).toContain("<svg");
    }
  }
});

test("motion swaps to still assets, persists and follows the operating system", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.locator(".cm-content").waitFor();
  const learningArt = page.locator('.topnav img[src*="learning-book"]');
  await learningArt.hover();
  await expect(learningArt).toHaveAttribute(
    "src",
    /animated/,
  );
  await page
    .getByRole("button", { name: "Animations on", exact: true })
    .click();
  await expect(page.locator('img[src*="-animated.svg"]')).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Animations off", exact: true }),
  ).toBeVisible();
  await expect(page.locator('img[src*="-animated.svg"]')).toHaveCount(0);
  await page
    .getByRole("button", { name: "Animations off", exact: true })
    .click();
  await page.locator(".welcome-band").scrollIntoViewIfNeeded();
  await learningArt.hover();
  await expect(learningArt).toHaveAttribute(
    "src",
    /animated/,
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator('img[src*="-animated.svg"]')).toHaveCount(0);
});
