/* global imports log */

const Gtk = imports.gi.Gtk

// Extension specific
const Me = imports.misc.extensionUtils.getCurrentExtension()
const Convenience = Me.imports.convenience

function buildPrefsWidget () { // eslint-disable-line no-unused-vars
  const schema = Convenience.getSettings()

  // Text and descriptions
  const showAlwaysName = 'Show always'
  const showAlwaysDescription = 'Show slider even when night light is off'
  const showIconName = 'Show status icon'
  const showIconDescription = 'Show status icon in status area'
  const enableAlwaysName = 'Enable always'
  const enableAlwaysDescription = 'Enable night light throughout the day'
  const minimumName = 'Minimum value'
  const minimumDescription = 'Minimum night light slider value'
  const maximumName = 'Maximum value'
  const maximumDescription = 'Maximum night light slider value'
  const brightnessSyncName = 'Brightness sync'
  const brightnessSyncDescription = 'Sync brightness slider with night light slider'
  const showInSubmenuName = 'Show in submenu'
  const showInSubmenuDescription = 'Display slider in night light submenu'
  const restartRequiredName = 'Changes require restarting shell (logging in and out) to take place.'

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
      params: { label: `${showIconName}: ` },
      tooltip: showIconDescription,
      align: Gtk.Align.END,
      attach: [0, 2, 1, 1]
    },
    {
      type: 'Switch',
      params: { active: schema.get_boolean('show-status-icon') },
      tooltip: showIconDescription,
      align: Gtk.Align.START,
      attach: [1, 2, 1, 1],
      connect: {
        'state-set': self => {
          schema.set_boolean('show-status-icon', self.active)
        }
      }
    },
    {
      type: 'Label',
      params: { label: `${enableAlwaysName}: ` },
      tooltip: enableAlwaysDescription,
      align: Gtk.Align.END,
      attach: [0, 3, 1, 1]
    },
    {
      type: 'Switch',
      params: { active: schema.get_boolean('enable-always') },
      tooltip: enableAlwaysDescription,
      align: Gtk.Align.START,
      attach: [1, 3, 1, 1],
      connect: {
        'state-set': self => {
          schema.set_boolean('enable-always', self.active)
        }
      }
    },
    {
      type: 'Label',
      params: { label: `${brightnessSyncName}: ` },
      tooltip: brightnessSyncDescription,
      align: Gtk.Align.END,
      attach: [0, 4, 1, 1]
    },
    {
      type: 'Switch',
      params: { active: schema.get_boolean('brightness-sync') },
      tooltip: brightnessSyncDescription,
      align: Gtk.Align.START,
      attach: [1, 4, 1, 1],
      connect: {
        'state-set': self => {
          schema.set_boolean('brightness-sync', self.active)
        }
      }
    },
    {
      type: 'Label',
      params: { label: `${showInSubmenuName}: ` },
      tooltip: showInSubmenuDescription,
      align: Gtk.Align.END,
      attach: [0, 5, 1, 1]
    },
    {
      type: 'Switch',
      params: { active: schema.get_boolean('show-in-submenu') },
      tooltip: showInSubmenuDescription,
      align: Gtk.Align.START,
      attach: [1, 5, 1, 1],
      connect: {
        'state-set': self => {
          schema.set_boolean('show-in-submenu', self.active)
        }
      }
    },
    {
      type: 'Label',
      params: { label: `${minimumName}: ` },
      tooltip: minimumDescription,
      align: Gtk.Align.END,
      attach: [0, 6, 1, 1]
    },
    {
      type: 'Entry',
      params: { text: schema.get_int('minimum').toString() },
      tooltip: minimumDescription,
      align: Gtk.Align.START,
      attach: [1, 6, 1, 1],
      connect: {
        'changed': self => {
          schema.set_int('minimum', parseInt(self.text))
        }
      }
    },
    {
      type: 'Label',
      params: { label: `${maximumName}: ` },
      tooltip: maximumDescription,
      align: Gtk.Align.END,
      attach: [0, 7, 1, 1]
    },
    {
      type: 'Entry',
      params: { text: schema.get_int('maximum').toString() },
      tooltip: maximumDescription,
      align: Gtk.Align.START,
      attach: [1, 7, 1, 1],
      connect: {
        'changed': self => {
          schema.set_int('maximum', parseInt(self.text))
        }
      }
    },
    {
      type: 'Label',
      params: { label: restartRequiredName },
      align: Gtk.Align.CENTER,
      attach: [0, 8, 2, 1]
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

    if (tooltip) {
      // Set description
      widget.set_tooltip_text(tooltip)
    }

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
