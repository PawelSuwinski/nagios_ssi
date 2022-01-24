/**
 * Funkcja zwraca pobraną z jsonApi informacje o zadane usłudze lub hoście.
 *
 * @author Paweł Suwiński, psuw@wp.pl
 */

export class ObjectInfo {
  constructor(apiUrl) {
    this.apiUrl = apiUrl;
    this.infoPool = new Map();
  }

  async get(params) {
    /* global m */
    const id = params ? params + '' : null;
    !this.infoPool.has(id) && this.infoPool.set(id, await m.request({
      url: this.apiUrl,
      params: Object.assign({ details: 'true' }, !params.has('service') ? {} : {
        servicedescription: params.get('service')
      }, {
        hostname: params.get('host'),
        query: (params.has('service') ? 'service' : 'host') + 'list',
      }),
      responseType: 'json',
      extract: req =>
        req.response?.data?.servicelist?.[params.get('host')]
          ?.[params.get('service')] ??
        req.response?.data?.hostlist?.[params.get('host')] ?? null,
    }));
    return this.infoPool.get(id);
  }

  /* format wyświetlania nazwy: ucwords, skróty 3 lit. upper */
  camelize(name, sep = ' ') {
    return name.split('_').filter(s => s)
      .map(s => s.length <= 3 ? s.toUpperCase()
        : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join(sep);
  }
}
