/* global imports log */

const St = imports.gi.St
const Gio = imports.gi.Gio
const Lang = imports.lang
const Main = imports.ui.main
const Slider = imports.ui.slider
const PanelMenu = imports.ui.panelMenu
const PopupMenu = imports.ui.popupMenu

// Globals
const MAX = 10000
const MIN = 1000
const BUS_NAME = 'org.gnome.SettingsDaemon.Color'
const OBJECT_PATH = '/org/gnome/SettingsDaemon/Color'

/* eslint-disable */
const ColorInterface = '<node> \
<interface name="org.gnome.SettingsDaemon.Color"> \
  <property name="Temperature" type="u" access="readwrite"/> \
</interface> \
</node>'
/* eslint-enable */

const ColorProxy = Gio.DBusProxy.makeProxyWrapper(ColorInterface)

const SliderMenuItem = new Lang.Class({
  Name: 'SliderMenuItem',
  Extends: PanelMenu.SystemIndicator,

  _init: function () {
    this.parent('night-light-symbolic')

    this._schema = new Gio.Settings({
      schema: 'org.gnome.settings-daemon.plugins.color'
    })

    // We use this proxy to communicate external changes (like a stream) but set
    // the value using the schema because using the proxy doesn't seem to reflect
    // or be saved. This can be monitored in dconf. Not sure why :)
    this._proxy = new ColorProxy(Gio.DBus.session, BUS_NAME, OBJECT_PATH, (proxy, error) => {
      if (error) {
        log(error.message)
        return
      }

      this._proxy.connect('g-properties-changed', Lang.bind(this, this._update_slider))
      this._update_slider()
    })

    this._item = new PopupMenu.PopupBaseMenuItem({ activate: false })
    this.menu.addMenuItem(this._item)

    this._slider = new Slider.Slider(0)
    this._slider.connect('value-changed', Lang.bind(this, this._sliderChanged))
    this._slider.actor.accessible_name = ('Temperature')

    let icon = new St.Icon({
      icon_name: 'night-light-symbolic',
      style_class: 'popup-menu-icon'
    })

    this._item.actor.add(icon)
    this._item.actor.add(this._slider.actor, { expand: true })
    this._item.actor.connect('button-press-event', Lang.bind(this, function (actor, event) {
      return this._slider.startDragging(event)
    }))

    this._item.actor.connect('key-press-event', Lang.bind(this, function (actor, event) {
      return this._slider.onKeyPressEvent(actor, event)
    }))
  },
  _sliderChanged: function (slider, value) {
    const temperature = (value * (MAX - MIN)) + MIN
    this._schema.set_uint('night-light-temperature', parseInt(temperature))
  },
  _update_slider: function () {
    const temperature = this._schema.get_uint('night-light-temperature')
    const value = (temperature - MIN) / (MAX - MIN)
    this._slider.setValue(value)
  }
})

// Extension initilization
function Extension () {
  this.enable = function enable () {
    const indicator = new SliderMenuItem()
    Main.panel.statusArea.aggregateMenu.menu.addMenuItem(indicator.menu, 2)
  }

  this.disable = function disable () {
    const menuItems = Main.panel.statusArea.aggregateMenu.menu._getMenuItems()
    menuItems[2].destroy()
  }
}

function init () { // eslint-disable-line no-unused-vars
  return new Extension()
}
