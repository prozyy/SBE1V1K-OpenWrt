'use strict';
'require view';
'require form';
'require rpc';
'require ui';
'require poll';
'require fs';
'require uci';

var callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: [ 'name' ],
	expect: { '': {} }
});

var callInitList = rpc.declare({
	object: 'luci',
	method: 'getInitList',
	params: [ 'name' ],
	expect: { '': {} }
});

var callInitAction = rpc.declare({
	object: 'luci',
	method: 'setInitAction',
	params: [ 'name', 'action' ],
	expect: { result: false }
});

function serviceStatus() {
	return Promise.all([
		L.resolveDefault(callServiceList('uhdiptv'), {}),
		L.resolveDefault(callInitList('uhdiptv'), {})
	]).then(function(res) {
		var instances = ((res[0] || {})['uhdiptv'] || {}).instances || {};
		var running = false, pid = null;
		for (var k in instances) {
			if (instances[k].running) {
				running = true;
				pid = instances[k].pid;
				break;
			}
		}
		var init = (res[1] || {})['uhdiptv'] || {};
		return { running: running, pid: pid, enabled: init.enabled ? true : false };
	});
}

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('uhdiptv'),
			serviceStatus()
		]);
	},

	listenAddr: function() {
		var host = uci.get('uhdiptv', 'main', 'host') || '0.0.0.0';
		var port = uci.get('uhdiptv', 'main', 'port') || '8766';
		return (host === '0.0.0.0' ? '*' : host) + ':' + port;
	},

	// Build the live subscription URL from the address the admin is currently
	// using to reach the router, the proxy port and the example playlist path.
	subUrl: function() {
		var port = uci.get('uhdiptv', 'main', 'port') || '8766';
		var playlist = uci.get('uhdiptv', 'main', 'playlist') || '4kfifa.m3u';
		var host = uci.get('uhdiptv', 'main', 'host') || '0.0.0.0';
		var h = (window.location && window.location.hostname) ? window.location.hostname : host;
		if (h === '0.0.0.0' || h === '')
			h = '<router-ip>';
		playlist = String(playlist).replace(/^\/+/, '');
		return 'http://' + h + ':' + port + '/' + playlist;
	},

	copyHandler: function(url) {
		return function(ev) {
			ev.preventDefault();
			var done = function() { ui.addNotification(null, E('p', {}, _('Subscription URL copied')), 'info'); };
			if (window.navigator && navigator.clipboard && navigator.clipboard.writeText) {
				navigator.clipboard.writeText(url).then(done).catch(function() {});
			} else {
				var inp = ev.target.parentNode.querySelector('input');
				if (inp) { inp.focus(); inp.select(); try { document.execCommand('copy'); done(); } catch (e) {} }
			}
		};
	},

	// Dynamic (polled) part of the status card: run state + boot state.
	dynStatus: function(st) {
		return [
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Service state')),
				E('div', { 'class': 'cbi-value-field' }, st.running
					? E('span', { 'style': 'color:#2ea043;font-weight:600' },
						_('Running') + (st.pid ? (' · PID %d').format(st.pid) : ''))
					: E('span', { 'style': 'color:#cf222e;font-weight:600' }, _('Stopped')))
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Start on boot')),
				E('div', { 'class': 'cbi-value-field' }, st.enabled
					? E('span', { 'style': 'color:#2ea043' }, _('Enabled'))
					: E('span', { 'style': 'color:#8b949e' }, _('Disabled')))
			])
		];
	},

	toggleButtons: function(st) {
		var states = {
			'uhdiptv-btn-start': st.running,
			'uhdiptv-btn-stop': !st.running,
			'uhdiptv-btn-restart': !st.running,
			'uhdiptv-btn-enable': st.enabled,
			'uhdiptv-btn-disable': !st.enabled
		};
		for (var id in states) {
			var b = document.getElementById(id);
			if (b) b.disabled = states[id];
		}
	},

	updateStatus: function() {
		var self = this;
		return serviceStatus().then(function(st) {
			var box = document.getElementById('uhdiptv-status');
			if (box)
				L.dom.content(box, self.dynStatus(st));
			self.toggleButtons(st);
		});
	},

	updateLog: function() {
		return L.resolveDefault(fs.exec('/sbin/logread', [ '-e', 'uhdiptv' ]), {}).then(function(res) {
			var ta = document.getElementById('uhdiptv-log');
			if (!ta) return;
			var txt = (res && res.stdout) ? res.stdout.trim() : '';
			ta.value = txt.length ? txt : _('(no log lines yet)');
			ta.scrollTop = ta.scrollHeight;
		});
	},

	action: function(act) {
		var self = this;
		return function(ev) {
			var btn = ev.currentTarget;
			btn.classList.add('spinning');
			btn.disabled = true;
			return callInitAction('uhdiptv', act)
				.then(function() {
					return new Promise(function(r) { window.setTimeout(r, 800); });
				})
				.then(function() { return self.updateStatus(); })
				.catch(function(e) {
					ui.addNotification(null, E('p', {}, '%s: %s'.format(_('Action failed'), e.message)), 'danger');
				})
				.finally(function() { btn.classList.remove('spinning'); });
		};
	},

	renderControls: function(st) {
		var url = this.subUrl();

		return E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Service control')),

			// Static rows
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Listen address')),
				E('div', { 'class': 'cbi-value-field' }, E('code', {}, this.listenAddr()))
			]),
			E('div', { 'class': 'cbi-value' }, [
				E('label', { 'class': 'cbi-value-title' }, _('Subscription URL')),
				E('div', { 'class': 'cbi-value-field' }, [
					E('input', {
						'type': 'text',
						'readonly': 'readonly',
						'class': 'cbi-input-text',
						'style': 'width:auto;min-width:22em;max-width:100%',
						'value': url
					}),
					' ',
					E('button', { 'class': 'btn cbi-button cbi-button-action', 'click': this.copyHandler(url) }, _('Copy')),
					' ',
					E('a', { 'class': 'btn cbi-button', 'href': url, 'target': '_blank', 'rel': 'noreferrer' }, _('Open')),
					E('div', { 'style': 'color:#8b949e;margin-top:.3em;font-size:90%' },
						_('Feed this address to your IPTV player. The proxy must be running; the .m3u path selects the channel.'))
				])
			]),

			// Dynamic (polled) rows
			E('div', { 'id': 'uhdiptv-status' }, this.dynStatus(st)),

			// Buttons
			E('div', { 'class': 'cbi-value', 'style': 'border-top:1px solid rgba(128,128,128,.2);padding-top:.8em' }, [
				E('div', { 'class': 'cbi-value-field', 'style': 'display:flex;gap:.4em;flex-wrap:wrap' }, [
					E('button', { 'id': 'uhdiptv-btn-start', 'class': 'btn cbi-button cbi-button-apply',
						'click': this.action('start'), 'disabled': st.running ? 'disabled' : null }, _('Start')),
					E('button', { 'id': 'uhdiptv-btn-stop', 'class': 'btn cbi-button cbi-button-reset',
						'click': this.action('stop'), 'disabled': st.running ? null : 'disabled' }, _('Stop')),
					E('button', { 'id': 'uhdiptv-btn-restart', 'class': 'btn cbi-button cbi-button-action',
						'click': this.action('restart'), 'disabled': st.running ? null : 'disabled' }, _('Restart')),
					E('span', { 'style': 'flex-basis:100%;height:0' }),
					E('button', { 'id': 'uhdiptv-btn-enable', 'class': 'btn cbi-button cbi-button-positive',
						'click': this.action('enable'), 'disabled': st.enabled ? 'disabled' : null }, _('Enable on boot')),
					E('button', { 'id': 'uhdiptv-btn-disable', 'class': 'btn cbi-button cbi-button-neutral',
						'click': this.action('disable'), 'disabled': st.enabled ? null : 'disabled' }, _('Disable on boot'))
				])
			])
		]);
	},

	renderLog: function() {
		return E('div', { 'class': 'cbi-section' }, [
			E('h3', {}, _('Log')),
			E('textarea', {
				'id': 'uhdiptv-log',
				'class': 'cbi-input-textarea',
				'readonly': 'readonly',
				'wrap': 'off',
				'rows': 14,
				'style': 'width:100%;font-family:monospace;white-space:pre'
			}, _('Collecting data…'))
		]);
	},

	render: function(data) {
		var self = this;
		var st = data[1] || { running: false, pid: null, enabled: false };

		var m = new form.Map('uhdiptv', _('UHD IPTV Live Proxy'),
			_('A Rust-based CCTV/IPTV live m3u8 proxy. Adjust the daemon parameters below, then use the controls above to start, stop or enable it on boot.'));

		var s = m.section(form.NamedSection, 'main', 'uhdiptv', _('Daemon settings'));
		s.addremove = false;

		var o;
		o = s.option(form.Value, 'host', _('Listen host'), _('Address to bind. Use 0.0.0.0 for all interfaces.'));
		o.datatype = 'ipaddr';
		o.placeholder = '0.0.0.0';

		o = s.option(form.Value, 'port', _('Listen port'));
		o.datatype = 'port';
		o.placeholder = '8766';

		o = s.option(form.Value, 'playlist', _('Example playlist path'),
			_('Shown in the subscription URL above; the .m3u path selects the channel, e.g. 4kfifa.m3u.'));
		o.placeholder = '4kfifa.m3u';
		o.optional = true;

		o = s.option(form.Value, 'cache_ttl', _('Cache TTL (s)'), _('Empty = built-in default (600).'));
		o.datatype = 'uinteger';
		o.optional = true;

		o = s.option(form.Value, 'http_workers', _('HTTP workers'), _('Empty = built-in default (64).'));
		o.datatype = 'uinteger';
		o.optional = true;

		o = s.option(form.Value, 'session_ttl', _('Session TTL (s)'), _('Empty = built-in default (7200).'));
		o.datatype = 'uinteger';
		o.optional = true;

		o = s.option(form.Value, 'timeout', _('Upstream timeout (s)'), _('Empty = built-in default (15).'));
		o.datatype = 'uinteger';
		o.optional = true;

		o = s.option(form.Flag, 'insecure_tls', _('Skip TLS verification'), _('Pass --insecure-tls to the proxy.'));
		o.rmempty = false;

		o = s.option(form.Value, 'meta_json', _('Meta JSON'), _('Optional value passed as --meta-json.'));
		o.optional = true;

		o = s.option(form.Value, 'device_json', _('Device JSON'), _('Optional value passed as --device-json.'));
		o.optional = true;

		o = s.option(form.Value, 'extra_args', _('Extra arguments'),
			_('Additional raw CLI flags, appended verbatim (advanced).'));
		o.optional = true;

		return m.render().then(function(mapEl) {
			var container = E('div', {}, [
				self.renderControls(st),
				mapEl,
				self.renderLog()
			]);

			poll.add(L.bind(self.updateStatus, self), 5);
			poll.add(L.bind(self.updateLog, self), 8);

			return container;
		});
	}
});
