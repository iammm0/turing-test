# 1. 基础镜像
FROM python:3.12-slim

# 2. 设置工作目录
WORKDIR /app

# 3. 关闭 Python 缓冲区（方便日志）
ENV PYTHONUNBUFFERED=1

# 4. 复制并安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. 复制整个项目
COPY . .

# 6. 暴露端口
EXPOSE 8000

# 7. 启动命令
CMD ["uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8000"]