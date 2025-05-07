#!/bin/bash

# 动态生成虚拟环境路径（Git Bash/WSL 兼容）
PROJECT_ROOT=$(pwd)
PY="${PROJECT_ROOT}/.venv/Scripts/python.exe"

# 验证路径是否存在
if [ ! -f "$PY" ]; then
  echo "错误：未找到 Python 解释器，请检查虚拟环境！"
  exit 1
fi

echo "使用 Python 路径: $PY"
$PY --version  # 验证 Python 版本
if [[ -z "$WS" || $WS -lt 1 ]]; then
  WS=1
fi
# 运行任务
function task_exe(){
    while true; do
      $PY rag/svr/task_executor.py $1
    done
}

for ((i=0;i<WS;i++))
do
  task_exe  $i &
done

while [ 1 -eq 1 ];do
    $PY api/ragflow_server.py
done
