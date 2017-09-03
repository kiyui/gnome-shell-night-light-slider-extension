default: schema
	zip -j night-light-slider.timur@linux.com.zip ./night-light-slider.timur@linux.com/*

copy: schema
	cp -rvf night-light-slider.timur@linux.com/ ~/.local/share/gnome-shell/extensions/

schema:
	glib-compile-schemas night-light-slider.timur@linux.com/schemas/
