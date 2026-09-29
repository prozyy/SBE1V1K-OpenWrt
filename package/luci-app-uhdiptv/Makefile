#
# LuCI support for the UHD IPTV live m3u8 proxy
#
include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI support for UHD IPTV live proxy
LUCI_DEPENDS:=+uhdiptv
LUCI_PKGARCH:=all

PKG_VERSION:=0.1.0
PKG_RELEASE:=1
PKG_MAINTAINER:=zappy <zappy@morgan.edu>
PKG_LICENSE:=Apache-2.0

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
