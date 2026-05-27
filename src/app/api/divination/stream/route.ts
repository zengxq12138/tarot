import { NextRequest } from "next/server";
import tarotCards from "@/data/tarot-cards.json";

interface DrawnCard {
  card_id: number;
  position: "past" | "present" | "future";
  is_reversed: boolean;
}

export async function POST(request: NextRequest) {
  const { question, cards } = (await request.json()) as {
    question: string;
    cards: DrawnCard[];
  };

  const cardDetails = cards.map((dc) => {
    const card = (tarotCards as any[]).find((c) => c.id === dc.card_id);
    const name = card?.name_zh ?? `Card ${dc.card_id}`;
    const nameEn = card?.name_en ?? `Card ${dc.card_id}`;
    const keywords = dc.is_reversed
      ? (card?.keywords_reversed_zh ?? []).join("、")
      : (card?.keywords_upright_zh ?? []).join("、");
    const meaning = card?.meaning_zh ?? "";
    const positionLabel =
      dc.position === "past" ? "过去" : dc.position === "present" ? "现在" : "未来";

    return {
      position: positionLabel,
      name,
      nameEn,
      isReversed: dc.is_reversed,
      direction: dc.is_reversed ? "逆位" : "正位",
      keywords,
      meaning,
    };
  });

  const prompt = `你是一位经验丰富的塔罗占卜师，拥有深厚的塔罗智慧和敏锐的直觉。请为以下塔罗占卜提供专业、温暖且富有洞察力的解读。

**用户的问题：**
${question}

**抽到的牌阵（经典三张牌阵 - 过去/现在/未来）：**
${cardDetails
  .map(
    (c) => `
### ${c.position}：${c.name}（${c.nameEn}）- ${c.direction}
- 关键词：${c.keywords}
- 基础含义：${c.meaning}`
  )
  .join("\n")}

**请按以下结构进行解读，使用丰富的 Markdown 格式增强可读性和视觉美感：**

## 🔮 牌面含义分析
简要描述每张牌在对应位置（过去/现在/未来）的核心含义，以及正逆位对解读的影响。使用 **粗体** 突出关键牌名和重要概念。

## 🌟 位置解析
深入分析三张牌如何串联成一个完整的故事——过去的根源如何影响现在，现在的状态如何导向未来。可使用 > 引用块来突出关键洞见。

## 💫 对当前问题的影响
结合用户的具体问题，解读这个牌阵给出的关键信息和指引方向。自然融入 ✨ 点缀使阅读更有节奏感。

## 🌙 综合建议
给出温暖、实用且鼓舞人心的建议。使用 --- 分隔线标记段落转折，用适当的强调格式让建议更有力量感。让用户感受到塔罗的智慧不是宿命论，而是帮助看清现状、激发内在力量。

**格式要求：**
- 使用 ## 和 ### 作为标题层级
- 关键概念使用 **粗体**
- 富有洞见的句子使用 > 引用块
- 段落间适当使用 --- 分隔
- 适当使用 *斜体* 表达细腻的情感
- 保持优雅流畅的中文表达，专业性与文学美感并重`;

  const encoder = new TextEncoder();
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    return new Response(
      encoder.encode("data: " + JSON.stringify({ content: "API Key 未配置，请设置 DEEPSEEK_API_KEY 环境变量。" }) + "\n\n"),
      { headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(
          "https://api.deepseek.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                {
                  role: "system",
                  content:
                    "你是一位经验丰富的塔罗占卜师。你的解读专业、温暖、富有洞察力，帮助用户看清现状并找到方向。请用优雅流畅的中文回复。",
                },
                { role: "user", content: prompt },
              ],
              stream: true,
              temperature: 0.8,
              max_tokens: 3000,
            }),
            signal: AbortSignal.timeout(60000),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          controller.enqueue(
            encoder.encode(
              "data: " +
                JSON.stringify({
                  content: `[API 错误: ${response.status}] 请稍后重试。`,
                }) +
                "\n\n"
            )
          );
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6);
            if (data === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(
                  encoder.encode(
                    "data: " + JSON.stringify({ content }) + "\n\n"
                  )
                );
              }
            } catch {
              // Skip unparseable chunks
            }
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error: any) {
        controller.enqueue(
          encoder.encode(
            "data: " +
              JSON.stringify({
                content: `\n\n[请求超时或网络错误，请稍后重试。${error?.message ? ` (${error.message})` : ""}]`,
              }) +
              "\n\n"
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
