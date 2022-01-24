/**
 * Funkcjonalność grupowego zaznaczania wierszy wskazanej tabeli.
 *
 * @author Paweł Suwiński, psuw@wp.pl
 */

let allowRefresh;

export default function(table) {
  /* global m set_limit */
  /* eslint-enable no-mixed-operators */
  if (!table.querySelector('tr a[href^="extinfo.cgi?"]')) {
    return;
  }

  /* Wstrzymaj odświeżanie strony, jeżeli zaznaczono wiersze. */
  if (typeof allowRefresh === 'undefined') {
    allowRefresh = m.stream(false);
    /* eslint-disable camelcase, no-global-assign */
    if (typeof set_limit !== 'undefined') {
      set_limit = new Proxy(set_limit, {
        apply: (target, thisArg, args) => {
          allowRefresh(true);
          return target(...args);
        }
      });
    }
    /* eslint-enable camelcase, no-global-assign */
    document.body.addEventListener('click', e =>
      ['A', 'IMG'].includes(e.target.tagName) && allowRefresh(true));
  }
  window.addEventListener('beforeunload', e =>
    table.querySelector('.selected') && !allowRefresh() && e.preventDefault());

  /* Oznacz wiersze nagłówkowy oraz usług lub serwisów. */
  Array.from(table.rows).forEach((r, idx) =>
    (idx === 0 || r.innerHTML.indexOf('extinfo.cgi?') > -1) &&
      table.rows[idx].classList.add('detail'));
  /* Zmiana wybrany/ niewybrany oznaczonych wierszy przy kliknięcie. */
  /* eslint-disable no-mixed-operators */
  table.addEventListener('click', e =>
    e.target.tagName === 'TR' && e.target.classList.contains('detail') &&
      (!e.target.classList.contains('selected')
        ? e.target.classList.add('selected') ||
          !table.rows[0].classList.contains('selected') &&
          !table.querySelector('tr.detail:not(:first-child):not(.selected)') &&
          table.rows[0].classList.add('selected')
        : e.target.classList.remove('selected') ||
          table.rows[0].classList.contains('selected') &&
          table.querySelector('tr.detail:not(.selected)') &&
          table.rows[0].classList.remove('selected')
      )
  );
  /* eslint-enable no-mixed-operators */
  /**
   * Box select-all. Zmiana wybrany/ niewybrany dla wszystkich oznaczonych.
   *
   * Warunek odwrócony, gdyż zaznaczenie jest obsługiwane na poziomie table,
   * sprawdzanie czy zaznaczono box select-all na poziomie tr.
   */
  table.rows[0].addEventListener('click', e =>
    e.target.tagName === 'TR' && Array.from(table.rows).slice(1)
      .filter(r => r.classList.contains('detail'))
      .forEach(r => !e.target.classList.contains('selected')
        ? r.classList.add('selected')
        : r.classList.remove('selected'))
  );
}
