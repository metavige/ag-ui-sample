# AG-UI 測試客戶端

這是一個簡單的測試客戶端，用於展示如何使用 `@ag-ui/client` 套件與 OpenAI API 進行整合，實現對大型語言模型的串流回應處理。

## 專案說明

此專案展示了如何：

1. 建立自定義 OpenAI Agent 來與 OpenAI API 進行通信
2. 處理從 LLM 返回的串流回應
3. 使用 RxJS Observable 來優雅地處理異步事件流
4. 支援兩種 API 後端：
   - OpenAI API (預設)
   - Ollama (本地部署的開源 LLM 服務)

## 功能特色

- 支援串流回應，即時獲取 LLM 生成的內容
- 事件驅動架構，使用 `@ag-ui/client` 定義的事件類型
- 環境變數配置，方便切換不同的 API 服務
- 靈活的消息處理系統

## 前置需求

- Node.js (建議 v18 或更高版本)
- npm 或 yarn
- OpenAI API 金鑰或本地運行的 Ollama 服務

## 安裝

1. 克隆此存儲庫：

```bash
git clone <repository-url>
cd ag-ui-test1
```

2. 安裝依賴：

```bash
npm install
```

3. 創建 `.env` 文件並設置 API 金鑰：

```
# 使用 OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# 或使用 Ollama (本地 LLM)
# OPENAI_API_KEY=ollama
```

## 使用方法

### 啟動應用

```bash
npm run start
```

或使用開發模式：

```bash
npm run dev
```

### 修改提示訊息

編輯 `src/index.ts` 文件中的 `openAIAgent.messages` 陣列來修改發送給模型的提示訊息：

```typescript
openAIAgent.messages = [
  {
    id: '1',
    role: 'user',
    content: '您的提示訊息在這裡',
  },
];
```

### 處理回應

默認情況下，應用程式會將完整的回應累積並在串流完成後顯示。您可以在 `index.ts` 的 `subscribe` 區塊中修改事件處理邏輯：

```typescript
run.subscribe({
  next: (event: BaseEvent) => {
    // 自定義事件處理邏輯
  },
  error: (err: Error) => {
    // 錯誤處理
  },
  complete: () => {
    // 完成後的處理
  },
});
```

## 切換至 Ollama (本地 LLM)

如果您想使用 Ollama 而不是 OpenAI API：

1. 安裝並啟動 Ollama (參見 [Ollama 官方網站](https://ollama.ai/))
2. 拉取所需的模型，例如：`ollama pull llama3:8b`
3. 在 `.env` 文件中設置 `OPENAI_API_KEY=ollama`

## 項目結構

- `src/index.ts` - 主程式入口點
- `src/custom-openai-agent.ts` - 自定義 OpenAI Agent 實現
- `src/openai-agent.ts` - OpenAI Agent 基礎類別 (如果有的話)

## 腳本說明

- `npm run build` - 使用 TypeScript 編譯專案
- `npm run start` - 啟動已編譯的專案
- `npm run dev` - 使用 ts-node 直接運行 TypeScript 源碼

## 依賴套件

- `@ag-ui/client` - Agent UI 客戶端庫
- `openai` - OpenAI API 客戶端庫
- `rxjs` - 用於響應式編程的庫
- `dotenv` - 環境變數管理

## 授權

ISC

## 故障排除

### API 連接問題

- 確保 `.env` 文件中的 API 金鑰格式正確
- 如果使用 Ollama，確認 Ollama 服務正在運行 (`http://localhost:11434`)
- 檢查網絡連接和防火牆設置

### 串流回應未顯示

- 確認您已正確訂閱 Observable
- 檢查 `next` 處理函數是否正確處理了 `TextMessageContentEvent` 事件

## 更多資源

- [@ag-ui/client 文檔](https://github.com/your-org/ag-ui-client)
- [OpenAI API 文檔](https://platform.openai.com/docs/api-reference)
- [Ollama 文檔](https://ollama.ai/docs)
