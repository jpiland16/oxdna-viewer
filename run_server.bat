@echo OFF
start msedge "http://localhost:3000/?autoload=true"
start wt cmd /k http-server & REM this serves the majority of our stuff on :8080
node server                   REM this acts as a proxy for when we need files, socket, etc. on :3000