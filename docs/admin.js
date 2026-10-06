(() => {
  'use strict';
  const { h, api, route, t, fmt, state, relDay, dayDiff, svcName, langSwitch, setBusy, errorBox, boot } = window.DRB;
  const app = document.getElementById('app');

  const st = {
    tab: 'bookings', scope: 'upcoming', cancelled: false,
    bookings: [], closures: [], services: [], loaded: false, error: null, updatedAt: null,
    confirming: null, editing: null, adding: false, flash: null,
  };

  async function call(path, opts) {
    try { return await api(path, opts); }
    catch (e) { if (e.status === 401) location.replace(route('adminLogin')); throw e; }
  }

  async function refresh() {
    try {
      const [b, c, s] = await Promise.all([
        call(`/api/admin/bookings?scope=${st.scope}&cancelled=${st.cancelled ? 1 : 0}`),
        call('/api/admin/closures'),
        call('/api/admin/services'),
      ]);
      st.bookings = b.bookings; state.cfg.today = b.today; st.closures = c.closures; st.services = s.services;
      st.loaded = true; st.error = null; st.updatedAt = new Date();
    } catch (e) {
      st.error = e.message;
    }
    render();
  }

  // ---------- layout ----------
  function render() {
    const L = t();
    const tab = (id, label) => h('button', { type: 'button', role: 'tab', 'aria-selected': String(st.tab === id), onclick: () => { st.tab = id; st.flash = null; render(); } }, label);
    app.replaceChildren(...[
      h('header', { class: 'admin-top' },
        h('div', { class: 'admin-brand' }, h('h1', null, state.cfg.shopName), h('p', null, L.adminPanel)),
        h('div', { class: 'admin-top-end' },
          langSwitch(),
          h('button', { class: 'text-btn', type: 'button', onclick: async () => { await api('/api/admin/logout', { method: 'POST' }); location.replace(route('adminLogin')); } }, L.signOut),
        ),
      ),
      h('nav', { class: 'tabs', role: 'tablist' }, tab('bookings', L.tabBookings), tab('services', L.tabServices), tab('daysoff', L.tabDaysOff)),
      st.error ? errorBox(st.error) : null,
      st.tab === 'bookings' ? bookingsView() : st.tab === 'services' ? servicesView() : daysOffView(),
    ].filter(Boolean));
  }

  // ---------- bookings ----------
  function bookingsView() {
    const L = t();
    const seg = (scope, label) => h('button', { type: 'button', 'aria-pressed': String(st.scope === scope), onclick: () => { st.scope = scope; refresh(); } }, label);
    const live = st.bookings.filter((b) => b.status === 'confirmed');
    const sum = (arr) => arr.reduce((n, b) => n + b.service.price, 0);
    const today = live.filter((b) => b.date === state.cfg.today);
    const week = live.filter((b) => dayDiff(b.date) < 7);

    const byDay = new Map();
    for (const b of st.bookings) { if (!byDay.has(b.date)) byDay.set(b.date, []); byDay.get(b.date).push(b); }

    return h('section', null,
      h('div', { class: 'toolbar' },
        h('div', { class: 'seg', role: 'group' }, seg('upcoming', L.upcoming), seg('past', L.past)),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: st.cancelled, onchange: (e) => { st.cancelled = e.currentTarget.checked; refresh(); } }), L.showCancelled),
        h('span', { class: 'spacer' }),
        st.updatedAt ? h('span', { class: 'muted' }, `${L.updated} ${st.updatedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`) : null,
      ),
      st.scope === 'upcoming' ? h('div', { class: 'stats' },
        h('span', null, `${L.stillToday}: `, h('strong', null, String(today.length)), today.length ? ` · ${fmt.price(sum(today), true)}` : ''),
        h('span', null, `${L.next7}: `, h('strong', null, String(week.length)), week.length ? ` · ${fmt.price(sum(week), true)}` : ''),
      ) : null,
      !st.loaded ? h('p', { class: 'empty' }, '…')
        : !st.bookings.length ? h('p', { class: 'empty' }, st.scope === 'upcoming' ? L.noUpcoming : L.noPast)
          : [...byDay].map(([date, items]) => {
            const n = items.filter((b) => b.status === 'confirmed').length;
            const rel = relDay(date);
            return h('section', { class: 'agenda-day' },
              h('h2', null, h('span', null, rel ? [h('em', null, rel), ' · '] : null, fmt.long(date)), h('small', null, L.bookingsN(n))),
              items.map(row),
            );
          }),
    );
  }

  function row(b) {
    const L = t();
    const off = b.status === 'cancelled';
    let act;
    if (off) act = h('span', { class: 'status status-off' }, b.cancelledBy === 'shop' ? L.youCancelled : L.customerCancelled);
    else if (b.isPast) act = h('span', { class: 'status status-past' }, L.done);
    else act = h('button', { class: 'btn btn-danger btn-sm', type: 'button', onclick: () => { st.confirming = b.id; render(); } }, L.cancel);

    const el = h('div', { class: `row${off ? ' is-off' : ''}` },
      h('div', { class: 'row-time' }, `${b.start}–${b.end}`),
      h('div', { class: 'row-who' },
        h('strong', null, b.name),
        h('a', { href: `tel:${b.phone}` }, b.phone),
        h('a', { href: `mailto:${b.email}` }, b.email),
      ),
      h('div', { class: 'row-what' }, `${svcName(b.service)} · ${fmt.price(b.service.price, true)}`, h('span', null, b.code)),
      h('div', { class: 'row-act' }, act),
    );
    if (st.confirming === b.id && !off) {
      const yes = h('button', { class: 'btn btn-danger-solid btn-sm', type: 'button', onclick: async () => {
        setBusy(yes, true, '…');
        try { await call(`/api/admin/bookings/${b.id}/cancel`, { method: 'POST' }); st.confirming = null; await refresh(); }
        catch (e) { st.error = e.message; render(); }
      } }, L.yesCancel);
      el.append(h('div', { class: 'row-confirm' },
        h('p', null, L.confirmShopCancel(b.name, b.start)),
        yes,
        h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => { st.confirming = null; render(); } }, L.keep),
      ));
      requestAnimationFrame(() => yes.focus());
    }
    return el;
  }

  // ---------- services ----------
  function serviceForm(s, onDone) {
    const L = t();
    const v = { name_de: s ? s.name_de : '', name_en: s ? s.name_en : '', duration_min: s ? s.duration_min : 30, price: s ? s.price : '' };
    const err = h('div', { class: 'btn-row' });
    const inp = (key, label, type, extra) => {
      const id = `svc-${s ? s.id : 'new'}-${key}`;
      const el = h('input', { class: 'input', id, type, ...extra });
      el.value = v[key];
      return h('div', { class: 'field caps' }, h('label', { for: id }, label), el);
    };
    const save = h('button', { class: 'btn btn-white', type: 'submit' }, s ? L.save : L.addService);
    const form = h('form', {
      class: 'svc-form', novalidate: true,
      onsubmit: async (e) => {
        e.preventDefault();
        const val = (k) => form.querySelector(`#svc-${s ? s.id : 'new'}-${k}`).value;
        const body = { name_de: val('name_de'), name_en: val('name_en'), duration_min: Number(val('duration_min')), price: Number(val('price')) };
        setBusy(save, true, L.saving);
        try {
          if (s) await call(`/api/admin/services/${s.id}`, { method: 'PUT', body });
          else await call('/api/admin/services', { method: 'POST', body });
          onDone();
          await refresh();
        } catch (ex) {
          setBusy(save, false);
          err.replaceChildren(errorBox(ex.message));
        }
      },
    },
      inp('name_de', L.nameDe, 'text', { maxlength: '60', required: true }),
      inp('name_en', L.nameEn, 'text', { maxlength: '60' }),
      inp('duration_min', L.durationMin, 'number', { min: '15', step: '15', inputmode: 'numeric' }),
      inp('price', `${L.price} (${state.cfg.currency})`, 'number', { min: '0', step: '1', inputmode: 'numeric' }),
      err,
      h('div', { class: 'btn-row' },
        save,
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { onDone(); render(); } }, L.discard),
      ),
    );
    return form;
  }

  function servicesView() {
    const L = t();
    const move = async (id, dir) => { await call(`/api/admin/services/${id}/move`, { method: 'POST', body: { dir } }); refresh(); };
    const toggle = async (s) => { await call(`/api/admin/services/${s.id}`, { method: 'PUT', body: { active: !s.active } }); refresh(); };

    return h('div', { class: 'admin-grid' },
      h('section', { class: 'panel' },
        h('h2', null, L.tabServices),
        h('p', null, L.servicesHint),
        h('div', { class: 'block' }, st.services.map((s, i) => h('div', { class: `svc-admin${s.active ? '' : ' is-hidden'}` },
          h('div', { class: 'svc-admin-line' },
            h('span', { class: 'svc-name' }, s.name_de, h('small', null, s.name_en)),
            h('span', { class: 'svc-dur' }, `${s.duration_min} ${L.min}`),
            h('span', { class: 'svc-price' }, fmt.price(s.price, true)),
          ),
          st.editing === s.id
            ? serviceForm(s, () => { st.editing = null; })
            : h('div', { class: 'svc-admin-actions' },
              h('button', { class: 'text-btn', type: 'button', onclick: () => { st.editing = s.id; st.adding = false; render(); } }, L.edit),
              h('button', { class: 'text-btn', type: 'button', onclick: () => toggle(s) }, s.active ? L.hide : L.showSvc),
              i > 0 ? h('button', { class: 'text-btn', type: 'button', onclick: () => move(s.id, 'up') }, `↑ ${L.up}`) : null,
              i < st.services.length - 1 ? h('button', { class: 'text-btn', type: 'button', onclick: () => move(s.id, 'down') }, `↓ ${L.down}`) : null,
              s.active ? null : h('span', { class: 'muted' }, L.hidden),
            ),
        ))),
        h('div', { class: 'block' }, st.adding
          ? serviceForm(null, () => { st.adding = false; })
          : h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { st.adding = true; st.editing = null; render(); } }, `+ ${L.addService}`)),
      ),
    );
  }

  // ---------- days off ----------
  function daysOffView() {
    const L = t();
    const date = h('input', { class: 'input', id: 'close-date', type: 'date', required: true, min: state.cfg.today });
    const reason = h('input', { class: 'input', id: 'close-reason', maxlength: '80', placeholder: L.notePh });
    const btn = h('button', { class: 'btn btn-white', type: 'submit' }, L.closeDay);
    const msg = h('div');
    if (st.flash) msg.append(h('p', { class: 'msg msg-note', role: 'status' }, st.flash));

    return h('div', { class: 'admin-grid two' },
      h('section', null,
        st.closures.length
          ? h('ul', { class: 'list-rows' }, st.closures.map((c) => h('li', null,
            h('div', null, fmt.long(c.date), c.reason ? h('span', null, ` · ${c.reason}`) : null),
            h('button', { class: 'text-btn', type: 'button', onclick: async () => { await call(`/api/admin/closures/${c.date}`, { method: 'DELETE' }); refresh(); } }, L.reopen),
          )))
          : h('p', { class: 'empty' }, L.noClosures),
      ),
      h('section', { class: 'panel' },
        h('h2', null, L.tabDaysOff),
        h('p', null, L.daysOffHint),
        h('form', {
          novalidate: true,
          onsubmit: async (e) => {
            e.preventDefault();
            if (!date.value) { date.setAttribute('aria-invalid', 'true'); msg.replaceChildren(errorBox(L.pickDate)); return; }
            setBusy(btn, true, L.saving);
            try {
              const r = await call('/api/admin/closures', { method: 'POST', body: { date: date.value, reason: reason.value } });
              st.flash = r.affected ? L.closedWithBookings(r.affected) : null;
              await refresh();
            } catch (ex) { setBusy(btn, false); msg.replaceChildren(errorBox(ex.message)); }
          },
        },
          h('div', { class: 'field caps' }, h('label', { for: 'close-date' }, L.date), date),
          h('div', { class: 'field caps' }, h('label', { for: 'close-reason' }, L.noteOpt), reason),
          btn,
        ),
        msg,
      ),
    );
  }

  boot(render).then(() => {
    refresh();
    setInterval(() => { if (!document.hidden && st.tab === 'bookings' && st.confirming === null) refresh(); }, 30_000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  }).catch(() => { app.replaceChildren(h('p', { class: 'msg msg-error' }, 'Server nicht erreichbar.')); });
})();
