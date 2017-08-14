/* global imports log */

const St = imports.gi.St
const Gio = imports.gi.Gio
const Lang = imports.lang
const Main = imports.ui.main
const Slider = imports.ui.slider
const PanelMenu = imports.ui.panelMenu
const PopupMenu = imports.ui.popupMenu

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
    this._proxy = new ColorProxy(Gio.DBus.session, BUS_NAME, OBJECT_PATH,
      (proxy, error) => {
        if (error) {
          log(error.message)
          return
        }
        this._proxy.connect('g-properties-changed',
          Lang.bind(this, this._sync))
        this._sync()
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

    this._schema = new Gio.Settings({
      schema: 'org.gnome.settings-daemon.plugins.color'
    })
  },
  _sliderChanged: function (slider, value) {
    const MAX = 10000
    const MIN = 1000
    const temperature = (value * (MAX - MIN)) + MIN
    this._proxy.Temperature = parseInt(temperature)
  },
  _sync: function () {
    const value = this._proxy.Temperature / 10000.0
    this._slider.setValue(value)
  }
})

function Extension () {
  let indicator = null

  this.enable = function enable () {
    if (indicator === null) {
      indicator = new SliderMenuItem()
      Main.panel.statusArea.aggregateMenu.menu.addMenuItem(indicator.menu, 2)
    }
  }

  this.disable = function disable () {
    // TODO: Figure out how to remove from panel
    indicator.destroy()
    indicator = null
  }
}

function init () { // eslint-disable-line no-unused-vars
  return new Extension()
}
