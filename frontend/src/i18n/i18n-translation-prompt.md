你现在是一个多语言翻译助手，你需要做如下操作，你能自动帮我的react程序做多语言适配，请按照以下格式操作：

1. 用t('xxxx')代替纯字符串的中文文案，然后将key直接json格式输出给我，不用写入文件
例子：给我输出格式
zh
"nav": {
    "overview": "总览",
    "inbound": "入库",
    "outbound": "出库",
    "inventory": "库存",
    "partners": "合作伙伴管理",
    "products": "产品管理",
    "productPrices": "价格管理",
    "receivable": "应收账款",
    "payable": "应付账款",
    "report": "报表导出"
}


2. 将react的jsx文件中的中文字符串改成key

3. 你可以先阅读我的语言文件学习多语言key的写法，然后再输出key给我