import test from "node:test";
import assert from "node:assert/strict";
import { responsiveLayout } from "../src/responsive.mjs";

const matrix = [
  {
    width: 160,
    height: 50,
    split: true,
    showOutline: true,
    detailsStrip: false,
    historyStrip: false,
    outlineWidth: 26,
    detailsWidth: 42,
    graphWidth: 84,
    detailsHeight: 22,
    historyHeight: 14,
    consoleHeight: 8,
  },
  {
    width: 120,
    height: 40,
    split: true,
    showOutline: true,
    detailsStrip: false,
    historyStrip: false,
    outlineWidth: 22,
    detailsWidth: 34,
    graphWidth: 56,
    detailsHeight: 17,
    historyHeight: 10,
    consoleHeight: 7,
  },
  {
    width: 120,
    height: 36,
    split: true,
    showOutline: true,
    detailsStrip: false,
    historyStrip: false,
    outlineWidth: 22,
    detailsWidth: 34,
    graphWidth: 56,
    detailsHeight: 14,
    historyHeight: 9,
    consoleHeight: 7,
  },
  {
    width: 120,
    height: 35,
    split: false,
    showOutline: true,
    detailsStrip: true,
    historyStrip: true,
    outlineWidth: 22,
    detailsWidth: 0,
    graphWidth: 91,
    consoleHeight: 7,
  },
  {
    width: 160,
    height: 30,
    split: false,
    showOutline: true,
    detailsStrip: true,
    historyStrip: true,
    outlineWidth: 26,
    detailsWidth: 0,
    graphWidth: 127,
    consoleHeight: 7,
  },
  {
    width: 119,
    height: 50,
    split: false,
    showOutline: true,
    detailsStrip: true,
    historyStrip: true,
    outlineWidth: 20,
    detailsWidth: 0,
    graphWidth: 92,
    consoleHeight: 8,
  },
  {
    width: 100,
    height: 30,
    split: false,
    showOutline: true,
    detailsStrip: true,
    historyStrip: true,
    outlineWidth: 20,
    detailsWidth: 0,
    graphWidth: 73,
    consoleHeight: 7,
  },
  {
    width: 90,
    height: 24,
    split: false,
    showOutline: true,
    detailsStrip: true,
    historyStrip: true,
    outlineWidth: 20,
    detailsWidth: 0,
    graphWidth: 63,
    consoleHeight: 6,
  },
  {
    width: 80,
    height: 24,
    split: false,
    showOutline: false,
    detailsStrip: false,
    historyStrip: true,
    outlineWidth: 0,
    detailsWidth: 0,
    graphWidth: 74,
    consoleHeight: 6,
  },
  {
    width: 60,
    height: 20,
    split: false,
    showOutline: false,
    detailsStrip: false,
    historyStrip: true,
    outlineWidth: 0,
    detailsWidth: 0,
    graphWidth: 54,
    consoleHeight: 3,
  },
];

for (const entry of matrix) {
  test(`responsive: ${entry.width}x${entry.height}`, () => {
    const layout = responsiveLayout(entry.width, entry.height);
    assert.equal(layout.split, entry.split);
    assert.equal(layout.detailsPane, entry.split);
    assert.equal(layout.historyPane, entry.split);
    assert.equal(layout.showOutline, entry.showOutline);
    assert.equal(layout.detailsStrip, entry.detailsStrip);
    assert.equal(layout.historyStrip, entry.historyStrip);
    assert.equal(layout.outlineWidth, entry.outlineWidth);
    assert.equal(layout.detailsWidth, entry.detailsWidth);
    assert.equal(layout.historyWidth, entry.detailsWidth);
    assert.equal(layout.graphWidth, entry.graphWidth);
    assert.equal(layout.consoleHeight, entry.consoleHeight);
    if (entry.split) {
      assert.equal(layout.detailsHeight, entry.detailsHeight);
      assert.equal(layout.historyHeight, entry.historyHeight);
      assert.equal(layout.detailsHeight + layout.historyHeight + 1, layout.paneAreaHeight);
    } else {
      assert.equal(layout.detailsHeight, 2);
      assert.equal(layout.historyHeight, 1);
    }
    assert.equal(layout.runConsole, true);
  });
}

test("responsive: below the supported minimum does not throw", () => {
  const layout = responsiveLayout(40, 10);
  assert.equal(layout.historyStrip, true);
  assert.equal(layout.split, false);
  assert.ok(layout.graphWidth >= 24);
});

test("responsive: header and footer keep their fixed rows", () => {
  assert.deepEqual(
    [responsiveLayout(160, 50).headerStacked, responsiveLayout(160, 50).footerStacked],
    [false, false],
  );
  assert.deepEqual(
    [responsiveLayout(100, 30).headerStacked, responsiveLayout(100, 30).footerStacked],
    [false, true],
  );
  assert.deepEqual(
    [responsiveLayout(80, 24).headerStacked, responsiveLayout(80, 24).footerStacked],
    [true, true],
  );
});
