#
# LuCI support for real-time client traffic monitoring
#
# Upstream (https://github.com/OppsError404/luci-app-client-monitor) ships only
# prebuilt .apk/.ipk release artifacts, no buildable source tree. The runtime
# files vendored here are taken from the SBE1V1K device's installed state, which
# additionally carries the Argon light/dark theme adaptation (see the ucode
# template, which follows /etc/config/argon). The frontend CSS/JS are kept in
# readable form under htdocs/ and gzip-compressed at build time, matching the
# upstream layout where the init script decompresses them to RAM at boot.
#
include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-client-monitor
PKG_VERSION:=1.0.0
PKG_RELEASE:=2

PKG_MAINTAINER:=zappy <zappy@morgan.edu>
PKG_LICENSE:=MIT

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-client-monitor
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=Real-time client traffic monitor (Argon-themed)
  URL:=https://github.com/OppsError404/luci-app-client-monitor
  PKGARCH:=all
  # Matches the upstream package's dependency closure as installed on the device.
  # Lua interpreter + the modules the code require()s:
  #   /usr/bin/lua (lua), "nixio" (luci-lib-nixio), "luci.jsonc" (luci-lib-jsonc,
  #   pulled in transitively by luci-lib-base too), "ubus" (libubus-lua),
  #   "uci" (libuci-lua). Frontend/ACL exec via cgi-io. Runtime tools: nft(8)
  #   from nftables, bridge(8) from ip-bridge. libubus-lua is unversioned - it
  #   binds at runtime to whatever the firmware builds (same 2026-06-28 source).
  DEPENDS:=+luci-base +lua +luci-lib-nixio +luci-lib-jsonc +luci-lib-base +libubus-lua +libuci-lua +cgi-io +nftables +ip-bridge
endef

define Package/luci-app-client-monitor/description
  Live per-client Rx/Tx monitoring UI for OpenWrt LuCI: 5-minute rolling
  graphs, Wi-Fi/LAN/bridge client discovery and interface rate cards, backed
  by an on-demand nftables bridge-counter collector daemon. This build follows
  the Argon theme's light/dark mode.
endef

# Vendored files only - nothing to fetch, configure or compile.
define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
endef

define Build/Configure
endef

define Build/Compile
endef

define Package/luci-app-client-monitor/install
	# --- init service + hotplug ---
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/client_monitor $(1)/etc/init.d/client_monitor
	$(INSTALL_DIR) $(1)/etc/hotplug.d/net
	$(INSTALL_BIN) ./files/etc/hotplug.d/net/99-client-monitor $(1)/etc/hotplug.d/net/99-client-monitor

	# --- collector daemon + AP discovery + rpcd backend ---
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/usr/sbin/client_monitor_collect $(1)/usr/sbin/client_monitor_collect
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/ap_monitor $(1)/usr/bin/ap_monitor
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd
	$(INSTALL_BIN) ./files/usr/libexec/rpcd/client_monitor $(1)/usr/libexec/rpcd/client_monitor

	# --- Lua collector modules ---
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/client_monitor_pkg
	$(INSTALL_DATA) ./files/usr/lib/lua/luci/client_monitor_pkg/*.lua $(1)/usr/lib/lua/luci/client_monitor_pkg/

	# --- ucode view template (Argon-aware) ---
	$(INSTALL_DIR) $(1)/usr/share/ucode/luci/template/client_monitor
	$(INSTALL_DATA) ./files/usr/share/ucode/luci/template/client_monitor/client_monitor.ut $(1)/usr/share/ucode/luci/template/client_monitor/

	# --- LuCI menu + rpcd ACL ---
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./files/usr/share/luci/menu.d/luci-app-client-monitor.json $(1)/usr/share/luci/menu.d/
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./files/usr/share/rpcd/acl.d/luci-app-client-monitor.json $(1)/usr/share/rpcd/acl.d/

	# --- frontend assets: shipped gzip-compressed, decompressed to RAM at boot ---
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/client_monitor
	gzip -9nc ./htdocs/luci-static/resources/view/client_monitor/client_monitor.css \
		> $(1)/www/luci-static/resources/view/client_monitor/client_monitor.css.gz
	gzip -9nc ./htdocs/luci-static/resources/view/client_monitor/client_monitor.js \
		> $(1)/www/luci-static/resources/view/client_monitor/client_monitor.js.gz
endef

define Package/luci-app-client-monitor/postinst
#!/bin/sh
# On a live install: enable + start so the init script decompresses the gzipped
# CSS/JS to RAM (the UI has no styling/scripts until that symlink exists), then
# drop LuCI caches and reload rpcd so the new menu/ACL/ubus object show up.
# On image builds ($IPKG_INSTROOT set) this is deferred to first boot.
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/client_monitor enable >/dev/null 2>&1
	/etc/init.d/client_monitor start >/dev/null 2>&1
	rm -f /tmp/luci-indexcache* /tmp/luci-modulecache/* 2>/dev/null
	/etc/init.d/rpcd reload >/dev/null 2>&1
}
exit 0
endef

define Package/luci-app-client-monitor/prerm
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	/etc/init.d/client_monitor stop >/dev/null 2>&1
	/etc/init.d/client_monitor disable >/dev/null 2>&1
}
exit 0
endef

$(eval $(call BuildPackage,luci-app-client-monitor))
