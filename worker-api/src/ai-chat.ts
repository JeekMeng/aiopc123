import { Context } from 'hono';

export async function aiChat(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    const { message, conversation_history, deep_thinking } = body;

    if (!message || typeof message !== 'string') {
      return c.json({ error: '消息不能为空' }, 400);
    }

    // Mock AI response for now
    const response = generateMockResponse(message, deep_thinking);

    return c.json({
      success: true,
      response,
      deep_thinking: deep_thinking || false
    });
  } catch (err) {
    console.error('aiChat error:', err);
    return c.json({ error: '服务器错误' }, 500);
  }
}

export async function aiChatStream(c: Context): Promise<Response> {
  try {
    const body = await c.req.json();
    const { message, deep_thinking } = body;

    if (!message || typeof message !== 'string') {
      return c.json({ error: '消息不能为空' }, 400);
    }

    const response = generateMockResponse(message, deep_thinking);

    // Create a ReadableStream for SSE
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const tokens = response.split('');

        let i = 0;
        const interval = setInterval(() => {
          if (i < tokens.length) {
            const chunk = `data: ${JSON.stringify({ token: tokens[i], finished: false })}\n\n`;
            controller.enqueue(encoder.encode(chunk));
            i++;
          } else {
            const done = `data: ${JSON.stringify({ token: '', finished: true })}\n\n`;
            controller.enqueue(encoder.encode(done));
            controller.close();
            clearInterval(interval);
          }
        }, 30);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (err) {
    console.error('aiChatStream error:', err);
    return c.json({ error: '服务器错误' }, 500);
  }
}

function generateMockResponse(message: string, deepThinking?: boolean): string {
  const lowerMsg = message.toLowerCase();

  // OPC 相关问题
  if (lowerMsg.includes('一人公司') || lowerMsg.includes('opc') || lowerMsg.includes('创业')) {
    return deepThinking
      ? '深度思考模式下，我来为你分析一人公司的关键要素：\n\n1. **市场定位**：选择一个细分领域，专注于解决特定问题\n2. **工具选择**：利用 AI 工具提升效率，如自动化、内容生成、数据分析\n3. **成本控制**：选择合适的云服务和工具组合，控制初始投入\n4. **时间管理**：制定清晰的工作流程，优先处理高价值任务\n\n你有什么具体的创业方向想讨论吗？'
      : 'AI 一人公司是一个很好的创业模式！你可以从选择一个细分领域开始，利用 AI 工具提升效率。需要我帮你分析具体的创业方向吗？';
  }

  // 工具相关问题
  if (lowerMsg.includes('工具') || lowerMsg.includes('软件') || lowerMsg.includes('推荐')) {
    return deepThinking
      ? '让我为你推荐一些适合一人公司的 AI 工具：\n\n**内容创作**\n- 文案生成：Claude、GPT-4\n- 图片生成：Midjourney、DALL-E\n- 视频制作：Runway、Pika\n\n**效率工具**\n- 项目管理：Notion、Linear\n- 客服机器人：Botpress\n- 数据分析：ChatGPT Code Interpreter\n\n**运营工具**\n- 邮件营销：ConvertKit\n- 社交媒体：Buffer、Hootsuite\n- SEO 优化：Ahrefs、SEMrush\n\n你想深入了解哪个类别的工具？'
      : '我可以推荐多种 AI 工具，包括内容创作、效率工具和运营工具。你最需要哪方面的工具？';
  }

  // 政策相关问题
  if (lowerMsg.includes('政策') || lowerMsg.includes('补贴') || lowerMsg.includes('扶持')) {
    return deepThinking
      ? '让我为你分析可申请的政策补贴：\n\n**国家级**\n- 高新技术企业认定（企业所得税 15%）\n- 科技型中小企业创新基金\n\n**地方级**\n- 北京：高精尖产业发展资金\n- 深圳：人工智能创业生态引领地行动计划\n- 广州：众创杯创业大赛\n\n**申请建议**\n1. 关注本地科技局、工信局官网\n2. 准备好公司资质和技术文档\n3. 提前了解申报时间节点\n\n你在哪个城市？我可以帮你查询更具体的政策。'
      : '各地都有针对 AI 企业的扶持政策，包括税收优惠、资金补贴等。你在哪个城市？我可以帮你查询相关政策。';
  }

  // 问候
  if (lowerMsg.includes('你好') || lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg === 'hi') {
    return '你好！我是 AI 智能助手，可以帮你：\n\n• 分析创业方向和市场机会\n• 推荐适合的 AI 工具\n• 查询政策补贴信息\n• 解答运营问题\n\n有什么我可以帮你的吗？';
  }

  // 感谢
  if (lowerMsg.includes('谢谢') || lowerMsg.includes('感谢') || lowerMsg.includes('thanks')) {
    return '不客气！如果还有其他问题，随时问我。祝你的 AI 一人公司创业顺利！🚀';
  }

  // 默认回复
  return deepThinking
    ? `我理解你的问题："${message}"\n\n让我从多个角度来分析：\n\n1. **当前情况**：这个问题涉及到 AI 一人公司的运营\n2. **建议方案**：建议你从市场调研、工具选择、成本控制三个维度来考虑\n3. **下一步行动**：可以先确定具体需求，然后制定行动计划\n\n你想深入了解哪个方面？`
    : `我收到你的问题了。作为 AI 助手，我可以帮你分析创业方向、推荐工具、查询政策等。你能详细描述一下你的需求吗？`;
}