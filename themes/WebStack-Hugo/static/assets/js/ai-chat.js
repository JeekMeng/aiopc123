// AI聊天助手功能
class AIChatAssistant {
    constructor() {
        this.isOpen = false;
        this.conversationHistory = [];
        this.currentConversationId = this.generateConversationId();
        this.isDeepThinking = false;
        this.isStreaming = false;
        this.currentStream = null;
        
        this.init();
    }

    // 生成对话ID
    generateConversationId() {
        return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 初始化
    init() {
        this.createChatInterface();
        this.bindEvents();
        this.loadConversationHistory();
    }

    // 创建聊天界面
    createChatInterface() {
        // 创建浮动按钮
        const button = document.createElement('button');
        button.className = 'ai-assistant-button';
        button.innerHTML = '🤖';
        button.title = 'AI助手';
        button.id = 'aiAssistantButton';
        document.body.appendChild(button);

        // 创建聊天对话框
        const chatContainer = document.createElement('div');
        chatContainer.className = 'ai-chat-container';
        chatContainer.id = 'aiChatContainer';
        chatContainer.innerHTML = `
            <div class="ai-chat-header">
                <div class="ai-chat-title">
                    <span>🤖 AI面试助手</span>
                </div>
                <div class="ai-chat-actions">
                    <button class="ai-chat-mode-toggle ${this.isDeepThinking ? 'active' : ''}" 
                            title="深度思考模式">
                        🧠
                    </button>
                    <button class="ai-chat-close" title="关闭">×</button>
                </div>
            </div>
            <div class="ai-chat-messages" id="aiChatMessages">
                <div class="ai-chat-empty">
                    <div class="ai-chat-empty-icon">💬</div>
                    <div class="ai-chat-empty-title">AI面试助手</div>
                    <div class="ai-chat-empty-desc">
                        我是您的面试题库助手，可以帮您解答面试问题、提供学习建议和职业规划指导。
                    </div>
                </div>
            </div>
            <div class="ai-chat-input-area">
                <div class="ai-chat-input-container">
                    <textarea class="ai-chat-input" id="aiChatInput" 
                              placeholder="输入您的问题..." rows="1"></textarea>
                    <button class="ai-chat-send" id="aiChatSend" disabled>
                        ➤
                    </button>
                </div>
                <div class="ai-chat-input-bottom">
                    <div class="ai-chat-actions-bottom">
                        <button class="ai-chat-clear" id="aiChatClear">清空对话</button>
                        <button class="ai-chat-analyze" id="aiChatAnalyze">分析题目</button>
                    </div>
                    <div class="ai-chat-status" id="aiChatStatus"></div>
                </div>
            </div>
        `;
        document.body.appendChild(chatContainer);

        // 更新状态
        this.updateStatus();
    }

    // 绑定事件
    bindEvents() {
        // 浮动按钮点击事件
        document.getElementById('aiAssistantButton').addEventListener('click', () => {
            this.toggleChat();
        });

        // 关闭按钮事件
        document.querySelector('.ai-chat-close').addEventListener('click', () => {
            this.closeChat();
        });

        // 发送按钮事件
        document.getElementById('aiChatSend').addEventListener('click', () => {
            this.sendMessage();
        });

        // 输入框事件
        const input = document.getElementById('aiChatInput');
        input.addEventListener('input', () => {
            this.adjustInputHeight();
            this.updateSendButton();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // 清空对话事件
        document.getElementById('aiChatClear').addEventListener('click', () => {
            this.clearConversation();
        });

        // 分析题目事件
        document.getElementById('aiChatAnalyze').addEventListener('click', () => {
            this.analyzeCurrentQuestion();
        });

        // 深度思考模式切换
        document.querySelector('.ai-chat-mode-toggle').addEventListener('click', () => {
            this.toggleDeepThinking();
        });

        // 点击外部关闭
        document.addEventListener('click', (e) => {
            const chatContainer = document.getElementById('aiChatContainer');
            const assistantButton = document.getElementById('aiAssistantButton');
            
            if (this.isOpen && 
                !chatContainer.contains(e.target) && 
                !assistantButton.contains(e.target)) {
                this.closeChat();
            }
        });
    }

    // 切换聊天窗口
    toggleChat() {
        const container = document.getElementById('aiChatContainer');
        this.isOpen = !this.isOpen;
        
        if (this.isOpen) {
            container.classList.add('open');
            document.getElementById('aiChatInput').focus();
        } else {
            container.classList.remove('open');
        }
    }

    // 关闭聊天
    closeChat() {
        this.isOpen = false;
        document.getElementById('aiChatContainer').classList.remove('open');
    }

    // 调整输入框高度
    adjustInputHeight() {
        const input = document.getElementById('aiChatInput');
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    }

    // 更新发送按钮状态
    updateSendButton() {
        const input = document.getElementById('aiChatInput');
        const sendButton = document.getElementById('aiChatSend');
        sendButton.disabled = !input.value.trim() || this.isStreaming;
    }

    // 更新状态显示
    updateStatus() {
        const statusElement = document.getElementById('aiChatStatus');
        if (this.isStreaming) {
            statusElement.textContent = 'AI正在思考中...';
        } else if (this.isDeepThinking) {
            statusElement.textContent = '深度思考模式已开启';
        } else {
            statusElement.textContent = '';
        }
    }

    // 切换深度思考模式
    toggleDeepThinking() {
        this.isDeepThinking = !this.isDeepThinking;
        const toggleButton = document.querySelector('.ai-chat-mode-toggle');
        
        if (this.isDeepThinking) {
            toggleButton.classList.add('active');
            toggleButton.title = '深度思考模式已开启';
        } else {
            toggleButton.classList.remove('active');
            toggleButton.title = '深度思考模式';
        }
        
        this.updateStatus();
    }

    // 发送消息
    async sendMessage() {
        const input = document.getElementById('aiChatInput');
        const message = input.value.trim();
        
        if (!message || this.isStreaming) return;

        // 添加用户消息
        this.addMessage('user', message);
        
        // 清空输入框
        input.value = '';
        this.adjustInputHeight();
        this.updateSendButton();

        // 显示加载状态
        this.showLoading();

        try {
            if (this.isDeepThinking) {
                // 使用流式响应
                await this.sendStreamMessage(message);
            } else {
                // 使用普通响应
                await this.sendNormalMessage(message);
            }
        } catch (error) {
            console.error('发送消息失败:', error);
            this.addMessage('assistant', '抱歉，发生了错误，请稍后重试。');
        } finally {
            this.hideLoading();
            this.updateSendButton();
        }
    }

    // 发送普通消息
    async sendNormalMessage(message) {
        const response = await api.aiChat({
            message: message,
            conversation_history: this.conversationHistory,
            conversation_id: this.currentConversationId,
            deep_thinking: this.isDeepThinking
        });

        if (response.success) {
            this.addMessage('assistant', response.response);
            // 更新对话历史
            this.conversationHistory.push(
                { role: 'user', content: message },
                { role: 'assistant', content: response.response }
            );
        } else {
            throw new Error(response.error);
        }
    }

    // 发送流式消息
    async sendStreamMessage(message) {
        this.isStreaming = true;
        this.updateStatus();

        // 添加空的助手消息用于流式更新
        const messageId = this.addMessage('assistant', '', true);

        try {
            await api.aiChatStream({
                message: message,
                conversation_history: this.conversationHistory,
                conversation_id: this.currentConversationId,
                deep_thinking: this.isDeepThinking
            }, (token, finished, error) => {
                if (error) {
                    throw new Error(error);
                }

                this.updateStreamMessage(messageId, token);

                if (finished) {
                    this.isStreaming = false;
                    this.updateStatus();
                    
                    // 更新对话历史
                    const fullMessage = this.getMessageContent(messageId);
                    this.conversationHistory.push(
                        { role: 'user', content: message },
                        { role: 'assistant', content: fullMessage }
                    );
                }
            });
        } catch (error) {
            this.isStreaming = false;
            this.updateStatus();
            this.updateStreamMessage(messageId, '抱歉，发生了错误，请稍后重试。', true);
            throw error;
        }
    }

    // 添加消息到聊天界面
    addMessage(role, content, isStreaming = false) {
        const messagesContainer = document.getElementById('aiChatMessages');
        
        // 移除空状态
        const emptyState = messagesContainer.querySelector('.ai-chat-empty');
        if (emptyState) {
            emptyState.remove();
        }

        const messageId = 'msg_' + Date.now();
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${role} ${isStreaming ? 'streaming' : ''}`;
        messageElement.id = messageId;
        messageElement.innerHTML = this.formatMessageContent(content);
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        return messageId;
    }

    // 更新流式消息
    updateStreamMessage(messageId, content, finished = false) {
        const messageElement = document.getElementById(messageId);
        if (!messageElement) return;

        if (finished) {
            messageElement.classList.remove('streaming');
        }

        const currentContent = this.getMessageContent(messageId);
        const newContent = currentContent + content;
        messageElement.innerHTML = this.formatMessageContent(newContent);

        // 自动滚动到底部
        const messagesContainer = document.getElementById('aiChatMessages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // 获取消息内容
    getMessageContent(messageId) {
        const messageElement = document.getElementById(messageId);
        if (!messageElement) return '';
        
        // 移除HTML标签获取纯文本内容
        return messageElement.textContent || messageElement.innerText || '';
    }

    // 格式化消息内容
    formatMessageContent(content) {
        // 简单的Markdown格式化
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    // 显示加载状态
    showLoading() {
        const messagesContainer = document.getElementById('aiChatMessages');
        const loadingElement = document.createElement('div');
        loadingElement.className = 'ai-chat-loading';
        loadingElement.id = 'aiChatLoading';
        loadingElement.innerHTML = `
            <span>AI正在思考</span>
            <div class="loading-dots">
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
                <div class="loading-dot"></div>
            </div>
        `;
        messagesContainer.appendChild(loadingElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // 隐藏加载状态
    hideLoading() {
        const loadingElement = document.getElementById('aiChatLoading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    // 清空对话
    clearConversation() {
        this.conversationHistory = [];
        this.currentConversationId = this.generateConversationId();
        
        const messagesContainer = document.getElementById('aiChatMessages');
        messagesContainer.innerHTML = `
            <div class="ai-chat-empty">
                <div class="ai-chat-empty-icon">💬</div>
                <div class="ai-chat-empty-title">对话已清空</div>
                <div class="ai-chat-empty-desc">
                    开始新的对话吧！
                </div>
            </div>
        `;
    }

    // 分析当前题目
    analyzeCurrentQuestion() {
        // 获取当前页面的题目信息
        let questionText = '';
        
        // 尝试从不同页面获取题目信息
        if (window.location.pathname.includes('question-detail')) {
            // 题目详情页
            const titleElement = document.querySelector('.question-title');
            const descriptionElement = document.querySelector('.question-description');
            if (titleElement) {
                questionText = titleElement.textContent;
                if (descriptionElement) {
                    questionText += '\n' + descriptionElement.textContent;
                }
            }
        } else if (window.location.pathname.includes('index')) {
            // 首页 - 获取选中的题目
            const selectedRow = document.querySelector('.data-table tbody tr.selected');
            if (selectedRow) {
                const cells = selectedRow.querySelectorAll('td');
                if (cells.length > 0) {
                    questionText = cells[0].textContent;
                }
            }
        }

        if (!questionText.trim()) {
            this.addMessage('system', '请先选择或打开一个题目进行分析。');
            return;
        }

        // 设置输入框内容并发送
        const input = document.getElementById('aiChatInput');
        input.value = `请分析这个面试题目：${questionText}`;
        this.adjustInputHeight();
        this.updateSendButton();
        this.sendMessage();
    }

    // 加载对话历史（从本地存储）
    loadConversationHistory() {
        try {
            const saved = localStorage.getItem('aiChatHistory');
            if (saved) {
                this.conversationHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('加载对话历史失败:', error);
        }
    }

    // 保存对话历史（到本地存储）
    saveConversationHistory() {
        try {
            localStorage.setItem('aiChatHistory', JSON.stringify(this.conversationHistory));
        } catch (error) {
            console.error('保存对话历史失败:', error);
        }
    }
}

// 初始化AI聊天助手
let aiChatAssistant = null;

document.addEventListener('DOMContentLoaded', function() {
    // 等待API加载完成
    if (typeof api !== 'undefined') {
        aiChatAssistant = new AIChatAssistant();
    } else {
        // 如果API未加载，延迟初始化
        setTimeout(() => {
            if (typeof api !== 'undefined') {
                aiChatAssistant = new AIChatAssistant();
            }
        }, 1000);
    }
});
