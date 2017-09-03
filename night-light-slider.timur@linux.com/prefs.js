/* global imports log */

const Gtk = imports.gi.Gtk

// Extension specific
const Me = imports.misc.extensionUtils.getCurrentExtension()
const Convenience = Me.imports.convenience

function buildPrefsWidget () { // eslint-disable-line no-unused-vars
  const schema = Convenience.getSettings()

  // Text and descriptions
  const showAlwaysName = schema.settings_schema.get_key('show-always').get_summary()
  const showAlwaysDescription = schema.settings_schema.get_key('show-always').get_description()
  const enableAlwaysName = schema.settings_schema.get_key('enable-always').get_summary()
  const enableAlwaysDescription = schema.settings_schema.get_key('enable-always').get_description()

  // Create children objects
  const widgets = [
    {
      type: 'Label',
      params: { label: `${showAlwaysName}: ` },
      tooltip: showAlwaysDescription,
      align: Gtk.Align.END,
      attach: [0, 1, 1, 1]
    },
    {
      type: 'Switch',
      params: { active: schema.get_boolean('show-always') },
      tooltip: showAlwaysDescription,
      align: Gtk.Align.START,
      attach: [1, 1, 1, 1],
      connect: {
        'state-set': self => {
          schema.set_boolean('show-always', self.active)
        }
      }
    },
    {
      type: 'Label',
      params: { label: `${enableAlwaysName}: ` },
      tooltip: enableAlwaysDescription,
      align: Gtk.Align.END,
      attach: [0, 2, 1, 1]
    },
    {
      type: 'Switch',
      params: { active: schema.get_boolean('enable-always') },
      tooltip: enableAlwaysDescription,
      align: Gtk.Align.START,
      attach: [1, 2, 1, 1],
      connect: {
        'state-set': self => {
          schema.set_boolean('enable-always', self.active)
        }
      }
    },
    {
      type: 'Label',
      params: { label: 'Changes require restarting extension to take place.' },
      tooltip: showAlwaysDescription,
      align: Gtk.Align.CENTER,
      attach: [0, 3, 2, 1]
    }
  ]

  // Perform side-effects
  const vbox = new Gtk.Grid({
    column_spacing: 20,
    row_spacing: 20,
    margin: 10
  })

  widgets.map(function createWidget ({ type, params, tooltip, align, attach, connect }) {
    const widget = new Gtk[type](params)

    // Set description
    widget.set_tooltip_text(tooltip)

    // Set alignment
    widget.set_halign(align)
    widget.set_hexpand(true)

    // Add event handler if exists
    if (connect) {
      Object.keys(connect).map(function performConnect (signal) {
        widget.connect(signal, () => connect[signal](widget))
      })
    }

    vbox.attach(widget, ...attach)
  })

  vbox.show_all()
  return vbox
}

function init () { // eslint-disable-line
  log('Setting up night light slider preferences')
}
