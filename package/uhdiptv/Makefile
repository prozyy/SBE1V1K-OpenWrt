#
# UHD IPTV live m3u8 proxy
#
# This package ships a prebuilt statically-linked aarch64 binary together with
# a procd init script and a UCI config, so the proxy can be managed through
# /etc/init.d/uhdiptv and the luci-app-uhdiptv web UI.
#
include $(TOPDIR)/rules.mk

PKG_NAME:=uhdiptv
PKG_VERSION:=0.1.0
PKG_RELEASE:=3

PKG_MAINTAINER:=zappy <zappy@morgan.edu>
PKG_LICENSE:=Proprietary

include $(INCLUDE_DIR)/package.mk

define Package/uhdiptv
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Web Servers/Proxies
  TITLE:=UHD IPTV live m3u8 proxy
  URL:=https://morgan.edu/
  # Prebuilt static aarch64 binary - no runtime library dependencies.
endef

define Package/uhdiptv/description
  UHD IPTV (ysptp-project) is a Rust-based CCTV/IPTV live m3u8 proxy.
  It ships as a prebuilt, statically-linked aarch64 binary and is managed
  by a procd service plus a UCI configuration file.
endef

define Package/uhdiptv/conffiles
/etc/config/uhdiptv
endef

# Prebuilt binary: nothing to fetch, configure or compile.
define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
endef

define Build/Configure
endef

define Build/Compile
endef

define Package/uhdiptv/install
	# The proxy persists its *-state-rs.json next to its own executable (it
	# resolves /proc/self/exe, ignoring CWD), so install the binary into a
	# private data dir that it can write into, and expose it on PATH via a
	# symlink. State files then live in /usr/lib/uhdiptv, never in /usr/bin.
	$(INSTALL_DIR) $(1)/usr/lib/uhdiptv
	$(INSTALL_BIN) ./files/uhdiptv $(1)/usr/lib/uhdiptv/uhdiptv
	$(INSTALL_DIR) $(1)/usr/bin
	$(LN) ../lib/uhdiptv/uhdiptv $(1)/usr/bin/uhdiptv
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/uhdiptv.init $(1)/etc/init.d/uhdiptv
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/uhdiptv.config $(1)/etc/config/uhdiptv
endef

$(eval $(call BuildPackage,uhdiptv))
