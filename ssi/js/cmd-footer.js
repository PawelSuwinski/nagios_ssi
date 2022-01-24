/**
 * Obsługa więcej niż jednego hosta lub serwisu w formularzu komend
 * oraz listy identyfikatorów przekazanych w ostatnim parametrze.
 *
 * Jeżeli pasuje format to formularz jest wysyłany asynchronicznie
 * dla każdego obiektu oddzielnie. W innym przypadku działa domyślnie.
 *
 * Format:
 *   - host:    host1;host2;...
 *   - service: srv1,srv2,...@host1;srv1,srv2,...@host2;...
 *   - XXX_id: id1,id2,...
 *
 * @author Paweł Suwiński, psuw@wp.pl
 */
((form, resultsOutput) => {
  /* global m */
  'use strict';
  if (!form) {
    return;
  }
  const Results = {
    error: [],
    success: [],
    done: m.stream(false)
  };
  form.addEventListener('submit', e => {
    const idFlds =
      form.querySelectorAll('input[type="text"][name$="_id"][value*=","]');
    /* eslint-disable no-mixed-operators */
    (form.service?.value.indexOf('@') > 0 ||
    !form.service && form.host?.value.indexOf(';') > 0 ||
    idFlds.length === 1 && idFlds[0].value.match('^[0-9]+(,[0-9]+)+$')) &&
    /* eslint-enable no-mixed-operators */
    m.mount(resultsOutput, {
      oninit: () => {
        document.body.classList.add('results');
        e.preventDefault();
      },
      oncreate: () => Promise.allSettled((form.service?.value.indexOf('@') > 0
        ? form.service.value.split(';').reduce((srvcs, srv) => {
          const host = srv.substr(srv.lastIndexOf('@') + 1);
          return srvcs.concat(srv.substr(0, srv.lastIndexOf('@')).split(',')
            .map(s => ({ service: s.trim(), host: host.trim() })));
        }, []).filter(s => s.host && s.service)
        : form.host?.value.indexOf(';') > 0
          ? form.host.value.split(';').map(h => ({ host: h.trim() }))
            .filter(h => h.host)
          : idFlds[0].value.split(',').map(id => ({ [idFlds[0].name]: id }))
      ).map(data => m.request({
        method: form.method,
        url: form.action,
        body: Object.assign(Object.fromEntries(new FormData(form)), data),
        serialize: m.buildQueryString,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        responseType: 'document',
        deserialize: value => value.querySelector('div[class$="Message"]')
      }).then(res => (res.classList.contains('errorMessage')
        ? Results.error : Results.success).push(data)
      ).catch(() => Results.error.push(data)))
      ).then(res => Results.done(true) && m.redraw()),
      view: () => [
        Object.values(Results).filter(r => Array.isArray(r)).map((r, idx) =>
          m('ul.' + (idx === 0 ? 'error' : 'success'), r.map(srv =>
            m('li', m('a', idx !== 0 ? {} : {
              href: form.action + '?' + m.buildQueryString(Object.assign(
                Object.fromEntries(Array.from(new FormData(form))
                /* cmd_mod nie może się znajdować w zapytaniu GET */
                  .filter(e => e[0] !== 'cmd_mod')), srv))
            }, Object.entries(srv).map(s => m('span.' + s[0], s[1]))))))),
        !Results.done() ? m('span.spinner')
          : m('a', { onclick: () => window.history.go(-1) },
            m('span.done', 'Done'))
      ]
    });
  });
  /* eslint-disable no-mixed-operators */
  if (form.service) {
    form.service.addEventListener('input', e =>
      (form.service.value.indexOf('@') > 0 && !form.host.disabled ||
      form.service.value.indexOf('@') <= 0 && form.host.disabled) &&
      Object.assign(form.host, { disabled: !form.host.disabled }));
    form.service.dispatchEvent(new Event('input'));
    form.querySelector('input[type="reset"]').addEventListener('click', e => {
      e.preventDefault();
      form.reset();
      form.service.dispatchEvent(new Event('input'));
    });
  }
  /* Przypadek listy identyfikatorów id (@see bulkactions-footer.js). */
  ((name, value) => form[name] && form[name].setAttribute('value', value)
  )(...(document.URL.match('([^&?]+_id)=([0-9]+(,[0-9]+)*)$') ?? []).slice(1));
})(document.forms[0], document.querySelector('div.infoMessage'));
