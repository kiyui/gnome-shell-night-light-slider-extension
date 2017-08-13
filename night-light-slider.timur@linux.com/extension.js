/* global imports */

const St = imports.gi.St
const Gio = imports.gi.Gio
const Lang = imports.lang
const Main = imports.ui.main
const Slider = imports.ui.slider
const PanelMenu = imports.ui.panelMenu
const PopupMenu = imports.ui.popupMenu

const SliderMenuItem = new Lang.Class({
  Name: 'SliderMenuItem',
  Extends: PopupMenu.PopupBaseMenuItem,
  _init: function () {
    this.parent({ reactive: false })
    this._slider = new Slider.Slider(0)
    this._slider.connect('value-changed', Lang.bind(this, this._sliderChanged))
    this._slider.actor.accessible_name = ('Temperature')

    let icon = new St.Icon({
      icon_name: 'night-light-symbolic',
      style_class: 'popup-menu-icon'
    })

    this.actor.add(icon)
    this.actor.add(this._slider.actor, { expand: true })

    this.actor.connect('button-press-event', Lang.bind(this, function (actor, event) {
      return this._slider.startDragging(event)
    }))

    this.actor.connect('key-press-event', Lang.bind(this, function (actor, event) {
      return this._slider.onKeyPressEvent(actor, event)
    }))

    this._schema = new Gio.Settings({
      schema: 'org.gnome.settings-daemon.plugins.color'
    })

    // TODO: Update slider with current value
    this._current = this._schema.get_uint('night-light-temperature')
  },
  _sliderChanged: function (slider, value) {
    const MAX = 10000
    const MIN = 1000
    const temperature = (value * (MAX - MIN)) + MIN
    this._setValue(parseInt(temperature))
  },
  _setValue: function _setValue (value) {
    this._schema.set_uint('night-light-temperature', value)
    this._current = value
  }
})

const NightLightSlider = new Lang.Class({
  Name: 'NightLightSlider',
  Extends: PanelMenu.Button,

  _init: function () {
    this.parent(null, 'NightLightSlider')

    this.icon = new St.Icon({
      icon_name: 'night-light-symbolic',
      style_class: 'system-status-icon'
    })

    this.actor.add_actor(this.icon)

    // Add slider menu
    this._menuItem = new SliderMenuItem()
    this.menu.addMenuItem(this._menuItem)
  }
})

function Extension () {
  const uuid = 'timur-kiyui-night-light-slider'

  this.enable = function enable () {
    const indicator = new NightLightSlider()
    Main.panel.addToStatusArea(uuid, indicator)
    Main.panel.statusArea[uuid].icon.icon_name = 'night-light-symbolic'
    Main.panel.statusArea[uuid].actor.visible = true
  }

  this.disable = function disable () {
    Main.panel.statusArea[uuid].destroy()
  }
}

function init () { // eslint-disable-line no-unused-vars
  // TODO: Embed extension into main settings dropdown instead
  // of adding a separate icon for managing the temperature
  return new Extension()
}
