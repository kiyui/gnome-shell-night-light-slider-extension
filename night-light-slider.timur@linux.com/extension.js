/* global imports log */

const St = imports.gi.St
const Gio = imports.gi.Gio
const Lang = imports.lang
const Main = imports.ui.main
const Slider = imports.ui.slider
const PanelMenu = imports.ui.panelMenu
const PopupMenu = imports.ui.popupMenu
const Me = imports.misc.extensionUtils.getCurrentExtension()
const Convenience = Me.imports.convenience

// Globals
const INDEX = 2
const BUS_NAME = 'org.gnome.SettingsDaemon.Color'
const OBJECT_PATH = '/org/gnome/SettingsDaemon/Color'

/* eslint-disable */
const ColorInterface = '<node> \
<interface name="org.gnome.SettingsDaemon.Color"> \
  <property name="Temperature" type="u" access="readwrite"/> \
  <property name="NightLightActive" type="b" access="read"/> \
</interface> \
</node>'
/* eslint-enable */

const ColorProxy = Gio.DBusProxy.makeProxyWrapper(ColorInterface)

const SliderMenuItem = new Lang.Class({
  Name: 'SliderMenuItem',
  Extends: PanelMenu.SystemIndicator,

  _init: function (schema, settings) {
    this.parent('night-light-symbolic')
    this._schema = schema
    this._settings = settings

    // We use this proxy to communicate external changes (like a stream) but set
    // the value using the schema because using the proxy doesn't seem to reflect
    // or be saved. This can be monitored in dconf. Not sure why :)
    this._proxy = new ColorProxy(Gio.DBus.session, BUS_NAME, OBJECT_PATH, (proxy, error) => {
      if (error) {
        log(error.message)
        return
      }

      this._proxy.connect('g-properties-changed', () => this.update_view())
      this.update_view()
    })

    // Get settings
    this._min = this._settings.get_int('minimum')
    this._max = this._settings.get_int('maximum')

    this._item = new PopupMenu.PopupBaseMenuItem({ activate: false })
    this.menu.addMenuItem(this._item)

    this._slider = new Slider.Slider(0)
    this._slider.connect('value-changed', (slider, value) => this._sliderChanged(slider, value))
    this._slider.actor.accessible_name = 'Temperature'

    const icon = new St.Icon({
      icon_name: 'night-light-symbolic',
      style_class: 'popup-menu-icon'
    })

    this._item.actor.add(icon)
    this._item.actor.add(this._slider.actor, { expand: true })
    this._item.actor.connect('button-press-event', (actor, event) => {
      return this._slider.startDragging(event)
    })

    this._item.actor.connect('key-press-event', (actor, event) => {
      return this._slider.onKeyPressEvent(actor, event)
    })
  },
  _sliderChanged: function (slider, value) {
    const temperature = (value * (this._max - this._min)) + this._min
    this._schema.set_uint('night-light-temperature', parseInt(temperature))
  },
  update_view: function () {
    // Update temperature view
    const temperature = this._schema.get_uint('night-light-temperature')
    const value = (temperature - this._min) / (this._max - this._min)
    this._slider.setValue(value)

    // Update visibility
    if (!this._settings.get_boolean('show-always')) {
      const active = this._proxy.NightLightActive
      const menuItems = Main.panel.statusArea.aggregateMenu.menu._getMenuItems()
      menuItems[INDEX].actor.visible = active
    }
  }
})

// Extension initilization
function Extension () {
  this.enable = function enable () {
    // Settings
    const schema = new Gio.Settings({
      schema: 'org.gnome.settings-daemon.plugins.color'
    })
    const settings = Convenience.getSettings()

    // Create widget
    const indicator = new SliderMenuItem(schema, settings)
    Main.panel.statusArea.aggregateMenu.menu.addMenuItem(indicator.menu, INDEX)

    // Set enabled 24 hours if set in settings
    if (settings.get_boolean('enable-always')) {
      log('Setting night light schedule from 0 to 48')
      schema.set_boolean('night-light-schedule-automatic', false)
      schema.set_double('night-light-schedule-from', 0)
      schema.set_double('night-light-schedule-to', 24.0)
    }
  }

  this.disable = function disable () {
    const menuItems = Main.panel.statusArea.aggregateMenu.menu._getMenuItems()
    menuItems[INDEX].destroy()
  }
}

function init () { // eslint-disable-line no-unused-vars
  return new Extension()
}
