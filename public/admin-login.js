(() => {
  'use strict';
  const { h, api, route, t, state, setBusy, errorBox, boot } = window.DRB;
  const app = document.getElementById('app');
  const st = { email: '', error: null };

  function render() {
    const L = t();
    const email = h('input', { class: 'input', id: 'email', type: 'email', autocomplete: 'username', placeholder: 'admin@example.com', required: true });
    email.value = st.email;
    email.addEventListener('input', () => { st.email = email.value; });
    const pw = h('input', { class: 'input', id: 'pw', type: 'password', autocomplete: 'current-password', placeholder: '••••••••', required: true });
    const btn = h('button', { class: 'btn btn-white', type: 'submit' }, L.signIn);

    app.replaceChildren(h('form', {
      novalidate: true,
      onsubmit: async (e) => {
        e.preventDefault();
        setBusy(btn, true, L.signingIn);
        try {
          await api('/api/admin/login', { method: 'POST', body: { email: email.value, password: pw.value } });
          location.replace(route('admin'));
        } catch (ex) {
          st.error = ex.message;
          render();
          document.getElementById('pw').focus();
        }
      },
    },
      h('div', { class: 'admin-brand' }, h('h1', null, state.cfg.shopName), h('p', null, L.adminPanel)),
      h('div', { class: 'field caps' }, h('label', { for: 'email' }, L.emailLabel), email),
      h('div', { class: 'field caps' }, h('label', { for: 'pw' }, L.password), pw),
      st.error ? errorBox(st.error) : null,
      btn,
    ));
    (st.email ? pw : email).focus();
  }

  boot(render).catch(() => { app.replaceChildren(h('p', { class: 'msg msg-error' }, 'Server nicht erreichbar.')); });
})();
