from fedora

run dnf install -y xpra
run dnf install -y mesa-dri-drivers

# These packages are just for debugging and not needed otherwise:
run dnf install -y glx-utils
run dnf install -y xterm

env DISPLAY=:0
env LIBGL_ALWAYS_SOFTWARE=1 
env GALLIUM_DRIVER=virpipe
run ln -s /virgl-socket/.virgl_test /tmp/

expose 8080
cmd xpra start :0 --daemon=no --bind-ws=0.0.0.0:8080 --start=xterm

run dnf install -y extremetuxracer
run echo set fullscreen false | install -D /dev/stdin ~/.etr/options
