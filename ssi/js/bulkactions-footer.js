/**
 * Wykonywanie akcji dla komentarzy i przestojów na wielu elementach.
 *
 * @author Paweł Suwiński, psuw@wp.pl
 */
(async function(tables, params) {
  'use strict';
  /* eslint-disable no-mixed-operators */
  if (!params.get('type').match('^[36]$')) {
    return;
  }

  const $x = (xpath, node) => {
    const results = [];
    const it = document.evaluate(xpath, node, null,
      XPathResult.ORDERED_NODE_ITERATOR_TYPE);
    let item;
    while ((item = it.iterateNext()) !== null) {
      results.push(item);
    }
    return results;
  };

  /* Moduł grupowego zaznaczenia wierszy w tabeli. */
  const bulkSelect = await import('./bulkSelect.js');

  tables.forEach(table => {
    /* Dodanie grupowego zaznaczenia i oznaczenie wierszy. */
    bulkSelect.default(table);
    /* Akcje dla pierwszego oznaczonego wiersza jako wzór. */
    const actions = $x('(.//*[contains(@class, "detail")]' +
      '[.//a[starts-with(@href, "cmd.cgi?")]])[1]' +
      '//a[starts-with(@href, "cmd.cgi?")]', table);
    const lastBulkAction = $x(
      '(preceding::div[a[starts-with(@href, "cmd.cgi?")]])[last()]', table)[0];
    if (!lastBulkAction || actions.length === 0) {
      return;
    }
    actions.reverse();
    actions.forEach(action => {
      const newBulkAction = lastBulkAction.cloneNode(true);
      const icon = action.querySelector('img');
      /* Obcięcie id elementu z url. */
      const actionUrl = action.href.substring(
        action.href.lastIndexOf('/') + 1,
        action.href.lastIndexOf('=') + 1
      );
      const anchor = Object.assign(newBulkAction.querySelector('a') ?? {}, {
        href: actionUrl,
        innerText: (txt => txt[0].toUpperCase() + txt.substring(1))(
          icon?.title?.toLowerCase().replace('this', 'selected') ??
          'do with selected'
        )
      });
      anchor.addEventListener('click', e => {
        e.target.setAttribute('href', actionUrl + Array.from(
          table.querySelectorAll(`.selected a[href^="${actionUrl}"]`)
        ).map(el => el.href.substring(el.href.lastIndexOf('=') + 1)).join(','));
        e.target.href.match('=$') && e.preventDefault();
      });
      newBulkAction.querySelector('img')?.setAttribute('src', icon?.src);
      lastBulkAction.after(newBulkAction);
    });
  });
})(
  ['downtime', 'comment'].reduce((tbls, tbl) =>
    [...tbls, ...document.querySelectorAll(`table.${tbl}`)], []),
  new URL(document.URL).searchParams
);
