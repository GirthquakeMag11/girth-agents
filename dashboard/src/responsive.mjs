export function responsiveLayout(width, height) {
  const w = Math.max(1, Math.floor(width));
  const h = Math.max(1, Math.floor(height));
  const split = w >= 120 && h >= 36;
  const showOutline = w >= 90;
  const detailsStrip = !split && w >= 90;
  const historyStrip = !split;
  const headerStacked = w < 100;
  const footerStacked = w < 120;
  const headerHeight = headerStacked ? 4 : 2;
  const footerHeight = footerStacked ? 2 : 1;
  const consoleHeight = h > 40 ? 8 : h >= 30 ? 7 : h >= 24 ? 6 : 3;
  const outlineWidth = w >= 160 ? 26 : w >= 120 ? 22 : w >= 90 ? 20 : 0;
  const detailsWidth = split ? (w >= 160 ? 42 : 34) : 0;
  const bodyColumns = 1 + (showOutline ? 1 : 0) + (split ? 1 : 0);
  const gaps = bodyColumns - 1;
  const graphWidth = Math.max(
    24,
    w - 2 - gaps - (showOutline ? outlineWidth : 0) - (split ? detailsWidth : 0) - 4,
  );
  const paneAreaHeight = Math.max(0, h - headerHeight - consoleHeight - footerHeight - 2);
  const historyHeight = split ? Math.max(8, Math.floor((paneAreaHeight - 1) * 0.4)) : 1;
  const detailsHeight = split ? paneAreaHeight - 1 - historyHeight : 2;

  return {
    width: w,
    height: h,
    split,
    detailsPane: split,
    historyPane: split,
    showOutline,
    detailsStrip,
    historyStrip,
    headerStacked,
    footerStacked,
    headerHeight,
    footerHeight,
    outlineWidth,
    detailsWidth,
    historyWidth: detailsWidth,
    detailsHeight,
    historyHeight,
    graphWidth,
    consoleHeight,
    paneAreaHeight,
    runConsole: true,
  };
}
