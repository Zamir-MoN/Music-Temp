# Complete VPS Setup Guide for Music App

This guide walks you through setting up your Ubuntu VPS from scratch, downloading your code, and getting your Python application running continuously using PM2 on port `5585`.

## 1. Connect to your VPS
Open your terminal (or Command Prompt) on your computer and connect to your server using SSH:
```bash
ssh ubuntu@YOUR_VPS_IP
```
*(If you are using a different provider, the user might be `root` or `ec2-user` instead of `ubuntu`)*

---

## 2. Install System Requirements
Your app needs Python, `ffmpeg` (for processing audio), Node.js (for PM2), and `tor` (to bypass YouTube IP blocks). Run these commands to install everything:

```bash
# Update the package lists
sudo apt update && sudo apt upgrade -y

# Install Python, pip, virtual environment tools, ffmpeg, and tor
sudo apt install -y python3 python3-pip python3-venv ffmpeg git curl tor

# Start and enable Tor service for the anonymous proxy
sudo systemctl start tor
sudo systemctl enable tor

# Install Node.js (required for PM2)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally so it can manage your background processes
sudo npm install -g pm2
```

---

## 3. Clone Your Repository
Download your code from your GitHub repository onto the VPS:

```bash
# Clone the repository
git clone https://github.com/Zamir-MoN/Music-Temp.git

# Move into the project directory
cd Music-Temp
```

---

## 4. Set Up the Python Environment
It is highly recommended to run Python apps inside a virtual environment to prevent package conflicts.

```bash
# Create a virtual environment named "venv"
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate

# Install your app's dependencies
pip install -r requirements.txt
```

---

## 5. Start the Application
Now that everything is installed, you can start the application using PM2.

```bash
# Start the server with PM2 (make sure you are inside the Music-Temp folder)
pm2 start server.py --name "music-app" --interpreter ./venv/bin/python
```

> [!SUCCESS]
> Your app is now running in the background! You can access it in your browser at `http://YOUR_VPS_IP:5585`

---

## 6. Make PM2 Start on Reboot
To ensure your app automatically starts back up if your VPS ever restarts or crashes:

```bash
# Save the current list of PM2 processes
pm2 save

# Generate a startup script
pm2 startup
```
> [!IMPORTANT]
> The `pm2 startup` command will print out a final command at the very bottom of the terminal output (it usually starts with `sudo env PATH...`). **You must copy and paste that command into your terminal and run it** to finish the startup setup!

---

## 7. How to Update Your App in the Future
Whenever you make changes to your code locally and push them to GitHub, follow these exact steps on your VPS to apply the updates:

```bash
# Go to your project folder
cd ~/Music-Temp

# Pull the latest changes from GitHub
git pull origin main

# Restart the application
pm2 restart music-app
```

---

## Useful PM2 Commands Cheatsheet
Here are a few commands that will be helpful while managing your server:

- `pm2 logs music-app` — View the live terminal output and check for errors.
- `pm2 status` — View all running apps, their uptime, and memory usage.
- `pm2 stop music-app` — Temporarily stop the server.
- `pm2 restart music-app` — Restart the server.
