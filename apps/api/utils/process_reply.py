import re
from typing import List

POPULAR_PHRASES: List[str] = [
    # 原有表情与短语
    "哈哈", "😊", "👍", "真香", "我没想到",
    # 网络缩写与表情包
    "yyds", "nsdd", "srds", "xswl", "u1s1", "bdjw", "2333", "666", "emmm",
    # 时事梗与俚语
    "恐龙扛狼", "晚安玛卡巴卡", "八哩八告", "咩噗", "史密斯",
    "像极了爱", "甘阿捏", "找塞班", "PuiPui", "怕周球",
    # 十大热词
    "数智化", "智能向善", "未来产业", "city不city", "班味",
    "水灵灵地", "松弛感", "银发力量", "小孩哥", "小孩姐",
    # 其他热门梗
    "显眼包", "多巴胺", "科目三", "出圈", "干中学",
    "费", "预制朋友圈", "三折叠手机梗", "Dan式光子嫩肤",
"那很有生活了", "回答我！", "有点离谱", "笑死我了", "爱了爱了"
]


def post_process_reply(reply: str) -> str:
    # 移除动作性描述（（动作））
    reply = re.sub(r'（[^）]*）', '', reply)

    # 保存原本最后一个标点
    last_punct = ''
    if reply and reply[-1] in '。！？':
        last_punct = reply[-1]

    # 按句子分割
    sentences = re.split(r'[。！？]', reply)
    processed_sentences = []

    for sentence in sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        # 流行用语处理
        found_phrases = [phrase for phrase in POPULAR_PHRASES if phrase in sentence]
        if len(found_phrases) > 1:
            first_phrase = found_phrases[0]
            for phrase in found_phrases[1:]:
                sentence = sentence.replace(phrase, "普通")
        processed_sentences.append(sentence)

    # 重新拼接
    processed_reply = '。'.join(processed_sentences)
    if last_punct:
        processed_reply += last_punct
    else:
        processed_reply += '。'  # 默认加句号收尾

    return processed_reply
