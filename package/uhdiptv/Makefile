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
PKG_RELEASE:=2

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
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./files/uhdiptv $(1)/usr/bin/uhdiptv
	$(INSTALL_DIR) $(1)/usr/libexec
	$(INSTALL_BIN) ./files/uhdiptv.run $(1)/usr/libexec/uhdiptv-run
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/uhdiptv.init $(1)/etc/init.d/uhdiptv
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/uhdiptv.config $(1)/etc/config/uhdiptv
endef

$(eval $(call BuildPackage,uhdiptv))
