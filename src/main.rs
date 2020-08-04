use nix::sys::socket::{recvmsg, sendmsg, ControlMessage, ControlMessageOwned, MsgFlags, SockAddr};
use nix::{
    cmsg_space,
    mount::{mount, MsFlags},
    unistd::fchdir,
};
use std::error::Error;
use std::fs::{remove_file, File};
use std::os::unix::{
    io::{AsRawFd, RawFd},
    net::UnixDatagram,
};
use std::{thread::sleep, time::Duration};
use structopt::StructOpt;

#[derive(Debug, StructOpt)]
enum Opt {
    Send { socket: String, path: String },
    Receive { socket: String },
}

fn main() -> Result<(), Box<dyn Error>> {
    let opt: Opt = Opt::from_args();
    match opt {
        Opt::Send { socket, path } => send(&socket, &path),
        Opt::Receive { socket } => receive(&socket),
    }
}

fn send(socket: &str, path: &str) -> Result<(), Box<dyn Error>> {
    let sock = UnixDatagram::unbound()?;
    let fd = File::open(path)?;

    sendmsg(
        sock.as_raw_fd(),
        &[],
        &[ControlMessage::ScmRights(&[fd.as_raw_fd()])],
        MsgFlags::empty(),
        Some(&SockAddr::new_unix(socket)?),
    )?;
    Ok(())
}

fn receive(path: &str) -> Result<(), Box<dyn Error>> {
    let _ = remove_file(path);
    let sock = UnixDatagram::bind(path)?;

    let mut cmsgspace = cmsg_space!([RawFd; 1]);
    let res = recvmsg(
        sock.as_raw_fd(),
        &[],
        Some(&mut cmsgspace),
        MsgFlags::empty(),
    )?;
    drop(sock);

    let fd = match res.cmsgs().next().ok_or("")? {
        ControlMessageOwned::ScmRights(vec) => *vec.first().ok_or("")?,
        _ => Err("")?,
    };

    fchdir(fd)?;

    // TODO: FIXME
    sleep(Duration::from_secs(1000));
    mount(
        Some("/proc/self/cwd"),
        "mnt",
        None::<&str>,
        MsFlags::MS_BIND,
        None::<&str>,
    )?;
    Ok(())
}
