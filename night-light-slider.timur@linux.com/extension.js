/* global imports log */

const St = imports.gi.St
const Gio = imports.gi.Gio
const GLib = imports.gi.GLib
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
const COLOR_SCHEMA = 'org.gnome.settings-daemon.plugins.color'

/* eslint-disable */
const ColorInterface = '<node> \
<interface name="org.gnome.SettingsDaemon.Color"> \
  <property name="Temperature" type="u" access="readwrite"/> \
  <property name="NightLightActive" type="b" access="read"/> \
</interface> \
</node>'
/* eslint-enable */

const NightLightSlider = new Lang.Class({
  Name: 'NightLightSlider',
  Extends: PanelMenu.SystemIndicator,
  _init: function (schema, settings) {
    this.parent('night-light-symbolic')
    this._schema = schema
    this._min = settings.minimum
    this._max = settings.maximum

    // Set up view
    this._item = new PopupMenu.PopupBaseMenuItem({ activate: false })
    this.menu.addMenuItem(this._item)
    this._item.actor.add(new St.Icon({
      icon_name: 'night-light-symbolic',
      style_class: 'popup-menu-icon' }))

    // Slider
    this._slider = new Slider.Slider(0)
    this._slider.connect('value-changed', this._sliderChanged.bind(this))
    this._slider.actor.accessible_name = 'Temperature'
    this._item.actor.add(this._slider.actor, { expand: true })

    // Connect events
    this._item.actor.connect('button-press-event',
      (actor, event) => this._slider.startDragging(event))
    this._item.actor.connect('key-press-event',
      (actor, event) => this._slider.onKeyPressEvent(actor, event))

    // Update initial view
    this._updateView()
  },
  _proxyHandler: function (proxy, error) {
    if (error) {
      log(error.message)
      return
    }
    this.proxy.connect('g-properties-changed', this.update_view.bind(this))
  },
  _sliderChanged: function (slider, value) {
    const temperature = (value * (this._max - this._min)) + this._min
    this._schema.set_uint('night-light-temperature', parseInt(temperature))
    // If slider is moved, enable night light
    this._schema.set_boolean('night-light-enabled', true)
  },
  _updateView: function () {
    // Update temperature view
    const temperature = this._schema.get_uint('night-light-temperature')
    const value = (temperature - this._min) / (this._max - this._min)
    this._slider.setValue(value)
  }
})

const NightLightSchedule = new Lang.Class({
  Name: 'NightLightSchedule',
  _init: function (schema) {
    this._schema = schema
    this._enabled = false
  },
  _updateSchedule: function () {
    if (!this._enabled) {
      return false
    }
    const date = new Date()
    const hours = date.getHours()
    date.setHours(hours - 6)
    const from = date.getHours()
    date.setHours(hours + 6)
    const to = date.getHours()
    log(`Setting night light schedule from ${from} to ${to}`)
    this._schema.set_boolean('night-light-schedule-automatic', false)
    this._schema.set_double('night-light-schedule-to', to)
    this._schema.set_double('night-light-schedule-from', from)
    return true
  },
  _enableLoop: function () {
    this._enabled = true
    // Get original values to reset to
    this._to = this._schema.get_double('night-light-schedule-to')
    this._from = this._schema.get_double('night-light-schedule-from')
    this._auto = this._schema.get_boolean('night-light-schedule-automatic')

    // Start loop
    this.loopId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000 * 60 * 60, this._updateSchedule.bind(this))
    this._updateSchedule()
  },
  _disableLoop: function () {
    if (this._enabled) {
      this._schema.set_double('night-light-schedule-to', this._to)
      this._schema.set_double('night-light-schedule-from', this._from)
      this._schema.set_boolean('night-light-schedule-automatic', this._auto)
    }
  }
})

const NightLightExtension = new Lang.Class({
  Name: 'NightLightExtension',
  _init: function () {
    this.schema = new Gio.Settings({ schema: COLOR_SCHEMA })
    this.colorProxy = Gio.DBusProxy.makeProxyWrapper(ColorInterface)
    this.scheduleUpdater = new NightLightSchedule(this.schema)

    // This will be defined if icon is set to hide
    this.indicators = null
  },
  enable: function () {
    // Settings
    const settings = Convenience.getSettings()

    // Create and add widget
    const indicator = new NightLightSlider(this.schema, {
      minimum: settings.get_int('minimum'),
      maximum: settings.get_int('maximum')
    })
    Main.panel.statusArea.aggregateMenu.menu.addMenuItem(indicator.menu, INDEX)
    this.icon = Main.panel.statusArea.aggregateMenu._nightLight

    // Set up updater loop to set night light schedule if update always is enabled
    if (settings.get_boolean('enable-always')) {
      this.scheduleUpdater._enableLoop()
    }

    // Hide status icon if set to disable
    if (!settings.get_boolean('show-status-icon')) {
      // TODO: Find alternative way to do this; hide() does not work because extension runs too early
      this.indicators = Main.panel.statusArea.aggregateMenu._nightLight.indicators
      Main.panel.statusArea.aggregateMenu._nightLight.indicators.hide()
      Main.panel.statusArea.aggregateMenu._nightLight.indicators = new St.BoxLayout()
    }

    // Set up proxy to update slider view
    this.colorProxy(Gio.DBus.session, BUS_NAME, OBJECT_PATH, (proxy, error) => {
      if (error) {
        log(error.message)
        return
      }

      proxy.connect('g-properties-changed', () => {
        indicator._updateView()
        if (!settings.get_boolean('show-always')) {
          const active = this._proxy.NightLightActive
          const menuItems = Main.panel.statusArea.aggregateMenu.menu._getMenuItems()
          menuItems[INDEX].actor.visible = active
        }
      })
    })
  },
  disable: function () {
    const menuItems = Main.panel.statusArea.aggregateMenu.menu._getMenuItems()
    menuItems[INDEX].destroy()

    // Restore default status icon behaviour
    if (this.indicators) {
      Main.panel.statusArea.aggregateMenu._nightLight.indicators.destroy()
      Main.panel.statusArea.aggregateMenu._nightLight.indicators = this.indicators
      Main.panel.statusArea.aggregateMenu._nightLight.indicators.show()
    }

    // Disable updater loop
    this.scheduleUpdater._disableLoop()
  }
})

function init () { // eslint-disable-line
  return new NightLightExtension()
}
