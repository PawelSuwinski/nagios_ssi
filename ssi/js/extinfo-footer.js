/*
 * Wyświetlenie zmiennych niestandardowych na stronie extinfo.cgi.
 *
 * @author Paweł Suwiński, psuw@wp.pl
 */
(async function(table, apiUrl, params, topVar, adminGroup) {
  'use strict';
  /* global m */
  const objectInfo = new (await import('./objectInfo.js')).ObjectInfo(apiUrl);
  table && Promise.all([
    objectInfo.get(params),
    m.request({
      url: apiUrl,
      params: { query: 'contactgroup', contactgroup: adminGroup },
    }),
  ]).then(res => (data => {
    data.length > 0 && (tbody => {
      tbody.classList.add('customVars');
      table.appendChild(tbody);
      const Contacts = {
        data: {},
        set: (contact, data) => Object.assign(Contacts.data, { [contact]: data }),
        name: contact => Contacts.data[contact]?.alias ?? contact,
        emails: () => Object.entries(Contacts.data).filter(c => c[1].email)
          .map(c => c[1].email),
        load: contacts => contacts.forEach(contact =>
          m.request({
            url: apiUrl,
            params: { query: 'contact', contactname: contact },
          }).then(res =>
            /* eslint-disable-next-line eqeqeq */
            (res.data?.contact?.custom_variables?.CONTACT_HIDE ?? 0) == 0 &&
            Contacts.set(contact, Object.fromEntries(
              Object.entries(res.data?.contact ?? {})
                .filter(c => ['alias', 'email', 'pager']
                  .filter(attr => attr !== 'pager' ||
                    /* eslint-disable-next-line eqeqeq */
                    (res.data?.contact?.custom_variables?.PAGER_HIDE ?? 0) == 0)
                  .includes(c[0]) && c[1])
            ))
          )
        )
      };
      Contacts.load(data.find(e => e[0] === 'CONTACTS')?.[1] ?? []);
      m.mount(tbody, {
        view: () => data.map(row => m('tr', { class: objectInfo.camelize(row[0], '') }, [
          m('td.dataVar', m('span', objectInfo.camelize(row[0]))),
          m('td.dataVal', !Array.isArray(row[1]) ? row[1] : [m('ul', row[1]
            .filter(el => row[0] !== 'CONTACTS' || Contacts.data[el])
            .map(el => m('li',
              row[0] !== 'CONTACTS' || !Contacts.data[el] ? el
                : [!Contacts.data[el]?.email ? Contacts.name(el)
                  : m('a', { href: 'mailto:' + Contacts.data[el].email },
                    Contacts.name(el))]
                  .concat(!Contacts.data[el]?.pager ? []
                    : [' ', m('span.pager', Contacts.data[el].pager)]
                  )
            ))
          )].concat(row[0] !== 'CONTACTS' ? []
            : [' ', m('a.groupmail', {
              href: 'mailto:' + Contacts.emails().join(',') + '?subject=[' +
                ['host', 'service'].filter(s => params.has(s))
                  .map(s => params.get(s)).join('][') + '] ' +
                encodeURIComponent(
                  table.querySelector('tr:nth-child(2) .dataVal').innerText)
            }, m('span', 'Mail to all'))]
          ))
        ]))
      });
    })(document.createElement('tbody'));
  })((data => Object.entries(topVar.reduce((obj, name) =>
    Object.assign(obj, (v => v ? { [name]: v } : {})(data[name])), {}))
    .concat(Object.entries(data).filter(row => !topVar.includes(row[0])))
    .filter(r => Array.isArray(r[1]) ? r[1].length : r[1])
  )(Object.assign(
    res[0]?.custom_variables ?? {},
    !res[1].data.contactgroup?.members.includes(res[1].result.user) ? {} : {
      CHECK_COMMAND: res[0]?.check_command,
    }, {
      CONTACT_GROUPS: res[0]?.contact_groups,
      CONTACTS: res[0]?.contacts,
    }
  ))));
})(document.querySelector('[class^=stateInfoTable1] table'),
  document.URL.substr(0, document.URL.lastIndexOf('/')) + '/objectjson.cgi',
  new URL(document.URL).searchParams,
  ...(conf => [
    conf.topvar?.replaceAll(' ', '').split(',') ?? [],
    conf.admingroup ?? 'admins',
  ])(document.querySelector('script[src$="extinfo-footer.js"]')?.dataset ?? {})
);
