/**
 * Możliwość wskazania grupy serwisów lub hostów i przesłania do wykonania
 * wybranej komendy lub eksportu jako CSV wraz z dodatkowymi informacjami
 * zawartymi w zmiennych niestandardowych.
 *
 * Lista komend jest pobierana z wiersza zaznaczonego w pierwszej kolejności
 * lub pierwszego z listy, jeżeli zaznaczono wszystkie na raz oraz jest
 * usuwana przy braku zaznaczonych elementów.
 *
 * @author Paweł Suwiński, psuw@wp.pl
 */
(async function(table, linkBox, apiUrl, params) {
  'use strict';
  /* global m */
  /* eslint-disable no-mixed-operators */
  if ((table?.rows?.length ?? 0) < 2 || params.toString() && (
    !params.has('style') && !params.has('host') ||
    params.has('style') && params.has('hostgroup') &&
    !params.get('style').endsWith('detail'))) {
    return;
  }

  /* Dodaj grupowe zaznaczenia wierszy we wskazanej tabeli. */
  (await import('./bulkSelect.js')).default(table);

  const isHostsPage = params.has('hostgroup') &&
    params.get('style') === 'hostdetail';
  const aSelector = 'a[href^="extinfo.cgi"]' + (isHostsPage ? ''
    : '[href*="&service="]');
  const panelRequest = m.stream(false);

  /* Link pobierz do csv. */
  const objectInfo = new (await import('./objectInfo.js')).ObjectInfo(apiUrl);
  linkBox.lastElementChild?.tagName !== 'BR' &&
    linkBox.appendChild(document.createElement('br'));
  linkBox.appendChild((link => Object.assign(link, {
    id: 'csvexport',
    download: new URL(document.URL).host.replaceAll('.', '_') + '-status.csv',
    innerText: 'Export Selected as CSV',
    onclick: async e => {
      if (!table.querySelector('tr.selected') ||
          e.target.classList.contains('processing')) {
        return false;
      } else if (e.target.href) {
        return true;
      }
      /* Na potrzeby określenia czy były operacje asynchroniczne. */
      const poolSize = objectInfo.infoPool.size;
      const objectInfoCols = new Set();
      e.target.classList.add('processing');
      e.target.setAttribute('href', URL.createObjectURL(new Blob([
        new TextEncoder().encode((await Promise.all(Array.from(table.rows)
          .filter((r, idx) => idx === 0 || r.classList.contains('selected'))
          .map(async function(r, idx) {
            const rParams = idx === 0 ? null
              : new URL(r.querySelector(aSelector).href).searchParams;
            return [[
              ...(idx === 0 || isHostsPage ? [] : [rParams.get('host')]),
              ...Array.from(r.cells).slice(idx === 0 || isHostsPage ? 0 : 1)
                .filter(c => (c.classList + '').includes('status'))
                .map(c => c.innerText.trim().replace('"', '""')),
            ], idx === 0 ? null : Object.fromEntries(
              Object.entries(await objectInfo.get(rParams))
                .filter(e => [
                  'custom_variables',
                  'contacts',
                  'contact_groups',
                ].includes(e[0])).reduce((entrs, e) => [...entrs,
                  ...(e[0] === 'custom_variables'
                    /* Dla uniknięcia konfliktu nazw customvars.  */
                    ? Object.entries(e[1]).filter(e => ['_' + e[0], e[1]])
                    : [[e[0], Array.isArray(e[1]) ? e[1].join(', ') : e[1]]])
                ], []).filter(e => objectInfoCols.add(e[0]) || true)
            )];
          })))
          .map(r => '"' + [...r[0], ...(!r[1]
            ? [...objectInfoCols].map(c => objectInfo.camelize(c))
            : [...objectInfoCols].map(c => (r[1][c] ?? '').replace('"', '""'))
          )].join('","') + '"'
          ).join('\n'))
      ], { type: 'text/csv;charset=utf-8' })));
      e.target.classList.remove('processing');
      /* Jeżeli były operacje asynchroniczne, potrzebny dodatkowy click. */
      poolSize !== objectInfo.infoPool.size && e.target.click();
    }
  }))(document.createElement('a')));
  table.addEventListener('click', e =>
    e.target.tagName === 'TR' && e.target.classList.contains('detail') &&
      (a => a && (URL.revokeObjectURL(a.href) || a.removeAttribute('href')))(
        document.querySelector('a#csvexport[href]'))
  );

  /* Pobranie tabeli komend zaznaczonego wiersza lub pierwszego. */
  table.addEventListener('click', e =>
    e.target.tagName === 'TR' && e.target.classList.contains('detail') &&
    (!table.querySelector('.selected')
      ? document.querySelector('.commandPanel')?.remove() || panelRequest(false)
      : !panelRequest() && panelRequest(true) &&
        m.request({
          url: (e.target.querySelector(aSelector) ??
            table.rows[1].querySelector(aSelector)).href,
          responseType: 'document',
          deserialize: value => value.querySelectorAll([
            'td.commandPanel div[class$="Title"]',
            'td.commandPanel table.command',
            'link[href$="extinfo.css"]',
          ].join(', '))
        }).then(res => {
          const newNode = document.createElement('div');
          newNode.classList.add('commandPanel');
          res.forEach(node => node.tagName === 'LINK'
            ? !document.head.querySelector('link[href$="extinfo.css"]') &&
              document.head.appendChild(node.cloneNode(true))
            : newNode.appendChild(node.cloneNode(true)));
          /* Ukryj komendy nie prowadzące do cmd.cgi */
          newNode.querySelectorAll('.command a:not(a[href^="cmd.cgi?"])')
            .forEach(a =>
              a.parentNode.parentNode.setAttribute('style', 'display: none')
            );
          /* Pokaż/ ukryj ramkę komend. */
          newNode.querySelector('div[class$="Title"]')
            .addEventListener('click', e =>
              newNode.classList.contains('show')
                ? newNode.classList.remove('show')
                : newNode.classList.add('show')
            );
          newNode.querySelectorAll('.command a[href^="cmd.cgi?"]').forEach(a => {
            /* Wytnij parametry host i service */
            a.setAttribute('href', a.href.split('&')[0]);
            /* Na kliknięcie wyślij listę wybranych hostów/ usług do cmd.cgi. */
            a.addEventListener('click', e => {
              a.setAttribute('href', a.href.split('&')[0]);
              e.target.setAttribute('href', e.target.href + '&' +
                (isHostsPage ? 'host' : 'service') + '=' + encodeURI(
                Object.entries(Array.from(table.rows).slice(1)
                  .filter(r => r.classList.contains('selected'))
                  .map(r => new URL(r.querySelector(aSelector).href).searchParams
                  ).filter(r => r.get('host') && (r.get('service') || isHostsPage))
                  /* Lista w postaci: host1,serwis1,...;host2,serwis1,... */
                  .reduce((srvcs, srv) => Object.assign(srvcs, {
                    [srv.get('host')]: isHostsPage ? []
                      : [...(srvcs[srv.get('host')] ?? []), srv.get('service')]
                  }), {}))
                  .map(r => r[1].join(',') + (r[1].length ? '@' : '') + r[0])
                  .join(';')
              ));
              /* Pozostań na stronie jeżeli nic nie wybrano. */
              e.target.href.match(/(service|host)=$/) && e.preventDefault();
            });
          });
          table.parentNode.insertBefore(newNode, table);
        })
    )
  );
})(document.querySelector('table.status'), document.querySelector('td.linkBox'),
  document.URL.substr(0, document.URL.lastIndexOf('/')) + '/objectjson.cgi',
  new URL(document.URL).searchParams);
