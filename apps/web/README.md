```json
app/
├─ layout.tsx               # 全局 <html><body>
├─ head.tsx                 # <head> 元信息
├─ loading.tsx              # 全局骨架屏
├─ error.tsx                # 全局错误
├─ not-found.tsx            # 全局 404
│
├─ page.tsx                 # HomePage
├─ login/
│   └─ page.tsx             # LoginPage
├─ register/
│   └─ page.tsx             # RegisterPage
├─ queue/
│   ├─ layout.tsx?          # （可选）Queue 局部布局
│   └─ page.tsx             # QueuePage
│
└─ rooms/
   ├─ layout.tsx?           # （可选）Room 共用布局
   └─ [game_id]/
      ├─ layout.tsx?        # （可选）GameID 级布局
      └─ [role]/
         ├─ page.tsx        # RoomPage
         ├─ loading.tsx     # 房间内加载态
         ├─ error.tsx       # 房间内错误
         └─ not-found.tsx   # 房间内 404
```

