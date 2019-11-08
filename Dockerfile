from fedora
add https://xpra.org/repos/Fedora/xpra.repo /etc/yum.repos.d/
add https://xpra.org/repos/Fedora/xpra-beta.repo /etc/yum.repos.d/
run dnf install -y xpra
run dnf install -y xterm
cmd xpra start --no-daemon --bind-tcp=0.0.0.0:8080 --html=on --start=xterm
expose 8080
