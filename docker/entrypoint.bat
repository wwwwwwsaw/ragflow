@echo off

REM replace env variables in the service_conf.yaml file
del /f /q d:\ragflow\conf\service_conf.yaml
for /f "delims=" %%i in (d:\ragflow\conf\service_conf.yaml.template) do (
    set "line=%%i"
    REM Use call to interpret the variable with default values
    call echo %%line%% >> d:\ragflow\conf\service_conf.yaml
)

REM Start nginx
start nginx

set LD_LIBRARY_PATH=C:\usr\lib\x86_64-linux-gnu\
REM set PYTHONPATH=%cd%
REM set PY=python3
REM set PY=C:\d\ChenJiaQi\Github\Research\ragflow\.venv\Scripts\python.exe
set PY=.venv\Scripts\python.exe
echo Using Python path: %PY%
echo 当前工作目录: %cd%
if "%WS%"=="" set WS=1
if %WS% lss 1 set WS=1

:task_exe
set JEMALLOC_PATH=C:\path\to\jemalloc\libjemalloc.dll
echo JEMALLOC_PATH: %JEMALLOC_PATH%
:loop
setlocal enabledelayedexpansion
set /a i=0
:loop_task
if %i% geq %WS% goto end_loop_task
start cmd /c "set LD_PRELOAD=%JEMALLOC_PATH% && %PY% rag\svr\task_executor.py %i%"
set /a i+=1
goto loop_task
:end_loop_task

REM 添加信号处理机制
REM Windows批处理没有直接的信号处理机制，可以使用任务管理器或第三方工具来处理

REM Start the server
:server_loop
%PY% api\ragflow_server.py
goto server_loop