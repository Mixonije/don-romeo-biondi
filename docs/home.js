(() => {
  'use strict';
  const { h, route, t, fmt, state, svcName, svcDesc, catName, groupServices, setAlt, langSwitch, boot } = window.DRB;
  const app = document.getElementById('app');
  const ARROW = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h9M6.5 2.5L10 6l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

  function card(s) {
    const L = t();
    const desc = svcDesc(s);
    return h('a', {
      class: 'svc-card', href: route('book', { service: s.id }),
      'aria-label': `${svcName(s)}, ${s.duration_min} ${L.min}, ${fmt.price(s.price, false, s.price_from)}. ${L.bookCta}`,
    },
      h('span', { class: 'svc-main' },
        h('span', { class: 'svc-name' }, svcName(s)),
        desc ? h('span', { class: 'svc-desc' }, desc) : null,
        h('span', { class: 'svc-dur' }, `${s.duration_min} ${L.min}`),
      ),
      h('span', { class: 'svc-price' }, fmt.price(s.price, false, s.price_from)),
      h('span', { class: 'svc-cta', 'aria-hidden': 'true' }, h('span', { class: 'svc-cta-label' }, L.bookCta), h('span', { class: 'svc-arrow', html: ARROW })),
    );
  }

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
      h('div', { class: 'logo-wrap' }, h('img', { class: 'logo', src: c.logo, alt: c.shopName, width: '150', height: '150' })),

      h('section', { class: 'col' },
        h('div', { class: 'svc-head' },
          h('h2', { class: 'section-label' }, L.bookHeading),
          c.altCurrency ? h('div', { class: 'cur-toggle' },
            h('button', { type: 'button', onclick: () => setAlt(!state.alt) }, L.show(state.alt ? c.currency : c.altCurrency.code)),
          ) : null,
        ),
        h('p', { class: 'svc-hint' }, L.pickServiceHint),
        groupServices(c.services).map(({ cat, list }) => h('div', { class: 'svc-group' },
          cat ? h('h3', { class: 'svc-group-title' }, catName(cat)) : null,
          h('div', { class: 'svc-cards' }, list.map(card)),
        )),
      ),
      c.note && c.note[state.lang] ? h('p', { class: 'col note' }, c.note[state.lang]) : null,

      c.gallery && c.gallery.length ? h('section', { class: 'col gallery-block' },
        h('h2', { class: 'section-label' }, L.ourWork),
        h('div', { class: 'gallery' }, c.gallery.map((g) => h('img', {
          src: g.src, alt: (g.alt && g.alt[state.lang]) || '', width: '480', height: '480', loading: 'lazy', decoding: 'async',
        }))),
        c.instagram ? h('a', { class: 'ig-link', href: `https://www.instagram.com/${c.instagram}/`, target: '_blank', rel: 'noopener' }, L.instagramLink(c.instagram)) : null,
      ) : null,

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
        c.address ? h('p', { class: 'brand-meta' }, c.address) : null,
        c.phone ? h('p', { class: 'brand-meta' }, h('a', { href: `tel:+41${c.phone.replace(/\s/g, '').replace(/^0/, '')}` }, c.phone)) : null,
      ),
      h('div', { class: 'foot-link' }, h('a', { href: route('cancel') }, L.cancelLink)),
      h('div', { class: 'foot-link foot-small' }, h('a', { href: route('impressum') }, L.impressum)),
    ].filter(Boolean));
  }

  boot(render).catch(() => {
    app.replaceChildren(h('p', { class: 'msg msg-error' }, 'Die Seite ist zurzeit nicht verfügbar.'));
  });
})();
