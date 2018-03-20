#!/bin/bash

PROVIDER="$(cat /provider || true)"

sudo apt-get update -y
sudo apt-get upgrade -y

# docker installation
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install -y docker-ce
if ! test "$PROVIDER" = "bwcloud"; then
  sudo bash -c 'echo "{\"storage-driver\": \"aufs\"}" > /etc/docker/daemon.json'
fi
sudo systemctl restart docker.service


# docker compose
sudo curl -o /usr/local/bin/docker-compose -L "https://github.com/docker/compose/releases/download/1.15.0/docker-compose-$(uname -s)-$(uname -m)"
sudo chmod +x /usr/local/bin/docker-compose

#base & config
mkdir /eaas && cd /eaas

echo "version: '2'
services:
  eaas:
    image: eaas/eaas-emucomp
    container_name: eaas
    privileged: true
    ports:
      - 80:80
    volumes:
      - ./log:/eaas/log" > docker-compose.yaml
 

# systemd eaas service 
sudo bash -c 'echo "[Unit]
Description=EmuComp Service
After=docker.service
Requires=docker.service

[Service]
WorkingDirectory=/eaas
Restart=always
ExecStartPre=-/usr/local/bin/docker-compose pull
ExecStart=/usr/local/bin/docker-compose up
ExecStartPost=-/usr/bin/docker system prune -f
ExecStop=/usr/local/bin/docker-compose down
#RuntimeMaxSec=24h
TimeoutSec=600


[Install]
WantedBy=default.target" > /etc/systemd/system/eaas.service'

sudo systemctl enable eaas
echo "starting systemd eaas service (pulling images, deploying emucomp container), it may take some time..."
sudo systemctl start eaas


sudo bash -c 'echo "[Unit]
Description=Eaas kvm permissions

[Service]
Type=oneshot
ExecStart=/bin/chmod 777 /dev/kvm

[Install]
WantedBy=default.target" > /etc/systemd/system/eaas-kvm-permissions.service '

sudo systemctl enable eaas-kvm-permissions
echo "starting systemd eaas-kvm-permissions service"
sudo systemctl start eaas-kvm-permissions
