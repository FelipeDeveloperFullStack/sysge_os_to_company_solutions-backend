@echo off
echo Executando o comando "git pull origin master"...
call git pull origin master
echo Comando "git pull origin master" finalizado.
echo Executando o comando "yarn" novamente...
call yarn
echo Comando "yarn" finalizado novamente.
echo Executando o comando "yarn build"...
call yarn build
call pm2 delete backend
echo Executando o comando "pm2"...
call pm2 start dist/main.js --name backend
call pm2 save
echo Projeto backend atualizado e executado com sucesso.

