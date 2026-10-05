(() => {
  'use strict';
  const { h, route, t, fmt, state, svcName, setAlt, langSwitch, boot } = window.DRB;
  const app = document.getElementById('app');

  function render() {
    const c = state.cfg;
    const L = t();
    const order = [1, 2, 3, 4, 5, 6, 0];

    app.replaceChildren(...[
      h('header', { class: 'top' },
        h('div'),
        h('h1', { class: 'top-title' }, L.priceList),
        h('div', { class: 'top-end' }, langSwitch()),
      ),
      h('div', { class: 'logo-wrap' }, h('img', { class: 'logo', src: c.logo, alt: c.shopName, width: '160', height: '160' })),

      h('div', { class: 'col' },
        c.altCurrency ? h('div', { class: 'cur-toggle' },
          h('button', { type: 'button', onclick: () => setAlt(!state.alt) }, L.show(state.alt ? c.currency : c.altCurrency.code)),
        ) : null,
        c.services.map((s) => h('a', { class: 'svc', href: route('book', { service: s.id }) },
          h('h3', { class: 'svc-name' }, svcName(s)),
          h('div', { class: 'svc-right' },
            h('span', { class: 'svc-dur' }, `${s.duration_min} ${L.min}`),
            h('span', { class: 'svc-price' }, fmt.price(s.price)),
          ),
        )),
      ),
      c.note && c.note[state.lang] ? h('p', { class: 'col note' }, c.note[state.lang]) : null,

      h('section', { class: 'col hours' },
        h('h2', { class: 'section-label' }, L.hours),
        h('div', null, order.map((d) => h('div', { class: 'hours-row' },
          h('span', { class: 'hours-day' }, L.days[d]),
          c.hours[d]
            ? h('span', { class: 'hours-time' }, `${c.hours[d][0]} – ${c.hours[d][1]}`)
            : h('span', { class: 'hours-closed' }, L.closed),
        ))),
      ),

      h('div', { class: 'brand' },
        h('h2', { class: 'brand-name' }, c.shopName),
        c.tagline ? h('p', { class: 'brand-tag' }, c.tagline) : null,
        c.address || c.phone ? h('p', { class: 'brand-meta' }, [c.address, c.phone].filter(Boolean).join(' · ')) : null,
      ),
      h('div', { class: 'foot-link' }, h('a', { href: route('cancel') }, L.cancelLink)),
    ].filter(Boolean));
  }

  boot(render).catch(() => {
    app.replaceChildren(h('p', { class: 'msg msg-error' }, 'Stranica trenutno nije dostupna. The page is unavailable right now.'));
  });
})();
