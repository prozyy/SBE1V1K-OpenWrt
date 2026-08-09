#
# Copyright (C) 2008-2019 Jerrykuku
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-theme-argon
PKG_VERSION:=2.4.6
PKG_RELEASE:=20260731

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/jerrykuku/luci-theme-argon.git
PKG_SOURCE_VERSION:=e2935dc543ba5bc1649cb2286cb9870226974112
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION)-$(PKG_SOURCE_VERSION).tar.zst
PKG_MIRROR_HASH:=skip

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=Jerrykuku

PKG_BUILD_DEPENDS:=luci-base/host

include $(INCLUDE_DIR)/package.mk

define Package/luci-theme-argon
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=4. Themes
  TITLE:=Argon Theme
  URL:=https://github.com/jerrykuku/luci-theme-argon
  DEPENDS:=+uclient-fetch +jsonfilter
  PKGARCH:=all
endef

define Package/luci-theme-argon/description
  Argon is a clean and tidy HTML5 theme for LuCI.
  It features a modern, responsive design with a focus on
  user experience and customization.
endef

define Build/Compile
endef

define Package/luci-theme-argon/install
	$(INSTALL_DIR) $(1)/www/luci-static/argon
	$(CP) -r $(PKG_BUILD_DIR)/htdocs/luci-static/argon/* $(1)/www/luci-static/argon/

	if [ -f $(PKG_BUILD_DIR)/htdocs/luci-static/resources/menu-argon.js ]; then \
		$(INSTALL_DIR) $(1)/www/luci-static/resources; \
		$(CP) $(PKG_BUILD_DIR)/htdocs/luci-static/resources/menu-argon.js $(1)/www/luci-static/resources/; \
	fi

	if [ -d $(PKG_BUILD_DIR)/ucode ]; then \
		$(INSTALL_DIR) $(1)/usr/share/ucode/luci; \
		$(CP) -r $(PKG_BUILD_DIR)/ucode/* $(1)/usr/share/ucode/luci/; \
	fi

	if [ -d $(PKG_BUILD_DIR)/root ]; then \
		$(CP) -r $(PKG_BUILD_DIR)/root/* $(1)/; \
	fi
endef

$(eval $(call BuildPackage,luci-theme-argon))
