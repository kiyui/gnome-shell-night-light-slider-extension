default: schema
	cd night-light-slider.timur@linux.com/ && zip -r ../night-light-slider.timur@linux.com.zip ./*

copy: schema
	cp -rvf night-light-slider.timur@linux.com/ ~/.local/share/gnome-shell/extensions/

schema:
	glib-compile-schemas night-light-slider.timur@linux.com/schemas/
