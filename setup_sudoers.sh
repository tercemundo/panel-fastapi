#!/bin/bash
# Setup passwordless sudo for admin-panel backend operations
echo "devops ALL=(ALL) NOPASSWD: /usr/sbin/useradd, /usr/sbin/usermod, /usr/sbin/userdel, /usr/bin/chpasswd, /usr/bin/apt, /usr/bin/apt-get, /bin/chmod, /bin/bash, /usr/bin/reboot, /sbin/reboot" | sudo tee /etc/sudoers.d/admin-panel-backend > /dev/null
sudo chmod 0440 /etc/sudoers.d/admin-panel-backend
echo "Sudoers rule applied."
